import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ScenePreviewRequest {
  roomType: string;
  productImages: string[];        // uploaded product image URLs/base64
  productDescriptions: string[];  // e.g. ["Sectional Sofa", "Coffee Table"]
  styles: string[];               // 3 style names to generate
}

const STYLE_DESCRIPTIONS: Record<string, string> = {
  "modern-minimal": "modern minimalist with clean lines, neutral tones, and Scandinavian simplicity",
  "bohemian-eclectic": "bohemian eclectic with layered textiles, warm earthy tones, and global influences",
  "glam-luxe": "glamorous luxe with metallic accents, velvet textures, and dramatic lighting",
  "rustic-nature": "rustic natural with organic materials, wood tones, and earthy textures",
  "mediterranean": "Mediterranean coastal with warm terracotta, arched details, and natural light",
  "classic-historical": "classic historical with ornate details, rich fabrics, and timeless elegance",
};

const ROOM_MAP: Record<string, string> = {
  "living-room": "living room",
  bedroom: "bedroom",
  kitchen: "kitchen",
  office: "home office",
  bathroom: "bathroom",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { roomType, productImages, productDescriptions, styles }: ScenePreviewRequest = await req.json();

    if (!styles || styles.length === 0) throw new Error("No styles provided");

    const room = ROOM_MAP[roomType] || roomType;
    const productList = productDescriptions.join(", ");

    // Validate product images
    const validImages: string[] = [];
    for (const img of (productImages || []).slice(0, 4)) {
      if (img.startsWith("data:")) {
        validImages.push(img);
        continue;
      }
      try {
        const resp = await fetch(img, { method: "HEAD", redirect: "follow" });
        if (resp.ok) validImages.push(img);
      } catch { /* skip */ }
    }

    console.log(`Generating ${styles.length} scene previews for ${room} with ${validImages.length} product images`);

    // Generate all scenes in parallel
    const scenePromises = styles.slice(0, 3).map(async (styleId) => {
      const styleDesc = STYLE_DESCRIPTIONS[styleId] || styleId;

      const prompt = `Create a stunning ${styleDesc} ${room} interior design. CRITICAL: You MUST include these exact products prominently in the scene, keeping their original appearance, colors, and details exactly as shown in the reference images: ${productList}. These products must be the focal point of the room. Design a complete, cohesive ${room} around them. Ultra high resolution, photorealistic interior design photography, professional lighting, magazine quality, 16:9 aspect ratio.`;

      const contentParts: any[] = [{ type: "text", text: prompt }];
      for (const img of validImages) {
        contentParts.push({ type: "image_url", image_url: { url: img } });
      }

      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [{ role: "user", content: contentParts }],
            modalities: ["image", "text"],
          }),
        });

        if (!response.ok) {
          console.error(`Scene gen failed for ${styleId}: ${response.status}`);
          return { styleId, imageUrl: null, error: `HTTP ${response.status}` };
        }

        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        const text = data.choices?.[0]?.message?.content || "";

        if (!imageUrl) {
          console.error(`No image in response for ${styleId}`);
          return { styleId, imageUrl: null, error: "No image generated" };
        }

        // Upload to storage
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        let publicUrl = imageUrl;

        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && imageUrl.startsWith("data:")) {
          try {
            const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
            const base64 = imageUrl.replace(/^data:image\/\w+;base64,/, "");
            const byteString = atob(base64);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
            const blob = new Blob([ab], { type: "image/png" });
            const fileName = `previews/${styleId}-${Date.now()}.png`;
            const { error: uploadError } = await supabase.storage.from("design-images").upload(fileName, blob, { contentType: "image/png" });
            if (!uploadError) {
              const { data: urlData } = supabase.storage.from("design-images").getPublicUrl(fileName);
              publicUrl = urlData.publicUrl;
            }
          } catch (e) {
            console.error("Upload failed, using data URI:", e);
          }
        }

        return { styleId, imageUrl: publicUrl, description: text };
      } catch (e) {
        console.error(`Scene gen error for ${styleId}:`, e);
        return { styleId, imageUrl: null, error: String(e) };
      }
    });

    const scenes = await Promise.all(scenePromises);

    return new Response(
      JSON.stringify({ scenes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scene preview error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate previews" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
