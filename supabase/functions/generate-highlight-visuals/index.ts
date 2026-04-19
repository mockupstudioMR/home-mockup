import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface HighlightRequest {
  type: "colorPalette" | "accentFurniture" | "moodboard";
  style: string;
  room: string;
  colors?: string[];
  materials?: string[];
  furnitureName?: string;
  furnitureDescription?: string;
  elements?: string[];
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

    const data: HighlightRequest = await req.json();

    // Fetch prompt templates from DB
    let promptTemplates: Record<string, string> = {};
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: templates } = await supabase
        .from("prompt_templates")
        .select("template_key, template")
        .in("template_key", ["highlight_color_palette", "highlight_accent_furniture", "highlight_moodboard"]);
      
      if (templates) {
        for (const t of templates) {
          promptTemplates[t.template_key] = t.template;
        }
        console.log(`Loaded ${templates.length} highlight prompt templates from DB`);
      }
    }

    const prompt = buildHighlightPrompt(data, promptTemplates);

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
          model: "google/gemini-3.1-flash-image-preview",
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

      // Read response as text first to avoid connection body read errors with large payloads
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseErr) {
        console.error(`Failed to parse response (length: ${responseText.length}):`, parseErr);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw new Error("Failed to parse AI response");
      }
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

function buildHighlightPrompt(data: HighlightRequest, templates: Record<string, string>): string {
  const styleDescriptions: Record<string, string> = {
    "modern-minimal": "sleek modern minimalist",
    "classic-historical": "elegant classical",
    "bohemian-eclectic": "vibrant bohemian eclectic",
    "rustic-nature": "warm rustic natural",
    "mediterranean": "Mediterranean coastal",
    "glam-luxe": "glamorous luxurious",
  };

  const styleDesc = styleDescriptions[data.style] || data.style;

  // Helper to fill template variables
  const fill = (tpl: string): string => {
    return tpl
      .replace(/\{\{style\}\}/g, styleDesc)
      .replace(/\{\{room\}\}/g, data.room)
      .replace(/\{\{colors\}\}/g, data.colors?.slice(0, 5).join(", ") || "natural tones")
      .replace(/\{\{materials\}\}/g, data.materials?.join(", ") || "wood, fabric, stone, metal")
      .replace(/\{\{furnitureName\}\}/g, data.furnitureName || "Designer Accent Chair")
      .replace(/\{\{furnitureDescription\}\}/g, data.furnitureDescription || "elegant statement piece")
      .replace(/\{\{elements\}\}/g, data.elements?.join(", ") || "textures, plants, lighting, art");
  };

  switch (data.type) {
    case "colorPalette": {
      if (templates["highlight_color_palette"]) {
        return fill(templates["highlight_color_palette"]);
      }
      const colorList = data.colors?.slice(0, 5).join(", ") || "natural tones";
      const materialList = data.materials?.join(", ") || "wood, fabric, stone, metal";
      return `Create an artistic flat-lay composition of material swatches and textures for interior design. Show ${colorList} colors through real materials: ${materialList}. Arrange as an elegant moodboard palette with fabric swatches, wood samples, stone pieces, and paint chips. ${styleDesc} aesthetic. Square format, soft natural lighting, professional product photography, clean white background, ultra high quality.`;
    }

    case "accentFurniture": {
      if (templates["highlight_accent_furniture"]) {
        return fill(templates["highlight_accent_furniture"]);
      }
      const furnitureName = data.furnitureName || "Designer Accent Chair";
      const description = data.furnitureDescription || "elegant statement piece";
      return `Create a photorealistic product image of a stunning ${furnitureName} for a ${styleDesc} ${data.room}. ${description}. Show the furniture piece as the hero shot against a subtle gradient background. Professional furniture photography, studio lighting, high-end catalog quality, square format, ultra high resolution.`;
    }

    case "moodboard": {
      if (templates["highlight_moodboard"]) {
        return fill(templates["highlight_moodboard"]);
      }
      const elements = data.elements?.join(", ") || "textures, plants, lighting, art";
      return `Create a sophisticated interior design moodboard collage for a ${styleDesc} ${data.room}. Include: ${elements}. Arrange as an aesthetic grid showing material samples, lifestyle images, texture close-ups, and design inspiration. Magazine-quality editorial layout, cohesive color story, professional mood board composition, square format, ultra high quality.`;
    }

    default:
      return `Create a ${styleDesc} interior design inspiration image for a ${data.room}. Square format, professional photography.`;
  }
}
