/**
 * Which way a piece on the plan faces. Layouts made from the size and grouping tables carry it; for older ones
 * it's worked out: a piece that stands against a wall faces away from the nearest wall along its long side, and a
 * bed faces away from the wall its head (a short side) is nearest.
 */
import type { LayoutItem } from "../state";

export type Dir = NonNullable<LayoutItem["facing"]>;
const AWAY: Record<"A" | "B" | "C" | "D", Dir> = { A: "down", C: "up", D: "right", B: "left" };
/** Kinds that have a back. Tables, rugs and lamps don't. */
const FRONTED = new Set(["sofa", "bed", "storage", "desk", "keep", "chair"]);

export function facingOf(i: LayoutItem, wM: number, lM: number): Dir | undefined {
  if (i.facing) return i.facing;
  if (!FRONTED.has(i.kind) || i.kind === "chair") return undefined; // a loose chair's direction can't be guessed
  const W = wM * 100, L = lM * 100;
  const x = (i.x / 100) * W, y = (i.y / 100) * L, w = (i.w / 100) * W, h = (i.h / 100) * L;
  const gaps = { A: y, C: L - (y + h), D: x, B: W - (x + w) };
  // most pieces stand with a long side on the wall; a bed with a short side (its head)
  const longAcross = w >= h;
  const across = i.kind === "bed" ? !longAcross : longAcross;
  const pair: ("A" | "B" | "C" | "D")[] = across ? ["A", "C"] : ["D", "B"];
  const wall = gaps[pair[0]] <= gaps[pair[1]] ? pair[0] : pair[1];
  return AWAY[wall];
}

/** The side of the piece its back is on. */
export const backSide = (d: Dir) => ({ down: "top", up: "bottom", right: "left", left: "right" })[d];

/** A quarter turn clockwise. */
export const turnDir = (d: Dir | undefined): Dir | undefined => (d ? ({ up: "right", right: "down", down: "left", left: "up" } as const)[d] : d);
