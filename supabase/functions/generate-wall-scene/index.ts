import "../_shared/language.ts";
// Step 5 "Your walls": the hyper-realistic picture of one wall and the alternatives for each item on it.
//
// mode "base": a photograph of the wall, drawn from a guide render of the person's own room (the size, order
// and placement of every piece come from their layout) in the style of their step 2 preview.
// mode "variation": the same photograph with only one item replaced — by an alternative in the moodboard's
// palette, or by a real product the person picked from their own shop (its photo is passed as a reference).
// Everything outside that item must stay as it is, so the app can cut the change out as a swappable layer.
import { requireUser } from "../_shared/auth.ts";
import { buildMoodboardDirective } from "../_shared/moodboardContext.ts";
import { fetchWithTimeout, UpstreamTimeoutError } from "../_shared/http.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

type Piece = { name: string; detail: string; box: [number, number, number, number] };
type Body = {
  mode: "base" | "variation";
  /** base: the guide render of the wall. variation: the wall photograph to change. */
  imageUrl: string;
  /** base: the step 2 preview, for style, materials and light. */
  styleImageUrl?: string;
  wall?: string;
  style?: string;
  palette?: { name: string; hex: string; use?: string }[];
  /** base: every piece on the wall, left to right, with where it is in the image (percent x, y, w, h). */
  pieces?: Piece[];
  /** variation: the item to replace, where it is, and what it becomes. */
  item?: { name: string; current: string; target: string; box: [number, number, number, number] };
  /** variation: a real product photo to copy into the room. */
  productImageUrl?: string;
  /** base: the moodboard's own description, for the shared moodboard brief. */
  moodboardDescription?: string;
};

const HTTPS = /^https:\/\//;
const pct = (b: [number, number, number, number]) => `left ${Math.round(b[0])}%, top ${Math.round(b[1])}%, ${Math.round(b[2])}% wide, ${Math.round(b[3])}% high`;

function basePrompt(b: Body) {
  const palette = (b.palette ?? []).map((p) => `${p.name} ${p.hex}${p.use ? ` (${p.use})` : ""}`).join("; ");
  const pieces = (b.pieces ?? []).map((p, i) => `${i + 1}. ${p.name}: ${p.detail} — at ${pct(p.box)}`).join("\n");
  return `Turn the FIRST image into a photorealistic interior photograph.
The first image is a simple 3D guide of one wall (wall ${b.wall ?? ""}) of the client's own room, seen straight on. It is exact about geometry: keep the camera, the perspective, the wall, floor and ceiling lines, every door and window, and the position, size and order of every piece of furniture exactly where they are in the guide. Do not add, remove, move or resize any piece.
${b.styleImageUrl ? "The SECOND image is the client's chosen design. Copy its style, materials, textures, finishes, light and mood onto the pieces in the guide, as if the same designer furnished this wall." : ""}
Design direction: ${b.style ?? "the client's style"}.
Colours (use these exact colours for what they are used for): ${palette || "neutral, warm"}.
Pieces on this wall, left to right:
${pieces || "none"}
Make it look like a real high-end interior photograph: real materials, soft natural daylight, accurate contact shadows, no people, no text, no watermark, no added objects. Same aspect ratio as the guide.`;
}

function variationPrompt(b: Body) {
  const it = b.item!;
  return `Edit this interior photograph. Change ONLY the ${it.current} (${pct(it.box)} of the image).
Replace it with: ${b.productImageUrl ? `the product shown in the SECOND image — copy its shape, proportions, material and colour faithfully` : it.target}.
Keep its position, footprint, size and perspective the same, so it stands exactly where the old one stood.
Every pixel outside that area must stay exactly as it is: same walls, floor, light, shadows elsewhere, other furniture and camera. Do not crop, zoom, reframe or recolour the rest of the photograph. Keep the photo's lighting on the new piece and give it a natural contact shadow. No text, no watermark. Same size and aspect ratio as the input.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  const caller = await requireUser(req, corsHeaders);
  if (caller instanceof Response) return caller;
  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const b = (await req.json()) as Body;
    if (b.mode !== "base" && b.mode !== "variation") return json({ error: "mode must be base or variation" }, 400);
    if (!b.imageUrl || !(HTTPS.test(b.imageUrl) || b.imageUrl.startsWith("data:image/"))) return json({ error: "imageUrl is required" }, 400);
    if (b.mode === "variation" && (!b.item?.current || !b.item?.target || !Array.isArray(b.item.box))) return json({ error: "item is required" }, 400);
    const refs = [b.mode === "base" ? b.styleImageUrl : b.productImageUrl].filter((u): u is string => !!u && HTTPS.test(u));

    const content = [
      // The base picture is a new generation, so it carries the shared moodboard brief; a variation is a surgical edit.
      { type: "text", text: b.mode === "base" ? buildMoodboardDirective({ detectedColors: (b.palette ?? []).map((p) => p.hex), moodboardDescription: b.moodboardDescription }) + basePrompt(b) : variationPrompt(b) },
      { type: "image_url", image_url: { url: b.imageUrl } },
      ...refs.map((url) => ({ type: "image_url", image_url: { url } })),
    ];
    const started = Date.now();
    let lastStatus = 0;
    for (let attempt = 1; attempt <= 2; attempt++) {
      if (attempt > 1 && Date.now() - started > 60_000) break;
      const res = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: b.mode === "base" ? "google/gemini-3-pro-image" : "google/gemini-3.1-flash-image", messages: [{ role: "user", content }], modalities: ["image", "text"] }),
      }, Math.max(20_000, 135_000 - (Date.now() - started)));
      lastStatus = res.status;
      if (res.status === 429) return json({ error: "Rate limits exceeded, please try again later.", retryable: true }, 429);
      if (res.status === 402) return json({ error: "AI credits are exhausted for this workspace. Add credits, then try again.", retryable: false }, 402);
      if (res.status === 403) return json({ error: "AI access is blocked by a workspace policy or credit limit. An admin needs to unblock it.", retryable: false }, 403);
      if (res.status >= 500) { await new Promise((r) => setTimeout(r, 2500)); continue; }
      if (!res.ok) return json({ error: `The image service answered ${res.status}.` }, 502);
      const data = await res.json();
      const url: string | undefined = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (url?.startsWith("data:image/")) return json({ imageUrl: url });
    }
    return json({ error: lastStatus >= 500 ? "The image service is busy right now. Please wait a minute and try again." : "No picture came back. Try again.", retryable: true }, 503);
  } catch (e) {
    if (e instanceof UpstreamTimeoutError) return json({ error: e.message, retryable: true }, 504);
    console.error("[generate-wall-scene]", e);
    return json({ error: e instanceof Error ? e.message : "The picture could not be made." }, 500);
  }
});
