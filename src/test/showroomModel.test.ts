import { describe, expect, it } from "vitest";
import { EMPTY, type JourneyState } from "@/journey/state";
import { categoryOf, LIBRARY, matchShape, wordsNear } from "@/journey/showroom3d/library";
import { buildModel, paletteRoles } from "@/journey/showroom3d/model";
import { buildRecord, sameRecord, wallOrder } from "@/journey/showroom3d/record";

/** A person with a jewel-tone moodboard, a 3.75 × 4.90 m room, a door on wall D and a window on wall C. */
const anna: JourneyState = {
  ...EMPTY,
  moodboard: {
    name: "Eclectic Modern", feels: [],
    palette: [
      { name: "Grey plaster", hex: "#B9B3AA", use: "Walls" },
      { name: "Plum", hex: "#5E2B4F", use: "Sofa, curtains" },
      { name: "Dark walnut", hex: "#4A3226", use: "Shelving, floor" },
      { name: "Emerald", hex: "#1F5C4A", use: "Arch, accent chair" },
      { name: "Brushed brass", hex: "#B08D57", use: "Lighting, panels" },
    ],
  },
  preview: { versions: [], current: 0, read: [{ key: "furniture", text: "A plum curved velvet sofa with a green leather wingback chair, and an emerald arched doorway", keywords: ["curved", "velvet"], x: 50, y: 50 }] },
  room: { wallPhotos: [], widthM: 3.75, lengthM: 4.9, ceilingM: 2.7 },
  placements: [
    { id: "d1", kind: "doors", n: 1, wall: "D", pos: 23 },
    { id: "w1", kind: "windows", n: 1, wall: "C", pos: 47 },
    { id: "r1", kind: "radiators", n: 1, wall: "C", pos: 47 },
  ],
  layouts: [{
    id: "L1", name: "Relax + piano", zones: [], notes: [],
    items: [
      { label: "Sofa", kind: "sofa", x: 29, y: 1, w: 64, h: 19, facing: "down" },
      { label: "Coffee table", kind: "table", x: 45, y: 39, w: 29, h: 13 },
      { label: "Armchair", kind: "chair", x: 3, y: 80, w: 20, h: 17, facing: "up" },
      { label: "Bookshelf", kind: "storage", x: 3, y: 1, w: 21, h: 7, facing: "down" },
      { label: "Rug", kind: "rug", x: 28, y: 19, w: 64, h: 35 },
      { label: "Upright piano", kind: "keep", x: 82, y: 35, w: 16, h: 31, facing: "left" },
    ],
  }],
  chosenLayout: 0,
  keeping: [{ id: "k1", name: "Upright piano", photos: [], measured: true, w: 150, d: 60, h: 125, wall: "B", pos: 50, fixedSpot: true }],
  walls: { C: { role: "Window", status: "review", items: [{ n: 1, group: "furniture", name: "Curtains", note: "", action: "Buy", x: 50, y: 20 }] } },
};

/** Someone else entirely: pale palette with the app's default uses, a different room, a bed. */
const omar: JourneyState = {
  ...EMPTY,
  moodboard: { name: "Calm Minimal", feels: [], palette: [
    { name: "Oatmeal", hex: "#D8CFC0", use: "Seating, curtains" }, { name: "Clay", hex: "#B88A6A", use: "Accents" },
    { name: "Pale oak", hex: "#CDAE86", use: "Wood, floor" }, { name: "Black steel", hex: "#2B2825", use: "Metal, lighting" }, { name: "Warm white", hex: "#EDEAE4", use: "Walls" },
  ] },
  room: { wallPhotos: [], widthM: 4.2, lengthM: 3.6, ceilingM: 2.5 },
  layouts: [{ id: "L9", name: "Sleep", zones: [], notes: [], items: [{ label: "Bed", kind: "bed", x: 30, y: 0, w: 40, h: 58 }, { label: "Bedside table", kind: "table", x: 18, y: 2, w: 11, h: 12 }] }],
  chosenLayout: 0,
};

describe("the showroom is built from each person's own answers", () => {
  it("takes its colours from the moodboard's Colors, by what each colour is used for", () => {
    const m = buildModel(anna);
    expect(m.surfaces.wall).toBe("#B9B3AA");
    expect(m.surfaces.floor).toBe("#4A3226");
    expect(m.surfaces.metal).toBe("#B08D57");
    const sofa = m.pieces.find((p) => p.category === "sofa")!;
    expect(sofa.color).toBe("#5E2B4F");
    expect(sofa.colorFrom).toBe("Moodboard colour Plum");
    expect(m.pieces.find((p) => p.category === "chair")!.color).toBe("#1F5C4A");
    expect(m.pieces.find((p) => p.category === "shelf")!.color).toBe("#4A3226");
    expect(m.extras.find((e) => e.kind === "curtains")!.color).toBe("#5E2B4F");
    expect(m.surfaceList.find((x) => x.id === "doors")!.color).toBe("#1F5C4A");
  });

  it("matches each piece's shape and material from what was read about it", () => {
    const m = buildModel(anna);
    const sofa = m.pieces.find((p) => p.category === "sofa")!;
    expect([sofa.shape, sofa.fabric, sofa.matched]).toEqual(["curved", "velvet", true]);
    const chair = m.pieces.find((p) => p.category === "chair")!;
    expect([chair.shape, chair.fabric]).toEqual(["wing", "leather"]);
    expect(m.openings.find((o) => o.kind === "door")!.arched).toBe(true);
  });

  it("places every piece where the layout puts it, at its real size", () => {
    const m = buildModel(anna);
    const sofa = m.pieces.find((p) => p.category === "sofa")!;
    expect(sofa.wall).toBe("A");
    expect(sofa.w).toBeCloseTo(0.64 * 3.75, 2);
    expect(sofa.cx).toBeCloseTo(0.61 * 3.75, 2);
    expect([sofa.fromCm, sofa.toCm]).toEqual([109, 349]);
    const piano = m.pieces.find((p) => p.category === "piano")!;
    expect([piano.kept, piano.wall, piano.rot]).toEqual([true, "B", -Math.PI / 2]);
    expect(piano.w).toBeCloseTo(0.31 * 4.9, 2); // turned: its width runs along wall B
    expect(m.pieces.filter((p) => p.category === "piano")).toHaveLength(1); // the kept piano isn't drawn twice
    const door = m.openings.find((o) => o.kind === "door")!;
    expect([door.wall, Math.round(door.at * 100)]).toEqual(["D", 113]);
  });

  it("contains only the person's own pieces", () => {
    const m = buildModel(anna);
    expect(m.pieces.map((p) => p.category).sort()).toEqual(["chair", "piano", "rug", "shelf", "sofa", "table"]);
    expect(m.extras.map((e) => e.kind)).toEqual(["curtains"]);
    expect(buildModel(omar).extras).toEqual([]);
  });

  it("gives a different person a different room", () => {
    const m = buildModel(omar);
    expect([m.room.w, m.room.l, m.room.h]).toEqual([4.2, 3.6, 2.5]);
    expect(m.surfaces.wall).toBe("#EDEAE4");
    expect(m.surfaces.floor).toBe("#CDAE86");
    expect(m.pieces.map((p) => p.category)).toEqual(["bed", "side"]);
    expect(m.pieces[0].color).toBe("#D8CFC0");
    expect(m.openings).toEqual([]);
  });

  it("stays neutral, and says so, when there is no moodboard yet", () => {
    const m = buildModel({ ...EMPTY, layouts: omar.layouts, chosenLayout: 0 });
    expect(m.noPalette).toBe(true);
    expect(m.room.example).toBe(true);
    expect(m.pieces[0].colorFrom).toMatch(/Neutral/);
  });

  it("applies the person's own colour and shape on top", () => {
    const m = buildModel(anna, { "lay-0": { color: "#3366aa", shape: "tuxedo" }, walls: { color: "#FFFFFF" } });
    const sofa = m.pieces.find((p) => p.id === "lay-0")!;
    expect([sofa.color, sofa.colorFrom, sofa.shape, sofa.edited]).toEqual(["#3366AA", "Your own colour", "tuxedo", true]);
    expect(m.surfaces.wall).toBe("#FFFFFF");
    // a shape from another category is ignored
    expect(buildModel(anna, { "lay-0": { shape: "wing" } }).pieces[0].shape).toBe("curved");
  });

  it("fills role gaps from lightness when colours carry no use", () => {
    const r = paletteRoles([{ name: "a", hex: "#F2EEE6" }, { name: "b", hex: "#7A2E4A" }, { name: "c", hex: "#2E2019" }]);
    expect([r.wall?.hex, r.seating?.hex, r.floor?.hex]).toEqual(["#F2EEE6", "#7A2E4A", "#2E2019"]);
  });
});

describe("the saved style record", () => {
  it("keeps exact colours, each element's shape and place, and each wall's order", () => {
    const m = buildModel(anna), rec = buildRecord(m, {}, "L1", new Date("2026-11-17T22:00:00Z"));
    expect(rec.palette.map((p) => p.hex)).toEqual(["#B9B3AA", "#5E2B4F", "#4A3226", "#1F5C4A", "#B08D57"]);
    expect(rec.palette[0].role).toBe("Walls");
    const sofa = rec.elements.find((e) => e.category === "sofa")!;
    expect(sofa).toMatchObject({ color: "#5E2B4F", shape: "curved", material: "velvet", wall: "A", fromCm: 109, toCm: 349, widthCm: 240, shapeMatched: true });
    expect(rec.walls.A.order.map((id) => m.pieces.find((p) => p.id === id)!.category)).toEqual(["shelf", "sofa"]);
    expect(rec.walls.A.lengthCm).toBe(375);
    expect(rec.room).toEqual({ widthCm: 375, lengthCm: 490, heightCm: 270, example: false });
    expect(wallOrder(m).B.map((p) => p.category)).toEqual(["piano"]);
  });
  it("is the same until something changes", () => {
    const a = buildRecord(buildModel(anna), {}, "L1", new Date(1)), b = buildRecord(buildModel(anna), {}, "L1", new Date(2));
    expect(sameRecord(a, b)).toBe(true);
    const edits = { "lay-0": { color: "#000000" } };
    expect(sameRecord(a, buildRecord(buildModel(anna, edits), edits, "L1"))).toBe(false);
  });
});

describe("the shape library", () => {
  it("reads only the words about the piece in question", () => {
    const t = "A plum curved velvet sofa with a green leather wingback chair";
    expect(wordsNear(t, "sofa")).toContain("curved velvet sofa");
    expect(wordsNear(t, "sofa")).not.toContain("wingback");
    expect(matchShape("chair", wordsNear(t, "chair")).shape.id).toBe("wing");
    expect(matchShape("sofa", "channel-back curved sofa").shape.id).toBe("channel");
    expect(matchShape("sofa", "")).toEqual({ shape: LIBRARY.sofa[0], matched: false });
  });
  it("tells what a layout piece is from its kind and label", () => {
    expect(categoryOf("table", "Coffee table", 1.1, 0.6)).toBe("table");
    expect(categoryOf("table", "Table", 0.5, 0.5)).toBe("side");
    expect(categoryOf("table", "Dining table", 1.8, 0.9)).toBe("dining");
    expect(categoryOf("chair", "Dining chair")).toBe("dchair");
    expect(categoryOf("storage", "TV unit")).toBe("media");
    expect(categoryOf("keep", "Upright piano")).toBe("piano");
    expect(categoryOf("other", "Thing")).toBe("other");
  });
  it("has a default and unique ids in every category", () => {
    for (const [cat, shapes] of Object.entries(LIBRARY)) {
      expect(shapes.length, cat).toBeGreaterThan(0);
      expect(new Set(shapes.map((s) => s.id)).size, cat).toBe(shapes.length);
    }
  });
});
