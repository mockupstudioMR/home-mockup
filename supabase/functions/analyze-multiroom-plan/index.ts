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

STEP 1 — find the walls first. Before naming any room, trace the wall network: exterior walls (thickest), interior partitions (thinner), and every corner where walls meet. A room is the empty area fully enclosed by those wall lines. Never guess a room from furniture or text placement.

STEP 2 — for EVERY enclosed room return:
- "name": the label printed on the plan, or a sensible name ("Living Room", "Bedroom 1", "Kitchen", "Bathroom", "Hallway")
- "room_type": one of living-room, bedroom, kitchen, bathroom, office, hallway, dining-room, other
- "polygon_px": the room outline in IMAGE PIXELS ({"x","y"} points, clockwise). Also report image_width_px / image_height_px so the pixels can be converted. Use pixels, not percentages, so you can read the drawing precisely.
- "width_m", "length_m": the room's bounding footprint in metres, derived from the door scale, rounded to 2 decimals
- "area_sqm": floor area in m² (rounded to 2 decimals)
- "confidence": 0-1
- "openings": EVERY door AND window (and balcony/terrace door) on that room's walls.

POLYGON ACCURACY RULES (this is the most important part — crude rectangles are wrong):
- Put a vertex at EVERY corner of the room, exactly where the two wall inner faces intersect. Follow the real outline: L-shapes, U-shapes, niches, chimney breasts, sloped/angled walls, columns and closets that bite into the room all need their own vertices. A 4-point rectangle is only acceptable when the room truly is a rectangle.
- Trace the INNER face of each wall, so the polygon covers the usable floor only and never the wall thickness.
- Walls are hard boundaries: a polygon may never cross a wall line, never overlap another room, and never merge a room with an adjoining hallway, closet, bathroom or balcony. Each enclosed area is its own room.
- Rooms that share a wall must have parallel edges along that wall, separated only by the wall thickness — do not let one room's edge land in the middle of another room.
- Keep edges axis-aligned (horizontal or vertical) unless the drawing clearly shows a slanted wall; then follow the slant exactly.
- Re-check each polygon against the image before answering: every vertex must sit on a drawn wall line, and the shape must visually match that room's floor area.

OPENING DETECTION RULES (be thorough — windows are frequently missed):
- WINDOWS look like a break in the wall hatch drawn as two or three thin parallel lines spanning the gap, usually on exterior walls, with no swing arc. Include every one of them, even small ones.
- DOORS have a gap in the wall plus a quarter-circle swing arc (or a sliding-door rail).
- BALCONY / terrace doors are wide openings leading to an outdoor slab, often with dashed railing lines.
- For each opening return: { "type": "door"|"window"|"balcony", "wall_index": 0-based index of the polygon edge it sits on, "position_pct": 0-100 along that edge (measured in the polygon's clockwise direction), "width_m": clear width in metres from the 1 m door scale, "x_px" and "y_px": the CENTRE of the opening in IMAGE PIXELS.
- Never invent openings that are not visibly drawn, and never merge two adjacent windows into one.

Be precise and consistent: rooms must not overlap, and the sum of room areas must be plausible for the whole plan.`;


    const pointSchema = {
      type: "array",
      items: {
        type: "object",
        properties: { x: { type: "number" }, y: { type: "number" } },
        required: ["x", "y"],
      },
    };

    const tools = [
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
                    polygon_px: pointSchema,
                    openings: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: { type: "string", enum: ["door", "window", "balcony"] },
                          wall_index: { type: "number" },
                          position_pct: { type: "number" },
                          width_m: { type: "number" },
                          x_px: { type: "number" },
                          y_px: { type: "number" },
                        },
                        required: ["type", "wall_index", "position_pct"],
                      },
                    },
                  },
                  required: ["name", "room_type", "width_m", "length_m", "polygon_px"],
                },
              },
            },
            required: ["rooms", "image_width_px", "image_height_px"],
          },
        },
      },
    ];

    const userText =
      "Read this floor plan. First trace the wall network, then return every enclosed room with a precise outline in image pixels (a vertex at every wall corner — no crude rectangles for non-rectangular rooms), its real-world sizes scaled from a standard interior door = 1.0 m, and EVERY door and window you can see (windows are thin parallel lines in the wall with no swing arc — do not miss any).";

    // Geometry reading needs the strongest available vision model; fall back if unavailable.
    const MODELS = ["google/gemini-2.5-pro", "google/gemini-2.5-flash"];

    const askAI = async (messages: unknown[]) => {
      let lastStatus = 0;
      for (const model of MODELS) {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            tools,
            tool_choice: { type: "function", function: { name: "extract_rooms" } },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
          if (!args) throw new Error("No tool call in response");
          return JSON.parse(args);
        }
        lastStatus = res.status;
        console.error("AI gateway error:", model, lastStatus, await res.text());
        // Only a bad/unavailable model id is worth trying the next model for.
        if (lastStatus !== 400 && lastStatus !== 404) break;
      }
      const err = new Error(`AI error: ${lastStatus}`);
      (err as Error & { status?: number }).status = lastStatus;
      throw err;
    };

    const baseMessages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ];

    let parsed: any;
    try {
      parsed = await askAI(baseMessages);
    } catch (e) {
      const status = (e as Error & { status?: number }).status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402 || status === 403) {
        return new Response(JSON.stringify({ error: "AI credits exhausted or blocked for this workspace." }), {
          status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw e;
    }

    type Pt = { x: number; y: number };
    const num = (v: any) => (typeof v === "number" && isFinite(v) ? v : NaN);

    const buildPlan = (raw: any) => {
    const rawRooms: any[] = Array.isArray(raw.rooms) ? raw.rooms : [];

    // --- 1. Work out the pixel canvas so pixel outlines can become percentages.
    const pxPolys: Pt[][] = rawRooms.map((r) =>

      (Array.isArray(r.polygon_px) ? r.polygon_px : Array.isArray(r.polygon) ? r.polygon : [])
        .map((p: any) => ({ x: num(p?.x), y: num(p?.y) }))
        .filter((p: Pt) => !isNaN(p.x) && !isNaN(p.y)),
    );
    const allPts = pxPolys.flat();
    const maxX = allPts.reduce((m, p) => Math.max(m, p.x), 0);
    const maxY = allPts.reduce((m, p) => Math.max(m, p.y), 0);
    // If the model already answered in percent (all coords <= 100), treat the canvas as 100x100.
    const looksPercent = maxX <= 100 && maxY <= 100;
    const canvasW = looksPercent ? 100 : Math.max(num(parsed.image_width_px) || 0, maxX) || 100;
    const canvasH = looksPercent ? 100 : Math.max(num(parsed.image_height_px) || 0, maxY) || 100;
    const toPct = (p: Pt) => ({
      x: Math.min(100, Math.max(0, (p.x / canvasW) * 100)),
      y: Math.min(100, Math.max(0, (p.y / canvasH) * 100)),
    });

    let polys: Pt[][] = pxPolys.map((poly) => poly.map(toPct));

    // --- 2. Snap nearly-identical coordinates so shared walls line up instead of drifting.
    const snapAxis = (axis: "x" | "y", tol = 1.1) => {
      const values = polys.flat().map((p) => p[axis]).sort((a, b) => a - b);
      const clusters: number[][] = [];
      for (const v of values) {
        const last = clusters[clusters.length - 1];
        if (last && v - last[last.length - 1] <= tol) last.push(v);
        else clusters.push([v]);
      }
      const centres = clusters.map((c) => c.reduce((s, v) => s + v, 0) / c.length);
      polys = polys.map((poly) =>
        poly.map((p) => {
          let best = p[axis];
          let bestD = Infinity;
          for (const c of centres) {
            const d = Math.abs(c - p[axis]);
            if (d < bestD) {
              bestD = d;
              best = c;
            }
          }
          return { ...p, [axis]: bestD <= tol ? best : p[axis] } as Pt;
        }),
      );
    };
    snapAxis("x");
    snapAxis("y");

    // --- 3. Drop duplicate/collinear vertices so outlines stay clean.
    const cleanPoly = (poly: Pt[]) => {
      const out: Pt[] = [];
      for (const p of poly) {
        const prev = out[out.length - 1];
        if (prev && Math.abs(prev.x - p.x) < 0.05 && Math.abs(prev.y - p.y) < 0.05) continue;
        out.push({ x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100 });
      }
      if (out.length > 2) {
        const first = out[0];
        const last = out[out.length - 1];
        if (Math.abs(first.x - last.x) < 0.05 && Math.abs(first.y - last.y) < 0.05) out.pop();
      }
      return out;
    };
    polys = polys.map(cleanPoly);

    const shoelaceArea = (poly: Pt[]) => {
      let a = 0;
      for (let i = 0; i < poly.length; i++) {
        const p = poly[i];
        const q = poly[(i + 1) % poly.length];
        a += p.x * q.y - q.x * p.y;
      }
      return Math.abs(a) / 2; // in percent²
    };

    const mpp = num(parsed.metres_per_pixel);
    const rooms = rawRooms.map((r: any, i: number) => {
      const polygon = polys[i] || [];
      const xs = polygon.map((p) => p.x);
      const ys = polygon.map((p) => p.y);
      // Real-world size of the outline's bounding box, from the door-derived scale.
      const bboxW = xs.length ? ((Math.max(...xs) - Math.min(...xs)) / 100) * canvasW : 0;
      const bboxH = ys.length ? ((Math.max(...ys) - Math.min(...ys)) / 100) * canvasH : 0;
      const scaled = !looksPercent && mpp > 0;
      const width_m = num(r.width_m) > 0 ? Number(r.width_m) : scaled ? Math.round(bboxW * mpp * 100) / 100 : 0;
      const length_m = num(r.length_m) > 0 ? Number(r.length_m) : scaled ? Math.round(bboxH * mpp * 100) / 100 : 0;
      // Use the true polygon area (not w×h) so L-shapes are not over-counted.
      const polyAreaPx = shoelaceArea(polygon) * (canvasW / 100) * (canvasH / 100);
      const area_sqm =
        scaled && polyAreaPx > 0
          ? Math.round(polyAreaPx * mpp * mpp * 100) / 100
          : num(r.area_sqm) > 0
            ? Number(r.area_sqm)
            : Math.round(width_m * length_m * 100) / 100;

      const openings = (Array.isArray(r.openings) ? r.openings : []).map((o: any) => {
        const opx = num(o.x_px ?? o.x);
        const opy = num(o.y_px ?? o.y);
        const pt = !isNaN(opx) && !isNaN(opy) ? toPct({ x: opx, y: opy }) : null;
        return {
          type: o.type === "window" || o.type === "balcony" ? o.type : "door",
          wall_index: num(o.wall_index) || 0,
          position_pct: num(o.position_pct) || 50,
          width_m: num(o.width_m) || undefined,
          x: pt?.x,
          y: pt?.y,
        };
      });

      return {
        id: `room-${i}`,
        name: r.name || `Room ${i + 1}`,
        room_type: r.room_type || "other",
        confidence: num(r.confidence) || undefined,
        width_m,
        length_m,
        area_sqm,
        polygon,
        openings,
      };
    })
      // A room needs a usable outline.
      .filter((r: any) => r.polygon.length >= 3);

    return new Response(
      JSON.stringify({
        plan: {
          door_width_px: num(parsed.door_width_px) || undefined,
          metres_per_pixel: mpp || undefined,
          image_width_px: canvasW,
          image_height_px: canvasH,
          notes: parsed.notes,
          rooms,
          total_area_sqm:
            Math.round(rooms.reduce((s: number, r: any) => s + (r.area_sqm || 0), 0) * 100) / 100 ||
            num(parsed.total_area_sqm) ||
            undefined,
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
