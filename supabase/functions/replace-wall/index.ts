import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReplaceWallRequest {
  designImageUrl: string;
  designId: string;
  wallLabel: string;
  wallDescription: string;
  wallType: string;
  realWallImageUrl: string;
  userInstructions?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const {
      designImageUrl,
      designId,
      wallLabel,
      wallDescription,
      wallType,
      realWallImageUrl,
      userInstructions,
    }: ReplaceWallRequest = await req.json();

    if (!designImageUrl || !designId || !realWallImageUrl) {
      throw new Error(
        "designImageUrl, designId, and realWallImageUrl are required"
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`Replacing wall "${wallLabel}" in design ${designId}`);

    const wallTypeDesc: Record<string, string> = {
      pleine_wall:
        "a plain solid wall with no openings",
      window_wall:
        "a wall containing a window - keep the window in the exact same position",
      balcony_wall:
        "a wall with a balcony door/opening - keep the balcony opening in the exact same position",
      door_wall_left:
        "a wall with a door on the left side - keep the door in the exact same position on the left",
      door_wall_right:
        "a wall with a door on the right side - keep the door in the exact same position on the right",
    };

    const typeContext = wallTypeDesc[wallType] || "a wall";

    const userNote = userInstructions?.trim()
      ? `\n\nUSER INSTRUCTIONS (follow these carefully): ${userInstructions}`
      : "";

    const prompt = `I have two images:

IMAGE 1 (first image): An AI-generated interior design rendering.
IMAGE 2 (second image): A real photograph of an actual wall in someone's room.

TASK: Generate a new version of IMAGE 1 (the design) where the "${wallLabel}" (${wallDescription}) is REPLACED with the actual wall from IMAGE 2.

CRITICAL RULES:
1. The "${wallLabel}" is ${typeContext}
2. Take the REAL wall texture, color, paint, material, and any architectural features (windows, doors, outlets, moldings) from IMAGE 2
3. KEEP ALL FURNITURE that was against or near this wall in the EXACT SAME POSITION - do not move, remove, or change any furniture
4. Adapt the lighting and perspective of the real wall to match the design's camera angle
5. Blend seamlessly - the real wall should look natural in the designed room
6. Keep all OTHER walls in the design EXACTLY as they are - only change the "${wallLabel}"
7. Maintain the same room proportions, floor, ceiling, and overall composition
8. The result should look like a professional interior design rendering using the actual room's wall${userNote}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: designImageUrl } },
                { type: "image_url", image_url: { url: realWallImageUrl } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const base64Image =
      data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!base64Image) {
      throw new Error("No image generated");
    }

    // Upload to storage
    const base64Clean = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const byteString = atob(base64Clean);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let j = 0; j < byteString.length; j++) {
      ia[j] = byteString.charCodeAt(j);
    }
    const blob = new Blob([ab], { type: "image/png" });

    const fileName = `${designId}/wall-replaced-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from("design-images")
      .upload(fileName, blob, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload result image");
    }

    const { data: urlData } = supabase.storage
      .from("design-images")
      .getPublicUrl(fileName);

    // Update the design's image URL in the database
    await supabase
      .from("generated_designs")
      .update({ image_url: urlData.publicUrl })
      .eq("id", designId);

    console.log(`Wall replacement complete for design ${designId}`);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: urlData.publicUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Replace wall error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to replace wall",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
