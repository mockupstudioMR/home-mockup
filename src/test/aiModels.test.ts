import { describe, expect, it, vi } from "vitest";

// The edge functions' model switch (supabase/functions/_shared/aiModels.ts), run against a fake gateway.
const calls: { url: string; body: Record<string, unknown> }[] = [];
let answer: (url: string, body: Record<string, unknown>) => Response = () => new Response("{}");
globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  const body = JSON.parse(String(init?.body ?? "{}"));
  calls.push({ url, body });
  return answer(url, body);
}) as typeof fetch;
const { MODELS, useModels } = await import("../../supabase/functions/_shared/aiModels.ts");

const GW = "https://ai.gateway.lovable.dev";
const chatPicture = (model: string, extra: Record<string, unknown> = {}) => fetch(`${GW}/v1/chat/completions`, {
  method: "POST",
  body: JSON.stringify({ model, modalities: ["image", "text"], messages: [{ role: "user", content: [{ type: "text", text: "Swap the sofa" }, { type: "image_url", image_url: { url: "https://x/wall.jpg" } }] }], ...extra }),
});

describe("switching AI models", () => {
  it("sends a swap to GPT Image as an images edit, with its mask and size, and answers in the chat shape", async () => {
    calls.length = 0;
    useModels({ "google/gemini-3.1-flash-image": MODELS.edit });
    answer = () => new Response(JSON.stringify({ data: [{ b64_json: "QUJD" }] }));
    const res = await chatPicture("google/gemini-3.1-flash-image", { hm: { mask: "data:image/png;base64,TQ==", size: "1792x1008" } });
    const data = await res.json();
    expect(calls[0].url).toBe(`${GW}/v1/images/edits`);
    expect(calls[0].body).toMatchObject({ model: "openai/gpt-image-2.5-flare", prompt: "Swap the sofa", images: [{ image_url: "https://x/wall.jpg" }], mask: { image_url: "data:image/png;base64,TQ==" }, size: "1792x1008" });
    expect(data.choices[0].message.images[0].image_url.url).toBe("data:image/jpeg;base64,QUJD");
  });
  it("falls back to the old model, exactly as the function asked, when the new one isn't taken", async () => {
    calls.length = 0;
    answer = (url) => (url.includes("/images/") ? new Response("unknown model", { status: 404 }) : new Response(JSON.stringify({ choices: [{ message: { images: [{ image_url: { url: "data:image/png;base64,OLD" } }] } }] })));
    const res = await chatPicture("google/gemini-3.1-flash-image", { hm: { mask: "data:image/png;base64,TQ==" } });
    expect((await res.json()).choices[0].message.images[0].image_url.url).toContain("OLD");
    expect(calls.at(-1)!.body).toMatchObject({ model: "google/gemini-3.1-flash-image" });
    expect(calls.at(-1)!.body.hm).toBeUndefined();
  });
  it("passes 'out of credits' straight back instead of trying another model", async () => {
    calls.length = 0;
    answer = () => new Response("no credits", { status: 402 });
    const res = await chatPicture("google/gemini-3.1-flash-image");
    expect(res.status).toBe(402);
    expect(calls.length).toBe(1);
  });
  it("renames chat models, and falls back when the new id is unknown", async () => {
    calls.length = 0;
    useModels({ "google/gemini-2.5-flash": MODELS.read });
    answer = (_u, b) => (b.model === MODELS.read ? new Response("bad model", { status: 400 }) : new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] })));
    const res = await fetch(`${GW}/v1/chat/completions`, { method: "POST", body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [] }) });
    expect((await res.json()).choices[0].message.content).toBe("ok");
    expect(calls.map((c) => c.body.model)).toEqual([MODELS.read, "google/gemini-2.5-flash"]);
  });
});
