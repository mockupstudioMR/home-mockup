import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Missing LOVABLE_API_KEY");

    const { imageUrl, clickX, clickY } = await req.json();

    if (!imageUrl || clickX === undefined || clickY === undefined) {
      throw new Error("imageUrl, clickX, and clickY are required");
    }

    console.log(`Identifying item at (${clickX}%, ${clickY}%) in image`);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
              content: [
                {
                  type: "text",
                  text: `Look at this interior design image. The user clicked at position (${clickX}%, ${clickY}%) of the image, where (0%,0%) is the top-left corner and (100%,100%) is the bottom-right corner.

Identify the SPECIFIC furniture item, decor piece, or design element at that exact click position.

Return a JSON object with:
- "item_name": The specific product name (e.g. "Velvet Tufted Armchair", "Brass Arc Floor Lamp")
- "item_type": Category (e.g. "chair", "lamp", "rug", "table", "artwork", "curtain", "vase", "cushion")
- "description": A detailed 1-2 sentence description including color, material, style
- "color": Primary color
- "material": Primary material
- "style": Design style (e.g. "mid-century modern", "art deco", "bohemian")
- "search_query": A concise shopping search query to find this exact item (e.g. "velvet tufted emerald green armchair gold legs")

If the click is on a wall, floor, or ceiling surface (not a product), return:
- "item_name": The surface name (e.g. "Herringbone Wood Floor")
- "item_type": "surface"
- "description": Description of the finish/material
- "color", "material", "style" as above
- "search_query": A search query for that material/finish

Respond ONLY with valid JSON, no markdown, no explanation.`,
                },
                {
                  type: "image_url",
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    let resultText = data.choices?.[0]?.message?.content || "{}";
    resultText = resultText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let item;
    try {
      item = JSON.parse(resultText);
    } catch {
      console.error("Failed to parse item JSON:", resultText);
      throw new Error("Could not identify the item");
    }

    // Build search URLs
    const query = encodeURIComponent(item.search_query || item.item_name);
    item.shopping_url = `https://www.bing.com/shop?q=${query}`;
    item.images_url = `https://www.bing.com/images/search?q=${query}`;

    console.log(`Identified: ${item.item_name} (${item.item_type})`);

    return new Response(
      JSON.stringify({ success: true, item }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Identify item error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to identify item",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
