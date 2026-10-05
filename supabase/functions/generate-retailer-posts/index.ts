import { requireUser } from "../_shared/auth.ts";
import { fetchWithTimeout } from "../_shared/http.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProductIn {
  name: string;
  category?: string;
  styleTags?: string[];
  colors?: string[];
  materials?: string[];
  description?: string;
}

interface SceneIn {
  room?: string;
  style?: string;
  isCombination?: boolean;
  productNames?: string[];
}

interface PostsRequest {
  channel: "instagram" | "linkedin" | "email";
  language?: string;
  existingHooks?: string[];
  productRange?: string;
  salesChannel?: string;
  overall?: {
    styleName?: string;
    description?: string;
    keywords?: string[];
    palette?: string[];
  } | null;
  products?: ProductIn[];
  scenes?: SceneIn[];
  brand?: {
    brandName?: string;
    styleName?: string;
    description?: string;
    keywords?: string[];
    palette?: string[];
    materials?: string[];
    tone?: string;
    audience?: string;
    url?: string;
  } | null;
}

const CHANNEL_BRIEFS: Record<string, { label: string; count: number; instructions: string }> = {
  instagram: {
    label: "Instagram post",
    count: 3,
    instructions:
      "Write 3 short, punchy Instagram captions (max 2-3 sentences each), vibrant, visual and conversational, with 2-4 emojis woven in naturally. Give each 5-8 relevant hashtags in the `hashtags` field (space separated, keep the # signs). Fill `imagePrompt` with a concrete visual brief for a photo that would accompany the caption, describing the room, the featured products, light and mood.",
  },
  linkedin: {
    label: "LinkedIn post",
    count: 3,
    instructions:
      "Write 3 professional LinkedIn posts in the `body` field (each 4-7 short paragraphs, ~120-180 words). Open with a strong hook, share a concrete insight about the assortment, craft, materials or the customer, end with a question or a soft call to action. 3-5 tasteful hashtags in `hashtags`. Fill `imagePrompt` with a landscape visual brief.",
  },
  email: {
    label: "Marketing email",
    count: 2,
    instructions:
      "Write 2 marketing emails. For each: a compelling `subject` under 60 characters, a `preview` under 90 characters, and the email in `body` as 3-5 short paragraphs, warm but professional, ending in one clear call to action. Leave `hashtags` empty. Fill `imagePrompt` with a hero-image brief.",
  },
};

function extractJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in AI response");
  return JSON.parse(raw.slice(start, end + 1));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const caller = await requireUser(req, corsHeaders);
  if (caller instanceof Response) return caller;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body: PostsRequest = await req.json();
    const channel = body.channel === "linkedin" || body.channel === "email" ? body.channel : "instagram";
    const brief = CHANNEL_BRIEFS[channel];
    const products = Array.isArray(body.products) ? body.products.slice(0, 8) : [];
    const scenes = Array.isArray(body.scenes) ? body.scenes.slice(0, 8) : [];
    const brand = body.brand || null;
    const overall = body.overall || null;

    const productBlock = products
      .map(
        (p, i) =>
          `${i + 1}. ${p.name}${p.category ? ` (${p.category})` : ""} — style: ${(p.styleTags || []).join(", ") || "n/a"}; colours: ${(p.colors || []).join(", ") || "n/a"}; materials: ${(p.materials || []).join(", ") || "n/a"}. ${p.description || ""}`,
      )
      .join("\n");

    const sceneBlock = scenes
      .map(
        (s) =>
          `- ${s.room || "room"}${s.style ? ` in ${s.style}` : ""}${s.isCombination ? " (products shown together as a set)" : ""}: ${(s.productNames || []).join(" + ")}`,
      )
      .join("\n");

    const brandBlock = brand
      ? `BRAND: ${brand.brandName || "the retailer"}${brand.url ? ` (${brand.url})` : ""}. Signature style: ${brand.styleName || "n/a"}. ${brand.description || ""}
Brand keywords: ${(brand.keywords || []).join(", ")}
Materials: ${(brand.materials || []).join(", ")}
Tone of voice: ${brand.tone || "warm and confident"}
Audience: ${brand.audience || "home owners furnishing their space"}
Palette: ${(brand.palette || []).join(", ")}`
      : "";

    const freshness = (body.existingHooks || []).length
      ? `\nThese hooks were already used — make the new posts clearly different, with fresh angles:\n${(body.existingHooks || []).slice(0, 12).map((h) => `- ${h.slice(0, 160)}`).join("\n")}`
      : "";

    const langLine = body.language
      ? `Write everything in ${body.language}. Do not mix languages.`
      : "Write everything in English.";

    const systemPrompt = `You are a senior interior and furniture marketing copywriter. You write ready-to-publish ${brief.label} content for a furniture retailer, always specific to their real products and brand — never generic filler. ${langLine} Reply with JSON only, no preamble.`;

    const userPrompt = `${brandBlock}

ASSORTMENT STYLE: ${overall?.styleName || "n/a"}. ${overall?.description || ""}
Style keywords: ${(overall?.keywords || []).join(", ")}
Palette: ${(overall?.palette || []).join(", ")}
Product range: ${body.productRange || "n/a"} · Sells: ${body.salesChannel || "n/a"}

PRODUCTS:
${productBlock || "n/a"}

STYLED ROOM SCENES ALREADY CREATED FROM THESE PRODUCTS:
${sceneBlock || "none yet"}
${freshness}

TASK: ${brief.instructions}

Return strictly this JSON shape:
{"posts":[{"caption":"","body":"","subject":"","preview":"","hashtags":"","imagePrompt":"","productNames":[""]}]}
Use empty strings for fields that don't apply to this channel. Exactly ${brief.count} posts.`;

    let lastError = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
      const res = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        lastError = `HTTP ${res.status}: ${text.slice(0, 200)}`;
        if (res.status === 402 || res.status === 403) {
          return new Response(JSON.stringify({ error: lastError }), {
            status: res.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        await new Promise((r) => setTimeout(r, 1200 * attempt + Math.random() * 400));
        continue;
      }

      try {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content ?? "";
        const parsed = extractJson(content);
        const posts = Array.isArray(parsed?.posts) ? parsed.posts : [];
        if (!posts.length) throw new Error("No posts returned");
        return new Response(JSON.stringify({ channel, posts }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        lastError = String(e);
        await new Promise((r) => setTimeout(r, 1200 * attempt + Math.random() * 400));
      }
    }

    return new Response(JSON.stringify({ error: lastError || "Could not write the posts" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-retailer-posts error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
