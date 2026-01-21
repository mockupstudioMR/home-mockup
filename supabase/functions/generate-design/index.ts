import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProductInfo {
  name: string;
  category: string;
  style?: string;
  description?: string;
}

interface GenerateRequest {
  stylePreference: string;
  colorPalette: string;
  roomType: string;
  budgetFeel: string;
  mustHaveElements: string[];
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
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const requestData: GenerateRequest = await req.json();

    // Build the image generation prompt
    let prompt = buildImagePrompt(requestData);

    // Prepare messages for image generation
    const contentParts: any[] = [{ type: "text", text: prompt }];
    
    // Add source image if provided
    if (requestData.sourceImageUrl) {
      contentParts.push({ type: "image_url", image_url: { url: requestData.sourceImageUrl } });
    }
    
    // Add product images if provided - these must be included exactly
    if (requestData.productImageUrls && requestData.productImageUrls.length > 0) {
      for (const imageUrl of requestData.productImageUrls) {
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
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract image from response
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textContent = data.choices?.[0]?.message?.content || "";

    if (!imageUrl) {
      throw new Error("No image generated");
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
    productInstructions = `CRITICAL: You MUST include ALL of these exact products in the design, keeping their original appearance, colors, and details exactly as shown in the reference images: ${productList}. These products must be prominently featured and clearly visible in the final room design.`;
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
