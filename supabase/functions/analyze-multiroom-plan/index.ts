const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
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

    const systemPrompt = `You are an architectural floor plan reader. You receive a photo, scan or sketch of an apartment/house floor plan that may contain MULTIPLE rooms.

SCALE RULE (non-negotiable):
- Ignore any printed dimensions or scale bars for scaling. Instead, find a standard interior DOOR opening in the plan and treat its clear opening width as EXACTLY 1.0 metre.
- Measure that door's width in image pixels, then derive metres_per_pixel = 1.0 / door_width_px. Use that single factor to size EVERY room.
- Report door_width_px and metres_per_pixel so the client can verify.
- If several doors exist, use the median width of the normal interior doors (exclude wide sliding/double doors and balcony doors).

For EVERY enclosed room in the plan return:
- "name": the label printed on the plan, or a sensible name ("Living Room", "Bedroom 1", "Kitchen", "Bathroom", "Hallway")
- "room_type": one of living-room, bedroom, kitchen, bathroom, office, hallway, dining-room, other
- "width_m", "length_m": rectangular footprint in metres, derived from the door scale, rounded to 2 decimals
- "area_sqm": floor area in m² (rounded to 2 decimals)
- "polygon": the room outline as points in PERCENT of the image (x and y each 0-100), in clockwise order, minimum 4 points. This must trace the actual room walls in the image so it can be drawn as an overlay.
- "openings": doors/windows on that room: { "type": "door"|"window"|"balcony", "wall_index": number (0-based index of the polygon edge), "position_pct": 0-100 along that edge }
- "confidence": 0-1

Be precise and consistent: rooms must not overlap, and the sum of room areas must be plausible for the whole plan.`;

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
              {
                type: "text",
                text: "Read this floor plan. Use a standard interior door opening as exactly 1.0 m to scale everything, then return every room with its outline (in % of the image) and its real-world sizes.",
              },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_rooms",
              description: "Extract every room of a multi-room floor plan, scaled with a 1 m door reference",
              parameters: {
                type: "object",
                properties: {
                  door_width_px: { type: "number" },
                  metres_per_pixel: { type: "number" },
                  image_width_px: { type: "number" },
                  image_height_px: { type: "number" },
                  total_area_sqm: { type: "number" },
                  notes: { type: "string" },
                  rooms: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        room_type: { type: "string" },
                        width_m: { type: "number" },
                        length_m: { type: "number" },
                        area_sqm: { type: "number" },
                        confidence: { type: "number" },
                        polygon: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: { x: { type: "number" }, y: { type: "number" } },
                            required: ["x", "y"],
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
                      },
                      required: ["name", "room_type", "width_m", "length_m", "polygon"],
                    },
                  },
                },
                required: ["rooms"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_rooms" } },
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
      if (response.status === 402 || response.status === 403) {
        return new Response(JSON.stringify({ error: "AI credits exhausted or blocked for this workspace." }), {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No tool call in response");

    const parsed = JSON.parse(toolCall.function.arguments);

    // Normalise + derive area when the model omitted it
    const rooms = (parsed.rooms || []).map((r: any, i: number) => ({
      ...r,
      id: `room-${i}`,
      width_m: Number(r.width_m) || 0,
      length_m: Number(r.length_m) || 0,
      area_sqm: Number(r.area_sqm) || Math.round((Number(r.width_m) || 0) * (Number(r.length_m) || 0) * 100) / 100,
      openings: Array.isArray(r.openings) ? r.openings : [],
      polygon: Array.isArray(r.polygon) ? r.polygon : [],
    }));

    return new Response(
      JSON.stringify({
        plan: {
          ...parsed,
          rooms,
          total_area_sqm:
            Number(parsed.total_area_sqm) ||
            Math.round(rooms.reduce((s: number, r: any) => s + (r.area_sqm || 0), 0) * 100) / 100,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("analyze-multiroom-plan error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Plan analysis failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
