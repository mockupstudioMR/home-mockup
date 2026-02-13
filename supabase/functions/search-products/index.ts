import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SearchRequest {
  imageUrl?: string;
  style?: string;
  room?: string;
  query?: string;
  userCity?: string;
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

    const { imageUrl, style, room, query: _query, userCity }: SearchRequest = await req.json();

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

    // Fetch room furniture config for filtering
    let roomFurnitureItems: string[] = [];
    if (room) {
      const { data: roomConfig } = await supabase
        .from("room_furniture_config")
        .select("furniture_items")
        .eq("room_type", room)
        .maybeSingle();

      if (roomConfig?.furniture_items) {
        roomFurnitureItems = roomConfig.furniture_items;
        console.log("Room furniture config loaded:", roomFurnitureItems);
      }
    }

    // Helper to filter products against approved furniture list
    const filterByRoomFurniture = (products: any[]): any[] => {
      if (roomFurnitureItems.length === 0) return products;
      const approvedLower = roomFurnitureItems.map(f => f.toLowerCase());
      return products.filter(p => {
        const catLower = (p.category || "").toLowerCase();
        const nameLower = (p.name || "").toLowerCase();
        return approvedLower.some(approved =>
          catLower.includes(approved) || approved.includes(catLower) ||
          nameLower.includes(approved) || approved.includes(nameLower)
        );
      });
    };

    // Build search filters
    console.log("Searching shop_products table...");

    // Map detected categories to actual database categories
    const categoryMapping: Record<string, string[]> = {
      "furniture": ["furniture", "sofa", "bed", "storage"],
      "lighting": ["lighting"],
      "textile": ["textile"],
      "decor": ["decor", "other"],
    };

    // Expand detected categories to include all matching db categories
    const expandedCategories: string[] = [];
    for (const cat of categories) {
      const mappedCats = categoryMapping[cat.toLowerCase()];
      if (mappedCats) {
        expandedCategories.push(...mappedCats);
      } else {
        expandedCategories.push(cat.toLowerCase());
      }
    }

    console.log("Expanded categories:", expandedCategories);

    // Query shop_products table - first try with style filter
    let dbProducts: any[] = [];
    let dbError: any = null;

    if (style) {
      const normalizedStyle = style.toLowerCase().replace(/_/g, " ").replace(/-/g, " ");
      const styleVariant = style.toLowerCase(); // Keep hyphenated version too
      
      let styleQuery = supabase
        .from("shop_products")
        .select("*")
        .eq("is_active", true)
        .or(`style.ilike.%${normalizedStyle}%,style.ilike.%${styleVariant}%,name.ilike.%${normalizedStyle}%`);

      if (expandedCategories.length > 0) {
        styleQuery = styleQuery.in("category", expandedCategories);
      }

      const styleResult = await styleQuery.limit(50);
      
      if (!styleResult.error && styleResult.data && styleResult.data.length > 0) {
        dbProducts = filterByRoomFurniture(styleResult.data);
        console.log("Found products with style filter (after room filter):", dbProducts.length);
      }
    }

    // If no results with style filter (or no style), get all matching categories
    if (dbProducts.length === 0) {
      let fallbackQuery = supabase
        .from("shop_products")
        .select("*")
        .eq("is_active", true);

      if (expandedCategories.length > 0) {
        fallbackQuery = fallbackQuery.in("category", expandedCategories);
      }

      const fallbackResult = await fallbackQuery.limit(50);
      dbProducts = filterByRoomFurniture(fallbackResult.data || []);
      dbError = fallbackResult.error;
      console.log("Fallback query found products (after room filter):", dbProducts.length);
    }

    // Final fallback: get any active products matching room config
    if (dbProducts.length === 0) {
      const { data: anyProducts, error: anyError } = await supabase
        .from("shop_products")
        .select("*")
        .eq("is_active", true)
        .limit(30);
      
      dbProducts = filterByRoomFurniture(anyProducts || []);
      dbError = anyError;
      console.log("Final fallback - filtered active products:", dbProducts.length);
    }

    if (dbError) {
      console.error("Database query error:", dbError);
    }

    console.log("Found products from database:", dbProducts?.length || 0);

    // Sort products: prioritize local shops (same city), then by relevance
    const sortedProducts = (dbProducts || []).sort((a, b) => {
      const aIsLocal = userCityLower && shopCityMap.get(a.shop_id) === userCityLower;
      const bIsLocal = userCityLower && shopCityMap.get(b.shop_id) === userCityLower;
      
      if (aIsLocal && !bIsLocal) return -1;
      if (!aIsLocal && bIsLocal) return 1;
      return 0;
    });

    // Format products for response
    const products = sortedProducts.slice(0, 12).map((p: any) => {
      const shopCity = shopCityMap.get(p.shop_id);
      const isLocalShop = userCityLower && shopCity === userCityLower;
      const shopName = shopNameMap.get(p.shop_id) || "Partner Shop";
      
      return {
        id: p.id,
        title: p.name,
        description: p.description || `${p.category} - ${p.style || "Various styles"}`,
        url: p.source_url || "#",
        source: isLocalShop ? `${shopName} (Local)` : shopName,
        price: p.price,
        currency: p.currency || "EUR",
        imageUrl: p.image_urls?.[0] || null,
        category: p.category,
        style: p.style,
        isLocal: isLocalShop,
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        products,
        detectedItems: detectedProducts,
        message: products.length > 0 
          ? `Found ${products.length} matching products${userCityLower ? ` (prioritizing shops in ${userCity})` : ""}` 
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
