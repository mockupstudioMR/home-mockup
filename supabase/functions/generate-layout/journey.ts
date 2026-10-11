// Journey step 4.3 "Choose a layout": one layout per call, built from the room, what the person does in it,
// what they keep and what can't move — and, unlike the older floor-plan mode, from the admin's data:
// standard sizes (furniture_specs), door and window rules (opening_rules) and room activities (room_activities).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchWithTimeout } from "../_shared/http.ts";

type Wall = "A" | "B" | "C" | "D";
export type JourneyLayoutRequest = {
  journey: true;
  roomType: string;
  widthM: number; // wall A / C
  lengthM: number; // wall B / D
  activities?: string[];
  priorities?: string[];
  style?: string;
  keep?: { name: string; w: number; d: number; wall?: Wall; fixedSpot?: boolean }[];
  fixed?: { kind: string; wall?: Wall; pos?: number }[];
  /** Earlier layouts, so the next one is genuinely different. */
  avoid?: string[];
  /** Which priority this layout should favour (0 = first). */
  emphasis?: number;
};

const SYSTEM = `You are an interior designer planning ONE furniture layout for a single room, seen from above.
Coordinates: the room is a rectangle; x and y are percent of its width (wall A at the top, wall C at the bottom, wall D on the left, wall B on the right).
Rules:
- Keep every door clear: respect each opening's clearance and keep a walking route from the main door across the room.
- Pieces the owner keeps MUST appear with their real size; if their spot is fixed, keep them on their wall.
- Use the standard sizes given (in cm) and convert them to percent of the room.
- Group pieces into zones that match what the owner does in the room (e.g. RELAX, MUSIC, DINING).
- Favour the owner's priority you are told to favour; mention the trade-off honestly.
Return through the tool:
- name: 2–4 words, plain (e.g. "Relax + piano", "More social seating")
- items: each { label, kind: sofa|chair|keep|table|rug|storage|bed|desk|other, x, y, w, h (percent), rotate: 0|90 }
- zones: each { label (one word, upper case), x, y, w, h, tone: plum|green }
- route: { x1, y1, x2, y2 } a straight dotted walking line in percent
- notes: exactly 3, each { ok: true|false, text } — two strengths and one honest limitation, max 9 words each, plain English.`;

export async function journeyLayout(body: JourneyLayoutRequest, apiKey: string) {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  let specs = "";
  let rules = "";
  let acts = "";
  if (url && key) {
    const db = createClient(url, key);
    const [{ data: s }, { data: r }, { data: a }] = await Promise.all([
      db.from("furniture_specs").select("name, variant, width_cm, depth_cm, min_clearance_cm, must_against_wall").eq("is_default", true).limit(80),
      db.from("opening_rules").select("opening_type, clearance_cm, attracts_furniture, repels_furniture"),
      db.from("room_activities").select("activity_name, furniture_items, preferred_zone, advisory_text").eq("room_type", body.roomType.replace(/-/g, "_")),
    ]);
    if (s?.length) specs = "\nStandard sizes (cm, from the size database):\n" + s.map((x) => `- ${x.name}${x.variant ? ` (${x.variant})` : ""}: ${x.width_cm}×${x.depth_cm}, clearance ${x.min_clearance_cm}${x.must_against_wall ? ", against a wall" : ""}`).join("\n");
    if (r?.length) rules = "\nDoor and window rules:\n" + r.map((x) => `- ${x.opening_type}: keep ${x.clearance_cm} cm clear${x.repels_furniture?.length ? `; not in front: ${x.repels_furniture.join(", ")}` : ""}${x.attracts_furniture?.length ? `; good near: ${x.attracts_furniture.join(", ")}` : ""}`).join("\n");
    const chosen = (a ?? []).filter((x) => (body.activities ?? []).some((y) => y.toLowerCase() === String(x.activity_name).toLowerCase()));
    if (chosen.length) acts = "\nWhat each activity needs:\n" + chosen.map((x) => `- ${x.activity_name}: ${(x.furniture_items ?? []).join(", ")}${x.preferred_zone ? `; zone ${x.preferred_zone}` : ""}${x.advisory_text ? `; ${x.advisory_text}` : ""}`).join("\n");
  }
  const fav = body.priorities?.[body.emphasis ?? 0];
  const user = `Room: ${body.roomType.replace(/-/g, " ")}, ${body.widthM} m wide (walls A/C) × ${body.lengthM} m deep (walls B/D).
Style: ${body.style ?? "not set"}.
Activities: ${(body.activities ?? []).join(", ") || "not set"}.
Priorities in order: ${(body.priorities ?? []).join(", ") || "not set"}. Favour: ${fav ?? "a balanced plan"}.
Keeping: ${(body.keep ?? []).map((k) => `${k.name} ${k.w}×${k.d} cm${k.wall ? ` on wall ${k.wall}` : ""}${k.fixedSpot ? " (fixed spot)" : " (may move)"}`).join("; ") || "nothing"}.
Can't move: ${(body.fixed ?? []).map((f) => `${f.kind}${f.wall ? ` on wall ${f.wall}` : ""}${f.pos != null ? ` at ${f.pos}%` : ""}`).join("; ") || "nothing"}.${specs}${rules}${acts}
${body.avoid?.length ? `Make it clearly different from: ${body.avoid.join("; ")}.` : ""}`;

  const res = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: user }],
      tools: [{
        type: "function",
        function: {
          name: "layout",
          description: "One furniture layout for the room",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string" },
              items: { type: "array", items: { type: "object", properties: { label: { type: "string" }, kind: { type: "string" }, x: { type: "number" }, y: { type: "number" }, w: { type: "number" }, h: { type: "number" }, rotate: { type: "number" } }, required: ["label", "kind", "x", "y", "w", "h"] } },
              zones: { type: "array", items: { type: "object", properties: { label: { type: "string" }, x: { type: "number" }, y: { type: "number" }, w: { type: "number" }, h: { type: "number" }, tone: { type: "string" } }, required: ["label", "x", "y", "w", "h"] } },
              route: { type: "object", properties: { x1: { type: "number" }, y1: { type: "number" }, x2: { type: "number" }, y2: { type: "number" } } },
              notes: { type: "array", items: { type: "object", properties: { ok: { type: "boolean" }, text: { type: "string" } }, required: ["ok", "text"] } },
            },
            required: ["name", "items", "notes"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "layout" } },
    }),
  });
  if (!res.ok) return { status: res.status, body: { error: res.status === 429 ? "Rate limited, please try again shortly." : res.status === 402 ? "AI credits are used up for now." : `AI error: ${res.status}` } };
  const data = await res.json();
  const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return { status: 502, body: { error: "No layout came back. Try again." } };
  return { status: 200, body: { layout: JSON.parse(args) } };
}
