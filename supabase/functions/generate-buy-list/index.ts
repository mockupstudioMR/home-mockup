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
    const body = await req.json();
    const {
      roomType,
      shape,
      dimensions,
      measurements,
      openings,
      walls,
      style,
      houseState,
      layout,
      designDescription,
      moodboard,
      designTitle,
      designItems,
    } = body || {};

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const m = measurements || {};
    const measuredDesc = [
      m.floorAreaSqm != null ? `Floor area: ${m.floorAreaSqm} m²` : null,
      m.perimeterM != null ? `Perimeter: ${m.perimeterM} m` : null,
      m.ceilingHeightM != null ? `Ceiling height: ${m.ceilingHeightM} m` : null,
      m.netWallAreaSqm != null ? `Net paintable wall area (openings deducted): ${m.netWallAreaSqm} m²` : null,
      m.skirtingM != null ? `Skirting run: ${m.skirtingM} m` : null,
    ].filter(Boolean).join("\n");

    const layoutDesc = layout?.items?.length
      ? layout.items
          .map(
            (it: any) =>
              `- ${it.label}: footprint ${Math.round(((it.w || 0) / 100) * (m.roomWidthM || 0) * 100)} cm wide × ${Math.round(
                ((it.h || 0) / 100) * (m.roomLengthM || 0) * 100,
              )} cm deep, placed at ${Math.round(it.x)}%/${Math.round(it.y)}%${it.reason ? ` — ${it.reason}` : ""}`,
          )
          .join("\n")
      : "No layout items";

    const openingsDesc = Array.isArray(openings) && openings.length
      ? openings.map((o: any) => `- ${o.type} on ${o.wall} wall at ${o.position}%`).join("\n")
      : "No openings recorded";

    const mbDesc = moodboard
      ? [
          moodboard.colors?.length ? `Colors: ${moodboard.colors.join(", ")}` : null,
          moodboard.materials?.length ? `Materials: ${moodboard.materials.join(", ")}` : null,
          moodboard.mustInclude?.length ? `Must-keep items: ${moodboard.mustInclude.join(", ")}` : null,
        ].filter(Boolean).join("\n")
      : "";

    const designItemsDesc = Array.isArray(designItems) && designItems.length
      ? designItems
          .map((it: any) =>
            `- ${it.name}${it.type ? ` (${it.type})` : ""}${
              [it.material, it.color, it.style].filter(Boolean).length
                ? ` — ${[it.material, it.color, it.style].filter(Boolean).join(", ")}`
                : ""
            }`,
          )
          .join("\n")
      : "";

    const systemPrompt = `You are a quantity surveyor and interior fit-out estimator. You produce a precise, buildable SHOPPING LIST for one room. You NEVER generate images or new design ideas — you only quantify what is already designed.

Rules:
- Use the supplied measurements. Never invent room sizes.
- Materials: derive quantities from the measured areas/lengths, add realistic waste (flooring/tiles +10%, paint 2 coats at 10 m²/L, timber +10%). State the formula used in "basis".
- If the house state is "core & shell" (unfinished), include the full build-out: subfloor, wood flooring m², skirting m, drywall/plaster m², primer + paint L, electrical points, ceiling finish, door and window units matching the recorded openings.
- If the state is finished/furnished, only include finishes that the design actually changes.
- Furniture: for EVERY layout item, give a hard maximum size constraint in cm derived from its footprint and required clearances (e.g. "sofa max 220 × 95 cm, min 70 cm walkway to coffee table"). Put this in "size_constraint".
- Quantities must be numbers with a unit ("m²", "m", "L", "pcs", "rolls").
- Prices in EUR only, realistic mid-market retail unit prices.
- Categories: "materials", "furniture", "lighting", "textiles", "decor", "labour".
- When items detected in the generated design are supplied, EVERY one of them must appear as a line item with its exact material/colour/style — never substitute a look-alike and never drop one. Add other items only if the layout or build-out requires them.
- 12-30 line items. No duplicates, no filler.`;

    const userPrompt = `Room type: ${roomType || "living room"}
Room shape: ${shape || "rectangle"}
Raw dimensions: ${JSON.stringify(dimensions || {})}
House state: ${houseState || "unknown"}
Style: ${style || "unspecified"}

MEASUREMENTS
${measuredDesc || "none"}

OPENINGS
${openingsDesc}

WALL SURFACES
${JSON.stringify(walls || [])}

CHOSEN LAYOUT: ${layout?.name || "n/a"} — ${layout?.description || ""}
${layoutDesc}

GENERATED DESIGN${designTitle ? `: ${designTitle}` : ""} (already generated — quantify it, do not redesign)
${designDescription || "n/a"}

ITEMS DETECTED IN THAT DESIGN (each one must appear in the list)
${designItemsDesc || "none recorded"}

${mbDesc}

Produce the shopping list.`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "build_shopping_list",
              description: "Return a quantified shopping list for the room",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  currency: { type: "string" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: {
                          type: "string",
                          enum: ["materials", "furniture", "lighting", "textiles", "decor", "labour"],
                        },
                        name: { type: "string" },
                        spec: { type: "string" },
                        quantity: { type: "number" },
                        unit: { type: "string" },
                        basis: { type: "string" },
                        size_constraint: { type: "string" },
                        unit_price_eur: { type: "number" },
                        notes: { type: "string" },
                      },
                      required: ["category", "name", "quantity", "unit", "basis"],
                    },
                  },
                },
                required: ["summary", "items"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "build_shopping_list" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please retry shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const aiData = await response.json();
    const args = aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("No tool call in response");

    const parsed = JSON.parse(args);

    return new Response(JSON.stringify({ list: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-buy-list error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Shopping list failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
