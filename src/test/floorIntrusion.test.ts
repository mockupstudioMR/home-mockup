import { describe, expect, it } from "vitest";
import { drawPro, flatIntrusion, proPiece } from "@/journey/wallScenes/proLayers";
import type { Rgba } from "@/journey/wallScenes/layers";

// a patterned terracotta rug on the floor, a dark wood table on it: top y 20–26, two legs x 22–26 and 54–58 down to y 46
const W = 80, H = 60;
const noise = (x: number, y: number) => ((x * 73856093) ^ (y * 19349663)) % 17 - 8;
const rug = (x: number, y: number): [number, number, number] => [190 + noise(x, y), 110 + noise(y, x), 95 + noise(x + 3, y)];
const inTop = (x: number, y: number) => x >= 16 && x < 64 && y >= 20 && y < 26;
const inLeg = (x: number, y: number) => y >= 26 && y < 46 && ((x >= 22 && x < 26) || (x >= 54 && x < 58));
const table = (x: number, y: number) => inTop(x, y) || inLeg(x, y);
const fill = (f: (x: number, y: number) => [number, number, number]): Rgba => {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) data.set([...f(x, y), 255], (y * W + x) * 4);
  return { data, width: W, height: H };
};
const photo = fill((x, y) => (table(x, y) ? [70, 45, 30] : rug(x, y)));
const plate = fill((x, y) => rug(x, y));
const mask = (f: (x: number, y: number) => boolean) => { const m = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (f(x, y)) m[y * W + x] = 1; return m; };
// the outline as segmentation gives it: one blob over the top and both legs, rug between the legs included
const blob = mask((x, y) => x >= 14 && x < 66 && y >= 18 && y < 48);
const surface = mask((x, y) => y >= 14);
const area = { x0: 4, y0: 10, x1: 76, y1: 56 };

describe("floor or rug inside a piece's outline", () => {
  const out = flatIntrusion(photo, blob, surface, undefined, area);
  it("finds the rug between the legs and under the table, and not the table itself", () => {
    expect(out[40 * W + 40]).toBe(1); // between the legs
    expect(out[30 * W + 30]).toBe(1);
    expect(out[40 * W + 24]).toBe(0); // a leg
    expect(out[23 * W + 40]).toBe(0); // the top
  });
  it("with it taken out, a new rug shows between the legs", () => {
    const piece = proPiece(photo, plate, blob, { x0: 20, y0: 20, x1: 60, y1: 44 }, area, undefined, out);
    const green = fill(() => [40, 90, 60]);
    const seen = drawPro(green, piece);
    const at = (x: number, y: number) => Array.from(seen.data.slice((y * W + x) * 4, (y * W + x) * 4 + 3));
    expect(at(40, 40)[0]).toBeLessThan(80); // green, not terracotta
    expect(at(24, 40)).toEqual([70, 45, 30]); // the leg
  });
});
