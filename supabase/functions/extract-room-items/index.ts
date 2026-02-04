import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractedItem {
  itemType: string;
  itemName: string;
  itemDescription: string;
  color?: string;
  hexCode?: string;
  material?: string;
  style?: string;
  priority: "essential" | "recommended" | "optional";
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ExtractRequest {
  imageUrl: string;
  designId: string;
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

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const { imageUrl, designId, userCity }: ExtractRequest = await req.json();

    if (!imageUrl || !designId) {
      throw new Error("imageUrl and designId are required");
    }

    console.log("Extracting items from design:", designId);

    // Use AI to analyze the image and extract all items
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
                text: `Analyze this interior design image comprehensively. Extract EVERY visible design element including:

1. **Wall Elements**: wall color(s), paint finish, wallpaper patterns, wall textures
2. **Floor Elements**: flooring type (hardwood, tile, carpet, etc.), color, material
3. **Ceiling Elements**: ceiling type, color, any fixtures
4. **Furniture**: ALL furniture pieces (sofas, chairs, tables, beds, storage, etc.)
5. **Lighting**: lamps, chandeliers, sconces, natural light elements
6. **Textiles**: rugs, curtains, cushions, throws, upholstery
7. **Decor**: artwork, mirrors, plants, vases, books, decorative objects
8. **Architectural Details**: moldings, doors, windows, fireplace

For EACH item, provide:
- itemType: category (wall_color, floor_material, furniture, lighting, textile, decor, architectural)
- itemName: specific name (e.g., "Cream White Wall Paint", "Oak Herringbone Floor")
- itemDescription: detailed description for shopping
- color: descriptive color name (e.g., "warm taupe", "sage green")
- hexCode: REQUIRED for wall_color items - the exact hex color code (e.g., "#E8DFD1", "#B8C5B0"). Must be accurate.
- material: material type if applicable
- style: design style (modern, vintage, bohemian, etc.)
- priority: essential (must-have for the look), recommended (enhances the space), optional (nice additions)
- boundingBox: approximate location in the image as percentages { x: 0-100, y: 0-100, width: 0-100, height: 0-100 }

IMPORTANT: For all wall_color items, you MUST provide an accurate hexCode field with the paint color in hex format.

Return JSON:
{
  "items": [...],
  "fullDescription": "A comprehensive 2-3 sentence description of the entire room design, style, and atmosphere",
  "dominantStyle": "primary design style",
  "colorPalette": ["#hexcode1", "#hexcode2", ...]
}`,
              },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 5000,
      }),
    });

    if (!visionResponse.ok) {
      throw new Error(`Vision API error: ${visionResponse.status}`);
    }

    const visionData = await visionResponse.json();
    const textContent = visionData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let analysis: {
      items: ExtractedItem[];
      fullDescription: string;
      dominantStyle: string;
      colorPalette: string[];
    } | null = null;

    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        analysis = JSON.parse(jsonMatch[0]);
      } catch {
        console.error("Failed to parse AI response as JSON");
      }
    }

    if (!analysis) {
      throw new Error("Failed to extract items from image");
    }

    console.log(`Extracted ${analysis.items.length} items from design`);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all shop products for matching
    const { data: shopProducts } = await supabase
      .from("shop_products")
      .select(`
        id, name, category, style, 
        shop_id
      `)
      .eq("is_active", true);

    // Get business profiles with cities for location matching
    const { data: businessProfiles } = await supabase
      .from("business_profiles")
      .select("user_id, city, business_name");

    const shopCityMap = new Map(
      businessProfiles?.map((bp) => [bp.user_id, bp.city?.toLowerCase()]) || []
    );

    const userCityLower = userCity?.toLowerCase();

    // Process each item and find matches
    const itemsWithMatches = analysis.items.map((item) => {
      let matchedProductId: string | null = null;
      let googleShoppingUrl: string | null = null;
      let googleImagesUrl: string | null = null;

      // Try to find a matching product from local shops
      const matchingProducts = shopProducts?.filter((p) => {
        const categoryMatch = p.category?.toLowerCase().includes(item.itemType.replace("_", " ")) ||
          item.itemName.toLowerCase().includes(p.category?.toLowerCase() || "");
        const styleMatch = !item.style || !p.style || 
          p.style?.toLowerCase().includes(item.style.toLowerCase());
        return categoryMatch && styleMatch;
      }) || [];

      // Prioritize shops in user's city
      if (userCityLower && matchingProducts.length > 0) {
        const localMatch = matchingProducts.find((p) => {
          const shopCity = shopCityMap.get(p.shop_id);
          return shopCity === userCityLower;
        });
        
        if (localMatch) {
          matchedProductId = localMatch.id;
        } else if (matchingProducts.length > 0) {
          // Fallback to any matching product
          matchedProductId = matchingProducts[0].id;
        }
      } else if (matchingProducts.length > 0) {
        matchedProductId = matchingProducts[0].id;
      }

      // Build visual traits query for Google Images
      const visualTraits: string[] = [];
      
      // Add item name as base
      visualTraits.push(item.itemName);
      
      // Add color if available
      if (item.color) {
        visualTraits.push(item.color);
      }
      
      // Add material if available
      if (item.material) {
        visualTraits.push(item.material);
      }
      
      // Add style if available
      if (item.style) {
        visualTraits.push(item.style);
      }

      // Generate Bing Images URL for furniture items
      const furnitureTypes = ["furniture", "lighting", "textile", "decor"];
      if (furnitureTypes.includes(item.itemType)) {
        const imageQuery = encodeURIComponent(visualTraits.join(" ").trim());
        googleImagesUrl = `https://www.bing.com/images/search?q=${imageQuery}`;
      }

      // If no local match, generate Bing Shopping URL as fallback
      if (!matchedProductId) {
        const searchQuery = encodeURIComponent(
          `${item.itemName} ${item.material || ""} ${item.style || ""}`.trim()
        );
        googleShoppingUrl = `https://www.bing.com/shop?q=${searchQuery}`;
      }

      return {
        ...item,
        matchedProductId,
        googleShoppingUrl,
        googleImagesUrl,
      };
    });

    // Save items to database
    const { error: deleteError } = await supabase
      .from("design_items")
      .delete()
      .eq("design_id", designId);

    if (deleteError) {
      console.warn("Error clearing existing items:", deleteError);
    }

    const itemsToInsert = itemsWithMatches.map((item) => ({
      design_id: designId,
      item_type: item.itemType,
      item_name: item.itemName,
      item_description: item.itemDescription,
      color: item.hexCode || item.color, // Prefer hex code for wall colors
      material: item.material,
      style: item.style,
      priority: item.priority,
      matched_product_id: item.matchedProductId,
      google_shopping_url: item.googleShoppingUrl,
      google_images_url: item.googleImagesUrl,
    }));

    const { data: insertedItems, error: insertError } = await supabase
      .from("design_items")
      .insert(itemsToInsert)
      .select();

    if (insertError) {
      console.error("Error inserting items:", insertError);
    }

    // Update the generated_designs record with full description and lock it
    const { error: updateError } = await supabase
      .from("generated_designs")
      .update({
        is_locked: true,
        locked_at: new Date().toISOString(),
        full_description: analysis.fullDescription,
        extracted_items: analysis.items,
      })
      .eq("id", designId);

    if (updateError) {
      console.error("Error updating design:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        items: insertedItems || itemsWithMatches,
        fullDescription: analysis.fullDescription,
        dominantStyle: analysis.dominantStyle,
        colorPalette: analysis.colorPalette,
        message: `Extracted ${itemsWithMatches.length} items from your design`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Extract room items error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to extract items",
        items: [],
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
