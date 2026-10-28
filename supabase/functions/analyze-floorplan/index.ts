import "../_shared/language.ts";
import { requireUser } from "../_shared/auth.ts";
import { fetchWithTimeout } from "../_shared/http.ts";
import { WRITTEN_RULES, WRITTEN_SCHEMA, mergeSize, readWritten } from "../_shared/dimensions.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const caller = await requireUser(req, corsHeaders);
  if (caller instanceof Response) return caller;

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
- length_m: its length in meters. If a size is printed on the plan for that wall, use it. Otherwise use a scale bar, or estimate from a standard interior door (about 0.85 m wide).
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

    // A separate, focused pass that only copies the numbers printed on the plan: models read small text far more
    // reliably when that is the whole task. The text is turned into metres here (_shared/dimensions.ts), not by the model.
    const readPrompt = `You read the text printed on a floor plan. Your only job is to copy the room's printed sizes exactly.

${WRITTEN_RULES}

If the plan shows several rooms, report the main / largest room (the one the photo focuses on).`;

    const ask = async (model: string, system: string, text: string, tool: { name: string; description: string; parameters: unknown }) => {
      const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            {
              role: "user",
              content: [
                { type: "text", text },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
          tools: [{ type: "function", function: tool }],
          tool_choice: { type: "function", function: { name: tool.name } },
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error("AI gateway error:", model, response.status, errText);
        throw new Error(`AI error: ${response.status}`);
      }
      const aiData = await response.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) throw new Error("No tool call in response");
      return JSON.parse(toolCall.function.arguments);
    };

    const shapeTool = {
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
    };
    const readTool = { name: "copy_printed_sizes", description: "Copy the room's sizes exactly as printed on the plan", parameters: WRITTEN_SCHEMA };

    // Reading small printed numbers needs the strongest vision model; fall back if it isn't available.
    const readSizes = async () => {
      for (const model of ["google/gemini-2.5-pro", "google/gemini-2.5-flash"]) {
        try {
          return await ask(model, readPrompt, "Copy every size printed for this room, exactly as written.", readTool);
        } catch (e) {
          console.warn("analyze-floorplan: printed-size read failed on", model, (e as Error).message);
        }
      }
      return null;
    };

    const [parsed, writtenText] = await Promise.all([
      ask("google/gemini-2.5-flash", systemPrompt, "Analyze this floor plan image and extract the room shape as wall segments with angles. Be precise about proportions.", shapeTool),
      readSizes(),
    ]);

    // Printed numbers beat the shape pass's estimate; only what isn't printed stays estimated.
    const written = readWritten(writtenText);
    const walls: { length_m: number; angle_deg: number }[] = Array.isArray(parsed.walls) ? parsed.walls : [];
    if (walls.length >= 2 && Object.keys(written).length) {
      const est = { width: Number(walls[0].length_m) || 0, length: Number(walls[1].length_m) || 0 };
      const size = mergeSize(written, est);
      if (walls.length === 4) {
        walls[0].length_m = walls[2].length_m = size.width;
        walls[1].length_m = walls[3].length_m = size.length;
      } else {
        // other shapes: horizontal and vertical walls scale with their printed side
        const kw = est.width ? size.width / est.width : 1, kl = est.length ? size.length / est.length : 1;
        walls.forEach((w, i) => (w.length_m = Math.round(w.length_m * (i % 2 === 0 ? kw : kl) * 100) / 100));
      }
      parsed.walls = walls;
      parsed.written_dimensions = { width_m: written.width, length_m: written.length, area_sqm: written.area };
      parsed.dimensions_source = size.source;
      if (written.area) parsed.estimated_area_sqm = written.area;
    } else {
      parsed.dimensions_source = { width: "estimated", length: "estimated" };
    }
    parsed.printed_text = writtenText ?? null;

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
