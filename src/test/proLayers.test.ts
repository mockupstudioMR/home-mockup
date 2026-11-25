import { describe, expect, it } from "vitest";
import { drawPro, nearestPiece, plateNoise, proPiece, surfaceLayer } from "@/journey/wallScenes/proLayers";
import type { Rgba } from "@/journey/wallScenes/layers";

const W = 80, H = 60;
const WALL = 1, FLOOR = 2, SOFA = 3, TABLE = 4;
const fill = (f: (x: number, y: number) => [number, number, number]): Rgba => {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [r, g, b] = f(x, y); const i = (y * W + x) * 4; data.set([r, g, b, 255], i); }
  return { data, width: W, height: H };
};
const inSofa = (x: number, y: number) => x >= 10 && x < 40 && y >= 20 && y < 40;
const inTable = (x: number, y: number) => x >= 50 && x < 66 && y >= 36 && y < 44;
const terracotta: [number, number, number] = [196, 110, 80], mustard: [number, number, number] = [214, 170, 60], oak: [number, number, number] = [170, 140, 110];
const room = (wall: [number, number, number]) => (x: number, y: number): [number, number, number] => (y < 40 ? wall : oak);
// the item map: wall above 40, floor below; the sofa against the wall, a table on the floor
const ids = new Uint16Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) ids[y * W + x] = inSofa(x, y) ? SOFA : inTable(x, y) ? TABLE : y < 40 ? WALL : FLOOR;
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
  const { owner, dist } = nearestPiece(ids, W, H, new Set([SOFA, TABLE]));

  it("measures no noise where the photo and the empty room agree", () => {
    expect(plateNoise(photo, plate, dist, 6)).toBeLessThan(5);
  });

  it("a sofa over a new wall colour shows no trace of the old wall around it", () => {
    const sofa = proPiece(photo, plate, owner, SOFA, box(14, 24, 36, 36), box(4, 14, 46, 46), 30);
    expect(sofa.cover).toBeGreaterThan(0.8);
    const newRoom = fill(room(mustard));
    const out = drawPro(newRoom, sofa);
    expect(px(out, 25, 30)).toEqual([70, 110, 80]); // the sofa itself
    // right next to the sofa, the new wall: nothing terracotta
    for (const [x, y] of [[9, 30], [40, 30], [25, 19], [8, 22]]) {
      const [r, g, b] = px(out, x, y);
      expect(Math.abs(r - mustard[0]) + Math.abs(g - mustard[1]) + Math.abs(b - mustard[2])).toBeLessThan(20);
    }
  });

  it("a table keeps its contact shadow on the floor, so it doesn't float", () => {
    const table = proPiece(photo, plate, owner, TABLE, box(52, 37, 64, 43), box(44, 30, 72, 54), 30);
    const out = drawPro(fill(room(mustard)), table);
    const [r] = px(out, 58, 46);
    expect(r).toBeLessThan(oak[0] * 0.75); // darker than the bare floor: the shadow is there
    expect(px(out, 58, 52)[0]).toBeGreaterThan(oak[0] - 6); // and it fades out further away
  });

  it("cuts a wall layer to the wall alone", () => {
    const l = surfaceLayer(fill(room(mustard)), ids, WALL, 0);
    expect(l.data[(10 * W + 5) * 4 + 3]).toBe(255);
    expect(l.data[(50 * W + 5) * 4 + 3]).toBe(0);
  });
});
