/**
 * Which AI model does which job, in one place, and a safety net for switching models.
 *
 * Each function says which of its (old) model ids should now go to which model, with `useModels`. Calls to the
 * Lovable AI gateway are then sent to the new model. When the gateway doesn't take a new model (an id it
 * doesn't know, a provider not enabled, a field it doesn't accept), the call is sent again exactly as the
 * function wrote it, to the old model, so nothing stops working while models change. Credit, permission and
 * rate-limit answers (402, 403, 429) are passed straight back: a different model wouldn't help.
 *
 * OpenAI picture models (GPT Image) use the images API, not chat: a chat-style picture request is translated
 * (the text becomes the prompt, the attached images the images to edit) and the answer is translated back into
 * both shapes the functions read (choices[0].message.images[0].image_url.url and data[0].b64_json).
 * A function can add `hm: { mask, size, background, quality }` to its request body for GPT Image: the mask
 * limits an edit to one area. The field is removed before anything is sent.
 *
 * Imported by `language.ts`, so every function that imports that first gets it.
 */

/** The models, by job (the cheaper set chosen in November 2026). */
export const MODELS = {
  /** reading plans, walls, styles, moodboards, items and colours */
  read: "google/gemini-3.8-flash",
  /** simple text: buying lists, shop posts, reading scraped pages */
  text: "google/gemini-3.1-flash-lite",
  /** making layouts; `layoutHard` when a layout fails its checks */
  layout: "google/gemini-3.8-flash",
  layoutHard: "google/gemini-4-argon",
  /** the room preview and the wall photos */
  photo: "openai/gpt-image-2.5-sunburst",
  /** surgical edits: swap alternatives, wall changes */
  edit: "openai/gpt-image-2.5-flare",
  /** product cut-outs on a transparent background */
  cutout: "openai/gpt-image-2.5-flare",
  /** quick drafts: scene previews, highlight pictures, showroom backgrounds */
  draft: "google/gemini-3.1-flash-lite-image",
  /** shop and retailer post pictures */
  poster: "bytedance/seedream-5-pro",
} as const;

const GATEWAY = "https://ai.gateway.lovable.dev";
/** Answers that mean "this model or field isn't taken here": try the old model instead. */
const NOT_TAKEN = new Set([400, 404, 405, 415, 422]);

type Hm = { mask?: string; size?: string; background?: "transparent" | "opaque" | "auto"; quality?: "low" | "medium" | "high" | "auto" };
type Part = { type: string; text?: string; image_url?: { url?: string } };

const g = globalThis as unknown as { __hmModels?: Record<string, string>; __hmModelsInstalled?: boolean };
g.__hmModels ??= {};

/** Send this function's calls for the old model ids on the left to the new models on the right. */
export function useModels(map: Record<string, string>) {
  Object.assign(g.__hmModels!, map);
}

const urlOf = (input: RequestInfo | URL) => (typeof input === "string" ? input : input instanceof URL ? input.href : input.url);

/** The chat-style picture request as an images-API request for a GPT Image model. */
function toImagesRequest(body: Record<string, unknown>, model: string, hm: Hm) {
  const parts: Part[] = [];
  for (const m of (body.messages as { content?: unknown }[] | undefined) ?? []) {
    if (typeof m.content === "string") parts.push({ type: "text", text: m.content });
    else if (Array.isArray(m.content)) parts.push(...(m.content as Part[]));
  }
  const prompt = parts.filter((p) => p.type === "text" && p.text).map((p) => p.text).join("\n\n") || String(body.prompt ?? "");
  const images = parts.filter((p) => p.type === "image_url" && p.image_url?.url).map((p) => ({ image_url: p.image_url!.url! }));
  const out: Record<string, unknown> = {
    model, prompt, n: 1,
    quality: hm.quality ?? "medium",
    size: hm.size ?? "auto",
    output_format: hm.background === "transparent" ? "png" : "jpeg",
  };
  if (hm.background) out.background = hm.background;
  if (images.length) out.images = images;
  if (images.length && hm.mask) out.mask = { image_url: hm.mask };
  return { path: images.length ? "/v1/images/edits" : "/v1/images/generations", body: out };
}

/** An images-API answer in both shapes the functions read. */
async function fromImagesAnswer(res: Response, background?: string): Promise<Response | null> {
  try {
    const data = await res.json();
    const item = data?.data?.[0];
    const url: string | undefined = item?.b64_json ? `data:image/${background === "transparent" ? "png" : "jpeg"};base64,${item.b64_json}` : item?.url;
    if (!url) return null;
    const both = { ...data, choices: [{ message: { role: "assistant", content: "", images: [{ type: "image_url", image_url: { url } }] } }] };
    return new Response(JSON.stringify(both), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch {
    return null;
  }
}

if (!g.__hmModelsInstalled) {
  g.__hmModelsInstalled = true;
  const inner = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = urlOf(input);
    if (!url.startsWith(GATEWAY) || typeof init?.body !== "string") return inner(input, init);
    let body: Record<string, unknown>;
    try { body = JSON.parse(init.body); } catch { return inner(input, init); }
    const hm = (body.hm ?? {}) as Hm;
    delete body.hm;
    const original = { ...init, body: JSON.stringify(body) };
    const from = typeof body.model === "string" ? body.model : "";
    const to = g.__hmModels![from];
    if (!to || to === from) return inner(input, original);

    try {
      if (to.startsWith("openai/") && Array.isArray(body.messages)) {
        const r = toImagesRequest(body, to, hm);
        const res = await inner(`${GATEWAY}${r.path}`, { ...init, body: JSON.stringify(r.body) });
        if (res.status === 402 || res.status === 403 || res.status === 429) return res;
        if (res.ok) {
          const both = await fromImagesAnswer(res, hm.background);
          if (both) return both;
        } else if (r.body.size !== "auto" && res.status === 400) {
          // an unusual size can be refused: try once more at the model's own size
          const again = await inner(`${GATEWAY}${r.path}`, { ...init, body: JSON.stringify({ ...r.body, size: "auto" }) });
          if (again.status === 402 || again.status === 403 || again.status === 429) return again;
          if (again.ok) { const both = await fromImagesAnswer(again, hm.background); if (both) return both; }
        }
        console.warn(`[aiModels] ${to} wasn't taken (${res.status}); using ${from}`);
      } else {
        const res = await inner(input, { ...init, body: JSON.stringify({ ...body, model: to }) });
        if (!NOT_TAKEN.has(res.status)) return res;
        console.warn(`[aiModels] ${to} wasn't taken (${res.status}); using ${from}`);
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError" || (e as Error)?.name === "TimeoutError") throw e;
      console.warn(`[aiModels] ${to} failed; using ${from}`, e);
    }
    return inner(input, original);
  };
}
