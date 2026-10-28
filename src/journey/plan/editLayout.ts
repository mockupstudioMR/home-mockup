/**
 * Editing a layout on the plan (step 4.4): add pieces such as seats, move, resize, turn and remove them.
 * Layout items are in percent of the room's inside (x from wall D, y from wall A), so every edit needs the room
 * size in metres to keep real proportions.
 */
import type { LayoutItem } from "../state";

/** Pieces that can be added from the layout page, with a typical size in cm (width along the wall × depth). */
export const ADDABLE: { kind: string; label: string; w: number; d: number }[] = [
  { kind: "chair", label: "Armchair", w: 80, d: 80 },
  { kind: "chair", label: "Dining chair", w: 45, d: 50 },
  { kind: "bench", label: "Bench", w: 120, d: 40 },
  { kind: "sofa", label: "Sofa", w: 210, d: 95 },
  { kind: "table", label: "Coffee table", w: 100, d: 60 },
  { kind: "table", label: "Dining table", w: 160, d: 90 },
  { kind: "storage", label: "Storage", w: 120, d: 40 },
  { kind: "desk", label: "Desk", w: 120, d: 60 },
  { kind: "bed", label: "Bed", w: 160, d: 200 },
  { kind: "rug", label: "Rug", w: 200, d: 140 },
  { kind: "other", label: "Other piece", w: 60, d: 60 },
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const r1 = (n: number) => Math.round(n * 10) / 10;
/** Smallest piece, in cm. */
const MIN_CM = 20;

/** Keeps a piece inside the room. */
export function keepInside(i: LayoutItem): LayoutItem {
  const w = clamp(i.w, 0.5, 100), h = clamp(i.h, 0.5, 100);
  return { ...i, w: r1(w), h: r1(h), x: r1(clamp(i.x, 0, 100 - w)), y: r1(clamp(i.y, 0, 100 - h)) };
}

/** A new piece, centred in the room (or at a given centre, in percent). */
export function newPiece(kind: string, label: string, wCm: number, dCm: number, roomW: number, roomL: number, at?: { x: number; y: number }): LayoutItem {
  const w = (wCm / (roomW * 100)) * 100, h = (dCm / (roomL * 100)) * 100;
  const c = at ?? { x: 50, y: 50 };
  return keepInside({ label, kind, x: c.x - w / 2, y: c.y - h / 2, w, h });
}

/** Moves a piece by a distance in percent of the room. */
export const moveBy = (i: LayoutItem, dx: number, dy: number): LayoutItem => keepInside({ ...i, x: i.x + dx, y: i.y + dy });

/** The piece's size in cm. */
export const sizeCm = (i: LayoutItem, roomW: number, roomL: number) => ({ w: Math.round((i.w / 100) * roomW * 100), d: Math.round((i.h / 100) * roomL * 100) });

/** Sets the piece's size in cm, keeping its centre where it is. */
export function resizeCm(i: LayoutItem, wCm: number, dCm: number, roomW: number, roomL: number): LayoutItem {
  const w = (Math.max(MIN_CM, wCm) / (roomW * 100)) * 100, h = (Math.max(MIN_CM, dCm) / (roomL * 100)) * 100;
  const cx = i.x + i.w / 2, cy = i.y + i.h / 2;
  return keepInside({ ...i, x: cx - w / 2, y: cy - h / 2, w, h });
}

/** Turns a piece a quarter turn around its centre (its real width and depth swap). */
export function turn(i: LayoutItem, roomW: number, roomL: number): LayoutItem {
  const { w, d } = sizeCm(i, roomW, roomL);
  return resizeCm(i, d, w, roomW, roomL);
}
