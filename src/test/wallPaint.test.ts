import { describe, expect, it } from "vitest";
import { paintWall, wallMask, wallSeeds } from "@/journey/wallScenes/wallPaint";
import type { Rgba } from "@/journey/wallScenes/layers";

const W = 120, H = 80;
// a terracotta wall lit from the right (brighter and paler towards the door), a green sofa, on it a cushion in
// the wall's own colour with a soft dark seam, a white door, and the floor below
const terracotta = [150, 70, 50];
const at = (x: number, y: number): number[] => {
  if (y >= 60) return [90, 60, 40]; // floor
  if (x >= 100 && y >= 10) return [235, 235, 230]; // door
  if (x >= 30 && x < 70 && y >= 40) {
    if (x >= 40 && x < 50 && y >= 42 && y < 50) return terracotta; // cushion, the wall's colour
    if (x >= 39 && x < 51 && y >= 41 && y < 51) return [40, 35, 30]; // its seam
    return [60, 100, 70]; // sofa
  }
  const k = 0.8 + (x / W) * 0.7; // daylight from the right
  return [Math.min(255, terracotta[0] * k + (x / W) * 25), Math.min(255, terracotta[1] * k + (x / W) * 25), Math.min(255, terracotta[2] * k + (x / W) * 25)];
};
const img: Rgba = { data: new Uint8ClampedArray(W * H * 4), width: W, height: H };
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = at(x, y); img.data.set([c[0], c[1], c[2], 255], (y * W + x) * 4); }
const seeds = wallSeeds(W, H, { x0: 0, y0: 0, x1: W, y1: 60 }, [{ x0: 100, y0: 10, x1: W, y1: 60 }]);

describe("wall repaint", () => {
  const m = wallMask(img, seeds);
  const on = (x: number, y: number) => m[y * W + x];
  it("finds the whole wall, bright and dim, and nothing else", () => {
    expect(on(5, 5)).toBe(1); expect(on(95, 5)).toBe(1); expect(on(95, 55)).toBe(1); expect(on(20, 55)).toBe(1);
    expect(on(50, 45)).toBeLessThan(1); // sofa
    expect(on(45, 46)).toBe(0); // the cushion in the wall's colour
    expect(on(110, 30)).toBe(0); // door
    expect(on(50, 70)).toBe(0); // floor
  });
  it("paints the new colour keeping the light", () => {
    const layer = paintWall(img, m, seeds, "#6E8B74");
    const px = (x: number, y: number) => Array.from(layer.data.slice((y * W + x) * 4, (y * W + x) * 4 + 4));
    const left = px(5, 5), right = px(95, 5);
    expect(left[3]).toBe(255);
    expect(right[1]).toBeGreaterThan(left[1]); // brighter where the daylight is
    expect(left[1]).toBeGreaterThan(left[0]); // green, not terracotta
    expect(px(45, 46)[3]).toBe(0); // the cushion untouched
    expect(px(110, 30)[3]).toBe(0);
  });
});

describe("wall repaint in the shade", () => {
  // the wall darkens and turns redder in a soft shadow beside and behind a sofa (as photographed)
  const W2 = 100, H2 = 60;
  const wallAt = (x: number, y: number) => {
    const inSofa = x >= 50 && x < 90 && y >= 30;
    if (inSofa) return [50, 90, 60];
    // shadow strength: strongest right next to the sofa, fading out over ~20 px
    const d = x < 50 ? 50 - x : y < 30 ? 30 - y : 99;
    const s = d < 20 ? 0.3 + 0.7 * (d / 20) : 1;
    // shade shifts the hue a little towards red (less green and blue)
    return [150 * s + 10 * (1 - s), 70 * s * (0.85 + 0.15 * s), 50 * s * (0.8 + 0.2 * s)];
  };
  const im: Rgba = { data: new Uint8ClampedArray(W2 * H2 * 4), width: W2, height: H2 };
  for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) { const c = wallAt(x, y); im.data.set([c[0], c[1], c[2], 255], (y * W2 + x) * 4); }
  const sd = { x0: 2, y0: 2, x1: 30, y1: 12 };
  it("takes in the shaded wall right up to the sofa", () => {
    const m = wallMask(im, sd);
    expect(m[45 * W2 + 48]).toBeGreaterThan(0.4); // deepest shade, next to the sofa's side
    expect(m[28 * W2 + 70]).toBeGreaterThan(0.4); // shade just above the sofa
    expect(m[45 * W2 + 60]).toBe(0); // the sofa itself
  });
});
