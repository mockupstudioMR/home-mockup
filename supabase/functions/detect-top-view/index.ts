// Detect top-down furniture layout from a rendered design image.
// Returns { items: [{label, x, y, w, h}] } in 0-100 percentage coordinates,
// matching the same schema used by the floor-plan layout step.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, roomShape, dimensions, expectedFurniture } =
      await req.json();

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const dimsLabel = dimensions
      ? Object.entries(dimensions)
          .map(([k, v]) => `${k}=${v}m`)
          .join(", ")
      : "unknown";

    const expected = Array.isArray(expectedFurniture) && expectedFurniture.length
      ? `Expected furniture from the user's plan: ${expectedFurniture.join(", ")}.`
      : "";

    const systemPrompt = `You are an interior architect. Look at the perspective design image of a room and infer a TOP-DOWN floor plan of the visible furniture.

Room shape: ${roomShape || "rectangle"}. Dimensions: ${dimsLabel}.
${expected}

Return positions as percentages (0-100) of the room's bounding box where:
- x,y = top-left corner of the furniture footprint
- w,h = furniture footprint size
- (0,0) is the room's top-left, (100,100) is bottom-right
Estimate footprint sizes realistically (e.g. a double bed ≈ 160x200 cm).
Only include furniture you can actually see in the image. Use simple labels like "bed", "nightstand", "wardrobe", "sofa", "coffee table", "rug", "armchair", "desk", "chair", "tv unit", "bookshelf", "plant", "lamp".`;

    const tools = [
      {
        type: "function",
        function: {
          name: "return_top_view",
          description: "Return detected furniture positions in top-down view.",
          parameters: {
            type: "object",
            properties: {
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
                  additionalProperties: false,
                },
              },
            },
            required: ["items"],
            additionalProperties: false,
          },
        },
      },
    ];

    const resp = await fetch(
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
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Infer the top-down furniture layout from this design image and return it via the tool.",
                },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
          tools,
          tool_choice: {
            type: "function",
            function: { name: "return_top_view" },
          },
        }),
      }
    );

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      if (resp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (resp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway ${resp.status}`);
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { items: [] };

    // Clamp coords to 0-100
    const items = (parsed.items || []).map((it: any) => ({
      label: String(it.label || "item"),
      x: Math.max(0, Math.min(100, Number(it.x) || 0)),
      y: Math.max(0, Math.min(100, Number(it.y) || 0)),
      w: Math.max(2, Math.min(100, Number(it.w) || 10)),
      h: Math.max(2, Math.min(100, Number(it.h) || 10)),
    }));

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("detect-top-view error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
