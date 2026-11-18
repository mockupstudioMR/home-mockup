/**
 * The showroom's picture of one person's room, built only from what the journey already knows:
 * the moodboard's colours (step 2 "Colors"), the preview read-out (which pieces, shapes and materials),
 * the room's size (4.2), the things that can't move (4.3), the chosen layout (4.4), the pieces being kept
 * and what was put on each wall (step 5). Nothing here is fixed to one example room.
 *
 * Plan axes: x runs along wall A (left to right on the plan), z from wall A down to wall C. Metres.
 */
import { facingOf } from "../plan/facing";
import type { JourneyState, Swatch, Wall } from "../state";
import { alongWall, freeStanding, homeWalls, keepClear, nearestWall, seatSets } from "../wallOutline";
import { categoryOf, fabricIn, LIBRARY, matchShape, shapeById, wordsNear, type Category, type Fabric } from "./library";

export type Edit = { color?: string; shape?: string };
export type Edits = Record<string, Edit>;

export type Opening = { id: string; wall: Wall; kind: "window" | "door"; /** Centre along the plan axis of its wall, metres. */ at: number; width: number; sill: number; head: number; arched: boolean };
export type Radiator = { wall: Wall; at: number; width: number };
export type PieceModel = {
  id: string;
  name: string;
  category: Category;
  kept: boolean;
  /** Centre on the plan and footprint (width along its front, depth front to back), metres. */
  cx: number; cz: number; w: number; d: number; h: number;
  /** Turn around the vertical axis: 0 faces wall C (down the plan). */
  rot: number;
  /** The nearest wall, and whether the piece actually stands against it (within 40 cm). */
  wall: Wall; onWall: boolean;
  /** How far out from its wall it stands, metres. */
  gap?: number;
  /**
   * Stands out in the room rather than at its wall (more than about 60 cm out, and not in front of a piece that
   * is): left out of the wall's outline and picture, and shown in the whole-room picture.
   */
  free?: boolean;
  /** Every wall picture it appears in: its own wall, and for a table and its chairs every wall the set faces. */
  shownOn?: Wall[];
  /** Where it sits along that wall as seen from inside the room, centimetres. */
  fromCm: number; toCm: number;
  color: string;
  colorFrom: string;
  fabric?: Fabric;
  shape: string;
  shapeName: string;
  /** The words that were read about it and whether they picked the shape. */
  described: string;
  matched: boolean;
  edited: boolean;
};
/** Whether a piece appears in a wall's picture (a table set shows whole on every wall it faces). */
export const seenOn = (p: Pick<PieceModel, "wall" | "shownOn" | "free">, wall: Wall | "room") => wall === "room" || (!p.free && (p.wall === wall || !!p.shownOn?.includes(wall)));
export type Extra = { id: string; kind: "curtains" | "art" | "mirror" | "pendant"; name: string; wall: Wall; at: number; y: number; color: string; colorFrom: string; edited: boolean };
export type PaletteEntry = { name: string; hex: string; use: string; role: string };
export type Surface = { id: "walls" | "floor" | "doors"; name: string; color: string; colorFrom: string; edited: boolean };
export type Surfaces = { wall: string; floor: string; wood: string; metal: string; seating: string; accent: string; light: string; door: string };
export type ShowroomModel = {
  style: string;
  room: { w: number; l: number; h: number; example: boolean };
  openings: Opening[];
  radiators: Radiator[];
  pieces: PieceModel[];
  extras: Extra[];
  surfaces: Surfaces;
  surfaceList: Surface[];
  palette: PaletteEntry[];
  /** True when the moodboard has no colours yet, so neutral defaults are shown. */
  noPalette: boolean;
};

const EXAMPLE = { width: 3.75, length: 4.9, ceiling: 2.7 };
const DEFAULTS: Surfaces = { wall: "#E9E4DC", floor: "#B08A62", wood: "#8A6440", metal: "#B08D57", seating: "#8C8577", accent: "#5E4268", light: "#F1EBE2", door: "#EFEAE2" };

const HEX = /^#[0-9a-f]{6}$/i;
export const validHex = (c?: string | null): c is string => !!c && HEX.test(c);
const rgb = (c: string) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
export function mixHex(a: string, b: string, t: number) {
  const A = rgb(a), B = rgb(b);
  return "#" + [0, 1, 2].map((i) => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, "0")).join("").toUpperCase();
}
export function hsl(c: string) {
  const [r, g, b] = rgb(c).map((v) => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let h = 0, s = 0;
  if (d > 1e-4) {
    s = d / (1 - Math.abs(2 * l - 1) + 1e-4);
    h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: Math.min(1, s), l, /** How colourful it is, 0–1 (near-whites and near-blacks stay low). */ c: d };
}

const useOf = (p: Swatch) => `${p.use ?? ""}`.toLowerCase();
const nameOf = (p: Swatch) => `${p.name} ${p.material ?? ""}`.toLowerCase();

/** Which moodboard colour plays which part. The "use" written next to each colour decides; lightness fills gaps. */
export function paletteRoles(palette: Swatch[]) {
  const p = palette.filter((x) => validHex(x.hex));
  const byUse = (re: RegExp) => p.find((x) => re.test(useOf(x)));
  const byName = (re: RegExp) => p.find((x) => re.test(nameOf(x)));
  const role: Partial<Record<keyof Surfaces, Swatch>> = {
    wall: byUse(/wall/),
    floor: byUse(/floor/),
    wood: byUse(/wood|shelv|timber|joinery/) ?? byName(/walnut|oak|wood|ash\b|teak|pine/),
    metal: byUse(/metal|light|panel|hardware/) ?? byName(/brass|gold|bronze|steel|chrome|nickel|copper/),
    seating: byUse(/seat|sofa|couch/),
    accent: byUse(/accent|arch|chair|cushion/),
  };
  const taken = () => new Set(Object.values(role).filter(Boolean) as Swatch[]);
  const free = () => p.filter((x) => !taken().has(x));
  const pick = (score: (c: ReturnType<typeof hsl>) => number, min: number) => {
    const best = free().map((x) => ({ x, v: score(hsl(x.hex)) })).sort((a, b) => b.v - a.v)[0];
    return best && best.v >= min ? best.x : undefined;
  };
  role.wall ??= pick((c) => (c.c < 0.15 ? c.l : c.l - 0.5), 0.5);
  role.seating ??= pick((c) => (c.l > 0.12 && c.l < 0.85 ? c.c : 0), 0.14);
  role.accent ??= pick((c) => (c.l > 0.12 && c.l < 0.85 ? c.c : 0), 0.12);
  role.floor ??= role.wood ?? pick((c) => 1 - c.l, 0.55);
  role.wood ??= role.floor;
  return role;
}

const ROLE_LABEL: Record<string, string> = { wall: "Walls", floor: "Floor", wood: "Wood", metal: "Metal", seating: "Seating", accent: "Accent" };

/** Words in a colour's "use" that name a kind of piece, so that colour goes straight onto it. */
const USE_WORDS: Partial<Record<Category | "curtains" | "doors" | "art" | "mirror" | "pendant", RegExp>> = {
  sofa: /sofa|couch|seating/, chair: /chair/, bed: /\bbed|headboard|seating/, bench: /bench|ottoman|seating/,
  shelf: /shelv|bookcase|storage/, console: /console|sideboard|storage/, wardrobe: /wardrobe|storage/, media: /media|tv|storage/,
  table: /table/, side: /table/, dining: /dining|table/, desk: /desk/, dchair: /dining chair/,
  rug: /rug|carpet/, lamp: /lamp|light/, curtains: /curtain|drape/, doors: /arch|door/, art: /\bart\b/, mirror: /mirror|metal|light/, pendant: /pendant|light|metal/,
};
const ROLE_OF: Record<Category, keyof Surfaces> = {
  sofa: "seating", bed: "seating", bench: "seating", chair: "accent",
  table: "wood", side: "wood", shelf: "wood", console: "wood", dining: "wood", desk: "wood", media: "wood", wardrobe: "wood", dchair: "wood",
  lamp: "metal", plant: "accent", rug: "light", piano: "wood", other: "wood",
};
const HEIGHT: Record<Category, number> = {
  sofa: 0.85, chair: 0.85, table: 0.42, side: 0.52, shelf: 2.0, console: 0.85, bed: 1.05, dining: 0.75, dchair: 0.85, desk: 0.75,
  media: 0.55, wardrobe: 2.2, bench: 0.45, lamp: 1.6, plant: 1.5, rug: 0.02, piano: 1.25, other: 0.8,
};
const ROT = { down: 0, right: Math.PI / 2, up: Math.PI, left: -Math.PI / 2 } as const;

/** Everything written about the room's pieces in step 2: the preview read-out, the moodboard and the notes. */
export function describedText(s: JourneyState) {
  const read = (s.preview?.read ?? []).map((r) => `${r.text}. ${r.keywords.join(", ")}`).join(". ");
  const anchor = s.anchor ? `${s.anchor.shape} ${s.anchor.material ?? ""} ${s.anchor.kind}` : "";
  return [read, anchor, s.moodboard?.description ?? "", s.analysis?.description ?? ""].filter(Boolean).join(". ");
}

export function buildModel(s: JourneyState, edits: Edits = {}): ShowroomModel {
  const W = s.room.widthM ?? EXAMPLE.width, L = s.room.lengthM ?? EXAMPLE.length, H = s.room.ceilingM ?? EXAMPLE.ceiling;
  const swatches = (s.moodboard?.palette ?? []).filter((x) => validHex(x.hex));
  const role = paletteRoles(swatches);
  const text = describedText(s);

  const surf: Surfaces = { ...DEFAULTS };
  const from: Partial<Record<keyof Surfaces, string>> = {};
  for (const k of ["wall", "floor", "wood", "metal", "seating", "accent"] as const) {
    const sw = role[k];
    if (sw) { surf[k] = sw.hex.toUpperCase(); from[k] = sw.name; }
  }
  surf.light = mixHex(surf.wall, "#FFFFFF", 0.35);
  const arched = /arch(ed)? (door|opening|entr)|arched doorway|\barch\b/.test(text.toLowerCase());
  const doorSw = swatches.find((x) => USE_WORDS.doors!.test(useOf(x)));
  surf.door = doorSw ? doorSw.hex.toUpperCase() : arched && role.accent ? surf.accent : DEFAULTS.door;

  const colourFor = (key: Category | "curtains" | "art" | "mirror" | "pendant", fallback: keyof Surfaces): { color: string; colorFrom: string } => {
    const re = USE_WORDS[key];
    const direct = re ? swatches.find((x) => re.test(useOf(x))) : undefined;
    if (direct) return { color: direct.hex.toUpperCase(), colorFrom: `Moodboard colour ${direct.name}` };
    if (from[fallback]) return { color: surf[fallback], colorFrom: `Moodboard colour ${from[fallback]}` };
    return { color: surf[fallback], colorFrom: swatches.length ? "Matched to your palette" : "Neutral until your moodboard has colours" };
  };
  const withEdit = <T extends { color: string; colorFrom: string }>(id: string, v: T): T & { edited: boolean } => {
    const e = edits[id];
    return validHex(e?.color) ? { ...v, color: e!.color!.toUpperCase(), colorFrom: "Your own colour", edited: true } : { ...v, edited: !!e?.shape };
  };

  // Doors, windows and radiators from "what can't move" (4.3). Positions are 0–100 along the plan axis of their wall.
  const openings: Opening[] = [];
  const radiators: Radiator[] = [];
  const lenOf = (w: Wall) => (w === "A" || w === "C" ? W : L);
  const clampAt = (at: number, width: number, len: number) => Math.max(width / 2 + 0.08, Math.min(len - width / 2 - 0.08, at));
  for (const p of s.placements) {
    if (!p.wall || p.pos == null) continue;
    const len = lenOf(p.wall), at = (p.pos / 100) * len;
    if (p.kind === "windows") { const width = Math.min(1.4, len - 0.4); openings.push({ id: p.id, wall: p.wall, kind: "window", at: clampAt(at, width, len), width, sill: 0.9, head: Math.min(2.3, H - 0.25), arched: false }); }
    else if (p.kind === "doors") { const width = arched ? 1.0 : 0.9; openings.push({ id: p.id, wall: p.wall, kind: "door", at: clampAt(at, width, len), width, sill: 0, head: Math.min(arched ? 2.2 : 2.1, H - 0.2), arched }); }
    else if (p.kind === "radiators") radiators.push({ wall: p.wall, at: clampAt(at, 1.2, len), width: 1.2 });
  }

  // The chosen layout's pieces, then kept pieces the layout doesn't already draw.
  const pieces: PieceModel[] = [];
  const lay = s.layouts[s.chosenLayout ?? 0];
  const keptInLayout = new Set<string>();
  const addPiece = (id: string, name: string, kind: string, box: { x: number; y: number; w: number; h: number }, facing: keyof typeof ROT | undefined, kept: boolean, hM?: number, home?: Wall) => {
    const fw = (box.w / 100) * W, fd = (box.h / 100) * L;
    const category = categoryOf(kind, name, fw, fd);
    const turned = facing === "left" || facing === "right";
    const described = [wordsNear(text, category), name].filter(Boolean).join(" | ");
    const m = matchShape(category, kept ? name : described);
    const edit = edits[id];
    const shape = (edit?.shape && shapeById(category, edit.shape)) || m.shape;
    const wall = home ?? nearestWall({ ...box, kind, label: name }, { w: W, l: L });
    const [a, b] = alongWall(wall, box);
    const len = lenOf(wall) * 100;
    const gapM = { A: (box.y / 100) * L, C: ((100 - box.y - box.h) / 100) * L, D: (box.x / 100) * W, B: ((100 - box.x - box.w) / 100) * W }[wall];
    const col = kept ? { color: "#3A2419", colorFrom: "Yours · kept" } : colourFor(category, ROLE_OF[category]);
    pieces.push({
      id, name, category, kept,
      cx: ((box.x + box.w / 2) / 100) * W, cz: ((box.y + box.h / 2) / 100) * L,
      w: Math.max(0.2, turned ? fd : fw), d: Math.max(0.2, turned ? fw : fd), h: hM ?? HEIGHT[category],
      rot: facing ? ROT[facing] : 0,
      wall, onWall: gapM <= 0.4, gap: gapM, fromCm: Math.round((a / 100) * len), toCm: Math.round((b / 100) * len),
      ...withEdit(id, col),
      fabric: fabricIn(described) ?? (category === "sofa" || category === "chair" || category === "bed" || category === "bench" ? "linen" : undefined),
      shape: shape.id, shapeName: shape.name, described, matched: m.matched,
    });
  };
  const home = homeWalls(lay?.items ?? [], { w: W, l: L });
  const standing = freeStanding(lay?.items ?? [], { w: W, l: L });
  for (const [i, it] of (lay?.items ?? []).entries()) {
    const kept = it.kind === "keep";
    if (kept) keptInLayout.add(it.label.toLowerCase());
    addPiece(`lay-${i}`, it.label || it.kind, it.kind, it, facingOf(it, W, L), kept, undefined, home[i]);
    if (standing.free[i]) pieces[pieces.length - 1].free = true;
  }
  // a rug shows on the wall of the piece it lies under the most (the sofa's, say)
  for (const r of pieces.filter((p) => p.category === "rug")) {
    const over = (p: PieceModel) => Math.max(0, Math.min(r.cx + r.w / 2, p.cx + p.w / 2) - Math.max(r.cx - r.w / 2, p.cx - p.w / 2) + 0.5) * Math.max(0, Math.min(r.cz + r.d / 2, p.cz + p.d / 2) - Math.max(r.cz - r.d / 2, p.cz - p.d / 2) + 0.5);
    const under = pieces.filter((p) => p !== r && p.category !== "rug").sort((a, b) => over(b) - over(a))[0];
    if (under && over(under) > 0) { r.wall = under.wall; r.free = under.free; }
  }
  for (const k of s.keeping) {
    if (k.status === "buy" || keptInLayout.has(k.name.toLowerCase()) || [...keptInLayout].some((n) => n.includes(k.name.toLowerCase()) || k.name.toLowerCase().includes(n))) continue;
    const wall = k.wall ?? "B", wM = (k.w ?? 120) / 100, dM = (k.d ?? 50) / 100, pos = k.pos ?? 50;
    const across = wall === "A" || wall === "C";
    const wp = (wM / (across ? W : L)) * 100, dp = (dM / (across ? L : W)) * 100;
    const along = Math.max(0, Math.min(100 - wp, pos - wp / 2));
    const box = wall === "A" ? { x: along, y: 1, w: wp, h: dp } : wall === "C" ? { x: along, y: 99 - dp, w: wp, h: dp } : wall === "D" ? { x: 1, y: along, w: dp, h: wp } : { x: 99 - dp, y: along, w: dp, h: wp };
    addPiece(`keep-${k.id}`, k.name, "keep", box, ({ A: "down", C: "up", D: "right", B: "left" } as const)[wall], true, k.h ? k.h / 100 : undefined);
  }

  // Nothing stands in front of a door, or taller than the sill in front of a window, and pieces against a
  // wall don't overlap: each slides along its wall as little as it can (a table with its chairs as one).
  const sets = seatSets(lay?.items ?? []);
  const groupOf = (id: string) => { const i = Number(id.replace("lay-", "")); const set = id.startsWith("lay-") ? sets.get(i) : undefined; return set ? `lay-${set[0]}` : id; };
  for (const w of ["A", "B", "C", "D"] as Wall[]) {
    const len = lenOf(w) * 100;
    const on = pieces.filter((p) => p.wall === w && p.category !== "rug" && !p.free);
    const blocks = openings.filter((o) => o.wall === w).map((o) => {
      const c = (w === "A" || w === "B" ? o.at : lenOf(w) - o.at) * 100;
      return { x: c - o.width * 50, w: o.width * 100, from: o.sill * 100, depth: o.kind === "door" ? 95 : 45 };
    });
    if (!on.length || !blocks.length && on.filter((p) => p.onWall).length < 2) continue;
    const shift = keepClear(len, on.map((p) => ({ id: p.id, x: p.fromCm, w: p.toCm - p.fromCm, h: p.h * 100, against: p.onWall, gap: (p.gap ?? 0) * 100, group: groupOf(p.id) })), blocks);
    for (const p of on) {
      const d = shift[p.id] ?? 0;
      if (!d) continue;
      p.fromCm += d; p.toCm += d;
      if (w === "A") p.cx += d / 100; else if (w === "C") p.cx -= d / 100; else if (w === "B") p.cz += d / 100; else p.cz -= d / 100;
    }
  }

  // What was put on each wall in step 5 that isn't floor furniture: curtains, art, mirrors, a pendant.
  const extras: Extra[] = [];
  const midOf = (w: Wall) => {
    const on = pieces.filter((p) => p.wall === w && p.onWall && p.h < 1.4 && p.category !== "rug").sort((a, b) => b.w - a.w)[0];
    return on ? (w === "A" || w === "C" ? on.cx : on.cz) : lenOf(w) / 2;
  };
  for (const w of ["A", "B", "C", "D"] as Wall[]) {
    for (const it of s.walls[w]?.items ?? []) {
      const n = it.name.toLowerCase(), id = `wall-${w}-${it.n}`;
      if (/curtain|drape/.test(n)) {
        if (!openings.some((o) => o.wall === w && o.kind === "window") || extras.some((e) => e.kind === "curtains" && e.wall === w)) continue;
        extras.push({ id, kind: "curtains", name: it.name, wall: w, at: 0, y: 0, ...withEdit(id, colourFor("curtains", "seating")) });
      } else if (/mirror/.test(n)) extras.push({ id, kind: "mirror", name: it.name, wall: w, at: midOf(w), y: 1.5, ...withEdit(id, colourFor("mirror", "metal")) });
      else if (/\bart\b|artwork|painting|print|gallery|picture/.test(n)) extras.push({ id, kind: "art", name: it.name, wall: w, at: midOf(w), y: 1.55, ...withEdit(id, colourFor("art", "accent")) });
      else if (/pendant|chandelier|ceiling light/.test(n) && !extras.some((e) => e.kind === "pendant")) extras.push({ id, kind: "pendant", name: it.name, wall: w, at: 0, y: 0, ...withEdit(id, colourFor("pendant", "metal")) });
    }
  }

  const surfaceList: Surface[] = [
    { id: "walls", name: "Walls", ...withEdit("walls", { color: surf.wall, colorFrom: from.wall ? `Moodboard colour ${from.wall}` : "Neutral until your moodboard has colours" }) },
    { id: "floor", name: "Floor", ...withEdit("floor", { color: surf.floor, colorFrom: from.floor ? `Moodboard colour ${from.floor}` : from.wood ? `Moodboard colour ${from.wood}` : "Neutral until your moodboard has colours" }) },
  ];
  if (openings.some((o) => o.kind === "door")) surfaceList.push({ id: "doors", name: arched ? "Arched doorway" : "Door", ...withEdit("doors", { color: surf.door, colorFrom: doorSw ? `Moodboard colour ${doorSw.name}` : arched && from.accent ? `Moodboard colour ${from.accent}` : "Standard door colour" }) });
  surf.wall = surfaceList[0].color; surf.floor = surfaceList[1].color;
  if (surfaceList[2]) surf.door = surfaceList[2].color;

  const roleName = (sw: Swatch) => (Object.entries(role).find(([, v]) => v === sw)?.[0] ?? "");
  return {
    style: s.moodboard?.name ?? "Your room",
    room: { w: W, l: L, h: H, example: !(s.room.widthM && s.room.lengthM) },
    openings, radiators, pieces, extras, surfaces: surf, surfaceList,
    palette: swatches.map((x) => ({ name: x.name, hex: x.hex.toUpperCase(), use: x.use ?? "", role: ROLE_LABEL[roleName(x)] ?? "" })),
    noPalette: swatches.length === 0,
  };
}

/** Every shape the library has for a piece, for the "Shape" picker. */
export const shapesFor = (cat: Category) => LIBRARY[cat];
