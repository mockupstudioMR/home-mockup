import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AnalyzeRequest {
  images: string[];
  mode: "room" | "products";
  excludeStyles?: string[];
  onlyOneStyle?: boolean;
}

// Default prompts (fallbacks if DB templates not found)
const DEFAULT_ROOM_PROMPT = `Analyze these interior design images. The images are provided in the same order as in the "perImage" array you must return.

STEP 1 — For EACH image individually, analyze:
  a) Style: dominant interior style name (e.g., "Modern & Minimal", "Bohemian Eclectic", "Mediterranean", "Classic Historical", "Rustic Nature", "Glam & Luxe") + confidence (0-1) + 1-2 sentence reason.
  b) Color theme: list of dominant colors as hex codes, the palette type ("monochrome" | "analogous" | "complementary" | "neutral" | "warm" | "cool" | "earthy" | "jewel-tones" | "pastel"), and a contrast level ("low" | "medium" | "high"). If monochrome, describe the contrast (e.g., "soft tonal" or "high contrast black & white").
  c) Textures & materials: 3-6 short labels of the dominant textures/materials visible (e.g., "natural linen", "polished marble", "rough oak", "brushed brass", "boucle wool").

STEP 2 — Then synthesize a CONCLUSION across ALL images. The conclusion CAN be mixed (multiple styles blended). Provide:
  - styles[]: 1-3 dominant styles with confidence, description, 3-5 keywords, AND a single representative "iconicItem" (one specific furniture/decor item that visually embodies that style — e.g., "Wassily chair", "Noguchi paper lantern", "Carved teak console").
  - dominantColors[]: combined palette across all images (hex codes).
  - materials[]: 4-8 specific materials/textures consolidated across all images (e.g., "natural linen", "polished marble", "rough oak", "brushed brass", "boucle wool", "terracotta tile"). MUST be populated.
  - moodboardDescription: 1-3 sentences. If mixed, explicitly say "This is a mix of X and Y…".
  - roomElements[]: notable furniture/architectural items visible across images (label, category, description).

Respond in this EXACT JSON format:
{
  "perImage": [
    {
      "imageIndex": 0,
      "style": { "styleName": "string", "confidence": 0.0, "reason": "string" },
      "colorTheme": {
        "colors": ["#hex"],
        "paletteType": "string",
        "contrast": "low | medium | high",
        "notes": "string"
      },
      "textures": ["string"]
    }
  ],
  "styles": [
    { "styleName": "string", "confidence": 0.0, "description": "string", "keywords": ["string"], "iconicItem": "string" }
  ],
  "dominantColors": ["#hex"],
  "materials": ["string"],
  "moodboardDescription": "string",
  "roomElements": [
    { "label": "string", "category": "furniture | wall | flooring | lighting | window | rug | decor | architectural", "description": "string" }
  ]
}`;

const DEFAULT_PRODUCTS_PROMPT = `Analyze these product/furniture images. For each product, identify:
1. Product name/type
2. Category (furniture, lighting, decor, textile, etc.)
3. Best matching interior style
4. Brief description

Then perform a STYLE ANALYSIS exactly like analyzing a room. Identify all dominant interior design styles present across these products. For each detected style, provide:
1. Style name (e.g., "Modern & Minimal", "Bohemian Eclectic", "Mediterranean", "Classic Historical", "Rustic Nature", "Glam & Luxe")
2. Confidence score (0-1)
3. Brief description of why this style matches
4. 3-5 keywords that define this style

Also identify:
- Dominant colors from the products (as hex codes)
- Overall moodboard description

IMPORTANT: Also identify what essential products are MISSING to complete a cohesive room design. Consider what complementary items would enhance the space based on the uploaded products. For each missing product, suggest:
- Product type and name
- Category
- Why it's needed (function or aesthetic reason)
- Search keywords the user could use to find similar products online

Respond in this exact JSON format:
{
  "products": [
    {
      "productName": "string",
      "category": "string",
      "suggestedStyle": "string",
      "description": "string"
    }
  ],
  "styles": [
    {
      "styleName": "string",
      "confidence": number,
      "description": "string",
      "keywords": ["string"]
    }
  ],
  "dominantColors": ["#hex"],
  "missingProducts": [
    {
      "productName": "string",
      "category": "string",
      "reason": "string",
      "searchKeywords": ["string"],
      "priceRange": "budget | mid-range | premium",
      "priority": "essential | recommended | optional"
    }
  ],
  "recommendedStyle": "string",
  "styleDescription": "string",
  "moodboardSuggestion": "string"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { images, mode, excludeStyles, onlyOneStyle }: AnalyzeRequest = await req.json();

    if (!images || images.length === 0) {
      throw new Error("No images provided");
    }

    // Fetch prompt template from DB
    let prompt: string;
    const templateKey = mode === "room" ? "analyze_style_room" : "analyze_style_products";
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: tpl } = await supabase
        .from("prompt_templates")
        .select("template")
        .eq("template_key", templateKey)
        .maybeSingle();
      
      prompt = tpl?.template || (mode === "room" ? DEFAULT_ROOM_PROMPT : DEFAULT_PRODUCTS_PROMPT);
      console.log(`Using ${tpl ? "DB" : "default"} template for ${templateKey}`);
    } else {
      prompt = mode === "room" ? DEFAULT_ROOM_PROMPT : DEFAULT_PRODUCTS_PROMPT;
    }

    // Build content array with all images
    let effectivePrompt = prompt;
    if (excludeStyles && excludeStyles.length > 0) {
      effectivePrompt += `\n\nIMPORTANT: Do NOT include these styles (already detected): ${excludeStyles.join(", ")}. Identify a DIFFERENT style that's also present in the image(s) but not in the excluded list.`;
    }
    if (onlyOneStyle) {
      effectivePrompt += `\n\nReturn ONLY ONE style in the "styles" array (the single best new match).`;
    }
    const content: any[] = [{ type: "text", text: effectivePrompt }];
    for (const imageUrl of images) {
      content.push({
        type: "image_url",
        image_url: { url: imageUrl }
      });
    }

    console.log(`Analyzing ${images.length} images in ${mode} mode`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content,
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Add funds to your Lovable AI balance, then try again." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content || "";

    console.log("AI response:", textContent.substring(0, 500) + "...");

    // Robust JSON extraction
    const result = extractJsonFromResponse(textContent, mode);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Analyze style error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to analyze style" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractJsonFromResponse(response: string, mode: string): unknown {
  let cleaned = response
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No JSON object found in response");
  }

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log("Initial parse failed, attempting fixes...");
    
    cleaned = cleaned
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, "")
      .replace(/\n/g, " ")
      .replace(/\r/g, "");

    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      console.log("Second parse failed, attempting truncation repair...");
      const repaired = repairTruncatedJson(cleaned);
      return JSON.parse(repaired);
    }
  }
}

function repairTruncatedJson(json: string): string {
  let repaired = json;
  
  repaired = repaired.replace(/,?\s*"[^"]*":\s*$/, "");
  repaired = repaired.replace(/,?\s*"[^"]*":\s*\[$/, "");
  repaired = repaired.replace(/,?\s*"[^"]*":\s*"[^"]*$/, "");
  
  const quoteCount = (repaired.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    repaired += '"';
  }
  
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/]/g) || []).length;
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    repaired += "]";
  }
  
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  for (let i = 0; i < openBraces - closeBraces; i++) {
    repaired += "}";
  }
  
  repaired = repaired.replace(/,\s*}/g, "}");
  repaired = repaired.replace(/,\s*]/g, "]");
  
  console.log("Repaired JSON:", repaired.substring(0, 200) + "...");
  
  return repaired;
}
