import { describe, expect, it } from "vitest";
import { EMPTY, type JourneyState } from "@/journey/state";
import { buildModel } from "@/journey/showroom3d/model";
import { centreOf, composite, cutLayer, driftOutside, itemMask, pxBox, type Rgba } from "@/journey/wallScenes/layers";
import { wallItems } from "@/journey/wallScenes/items";
import { wallKey } from "@/journey/wallScenes/runner";

const W = 120, H = 80;
function picture(fill: (x: number, y: number) => [number, number, number]): Rgba {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [r, g, b] = fill(x, y); const i = (y * W + x) * 4; data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255; }
  return { data, width: W, height: H };
}
// a grey room with a plum "sofa" at x 40–80, y 40–65
const inSofa = (x: number, y: number) => x >= 40 && x < 80 && y >= 40 && y < 65;
const base = picture((x, y) => (inSofa(x, y) ? [94, 43, 79] : [185, 179, 170]));
const green = picture((x, y) => (inSofa(x, y) ? [31, 92, 74] : [186, 179, 171]));
const box: [number, number, number, number] = [(40 / W) * 100, (40 / H) * 100, (40 / W) * 100, (25 / H) * 100];

describe("cutting an alternative into a layer", () => {
  it("finds the item's pixels and nothing outside its box", () => {
    const m = itemMask(base, [green], box);
    expect(m.fallback).toBe(false);
    expect(m.alpha[(52 * W + 60)]).toBeGreaterThan(0.95); // inside the sofa
    expect(m.alpha[(10 * W + 10)]).toBe(0); // far away
    expect(m.alpha[(52 * W + 20)]).toBe(0); // beside it, outside the box
    expect(m.cover).toBeGreaterThan(0.3);
  });
  it("cuts every variation to the same shape, so swapping is seamless", () => {
    const m = itemMask(base, [green], box);
    const main = cutLayer(base, m.alpha), alt = cutLayer(green, m.alpha);
    const i = (52 * W + 60) * 4;
    expect([main.data[i], main.data[i + 3]]).toEqual([94, 255]);
    expect([alt.data[i], alt.data[i + 3]]).toEqual([31, 255]);
    expect(alt.data[(10 * W + 10) * 4 + 3]).toBe(0);
    expect(composite(base, alt).data[i]).toBe(31);
    const c = centreOf(m.alpha, W, m.box);
    expect(Math.abs(c.x - 60)).toBeLessThan(4);
    expect(Math.abs(c.y - 52)).toBeLessThan(4);
  });
  it("falls back to the item's box when nothing visible changed", () => {
    const m = itemMask(base, [base], box);
    expect(m.fallback).toBe(true);
    expect(m.alpha[(52 * W + 60)]).toBeGreaterThan(0.9);
  });
  it("notices an alternative that moved the rest of the picture", () => {
    const shifted = picture((x, y) => (x % 7 < 3 ? [60, 60, 60] : [185, 179, 170]));
    const b = pxBox(box, W, H, 0.15);
    expect(driftOutside(base, green, b)).toBeLessThan(3);
    expect(driftOutside(base, shifted, b)).toBeGreaterThan(20);
  });
});

const anna: JourneyState = {
  ...EMPTY,
  moodboard: { name: "Eclectic Modern", feels: [], palette: [
    { name: "Grey plaster", hex: "#B9B3AA", use: "Walls" }, { name: "Plum", hex: "#5E2B4F", use: "Sofa, curtains" },
    { name: "Dark walnut", hex: "#4A3226", use: "Shelving, floor" }, { name: "Emerald", hex: "#1F5C4A", use: "Arch, accent chair" }, { name: "Brushed brass", hex: "#B08D57", use: "Lighting, panels" },
  ] },
  preview: { versions: [{ id: "v1", image: "https://x/preview.png", createdAt: "" }], current: 0, read: [{ key: "furniture", text: "A plum curved velvet sofa", keywords: [], x: 0, y: 0 }] },
  room: { wallPhotos: [], widthM: 3.75, lengthM: 4.9, ceilingM: 2.7 },
  placements: [{ id: "w1", kind: "windows", n: 1, wall: "C", pos: 47 }, { id: "d1", kind: "doors", n: 1, wall: "D", pos: 23 }],
  layouts: [{ id: "L1", name: "Relax", zones: [], notes: [], items: [
    { label: "Sofa", kind: "sofa", x: 29, y: 1, w: 64, h: 19, facing: "down" },
    { label: "Bookshelf", kind: "storage", x: 3, y: 1, w: 21, h: 7, facing: "down" },
    { label: "Upright piano", kind: "keep", x: 82, y: 35, w: 16, h: 31, facing: "left" },
  ] }],
  chosenLayout: 0,
  walls: { A: { role: "Sofa", status: "review", items: [{ n: 1, group: "furniture", name: "Sofa", note: "", action: "Buy", x: 50, y: 50, ref: "lay-0", choice: { name: "Shop sofa Velluto", image: "https://shop.example/velluto.jpg" } }] } },
};

describe("what can be swapped on each wall", () => {
  it("lists the wall's own pieces with a main option and two alternatives", () => {
    const m = buildModel(anna), items = wallItems(anna, m, "A");
    expect(items.map((i) => i.id)).toEqual(["walls", "floor", "lay-0", "lay-1"]);
    for (const it of items) expect(it.alts.length).toBe(2);
    const sofa = items.find((i) => i.id === "lay-0")!;
    expect(sofa.current).toBe("plum velvet curved sofa");
  });
  it("puts the product picked from the person's own shop first", () => {
    const sofa = wallItems(anna, buildModel(anna), "A").find((i) => i.id === "lay-0")!;
    expect(sofa.alts[0]).toMatchObject({ name: "Shop sofa Velluto", productImageUrl: "https://shop.example/velluto.jpg" });
    expect(sofa.alts[1].target).toMatch(/plum|emerald|walnut|brass|grey/);
  });
  it("uses the moodboard's colours for the other alternatives", () => {
    const shelf = wallItems(anna, buildModel(anna), "A").find((i) => i.id === "lay-1")!;
    expect(shelf.alts.some((a) => /#[0-9A-F]{6}/.test(a.target))).toBe(true);
  });
  it("never offers alternatives for a kept piece, and adds the door on its wall", () => {
    const b = wallItems(anna, buildModel(anna), "B");
    expect(b.some((i) => /piano/i.test(i.title))).toBe(false);
    expect(wallItems(anna, buildModel(anna), "D").some((i) => i.id === "doors")).toBe(true);
  });
  it("knows when a wall's picture is out of date", () => {
    const m = buildModel(anna), k = wallKey(anna, m, "A");
    expect(wallKey(anna, buildModel(anna), "A")).toBe(k);
    const moved = { ...anna, moodboard: { ...anna.moodboard!, palette: anna.moodboard!.palette.map((p, i) => (i === 1 ? { ...p, hex: "#7A2E4A" } : p)) } };
    expect(wallKey(moved, buildModel(moved), "A")).not.toBe(k);
    expect(wallKey(anna, m, "C")).not.toBe(k);
  });
});
