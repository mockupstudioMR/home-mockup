import { describe, expect, it } from "vitest";
import { drawPro, proPiece, surfaceLayer } from "@/journey/wallScenes/proLayers";
import { wallMask as findWall } from "@/journey/wallScenes/wallPaint";
import type { Rgba } from "@/journey/wallScenes/layers";

const W = 80, H = 60;
const fill = (f: (x: number, y: number) => [number, number, number]): Rgba => {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [r, g, b] = f(x, y); const i = (y * W + x) * 4; data.set([r, g, b, 255], i); }
  return { data, width: W, height: H };
};
const inSofa = (x: number, y: number) => x >= 10 && x < 40 && y >= 20 && y < 40;
const inTable = (x: number, y: number) => x >= 50 && x < 66 && y >= 36 && y < 44;
const terracotta: [number, number, number] = [196, 110, 80], mustard: [number, number, number] = [214, 170, 60], oak: [number, number, number] = [170, 140, 110];
const room = (wall: [number, number, number]) => (x: number, y: number): [number, number, number] => (y < 40 ? wall : oak);
// the photo: a green sofa and a table with a soft shadow on the floor under it
const plate = fill(room(terracotta));
const photo = fill((x, y) => {
  if (inSofa(x, y)) return [70, 110, 80];
  if (inTable(x, y)) return [90, 60, 40];
  const base = room(terracotta)(x, y);
  return y >= 44 && y < 48 && x >= 50 && x < 66 ? (base.map((v) => Math.round(v * 0.6)) as [number, number, number]) : base;
});
const box = (x0: number, y0: number, x1: number, y1: number) => ({ x0, y0, x1, y1 });
const px = (img: Rgba, x: number, y: number) => Array.from(img.data.slice((y * W + x) * 4, (y * W + x) * 4 + 3));

describe("PRO layers", () => {
  // the outlines, as segmentation of the photo gives them (here: exact)
  const maskOf = (f: (x: number, y: number) => boolean) => { const m = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (f(x, y)) m[y * W + x] = 1; return m; };
  const sofaMask = maskOf(inSofa), tableMask = maskOf(inTable), wallMask = maskOf((x, y) => y < 40 && !inSofa(x, y));

  it("a sofa over a new wall colour shows no trace of the old wall around it", () => {
    const sofa = proPiece(photo, plate, sofaMask, box(14, 24, 36, 36), box(4, 14, 46, 46));
    expect(sofa.cover).toBeGreaterThan(0.8);
    const newRoom = fill(room(mustard));
    const out = drawPro(newRoom, sofa);
    expect(px(out, 25, 30)).toEqual([70, 110, 80]); // the sofa itself
    // no dark rim on its edge: the edge pixel lies between the sofa and the new wall
    const [er, eg] = px(out, 10, 30);
    expect(er).toBeGreaterThanOrEqual(70); expect(eg).toBeGreaterThanOrEqual(110);
    // right next to the sofa, the new wall: nothing terracotta
    for (const [x, y] of [[9, 30], [40, 30], [25, 19], [8, 22]]) {
      const [r, g, b] = px(out, x, y);
      expect(Math.abs(r - mustard[0]) + Math.abs(g - mustard[1]) + Math.abs(b - mustard[2])).toBeLessThan(20);
    }
  });

  it("a table keeps its contact shadow on the floor, so it doesn't float", () => {
    const table = proPiece(photo, plate, tableMask, box(52, 37, 64, 43), box(44, 30, 72, 54));
    const out = drawPro(fill(room(mustard)), table);
    const [r] = px(out, 58, 46);
    expect(r).toBeLessThan(oak[0] * 0.75); // darker than the bare floor: the shadow is there
    expect(px(out, 58, 52)[0]).toBeGreaterThan(oak[0] - 6); // and it fades out further away
  });

  it("a neighbouring piece and a slightly darker empty room never become the piece's shadow", () => {
    // a dark cabinet right beside the sofa, and an empty room 8% brighter than the photo overall
    const inCab = (x: number, y: number) => x >= 42 && x < 48 && y >= 22 && y < 40;
    const shot = fill((x, y) => (inSofa(x, y) ? [70, 110, 80] : inCab(x, y) ? [40, 30, 25] : room(terracotta)(x, y)));
    const bright = fill((x, y) => room(terracotta)(x, y).map((v) => Math.min(255, Math.round(v * 1.08))) as [number, number, number]);
    const sofa = proPiece(shot, bright, sofaMask, box(14, 24, 36, 36), box(4, 14, 52, 46), maskOf(inCab));
    for (const [x, y] of [[44, 30], [46, 25], [6, 16], [30, 16]]) expect([x, y, sofa.shadow.data[(y * W + x) * 4]]).toEqual([x, y, 255]);
    expect(sofa.shadow.data[(30 * W + 25) * 4]).toBe(0); // black under the sofa itself (multiply, then lighten)
  });

  it("cuts a wall layer to the wall alone", () => {
    const l = surfaceLayer(fill(room(mustard)), wallMask, 0);
    expect(l.data[(10 * W + 5) * 4 + 3]).toBe(255);
    expect(l.data[(50 * W + 5) * 4 + 3]).toBe(0);
  });

  it("a coarse outline (a segmentation blob) brings none of the old wall with the sofa", () => {
    // the blob reaches 6 px past the sofa on every side, as Gemini's masks do
    const blob = maskOf((x, y) => x >= 4 && x < 46 && y >= 14 && y < 46);
    const wall = findWall(photo, box(2, 2, 70, 10));
    const sofa = proPiece(photo, plate, blob, box(14, 24, 36, 36), box(0, 8, 52, 52), undefined, wall);
    const out = drawPro(fill(room(mustard)), sofa);
    for (const [x, y] of [[6, 25], [42, 25], [25, 16], [7, 16]]) {
      const [r, g, b] = px(out, x, y);
      expect(Math.abs(r - mustard[0]) + Math.abs(g - mustard[1]) + Math.abs(b - mustard[2])).toBeLessThan(20);
    }
    expect(px(out, 25, 30)).toEqual([70, 110, 80]);
  });

  it("thin legs and rockers survive, while a mixed edge pixel is still dropped", () => {
    // a seat (x 20–50, y 14–30) on two legs 2 px wide (x 24–25 and 44–45, y 30–48) in front of the terracotta wall;
    // the seat's right edge pixel (x 50) is half seat, half wall, as a photo's edge pixel is
    const seat: [number, number, number] = [60, 60, 66], leg: [number, number, number] = [30, 30, 32];
    const inSeat = (x: number, y: number) => x >= 20 && x < 50 && y >= 14 && y < 30;
    const inLeg = (x: number, y: number) => y >= 30 && y < 48 && (x === 24 || x === 25 || x === 44 || x === 45);
    const shot = fill((x, y) => (inSeat(x, y) ? seat : inLeg(x, y) ? leg : x === 50 && y >= 14 && y < 30 ? [128, 85, 73] : room(terracotta)(x, y)));
    const outline = maskOf((x, y) => (x >= 20 && x <= 50 && y >= 14 && y < 30) || inLeg(x, y));
    const chair = proPiece(shot, plate, outline, box(22, 16, 48, 46), box(10, 6, 60, 54));
    const on = drawPro(fill(room(mustard)), chair);
    expect(px(on, 24, 40)).toEqual(leg); // both legs are drawn whole, not trimmed away
    expect(px(on, 45, 40)).toEqual(leg);
    expect(px(on, 35, 20)).toEqual(seat);
    const [r, g] = px(on, 50, 20); // the mixed edge pixel: the new wall, not the old blend
    expect(Math.abs(r - mustard[0]) + Math.abs(g - mustard[1])).toBeLessThan(20);
  });
});
