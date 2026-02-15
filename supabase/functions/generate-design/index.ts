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
  category: string;
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
  selectedProducts?: ProductInfo[];
  productImageUrls?: string[];
  existingRoomImages?: string[];
  selectedInspirations?: string[];
  detectedColors?: string[];
  detectedKeywords?: string[];
  moodboardDescription?: string;
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

    if (requestData.furnitureSource === "shop_only" && supabase) {
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
          .select("id, name, category, style, description, image_urls")
          .eq("is_active", true)
          .in("style", matchedStyles)
          .limit(30);
        
        let rawStyleProducts = styleProducts || [];
        addDebug("Style-matched products (raw)", `Found ${rawStyleProducts.length} before furniture filter`, 
          rawStyleProducts.map(p => ({ name: p.name, category: p.category, style: p.style }))
        );

        // Filter style-matched products against the approved furniture list
        if (roomFurnitureItems.length > 0) {
          const approvedLower = roomFurnitureItems.map(f => f.toLowerCase());
          rawStyleProducts = rawStyleProducts.filter(p => {
            const catLower = (p.category || "").toLowerCase();
            const nameLower = (p.name || "").toLowerCase();
            return approvedLower.some(approved => 
              catLower.includes(approved) || approved.includes(catLower) ||
              nameLower.includes(approved) || approved.includes(nameLower)
            );
          });
          addDebug("Style-matched products (filtered)", `${rawStyleProducts.length} products match approved furniture list`, {
            approvedFurniture: roomFurnitureItems,
            filtered: rawStyleProducts.map(p => ({ name: p.name, category: p.category })),
          });
        }

        products = rawStyleProducts;
      }
      
      addDebug("Style-matched products", `Final ${products.length} products after style+furniture filter`, 
        products.map(p => ({ name: p.name, category: p.category, style: p.style }))
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
            .select("id, name, category, style, description, image_urls")
            .eq("is_active", true)
            .not("style", "in", `(${excludeStyles.join(",")})`)
            .limit(30);
          
          // Filter candidates to only include products whose category matches approved furniture items
          const approvedLower = roomFurnitureItems.map(f => f.toLowerCase());
          additionalProducts = (candidates || []).filter(p => {
            const catLower = (p.category || "").toLowerCase();
            const nameLower = (p.name || "").toLowerCase();
            return approvedLower.some(approved => 
              catLower.includes(approved) || approved.includes(catLower) ||
              nameLower.includes(approved) || approved.includes(nameLower)
            );
          });
          
          addDebug("Furniture-filtered additional products", `${additionalProducts.length} products match approved furniture list`, {
            approvedFurniture: roomFurnitureItems,
            matchedProducts: additionalProducts.map(p => ({ name: p.name, category: p.category })),
          });
        } else {
          // No furniture config - fetch any additional products
          const excludeStyles = matchedStyles.length > 0 ? matchedStyles : ["__none__"];
          const { data: fallbackProducts } = await supabase
            .from("shop_products")
            .select("id, name, category, style, description, image_urls")
            .eq("is_active", true)
            .not("style", "in", `(${excludeStyles.join(",")})`)
            .limit(10);
          
          additionalProducts = fallbackProducts || [];
        }
        
        addDebug("Additional products", `Found ${additionalProducts.length} additional products`,
          additionalProducts.map(p => ({ name: p.name, category: p.category, style: p.style }))
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
      addDebug("Product fetch", `Skipped (furnitureSource: "${requestData.furnitureSource}")`);
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
    
    // Add existing room images first (highest priority reference)
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
    
    // Validate and limit product images to avoid 400 errors
    const maxProductImages = 4;
    if (enrichedRequestData.productImageUrls && enrichedRequestData.productImageUrls.length > 0) {
      const candidateUrls = enrichedRequestData.productImageUrls.slice(0, maxProductImages + 2); // check extras in case some fail
      const validImageUrls: string[] = [];
      
      // Validate each image URL with a HEAD request
      for (const imageUrl of candidateUrls) {
        if (validImageUrls.length >= maxProductImages) break;
        try {
          const headResp = await fetch(imageUrl, { method: "HEAD", redirect: "follow" });
          if (headResp.ok) {
            validImageUrls.push(imageUrl);
          } else {
            addDebug("Image validation", `Skipping broken image (HTTP ${headResp.status}): ${imageUrl.slice(0, 100)}`);
          }
        } catch (e) {
          addDebug("Image validation", `Skipping unreachable image: ${imageUrl.slice(0, 100)}`);
        }
      }
      
      for (const imageUrl of validImageUrls) {
        contentParts.push({ type: "image_url", image_url: { url: imageUrl } });
      }
      addDebug("Product images", `Added ${validImageUrls.length}/${enrichedRequestData.productImageUrls.length} product images to request (max ${maxProductImages}, ${candidateUrls.length - validImageUrls.length} skipped)`);
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

      const data = await response.json();

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
    const furnitureInspirations: string[] = [];
    const moodboardInspirations: string[] = [];
    
    const furnitureForStyleMap: Record<string, string> = {
      "modern-minimal": "Sculptural Lounge Chair",
      "classic-historical": "Antique Armoire",
      "bohemian-eclectic": "Rattan Peacock Chair",
      "rustic-nature": "Live Edge Wood Table",
      "mediterranean": "Wrought Iron Daybed",
      "glam-luxe": "Velvet Statement Sofa",
    };
    
    for (const id of data.selectedInspirations) {
      if (id.startsWith("furniture-")) {
        // Extract style index and map to furniture name
        const idx = parseInt(id.replace("furniture-", ""), 10);
        // We don't have the full style list here, but the furniture names are deterministic
        furnitureInspirations.push(`accent furniture piece #${idx + 1}`);
      } else if (id.startsWith("moodboard-")) {
        moodboardInspirations.push(`moodboard inspiration #${parseInt(id.replace("moodboard-", ""), 10) + 1}`);
      }
    }
    
    const parts: string[] = [];
    if (furnitureInspirations.length > 0) {
      parts.push(`Incorporate accent furniture inspired by the user's selected pieces (${furnitureInspirations.length} selected)`);
    }
    if (moodboardInspirations.length > 0) {
      parts.push(`Draw from the user's selected moodboard inspirations (${moodboardInspirations.length} selected) to guide the overall aesthetic, textures, and material choices`);
    }
    if (parts.length > 0) {
      inspirationContext = `STYLE INSPIRATION CONTEXT: ${parts.join(". ")}. Blend these selected inspirations naturally into a cohesive design. `;
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
    const tpl = templates["modification"] || 
      `STRICT POSITIONAL CONSTRAINT: You MUST keep every single piece of furniture, decor item, and object in the EXACT SAME position, size, angle, and arrangement as the original image. Do NOT move, remove, add, rearrange, or resize any element. The spatial layout, composition, and placement of all items must remain pixel-perfect identical. ONLY change the visual styling as requested: {{modification_prompt}}. Apply {{style}} style with {{colors}}. {{product_instructions}} The result must look like the exact same photo with only the surface styling/textures/colors changed — every object stays precisely where it is. Ultra high resolution, photorealistic interior design photography.`;
    return furnitureContext + fillTemplate(tpl);
  }

  // Existing room redesign - allow layout/furniture rearrangement to match new style
  if (data.existingRoomImages && data.existingRoomImages.length > 0) {
    const tpl = templates["existing_room_redesign"] ||
      `ROOM REDESIGN INSTRUCTION: Study the attached photos of the existing room carefully. Preserve the architectural shell — walls, ceiling, floor shape, windows, doors, alcoves, and columns must stay in their exact positions. However, you ARE free to completely rearrange, replace, add, or remove furniture and decor to best suit the new {{style}} aesthetic. {{detected_colors}}{{detected_keywords}}{{moodboard_context}}{{inspiration_context}}Use {{colors}}. Create a {{budget}} look with an optimal furniture layout for this room's dimensions and architecture. {{elements}} {{product_instructions}} The final image should feel like a professional redesign of the same physical space — same room structure, but with a fresh, well-arranged interior. Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality, 16:9 aspect ratio.`;
    return furnitureContext + fillTemplate(tpl);
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
