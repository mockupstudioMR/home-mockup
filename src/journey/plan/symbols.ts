/**
 * Top-view furniture symbols (public/furniture-symbols/<key>.svg): one vector drawing per piece, used every time a
 * piece is drawn on a plan instead of drawing it afresh. Each is drawn with the back of the piece at the top and its
 * front at the bottom, at its usual proportions (cm), and is turned to the way the piece faces.
 */
import { symbolForName } from "../../../supabase/functions/_shared/layoutRules";
import type { LayoutItem } from "../state";
import type { Dir } from "./facing";

/** Each symbol's drawn size in cm (width along its back × depth). */
export const SYMBOL_SIZE: Record<string, [number, number]> = {
  "armchair": [80.0, 85.0],
  "bed-double": [160.0, 200.0],
  "bed-king": [180.0, 200.0],
  "bed-single": [90.0, 200.0],
  "bench": [120.0, 40.0],
  "bookshelf": [90.0, 35.0],
  "coffee-table": [110.0, 65.0],
  "console": [100.0, 30.0],
  "cushion": [45.0, 45.0],
  "desk-chair": [60.0, 60.0],
  "desk": [120.0, 60.0],
  "dining-chair": [45.0, 50.0],
  "dining-table": [140.0, 80.0],
  "dresser": [120.0, 50.0],
  "floor-lamp": [30.0, 30.0],
  "generic": [80.0, 60.0],
  "mirror-round": [80.0, 6.0],
  "nightstand": [45.0, 40.0],
  "piano-bench": [56.0, 36.0],
  "piano-digital": [136.0, 40.0],
  "piano-grand": [150.0, 155.0],
  "piano-upright": [150.0, 60.0],
  "rug": [240.0, 340.0],
  "side-table": [45.0, 45.0],
  "sideboard": [160.0, 45.0],
  "sofa-2": [190.0, 95.0],
  "sofa-3": [220.0, 95.0],
  "sofa-4": [290.0, 110.0],
  "sofa-curved": [240.0, 105.0],
  "sofa-l": [280.0, 180.0],
  "tv-unit": [160.0, 40.0],
  "wardrobe": [200.0, 60.0]
};

export const symbolUrl = (key: string) => `/furniture-symbols/${key}.svg`;

/** The symbol for a piece on the plan: the one its size row names, else one chosen from its name and kind. */
export function symbolOf(i: Pick<LayoutItem, "symbol" | "label" | "kind">): string {
  const k = i.symbol && SYMBOL_SIZE[i.symbol] ? i.symbol : symbolForName(i.label ?? "", undefined, i.kind);
  return SYMBOL_SIZE[k] ? k : "generic";
}

/**
 * How to lay the symbol into a piece of `pw` × `ph` px: turned to the piece's facing (back away from its front),
 * or, for a piece with no front, turned a quarter when its long side runs the other way to the drawing's.
 */
export function symbolPlacement(key: string, dir: Dir | undefined, pw: number, ph: number) {
  const [sw, sh] = SYMBOL_SIZE[key] ?? [1, 1];
  const squareish = Math.abs(sw / sh - 1) < 0.15;
  const deg = dir ? { down: 0, up: 180, left: 90, right: -90 }[dir] : !squareish && sw >= sh !== pw >= ph ? 90 : 0;
  const quarter = Math.abs(deg) === 90;
  const w = quarter ? ph : pw, h = quarter ? pw : ph;
  return { width: w, height: h, left: (pw - w) / 2, top: (ph - h) / 2, transform: deg ? `rotate(${deg}deg)` : undefined };
}
