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

/** Which wall a layout piece stands against: the nearest one (same rule as the layout and composeWalls). */
export function nearestWall(i: { x: number; y: number; w: number; h: number }): Wall {
  const d = { A: i.y, C: 100 - (i.y + i.h), D: i.x, B: 100 - (i.x + i.w) };
  return (Object.entries(d) as [Wall, number][]).sort((a, b) => a[1] - b[1])[0][0];
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
 * The walls an item is seen on: the wall it is nearest to, and for a table and its chairs, every wall any of
 * them is nearest to, so a set always shows whole (never two chairs without their table).
 */
export function wallsShowing(items: (Box & { kind: string; label?: string })[]): Wall[][] {
  const sets = seatSets(items);
  return items.map((it, i) => [...new Set((sets.get(i) ?? [i]).map((j) => nearestWall(items[j])))]);
}

/** Typical height of a piece, in cm, from its kind and name. */
export function pieceHeight(kind: string, label = "") {
  const t = `${kind} ${label}`.toLowerCase();
  if (/piano/.test(t)) return 125;
  if (/shelv|bookcase|wardrobe|cabinet tall|tall/.test(t)) return 200;
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
  const showing = wallsShowing(items), sets = seatSets(items);
  const setPieces: OutlinePiece[] = [];
  for (const [li, it] of items.entries()) {
    if (it.kind === "rug" || !showing[li].includes(w)) continue;
    const [a, b] = alongWall(w, it);
    const width = Math.max(30, cm(b - a));
    const h = pieceHeight(it.kind, it.label);
    const piece: OutlinePiece = { ref: `lay-${li}`, label: it.label || it.kind, kind: it.kind, kept: it.kind === "keep", x: clamp(cm(a), 0, length - width), w: width, h, y: H - h };
    const set = sets.get(li);
    if (set && set[0] !== li) {
      // a chair at a table: seen from the side when it stands beyond the table's end, else from the front
      const [ha, hb] = alongWall(w, items[set[0]]).map(cm);
      const c = piece.x + piece.w / 2, edge = (hb - ha) * 0.15;
      piece.view = c < ha + edge ? "side-left" : c > hb - edge ? "side-right" : "front";
      piece.set = `lay-${set[0]}`;
      // two chairs one behind the other on the same side are seen as one
      if (setPieces.some((q) => q.set === piece.set && q.view === piece.view && Math.min(q.x + q.w, piece.x + piece.w) - Math.max(q.x, piece.x) > 0.6 * Math.min(q.w, piece.w))) continue;
      setPieces.push(piece);
    }
    pieces.push(piece);
  }
  // each table before its chairs, so the chairs are drawn tucked in front of it
  pieces.sort((a, b) => (a.set ? 1 : 0) - (b.set ? 1 : 0));
  for (const k of s.keeping.filter((k) => (k.wall ?? "B") === w)) {
    // A kept piece already drawn by the layout (its "keep" item) isn't drawn twice.
    const inLayout = (lay?.items ?? []).some((it: LayoutItem) => it.kind === "keep" && nearestWall(it) === w);
    if (inLayout) {
      const p = pieces.find((x) => x.kept);
      if (p) p.ref = `keep-${k.id}`;
      continue;
    }
    const width = k.w ?? 120;
    const h = k.h ?? pieceHeight("keep", k.name);
    pieces.push({ ref: `keep-${k.id}`, label: k.name, kind: "keep", kept: true, x: clamp(cm(facing(w, k.pos ?? 50)) - width / 2, 0, length - width), w: width, h, y: H - h });
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
  return { wall: w, length, height, example, openings, fixed, pieces, points, pins, order };
}

/** The item a pin number stands for (pins are numbered 1… in reading order). */
export const itemAt = (wp: WallPlan, o: Outline, i: number): WallItem | undefined => wp.items.find((x) => x.n === o.order[i]);
