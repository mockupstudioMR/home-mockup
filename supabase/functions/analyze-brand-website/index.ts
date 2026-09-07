const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractJson(text: string): any {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function firecrawlScrape(url: string, key: string, formats: string[]) {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats, onlyMainContent: true }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firecrawl ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  return json?.data || {};
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY is not configured");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    let url: string = String(body?.url || "").trim();
    if (!url) {
      return new Response(JSON.stringify({ error: "A website address is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

    // 1. Read the site (branding format when available, markdown as fallback)
    let page: any = {};
    try {
      page = await firecrawlScrape(url, FIRECRAWL_API_KEY, ["branding", "markdown", "screenshot"]);
    } catch (e) {
      console.warn("branding format failed, retrying plain", e);
      page = await firecrawlScrape(url, FIRECRAWL_API_KEY, ["markdown", "screenshot"]);
    }

    const branding = page?.branding || {};
    const meta = page?.metadata || {};
    const siteColors: string[] = Object.values(branding?.colors || {})
      .filter((c): c is string => typeof c === "string" && /^#|rgb/i.test(c))
      .slice(0, 8);
    const siteFonts: string[] = (branding?.fonts || [])
      .map((f: any) => f?.family)
      .filter((f: any) => typeof f === "string")
      .slice(0, 4);
    const logo: string | null =
      branding?.logo || branding?.images?.logo || meta?.ogImage || meta?.["og:image"] || null;

    // 2. Turn it into an interior-design style brief
    const promptText = `You are a brand and interior design analyst. Below is data scraped from a furniture retailer's website.
Website: ${url}
Title: ${meta?.title || ""}
Description: ${meta?.description || ""}
Detected brand colours: ${siteColors.join(", ") || "none detected"}
Detected fonts: ${siteFonts.join(", ") || "none detected"}
Page content (truncated):
${String(page?.markdown || "").slice(0, 4000)}

Return ONLY JSON:
{
  "brandName": "short brand name",
  "styleName": "2-4 word interior style label that matches this brand",
  "description": "2 sentences describing the brand's visual world and how their rooms should feel",
  "keywords": ["5-7 style keywords"],
  "palette": ["#hex", "..."] (5 colours that represent the brand — use detected colours where sensible),
  "materials": ["3-5 typical materials"],
  "tone": "one short sentence about the brand tone of voice",
  "audience": "one short sentence about the target customer"
}`;

    let brief: any = null;
    for (let attempt = 1; attempt <= 3 && !brief; attempt++) {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: promptText }],
        }),
      });
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 1200 * attempt + Math.random() * 400));
        continue;
      }
      if (!res.ok) {
        const text = await res.text();
        return new Response(JSON.stringify({ error: text.slice(0, 300) }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await res.json();
      brief = extractJson(data?.choices?.[0]?.message?.content || "");
    }
    if (!brief) throw new Error("Could not read a brand style from that website");

    const brand = {
      url,
      brandName: brief.brandName || meta?.title || url,
      styleName: brief.styleName || "Brand style",
      description: brief.description || "",
      keywords: Array.isArray(brief.keywords) ? brief.keywords.slice(0, 8) : [],
      palette: (Array.isArray(brief.palette) && brief.palette.length ? brief.palette : siteColors).slice(0, 6),
      materials: Array.isArray(brief.materials) ? brief.materials.slice(0, 6) : [],
      tone: brief.tone || "",
      audience: brief.audience || "",
      fonts: siteFonts,
      logo,
      screenshot: page?.screenshot || null,
      title: meta?.title || null,
    };

    return new Response(JSON.stringify({ brand }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-brand-website error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Website analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
