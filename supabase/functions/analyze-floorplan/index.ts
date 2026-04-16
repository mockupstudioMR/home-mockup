import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a floor plan analyzer. Given an image of a floor plan or room layout sketch, extract the room shape as a series of wall segments forming a closed polygon.

For each wall segment, provide:
- length_m: estimated length in meters (use scale bars if visible, otherwise estimate from common room sizes)
- angle_deg: the TURNING angle at the END of this wall (exterior angle, positive = turn right/clockwise, negative = turn left/counter-clockwise). The angles must sum to 360 for a convex shape or handle concave shapes correctly.

Also extract any visible openings (doors, windows, balconies) with their wall index (0-based) and approximate position along that wall (0-100%).

Start the first wall from the top-left corner going RIGHT (east).

Return a JSON object with:
- "walls": array of { "length_m": number, "angle_deg": number }
- "openings": array of { "type": "door"|"window"|"balcony", "wall_index": number, "position_pct": number }
- "estimated_area_sqm": estimated total area
- "shape_description": short description like "rectangular room" or "L-shaped room with alcove"

For a simple rectangle 5m x 4m, walls would be:
[{length_m: 5, angle_deg: 90}, {length_m: 4, angle_deg: 90}, {length_m: 5, angle_deg: 90}, {length_m: 4, angle_deg: 90}]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this floor plan image and extract the room shape as wall segments with angles. Be precise about proportions." },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_floorplan",
              description: "Extract room shape from floor plan as wall segments",
              parameters: {
                type: "object",
                properties: {
                  walls: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        length_m: { type: "number" },
                        angle_deg: { type: "number" },
                      },
                      required: ["length_m", "angle_deg"],
                    },
                  },
                  openings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["door", "window", "balcony"] },
                        wall_index: { type: "number" },
                        position_pct: { type: "number" },
                      },
                      required: ["type", "wall_index", "position_pct"],
                    },
                  },
                  estimated_area_sqm: { type: "number" },
                  shape_description: { type: "string" },
                },
                required: ["walls", "shape_description"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_floorplan" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call in response");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ floorplan: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-floorplan error:", e);
    return new Response(JSON.stringify({ error: e.message || "Floor plan analysis failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
