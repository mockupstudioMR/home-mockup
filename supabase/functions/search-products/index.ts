import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchRequest {
  imageUrl?: string;
  style?: string;
  room?: string;
  query?: string;
}

Deno.serve(async (req) => {
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

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const { imageUrl, style, room: _room, query: _query }: SearchRequest = await req.json();

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let detectedProducts: string[] = [];
    let categories: string[] = [];

    // If imageUrl provided, use AI vision to analyze the image
    if (imageUrl) {
      console.log("Analyzing image for products:", imageUrl.substring(0, 100) + "...");

      const visionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                  text: `Analyze this interior design image and identify ALL furniture and decor items visible. For each item, provide:
- Product type (e.g., "sofa", "coffee table", "floor lamp", "area rug", "wall art", "plant", "cushion", "bookshelf")
- Category (furniture, lighting, decor, textile, storage)
- Style keywords (modern, vintage, minimalist, bohemian, industrial, etc.)

Return your response as JSON:
{
  "products": [
    {
      "type": "sofa",
      "category": "furniture",
      "styleKeywords": ["modern", "minimalist", "neutral"]
    }
  ],
  "dominantStyle": "modern minimal",
  "suggestedSearchTerms": ["modern sofa", "minimalist coffee table", "floor lamp"]
}`,
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

      if (visionResponse.ok) {
        const visionData = await visionResponse.json();
        const textContent = visionData.choices?.[0]?.message?.content || "";
        
        console.log("AI vision response received");

        // Parse JSON from response
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          detectedProducts = analysis.products?.map((p: any) => p.type) || [];
          categories = [...new Set(analysis.products?.map((p: any) => p.category) || [])] as string[];
          console.log("Detected products:", detectedProducts);
          console.log("Categories:", categories);
        }
      } else {
        console.error("Vision API error:", visionResponse.status);
      }
    }

    // Build search filters
    console.log("Searching shop_products table...");

    // Query shop_products table
    let dbQuery = supabase
      .from("shop_products")
      .select("*")
      .eq("is_active", true);

    // If we have detected products, filter by category
    if (categories.length > 0) {
      dbQuery = dbQuery.in("category", categories);
    }

    // If we have style, filter by style
    if (style) {
      const normalizedStyle = style.toLowerCase().replace(/_/g, " ").replace(/-/g, " ");
      dbQuery = dbQuery.or(`style.ilike.%${normalizedStyle}%,name.ilike.%${normalizedStyle}%`);
    }

    const { data: dbProducts, error: dbError } = await dbQuery.limit(12);

    if (dbError) {
      console.error("Database query error:", dbError);
    }

    console.log("Found products from database:", dbProducts?.length || 0);

    // Format products for response
    const products = (dbProducts || []).map((p: any) => ({
      id: p.id,
      title: p.name,
      description: p.description || `${p.category} - ${p.style || "Various styles"}`,
      url: p.source_url || "#",
      source: "Our Shop Partners",
      price: p.price,
      currency: p.currency || "EUR",
      imageUrl: p.image_urls?.[0] || null,
      category: p.category,
      style: p.style,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        products,
        detectedItems: detectedProducts,
        message: products.length > 0 
          ? `Found ${products.length} matching products` 
          : "No products found in our catalog yet. Check back soon!",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Search products error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to search products",
        products: [],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
