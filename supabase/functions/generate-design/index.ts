import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VERSION = "v2.3.0";
const DEPLOYED_AT = "2026-02-06T12:30:00Z";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProductInfo {
  name: string;
  type: string;
  style?: string;
  description?: string;
  image_urls?: string[];
}

interface GenerateRequest {
  stylePreference: string;
  colorPalette: string;
  roomType: string;
  budgetFeel: string;
  mustHaveElements: string[];
  furnitureSource?: "shop_only" | "open";
  sourceImageUrl?: string;
  modificationPrompt?: string;
  modificationType?: "color_material" | "swap_item" | "add_remove" | "layout";
  selectedProducts?: ProductInfo[];
  productImageUrls?: string[];
  existingRoomImages?: string[];
  isScenePreview?: boolean;
  selectedInspirations?: string[];
  inspirationDetails?: { label: string; description: string; type: string }[];
  detectedColors?: string[];
  detectedKeywords?: string[];
  moodboardDescription?: string;
  keepElements?: string[];
  changeElements?: string[];
}

interface DebugStep {
  timestamp: string;
  step: string;
  detail: string;
  data?: unknown;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const debugSteps: DebugStep[] = [];
    const addDebug = (step: string, detail: string, data?: unknown) => {
      debugSteps.push({ timestamp: new Date().toISOString(), step, detail, data });
      console.log(`[${VERSION}] ${step}: ${detail}`);
    };

    addDebug("Version", `${VERSION} deployed at ${DEPLOYED_AT}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const requestData: GenerateRequest = await req.json();
    addDebug("Request received", "Quiz data parsed", {
      stylePreference: requestData.stylePreference,
      colorPalette: requestData.colorPalette,
      roomType: requestData.roomType,
      budgetFeel: requestData.budgetFeel,
      mustHaveElements: requestData.mustHaveElements,
      furnitureSource: requestData.furnitureSource,
      hasSourceImage: !!requestData.sourceImageUrl,
      hasModificationPrompt: !!requestData.modificationPrompt,
      selectedProductsCount: requestData.selectedProducts?.length || 0,
      productImageUrlsCount: requestData.productImageUrls?.length || 0,
      existingRoomImagesCount: requestData.existingRoomImages?.length || 0,
      detectedColorsCount: requestData.detectedColors?.length || 0,
      detectedColors: requestData.detectedColors,
      detectedKeywordsCount: requestData.detectedKeywords?.length || 0,
      detectedKeywords: requestData.detectedKeywords,
      hasMoodboardDescription: !!requestData.moodboardDescription,
    });

    // Create supabase client for DB queries
    const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
      ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
      : null;

    // Fetch prompt templates and room furniture config from DB
    let promptTemplates: Record<string, string> = {};
    let roomFurnitureItems: string[] = [];

    if (supabase) {
      // Fetch prompt templates
      const { data: templates } = await supabase
        .from("prompt_templates")
        .select("template_key, template");

      if (templates) {
        for (const t of templates) {
          promptTemplates[t.template_key] = t.template;
        }
        addDebug("Prompt templates loaded", `${templates.length} templates from database`, Object.keys(promptTemplates));
      }

      // Fetch furniture config for this room type
      const { data: roomConfig } = await supabase
        .from("room_furniture_config")
        .select("furniture_items")
        .eq("room_type", requestData.roomType)
        .maybeSingle();

      if (roomConfig) {
        roomFurnitureItems = roomConfig.furniture_items || [];
        addDebug("Room furniture loaded", `${roomFurnitureItems.length} items for "${requestData.roomType}"`, roomFurnitureItems);
      }
    }

    // If furniture source is "shop_only", fetch products from the database
    let shopProducts: ProductInfo[] = [];
    let shopProductImageUrls: string[] = [];

    if (requestData.furnitureSource === "shop_only" && supabase && !(requestData.existingRoomImages && requestData.existingRoomImages.length > 0)) {
      addDebug("Product fetch", "Fetching shop products (shop_only mode)");
      
      // Normalize style preference: handle underscores, hyphens, ampersands, spaces
      const normalizeStyle = (s: string): string => {
        return s.toLowerCase().replace(/[_&\s]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      };
      
      const normalizedInput = normalizeStyle(requestData.stylePreference);
      
      // Extract individual keywords from the style for partial matching
      const styleKeywords = normalizedInput.split("-").filter(Boolean);
      
      // Canonical style values in the DB
      const canonicalStyles = [
        "modern-minimal", "bohemian-eclectic", "glam-luxe",
        "rustic-nature", "mediterranean", "classic-historical",
        "modern", "bohemian", "modern minimal",
      ];
      
      // Find best matching canonical style(s)
      const matchedStyles = canonicalStyles.filter(canonical => {
        const normalizedCanonical = normalizeStyle(canonical);
        // Exact match after normalization
        if (normalizedCanonical === normalizedInput) return true;
        // Check if any keyword from user input appears in the canonical style
        return styleKeywords.some(kw => normalizedCanonical.includes(kw));
      });
      
      addDebug("Style mapping", `Input "${requestData.stylePreference}" → normalized "${normalizedInput}" → matched styles: [${matchedStyles.join(", ")}]`);
      
      // Fetch products matching any of the resolved styles
      let products: any[] = [];
      
      if (matchedStyles.length > 0) {
        const { data: styleProducts } = await supabase
          .from("shop_products")
          .select("id, name, type, style, description, image_urls")
          .eq("is_active", true)
          .in("style", matchedStyles)
          .limit(30);
        
        let rawStyleProducts = styleProducts || [];
        addDebug("Style-matched products (raw)", `Found ${rawStyleProducts.length} before furniture filter`, 
          rawStyleProducts.map(p => ({ name: p.name, type: p.type, style: p.style }))
        );

        // Filter style-matched products against the approved furniture list
        if (roomFurnitureItems.length > 0) {
          const approvedLower = roomFurnitureItems.map(f => f.toLowerCase());
          rawStyleProducts = rawStyleProducts.filter(p => {
            const catLower = (p.type || "").toLowerCase();
            const nameLower = (p.name || "").toLowerCase();
            return approvedLower.some(approved => 
              catLower.includes(approved) || approved.includes(catLower) ||
              nameLower.includes(approved) || approved.includes(nameLower)
            );
          });
          addDebug("Style-matched products (filtered)", `${rawStyleProducts.length} products match approved furniture list`, {
            approvedFurniture: roomFurnitureItems,
            filtered: rawStyleProducts.map(p => ({ name: p.name, type: p.type })),
          });
        }

        products = rawStyleProducts;
      }
      
      addDebug("Style-matched products", `Final ${products.length} products after style+furniture filter`, 
        products.map(p => ({ name: p.name, type: p.type, style: p.style }))
      );
      
      if (products.length < 5) {
        addDebug("Fallback fetch", `Only ${products.length} style-matched, fetching additional products`);
        
        // Build category filter from approved furniture list if available
        let additionalProducts: any[] = [];
        
        if (roomFurnitureItems.length > 0) {
          // Fetch all active products not already matched, then filter by approved furniture categories
          const excludeStyles = matchedStyles.length > 0 ? matchedStyles : ["__none__"];
          const { data: candidates } = await supabase
            .from("shop_products")
            .select("id, name, type, style, description, image_urls")
            .eq("is_active", true)
            .not("style", "in", `(${excludeStyles.join(",")})`)
            .limit(30);
          
          // Filter candidates to only include products whose category matches approved furniture items
          const approvedLower = roomFurnitureItems.map(f => f.toLowerCase());
          additionalProducts = (candidates || []).filter(p => {
            const catLower = (p.type || "").toLowerCase();
            const nameLower = (p.name || "").toLowerCase();
            return approvedLower.some(approved => 
              catLower.includes(approved) || approved.includes(catLower) ||
              nameLower.includes(approved) || approved.includes(nameLower)
            );
          });
          
          addDebug("Furniture-filtered additional products", `${additionalProducts.length} products match approved furniture list`, {
            approvedFurniture: roomFurnitureItems,
            matchedProducts: additionalProducts.map(p => ({ name: p.name, type: p.type })),
          });
        } else {
          // No furniture config - fetch any additional products
          const excludeStyles = matchedStyles.length > 0 ? matchedStyles : ["__none__"];
          const { data: fallbackProducts } = await supabase
            .from("shop_products")
            .select("id, name, type, style, description, image_urls")
            .eq("is_active", true)
            .not("style", "in", `(${excludeStyles.join(",")})`)
            .limit(10);
          
          additionalProducts = fallbackProducts || [];
        }
        
        addDebug("Additional products", `Found ${additionalProducts.length} additional products`,
          additionalProducts.map(p => ({ name: p.name, type: p.type, style: p.style }))
        );
        
        products = [...products, ...additionalProducts];
      }
      
      if (products && products.length > 0) {
        products = products.sort(() => Math.random() - 0.5);
      }
      
      products = products?.slice(0, 6) || [];

      addDebug("Final product selection", `Selected ${products.length} products after shuffle`,
        products.map(p => ({ name: p.name, category: p.category, style: p.style, hasImage: !!(p.image_urls?.length) }))
      );

      if (products && products.length > 0) {
        shopProducts = products.map(p => ({
          name: p.name,
          category: p.category,
          style: p.style || undefined,
          description: p.description || undefined,
          image_urls: p.image_urls || [],
        }));

        for (const product of products) {
          if (product.image_urls && product.image_urls.length > 0) {
            shopProductImageUrls.push(product.image_urls[0]);
          }
        }

        addDebug("Product images", `Collected ${shopProductImageUrls.length} product image URLs`);
      }
    } else {
      addDebug(
        "Product fetch",
        requestData.existingRoomImages && requestData.existingRoomImages.length > 0
          ? "Skipped for existing-room preservation mode"
          : `Skipped (furnitureSource: "${requestData.furnitureSource}")`
      );
    }

    // Merge shop products with any explicitly selected products
    const allProducts = [
      ...(requestData.selectedProducts || []),
      ...shopProducts,
    ];
    const allProductImageUrls = [
      ...(requestData.productImageUrls || []),
      ...shopProductImageUrls,
    ];

    addDebug("Product merge", `Total products: ${allProducts.length} (${requestData.selectedProducts?.length || 0} selected + ${shopProducts.length} shop)`, {
      totalProducts: allProducts.length,
      totalImageUrls: allProductImageUrls.length,
    });

    const enrichedRequestData = {
      ...requestData,
      selectedProducts: allProducts.length > 0 ? allProducts : requestData.selectedProducts,
      productImageUrls: allProductImageUrls.length > 0 ? allProductImageUrls : requestData.productImageUrls,
    };

    // Build the image generation prompt using DB templates
    let prompt = buildImagePrompt(enrichedRequestData, promptTemplates, roomFurnitureItems);
    addDebug("Prompt built", `${prompt.length} chars`, { prompt });

    // Prepare messages for image generation
    const contentParts: any[] = [{ type: "text", text: prompt }];
    
    // For scene previews: send product images FIRST so the AI sees the exact products,
    // then the scene image as layout reference
    const isScenePreviewMode = enrichedRequestData.isScenePreview && enrichedRequestData.existingRoomImages?.length;
    
    // Validate and collect product images
    const maxProductImages = 4;
    let validProductImageUrls: string[] = [];
    if (enrichedRequestData.productImageUrls && enrichedRequestData.productImageUrls.length > 0) {
      const candidateUrls = enrichedRequestData.productImageUrls.slice(0, maxProductImages + 2);
      
      for (const imageUrl of candidateUrls) {
        if (validProductImageUrls.length >= maxProductImages) break;
        try {
          const headResp = await fetch(imageUrl, { method: "HEAD", redirect: "follow" });
          if (headResp.ok) {
            validProductImageUrls.push(imageUrl);
          } else {
            addDebug("Image validation", `Skipping broken image (HTTP ${headResp.status}): ${imageUrl.slice(0, 100)}`);
          }
        } catch (e) {
          addDebug("Image validation", `Skipping unreachable image: ${imageUrl.slice(0, 100)}`);
        }
      }
    }

    if (isScenePreviewMode) {
      // Scene preview mode: product images first, then scene layout image
      for (const imageUrl of validProductImageUrls) {
        contentParts.push({ type: "image_url", image_url: { url: imageUrl } });
      }
      if (validProductImageUrls.length > 0) {
        addDebug("Product images (scene mode)", `Added ${validProductImageUrls.length} product reference images BEFORE scene layout`);
      }
      for (const imgUrl of enrichedRequestData.existingRoomImages!.slice(0, 4)) {
        contentParts.push({ type: "image_url", image_url: { url: imgUrl } });
      }
      addDebug("Scene layout image", `Added scene reference after product images`);
    } else {
      // Normal mode: existing room images first, then products
      if (enrichedRequestData.existingRoomImages && enrichedRequestData.existingRoomImages.length > 0) {
        for (const imgUrl of enrichedRequestData.existingRoomImages.slice(0, 4)) {
          contentParts.push({ type: "image_url", image_url: { url: imgUrl } });
        }
        addDebug("Existing room images", `Added ${Math.min(enrichedRequestData.existingRoomImages.length, 4)} existing room photos to request`);
      }

      if (enrichedRequestData.sourceImageUrl) {
        contentParts.push({ type: "image_url", image_url: { url: enrichedRequestData.sourceImageUrl } });
        addDebug("Source image", "Added source image to request");
      }
      
      for (const imageUrl of validProductImageUrls) {
        contentParts.push({ type: "image_url", image_url: { url: imageUrl } });
      }
      if (validProductImageUrls.length > 0) {
        addDebug("Product images", `Added ${validProductImageUrls.length}/${enrichedRequestData.productImageUrls!.length} product images to request`);
      }
    }

    const messages: any[] = [
      {
        role: "user",
        content: contentParts.length > 1 ? contentParts : prompt
      }
    ];

    addDebug("AI request prepared", `Model: google/gemini-3-pro-image-preview, ${contentParts.length} content parts`);

    // Retry logic for image generation
    let imageUrl: string | undefined;
    let textContent = "";
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      addDebug("AI generation attempt", `Attempt ${attempt}/${maxRetries}`);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages,
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          addDebug("Rate limited", "429 Too Many Requests");
          return new Response(
            JSON.stringify({ error: "Rate limits exceeded, please try again later.", debugSteps }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          addDebug("Payment required", "402 Payment Required");
          return new Response(
            JSON.stringify({ error: "Payment required, please add funds.", debugSteps }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        addDebug("AI gateway error", `Status ${response.status}`, { errorText: errorText.slice(0, 1000) });
        console.error(`AI gateway error body: ${errorText.slice(0, 1000)}`);
        
        if (response.status >= 500 && attempt < maxRetries) {
          addDebug("Retrying", `Server error ${response.status}, waiting ${attempt}s`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      let data: any;
      try {
        const rawText = await response.text();
        if (!rawText || rawText.trim().length === 0) {
          addDebug("Empty response body", `Attempt ${attempt} returned empty body`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          throw new Error("AI gateway returned empty response after all attempts");
        }
        data = JSON.parse(rawText);
      } catch (parseErr) {
        if (parseErr instanceof SyntaxError) {
          addDebug("JSON parse error", `Attempt ${attempt}: ${parseErr.message}`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          throw new Error("AI gateway returned invalid JSON after all attempts");
        }
        throw parseErr;
      }

      imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      textContent = data.choices?.[0]?.message?.content || "";

      if (imageUrl) {
        addDebug("Image generated", `Success on attempt ${attempt}`, { 
          hasTextContent: !!textContent,
          textContentPreview: textContent.slice(0, 100),
        });
        break;
      }
      
      addDebug("No image in response", `Attempt ${attempt} returned text only, retrying...`);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    if (!imageUrl) {
      addDebug("Generation failed", "No image after all attempts");
      throw new Error("Failed to generate image after multiple attempts. Please try again.");
    }

    addDebug("Complete", `Pipeline finished successfully`);

    return new Response(
      JSON.stringify({ 
        imageUrl, 
        description: textContent,
        prompt,
        debugSteps,
        _version: VERSION,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate design error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate design" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildImagePrompt(
  data: GenerateRequest,
  templates: Record<string, string>,
  furnitureItems: string[]
): string {
  const styleMap: Record<string, string> = {
    modern: "modern contemporary",
    minimalist: "minimalist Scandinavian",
    bohemian: "bohemian eclectic with global influences",
    traditional: "traditional elegant",
    industrial: "industrial with exposed materials",
    "classic-historical": "classic historical with ornate details",
    "modern-minimal": "modern minimalist with clean lines",
    "rustic-nature": "rustic natural with organic materials",
    "mediterranean": "Mediterranean coastal with warm tones",
    "bohemian-eclectic": "bohemian eclectic with global textiles",
    "glam-luxe": "glamorous luxe with metallic accents",
  };

  const colorMap: Record<string, string> = {
    neutral: "neutral earthy tones with warm beiges and soft grays",
    cool: "cool serene palette with calming blues and soft greens",
    warm: "warm cozy colors with terracotta and golden yellows",
    bold: "bold vibrant jewel tones with dramatic contrasts",
    monochrome: "sophisticated monochrome black, white, and gray",
  };

  const roomMap: Record<string, string> = {
    "living-room": "living room",
    bedroom: "bedroom",
    kitchen: "kitchen",
    office: "home office",
    bathroom: "bathroom",
  };

  const budgetMap: Record<string, string> = {
    "budget-friendly": "affordable and stylish",
    "mid-range": "quality mid-range",
    luxury: "luxurious high-end designer",
  };

  const style = styleMap[data.stylePreference] || data.stylePreference;
  const colors = colorMap[data.colorPalette] || data.colorPalette;
  const room = roomMap[data.roomType] || data.roomType;
  const budget = budgetMap[data.budgetFeel] || data.budgetFeel;
  const elements = data.mustHaveElements?.length 
    ? `Include these elements: ${data.mustHaveElements.join(", ")}.` 
    : "";

  // Build detected colors context
  let detectedColorsContext = "";
  if (data.detectedColors && data.detectedColors.length > 0) {
    detectedColorsContext = `COLOR PALETTE DIRECTIVE: Use these specific colors as the dominant palette throughout the design: ${data.detectedColors.join(", ")}. These colors should be prominently visible in walls, textiles, furniture, and accents. `;
  }

  // Build detected keywords/visual elements context
  let detectedKeywordsContext = "";
  if (data.detectedKeywords && data.detectedKeywords.length > 0) {
    const uniqueKeywords = [...new Set(data.detectedKeywords)];
    detectedKeywordsContext = `VISUAL ELEMENTS DIRECTIVE: Incorporate these specific design elements and characteristics: ${uniqueKeywords.join(", ")}. These should be clearly reflected in the materials, textures, patterns, and overall aesthetic of the room. `;
  }

  // Build moodboard description context
  let moodboardContext = "";
  if (data.moodboardDescription) {
    moodboardContext = `STYLE NARRATIVE: ${data.moodboardDescription} `;
  }

  // Build inspiration context from selected moodboard/furniture items
  let inspirationContext = "";
  if (data.selectedInspirations && data.selectedInspirations.length > 0) {
    const furnitureDescriptions: string[] = [];
    const moodboardDescriptions: string[] = [];

    // Use actual details passed from the frontend when available
    const detailsById: Record<string, { label: string; description: string; type: string }> = {};
    if (data.inspirationDetails) {
      for (const d of data.inspirationDetails) {
        // Match by type since IDs may differ
        detailsById[d.type] = d;
      }
    }

    for (const id of data.selectedInspirations) {
      if (id.startsWith("furniture-")) {
        const detail = detailsById["accentFurniture"];
        if (detail) {
          furnitureDescriptions.push(`a ${detail.label}: ${detail.description}`);
        } else {
          furnitureDescriptions.push("a designer accent furniture piece matching the chosen style");
        }
      } else if (id.startsWith("moodboard-")) {
        const detail = detailsById["moodboard"];
        if (detail) {
          moodboardDescriptions.push(`${detail.label}: ${detail.description}`);
        } else {
          const keywordSubset = data.detectedKeywords?.slice(0, 6) || [];
          if (keywordSubset.length > 0) {
            moodboardDescriptions.push(`moodboard featuring ${keywordSubset.join(", ")}`);
          } else {
            moodboardDescriptions.push("curated moodboard matching the selected style aesthetic");
          }
        }
      }
    }
    
    const parts: string[] = [];
    if (furnitureDescriptions.length > 0) {
      parts.push(`ACCENT FURNITURE DIRECTIVE: You MUST include these specific accent pieces exactly as described: ${furnitureDescriptions.join("; ")}`);
    }
    if (moodboardDescriptions.length > 0) {
      parts.push(`MOODBOARD AESTHETIC DIRECTIVE: Follow the aesthetic of: ${moodboardDescriptions.join("; ")} — use these as guides for textures, materials, patterns, and overall visual language`);
    }
    if (parts.length > 0) {
      inspirationContext = `${parts.join(". ")}. `;
    }
  }

  // Build product inclusion instructions
  let productInstructions = "";
  if (data.selectedProducts && data.selectedProducts.length > 0) {
    const productList = data.selectedProducts
      .map(p => `${p.name} (${p.category})${p.description ? `: ${p.description}` : ""}`)
      .join("; ");
    
    const exclusivityNote = data.furnitureSource === "shop_only" 
      ? " IMPORTANT: Use ONLY these products - do not add any other furniture that is not in this list."
      : "";
    
    productInstructions = `CRITICAL: You MUST include ALL of these exact products in the design, keeping their original appearance, colors, and details exactly as shown in the reference images: ${productList}. These products must be prominently featured and clearly visible in the final room design.${exclusivityNote}`;
  }

  // Build furniture context from DB config
  const furnitureList = furnitureItems.length > 0 ? furnitureItems.join(", ") : "";

  // Helper to replace template variables
  const fillTemplate = (template: string): string => {
    return template
      .replace(/\{\{style\}\}/g, style)
      .replace(/\{\{room\}\}/g, room)
      .replace(/\{\{colors\}\}/g, colors)
      .replace(/\{\{budget\}\}/g, budget)
      .replace(/\{\{elements\}\}/g, elements)
      .replace(/\{\{product_instructions\}\}/g, productInstructions)
      .replace(/\{\{modification_prompt\}\}/g, data.modificationPrompt || "")
      .replace(/\{\{furniture_list\}\}/g, furnitureList)
      .replace(/\{\{inspiration_context\}\}/g, inspirationContext)
      .replace(/\{\{detected_colors\}\}/g, detectedColorsContext)
      .replace(/\{\{detected_keywords\}\}/g, detectedKeywordsContext)
      .replace(/\{\{moodboard_context\}\}/g, moodboardContext);
  };

  // Add furniture context prefix if we have furniture items from DB
  let furnitureContext = "";
  if (furnitureItems.length > 0) {
    if (templates["furniture_context"]) {
      furnitureContext = fillTemplate(templates["furniture_context"]) + " ";
    } else {
      furnitureContext = `STRICT FURNITURE CONSTRAINT: The ${room} must ONLY contain furniture from this approved list: ${furnitureList}. Do NOT add any furniture items that are not on this list. `;
    }
  }

  // Determine which template to use
  if (data.modificationPrompt) {
    const modType = data.modificationType || "color_material";

    const modTemplates: Record<string, string> = {
      color_material:
        `ABSOLUTE PRESERVATION CONSTRAINT: You MUST keep every single piece of furniture, decor item, object, and architectural element in the EXACT SAME position, size, angle, proportion, and arrangement as the original image. The spatial layout, composition, perspective, camera angle, lighting direction, and placement of ALL items must remain pixel-perfect identical. Do NOT move, remove, add, rearrange, resize, or alter the shape of any element. ONLY change the following visual property as requested: {{modification_prompt}}. The result must look like the exact same photograph with ONLY the specified color, fabric, texture, or material changed on the mentioned item(s) — every other object and surface stays precisely as-is with zero changes. Ultra high resolution, photorealistic interior design photography.`,
      swap_item:
        `STRICT LAYOUT PRESERVATION: Keep the EXACT same room layout, camera angle, lighting, and all furniture positions identical to the original image. Every item that is NOT mentioned in the swap request must remain pixel-perfect unchanged in position, size, color, material, and appearance. ONLY replace the specifically mentioned item: {{modification_prompt}}. The replacement item must occupy the same spatial footprint and position as the original. All other furniture, decor, walls, floors, and architectural elements must be absolutely identical. Ultra high resolution, photorealistic interior design photography.`,
      add_remove:
        `STRICT SCENE PRESERVATION: Keep the EXACT same room layout, camera angle, perspective, lighting direction, and ALL existing furniture positions, sizes, colors, and materials pixel-perfect identical to the original image. Do NOT move, resize, recolor, or alter ANY existing element. ONLY perform this addition or removal: {{modification_prompt}}. If adding, place the new item naturally without disturbing anything else. If removing, fill the space naturally with the background (wall, floor) that would logically be behind it. Every other object stays precisely where it is with zero changes. Ultra high resolution, photorealistic interior design photography.`,
      layout:
        `ROOM SHELL PRESERVATION: Keep the architectural shell — walls, ceiling, floor, windows, doors, and room dimensions — identical to the original image. You ARE allowed to rearrange, reposition, and move furniture as requested: {{modification_prompt}}. Apply {{style}} style with {{colors}}. {{product_instructions}} Maintain the same camera perspective and lighting quality. Ultra high resolution, photorealistic interior design photography.`,
    };

    const tpl = templates[`modification_${modType}`] || modTemplates[modType] || modTemplates["color_material"];
    return furnitureContext + fillTemplate(tpl);
  }

  // Scene preview refinement - reproduce the exact scene with the exact same products
  if (data.isScenePreview && data.existingRoomImages && data.existingRoomImages.length > 0) {
    // Build explicit product appearance descriptions from the uploaded product images
    const productAppearanceInstructions = data.selectedProducts && data.selectedProducts.length > 0
      ? `PRODUCT FIDELITY REQUIREMENT: The following products are shown in the attached reference product images. You MUST include each one in the final image with EXACTLY the same appearance — same shape, same color, same texture, same material, same proportions as shown in the product reference photos: ${data.selectedProducts.map(p => `"${p.name}" (${p.category}${p.description ? ` - ${p.description}` : ""})`).join("; ")}. These products must be clearly recognizable and identical to their reference photos. Do NOT substitute, alter, or reimagine any product.`
      : productInstructions;

    const tpl = templates["scene_preview_refine"] ||
      `STRICT SCENE PRESERVATION WITH EXACT PRODUCTS: You are given TWO types of reference images: (1) a fully designed ${room} scene showing the layout and composition, and (2) individual product photos showing the exact furniture/items that MUST appear in the scene. REPRODUCE this exact scene layout — same camera angle, same spatial arrangement, same lighting direction, same composition. ${productAppearanceInstructions} Every product from the reference product photos must appear in the final image looking IDENTICAL to its reference — same colors, same materials, same design details, same proportions. The products must be placed in the same positions as shown in the scene reference. ${detectedColorsContext}${detectedKeywordsContext}The result must match both the scene layout AND the exact product appearances from the reference images. Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality, 16:9 aspect ratio.`;
    return furnitureContext + tpl;
  }

  // Existing room redesign - edit the actual room in place with keep/change preferences
  if (data.existingRoomImages && data.existingRoomImages.length > 0) {
    // Build keep/change directives from user selections
    let keepChangeDirective = "";
    if (data.keepElements && data.keepElements.length > 0) {
      keepChangeDirective += `ELEMENTS TO KEEP EXACTLY AS-IS (do NOT alter these in any way — same color, material, texture, position): ${data.keepElements.join("; ")}. `;
    }
    if (data.changeElements && data.changeElements.length > 0) {
      keepChangeDirective += `ELEMENTS TO RESTYLE (apply the new ${styleMap[data.stylePreference] || data.stylePreference} aesthetic to these — change their color, material, texture, or finish to match the target style): ${data.changeElements.join("; ")}. `;
    }
    if (!data.keepElements?.length && !data.changeElements?.length) {
      keepChangeDirective = "Re-skin ALL surface treatments (walls, floors, fabrics, textiles) with the new style while keeping every item in place. ";
    }

    const tpl = templates["existing_room_redesign"] ||
      `ABSOLUTE ROOM PRESERVATION — SELECTIVE STYLE EDIT: Study the attached photo(s) of the existing room with extreme care. You MUST reproduce this EXACT room — same camera angle, same perspective, same spatial layout, same lighting direction, same composition. Every piece of furniture, every object, every architectural element must remain in its EXACT position, size, angle, and proportion. Do NOT move, remove, add, rearrange, or resize ANY item. Do NOT replace any furniture with different furniture. The room must be pixel-perfect identical in layout and composition to the original photo. {{keep_change_directive}} Apply a {{style}} aesthetic ONLY to the elements marked for change. {{detected_colors}}{{detected_keywords}}{{moodboard_context}}{{inspiration_context}}Use {{colors}} for the restyled elements. Create a {{budget}} feel through material quality and finish choices — NOT by replacing furniture. {{elements}} {{product_instructions}} The final image must look like the EXACT SAME photograph of the EXACT SAME room with selective style changes applied only where specified. Ultra high resolution, photorealistic interior design photography, same lighting quality as original, 16:9 aspect ratio.`;
    
    const filled = fillTemplate(tpl).replace(/\{\{keep_change_directive\}\}/g, keepChangeDirective);
    return furnitureContext + filled;
  }

  const hasProductImages = data.productImageUrls && data.productImageUrls.length > 0;
  
  if (hasProductImages) {
    const tpl = templates["with_product_images"] || 
      `Create a stunning {{style}} {{room}} interior design that prominently features ALL the products shown in the reference images. {{product_instructions}} {{detected_colors}}{{detected_keywords}}{{moodboard_context}}{{inspiration_context}}Use {{colors}}. Create a {{budget}} aesthetic. {{elements}} The products must appear EXACTLY as they look in the reference images - same colors, textures, and design details. Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality, 16:9 aspect ratio.`;
    return furnitureContext + fillTemplate(tpl);
  }

  if (data.sourceImageUrl) {
    const tpl = templates["with_source_image"] || 
      `Transform this room into a beautiful {{style}} {{room}} design. {{detected_colors}}{{detected_keywords}}{{moodboard_context}}{{inspiration_context}}Use {{colors}}. Create a {{budget}} aesthetic. {{elements}} {{product_instructions}} Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality.`;
    return furnitureContext + fillTemplate(tpl);
  }

  const tpl = templates["default"] || 
    `Generate a stunning {{style}} {{room}} interior design. {{detected_colors}}{{detected_keywords}}{{moodboard_context}}{{inspiration_context}}Use {{colors}}. Create a {{budget}} aesthetic. {{elements}} {{product_instructions}} Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality, 16:9 aspect ratio.`;
  return furnitureContext + fillTemplate(tpl);
}
