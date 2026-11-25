import { describe, expect, it } from "vitest";
import { EMPTY, type JourneyState } from "@/journey/state";
import { buildModel } from "@/journey/showroom3d/model";
import { altMask, centreOf, composite, cutAlt, cutLayer, keepOff, limitAlpha, driftOutside, itemMask, matchTone, pxBox, type Rgba } from "@/journey/wallScenes/layers";
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

describe("keeping alternatives true to the photo", () => {
  const area = () => pxBox(box, W, H, 0.28);
  it("brings an alternative's shifted tones back, so the piece doesn't sit in a lighter rectangle", () => {
    const lighter = picture((x, y) => (inSofa(x, y) ? [31, 92, 74] : [210, 204, 195]));
    const fixed = matchTone(base, lighter, area());
    const i = (5 * W + 5) * 4;
    expect(Math.abs(fixed.data[i] - 185)).toBeLessThan(3);
    const cut = altMask(base, fixed, box);
    expect(cut.usable).toBe(true);
    expect(cut.alpha[(10 * W + 10)]).toBe(0);
    expect(cut.alpha[(52 * W + 60)]).toBeGreaterThan(0.9);
  });
  it("won't show a new piece that runs past its area (an incomplete sofa)", () => {
    const longer = picture((x, y) => (x >= 4 && x < 80 && y >= 40 && y < 65 ? [31, 92, 74] : [185, 179, 170]));
    const cut = altMask(base, longer, box);
    expect(cut.clipped).toBe(true);
    expect(cut.usable).toBe(false);
  });
  it("keeps the original wall's texture above a new piece, with only its shadow", () => {
    // the alternative darkens and blurs the wall just above the sofa (y 30–40)
    const textured = picture((x, y) => (inSofa(x, y) ? [94, 43, 79] : (x + y) % 2 ? [190, 184, 175] : [170, 164, 155]));
    const alt = picture((x, y) => (inSofa(x, y) ? [31, 92, 74] : y >= 30 && y < 40 && x >= 36 && x < 84 ? [144, 139, 132] : (x + y) % 2 ? [190, 184, 175] : [170, 164, 155]));
    const cut = altMask(textured, alt, box);
    const layer = cutAlt(textured, alt, cut.alpha, pxBox(box, W, H, 0.03), 1);
    const i = (52 * W + 60) * 4;
    expect(layer.data[i]).toBe(31); // the new piece itself
    const a = (33 * W + 60) * 4, b = (33 * W + 61) * 4; // the wall above it, laid over the photo: still textured, and darker
    expect(layer.data[a + 3]).toBeGreaterThan(0);
    const seen = composite(textured, layer);
    expect(Math.abs(seen.data[a] - seen.data[b])).toBeGreaterThan(8);
    expect(Math.max(seen.data[a], seen.data[b])).toBeLessThan(190);
    // over another wall colour, the shadow darkens that colour instead of bringing the old one back
    const rust = picture(() => [160, 80, 50]);
    expect(composite(rust, layer).data[a + 1]).toBeLessThan(85);
  });
  it("takes in the whole old piece where the photo drew it bigger than the guide (a taller sofa back)", () => {
    // the photo's sofa has a back reaching well above where the guide drew it (y 26–40, above the box)
    const tall = picture((x, y) => (x >= 40 && x < 80 && y >= 26 && y < 65 ? [30, 80, 60] : [185, 179, 170]));
    const low = picture((x, y) => (inSofa(x, y) ? [200, 120, 60] : [185, 179, 170]));
    const cut = altMask(tall, low, box);
    expect(cut.usable).toBe(true);
    expect(cut.alpha[30 * W + 60]).toBeGreaterThan(0.9); // the old back, far above the guide's box, is covered
    expect(cut.alpha[10 * W + 10]).toBe(0);
  });
  it("leaves no old shadow behind a smaller new piece", () => {
    // the original sofa casts a soft shadow on the wall above it (y 34–40, 18 levels darker); the new, lower
    // sofa casts none there
    const shadowed = picture((x, y) => (inSofa(x, y) ? [94, 43, 79] : y >= 34 && y < 40 && x >= 40 && x < 80 ? [167, 161, 152] : [185, 179, 170]));
    const lower = picture((x, y) => (x >= 40 && x < 80 && y >= 46 && y < 65 ? [31, 92, 74] : [185, 179, 170]));
    const cut = altMask(shadowed, lower, box);
    const seen = composite(shadowed, cutAlt(shadowed, lower, cut.alpha, pxBox(box, W, H, 0.03)));
    const i = (37 * W + 60) * 4;
    expect(seen.data[i]).toBeGreaterThan(180); // the wall where the old shadow was is lit again
  });
  it("won't show a re-lit rectangle instead of a piece", () => {
    const a = area();
    const patched = picture((x, y) => (x >= a.x0 && x < a.x1 && y >= a.y0 && y < a.y1 ? [140, 140, 140] : [185, 179, 170]));
    expect(altMask(base, patched, box).usable).toBe(false);
  });
});

describe("swapping one piece never repaints another", () => {
  it("keeps a layer off the pixels of the other pieces, but not off their edges", () => {
    // item map: the sofa (1) at x 40–80, y 40–65; everything else is wall (0)
    const ids = new Uint16Array(W * H);
    for (let y = 40; y < 65; y++) for (let x = 40; x < 80; x++) ids[y * W + x] = 1;
    const all = new Float32Array(W * H).fill(1);
    const allow = keepOff(ids, W, H, new Set([1]), { x0: 0, y0: 0, x1: W, y1: H }, 3);
    const a = limitAlpha(all, allow);
    expect(a[52 * W + 60]).toBe(0); // inside the sofa: untouched
    expect(a[20 * W + 20]).toBe(1); // the wall: painted
    expect(a[52 * W + 41]).toBeGreaterThan(0); // the sofa's very edge: allowed, so a small shift doesn't leave a seam
  });
});

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
    expect(items.map((i) => i.id)).toEqual(["walls", "floor", "lay-0", "lay-1", "decor-A"]);
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
  it("offers a painting or shelves above the main piece of a wall with nothing hung on it", () => {
    const decor = wallItems(anna, buildModel(anna), "A").find((i) => i.id === "decor-A")!;
    expect(decor.mainName).toBe("Bare wall");
    expect(decor.alts.map((a) => a.name)).toEqual(["Large painting", "Floating shelves"]);
  });
  it("makes the window's frames swappable", () => {
    const win = wallItems(anna, buildModel(anna), "C").find((i) => i.id.startsWith("window-"))!;
    expect(win.alts.length).toBe(2);
  });
  it("keeps a kept piece clickable but never offers alternatives, and adds the door on its wall", () => {
    const piano = wallItems(anna, buildModel(anna), "B").find((i) => /piano/i.test(i.title))!;
    expect(piano.alts).toEqual([]);
    expect(piano.note).toMatch(/kept/);
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
