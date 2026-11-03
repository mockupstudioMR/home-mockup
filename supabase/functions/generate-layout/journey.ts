// Journey step 4.3 "Choose a layout": one layout per call. The AI only chooses which furniture groupings suit the
// room and the person (sofa + coffee table + TV, bed + nightstands, table + chairs …) and where they go: which wall
// and how far along it, or a spot for a free-standing table. The pieces are then placed by rules — the size table
// (furniture_specs), the groupings' offsets (furniture_groupings) and _shared/arrange.ts — so every piece has its
// real size, faces the right way and keeps doors, windows and radiators clear.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchWithTimeout } from "../_shared/http.ts";
import { arrange, fallbackGroups, type GroupRequest, type Wall } from "../_shared/arrange.ts";
import { groupingsFor, mergeGroupings, mergeSpecs, type Grouping, type Spec } from "../_shared/layoutRules.ts";

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
  /** The groupings the app offers for this room, with the floor each needs. */
  groupings?: { key: string; name: string; place: string; activities: string[]; width_cm?: number; depth_cm?: number }[];
  /** Earlier layouts, so the next one is genuinely different. */
  avoid?: string[];
  /** Which priority this layout should favour (0 = first). */
  emphasis?: number;
};

const SYSTEM = `You are an interior designer planning ONE furniture layout for a single room, seen from above.
The room is a rectangle: wall A at the top, wall C at the bottom, wall D on the left, wall B on the right.
You don't draw the furniture. You choose GROUPINGS from the list you are given (each is a set of pieces that belong
together, e.g. a sofa with its coffee table and TV) and say where each goes. The pieces are then placed at their
real sizes by the app, facing the right way.
- For a grouping placed against a wall: give the wall (A, B, C or D) its main piece stands against, and "along" =
  where its middle is along that wall in percent (walls A and C from the left, B and D from the top).
- For a free-standing grouping (e.g. a dining table): give cx, cy = its centre in percent of the room's width and depth.
Rules:
- Choose 1 to 4 groupings that serve the owner's activities, favouring the priority you are told to favour. Never
  two groupings with the same main piece (not two sofas, not two beds).
- Keep doors clear and leave a walking route from the main door. Don't put a bed's head or tall storage under a window.
- A sofa usually backs onto the wall opposite the TV or focal point; a bed's head goes on a solid wall, ideally not
  facing the door directly; a desk often sits beside or facing a window.
- Check each grouping's floor need against the wall length and the room before choosing it.
Return through the tool:
- name: 2–4 words, plain (e.g. "Relax + piano", "More social seating")
- groups: [{ key, wall, along } or { key, cx, cy }], optionally zone: one upper-case word
- notes: exactly 3, each { ok: true|false, text } — two strengths and one honest limitation, max 9 words each, plain English.`;

export async function journeyLayout(body: JourneyLayoutRequest, apiKey: string) {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  let specs: Spec[] = mergeSpecs(null);
  let groupings: Grouping[] = mergeGroupings(null);
  let rules = "";
  if (url && key) {
    const db = createClient(url, key);
    const [{ data: s }, { data: g }, { data: m }, { data: r }] = await Promise.all([
      db.from("furniture_specs").select("*"),
      db.from("furniture_groupings").select("*"),
      db.from("furniture_grouping_members").select("*").order("sort"),
      db.from("opening_rules").select("opening_type, clearance_cm, attracts_furniture, repels_furniture"),
    ]);
    specs = mergeSpecs(s as Partial<Spec>[] | null);
    if (g?.length) {
      const by = new Map<string, unknown[]>();
      for (const x of m ?? []) by.set(x.grouping_id, [...(by.get(x.grouping_id) ?? []), x]);
      groupings = mergeGroupings(g.map((x) => ({ ...x, members: by.get(x.id) ?? [] })) as never);
    }
    if (r?.length) rules = "\nDoor and window rules:\n" + r.map((x) => `- ${x.opening_type}: keep ${x.clearance_cm} cm clear${x.repels_furniture?.length ? `; not in front: ${x.repels_furniture.join(", ")}` : ""}${x.attracts_furniture?.length ? `; good near: ${x.attracts_furniture.join(", ")}` : ""}`).join("\n");
  }
  const options = body.groupings?.length ? body.groupings : groupingsFor(groupings, body.roomType, body.activities).map((g) => ({ key: g.key, name: g.name, place: g.anchor_place, activities: g.activities }));
  const W = Math.round(body.widthM * 100), L = Math.round(body.lengthM * 100);
  const fav = body.priorities?.[body.emphasis ?? 0];
  const user = `Room: ${body.roomType.replace(/-/g, " ")}, ${body.widthM} m wide (walls A/C) × ${body.lengthM} m deep (walls B/D).
Style: ${body.style ?? "not set"}.
Activities: ${(body.activities ?? []).join(", ") || "not set"}.
Priorities in order: ${(body.priorities ?? []).join(", ") || "not set"}. Favour: ${fav ?? "a balanced plan"}.
Keeping (placed first): ${(body.keep ?? []).map((k) => `${k.name} ${k.w}×${k.d} cm${k.wall ? ` on wall ${k.wall}` : ""}${k.fixedSpot ? " (fixed spot)" : ""}`).join("; ") || "nothing"}.
Can't move: ${(body.fixed ?? []).map((f) => `${f.kind}${f.wall ? ` on wall ${f.wall}` : ""}${f.pos != null ? ` at ${f.pos}%` : ""}`).join("; ") || "nothing"}.${rules}
Groupings you can choose from (key — name — against a wall or free-standing — floor it needs — serves):
${options.map((o) => `- ${o.key} — ${o.name} — ${o.place === "floating" ? "free-standing" : "against a wall"}${o.width_cm ? ` — ${o.width_cm}×${o.depth_cm} cm` : ""} — ${o.activities.join(", ")}`).join("\n")}
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
          description: "Which furniture groupings go where in the room",
          parameters: {
            type: "object",
            properties: {
              name: { type: "string" },
              groups: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string", enum: options.map((o) => o.key) },
                    wall: { type: "string", enum: ["A", "B", "C", "D"] },
                    along: { type: "number" },
                    cx: { type: "number" },
                    cy: { type: "number" },
                    zone: { type: "string" },
                  },
                  required: ["key"],
                },
              },
              notes: { type: "array", items: { type: "object", properties: { ok: { type: "boolean" }, text: { type: "string" } }, required: ["ok", "text"] } },
            },
            required: ["name", "groups", "notes"],
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "layout" } },
    }),
  });
  let plan: { name?: string; groups?: GroupRequest[]; notes?: { ok: boolean; text: string }[] } | null = null;
  if (res.ok) {
    const data = await res.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (args) plan = JSON.parse(args);
  } else if (res.status === 402 || res.status === 429) {
    return { status: res.status, body: { error: res.status === 429 ? "Rate limited, please try again shortly." : "AI credits are used up for now." } };
  } else {
    console.warn("generate-layout journey: AI error", res.status);
  }
  const openings = (body.fixed ?? []).map((f) => ({ kind: f.kind, wall: f.wall ?? null, pos: f.pos ?? null }));
  const groups = plan?.groups?.length ? plan.groups : fallbackGroups(groupingsFor(groupings, body.roomType, body.activities), openings, W, L);
  // placed here too, so any caller gets real pieces; the app places them again with the same rules
  const placed = arrange({ W, L, openings, groups, keep: (body.keep ?? []).map((k) => ({ name: k.name, w: k.w, d: k.d, wall: k.wall ?? null, fixedSpot: k.fixedSpot })), specs, groupings });
  const pc = (v: number, of: number) => Math.round((v / of) * 1000) / 10;
  return {
    status: 200,
    body: {
      layout: {
        name: plan?.name ?? "Room plan",
        notes: plan?.notes ?? [],
        plan: { groups },
        items: placed.items.map((p) => ({ label: p.label, kind: p.kind, x: pc(p.x, W), y: pc(p.y, L), w: pc(p.w, W), h: pc(p.h, L), facing: p.facing, symbol: p.symbol })),
        zones: placed.zones.map((z) => ({ label: z.label, x: pc(z.x, W), y: pc(z.y, L), w: pc(z.w, W), h: pc(z.h, L) })),
      },
    },
  };
}
