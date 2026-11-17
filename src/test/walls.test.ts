import { describe, expect, it } from "vitest";
import { EMPTY, type JourneyState, type WallPlan } from "@/journey/state";
import { alongWall, nearestWall, outlineFor, wallLength } from "@/journey/wallOutline";
import { composeWalls } from "@/journey/screens/Step8";
import { composeBuyList, wallRows } from "@/journey/buylist";
import { STEP_FIRST } from "@/journey/stepNav";
import { screenFor } from "@/journey/routes";

// The sample living room: 3.75 × 4.90 m, sofa on A, piano kept on B, window on C, door on D.
const room: JourneyState = {
  ...EMPTY,
  houseState: "core-shell",
  room: { wallPhotos: [], widthM: 3.75, lengthM: 4.9 },
  keeping: [{ id: "k1", name: "Upright piano", photos: [], measured: true, w: 150, d: 60, h: 125, wall: "B", pos: 50, fixedSpot: true }],
  placements: [
    { id: "w1", kind: "windows", n: 1, wall: "C", pos: 50 },
    { id: "d1", kind: "doors", n: 1, wall: "D", pos: 15 },
  ],
  layouts: [{
    id: "l1", name: "Relax + piano", zones: [], notes: [],
    items: [
      { label: "Curved sofa", kind: "sofa", x: 14.1, y: 4.8, w: 70.4, h: 17 },
      { label: "Chair", kind: "chair", x: 7.7, y: 74.5, w: 22.5, h: 17 },
      { label: "Piano", kind: "keep", x: 83.8, y: 63.8, w: 16.2, h: 31.4 },
    ],
  }],
  chosenLayout: 0,
};

describe("wall outlines", () => {
  it("measures walls from the room size: A and C the width, B and D the length", () => {
    expect([wallLength(room, "A"), wallLength(room, "B"), wallLength(room, "C"), wallLength(room, "D")]).toEqual([375, 490, 375, 490]);
  });

  it("reads positions as seen from inside the room (C and D are mirrored)", () => {
    const box = { x: 10, y: 20, w: 30, h: 10 };
    expect(alongWall("A", box)).toEqual([10, 40]);
    expect(alongWall("C", box)).toEqual([60, 90]);
    expect(alongWall("B", box)).toEqual([20, 30]);
    expect(alongWall("D", box)).toEqual([70, 80]);
    expect(nearestWall({ x: 14.1, y: 4.8, w: 70.4, h: 17 })).toBe("A");
  });

  it("draws the layout's pieces, the kept piano and the door on the right walls", () => {
    const walls = composeWalls(room);
    const a = outlineFor(room, "A", walls.A);
    const b = outlineFor(room, "B", walls.B);
    const d = outlineFor(room, "D", walls.D);
    expect(a.pieces.map((p) => p.kind)).toEqual(["sofa"]);
    expect(Math.round(a.pieces[0].w)).toBe(264); // 70.4 % of 3.75 m
    expect(b.pieces).toHaveLength(1);
    expect(b.pieces[0]).toMatchObject({ kept: true, ref: "keep-k1" });
    // The door is near the top of the plan, which is on the right when you face wall D.
    expect(d.openings[0].kind).toBe("door");
    expect(d.openings[0].x).toBeGreaterThan(d.length / 2);
  });

  it("numbers everything on a wall in one list, left to right", () => {
    const walls = composeWalls(room);
    const o = outlineFor(room, "D", walls.D);
    const xs = o.order.map((n) => o.pins[n].x);
    expect(xs).toEqual([...xs].sort((p, q) => p - q));
    expect(new Set(o.order).size).toBe(o.order.length);
    // Every listed item has a pin inside the wall.
    for (const n of o.order) {
      expect(o.pins[n].x).toBeGreaterThanOrEqual(0);
      expect(o.pins[n].x).toBeLessThanOrEqual(o.length);
    }
  });
});

describe("buying list from the walls", () => {
  it("lists what was picked on each wall, and only once", () => {
    const walls = composeWalls(room);
    const sofa = walls.A.items.find((i) => i.ref === "lay-0")!;
    const withChoice: Record<string, WallPlan> = {
      ...walls,
      A: { ...walls.A, items: walls.A.items.map((i) => (i === sofa ? { ...i, choice: { name: "Curved velvet sofa", image: "/s.jpg" } } : i)) },
    };
    const s = { ...room, wallFlow: true, walls: withChoice };
    const rows = wallRows(s);
    expect(rows.find((r) => r.name === "Curved velvet sofa")).toMatchObject({ wall: "A", action: "Buy", status: "Chosen", image: "/s.jpg" });
    expect(rows.find((r) => /piano/i.test(r.name))).toMatchObject({ wall: "B", action: "Keep" });
    // Points and things inside the wall are not furniture rows.
    expect(rows.some((r) => /socket|router|vent/i.test(r.name))).toBe(false);
    const list = composeBuyList(s);
    expect(list.filter((r) => /piano/i.test(r.name))).toHaveLength(1);
    expect(list.some((r) => r.id === "e-sockets")).toBe(true);
  });
});

describe("step 5 routes", () => {
  it("opens the walls from the progress bar for steps 5 to 8", () => {
    expect([5, 6, 7, 8].map((n) => STEP_FIRST[n])).toEqual(["S5-Walls", "S5-Walls", "S5-Walls", "S5-Walls"]);
    expect(screenFor("5/walls")).toEqual({ id: "S5-Walls" });
    expect(screenFor("5/wall/c")).toEqual({ id: "S5-Wall", param: "C" });
  });
});
