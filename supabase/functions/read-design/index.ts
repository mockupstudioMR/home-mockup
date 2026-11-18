import "../_shared/language.ts";
// Step 2.7 "What should change?": reads a design image and sums it up in five parts
// (interior finishes, furniture, colours & materials, decor, lighting), each with a short
// description, keywords and where it sits in the image. The prompt is editable in
// prompt_templates under "read_design"; the text below is the fallback.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireUser } from "../_shared/auth.ts";
import { fetchWithTimeout } from "../_shared/http.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK_PROMPT = `You are an interior designer describing a room image to its owner in plain, warm English.
Sum the image up in exactly five parts, in this order and with these keys:
1. "finishes"  – Interior finishes: walls, ceiling, floor, doors, arches, mouldings.
2. "furniture" – Furniture: the main pieces and how they are arranged.
3. "colours"   – Colours, contrast & materials: the palette, how bright/contrasting it is, the textures.
4. "decor"     – Decor: objects, plants, textiles, art.
5. "lighting"  – Lighting: fixtures and the mood of the light.
For each part return:
- "text": 2–3 sentences, concrete (name colours, materials, shapes).
- "keywords": 3–6 short labels (1–3 words each), most important first.
- "x", "y": where that part is most visible in the image, in percent from the top-left (0–100).
{{style_hint}}
Answer ONLY with JSON: {"parts":[{"key":"finishes","text":"","keywords":[],"x":0,"y":0}, ...]}`;

const KEYS = ["finishes", "furniture", "colours", "decor", "lighting"] as const;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const caller = await requireUser(req, corsHeaders);
  if (caller instanceof Response) return caller;
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Missing LOVABLE_API_KEY");
    const { imageUrl, style } = await req.json();
    if (!imageUrl) return json({ error: "imageUrl is required" }, 400);

    let prompt = FALLBACK_PROMPT;
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (url && key) {
      const { data } = await createClient(url, key).from("prompt_templates").select("template").eq("template_key", "read_design").maybeSingle();
      if (data?.template) prompt = data.template;
    }
    prompt = prompt.replace("{{style_hint}}", style ? `The owner calls this direction "${style}".` : "");

    const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: imageUrl } }] }],
      }),
    });
    if (response.status === 429) return json({ error: "Rate limit exceeded, please try again shortly." }, 429);
    if (response.status === 402) return json({ error: "AI credits are used up for now." }, 402);
    if (!response.ok) throw new Error(`AI request failed: ${response.status}`);

    const data = await response.json();
    const text = String(data.choices?.[0]?.message?.content ?? "{}").replace(/```json\s*|```\s*/g, "").trim();
    let parsed: { parts?: { key: string; text?: string; keywords?: string[]; x?: number; y?: number }[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      return json({ error: "Could not read the design. Try again." }, 502);
    }
    const parts = KEYS.map((k, i) => {
      const p = parsed.parts?.find((x) => x.key === k) ?? parsed.parts?.[i];
      const clamp = (n: unknown, d: number) => (typeof n === "number" && n >= 0 && n <= 100 ? n : d);
      return {
        key: k,
        text: String(p?.text ?? "").trim(),
        keywords: (p?.keywords ?? []).map(String).slice(0, 6),
        x: clamp(p?.x, [20, 70, 50, 65, 50][i]),
        y: clamp(p?.y, [35, 60, 80, 40, 12][i]),
      };
    });
    return json({ success: true, parts });
  } catch (error) {
    console.error("read-design error:", error);
    return json({ error: error instanceof Error ? error.message : "Could not read the design" }, 500);
  }
});
