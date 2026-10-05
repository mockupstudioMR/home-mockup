import { requireUser } from "../_shared/auth.ts";
import { fetchWithTimeout } from "../_shared/http.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RetailerRequest {
  images: string[];
  productRange?: string;
  productTypes?: string[];
  salesChannel?: string;
}

async function toDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      console.error("Image fetch failed", res.status, url.slice(0, 120));
      return null;
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    if (!buf.length) return null;
    const mime = res.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    let bin = "";
    for (let i = 0; i < buf.length; i += 8192) {
      bin += String.fromCharCode(...buf.subarray(i, i + 8192));
    }
    return `data:${mime};base64,${btoa(bin)}`;
  } catch (e) {
    console.error("Image inline error", e);
    return null;
  }
}

function extractJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in AI response");
  return JSON.parse(raw.slice(start, end + 1));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const caller = await requireUser(req, corsHeaders);
  if (caller instanceof Response) return caller;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body: RetailerRequest = await req.json();
    const images = Array.isArray(body.images) ? body.images.slice(0, 5) : [];
    if (!images.length) {
      return new Response(JSON.stringify({ error: "Provide at least one product image or link" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const context = [
      body.productRange ? `Product range: ${body.productRange}.` : "",
      body.productTypes?.length ? `Product types sold: ${body.productTypes.join(", ")}.` : "",
      body.salesChannel ? `Sales channel: ${body.salesChannel}.` : "",
    ].filter(Boolean).join(" ");

    const prompt = `You are an interior style analyst working for a furniture retailer. ${context}

Analyze the ${images.length} product photos (given in order, imageIndex starts at 0).

For EACH product return:
- name: short product name (e.g. "Boucle lounge chair")
- category: ONE normalized category from: sofa, armchair, chair, table, coffee-table, desk, bed, storage, shelving, lighting, rug, textile, mirror, decor, outdoor
- styleTags: 2-4 short interior style tags (e.g. "Modern Minimal", "Japandi", "Mid-century")
- colors: 3-5 dominant hex colors OF THAT PRODUCT
- materials: 2-4 materials/textures
- description: 1 sentence

Then synthesize an OVERALL matching style across all products:
- styleName, confidence (0-1), description (2-3 sentences, retailer-facing), keywords (4-6)
- palette: 5-6 hex colors that unify the assortment
- coherence: 0-1 how consistent the assortment is stylistically
- coherenceNote: 1 sentence explaining the score

Respond with EXACT JSON only:
{
  "overall": { "styleName": "string", "confidence": 0.0, "description": "string", "keywords": ["string"], "palette": ["#hex"], "coherence": 0.0, "coherenceNote": "string" },
  "products": [ { "imageIndex": 0, "name": "string", "category": "string", "styleTags": ["string"], "colors": ["#hex"], "materials": ["string"], "description": "string" } ]
}`;

    const inlined = await Promise.all(images.map((u) => toDataUrl(u)));
    const content: any[] = [{ type: "text", text: prompt }];
    for (const url of inlined) {
      if (url) content.push({ type: "image_url", image_url: { url } });
    }

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error", response.status, errorText.slice(0, 300));
        if (response.status === 429 || response.status >= 500) {
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 1500 * attempt));
            continue;
          }
          return new Response(JSON.stringify({ error: "The style analysis is busy right now. Please try again in a moment." }), {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402 || response.status === 403) {
          let message = "";
          try { message = JSON.parse(errorText)?.error?.message || ""; } catch { /* ignore */ }
          return new Response(JSON.stringify({ error: message || "AI access is blocked for this workspace." }), {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const result = extractJson(text);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Analysis failed after retries");
  } catch (error) {
    console.error("analyze-retailer-products error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
