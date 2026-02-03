import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeRequest {
  images: string[];
  mode: "room" | "products";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { images, mode }: AnalyzeRequest = await req.json();

    if (!images || images.length === 0) {
      throw new Error("No images provided");
    }

    let prompt: string;
    
    if (mode === "room") {
      prompt = `Analyze these interior design images and identify the dominant styles. For each detected style, provide:
1. Style name (e.g., "Modern & Minimal", "Bohemian Eclectic", "Mediterranean", "Classic Historical", "Rustic Nature", "Glam & Luxe")
2. Confidence score (0-1)
3. Brief description of why this style matches
4. 3-5 keywords that define this style

Also identify:
- Dominant colors (as hex codes)
- Overall moodboard description

Respond in this exact JSON format:
{
  "styles": [
    {
      "styleName": "string",
      "confidence": number,
      "description": "string",
      "keywords": ["string"]
    }
  ],
  "dominantColors": ["#hex"],
  "moodboardDescription": "string"
}`;
    } else {
      prompt = `Analyze these product/furniture images. For each product, identify:
1. Product name/type
2. Category (furniture, lighting, decor, textile, etc.)
3. Best matching interior style
4. Brief description

Then recommend an overall interior style that would best incorporate all these products.

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
    }

    // Build content array with all images
    const content: any[] = [{ type: "text", text: prompt }];
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
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.choices?.[0]?.message?.content || "";

    console.log("AI response:", textContent.substring(0, 500) + "...");

    // Robust JSON extraction
    const result = extractJsonFromResponse(textContent, mode);

function extractJsonFromResponse(response: string, mode: string): unknown {
  // Step 1: Remove markdown code blocks
  let cleaned = response
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Step 2: Find JSON boundaries
  const jsonStart = cleaned.indexOf("{");
  const jsonEnd = cleaned.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("No JSON object found in response");
  }

  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

  // Step 3: Attempt parse with error handling
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.log("Initial parse failed, attempting fixes...");
    
    // Step 4: Try to fix common issues
    cleaned = cleaned
      .replace(/,\s*}/g, "}") // Remove trailing commas before }
      .replace(/,\s*]/g, "]") // Remove trailing commas before ]
      .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
      .replace(/\n/g, " ") // Replace newlines with spaces
      .replace(/\r/g, ""); // Remove carriage returns

    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      console.log("Second parse failed, attempting truncation repair...");
      
      // Step 5: Try to repair truncated JSON
      const repaired = repairTruncatedJson(cleaned, mode);
      return JSON.parse(repaired);
    }
  }
}

function repairTruncatedJson(json: string, mode: string): string {
  let repaired = json;
  
  // Count brackets to detect truncation
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/]/g) || []).length;
  
  // Remove incomplete key-value pairs at the end
  repaired = repaired.replace(/,?\s*"[^"]*":\s*$/, "");
  repaired = repaired.replace(/,?\s*"[^"]*":\s*\[$/, "");
  repaired = repaired.replace(/,?\s*"[^"]*":\s*"[^"]*$/, "");
  
  // Close any unclosed strings
  const quoteCount = (repaired.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    repaired += '"';
  }
  
  // Add missing closing brackets
  const newOpenBrackets = (repaired.match(/\[/g) || []).length;
  const newCloseBrackets = (repaired.match(/]/g) || []).length;
  for (let i = 0; i < newOpenBrackets - newCloseBrackets; i++) {
    repaired += "]";
  }
  
  // Add missing closing braces
  const newOpenBraces = (repaired.match(/{/g) || []).length;
  const newCloseBraces = (repaired.match(/}/g) || []).length;
  for (let i = 0; i < newOpenBraces - newCloseBraces; i++) {
    repaired += "}";
  }
  
  // Clean up any trailing commas we might have created
  repaired = repaired.replace(/,\s*}/g, "}");
  repaired = repaired.replace(/,\s*]/g, "]");
  
  console.log("Repaired JSON:", repaired.substring(0, 200) + "...");
  
  return repaired;
}

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
