/**
 * Outlines named things in a photo (Gemini segmentation masks), so wall picture layers are cut from the photo
 * itself instead of from the 3D guide, which never lines up with the AI photo pixel for pixel.
 * In:  { imageUrl, items: { key, name }[] }
 * Out: { masks: { key, box: [y0, x0, y1, x1] (0–1000), mask: "data:image/png;base64,..." }[] }
 */
import "../_shared/language.ts";
import { requireUser } from "../_shared/auth.ts";
import { fetchWithTimeout } from "../_shared/http.ts";
import { MODELS, useModels } from "../_shared/aiModels.ts";

useModels({ "google/gemini-2.5-flash": MODELS.read });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const caller = await requireUser(req, cors);
  if (caller instanceof Response) return caller;
  try {
    const { imageUrl, items } = await req.json() as { imageUrl?: string; items?: { key: string; name: string }[] };
    if (!imageUrl || !Array.isArray(items) || !items.length || items.length > 24) return json({ error: "imageUrl and 1–24 items are required" }, 400);
    const list = items.map((i) => `- label "${String(i.key).slice(0, 60)}": ${String(i.name).slice(0, 120)}`).join("\n");
    const prompt = `Give the segmentation masks for these things in the photo, one entry each, only if it is visible:\n${list}\n` +
      `Output a JSON list where each entry has the 2D bounding box in "box_2d", the segmentation mask in "mask" and the label in "label" (use exactly the label given above). ` +
      `Outline the whole visible object, including its legs, cushions and what stands on it; never part of the wall or floor around it.`;
    const r = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY") ?? ""}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", temperature: 0.2, messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: imageUrl } }] }] }),
    }, 90_000);
    if (!r.ok) return json({ error: r.status === 402 ? "AI credits are used up." : `Segmentation failed (${r.status})` }, r.status === 402 ? 402 : 502);
    const data = await r.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    const raw = text.replace(/^[\s\S]*?```(?:json)?/, "").replace(/```[\s\S]*$/, "").trim() || text;
    const start = raw.indexOf("["), end = raw.lastIndexOf("]");
    const parsed = JSON.parse(start >= 0 ? raw.slice(start, end + 1) : "[]") as { box_2d?: number[]; mask?: string; label?: string }[];
    const keys = new Set(items.map((i) => i.key));
    const masks = parsed
      .filter((m) => Array.isArray(m.box_2d) && m.box_2d.length === 4 && typeof m.mask === "string" && m.label && keys.has(m.label))
      .map((m) => ({ key: m.label!, box: m.box_2d!.map((v) => Math.max(0, Math.min(1000, Number(v)))), mask: m.mask!.startsWith("data:") ? m.mask! : `data:image/png;base64,${m.mask}` }));
    return json({ masks });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
