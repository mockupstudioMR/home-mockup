import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HighlightRequest {
  type: "colorPalette" | "accentFurniture" | "moodboard";
  style: string;
  room: string;
  // For colorPalette
  colors?: string[];
  materials?: string[];
  // For accentFurniture
  furnitureName?: string;
  furnitureDescription?: string;
  // For moodboard
  elements?: string[];
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

    const data: HighlightRequest = await req.json();
    const prompt = buildHighlightPrompt(data);

    console.log(`Generating ${data.type} visual with prompt:`, prompt.substring(0, 200) + "...");

    // Retry logic for image generation
    let imageUrl: string | undefined;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Attempt ${attempt}/${maxRetries} for ${data.type}`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limits exceeded" }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Payment required" }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (response.status >= 500 && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const result = await response.json();
      imageUrl = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (imageUrl) {
        console.log(`${data.type} visual generated successfully`);
        break;
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    if (!imageUrl) {
      throw new Error(`Failed to generate ${data.type} visual after ${maxRetries} attempts`);
    }

    return new Response(
      JSON.stringify({ imageUrl, type: data.type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generate highlight visual error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate visual" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildHighlightPrompt(data: HighlightRequest): string {
  const styleDescriptions: Record<string, string> = {
    "modern-minimal": "sleek modern minimalist",
    "classic-historical": "elegant classical",
    "bohemian-eclectic": "vibrant bohemian eclectic",
    "rustic-nature": "warm rustic natural",
    "mediterranean": "Mediterranean coastal",
    "glam-luxe": "glamorous luxurious",
  };

  const styleDesc = styleDescriptions[data.style] || data.style;

  switch (data.type) {
    case "colorPalette": {
      const colorList = data.colors?.slice(0, 5).join(", ") || "natural tones";
      const materialList = data.materials?.join(", ") || "wood, fabric, stone, metal";
      return `Create an artistic flat-lay composition of material swatches and textures for interior design. Show ${colorList} colors through real materials: ${materialList}. Arrange as an elegant moodboard palette with fabric swatches, wood samples, stone pieces, and paint chips. ${styleDesc} aesthetic. Square format, soft natural lighting, professional product photography, clean white background, ultra high quality.`;
    }

    case "accentFurniture": {
      const furnitureName = data.furnitureName || "Designer Accent Chair";
      const description = data.furnitureDescription || "elegant statement piece";
      return `Create a photorealistic product image of a stunning ${furnitureName} for a ${styleDesc} ${data.room}. ${description}. Show the furniture piece as the hero shot against a subtle gradient background. Professional furniture photography, studio lighting, high-end catalog quality, square format, ultra high resolution.`;
    }

    case "moodboard": {
      const elements = data.elements?.join(", ") || "textures, plants, lighting, art";
      return `Create a sophisticated interior design moodboard collage for a ${styleDesc} ${data.room}. Include: ${elements}. Arrange as an aesthetic grid showing material samples, lifestyle images, texture close-ups, and design inspiration. Magazine-quality editorial layout, cohesive color story, professional mood board composition, square format, ultra high quality.`;
    }

    default:
      return `Create a ${styleDesc} interior design inspiration image for a ${data.room}. Square format, professional photography.`;
  }
}
