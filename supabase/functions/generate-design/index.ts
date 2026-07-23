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

// Normalize product objects coming from different client flows.
// AnalyzeProducts sends { productName, category, description }; AnalyzeRoom's
// must-include products use the same shape. Older callers use { name, type }.
function normalizeProduct(p: any): any {
  if (!p) return p;
  return {
    ...p,
    name: p.name || p.productName || p.label || "Item",
    type: p.type || p.category || "furniture",
    category: p.category || p.type || "furniture",
  };
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
  refinementLayer?: "architecture" | "furniture" | "decor";
  lockedLayers?: string[];
  selectedProducts?: ProductInfo[];
  productImageUrls?: string[];
  existingRoomImages?: string[];
  isScenePreview?: boolean;
  selectedInspirations?: string[];
  inspirationDetails?: { label: string; description: string; type: string }[];
  detectedColors?: string[];
  detectedKeywords?: string[];
  moodboardDescription?: string;
  /** User-curated moodboard materials/textures (with optional reference images). */
  moodboardMaterials?: { label: string; imageUrl?: string }[];
  /** User-curated moodboard style references (with optional reference images). */
  moodboardReferences?: { label: string; imageUrl?: string }[];
  /** Furniture inspiration uploads — "use similar furniture in style/silhouette". */
  furnitureReferences?: { label: string; imageUrl?: string }[];
  /** Decor inspiration uploads — accessories, textiles, lighting, art. "Use similar decor". */
  decorReferences?: { label: string; imageUrl?: string }[];
  /** Items the user marked as MUST-INCLUDE — exact match required (same color, material, shape). */
  mustIncludeItems?: { label: string; imageUrl?: string }[];
  /** Public URLs of the moodboard images for the user-selected style(s). The model
   * uses these as visual references for color palette, materials and furniture vibe. */
  styleImageUrls?: string[];
  keepElements?: string[];
  changeElements?: string[];
  floorPlanContext?: {
    shape?: string;
    dimensions?: Record<string, number>;
    roomType?: string;
    furnitureItems?: string[];
    openings?: { type: string; wall: string; position: number }[];
    walls?: { wall: string; surface?: string; openings?: { type: string; position_pct: number }[] }[];
    style?: string;
    layout?: {
      name?: string;
      description?: string;
      items?: { label: string; x: number; y: number; w: number; h: number; reason?: string }[];
    };
    feedback?: { item: string; agreed?: boolean | null; note?: string | null }[];
  };
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
    
    // Collect must-include image URLs (user-pinned "must keeps" from moodboard).
    // These get the HIGHEST visual priority — always attached first.
    const mustIncludeUrls = (enrichedRequestData.mustIncludeItems || [])
      .map((m) => m.imageUrl)
      .filter(Boolean) as string[];

    // Merge must-include images into productImageUrls so every must-keep is
    // referenced by the model regardless of the branch below.
    const combinedProductUrls = [
      ...mustIncludeUrls,
      ...((enrichedRequestData.productImageUrls || []).filter(
        (u) => !mustIncludeUrls.includes(u),
      )),
    ];

    // Validate and collect product images
    const maxProductImages = Math.max(3, mustIncludeUrls.length + 2);
    let validProductImageUrls: string[] = [];
    if (combinedProductUrls.length > 0) {
      const candidateUrls = combinedProductUrls.slice(0, maxProductImages + 2);

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
    } else if (enrichedRequestData.modificationPrompt) {
      // Modification mode: ONLY send the source design image so the edit is applied verbatim
      if (enrichedRequestData.sourceImageUrl) {
        contentParts.push({ type: "image_url", image_url: { url: enrichedRequestData.sourceImageUrl } });
        addDebug("Modification mode", "Sending ONLY source image — feedback applied verbatim, no extra context");
      }
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

      // Must-include images are already at the FRONT of validProductImageUrls
      // (see combinedProductUrls above). The strict must-include prompt block
      // references them as "the first N attached images".
      for (const imageUrl of validProductImageUrls) {
        contentParts.push({ type: "image_url", image_url: { url: imageUrl } });
      }
      if (validProductImageUrls.length > 0) {
        addDebug(
          "Product + must-include images",
          `Added ${validProductImageUrls.length} image(s); must-include first: ${mustIncludeUrls.length}`,
        );
      }

      // Style moodboard images for the user-selected style(s) — visual references
      // for color palette, materials and furniture vibe. Cap at 3 to avoid context bloat.
      if (enrichedRequestData.styleImageUrls && enrichedRequestData.styleImageUrls.length > 0) {
        const styleImgs = enrichedRequestData.styleImageUrls.slice(0, 2);
        for (const imgUrl of styleImgs) {
          contentParts.push({ type: "image_url", image_url: { url: imgUrl } });
        }
        addDebug("Style moodboard images", `Added ${styleImgs.length} style reference image(s) to request`);
      }

      // Furniture references — inspiration
      const furnImgs = (enrichedRequestData.furnitureReferences || [])
        .map((f) => f.imageUrl).filter(Boolean).slice(0, 2) as string[];
      for (const u of furnImgs) contentParts.push({ type: "image_url", image_url: { url: u } });
      if (furnImgs.length > 0) addDebug("Furniture references", `Added ${furnImgs.length} furniture inspiration image(s)`);

      // Decor references — inspiration
      const decorImgs = (enrichedRequestData.decorReferences || [])
        .map((d) => d.imageUrl).filter(Boolean).slice(0, 2) as string[];
      for (const u of decorImgs) contentParts.push({ type: "image_url", image_url: { url: u } });
      if (decorImgs.length > 0) addDebug("Decor references", `Added ${decorImgs.length} decor inspiration image(s)`);
    }

    const messages: any[] = [
      {
        role: "user",
        content: contentParts.length > 1 ? contentParts : prompt
      }
    ];

    // Use the dedicated image-edit model for modifications (better preservation of unchanged areas)
    const modelToUse = enrichedRequestData.modificationPrompt
      ? "google/gemini-3.1-flash-image-preview"
      : "google/gemini-3-pro-image-preview";
    addDebug("AI request prepared", `Model: ${modelToUse}, ${contentParts.length} content parts`);

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
          model: modelToUse,
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
        let rawText: string | null = await response.text();
        if (!rawText || rawText.trim().length === 0) {
          addDebug("Empty response body", `Attempt ${attempt} returned empty body`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            continue;
          }
          throw new Error("AI gateway returned empty response after all attempts");
        }
        data = JSON.parse(rawText);
        // Free the raw string immediately — base64 images make it multi-MB
        rawText = null;
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

  // Support multiple style preferences (comma-separated). Fuse all selected styles into the prompt.
  const styleTokens = (data.stylePreference || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const mappedStyles = styleTokens.length > 0
    ? styleTokens.map((s) => styleMap[s] || s.replace(/[-_]/g, " "))
    : [styleMap[data.stylePreference] || data.stylePreference];
  const style = mappedStyles.length > 1
    ? `a thoughtful fusion of ${mappedStyles.slice(0, -1).join(", ")} and ${mappedStyles[mappedStyles.length - 1]} — blend characteristic elements from each style cohesively`
    : mappedStyles[0];
  const colors = colorMap[data.colorPalette] || data.colorPalette;
  const room = roomMap[data.roomType] || data.roomType;
  const budget = budgetMap[data.budgetFeel] || data.budgetFeel;
  const elements = data.mustHaveElements?.length 
    ? `Include these elements: ${data.mustHaveElements.join(", ")}.` 
    : "";

  // Build detected colors context — the user's curated moodboard palette is the
  // single source of truth for color. It overrides any palette implied by the
  // attached style reference images.
  let detectedColorsContext = "";
  if (data.detectedColors && data.detectedColors.length > 0) {
    const colorList = data.detectedColors.join(", ");
    detectedColorsContext =
      `MANDATORY COLOR PALETTE (ABSOLUTE HIGHEST PRIORITY — overrides product images, style refs, and every other instruction): ` +
      `The final design MUST use ONLY these exact hex colors: ${colorList}. ` +
      `EVERY hex in this list must be CLEARLY visible in the final image — distribute them deliberately across walls (at least one wall in a palette color), large textiles (rugs, sofas, curtains, bedding), upholstery, wood/metal finishes, accents and decor so the palette reads unmistakably at first glance. ` +
      `Before finalizing, mentally check: is each of these colors present? If any is missing, ADD it (e.g. as a cushion, throw, vase, art, accent wall, lamp). ` +
      `Do NOT introduce ANY color outside this palette. If a reference image (product, style, decor) shows a different color, IGNORE its color and recolor that surface/object to the nearest palette hex. `;
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
  const mbMaterials = (data.moodboardMaterials || []).map((m) => m.label).filter(Boolean);
  const mbReferences = (data.moodboardReferences || []).map((r) => r.label).filter(Boolean);
  if (mbMaterials.length > 0) {
    moodboardContext += `MOODBOARD MATERIALS (must be visibly used in surfaces, textiles and finishes): ${mbMaterials.join(", ")}. `;
  }
  if (mbReferences.length > 0) {
    moodboardContext += `MOODBOARD STYLE REFERENCES (mirror their look & feel and signature pieces): ${mbReferences.join(", ")}. `;
  }

  // Furniture references — INSPIRATION (use similar pieces in style/silhouette/material)
  const furnRefs = (data.furnitureReferences || []).filter((f) => f.label || f.imageUrl);
  if (furnRefs.length > 0) {
    const labels = furnRefs.map((f) => f.label).filter(Boolean).join(", ");
    moodboardContext += `FURNITURE INSPIRATION (use SIMILAR furniture pieces — match the style, silhouette, proportions, materials and overall vibe of the attached furniture reference image(s)${labels ? ` labeled: ${labels}` : ""}. Do NOT copy them exactly — translate their character into pieces that fit this room): treat the attached furniture reference images as the primary guide for sofa/chair/table/bed/storage selection. `;
  }

  // Decor references — INSPIRATION (use similar accessories, textiles, lighting)
  const decorRefs = (data.decorReferences || []).filter((d) => d.label || d.imageUrl);
  if (decorRefs.length > 0) {
    const labels = decorRefs.map((d) => d.label).filter(Boolean).join(", ");
    moodboardContext += `DECOR INSPIRATION (use SIMILAR accessories, textiles and lighting — lamps, vases, art, cushions, rugs, throws — matching the style, color story and material feel of the attached decor reference image(s)${labels ? ` labeled: ${labels}` : ""}): the room's accessories, soft furnishings and lighting should clearly echo the spirit of these decor references. `;
  }

  // Must-include — EXACT match required
  const mustHaves = (data.mustIncludeItems || []).filter((m) => m.label || m.imageUrl);
  if (mustHaves.length > 0) {
    const labels = mustHaves.map((m) => m.label).filter(Boolean).join(", ");
    const count = mustHaves.length;
    moodboardContext += `🔒 MUST-INCLUDE ITEMS — NON-NEGOTIABLE (HIGHEST PRIORITY, OVERRIDES EVERYTHING ELSE): The user has pinned ${count} specific item(s) that MUST appear in the final design EXACTLY as shown in their attached reference image(s) — IDENTICAL color, IDENTICAL material, IDENTICAL shape, IDENTICAL finish, IDENTICAL proportions. The first ${Math.min(count, 4)} attached image(s) are these must-include items — treat them as locked anchors and build the rest of the room AROUND them. Do NOT substitute, restyle, recolor or reinterpret them in any way. Place them prominently and naturally in the ${room}. Items: ${labels}. If you cannot fit a must-include item, REMOVE other furniture to make room — never drop a must-include item. `;
  }

  // Style moodboard images directive — tells the model how to read the attached
  // style reference images (palette, materials, furniture vibe) without copying them literally.
  let styleImagesDirective = "";
  if (data.styleImageUrls && data.styleImageUrls.length > 0) {
    const n = Math.min(data.styleImageUrls.length, 3);
    const paletteOverride = (data.detectedColors && data.detectedColors.length > 0)
      ? `Use these images for materials, textures, lighting mood and furniture silhouettes ONLY — do NOT copy their colors. The MANDATORY COLOR PALETTE above takes absolute priority over any colors visible in these references. `
      : "";
    styleImagesDirective =
      n > 1
        ? `STYLE INSPIRATION IMAGES: ${n} reference moodboards are attached representing the user's chosen styles. Study them carefully and FUSE their materials (wood tones, metals, textiles), patterns, lighting mood and characteristic furniture silhouettes into a single cohesive design. ${paletteOverride}Do NOT replicate any single image — synthesize the shared spirit across all of them. `
        : `STYLE INSPIRATION IMAGE: A reference moodboard is attached representing the user's chosen style. Use it as the primary visual guide for materials, textiles, lighting mood and characteristic furniture silhouettes. ${paletteOverride}Do NOT copy it literally — translate its spirit into the user's room. `;
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

  const isExistingRoomRedesign = !!(data.existingRoomImages && data.existingRoomImages.length > 0);

  // Build a strong architectural directive from the floor plan context
  // (room shape, dimensions, walls, doors/windows/balconies, planned furniture
  // placements with reasons + user feedback).
  let floorPlanDirective = "";
  const fp = data.floorPlanContext;
  if (fp && !isExistingRoomRedesign) {
    const parts: string[] = [];
    parts.push("ARCHITECTURAL FLOOR PLAN DIRECTIVE — the rendered room MUST match this exact plan:");

    if (fp.shape) parts.push(`Room shape: ${fp.shape}.`);
    if (fp.dimensions) {
      const dims = Object.entries(fp.dimensions).map(([k, v]) => `${k}=${v}m`).join(", ");
      parts.push(`Dimensions: ${dims}.`);
    }

    // Walls + openings (preferred richer description)
    if (fp.walls && fp.walls.length > 0) {
      const wallLines = fp.walls.map((w) => {
        const ops = (w.openings || []).map((o) => `${o.type} at ~${Math.round(o.position_pct)}% along this wall`).join(", ");
        const surf = w.surface && w.surface !== "flat" ? `, surface: ${w.surface}` : "";
        return `- ${w.wall} wall${surf}${ops ? `, openings: ${ops}` : ", no openings"}`;
      });
      parts.push(`Walls (clockwise from north/top):\n${wallLines.join("\n")}`);
    } else if (fp.openings && fp.openings.length > 0) {
      const ops = fp.openings.map((o) => `${o.type} on ${o.wall} wall at ~${Math.round(o.position)}% along the wall`).join("; ");
      parts.push(`Openings: ${ops}.`);
    }

    // Planned furniture placements with reasons
    if (fp.layout?.items && fp.layout.items.length > 0) {
      const placement = fp.layout.items.map((it) => {
        const horiz = it.x < 33 ? "left" : it.x > 66 ? "right" : "center";
        const vert = it.y < 33 ? "back/north" : it.y > 66 ? "front/south" : "middle";
        const reason = it.reason ? ` — ${it.reason}` : "";
        return `- ${it.label}: placed at ${horiz}-${vert} of the room (x≈${Math.round(it.x)}%, y≈${Math.round(it.y)}%, size ≈${Math.round(it.w)}%×${Math.round(it.h)}%)${reason}`;
      });
      parts.push(`Planned furniture placements (top-down):\n${placement.join("\n")}`);
      if (fp.layout.name || fp.layout.description) {
        parts.push(`Layout concept: ${fp.layout.name || ""}${fp.layout.description ? ` — ${fp.layout.description}` : ""}`);
      }
    }

    // Incorporate user feedback (disagreements & notes)
    const fb = (fp.feedback || []).filter((f) => f.agreed === false || (f.note && f.note.trim()));
    if (fb.length > 0) {
      const fbLines = fb.map((f) => {
        const flag = f.agreed === false ? "[user disagreed]" : "[user note]";
        return `- ${flag} ${f.item}${f.note ? `: "${f.note}"` : ""}`;
      });
      parts.push(`User feedback to honor when placing items:\n${fbLines.join("\n")}`);
    }

    parts.push(
      "Render a photorealistic interior view that faithfully matches this plan: place every listed piece of furniture in the indicated position relative to the walls and openings. Respect doors (keep clear), windows (let natural light in), and balconies (clear access). Do NOT invent extra furniture and do NOT relocate items."
    );

    floorPlanDirective = parts.join("\n") + "\n\n";
  }

  // Build product inclusion instructions
  let productInstructions = "";
  if (!isExistingRoomRedesign && data.selectedProducts && data.selectedProducts.length > 0) {
    const productList = data.selectedProducts
      .map(p => `${p.name} (${p.category})${p.description ? `: ${p.description}` : ""}`)
      .join("; ");
    
    const exclusivityNote = data.furnitureSource === "shop_only" 
      ? " IMPORTANT: Use ONLY these products - do not add any other furniture that is not in this list."
      : "";
    
    productInstructions = `CRITICAL: You MUST include ALL of these exact products in the design, keeping their original appearance, colors, and details exactly as shown in the reference images: ${productList}. These products must be prominently featured and clearly visible in the final room design.${exclusivityNote}`;
  }

  // Build furniture context from DB config
  // Merge user must-include items into the effective whitelist so the strict
  // "ABSOLUTELY NOTHING ELSE" rule does not cause the model to drop them.
  const mustIncludeLabels = (data.mustIncludeItems || [])
    .map((m) => (m.label || "").trim())
    .filter(Boolean);
  const dedupedFurniture = [...furnitureItems];
  for (const label of mustIncludeLabels) {
    const lower = label.toLowerCase();
    if (!dedupedFurniture.some((f) => f.toLowerCase() === lower)) {
      dedupedFurniture.push(label);
    }
  }
  const furnitureList = dedupedFurniture.length > 0 ? dedupedFurniture.join(", ") : "";
  const effectiveCount = dedupedFurniture.length;

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
      .replace(/\{\{moodboard_context\}\}/g, styleImagesDirective + moodboardContext);
  };

  // Add furniture context prefix if we have furniture items from DB
  let furnitureContext = "";
  if (dedupedFurniture.length > 0 && !isExistingRoomRedesign) {
    if (templates["furniture_context"]) {
      furnitureContext = fillTemplate(templates["furniture_context"]) + " ";
    } else {
      const mustNote = mustIncludeLabels.length > 0
        ? `NOTE: The following items in this whitelist are USER MUST-INCLUDE items and MUST appear EXACTLY as shown in the attached must-include reference images (identical color, material, shape, finish): [${mustIncludeLabels.join(", ")}]. They override style/moodboard interpretation. `
        : "";
      furnitureContext = `ABSOLUTE FURNITURE WHITELIST (HIGHEST PRIORITY — OVERRIDES STYLE, MOODBOARD, AND ALL OTHER INSTRUCTIONS): The ${room} must contain EXACTLY ONE of each of these items and ABSOLUTELY NOTHING ELSE: [${furnitureList}]. ${mustNote}` +
        `RULES: ` +
        `(1) Total furniture pieces in the final image MUST equal ${effectiveCount}. ` +
        `(2) Every item in the list must appear exactly once. ` +
        `(3) Do NOT add ANY piece that is not on the list — no extra ottomans, side tables, benches, poufs, accent chairs, stools, consoles, sideboards, plants in pots, room dividers, bar carts, magazine racks, floor cushions, additional rugs, additional lamps, or any other furniture/decor object not explicitly named. ` +
        `(4) Do NOT duplicate any item (no second sofa, no sectional + extra couch, no pair of armchairs unless "armchair" appears twice in the list). ` +
        `(5) Wall art, curtains, and a single ceiling light are allowed only if natural to the room; everything that stands on the floor MUST be on the list. ` +
        `(6) Before finalizing, count every standing/seating/surface object in the scene — if the count does not match ${effectiveCount}, REMOVE the extras (but NEVER remove a must-include item). ` +
        `(7) Style and moodboard references control LOOK ONLY (color, material, silhouette) — they NEVER add new objects. ` +
        `(8) Must-include items are LOCKED — if there is a conflict, drop a non-must-include whitelist item before dropping a must-include one. ` +
        `Violating this whitelist is a hard failure. `;
    }
  }

  // Modification: surgical image edit. Preserve everything except the requested change.
  if (data.modificationPrompt) {
    let layerDirective = "";
    if (data.refinementLayer === "architecture") {
      layerDirective = ` LAYER SCOPE — ARCHITECTURE ONLY: Modify ONLY walls, ceiling, floor, trim, moldings, paint, wallpaper, and architectural finishes. Every piece of furniture and every decor item (lighting, rugs, art, plants, accessories, pillows, throws, vases) MUST stay pixel-identical in position, identity, color, material, and proportion.`;
    } else if (data.refinementLayer === "furniture") {
      layerDirective = ` LAYER SCOPE — FURNITURE ONLY: Modify ONLY furniture (sofa, chairs, bed, tables, storage, shelving) as instructed. Walls, ceiling, floor, paint, wallpaper, trim, and ALL architectural finishes MUST stay pixel-identical. All decor items (lighting fixtures, rugs, art, plants, pillows, accessories) must also remain unchanged in position and appearance.`;
    } else if (data.refinementLayer === "decor") {
      layerDirective = ` LAYER SCOPE — DECOR ONLY: Modify ONLY decor items (lighting, rugs, art, plants, pillows, throws, mirrors, vases, accessories) as instructed. ALL furniture (sofa, chairs, bed, tables, storage) AND ALL architecture (walls, ceiling, floor, finishes, trim) MUST stay pixel-identical in identity, position, color, and material.`;
    }
    // LAYOUT mode: rearrange only — every existing item must remain, identical in appearance.
    if (data.modificationType === "layout") {
      return `LAYOUT REARRANGEMENT of the attached image. Apply ONLY this spatial change: "${data.modificationPrompt}". STRICT ITEM PRESERVATION: Every single piece of furniture, every decor item, every accessory, every plant, every art piece, every rug, every lamp, every textile visible in the attached image MUST appear in the output — identical in identity, model, color, material, texture, proportion, and visual design. Do NOT add new items. Do NOT remove items. Do NOT substitute any item for a different one. Do NOT restyle, recolor, or redesign any item. ONLY change the spatial positions/orientations of items as instructed. Architecture (walls, floor, ceiling, windows, doors, trim, paint, wallpaper) MUST stay pixel-identical. Camera angle, perspective, framing, aspect ratio, lighting direction, and color temperature MUST stay identical. Think of it as physically picking up the existing pieces and placing them in new spots within the same photograph.`;
    }
    return `SURGICAL EDIT of the attached image. Apply ONLY this single change: "${data.modificationPrompt}".${layerDirective} Treat the rest of the image as a locked reference — do NOT regenerate, restyle, recolor, relight, reframe, or rearrange anything else. Pixel-level preservation required for: camera angle, perspective, framing, aspect ratio, walls, floor, ceiling, windows, doors, lighting direction & color temperature, shadows, all furniture not mentioned in the change, all decor, textures, materials, plants, art, and overall composition. The output must look like the original photograph with ONLY the requested element modified — as if edited in Photoshop, not regenerated.`;
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
      keepChangeDirective += `ELEMENTS TO RESTYLE (apply the new ${style} aesthetic to these — change their color, material, texture, or finish to match the target style): ${data.changeElements.join("; ")}. `;
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
    return furnitureContext + floorPlanDirective + fillTemplate(tpl);
  }

  if (data.sourceImageUrl) {
    const tpl = templates["with_source_image"] || 
      `Transform this room into a beautiful {{style}} {{room}} design. {{detected_colors}}{{detected_keywords}}{{moodboard_context}}{{inspiration_context}}Use {{colors}}. Create a {{budget}} aesthetic. {{elements}} {{product_instructions}} Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality.`;
    return furnitureContext + floorPlanDirective + fillTemplate(tpl);
  }

  const tpl = templates["default"] || 
    `Generate a stunning {{style}} {{room}} interior design. {{detected_colors}}{{detected_keywords}}{{moodboard_context}}{{inspiration_context}}Use {{colors}}. Create a {{budget}} aesthetic. {{elements}} {{product_instructions}} Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality, 16:9 aspect ratio.`;
  return furnitureContext + floorPlanDirective + fillTemplate(tpl);
}
