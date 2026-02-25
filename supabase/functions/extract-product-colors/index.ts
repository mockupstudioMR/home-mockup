import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const { productId, imageUrl } = await req.json();

    if (!productId || !imageUrl) {
      throw new Error("productId and imageUrl are required");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
            content: [
              {
                type: "text",
                text: `Analyze this furniture/product image and extract the dominant colors of the product itself (not the background).

Return a JSON array of the top 3-5 dominant colors. Each color object should have:
- "name": human-readable color name (e.g., "Warm Beige", "Navy Blue")
- "hex": hex color code (e.g., "#F5E6D3")
- "percentage": estimated percentage of the product this color covers (should sum to ~100)

Only return the JSON array, no other text. Example:
[{"name":"Charcoal Gray","hex":"#36454F","percentage":60},{"name":"Walnut Brown","hex":"#5C4033","percentage":30},{"name":"Brass Gold","hex":"#B5A642","percentage":10}]`,
              },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse colors from AI response");
    }

    const colors = JSON.parse(jsonMatch[0]);

    // Save to product metadata
    const { data: product } = await supabase
      .from("shop_products")
      .select("metadata")
      .eq("id", productId)
      .single();

    const existingMetadata = (product?.metadata as Record<string, unknown>) || {};

    const { error: updateError } = await supabase
      .from("shop_products")
      .update({
        metadata: { ...existingMetadata, extracted_colors: colors },
      })
      .eq("id", productId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, colors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Extract colors error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to extract colors",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
