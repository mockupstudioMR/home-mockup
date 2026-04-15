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
    const { shape, dimensions, openings } = await req.json();

    if (!shape || !dimensions) {
      return new Response(JSON.stringify({ error: "shape and dimensions required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const dimDesc = Object.entries(dimensions)
      .map(([k, v]) => `${k}: ${v}m`)
      .join(", ");

    const systemPrompt = `You are an interior design layout planner. Given a room shape, dimensions, and locations of doors/windows/balconies, suggest exactly 3 different furniture layout arrangements. Each layout should be practical and follow interior design principles.

CRITICAL RULES:
- Never place furniture blocking doors
- Place seating/reading areas near windows for natural light
- Balcony doors need clear access paths
- Consider traffic flow between openings

Return a JSON object with a "layouts" array. Each layout has:
- "name": short creative name (e.g. "Cozy Conversation")
- "description": one-sentence description of the arrangement style
- "items": array of furniture pieces, each with:
  - "label": furniture name (e.g. "Sofa", "Coffee Table", "TV Unit", "Dining Table", "Bookshelf", "Armchair", "Bed", "Desk", "Rug", "Plant")
  - "x": percentage from left (0-100)
  - "y": percentage from top (0-100)
  - "w": width as percentage of room (5-40)
  - "h": height as percentage of room (5-40)

Make layouts diverse: one conversation-focused, one work/productivity, one entertainment/relaxation. Place 5-8 items per layout. Ensure items don't overlap and are placed logically (sofa facing TV, desk near window/wall, etc).`;

    let openingsDesc = "";
    if (openings && Array.isArray(openings) && openings.length > 0) {
      openingsDesc = "\nOpenings:\n" + openings.map((o: any) => `- ${o.type} on ${o.wall} wall at ${o.position}% along the wall`).join("\n");
    }

    const userPrompt = `Room shape: ${shape}\nDimensions: ${dimDesc}${openingsDesc}\n\nGenerate 3 furniture layout suggestions that respect the door/window/balcony positions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_layouts",
              description: "Return 3 furniture layout suggestions for the room",
              parameters: {
                type: "object",
                properties: {
                  layouts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        description: { type: "string" },
                        items: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              label: { type: "string" },
                              x: { type: "number" },
                              y: { type: "number" },
                              w: { type: "number" },
                              h: { type: "number" },
                            },
                            required: ["label", "x", "y", "w", "h"],
                          },
                        },
                      },
                      required: ["name", "description", "items"],
                    },
                  },
                },
                required: ["layouts"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_layouts" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call in response");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-layout error:", e);
    return new Response(JSON.stringify({ error: e.message || "Layout generation failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
