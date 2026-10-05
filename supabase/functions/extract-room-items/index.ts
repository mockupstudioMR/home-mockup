import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { forbidUnlessDesignOwner, requireUser } from "../_shared/auth.ts";
import { fetchWithTimeout } from "../_shared/http.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

const DEFAULT_EXTRACT_PROMPT = `Analyze this interior design image comprehensively. Extract ONLY items that are CLEARLY VISIBLE in the image. Do NOT hallucinate, invent, or assume items that are not visually present. If you cannot see an item, do not include it.

Categories to look for (only if visible):
1. **Wall Elements**: wall color(s), paint finish, wallpaper patterns, wall textures
2. **Floor Elements**: flooring type (hardwood, tile, carpet, etc.), color, material
3. **Ceiling Elements**: ceiling type, color, any fixtures
4. **Furniture**: ALL furniture pieces (sofas, chairs, tables, beds, storage, etc.)
5. **Lighting**: lamps, chandeliers, sconces, natural light elements
6. **Textiles**: rugs, curtains, cushions, throws, upholstery
7. **Decor**: artwork, mirrors, plants, vases, books, decorative objects
8. **Architectural Details**: moldings, doors, windows, fireplace

CRITICAL RULES:
- ONLY extract items you can actually SEE in the image. Every item must correspond to a specific visible object.
- Do NOT add generic filler items (e.g., "decorative objects", "accent pieces") unless you can point to a specific one.
- Do NOT guess what might be behind furniture or outside the frame.
- If an item is partially visible or unclear, note that in the description but still include it.
- Count items accurately: if there are 2 cushions, list 2. Do not invent a 3rd.

For EACH item, provide:
- itemType: Use a SPECIFIC type from this list: sofa, chair, table, bed, sideboard, shelf, wardrobe, lamp, rug, curtain, cushion, mirror, vase, plant, artwork, clock, stool, bench, desk, nightstand, dresser, chandelier, sconce, pendant, blanket, throw, planter, frame, fireplace, door, window, molding, backsplash, countertop, wall_color, floor_material, ceiling. Do NOT use broad categories like "furniture", "lighting", "textile", or "decor" — always pick the most specific type.
- itemName: specific name (e.g., "Cream White Wall Paint", "Oak Herringbone Floor", "Cord-Sofa Melva")
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
}`;

const DEFAULT_RETRY_PROMPT = `Look at this room image and list the main items you see. For itemType, use specific types like: sofa, chair, table, bed, sideboard, shelf, lamp, rug, curtain, cushion, mirror, vase, plant, artwork, wall_color, floor_material. Do NOT use broad types like "furniture" or "decor". Return ONLY valid JSON (no markdown):
{"items":[{"itemType":"sofa","itemName":"item name","itemDescription":"brief description","color":"color name","material":"material","style":"style","priority":"essential","boundingBox":{"x":10,"y":10,"width":20,"height":20}}],"fullDescription":"room description","dominantStyle":"modern","colorPalette":["#FFFFFF"]}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const caller = await requireUser(req, corsHeaders);
  if (caller instanceof Response) return caller;

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

    const denied = await forbidUnlessDesignOwner(caller, designId, corsHeaders);
    if (denied) return denied;

    console.log("Extracting items from design:", designId);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch prompt templates from DB
    let extractPrompt = DEFAULT_EXTRACT_PROMPT;
    let retryPrompt = DEFAULT_RETRY_PROMPT;

    const { data: templates } = await supabase
      .from("prompt_templates")
      .select("template_key, template")
      .in("template_key", ["extract_room_items", "extract_room_items_retry"]);

    if (templates) {
      for (const t of templates) {
        if (t.template_key === "extract_room_items") extractPrompt = t.template;
        if (t.template_key === "extract_room_items_retry") retryPrompt = t.template;
      }
      console.log(`Loaded ${templates.length} prompt templates from DB`);
    }

    // Use AI to analyze the image and extract all items
    const visionResponse = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              { type: "text", text: extractPrompt },
              { type: "image_url", image_url: { url: imageUrl } },
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

    // Helper to extract and repair JSON from AI response
    const extractAndParseJson = (text: string): typeof analysis => {
      let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "");
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No JSON object found in response");
        return null;
      }
      let jsonStr = jsonMatch[0];
      try {
        return JSON.parse(jsonStr);
      } catch (e) {
        console.log("Initial parse failed, attempting repair...");
        const openBrackets = (jsonStr.match(/\[/g) || []).length;
        const closeBrackets = (jsonStr.match(/]/g) || []).length;
        const openBraces = (jsonStr.match(/{/g) || []).length;
        const closeBraces = (jsonStr.match(/}/g) || []).length;
        for (let i = 0; i < openBrackets - closeBrackets; i++) jsonStr += "]";
        for (let i = 0; i < openBraces - closeBraces; i++) jsonStr += "}";
        jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1");
        try {
          return JSON.parse(jsonStr);
        } catch (e2) {
          console.error("JSON repair failed:", e2);
          return null;
        }
      }
    };

    let analysis: {
      items: ExtractedItem[];
      fullDescription: string;
      dominantStyle: string;
      colorPalette: string[];
    } | null = extractAndParseJson(textContent);

    // If parsing failed, retry with simpler prompt
    if (!analysis) {
      console.log("First attempt failed, retrying with simpler prompt...");
      const retryResponse = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                { type: "text", text: retryPrompt },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
          max_tokens: 4000,
        }),
      });
      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        const retryContent = retryData.choices?.[0]?.message?.content || "";
        analysis = extractAndParseJson(retryContent);
      }
    }

    if (!analysis || !analysis.items || analysis.items.length === 0) {
      console.log("AI extraction failed, using fallback items");
      analysis = {
        items: [
          { itemType: "furniture", itemName: "Room Furniture", itemDescription: "Main furniture pieces visible in the design", priority: "essential" as const },
          { itemType: "decor", itemName: "Decorative Elements", itemDescription: "Decorative accents and accessories", priority: "recommended" as const },
        ],
        fullDescription: "A beautifully designed room with carefully curated furniture and decor elements.",
        dominantStyle: "Contemporary",
        colorPalette: ["#E8DFD1", "#8B7355", "#FFFFFF"],
      };
    }

    console.log(`Extracted ${analysis.items.length} items from design`);

    // Get all shop products for matching
    const { data: shopProducts } = await supabase
      .from("shop_products")
      .select("id, name, type, style, shop_id")
      .eq("is_active", true);

    const { data: businessProfiles } = await supabase
      .from("business_profiles")
      .select("user_id, city, business_name");

    const shopCityMap = new Map(
      businessProfiles?.map((bp) => [bp.user_id, bp.city?.toLowerCase()]) || []
    );
    const userCityLower = userCity?.toLowerCase();

    // Type mapping: design item_type -> compatible product types
    const TYPE_COMPATIBILITY: Record<string, string[]> = {
      // Specific types map to themselves + close variants
      sofa: ["sofa"],
      chair: ["chair"],
      table: ["table"],
      bed: ["bed"],
      sideboard: ["sideboard"],
      shelf: ["shelf"],
      wardrobe: ["wardrobe"],
      desk: ["desk", "table"],
      nightstand: ["nightstand", "table"],
      dresser: ["dresser", "sideboard"],
      stool: ["stool", "chair"],
      bench: ["bench", "chair"],
      // Lighting
      lamp: ["lighting", "lamp"],
      chandelier: ["lighting"],
      sconce: ["lighting"],
      pendant: ["lighting"],
      // Textiles
      rug: ["rug", "textile"],
      curtain: ["curtain", "textile"],
      cushion: ["cushion", "textile"],
      blanket: ["textile"],
      throw: ["textile"],
      // Decor
      mirror: ["decor", "mirror"],
      vase: ["decor", "vase"],
      plant: ["decor", "plant"],
      planter: ["decor", "planter"],
      artwork: ["decor", "artwork"],
      clock: ["decor"],
      frame: ["decor"],
      // Broad fallbacks (in case AI still uses them)
      furniture: ["sofa", "chair", "table", "bed", "sideboard", "shelf", "wardrobe"],
      lighting: ["lighting"],
      textile: ["textile", "rug", "curtain", "cushion"],
      decor: ["decor"],
      // Non-shoppable
      wall_color: [],
      floor_material: [],
      ceiling: [],
      architectural: [],
      fireplace: [],
      door: [],
      window: [],
      molding: [],
      backsplash: [],
      countertop: [],
    };

    // Whole-word match helper to avoid substring false positives
    const matchesWholeWord = (text: string, keyword: string): boolean => {
      if (!keyword || keyword.length < 3) return false;
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(?:^|\\s|[^a-z])${escaped}(?:$|\\s|[^a-z])`, "i").test(` ${text} `);
    };

    // Process each item and find matches
    const usedProductIds = new Set<string>();
    const itemsWithMatches = analysis.items.map((item) => {
      let matchedProductId: string | null = null;
      let googleShoppingUrl: string | null = null;
      let googleImagesUrl: string | null = null;

      const compatibleTypes = TYPE_COMPATIBILITY[item.itemType] || [];
      const itemNameLower = item.itemName.toLowerCase();

      const matchingProducts = shopProducts?.filter((p) => {
        if (usedProductIds.has(p.id)) return false;
        const prodType = (p.type || "").toLowerCase();
        const prodName = (p.name || "").toLowerCase();

        // 1. Product type must be compatible with design item type
        const typeCompatible = compatibleTypes.length > 0 && compatibleTypes.includes(prodType);
        if (!typeCompatible) return false;

        // 2. Specific type match: product type should relate to item name
        //    e.g., "Ribbed Fabric Sofa" should match "sofa" products, not "bed"
        const specificTypeMatch =
          matchesWholeWord(itemNameLower, prodType) ||
          matchesWholeWord(prodName, itemNameLower.split(" ").pop() || "") ||
          prodType === "furniture"; // broad furniture type always compatible

        if (!specificTypeMatch) return false;

        // 3. Style match (loose)
        const styleMatch = !item.style || !p.style || 
          p.style?.toLowerCase().includes(item.style.toLowerCase());
        return styleMatch;
      }) || [];

      if (userCityLower && matchingProducts.length > 0) {
        const localMatch = matchingProducts.find((p) => {
          const shopCity = shopCityMap.get(p.shop_id);
          return shopCity === userCityLower;
        });
        matchedProductId = localMatch ? localMatch.id : matchingProducts[0].id;
      } else if (matchingProducts.length > 0) {
        matchedProductId = matchingProducts[0].id;
      }

      if (matchedProductId) usedProductIds.add(matchedProductId);

      const visualTraits: string[] = [item.itemName];
      if (item.color) visualTraits.push(item.color);
      if (item.material) visualTraits.push(item.material);
      if (item.style) visualTraits.push(item.style);

      const furnitureTypes = ["furniture", "lighting", "textile", "decor"];
      if (furnitureTypes.includes(item.itemType)) {
        const imageQuery = encodeURIComponent(visualTraits.join(" ").trim());
        googleImagesUrl = `https://www.bing.com/images/search?q=${imageQuery}`;
      }

      if (!matchedProductId) {
        const searchQuery = encodeURIComponent(
          `${item.itemName} ${item.material || ""} ${item.style || ""}`.trim()
        );
        googleShoppingUrl = `https://www.bing.com/shop?q=${searchQuery}`;
      }

      return { ...item, matchedProductId, googleShoppingUrl, googleImagesUrl };
    });

    // Save items to database
    const { error: deleteError } = await supabase
      .from("design_items")
      .delete()
      .eq("design_id", designId);
    if (deleteError) console.warn("Error clearing existing items:", deleteError);

    const itemsToInsert = itemsWithMatches.map((item) => ({
      design_id: designId,
      item_type: item.itemType,
      item_name: item.itemName,
      item_description: item.itemDescription,
      color: item.color,
      hex_code: item.hexCode,
      material: item.material,
      style: item.style,
      priority: item.priority,
      matched_product_id: item.matchedProductId,
      google_shopping_url: item.googleShoppingUrl,
      google_images_url: item.googleImagesUrl,
      bounding_box: item.boundingBox,
    }));

    const { data: insertedItems, error: insertError } = await supabase
      .from("design_items")
      .insert(itemsToInsert)
      .select();
    if (insertError) console.error("Error inserting items:", insertError);

    const { error: updateError } = await supabase
      .from("generated_designs")
      .update({
        is_locked: true,
        locked_at: new Date().toISOString(),
        full_description: analysis.fullDescription,
        extracted_items: analysis.items,
      })
      .eq("id", designId);
    if (updateError) console.error("Error updating design:", updateError);

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
