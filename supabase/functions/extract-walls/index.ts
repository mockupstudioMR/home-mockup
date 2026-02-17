import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExtractWallsRequest {
  designImageUrl: string;
  designId: string;
  roomType?: string;
  mustHaveElements?: string[];
}

interface ExtractedWall {
  id: string;
  wall_type: string;
  label: string;
  description: string;
  imageUrl?: string;
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

    const { designImageUrl, designId, roomType, mustHaveElements }: ExtractWallsRequest = await req.json();

    if (!designImageUrl || !designId) {
      throw new Error("designImageUrl and designId are required");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch room furniture config for must-have items
    let furnitureItems: string[] = mustHaveElements || [];
    if (roomType) {
      const { data: roomConfig } = await supabase
        .from("room_furniture_config")
        .select("furniture_items")
        .eq("room_type", roomType)
        .maybeSingle();
      if (roomConfig?.furniture_items?.length) {
        const combined = new Set([...furnitureItems, ...roomConfig.furniture_items]);
        furnitureItems = [...combined];
      }
    }

    const roomContext = furnitureItems.length > 0
      ? `\nThis is a ${roomType || "room"} that MUST contain these essential items/fixtures: ${furnitureItems.join(", ")}. Make sure they are visible and properly placed in the appropriate walls.`
      : "";

    console.log(`Extracting walls from design ${designId}, room: ${roomType || "unknown"}, must-have: ${furnitureItems.join(", ")}`);

    // Step 1: Analyze the design to identify walls
    const analysisResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this interior design image and identify exactly 4 walls of the room. Every room has 4 walls even if some are not fully visible - infer them from the room's perspective.

For each wall, determine its type from this list:
- "pleine_wall" - A solid wall with no openings (plain wall)
- "window_wall" - A wall that contains a window
- "balcony_wall" - A wall with balcony door/opening
- "door_wall_left" - A wall with a door on the left side
- "door_wall_right" - A wall with a door on the right side

Return a JSON array of EXACTLY 4 walls. Each wall should have:
- "wall_type": one of the types above
- "label": human-readable label like "Left Wall (Window)", "Back Wall (Plain)", etc.
- "description": brief description of what's on/against this wall (furniture, colors, features)
- "position": where it is in the room - must be one of "left", "right", "back", "front" (each used exactly once)

CRITICAL RULES:
1. Always return exactly 4 walls, one for each position (left, right, back, front).
2. AT LEAST ONE wall MUST be a door wall ("door_wall_left" or "door_wall_right"). Every room has an entrance. If you can see a door, use that wall. If no door is visible, the wall closest to the camera/viewer perspective (usually "front") is most likely where the entrance door is - assign it as "door_wall_left" or "door_wall_right" based on typical room layouts.
3. If a wall is not visible, infer its type based on the room's style and logical reasoning.

Respond ONLY with valid JSON array, no markdown, no extra words, no explanation.`,
                },
                {
                  type: "image_url",
                  image_url: { url: designImageUrl },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!analysisResponse.ok) {
      throw new Error(`AI analysis failed: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    let wallsText =
      analysisData.choices?.[0]?.message?.content || "[]";

    // Clean up potential markdown wrapping
    wallsText = wallsText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    let walls: Array<{
      wall_type: string;
      label: string;
      description: string;
      position: string;
    }>;

    try {
      walls = JSON.parse(wallsText);
    } catch {
      console.error("Failed to parse walls JSON, attempting repair:", wallsText);
      // Try to repair: extract individual JSON objects and reconstruct array
      try {
        const objectMatches = [...wallsText.matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g)];
        if (objectMatches.length > 0) {
          const repairedArray = objectMatches
            .map((m) => {
              try {
                // Remove stray words between key-value pairs
                const cleaned = m[0].replace(/,\s*\n\s*\w+\s*\n/g, ",\n");
                return JSON.parse(cleaned);
              } catch {
                // More aggressive cleanup: remove any non-JSON word on its own line
                const aggressiveCleaned = m[0]
                  .split("\n")
                  .filter((line: string) => {
                    const trimmed = line.trim();
                    // Keep lines that look like JSON (start with {, }, ", or contain :)
                    return !trimmed || /^[{}\[\]",]|:/.test(trimmed);
                  })
                  .join("\n");
                try {
                  return JSON.parse(aggressiveCleaned);
                } catch {
                  return null;
                }
              }
            })
            .filter(Boolean);
          if (repairedArray.length > 0) {
            walls = repairedArray;
            console.log(`Repaired JSON: recovered ${walls.length} walls`);
          } else {
            walls = [];
          }
        } else {
          walls = [];
        }
      } catch {
        walls = [];
      }
    }

    // Ensure exactly 4 walls with fallback
    if (walls.length < 4) {
      const positions = ["left", "right", "back", "front"];
      const existingPositions = new Set(walls.map((w: any) => w.position));
      for (const pos of positions) {
        if (!existingPositions.has(pos) && walls.length < 4) {
          walls.push({
            wall_type: "pleine_wall",
            label: `${pos.charAt(0).toUpperCase() + pos.slice(1)} Wall (Plain)`,
            description: "Inferred plain wall",
            position: pos,
          });
        }
      }
    }

    // Ensure at least one door wall exists
    const hasDoor = walls.some((w: any) =>
      w.wall_type === "door_wall_left" || w.wall_type === "door_wall_right"
    );
    if (!hasDoor) {
      // Find the "front" wall (viewer perspective = most likely entrance), fallback to last plain wall
      const frontIdx = walls.findIndex((w: any) => w.position === "front");
      const plainIdx = walls.findIndex((w: any) => w.wall_type === "pleine_wall");
      const targetIdx = frontIdx !== -1 ? frontIdx : (plainIdx !== -1 ? plainIdx : walls.length - 1);
      if (targetIdx >= 0 && targetIdx < walls.length) {
        walls[targetIdx].wall_type = "door_wall_left";
        walls[targetIdx].label = walls[targetIdx].label.replace("(Plain)", "(Door)");
        walls[targetIdx].description += " (entrance door inferred)";
      }
    }

    console.log(`Found ${walls.length} walls`);

    // Step 2: Generate cropped images for each wall
    const wallResults: ExtractedWall[] = [];

    for (const wall of walls) {
      const cropPrompt = `Look at this interior design image. Generate a NEW VIEW of the same room showing ONLY the "${wall.label}" wall (${wall.description}).

CAMERA POSITION: Place the camera DIRECTLY FACING this wall, perfectly centered and perpendicular to it. The camera should be at eye level, looking straight at the wall as if you are standing in front of it. This is a FLAT, HEAD-ON, ORTHOGRAPHIC-STYLE view — no perspective angle, no 3/4 view, no side angle.

The wall should FILL THE ENTIRE FRAME from edge to edge. Show:
- The full wall surface from floor to ceiling
- Paint/wallpaper color and texture
- Any architectural features on this wall (windows, doors, moldings)
- Furniture pieces placed against this wall
- The floor visible at the very bottom edge
${roomContext}

IMPORTANT: This must look like the SAME ROOM, maintaining identical style, lighting, colors, materials, and all furniture/decor from the original design. Only the camera position changes — you are now standing directly in front of this specific wall.`;

      let imageUrl: string | undefined;
      const MAX_ATTEMPTS = 2;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          console.log(`Generating wall image for ${wall.label} (attempt ${attempt}/${MAX_ATTEMPTS})`);
          const imageResponse = await fetch(
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
                      { type: "text", text: cropPrompt },
                      { type: "image_url", image_url: { url: designImageUrl } },
                    ],
                  },
                ],
                modalities: ["image", "text"],
              }),
            }
          );

          if (!imageResponse.ok) {
            console.error(`Image generation failed for ${wall.label}: ${imageResponse.status}`);
            if (attempt < MAX_ATTEMPTS) continue;
            break;
          }

          const imageData = await imageResponse.json();
          const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (!base64Image) {
            console.error(`No image in response for ${wall.label}`);
            if (attempt < MAX_ATTEMPTS) continue;
            break;
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

          const wallId = crypto.randomUUID();
          const fileName = `${designId}/wall-${wallId}.png`;
          const { error: uploadError } = await supabase.storage
            .from("design-images")
            .upload(fileName, blob, { contentType: "image/png", upsert: true });

          if (uploadError) {
            console.error(`Upload error for ${wall.label}:`, uploadError);
            break;
          }

          const { data: urlData } = supabase.storage
            .from("design-images")
            .getPublicUrl(fileName);

          imageUrl = urlData.publicUrl;
          console.log(`Generated wall image for ${wall.label}`);
          break; // Success, exit retry loop
        } catch (err) {
          console.error(`Error processing wall ${wall.label} (attempt ${attempt}):`, err);
          if (attempt >= MAX_ATTEMPTS) break;
        }
      }

      wallResults.push({
        id: crypto.randomUUID(),
        wall_type: wall.wall_type,
        label: wall.label,
        description: wall.description,
        imageUrl,
      });
    }

    console.log(
      `Completed: ${wallResults.filter((w) => w.imageUrl).length}/${walls.length} wall images generated`
    );

    return new Response(
      JSON.stringify({
        success: true,
        walls: wallResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Extract walls error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to extract walls",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
