/**
 * Places furniture groupings in a room, in cm, with which way every piece faces. The AI (or a simple fallback)
 * only says which groupings to use and roughly where — which wall and how far along it, or a spot for a free-standing
 * table. This code does the rest from the size table and the groupings' offsets, so pieces always have real sizes,
 * backs on walls, chairs facing their table, and nothing in a door swing, in front of a radiator or on top of
 * another group. When the asked-for spot doesn't work the group slides along the wall, then tries other walls;
 * optional pieces that don't fit are left out. Plain TS: used by the edge function and the app.
 *
 * Room: x from wall D (left) to wall B (right), y from wall A (top) to wall C (bottom), in cm.
 */
import { DEFAULT_WALL_GAPS, findSpec, symbolForName, type WallGaps, type Grouping, type Member, type MemberFaces, type Spec, type SpecKind } from "./layoutRules.ts";

export type Wall = "A" | "B" | "C" | "D";
/** Which way a piece's front points on the plan. */
export type Dir = "up" | "down" | "left" | "right";
export type Box = { x: number; y: number; w: number; h: number };
export type Opening = { kind: string; wall?: Wall | null; pos?: number | null };

/** What the AI (or the fallback) asks for: a grouping, and where. along / cx / cy are 0–100 %. */
export type GroupRequest = { key: string; wall?: Wall | null; along?: number | null; cx?: number | null; cy?: number | null; zone?: string | null };
/** A piece the person keeps. along is 0–100 % along its wall. */
export type KeepRequest = { name: string; w: number; d: number; wall?: Wall | null; along?: number | null; fixedSpot?: boolean };

export type Placed = Box & {
  label: string;
  kind: SpecKind | "keep";
  facing?: Dir;
  group: string;
  optional?: boolean;
  /** public/furniture-symbols/<symbol>.svg */
  symbol?: string;
  /** Which edge of the symbol drawing is the front, when it isn't the bottom. */
  symbolFront?: "top" | "left" | "right";
};
/** moved: groupings that couldn't go where they were asked (a wall), and where they went instead. */
export type Arrangement = { items: Placed[]; zones: (Box & { label: string })[]; left_out: string[]; moved: { name: string; from: Wall; to: Wall | null }[] };

const WALL_LEN = (w: Wall, W: number, L: number) => (w === "A" || w === "C" ? W : L);
const OPPOSITE: Record<Wall, Wall> = { A: "C", C: "A", B: "D", D: "B" };
/** Where a template direction ends up for a piece against each wall (template: against the top wall, facing down). */
const TURN: Record<Wall, Record<"down" | "up" | "right" | "left", Dir>> = {
  A: { down: "down", up: "up", right: "right", left: "left" },
  C: { down: "up", up: "down", right: "left", left: "right" },
  D: { down: "right", up: "left", right: "up", left: "down" },
  B: { down: "left", up: "right", right: "down", left: "up" },
};
const FACES: Record<Exclude<MemberFaces, "none">, "down" | "up" | "right" | "left"> = { into_room: "down", toward_wall: "up", right: "right", left: "left" };

/** A frame: where template point (tx, ty) lands in the room, and how directions turn. */
type Frame = { at: (tx: number, ty: number) => [number, number]; swap: boolean; turn: Record<"down" | "up" | "right" | "left", Dir> };

/** A piece against `wall`, its middle `along` it, standing `gap` cm off the wall. */
function wallFrame(wall: Wall, along: number, W: number, L: number, gap = 0): Frame {
  switch (wall) {
    case "A":
      return { at: (tx, ty) => [along + tx, ty + gap], swap: false, turn: TURN.A };
    case "C":
      return { at: (tx, ty) => [along - tx, L - ty - gap], swap: false, turn: TURN.C };
    case "D":
      return { at: (tx, ty) => [ty + gap, along - tx], swap: true, turn: TURN.D };
    default:
      return { at: (tx, ty) => [W - ty - gap, along + tx], swap: true, turn: TURN.B };
  }
}

/** How wide an opening is along its wall, in cm. */
const OPENING_CM: Record<string, number> = { doors: 90, windows: 120, balconies: 160 };
/** A free-standing piece: long side across (like wall A) or turned a quarter (like wall D). */
function floatFrame(cx: number, cy: number, turned: boolean): Frame {
  return turned ? { at: (tx, ty) => [cx + ty, cy - tx], swap: true, turn: TURN.D } : { at: (tx, ty) => [cx + tx, cy + ty], swap: false, turn: TURN.A };
}

const boxAt = (c: [number, number], w: number, d: number, swap: boolean): Box => {
  const bw = swap ? d : w, bh = swap ? w : d;
  return { x: c[0] - bw / 2, y: c[1] - bh / 2, w: bw, h: bh };
};
const hit = (a: Box, b: Box, eps = 1) => a.x + eps < b.x + b.w && b.x + eps < a.x + a.w && a.y + eps < b.y + b.h && b.y + eps < a.y + a.h;
const inside = (b: Box, W: number, L: number) => b.x >= -0.5 && b.y >= -0.5 && b.x + b.w <= W + 0.5 && b.y + b.h <= L + 0.5;

/** The strip in front of an opening: `width` along the wall, `depth` into the room. */
function stripAt(o: Opening, W: number, L: number, width: number, depth: number): Box | null {
  if (!o.wall || o.pos == null) return null;
  const c = (o.pos / 100) * WALL_LEN(o.wall, W, L);
  const a = c - width / 2;
  if (o.wall === "A") return { x: a, y: 0, w: width, h: depth };
  if (o.wall === "C") return { x: a, y: L - depth, w: width, h: depth };
  if (o.wall === "D") return { x: 0, y: a, w: depth, h: width };
  return { x: W - depth, y: a, w: depth, h: width };
}

/** The floor that must stay free in front of a piece standing against a wall. */
function frontZone(b: Box, facing: Dir | undefined, depth: number): Box | null {
  if (!facing || depth <= 0) return null;
  if (facing === "down") return { x: b.x, y: b.y + b.h, w: b.w, h: depth };
  if (facing === "up") return { x: b.x, y: b.y - depth, w: b.w, h: depth };
  if (facing === "right") return { x: b.x + b.w, y: b.y, w: depth, h: b.h };
  return { x: b.x - depth, y: b.y, w: depth, h: b.h };
}

const OPP: Record<Dir, Dir> = { down: "up", up: "down", left: "right", right: "left" };
/** Left and right as seen standing in front of a piece and looking at it (facing down: its left is screen left). */
const LEFT_OF: Record<Dir, Dir> = { down: "left", up: "right", right: "down", left: "up" };

/**
 * The floor that must stay free around a piece: in front (walking up to it, opening it), behind (pulling out a
 * chair), at its left and right (getting into bed, sitting at the end of a table). A piece with no front is treated
 * as facing down: its long sides are front and back.
 */
function clearZones(p: Piece): Box[] {
  const f = p.facing ?? "down";
  const c = p.clear;
  const out = [
    p.anchorFacing ? null : frontZone(p, f, c.front), // a chair's front is tucked under its table
    frontZone(p, OPP[f], c.back),
    frontZone(p, LEFT_OF[f], c.left),
    frontZone(p, OPP[LEFT_OF[f]], c.right),
  ];
  return out.filter(Boolean) as Box[];
}

type Piece = Placed & { clearance: number; clear: { front: number; back: number; left: number; right: number }; tall: boolean; anchorFacing: boolean };

export type ArrangeInput = {
  W: number; // cm, wall A / C
  L: number; // cm, wall B / D
  openings: Opening[];
  groups: GroupRequest[];
  keep?: KeepRequest[];
  specs: Spec[];
  groupings: Grouping[];
  /** How far pieces stand off the wall behind them (defaults: 10 cm plain, 50 window or balcony, 200 door). */
  wallGaps?: WallGaps;
};

/**
 * Places the requested groupings. First spot by spot: each piece stands off the wall behind it by what's in that
 * wall behind it (a plain stretch is tried before a window, a door last). When a grouping still doesn't fit, the room
 * is measured again as a smaller box: every wall moved in by its gap (2 m on a wall with a door, 0.5 m with a window
 * or balcony door, 0.1 m when plain), so the box has only plain walls, and everything is placed again in it. The
 * result that fits more is used.
 */
export function arrange(input: ArrangeInput): Arrangement {
  const first = arrangeOnce(input);
  if (!first.left_out.length || !input.openings.some((o) => o.wall && (o.kind in OPENING_CM))) return first;
  const boxed = arrangeInBox(input);
  return boxed && boxed.left_out.length < first.left_out.length ? boxed : first;
}

/** The room as a smaller box with only plain walls: each wall moved in by the gap its openings ask for. */
export function arrangeInBox(input: ArrangeInput): Arrangement | null {
  const { W, L, openings } = input;
  const g = input.wallGaps ?? DEFAULT_WALL_GAPS;
  const gapOf = (w: Wall) =>
    openings.filter((o) => o.wall === w && o.kind in OPENING_CM).reduce((m, o) => Math.max(m, o.kind === "doors" ? g.door : o.kind === "balconies" ? g.balcony : g.window), g.plain);
  const gA = gapOf("A"), gB = gapOf("B"), gC = gapOf("C"), gD = gapOf("D");
  const w2 = W - gD - gB, l2 = L - gA - gC;
  if (w2 < 120 || l2 < 120) return null;
  // a position along a wall (% of the room's wall) as a position along the box's wall (% of the box's wall)
  const alongIn = (wall: Wall | null | undefined, pct: number | null | undefined) => {
    if (pct == null || !wall) return pct ?? null;
    const across = wall === "A" || wall === "C";
    const cm = (pct / 100) * (across ? W : L) - (across ? gD : gA);
    return Math.min(100, Math.max(0, (cm / (across ? w2 : l2)) * 100));
  };
  const inner = arrangeOnce({
    ...input,
    W: w2,
    L: l2,
    // the box's walls are all plain; radiators still keep sofas and beds away
    openings: openings.filter((o) => o.kind === "radiators").map((o) => ({ ...o, pos: alongIn(o.wall, o.pos) })),
    wallGaps: { plain: 0, window: 0, balcony: 0, door: 0 },
    groups: input.groups.map((r) => ({ ...r, along: alongIn(r.wall, r.along), cx: r.cx != null ? Math.min(100, Math.max(0, (((r.cx / 100) * W - gD) / w2) * 100)) : r.cx, cy: r.cy != null ? Math.min(100, Math.max(0, (((r.cy / 100) * L - gA) / l2) * 100)) : r.cy })),
    keep: input.keep?.map((k) => ({ ...k, along: alongIn(k.wall, k.along) })),
  });
  const shift = <T extends Box>(b: T): T => ({ ...b, x: r1(b.x + gD), y: r1(b.y + gA) });
  return { ...inner, items: inner.items.map(shift), zones: inner.zones.map(shift) };
}

function arrangeOnce(input: ArrangeInput): Arrangement {
  const { W, L, openings, specs, groupings } = input;
  const placed: Piece[] = [];
  const left_out: string[] = [];
  const moved: Arrangement["moved"] = [];
  const zones: Arrangement["zones"] = [];
  const same = (a: string, b: string) => a.toLowerCase().trim() === b.toLowerCase().trim();
  // a kept piece that is a grouping's main piece (the owner's piano) becomes that grouping's anchor
  const requests = input.groups.map((r) => {
    const g = groupings.find((x) => x.key === r.key);
    const k = g && (input.keep ?? []).find((k) => same(k.name, g.anchor_name));
    return { r: k ? { ...r, wall: k.wall ?? r.wall, along: k.along ?? r.along } : r, kept: k };
  });
  const keptAnchors = new Set(requests.filter((x) => x.kept).map((x) => x.kept!));
  // kept anchors go first: they can't be dropped
  requests.sort((a, b) => Number(!!b.kept) - Number(!!a.kept));

  // what can't be covered: door swings (and the step in), the floor under windows for tall pieces, radiators
  const doors = openings.filter((o) => o.kind === "doors").map((o) => stripAt(o, W, L, 100, 100)).filter(Boolean) as Box[];
  const windows = openings.filter((o) => o.kind === "windows").map((o) => stripAt(o, W, L, 130, 45)).filter(Boolean) as Box[];
  const radiators = openings.filter((o) => o.kind === "radiators").map((o) => stripAt(o, W, L, 110, 35)).filter(Boolean) as Box[];

  /**
   * The gap behind a piece standing against `wall` whose back runs from `from` to `to` cm along it: the largest
   * that applies to what's in the wall behind it — a door (2 m), a window or balcony door (0.5 m), else 0.1 m.
   */
  const gaps = input.wallGaps ?? DEFAULT_WALL_GAPS;
  const gapBehind = (wall: Wall, from: number, to: number) => {
    const len = WALL_LEN(wall, W, L);
    let g = gaps.plain;
    for (const o of openings) {
      if (o.wall !== wall || o.pos == null || !(o.kind in OPENING_CM)) continue;
      const c = (o.pos / 100) * len, half = OPENING_CM[o.kind] / 2;
      if (c + half <= from || c - half >= to) continue; // not behind this piece
      g = Math.max(g, o.kind === "doors" ? gaps.door : o.kind === "balconies" ? gaps.balcony : gaps.window);
    }
    return g;
  };
  /** A wall frame for a piece `width` cm wide, its middle `along` the wall, at the gap its back wall asks for. */
  const backFrame = (wall: Wall, along: number, width: number) => wallFrame(wall, along, W, L, gapBehind(wall, along - width / 2, along + width / 2));
  /**
   * Every spot to try for a piece `width` cm wide, best first: a plain stretch of wall before one with a window
   * behind, and a door behind (2 m out) only when nothing else works; within each, the asked-for wall first and
   * the spots nearest the asked-for position first.
   */
  const wallSpots = (walls: Wall[], width: number, wantWall?: Wall | null, wantAlong?: number | null) => {
    const out: { w: Wall; t: number; gap: number; order: number }[] = [];
    walls.forEach((w, wi) => {
      const len = WALL_LEN(w, W, L);
      const start = wantAlong != null && w === wantWall ? (wantAlong / 100) * len : len / 2;
      spots(start, len).forEach((t, ti) => out.push({ w, t, gap: gapBehind(w, t - width / 2, t + width / 2), order: wi * 10000 + ti }));
    });
    return out.sort((a, b) => a.gap - b.gap || a.order - b.order);
  };

  /** Can this piece go here, next to what's already placed (other groups) and what can't move? */
  const fits = (p: Piece, group: string) => {
    if (!inside(p, W, L)) return false;
    if (doors.some((d) => hit(p, d))) return false;
    if (p.tall && windows.some((w) => hit(p, w))) return false;
    // beds don't go with their head under a window; sofas, beds and tall storage not in front of a radiator
    if (p.kind === "bed" && windows.some((w) => hit(p, w))) return false;
    if ((p.kind === "sofa" || p.kind === "bed" || p.tall) && radiators.some((r) => hit(p, r))) return false;
    if (p.kind === "rug") return true; // rugs go under things
    for (const q of placed) {
      if (q.group === group || q.kind === "rug") continue;
      if (hit(p, q)) return false;
      // keep the floor around other pieces free, on every side that needs it (walking up to a sofa, opening a
      // wardrobe, getting into bed, pulling out a chair), and this piece's own floor free of them
      if (clearZones(q).some((z) => hit(p, z, 2))) return false;
      if (clearZones(p).some((z) => hit(z, q, 2))) return false;
    }
    return true;
  };

  const pieceFor = (spec: Spec | undefined, label: string, c: [number, number], frame: Frame, dir: Dir | undefined, group: string, optional: boolean, size?: { w: number; d: number }): Piece => {
    const w = size?.w ?? spec?.width_cm ?? 60, d = size?.d ?? spec?.depth_cm ?? 60;
    return {
      ...boxAt(c, w, d, frame.swap),
      label,
      kind: spec?.kind ?? "other",
      symbol: spec?.symbol ?? (spec ? symbolForName(spec.name, spec.variant, spec.kind) : undefined),
      ...(spec?.symbol_front && spec.symbol_front !== "bottom" ? { symbolFront: spec.symbol_front } : {}),
      facing: dir,
      group,
      optional: optional || undefined,
      clearance: spec?.min_clearance_cm ?? 0,
      clear: { front: spec?.min_clearance_cm ?? 0, back: spec?.back_clearance_cm ?? 0, left: spec?.left_clearance_cm ?? 0, right: spec?.right_clearance_cm ?? 0 },
      tall: (spec?.height_cm ?? 0) >= 110,
      anchorFacing: spec?.facing === "anchor",
    };
  };

  /** Every piece of a grouping in one frame; null when the anchor's size is unknown. */
  const build = (g: Grouping, frame: Frame, onWall: Wall | null, along: number, kept?: KeepRequest): { required: Piece[]; optional: Piece[] } | null => {
    const base = findSpec(specs, g.anchor_name, g.anchor_variant);
    const a = base && kept ? { ...base, width_cm: kept.w || base.width_cm, depth_cm: kept.d || base.depth_cm } : base;
    if (!a) return null;
    const anchorDir: Dir | undefined = a.facing === "free" ? undefined : frame.turn.down;
    const anchor = pieceFor(a, kept ? kept.name : label(g.anchor_name), frame.at(0, onWall ? a.depth_cm / 2 : 0), frame, anchorDir, g.key, false);
    if (kept) anchor.kind = "keep";
    const required = [anchor], optional: Piece[] = [];
    for (const m of g.members) {
      const s = findSpec(specs, m.spec_name, m.spec_variant);
      if (!s) continue;
      const p = memberPiece(m, s, frame, onWall, along, anchor, g.key);
      if (p) (m.optional ? optional : required).push(p);
    }
    return { required, optional };
  };

  const memberPiece = (m: Member, s: Spec, frame: Frame, onWall: Wall | null, along: number, anchor: Piece, key: string): Piece | null => {
    const lab = m.label ?? label(m.spec_name);
    if (m.at === "opposite_wall") {
      // against the facing wall, lined up with the anchor, facing back at it
      const across: Wall | null = onWall ? OPPOSITE[onWall] : anchor.w >= anchor.h ? (anchor.y + anchor.h / 2 < L / 2 ? "A" : "C") : anchor.x + anchor.w / 2 < W / 2 ? "D" : "B";
      if (!across) return null;
      // the member's sideways offset, in the anchor's own frame, projected onto the facing wall
      const p = onWall ? frame.at(m.dx_cm, 0) : [anchor.x + anchor.w / 2, anchor.y + anchor.h / 2];
      const f = backFrame(across, across === "A" || across === "C" ? p[0] : p[1], s.width_cm);
      return pieceFor(s, lab, f.at(0, s.depth_cm / 2), f, s.facing === "free" ? undefined : f.turn.down, key, !!m.optional);
    }
    const dir = m.faces === "none" ? undefined : frame.turn[FACES[m.faces]];
    // a member turned sideways in the drawing lies across: its width runs along the template's y
    const sideways = m.faces === "left" || m.faces === "right";
    const size = sideways ? { w: s.depth_cm, d: s.width_cm } : { w: s.width_cm, d: s.depth_cm };
    return pieceFor(s, lab, frame.at(m.dx_cm, m.dy_cm), frame, dir, key, !!m.optional, size);
  };

  /** Try a grouping at one spot: all required pieces must fit; optional ones join when they fit too. */
  const tryAt = (g: Grouping, frame: Frame, onWall: Wall | null, along: number, kept?: KeepRequest): Piece[] | null => {
    const set = build(g, frame, onWall, along, kept);
    if (!set) return null;
    if (!set.required.every((p) => fits(p, g.key))) return null;
    // required pieces of the same group mustn't block each other's fronts either (e.g. a member in a door strip)
    const out = [...set.required];
    for (const p of set.optional) if (fits(p, g.key) && !out.some((q) => q.kind !== "rug" && p.kind !== "rug" && hit(p, q))) out.push(p);
    return out;
  };

  const spots = (start: number, len: number, step = 10) => {
    const out = [start];
    for (let d = step; d <= len; d += step) out.push(start + d, start - d);
    return out.filter((v) => v >= 0 && v <= len);
  };
  const wallsBy = (first?: Wall | null) => {
    const all: Wall[] = ["A", "B", "C", "D"];
    const rest = all.filter((w) => w !== first).sort((a, b) => WALL_LEN(b, W, L) - WALL_LEN(a, W, L) || doorsOn(a) - doorsOn(b));
    return first ? [first, ...rest] : rest;
  };
  const doorsOn = (w: Wall) => openings.filter((o) => o.wall === w && o.kind === "doors").length;

  const commit = (pieces: Piece[], g: { key: string; zone: string }) => {
    placed.push(...pieces);
    const xs = pieces.filter((p) => p.kind !== "rug" || pieces.length === 1);
    const x0 = Math.min(...xs.map((p) => p.x)), y0 = Math.min(...xs.map((p) => p.y));
    const x1 = Math.max(...xs.map((p) => p.x + p.w)), y1 = Math.max(...xs.map((p) => p.y + p.h));
    const pad = 15;
    const zx = Math.max(0, x0 - pad), zy = Math.max(0, y0 - pad);
    zones.push({ label: g.zone, x: zx, y: zy, w: Math.min(W, x1 + pad) - zx, h: Math.min(L, y1 + pad) - zy });
  };

  // pieces kept first: they're the owner's, and a fixed spot can't move
  for (const k of input.keep ?? []) {
    if (keptAnchors.has(k)) continue; // placed with its grouping below
    const spec = findSpec(specs, k.name);
    const sz = { w: k.w || spec?.width_cm || 80, d: k.d || spec?.depth_cm || 50 };
    // the owner's piece at its real size, with the sides and clearances of its kind of piece
    const keepSpec: Spec = { ...(spec ?? {}), name: k.name, variant: "kept", kind: spec?.kind ?? "other", width_cm: sz.w, depth_cm: sz.d, height_cm: spec?.height_cm, min_clearance_cm: spec?.min_clearance_cm ?? 40, facing: spec?.facing ?? "wall", symbol: spec?.symbol ?? symbolForName(k.name), is_default: false };
    let done: Piece[] | null = null;
    for (const { w, t } of wallSpots(k.fixedSpot && k.wall ? [k.wall] : wallsBy(k.wall), sz.w, k.wall, k.along)) {
      const f = backFrame(w, t, sz.w);
      const p = pieceFor(keepSpec, k.name, f.at(0, sz.d / 2), f, keepSpec.facing === "free" ? undefined : f.turn.down, `keep:${k.name}`, false, sz);
      p.kind = "keep";
      if (fits(p, p.group)) {
        done = [p];
        break;
      }
    }
    if (done) commit(done, { key: done[0].group, zone: "" });
    else left_out.push(k.name);
  }
  // zones aren't drawn for kept pieces on their own
  zones.splice(0, zones.length);

  for (const { r, kept } of requests) {
    const g = groupings.find((x) => x.key === r.key);
    if (!g) continue;
    let pieces: Piece[] | null = null;
    let wentTo: Wall | null = null;
    if (g.anchor_place === "floating") {
      const a = findSpec(specs, g.anchor_name, g.anchor_variant);
      const longAcross = W >= L; // the table's long side along the room's long side
      const cx0 = r.cx != null ? (r.cx / 100) * W : W / 2, cy0 = r.cy != null ? (r.cy / 100) * L : L / 2;
      const cands: [number, number][] = [];
      for (const dx of spots(0, W, 20).map((v) => v)) for (const dy of spots(0, L, 20)) cands.push([cx0 + dx, cy0 + dy], [cx0 - dx, cy0 - dy], [cx0 + dx, cy0 - dy], [cx0 - dx, cy0 + dy]);
      cands.sort((p, q) => Math.hypot(p[0] - cx0, p[1] - cy0) - Math.hypot(q[0] - cx0, q[1] - cy0));
      outer: for (const turned of [!longAcross, longAcross]) {
        if (!a) break;
        for (const [cx, cy] of cands) {
          if (cx < 0 || cy < 0 || cx > W || cy > L) continue;
          pieces = tryAt(g, floatFrame(cx, cy, turned), null, 0);
          if (pieces) break outer;
        }
      }
    } else {
      // a kept piece with a fixed spot stays on its wall
      const aw = kept?.w || findSpec(specs, g.anchor_name, g.anchor_variant)?.width_cm || 100;
      for (const { w, t } of wallSpots(kept?.fixedSpot && kept.wall ? [kept.wall] : wallsBy(r.wall), aw, r.wall, r.along)) {
        pieces = tryAt(g, backFrame(w, t, aw), w, t, kept);
        if (pieces) {
          wentTo = w;
          break;
        }
      }
    }
    if (pieces) {
      commit(pieces, { key: g.key, zone: (r.zone || g.zone || "").toUpperCase() });
      if (r.wall && wentTo && wentTo !== r.wall) moved.push({ name: g.name, from: r.wall, to: wentTo });
    } else left_out.push(kept ? kept.name : g.name);
  }

  return {
    items: placed.map(({ clearance: _c, clear: _cl, tall: _t, anchorFacing: _a, ...p }) => ({ ...p, x: r1(p.x), y: r1(p.y), w: r1(p.w), h: r1(p.h) })),
    zones: zones.map((z) => ({ ...z, x: r1(z.x), y: r1(z.y), w: r1(z.w), h: r1(z.h) })),
    left_out,
    moved,
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;
const label = (name: string) => name.replace(/^\w/, (c) => c.toUpperCase());

/**
 * Without the AI: the groupings for the room and its activities, best first, as many as fit. The first goes on the
 * longest wall without a door; free-standing tables go where there's room.
 */
export function fallbackGroups(groupings: Grouping[], openings: Opening[], W: number, L: number, max = 3): GroupRequest[] {
  const walls: Wall[] = (["A", "B", "C", "D"] as Wall[]).sort((a, b) => {
    const da = openings.filter((o) => o.wall === a && o.kind === "doors").length, db = openings.filter((o) => o.wall === b && o.kind === "doors").length;
    return da - db || WALL_LEN(b, W, L) - WALL_LEN(a, W, L);
  });
  const anchors = new Set<string>();
  const out: GroupRequest[] = [];
  for (const g of groupings) {
    // one grouping per main piece (not two sofas)
    const a = `${g.anchor_name}|${g.anchor_variant ?? ""}`;
    if (anchors.has(a) || (g.anchor_name.includes("sofa") && [...anchors].some((x) => x.includes("sofa")))) continue;
    if (g.anchor_name === "dining table" && [...anchors].some((x) => x.startsWith("dining table"))) continue;
    if (g.anchor_name === "bed" && [...anchors].some((x) => x.startsWith("bed|"))) continue;
    anchors.add(a);
    out.push(g.anchor_place === "floating" ? { key: g.key } : { key: g.key, wall: walls[out.length % walls.length], along: 50 });
    if (out.length >= max) break;
  }
  return out;
}
