import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

serve(async (req) => {
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

    const requestData: GenerateRequest = await req.json();

    // If furniture source is "shop_only", fetch products from the database
    let shopProducts: ProductInfo[] = [];
    let shopProductImageUrls: string[] = [];

    if (requestData.furnitureSource === "shop_only" && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      console.log("Fetching shop products for exclusive use...");
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Map style preference to database style values
      const styleMapping: Record<string, string> = {
        "modern-minimal": "modern-minimal",
        "bohemian-eclectic": "bohemian-eclectic", 
        "glam-luxe": "glam-luxe",
        "rustic-nature": "rustic-nature",
        "mediterranean": "mediterranean",
        "classic-historical": "classic-historical",
      };
      
      const userStyle = styleMapping[requestData.stylePreference] || requestData.stylePreference;
      console.log(`Filtering products by style: ${userStyle}`);
      
      // First try to get products matching the user's style preference
      let { data: products } = await supabase
        .from("shop_products")
        .select("id, name, category, style, description, image_urls")
        .eq("is_active", true)
        .eq("style", userStyle)
        .limit(15);
      
      // If not enough style-matched products, also fetch some general products
      if (!products || products.length < 5) {
        console.log(`Only ${products?.length || 0} style-matched products, fetching additional...`);
        const { data: additionalProducts } = await supabase
          .from("shop_products")
          .select("id, name, category, style, description, image_urls")
          .eq("is_active", true)
          .neq("style", userStyle)
          .limit(10);
        
        products = [...(products || []), ...(additionalProducts || [])];
      }
      
      // Shuffle products to show variety each time
      if (products && products.length > 0) {
        products = products.sort(() => Math.random() - 0.5);
      }
      
      // Take top 10 after shuffling
      products = products?.slice(0, 10) || [];

      if (products && products.length > 0) {
        shopProducts = products.map(p => ({
          name: p.name,
          category: p.category,
          style: p.style || undefined,
          description: p.description || undefined,
          image_urls: p.image_urls || [],
        }));

        // Collect image URLs from shop products
        for (const product of products) {
          if (product.image_urls && product.image_urls.length > 0) {
            shopProductImageUrls.push(product.image_urls[0]); // Use first image
          }
        }

        console.log(`Found ${shopProducts.length} shop products to include`);
      }
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

    // Update request data with shop products
    const enrichedRequestData = {
      ...requestData,
      selectedProducts: allProducts.length > 0 ? allProducts : requestData.selectedProducts,
      productImageUrls: allProductImageUrls.length > 0 ? allProductImageUrls : requestData.productImageUrls,
    };

    // Build the image generation prompt
    let prompt = buildImagePrompt(enrichedRequestData);

    // Prepare messages for image generation
    const contentParts: any[] = [{ type: "text", text: prompt }];
    
    // Add source image if provided
    if (enrichedRequestData.sourceImageUrl) {
      contentParts.push({ type: "image_url", image_url: { url: enrichedRequestData.sourceImageUrl } });
    }
    
    // Add product images if provided - these must be included exactly
    if (enrichedRequestData.productImageUrls && enrichedRequestData.productImageUrls.length > 0) {
      for (const imageUrl of enrichedRequestData.productImageUrls) {
        contentParts.push({ type: "image_url", image_url: { url: imageUrl } });
      }
    }

    const messages: any[] = [
      {
        role: "user",
        content: contentParts.length > 1 ? contentParts : prompt
      }
    ];

    console.log("Generating image with prompt:", prompt);

    // Retry logic for image generation
    let imageUrl: string | undefined;
    let textContent = "";
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Image generation attempt ${attempt}/${maxRetries}`);
      
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
          return new Response(
            JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Payment required, please add funds." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        
        // Only retry on 5xx errors
        if (response.status >= 500 && attempt < maxRetries) {
          console.log("Server error, retrying...");
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      console.log("AI response received");

      // Extract image from response
      imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      textContent = data.choices?.[0]?.message?.content || "";

      if (imageUrl) {
        console.log("Image generated successfully");
        break;
      }
      
      console.log("No image in response, retrying...");
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    if (!imageUrl) {
      throw new Error("Failed to generate image after multiple attempts. Please try again.");
    }

    return new Response(
      JSON.stringify({ 
        imageUrl, 
        description: textContent,
        prompt 
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

function buildImagePrompt(data: GenerateRequest): string {
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

  if (data.modificationPrompt) {
    return `Modify this interior design image: ${data.modificationPrompt}. Maintain the ${style} style with ${colors}. ${productInstructions} Ultra high resolution, photorealistic interior design photography.`;
  }

  const hasProductImages = data.productImageUrls && data.productImageUrls.length > 0;
  
  if (hasProductImages) {
    return `Create a stunning ${style} ${room} interior design that prominently features ALL the products shown in the reference images. ${productInstructions} Use ${colors}. Create a ${budget} aesthetic. ${elements} The products must appear EXACTLY as they look in the reference images - same colors, textures, and design details. Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality, 16:9 aspect ratio.`;
  }

  const basePrompt = data.sourceImageUrl
    ? `Transform this room into a beautiful ${style} ${room} design. Use ${colors}. Create a ${budget} aesthetic. ${elements} ${productInstructions} Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality.`
    : `Generate a stunning ${style} ${room} interior design. Use ${colors}. Create a ${budget} aesthetic. ${elements} ${productInstructions} Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality, 16:9 aspect ratio.`;

  return basePrompt;
}
