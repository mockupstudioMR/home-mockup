import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      console.log(`[DEBUG] ${step}: ${detail}`);
    };

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
      
      const styleMapping: Record<string, string> = {
        "modern-minimal": "modern-minimal",
        "bohemian-eclectic": "bohemian-eclectic", 
        "glam-luxe": "glam-luxe",
        "rustic-nature": "rustic-nature",
        "mediterranean": "mediterranean",
        "classic-historical": "classic-historical",
      };
      
      const userStyle = styleMapping[requestData.stylePreference] || requestData.stylePreference;
      addDebug("Style mapping", `Mapped "${requestData.stylePreference}" → "${userStyle}"`);
      
      let { data: products } = await supabase
        .from("shop_products")
        .select("id, name, category, style, description, image_urls")
        .eq("is_active", true)
        .eq("style", userStyle)
        .limit(15);
      
      addDebug("Style-matched products", `Found ${products?.length || 0} products matching style "${userStyle}"`, 
        products?.map(p => ({ name: p.name, category: p.category, style: p.style }))
      );
      
      if (!products || products.length < 5) {
        addDebug("Fallback fetch", `Only ${products?.length || 0} style-matched, fetching additional products`);
        const { data: additionalProducts } = await supabase
          .from("shop_products")
          .select("id, name, category, style, description, image_urls")
          .eq("is_active", true)
          .neq("style", userStyle)
          .limit(10);
        
        addDebug("Additional products", `Found ${additionalProducts?.length || 0} additional products`,
          additionalProducts?.map(p => ({ name: p.name, category: p.category, style: p.style }))
        );
        
        products = [...(products || []), ...(additionalProducts || [])];
      }
      
      if (products && products.length > 0) {
        products = products.sort(() => Math.random() - 0.5);
      }
      
      products = products?.slice(0, 10) || [];

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
    
    if (enrichedRequestData.sourceImageUrl) {
      contentParts.push({ type: "image_url", image_url: { url: enrichedRequestData.sourceImageUrl } });
      addDebug("Source image", "Added source image to request");
    }
    
    if (enrichedRequestData.productImageUrls && enrichedRequestData.productImageUrls.length > 0) {
      for (const imageUrl of enrichedRequestData.productImageUrls) {
        contentParts.push({ type: "image_url", image_url: { url: imageUrl } });
      }
      addDebug("Product images", `Added ${enrichedRequestData.productImageUrls.length} product images to request`);
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
        addDebug("AI gateway error", `Status ${response.status}`, { errorText: errorText.slice(0, 200) });
        
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
      .replace(/\{\{furniture_list\}\}/g, furnitureList);
  };

  // Add furniture context prefix if we have furniture items from DB
  let furnitureContext = "";
  if (furnitureItems.length > 0 && templates["furniture_context"]) {
    furnitureContext = fillTemplate(templates["furniture_context"]) + " ";
  }

  // Determine which template to use
  if (data.modificationPrompt) {
    const tpl = templates["modification"] || 
      `Modify this interior design image: {{modification_prompt}}. Maintain the {{style}} style with {{colors}}. {{product_instructions}} Ultra high resolution, photorealistic interior design photography.`;
    return furnitureContext + fillTemplate(tpl);
  }

  const hasProductImages = data.productImageUrls && data.productImageUrls.length > 0;
  
  if (hasProductImages) {
    const tpl = templates["with_product_images"] || 
      `Create a stunning {{style}} {{room}} interior design that prominently features ALL the products shown in the reference images. {{product_instructions}} Use {{colors}}. Create a {{budget}} aesthetic. {{elements}} The products must appear EXACTLY as they look in the reference images - same colors, textures, and design details. Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality, 16:9 aspect ratio.`;
    return furnitureContext + fillTemplate(tpl);
  }

  if (data.sourceImageUrl) {
    const tpl = templates["with_source_image"] || 
      `Transform this room into a beautiful {{style}} {{room}} design. Use {{colors}}. Create a {{budget}} aesthetic. {{elements}} {{product_instructions}} Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality.`;
    return furnitureContext + fillTemplate(tpl);
  }

  const tpl = templates["default"] || 
    `Generate a stunning {{style}} {{room}} interior design. Use {{colors}}. Create a {{budget}} aesthetic. {{elements}} {{product_instructions}} Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality, 16:9 aspect ratio.`;
  return furnitureContext + fillTemplate(tpl);
}
