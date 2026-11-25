/**
 * A wall seen straight on, as a measured outline (step 5 "Your walls").
 * Built only from what the journey already knows: the room size (4.2), the chosen layout (4.4),
 * the things that can't move (4.3), the pieces being kept (5) and the wall's items (composeWalls).
 *
 * Units are centimetres. x runs left to right as you face the wall from inside the room;
 * y runs down from the ceiling. Walls: A top of the plan, B right, C bottom, D left.
 */
import type { JourneyState, LayoutItem, Wall, WallItem, WallPlan } from "./state";

export type Box = { x: number; y: number; w: number; h: number };
export type OutlinePiece = Box & {
  ref: string; label: string; kind: string; kept: boolean;
  /** How a seat of a set is seen: from the side with its back to the left or right, or from the front. */
  view?: "side-left" | "side-right" | "front";
  /** The table (or desk) a seat belongs to, when they form a set. */
  set?: string;
};
export type OutlineOpening = Box & { kind: "window" | "door" };
export type OutlineFixed = Box & { kind: "radiator" | "column" | "builtin" | "panel" | "stack"; label: string };
export type OutlinePoint = { x: number; y: number; kind: "socket"; placed: boolean };
export type Outline = {
  wall: Wall;
  length: number;
  height: number;
  /** Example room size: not measured yet. */
  example: boolean;
  openings: OutlineOpening[];
  fixed: OutlineFixed[];
  pieces: OutlinePiece[];
  points: OutlinePoint[];
  /** Where each wall item's numbered pin sits, by item n. */
  pins: Record<number, { x: number; y: number }>;
  /** Item numbers in reading order: left to right along the wall. */
  order: number[];
  /** Pieces that belong to this wall but stand out in the room: listed, not drawn. */
  free: { ref: string; label: string; gapCm: number }[];
  /** The layout boxes on this wall (a furniture grouping, a table with its chairs), each around its pieces. */
  boxes: { key: string; label: string; x: number; w: number; h: number }[];
};

const EXAMPLE = { width: 3.75, length: 4.9, ceiling: 2.7 };

/** Wall lengths in cm: A and C use the room width, B and D its length (as in step 4.2). */
export function wallLength(s: JourneyState, w: Wall) {
  const width = s.room.widthM ?? EXAMPLE.width;
  const length = s.room.lengthM ?? EXAMPLE.length;
  return Math.round((w === "A" || w === "C" ? width : length) * 100);
}

/** Start and end along the wall, 0–100, as seen from inside the room. */
export function alongWall(w: Wall, i: { x: number; y: number; w: number; h: number }): [number, number] {
  if (w === "A") return [i.x, i.x + i.w];
  if (w === "B") return [i.y, i.y + i.h];
  if (w === "C") return [100 - (i.x + i.w), 100 - i.x];
  return [100 - (i.y + i.h), 100 - i.y];
}
/** A stored position (0–100 along the plan's x for A/C, y for B/D) as seen from inside. */
const facing = (w: Wall, pos: number) => (w === "C" || w === "D" ? 100 - pos : pos);

export type RoomSize = { w: number; l: number };

/**
 * Which wall a layout piece belongs to, so every piece is drawn on exactly one wall:
 * - a long piece (a TV unit, a desk, a sideboard, a coffee table) on the nearer of the two walls its long
 *   side runs along, never on a wall it only shows its end to;
 * - a squarish piece, a bed (it stands with its head to the wall) or a kept piece on the nearest wall.
 * Give the room's size in metres when known, so "long" is measured in metres rather than plan percent.
 */
export function nearestWall(i: { x: number; y: number; w: number; h: number; kind?: string; label?: string }, room?: RoomSize): Wall {
  const d = { A: i.y, C: 100 - (i.y + i.h), D: i.x, B: 100 - (i.x + i.w) };
  const byGap = (ws: Wall[]) => ws.sort((a, b) => d[a] - d[b])[0];
  const t = `${i.kind ?? ""} ${i.label ?? ""}`.toLowerCase();
  const wM = i.w * (room?.w ?? 1), dM = i.h * (room?.l ?? 1);
  if (!/\bbed\b|keep|rug/.test(t)) {
    if (wM >= dM * 1.3) return byGap(["A", "C"]);
    if (dM >= wM * 1.3) return byGap(["B", "D"]);
  }
  return byGap(["A", "B", "C", "D"]);
}

/* ---------- sets: a table and the chairs around it ---------- */

const SEAT = /chair|stool|bench/;
const HUB = /dining|table|desk/;
const NOT_HUB = /coffee|side|bedside|night|console|tv|media/;
const words = (it: { kind: string; label?: string }) => `${it.kind} ${it.label ?? ""}`.toLowerCase();
export const isSeat = (it: { kind: string; label?: string }) => SEAT.test(words(it)) && !/sofa|bench seat/.test(words(it));
export const isHub = (it: { kind: string; label?: string }) => HUB.test(words(it)) && !NOT_HUB.test(words(it)) && !SEAT.test(words(it));
const gap = (a: Box, b: Box) => Math.max(0, a.x - (b.x + b.w), b.x - (a.x + a.w), a.y - (b.y + b.h), b.y - (a.y + a.h));

/**
 * Tables (and desks) with the chairs standing at them, as sets: each item's index → the indices of its set
 * (hub first), for items that belong to one. A chair belongs to the nearest table within about 8% of the room.
 */
export function seatSets(items: (Box & { kind: string; label?: string })[]): Map<number, number[]> {
  const hubs = items.map((it, i) => (isHub(it) ? i : -1)).filter((i) => i >= 0);
  const members = new Map<number, number[]>();
  items.forEach((it, i) => {
    if (!isSeat(it) || !hubs.length) return;
    const best = hubs.map((h) => ({ h, g: gap(it, items[h]) })).sort((a, b) => a.g - b.g)[0];
    if (best.g <= 8) members.set(best.h, [...(members.get(best.h) ?? []), i]);
  });
  const out = new Map<number, number[]>();
  for (const [h, ms] of members) { const all = [h, ...ms]; for (const i of all) out.set(i, all); }
  return out;
}

/**
 * The one wall each item is drawn on. A table and the chairs at it go together on the wall nearest the
 * whole set, so the set always shows whole and no piece is drawn on two walls.
 */
type Placed = Box & { kind: string; label?: string; group?: string };

/**
 * The layout's boxes: the pieces placed together as one furniture grouping (a sofa with its coffee table,
 * armchairs and rug; a desk with its chair), or, where a piece has no grouping, a table with the chairs at it.
 * Each item's index → its box's indices, its main piece first (the largest piece that isn't a rug).
 */
export function layoutBoxes(items: Placed[]): Map<number, number[]> {
  const out = new Map<number, number[]>();
  const byGroup = new Map<string, number[]>();
  items.forEach((it, i) => { if (it.group) byGroup.set(it.group, [...(byGroup.get(it.group) ?? []), i]); });
  const area = (i: number) => (items[i].kind === "rug" ? -1 : items[i].w * items[i].h);
  for (const ids of byGroup.values()) {
    if (ids.length < 2) continue;
    const box = [...ids].sort((a, b) => area(b) - area(a));
    for (const i of ids) out.set(i, box);
  }
  // tables with their chairs, where none of them already belongs to a grouping
  const grouped = new Set(out.keys());
  for (const [i, set] of seatSets(items)) if (set.every((j) => !grouped.has(j))) out.set(i, set);
  return out;
}

const unionOf = (xs: Box[]): Box => {
  const x0 = Math.min(...xs.map((b) => b.x)), y0 = Math.min(...xs.map((b) => b.y));
  return { x: x0, y: y0, w: Math.max(...xs.map((b) => b.x + b.w)) - x0, h: Math.max(...xs.map((b) => b.y + b.h)) - y0 };
};

/**
 * The one wall each item is drawn on. A layout box always goes whole on one wall: the wall its main piece stands
 * against (the sofa's, so its coffee table, armchairs and rug come along), or, for a box standing out in the room
 * (a dining set in the middle), the wall nearest the whole box. No piece is drawn on two walls.
 */
export function homeWalls(items: Placed[], room?: RoomSize): Wall[] {
  const boxes = layoutBoxes(items);
  const W = (room?.w ?? EXAMPLE.width) * 100, L = (room?.l ?? EXAMPLE.length) * 100;
  const gapTo = (b: Box, w: Wall) => ({ A: (b.y / 100) * L, C: ((100 - b.y - b.h) / 100) * L, D: (b.x / 100) * W, B: ((100 - b.x - b.w) / 100) * W })[w];
  const memo = new Map<number[], Wall>();
  return items.map((it, i) => {
    const box = boxes.get(i);
    if (!box) return nearestWall(it, room);
    if (!memo.has(box)) {
      const main = items[box[0]], w = nearestWall(main, room);
      memo.set(box, gapTo(main, w) <= 60 ? w : nearestWall({ ...unionOf(box.map((j) => items[j])), kind: "set" }, room));
    }
    return memo.get(box)!;
  });
}

/* ---------- free-standing pieces ---------- */

const NEAR_CM = 60;
const IN_FRONT_CM = 120;

/**
 * Which pieces stand out in the room rather than at their wall: more than about 60 cm out (a table set: the
 * whole set), unless they stand in front of a piece that is at the wall (a coffee table before the sofa).
 * A wall's outline and picture show only what is at the wall; free-standing pieces are listed under it and
 * shown in the whole-room picture. Rugs are never free-standing: they go with the piece above them.
 */
export function freeStanding(items: Placed[], room?: RoomSize): { free: boolean[]; gap: number[] } {
  const W = (room?.w ?? EXAMPLE.width) * 100, L = (room?.l ?? EXAMPLE.length) * 100;
  const home = homeWalls(items, room), sets = layoutBoxes(items);
  const gapOf = (b: Box, w: Wall) => ({ A: (b.y / 100) * L, C: ((100 - b.y - b.h) / 100) * L, D: (b.x / 100) * W, B: ((100 - b.x - b.w) / 100) * W })[w];
  const box = (i: number): Box => {
    const set = sets.get(i);
    if (!set) return items[i];
    const xs = set.map((j) => items[j]);
    const x0 = Math.min(...xs.map((b) => b.x)), y0 = Math.min(...xs.map((b) => b.y));
    return { x: x0, y: y0, w: Math.max(...xs.map((b) => b.x + b.w)) - x0, h: Math.max(...xs.map((b) => b.y + b.h)) - y0 };
  };
  const gaps = items.map((_, i) => gapOf(box(i), home[i]));
  // a piece of a layout box is always drawn with its box
  const near = items.map((it, i) => it.kind === "rug" || it.kind === "keep" || (sets.get(i)?.length ?? 0) > 1 || gaps[i] <= NEAR_CM);
  // only small pieces you sit at or set things on stand "in front" of another (never a TV unit or shelving)
  const FRONT = /table|chair|stool|ottoman|pouf|bench|lamp|plant/;
  const BOUND = /tv|media|sideboard|console|book|shel|wardrobe|dresser|cabinet|storage|piano/;
  const free = items.map((it, i) => {
    if (near[i]) return false;
    const t = `${it.kind} ${it.label ?? ""}`.toLowerCase();
    if (!FRONT.test(t) || BOUND.test(t)) return true;
    // in front of a piece at the same wall, close by and overlapping along the wall
    const [a, b] = alongWall(home[i], box(i));
    return !items.some((o, j) => {
      if (j === i || !near[j] || o.kind === "rug" || home[j] !== home[i]) return false;
      const [c, d] = alongWall(home[j], o);
      const overlap = Math.min(b, d) - Math.max(a, c);
      const depth = home[j] === "A" || home[j] === "C" ? (o.h / 100) * L : (o.w / 100) * W;
      const between = gaps[i] - (gapOf(o, home[j]) + depth); // floor between the front of the one and the back of the other
      return overlap > 0.3 * Math.min(b - a, d - c) && between <= IN_FRONT_CM;
    });
  });
  return { free, gap: gaps };
}

/* ---------- keeping doors (and windows) clear ---------- */

/** A piece along a wall, in cm from its left end: `against` when it stands against the wall itself. */
export type Span = { id: string; x: number; w: number; h: number; against: boolean; group?: string; /** cm out from the wall */ gap?: number };
/**
 * Something that must stay clear: a door from the floor up, a window from its sill up (cm above the floor),
 * for pieces standing within `depth` cm of the wall (a door's swing; a piece 2 m out doesn't block it).
 */
export type Block = { x: number; w: number; from: number; depth?: number };

/**
 * How far (cm, along the wall) each piece must slide so nothing stands in front of a door, nothing taller
 * than a sill stands in front of a window, and pieces against the wall don't overlap each other. A table
 * with its chairs moves as one. Each piece moves as little as it can; one that fits nowhere stays put.
 */
export function keepClear(len: number, spans: Span[], blocks: Block[], margin = 10): Record<string, number> {
  type Unit = { key: string; ids: string[]; x: number; w: number; h: number; against: boolean; gap: number };
  const units = new Map<string, Unit>();
  for (const sp of spans) {
    const key = sp.group ?? sp.id, u = units.get(key);
    if (!u) { units.set(key, { key, ids: [sp.id], x: sp.x, w: sp.w, h: sp.h, against: sp.against, gap: sp.gap ?? 0 }); continue; }
    const x1 = Math.max(u.x + u.w, sp.x + sp.w);
    u.x = Math.min(u.x, sp.x); u.w = x1 - u.x; u.h = Math.max(u.h, sp.h); u.against ||= sp.against; u.gap = Math.min(u.gap, sp.gap ?? 0); u.ids.push(sp.id);
  }
  const placed: { x: number; w: number }[] = [];
  const out: Record<string, number> = {};
  const hits = (u: Unit, x: number) =>
    blocks.some((b) => u.h > b.from && u.gap < (b.depth ?? Infinity) && x < b.x + b.w + margin && b.x - margin < x + u.w) ||
    (u.against && placed.some((p) => x < p.x + p.w && p.x < x + u.w));
  // pieces against the wall first (they are the ones that can't share space), then left to right
  for (const u of [...units.values()].sort((a, b) => Number(b.against) - Number(a.against) || a.x - b.x)) {
    const lim = Math.max(0, len - u.w);
    const cands = [u.x];
    for (const b of blocks) if (u.gap < (b.depth ?? Infinity)) cands.push(b.x - margin - u.w, b.x + b.w + margin);
    if (u.against) for (const p of placed) cands.push(p.x - u.w, p.x + p.w);
    const ok = cands.map((x) => Math.max(0, Math.min(lim, x))).filter((x) => !hits(u, x)).sort((a, b) => Math.abs(a - u.x) - Math.abs(b - u.x));
    const x = ok.length ? ok[0] : u.x;
    if (u.against) placed.push({ x, w: u.w });
    for (const id of u.ids) out[id] = x - u.x;
  }
  return out;
}

/** Typical height of a piece, in cm, from its kind and name. */
export function pieceHeight(kind: string, label = "") {
  const t = `${kind} ${label}`.toLowerCase();
  if (/piano/.test(t)) return 125;
  if (/shel(f|v)|bookcase|wardrobe|cabinet tall|tall/.test(t)) return 200;
  if (/\bbed\b/.test(t)) return 105;
  if (/sofa|couch/.test(t)) return 85;
  if (/chair|armchair/.test(t)) return 90;
  if (/dining|desk/.test(t)) return 75;
  if (/console|sideboard|storage|dresser/.test(t)) return 85;
  if (/lamp/.test(t)) return 160;
  if (/bench|ottoman|pouf/.test(t)) return 45;
  if (/table/.test(t)) return 42;
  if (/tv|media/.test(t)) return 55;
  return 80;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function outlineFor(s: JourneyState, w: Wall, wp: WallPlan): Outline {
  const length = wallLength(s, w);
  const height = Math.round((s.room.ceilingM ?? EXAMPLE.ceiling) * 100);
  const example = !(s.room.widthM && s.room.lengthM);
  const cm = (pct: number) => (pct / 100) * length;
  const H = height;

  // Doors, windows and other things that can't move, placed in 4.3.
  const openings: OutlineOpening[] = [];
  const fixed: OutlineFixed[] = [];
  const points: OutlinePoint[] = [];
  for (const p of s.placements.filter((x) => x.wall === w)) {
    const cx = cm(facing(w, p.pos ?? 50));
    if (p.kind === "windows") openings.push({ kind: "window", w: 140, h: 140, x: clamp(cx - 70, 0, length - 140), y: H - 90 - 140 });
    else if (p.kind === "doors") openings.push({ kind: "door", w: 90, h: 210, x: clamp(cx - 45, 0, length - 90), y: H - 210 });
    else if (p.kind === "radiators") fixed.push({ kind: "radiator", label: "Radiator", w: 120, h: 55, x: clamp(cx - 60, 0, length - 120), y: H - 70 });
    else if (p.kind === "columns") fixed.push({ kind: "column", label: "Column", w: 40, h: H, x: clamp(cx - 20, 0, length - 40), y: 0 });
    else if (p.kind === "builtins") fixed.push({ kind: "builtin", label: "Built-in", w: 100, h: H - 20, x: clamp(cx - 50, 0, length - 100), y: 20 });
    else if (p.kind === "panels") fixed.push({ kind: "panel", label: "Fuse box", w: 40, h: 50, x: clamp(cx - 20, 0, length - 40), y: H - 200 });
    else if (p.kind === "stacks") fixed.push({ kind: "stack", label: "Stack", w: 25, h: H, x: clamp(cx - 12, 0, length - 25), y: 0 });
    else if (p.kind === "sockets") points.push({ kind: "socket", placed: true, x: clamp(cx, 10, length - 10), y: H - 30 });
  }

  // Pieces from the layout that stand against this wall, and pieces being kept.
  const lay = s.layouts[s.chosenLayout ?? 0];
  const pieces: OutlinePiece[] = [];
  const items = lay?.items ?? [];
  const room = s.room.widthM && s.room.lengthM ? { w: s.room.widthM, l: s.room.lengthM } : undefined;
  const home = homeWalls(items, room), sets = layoutBoxes(items), standing = freeStanding(items, room);
  const freeList: Outline["free"] = [];
  const setPieces: OutlinePiece[] = [];
  const boxOf = new Map<string, number>(); // piece ref → its box's main item
  const gapCm = new Map<string, number>();
  for (const [li, it] of items.entries()) {
    if (it.kind === "rug" || home[li] !== w) continue;
    if (standing.free[li]) { freeList.push({ ref: `lay-${li}`, label: it.label || it.kind, gapCm: Math.round(standing.gap[li] / 10) * 10 }); continue; }
    const [a, b] = alongWall(w, it);
    const width = Math.max(30, cm(b - a));
    const h = pieceHeight(it.kind, it.label);
    const piece: OutlinePiece = { ref: `lay-${li}`, label: it.label || it.kind, kind: it.kind, kept: it.kind === "keep", x: clamp(cm(a), 0, length - width), w: width, h, y: H - h };
    const gapPct = { A: it.y, C: 100 - (it.y + it.h), D: it.x, B: 100 - (it.x + it.w) }[w];
    gapCm.set(piece.ref, (gapPct / 100) * (w === "A" || w === "C" ? (s.room.lengthM ?? EXAMPLE.length) : (s.room.widthM ?? EXAMPLE.width)) * 100);
    const set = sets.get(li);
    if (set) boxOf.set(piece.ref, set[0]);
    if (set && set[0] !== li) {
      piece.set = `lay-${set[0]}`;
      if (isSeat(it)) {
        // a chair at a table (or beside the sofa): seen from the side when it stands beyond the main piece's end
        const [ha, hb] = alongWall(w, items[set[0]]).map(cm);
        const c = piece.x + piece.w / 2, edge = (hb - ha) * 0.15;
        piece.view = c < ha + edge ? "side-left" : c > hb - edge ? "side-right" : "front";
        // two chairs one behind the other on the same side are seen as one
        if (setPieces.some((q) => q.set === piece.set && q.view === piece.view && Math.min(q.x + q.w, piece.x + piece.w) - Math.max(q.x, piece.x) > 0.6 * Math.min(q.w, piece.w))) continue;
        setPieces.push(piece);
      }
    }
    pieces.push(piece);
  }
  // each table before its chairs, so the chairs are drawn tucked in front of it
  pieces.sort((a, b) => (a.set ? 1 : 0) - (b.set ? 1 : 0));
  for (const k of s.keeping.filter((k) => (k.wall ?? "B") === w)) {
    // A kept piece already drawn by the layout (its "keep" item) isn't drawn twice.
    const inLayout = (lay?.items ?? []).some((it: LayoutItem) => it.kind === "keep" && nearestWall(it, room) === w);
    if (inLayout) {
      const p = pieces.find((x) => x.kept);
      if (p) p.ref = `keep-${k.id}`;
      continue;
    }
    const width = k.w ?? 120;
    const h = k.h ?? pieceHeight("keep", k.name);
    pieces.push({ ref: `keep-${k.id}`, label: k.name, kind: "keep", kept: true, x: clamp(cm(facing(w, k.pos ?? 50)) - width / 2, 0, length - width), w: width, h, y: H - h });
  }

  // Nothing stands in front of a door (or, taller than the sill, in front of a window); pieces against the
  // wall don't overlap. Kept pieces are against their wall.
  const blocks: Block[] = [
    ...openings.map((op) => (op.kind === "door" ? { x: op.x, w: op.w, from: 0, depth: 95 } : { x: op.x, w: op.w, from: H - (op.y + op.h), depth: 45 })),
    ...fixed.filter((f) => f.kind === "column" || f.kind === "builtin" || f.kind === "stack").map((f) => ({ x: f.x, w: f.w, from: 0, depth: 45 })),
  ];
  const shift = keepClear(length, pieces.map((p) => ({ id: p.ref, x: p.x, w: p.w, h: p.h, against: p.kept || (gapCm.get(p.ref) ?? 0) <= 40, gap: p.kept ? 0 : gapCm.get(p.ref) ?? 0, group: p.set ?? p.ref })), blocks);
  for (const p of pieces) p.x = clamp(p.x + (shift[p.ref] ?? 0), 0, length - p.w);

  // each layout box drawn on this wall, as one bracket around its pieces
  const boxes: Outline["boxes"] = [];
  const byBox = new Map<number, OutlinePiece[]>();
  for (const p of pieces) { const b = boxOf.get(p.ref); if (b != null) byBox.set(b, [...(byBox.get(b) ?? []), p]); }
  for (const [main, ps] of byBox) {
    if (ps.length < 2) continue;
    const x0 = Math.min(...ps.map((p) => p.x)), x1 = Math.max(...ps.map((p) => p.x + p.w));
    const g = items[main].group;
    const label = g ? g.replace(/[-_]+/g, " ").replace(/^./, (c) => c.toUpperCase()) : `${items[main].label || items[main].kind} set`;
    boxes.push({ key: `lay-${main}`, label, x: x0, w: x1 - x0, h: Math.max(...ps.map((p) => p.h)) });
  }

  // A pin for every item on the wall.
  const door = openings.find((o) => o.kind === "door");
  const win = openings.find((o) => o.kind === "window");
  const main = [...pieces].sort((a, b) => b.w - a.w)[0];
  const pins: Record<number, { x: number; y: number }> = {};
  const freeX = (pref: number) => clamp(pref, 20, length - 20);
  let socketI = 0;
  for (const it of wp.items) {
    const ref = it.ref && pieces.find((p) => p.ref === it.ref);
    const byKind = !ref && it.group === "furniture" ? pieces.find((p) => new RegExp(p.kind, "i").test(it.name) || (p.label && it.name.toLowerCase().includes(p.label.toLowerCase()))) : undefined;
    const piece = ref || byKind;
    let x = length / 2;
    let y = H / 2;
    const name = it.name.toLowerCase();
    if (piece) {
      x = piece.x + piece.w / 2;
      y = piece.y + Math.min(piece.h * 0.45, 45);
    } else if (it.group === "furniture" && /mirror|\bart\b|artwork/.test(name)) {
      x = main ? main.x + main.w / 2 : length / 2;
      y = 95;
    } else if (it.group === "furniture" && /console/.test(name)) {
      x = door ? clamp(door.x + door.w + 90, 60, length - 60) : length * 0.65;
      y = H - 55;
    } else if (/curtain/.test(name)) {
      x = win ? win.x + win.w / 2 : length / 2;
      y = (win?.y ?? 60) - 22;
    } else if (/door frame|trim/.test(name)) {
      x = door ? door.x + door.w / 2 : length * 0.2;
      y = (door?.y ?? 80) + 40;
    } else if (it.group === "finishes") {
      x = win ? (win.x > length / 2 ? length * 0.22 : length * 0.78) : length * 0.82;
      y = 40;
    } else if (/sconce|wall light/.test(name)) {
      x = door ? clamp(door.x + door.w + 40, 20, length - 20) : length * 0.85;
      y = H - 160;
    } else if (/switch|dimmer/.test(name)) {
      x = door ? clamp(door.x + door.w + 15, 15, length - 15) : 25;
      y = H - 105;
    } else if (/socket/.test(name)) {
      const placed = points[socketI++];
      x = placed ? placed.x : main ? clamp(main.x - 15, 15, length - 15) : length * 0.3;
      y = H - 30;
    } else if (/blind/.test(name)) {
      x = win ? clamp(win.x + win.w + 12, 12, length - 12) : length * 0.6;
      y = (win?.y ?? 60) - 6;
    } else if (/^ac\b|ac unit/.test(name)) {
      x = length * 0.6;
      y = 22;
    } else if (/data|router/.test(name)) {
      x = length * 0.55;
      y = H - 30;
    } else if (/vent/.test(name)) {
      x = door ? door.x + door.w / 2 : length * 0.2;
      y = Math.max(16, (door?.y ?? 40) - 24);
    } else if (/water/.test(name)) {
      x = length * 0.3;
      y = H - 45;
    } else if (it.group === "lighting") {
      x = main ? main.x + main.w / 2 : length / 2;
      y = 14;
    }
    pins[it.n] = { x: freeX(x), y: clamp(y, 12, H - 12) };
  }
  // Keep pins apart so numbers never sit on top of each other.
  const placed: { x: number; y: number }[] = [];
  const near = (x: number, y: number) => placed.some((q) => Math.abs(q.x - x) < 26 && Math.abs(q.y - y) < 26);
  const steps = [[0, 0], [30, 0], [-30, 0], [60, 0], [-60, 0], [0, 30], [0, -30], [30, 30], [-30, -30], [90, 0], [-90, 0]];
  for (const it of wp.items) {
    const p = pins[it.n];
    // Try beside it first, then above or below, so a pin stays close to what it marks.
    const free = steps.map(([dx, dy]) => ({ x: clamp(p.x + dx, 12, length - 12), y: clamp(p.y + dy, 12, H - 12) })).find((c) => !near(c.x, c.y));
    if (free) Object.assign(p, free);
    placed.push(p);
  }
  const order = wp.items
    .filter((i) => i.action !== "—")
    .map((i) => i.n)
    .sort((a, b) => pins[a].x - pins[b].x || pins[a].y - pins[b].y);
  return { wall: w, length, height, example, openings, fixed, pieces, points, pins, order, free: freeList, boxes };
}

/** The item a pin number stands for (pins are numbered 1… in reading order). */
export const itemAt = (wp: WallPlan, o: Outline, i: number): WallItem | undefined => wp.items.find((x) => x.n === o.order[i]);
