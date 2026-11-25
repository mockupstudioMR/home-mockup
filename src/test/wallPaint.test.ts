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

describe("wall repaint stops at the floor", () => {
  // a mustard wall over a light warm-wood floor of the same colour family, joined smoothly (no skirting edge)
  const W3 = 60, H3 = 60;
  const im: Rgba = { data: new Uint8ClampedArray(W3 * H3 * 4), width: W3, height: H3 };
  for (let y = 0; y < H3; y++) for (let x = 0; x < W3; x++) {
    const t = Math.max(0, Math.min(1, (y - 36) / 8)); // the wall fades into the floor between y 36 and 44
    const c = [214 * (1 - t) + 205 * t, 170 * (1 - t) + 170 * t, 60 * (1 - t) + 110 * t];
    im.data.set([c[0], c[1], c[2], 255], (y * W3 + x) * 4);
  }
  it("never runs past the floor line it is given", () => {
    const m = wallMask(im, { x0: 5, y0: 2, x1: 55, y1: 10 }, { x0: 0, y0: 0, x1: W3, y1: 40 });
    expect(m[20 * W3 + 30]).toBe(1);
    for (let y = 41; y < H3; y++) expect(m[y * W3 + 30]).toBe(0);
  });
});

describe("wall repaint and a cushion in the wall's colour behind a soft edge", () => {
  // a terracotta wall; a terracotta cushion in front of it whose edge is blurred over 4 px through a darker seam
  const W4 = 80, H4 = 50;
  const im: Rgba = { data: new Uint8ClampedArray(W4 * H4 * 4), width: W4, height: H4 };
  const wallC = [150, 70, 50];
  for (let y = 0; y < H4; y++) for (let x = 0; x < W4; x++) {
    const dx = x - 40, dy = y - 30, r = Math.sqrt(dx * dx + dy * dy);
    // inside r<10 the cushion (a touch lighter), a dark seam at r≈10, blurred: each pixel steps only a little
    const seam = Math.max(0, 1 - Math.abs(r - 10) / 6); // 0..1 over ±6 px: each pixel steps only ~11
    const k = (r < 10 ? 1.05 : 1) * (1 - 0.45 * seam);
    im.data.set([wallC[0] * k, wallC[1] * k, wallC[2] * k, 255], (y * W4 + x) * 4);
  }
  it("stops at the blurred seam", () => {
    const m = wallMask(im, { x0: 2, y0: 2, x1: 78, y1: 10 });
    expect(m[5 * W4 + 5]).toBe(1);
    expect(m[30 * W4 + 40]).toBe(0); // the cushion's middle
  });
});
