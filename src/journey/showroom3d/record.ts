/**
 * The saved style of a room: the moodboard's colours with their exact values, and every element of the
 * room with its colour, material, matched shape and where it stands on its wall. Built from the showroom's
 * model, so it always describes what the person sees. Kept with the journey and mirrored to the database.
 */
import type { Wall } from "../state";
import type { Edits, PaletteEntry, PieceModel, ShowroomModel } from "./model";

export type RecordElement = {
  id: string; name: string; category: string; kept: boolean;
  color: string; colorFrom: string; material?: string;
  shape: string; shapeName: string; matchedFrom: string; shapeMatched: boolean;
  wall: Wall; onWall: boolean; fromCm: number; toCm: number; widthCm: number; depthCm: number; heightCm: number;
  edited: boolean;
};
export type StyleRecord = {
  v: 1;
  savedAt: string;
  style: string;
  layoutId?: string;
  room: { widthCm: number; lengthCm: number; heightCm: number; example: boolean };
  palette: PaletteEntry[];
  surfaces: { id: string; name: string; color: string; colorFrom: string; edited: boolean }[];
  elements: RecordElement[];
  extras: { id: string; name: string; kind: string; wall: Wall; color: string; colorFrom: string; edited: boolean }[];
  walls: Record<Wall, { lengthCm: number; order: string[] }>;
  edits: Edits;
};

const cm = (m: number) => Math.round(m * 100);

/** The pieces standing against each wall, left to right as seen from inside the room. Rugs and pieces out in the room belong to no wall. */
export function wallOrder(m: ShowroomModel): Record<Wall, PieceModel[]> {
  const out: Record<Wall, PieceModel[]> = { A: [], B: [], C: [], D: [] };
  for (const p of m.pieces) if (p.onWall && p.category !== "rug") out[p.wall].push(p);
  for (const w of Object.keys(out) as Wall[]) out[w].sort((a, b) => a.fromCm - b.fromCm);
  return out;
}

export function buildRecord(m: ShowroomModel, edits: Edits, layoutId?: string, now = new Date()): StyleRecord {
  const order = wallOrder(m);
  const len = (w: Wall) => cm(w === "A" || w === "C" ? m.room.w : m.room.l);
  return {
    v: 1,
    savedAt: now.toISOString(),
    style: m.style,
    layoutId,
    room: { widthCm: cm(m.room.w), lengthCm: cm(m.room.l), heightCm: cm(m.room.h), example: m.room.example },
    palette: m.palette,
    surfaces: m.surfaceList.map((s) => ({ id: s.id, name: s.name, color: s.color, colorFrom: s.colorFrom, edited: s.edited })),
    elements: m.pieces.map((p) => ({
      id: p.id, name: p.name, category: p.category, kept: p.kept,
      color: p.color, colorFrom: p.colorFrom, material: p.fabric,
      shape: p.shape, shapeName: p.shapeName, matchedFrom: p.described, shapeMatched: p.matched,
      wall: p.wall, onWall: p.onWall, fromCm: p.fromCm, toCm: p.toCm, widthCm: cm(p.w), depthCm: cm(p.d), heightCm: cm(p.h),
      edited: p.edited,
    })),
    extras: m.extras.map((e) => ({ id: e.id, name: e.name, kind: e.kind, wall: e.wall, color: e.color, colorFrom: e.colorFrom, edited: e.edited })),
    walls: { A: { lengthCm: len("A"), order: order.A.map((p) => p.id) }, B: { lengthCm: len("B"), order: order.B.map((p) => p.id) }, C: { lengthCm: len("C"), order: order.C.map((p) => p.id) }, D: { lengthCm: len("D"), order: order.D.map((p) => p.id) } },
    edits,
  };
}

/** True when two records describe the same room and style (ignores when they were saved). */
export const sameRecord = (a?: StyleRecord, b?: StyleRecord) => !!a && !!b && JSON.stringify({ ...a, savedAt: "" }) === JSON.stringify({ ...b, savedAt: "" });
