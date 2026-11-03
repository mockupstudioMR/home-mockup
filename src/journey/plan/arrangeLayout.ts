/**
 * Step 4.3 layouts, part AI and part rules. The AI picks which furniture groupings suit the room and the person,
 * and roughly where (a wall and how far along it). The size table and the groupings' offsets
 * (furniture_specs, furniture_groupings) then place every piece exactly, facing the right way, clear of doors,
 * windows and radiators (supabase/functions/_shared/arrange.ts). An AI answer in the older format (pieces with
 * positions) is turned into the same requests, and when the AI can't be reached the groupings for the room's
 * activities are placed on their own.
 */
import { supabase } from "@/lib/looseDb";
import { arrange, fallbackGroups, type Arrangement, type GroupRequest, type KeepRequest, type Opening, type Wall } from "../../../supabase/functions/_shared/arrange";
import { findSpec, groupingsFor, mergeGroupings, mergeSpecs, type Grouping, type Spec } from "../../../supabase/functions/_shared/layoutRules";
import { curRoom, uid, type JourneyState, type Layout, type LayoutItem } from "../state";

export type Rules = { specs: Spec[]; groupings: Grouping[] };

let cached: Promise<Rules> | null = null;
/** The size and grouping tables, with the built-in defaults for anything they don't have (or before they exist). */
export function loadRules(): Promise<Rules> {
  cached ??= (async () => {
    const [specs, groups, members] = await Promise.all([
      supabase.from("furniture_specs").select("*").then((r: { data: unknown[] | null }) => r.data, () => null),
      supabase.from("furniture_groupings").select("*").then((r: { data: unknown[] | null }) => r.data, () => null),
      supabase.from("furniture_grouping_members").select("*").order("sort").then((r: { data: unknown[] | null }) => r.data, () => null),
    ]);
    type Row = Record<string, unknown>;
    const byGroup = new Map<string, Row[]>();
    for (const m of (members ?? []) as Row[]) byGroup.set(String(m.grouping_id), [...(byGroup.get(String(m.grouping_id)) ?? []), m]);
    const rows = ((groups ?? []) as Row[]).map((g) => ({ ...(g as unknown as Grouping), is_active: g.is_active as boolean, members: (byGroup.get(String(g.id)) as unknown as Grouping["members"]) ?? [] }));
    return { specs: mergeSpecs(specs as Partial<Spec>[] | null), groupings: mergeGroupings(rows) };
  })().catch(() => {
    cached = null;
    return { specs: mergeSpecs(null), groupings: mergeGroupings(null) };
  });
  return cached;
}

const cm = (s: JourneyState) => ({ W: Math.round((s.room.widthM ?? 3.75) * 100), L: Math.round((s.room.lengthM ?? 4.9) * 100) });
const openingsOf = (s: JourneyState): Opening[] => s.placements.filter((p) => p.wall && p.pos != null).map((p) => ({ kind: p.kind, wall: p.wall as Wall, pos: p.pos }));
const keepOf = (s: JourneyState): KeepRequest[] =>
  s.keeping.filter((k) => k.status !== "buy").map((k) => ({ name: k.name, w: k.w ?? 100, d: k.d ?? 50, wall: (k.wall as Wall) ?? null, along: k.pos ?? null, fixedSpot: k.fixedSpot }));

/** The groupings that suit this room and what happens in it, best first. */
export function roomGroupings(s: JourneyState, rules: Rules) {
  return groupingsFor(rules.groupings, curRoom(s) ?? "living-room", s.activities);
}

/** Place the requested groupings and turn them into a layout for the plan (percent of the room). */
export function placeLayout(s: JourneyState, rules: Rules, groups: GroupRequest[], meta: { name?: string; notes?: Layout["notes"] } = {}): Layout {
  const { W, L } = cm(s);
  const a = arrange({ W, L, openings: openingsOf(s), groups, keep: keepOf(s), specs: rules.specs, groupings: rules.groupings });
  return toLayout(a, W, L, s, groups, meta);
}

const pc = (v: number, of: number) => Math.round((v / of) * 1000) / 10;

function toLayout(a: Arrangement, W: number, L: number, s: JourneyState, groups: GroupRequest[], meta: { name?: string; notes?: Layout["notes"] }): Layout {
  const items: LayoutItem[] = a.items.map((p) => ({ label: p.label, kind: p.kind, x: pc(p.x, W), y: pc(p.y, L), w: pc(p.w, W), h: pc(p.h, L), facing: p.facing, group: p.group, symbol: p.symbol, symbolFront: p.symbolFront }));
  const zones = a.zones.filter((z) => z.label).map((z, i) => ({ label: z.label, x: pc(z.x, W), y: pc(z.y, L), w: pc(z.w, W), h: pc(z.h, L), tone: i % 2 ? "green" : "plum" }));
  // a walking line from the main door into the room
  const door = s.placements.find((p) => p.kind === "doors" && p.wall && p.pos != null);
  const route = door
    ? (() => {
        const at = door.pos!;
        const start = door.wall === "A" ? { x: at, y: 4 } : door.wall === "C" ? { x: at, y: 96 } : door.wall === "D" ? { x: 4, y: at } : { x: 96, y: at };
        return { x1: start.x, y1: start.y, x2: 50, y2: 50 };
      })()
    : undefined;
  // say what the rules changed from what was asked, before the AI's own notes (which may describe the asked-for spot)
  const notes: Layout["notes"] = [];
  for (const m of a.moved) notes.push({ ok: false, text: `${m.name} moved to wall ${m.to} to fit` });
  for (const n of a.left_out) notes.push({ ok: false, text: `No room for: ${n.toLowerCase()}` });
  notes.push(...(a.moved.length ? (meta.notes ?? []).filter((n) => n.ok === false || !/wall|window|door|facing|faces/i.test(n.text)) : meta.notes ?? []));
  void groups;
  return {
    id: uid(),
    name: meta.name || "Your layout",
    items,
    zones,
    route,
    notes: (notes.length ? notes : [{ ok: true, text: "Every piece at its real size" }, { ok: true, text: "Doors and walking route kept clear" }]).slice(0, 4),
  };
}

/**
 * An AI answer in the older format (pieces with positions in percent): the main pieces it placed become grouping
 * requests on the wall they're nearest, so the rules place everything properly.
 */
export function requestsFromItems(items: { label?: string; kind?: string; x: number; y: number; w: number; h: number }[], s: JourneyState, rules: Rules): GroupRequest[] {
  const options = roomGroupings(s, rules);
  const out: GroupRequest[] = [];
  const used = new Set<string>();
  const match = (text: string) =>
    options.find((g) => !used.has(g.key) && (text.includes(g.anchor_name) || (g.anchor_name.includes("sofa") && /sofa|couch/.test(text)) || (g.anchor_name === "bed" && /\bbed\b/.test(text)) || (g.anchor_name === "dining table" && /dining|table for/.test(text)) || (g.anchor_name === "desk" && /desk/.test(text)) || (g.anchor_name === "wardrobe" && /wardrobe|closet/.test(text))));
  for (const i of items) {
    const g = match(`${i.label ?? ""} ${i.kind ?? ""}`.toLowerCase());
    if (!g) continue;
    // a second sofa grouping would mean two sofas
    if (g.anchor_name.includes("sofa") && out.some((o) => rules.groupings.find((x) => x.key === o.key)?.anchor_name.includes("sofa"))) continue;
    used.add(g.key);
    const cx = i.x + i.w / 2, cy = i.y + i.h / 2;
    if (g.anchor_place === "floating") {
      out.push({ key: g.key, cx, cy });
      continue;
    }
    const gaps: [Wall, number][] = [["A", i.y], ["C", 100 - (i.y + i.h)], ["D", i.x], ["B", 100 - (i.x + i.w)]];
    const wall = gaps.sort((a, b) => a[1] - b[1])[0][0];
    out.push({ key: g.key, wall, along: wall === "A" || wall === "C" ? cx : cy });
  }
  return out;
}

/** When the AI isn't there: the best groupings for the room's activities, placed by the rules alone. */
export function fallbackLayout(s: JourneyState, rules: Rules, avoid: string[] = []): Layout {
  const { W, L } = cm(s);
  const options = roomGroupings(s, rules);
  // another layout: start from a different grouping so it isn't the same plan again
  const shift = avoid.length % Math.max(1, options.length);
  const reordered = [...options.slice(shift), ...options.slice(0, shift)];
  const groups = fallbackGroups(reordered, openingsOf(s), W, L);
  const first = rules.groupings.find((g) => g.key === groups[0]?.key);
  return placeLayout(s, rules, groups, { name: first ? first.name : "Room plan" });
}

/** The floor a grouping needs (width along its wall × depth into the room, cm), measured by placing it. */
export function footprint(g: Grouping, rules: Rules): { width_cm: number; depth_cm: number } {
  const a = arrange({ W: 3000, L: 3000, openings: [], groups: [{ key: g.key, wall: g.anchor_place === "wall" ? "A" : null, along: 50 }], specs: rules.specs, groupings: [g] });
  const near = a.items.filter((p) => !p.optional && (g.anchor_place === "floating" || p.y < 1500));
  if (!near.length) return { width_cm: 0, depth_cm: 0 };
  const x0 = Math.min(...near.map((p) => p.x)), x1 = Math.max(...near.map((p) => p.x + p.w));
  const y0 = Math.min(...near.map((p) => p.y)), y1 = Math.max(...near.map((p) => p.y + p.h));
  return { width_cm: Math.round(x1 - x0), depth_cm: Math.round(y1 - y0) };
}

/** The spec behind a placed piece, for its real size. */
export const specFor = (rules: Rules, label: string) => findSpec(rules.specs, label.toLowerCase());
