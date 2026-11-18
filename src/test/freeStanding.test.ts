import { describe, expect, it } from "vitest";
import { EMPTY, type JourneyState, type LayoutItem } from "@/journey/state";
import { freeStanding, keepClear, outlineFor } from "@/journey/wallOutline";
import { layoutChecks, moveOntoWalls, strayPieces } from "@/journey/plan/layoutCheck";
import { buildModel } from "@/journey/showroom3d/model";
import { wallItems } from "@/journey/wallScenes/items";

// Monica's room: sofa against the top wall, coffee table before it, a TV unit standing 2 m out from the
// bottom wall (which has the door), and a desk against the left wall.
const W = 4.7, L = 4.8;
const sofa: LayoutItem = { label: "3-seat sofa", kind: "sofa", x: 30, y: 1, w: 45, h: 19 };
const table: LayoutItem = { label: "Coffee table", kind: "table", x: 42, y: 28, w: 22, h: 10 };
const tv: LayoutItem = { label: "Tv unit", kind: "tv unit", x: 36, y: 45, w: 30, h: 8 };
const desk: LayoutItem = { label: "Desk", kind: "desk", x: 1, y: 70, w: 13, h: 25 };
const items = [sofa, table, tv, desk];
const s = {
  ...EMPTY,
  room: { ...EMPTY.room, widthM: W, lengthM: L, ceilingM: 2.6 },
  placements: [{ id: "d1", kind: "doors", n: 1, wall: "C", pos: 50 }],
  layouts: [{ id: "L", name: "L", zones: [], notes: [], items }],
  chosenLayout: 0,
  moodboard: { name: "Mid-century", feels: [], palette: [{ name: "Sage", hex: "#9BAA8F", use: "Walls" }, { name: "Walnut", hex: "#5A3A26", use: "Wood, floor" }] },
} as unknown as JourneyState;

describe("pieces standing out in the room", () => {
  it("knows the TV unit stands free, while the coffee table stands in front of the sofa", () => {
    const { free } = freeStanding(items, { w: W, l: L });
    expect(free).toEqual([false, false, true, false]);
  });
  it("leaves it off its wall's outline and lists it there instead, with its distance", () => {
    const o = (["A", "B", "C", "D"] as const).map((w) => outlineFor(s, w, { items: [] } as never)).find((x) => x.free.length)!;
    expect(o.pieces.some((p) => /tv/i.test(p.label))).toBe(false);
    expect(o.free[0]).toMatchObject({ label: "Tv unit" });
    expect(o.free[0].gapCm).toBeGreaterThan(150);
  });
  it("leaves it out of the wall pictures but swappable in the whole-room picture", () => {
    const m = buildModel(s);
    for (const w of ["A", "B", "C", "D"] as const) expect(wallItems(s, m, w).some((i) => i.id === "lay-2")).toBe(false);
    expect(wallItems(s, m, "room").some((i) => i.id === "lay-2")).toBe(true);
  });
});

describe("the plan: pieces that belong against a wall", () => {
  it("flags a TV unit standing in the room, with a fix", () => {
    expect(strayPieces(items, W, L).map((x) => x.item.label)).toEqual(["Tv unit"]);
    expect(layoutChecks(s, items, W, L)[0]).toMatchObject({ ok: false, fix: "onto-walls" });
  });
  it("moves it onto the wall facing the sofa, clear of the door's swing", () => {
    const { items: out, moved } = moveOntoWalls(s, items, W, L);
    expect(moved).toEqual(["Tv unit"]);
    const t = out[2];
    expect(t.y + t.h).toBeGreaterThan(95); // against the bottom wall, facing the sofa
    expect(t.facing).toBe("up");
    const door = { x0: 50 - 7, x1: 50 + 7 }; // ±(85+30)/2 cm of 470 cm
    expect(t.x + t.w <= door.x0 || t.x >= door.x1).toBe(true);
    expect(strayPieces(out, W, L)).toEqual([]);
  });
});

describe("doors on the wall drawings", () => {
  it("only push away pieces standing within their swing", () => {
    const door = { x: 200, w: 90, from: 0, depth: 95 };
    const near = keepClear(500, [{ id: "a", x: 210, w: 100, h: 80, against: true, gap: 0 }], [door]);
    const far = keepClear(500, [{ id: "a", x: 210, w: 100, h: 80, against: false, gap: 200 }], [door]);
    expect(near.a).not.toBe(0);
    expect(far.a).toBe(0);
  });
});

describe("seating walls show some floor", () => {
  it("takes in the floor in front of a wall with seating or a rug, and none for a bare wall", async () => {
    const { floorDepthFor } = await import("@/journey/showroom3d/scene");
    const m = buildModel(s);
    expect(floorDepthFor(m, "A")).toBeGreaterThanOrEqual(1.2);
    expect(floorDepthFor(m, "B")).toBe(0);
  });
});
