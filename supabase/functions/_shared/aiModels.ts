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
 * Direct to the providers: with GEMINI_API_KEY (Google AI Studio) and/or OPENAI_API_KEY set as function secrets,
 * calls for Google and OpenAI models go straight to Google and OpenAI, billed there, not through Lovable. Without
 * them, or when a direct call fails, the Lovable gateway is used as before (while LOVABLE_API_KEY exists).
 * Order for each call: the new model directly, the new model through Lovable, the old model directly, the old
 * model through Lovable.
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

// the edge runtime's Deno, read through globalThis so this file also loads in the app's tests
const denoEnv = () => (globalThis as unknown as { Deno?: { env: { get(k: string): string | undefined; set(k: string, v: string): void } } }).Deno?.env;
const env = (k: string) => { try { return denoEnv()?.get(k) ?? ""; } catch { return ""; } };
const keys = () => ({ google: env("GEMINI_API_KEY"), openai: env("OPENAI_API_KEY"), lovable: env("LOVABLE_API_KEY") });
// Functions check LOVABLE_API_KEY before calling the AI. Off Lovable, with only direct keys, let them through.
if (!env("LOVABLE_API_KEY") && (env("GEMINI_API_KEY") || env("OPENAI_API_KEY"))) {
  try { denoEnv()?.set("LOVABLE_API_KEY", "direct"); } catch { /* set LOVABLE_API_KEY to any value as a secret instead */ }
}

const GOOGLE = "https://generativelanguage.googleapis.com/v1beta";
const provider = (model: string) => model.split("/")[0];
const bare = (model: string) => model.split("/").slice(1).join("/");
const json = (data: unknown) => new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });

/** An image link as base64 for the providers that only take images inline. */
async function inline(url: string, inner: typeof fetch): Promise<{ mime: string; data: string } | null> {
  const m = /^data:([^;]+);base64,(.*)$/.exec(url);
  if (m) return { mime: m[1], data: m[2] };
  try {
    const r = await inner(url);
    if (!r.ok) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    return { mime: r.headers.get("content-type")?.split(";")[0] || "image/jpeg", data: btoa(bin) };
  } catch {
    return null;
  }
}

const partsOf = (body: Record<string, unknown>) => {
  const parts: Part[] = [];
  for (const m of (body.messages as { role?: string; content?: unknown }[] | undefined) ?? []) {
    if (typeof m.content === "string") parts.push({ type: "text", text: m.content });
    else if (Array.isArray(m.content)) parts.push(...(m.content as Part[]));
  }
  return parts;
};

/** A Google picture call (Gemini image models), straight to Google, answered in the chat shape. */
async function googleImage(model: string, body: Record<string, unknown>, key: string, inner: typeof fetch, signal?: AbortSignal | null) {
  const parts: unknown[] = [];
  for (const p of partsOf(body)) {
    if (p.type === "text" && p.text) parts.push({ text: p.text });
    else if (p.type === "image_url" && p.image_url?.url) { const i = await inline(p.image_url.url, inner); if (i) parts.push({ inline_data: { mime_type: i.mime, data: i.data } }); }
  }
  const res = await inner(`${GOOGLE}/models/${bare(model)}:generateContent`, {
    method: "POST", signal: signal ?? undefined,
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { responseModalities: ["IMAGE", "TEXT"] } }),
  });
  if (!res.ok) return res;
  const data = await res.json();
  const out = data?.candidates?.[0]?.content?.parts ?? [];
  const img = out.find((p: { inlineData?: { data?: string } }) => p.inlineData?.data);
  if (!img) return new Response("no image", { status: 422 });
  const url = `data:${img.inlineData.mimeType || "image/png"};base64,${img.inlineData.data}`;
  return json({ choices: [{ message: { role: "assistant", content: out.filter((p: { text?: string }) => p.text).map((p: { text: string }) => p.text).join(""), images: [{ type: "image_url", image_url: { url } }] } }], data: [{ b64_json: img.inlineData.data }] });
}

/** A Google text call, straight to Google's OpenAI-compatible endpoint (images inline). */
async function googleChat(model: string, body: Record<string, unknown>, key: string, inner: typeof fetch, signal?: AbortSignal | null) {
  const messages: unknown[] = [];
  for (const m of (body.messages as { role: string; content: unknown }[] | undefined) ?? []) {
    if (!Array.isArray(m.content)) { messages.push(m); continue; }
    const content: unknown[] = [];
    for (const p of m.content as Part[]) {
      if (p.type === "image_url" && p.image_url?.url && !p.image_url.url.startsWith("data:")) {
        const i = await inline(p.image_url.url, inner);
        content.push(i ? { type: "image_url", image_url: { url: `data:${i.mime};base64,${i.data}` } } : p);
      } else content.push(p);
    }
    messages.push({ ...m, content });
  }
  return inner(`${GOOGLE}/openai/chat/completions`, {
    method: "POST", signal: signal ?? undefined,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ ...body, model: bare(model), messages }),
  });
}

/** An OpenAI call straight to OpenAI: pictures through the images API, text through chat. */
async function openaiCall(model: string, body: Record<string, unknown>, hm: Hm, key: string, inner: typeof fetch, signal?: AbortSignal | null) {
  const wantsImage = Array.isArray(body.modalities) && (body.modalities as string[]).includes("image");
  if (!wantsImage) {
    return inner("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: signal ?? undefined,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ ...body, model: bare(model) }),
    });
  }
  const r = toImagesRequest(body, bare(model), hm);
  const send = (b: Record<string, unknown>) => inner(`https://api.openai.com${r.path}`, { method: "POST", signal: signal ?? undefined, headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body: JSON.stringify(b) });
  let res = await send(r.body);
  if (!res.ok && res.status === 400 && r.body.size !== "auto") res = await send({ ...r.body, size: "auto" });
  if (!res.ok) return res;
  return (await fromImagesAnswer(res, hm.background)) ?? new Response("no image", { status: 422 });
}

/** One model through the Lovable gateway (GPT Image translated to the images API there too). */
async function viaLovable(model: string, from: string, input: RequestInfo | URL, init: RequestInit, body: Record<string, unknown>, hm: Hm, inner: typeof fetch) {
  if (model === from) return inner(input, { ...init, body: JSON.stringify(body) });
  if (provider(model) === "openai" && Array.isArray(body.messages) && Array.isArray(body.modalities) && (body.modalities as string[]).includes("image")) {
    const r = toImagesRequest(body, model, hm);
    let res = await inner(`${GATEWAY}${r.path}`, { ...init, body: JSON.stringify(r.body) });
    if (!res.ok && res.status === 400 && r.body.size !== "auto") res = await inner(`${GATEWAY}${r.path}`, { ...init, body: JSON.stringify({ ...r.body, size: "auto" }) });
    if (!res.ok) return res;
    return (await fromImagesAnswer(res, hm.background)) ?? new Response("no image", { status: 422 });
  }
  return inner(input, { ...init, body: JSON.stringify({ ...body, model }) });
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
    const from = typeof body.model === "string" ? body.model : "";
    const to = g.__hmModels![from] || from;
    const k = keys();
    const wantsImage = Array.isArray(body.modalities) && (body.modalities as string[]).includes("image");
    const direct = (model: string) => {
      const p = provider(model);
      if (p === "google" && k.google) return () => (wantsImage ? googleImage(model, body, k.google, inner, init.signal) : googleChat(model, body, k.google, inner, init.signal));
      if (p === "openai" && k.openai) return () => openaiCall(model, body, hm, k.openai, inner, init.signal);
      return null;
    };
    const lovable = (model: string) => (k.lovable && k.lovable !== "direct" ? () => viaLovable(model, from, input, init, body, hm, inner) : null);
    const tries: { label: string; run: (() => Promise<Response>) | null }[] = [
      { label: `${to} direct`, run: direct(to) },
      { label: `${to} via Lovable`, run: to !== from ? lovable(to) : null },
      { label: `${from} direct`, run: to !== from ? direct(from) : null },
      { label: `${from} via Lovable`, run: lovable(from) },
    ].filter((t) => t.run);
    let last: Response | null = null;
    let lovableBlocked = false;
    for (const [i, t] of tries.entries()) {
      // Lovable out of credits, blocked or rate-limited: its other route would answer the same, so only direct ones are left
      if (lovableBlocked && t.label.endsWith("via Lovable")) continue;
      try {
        const res = await t.run!();
        if (res.ok) return res;
        last = res;
        if (t.label.endsWith("via Lovable") && (res.status === 402 || res.status === 403 || res.status === 429)) lovableBlocked = true;
        console.warn(`[aiModels] ${t.label} answered ${res.status}${i < tries.length - 1 ? "; trying the next route" : ""}`);
      } catch (e) {
        if ((e as Error)?.name === "AbortError" || (e as Error)?.name === "TimeoutError") throw e;
        console.warn(`[aiModels] ${t.label} failed`, e);
      }
    }
    return last ?? inner(input, { ...init, body: JSON.stringify(body) });
  };
}
