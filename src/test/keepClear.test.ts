import { describe, expect, it } from "vitest";
import { EMPTY, type JourneyState } from "@/journey/state";
import { keepClear, outlineFor } from "@/journey/wallOutline";
import { buildModel } from "@/journey/showroom3d/model";

describe("keeping doors clear", () => {
  const door = { x: 200, w: 90, from: 0 };
  it("slides a piece out of a doorway, the shorter way", () => {
    const s = keepClear(500, [{ id: "tv", x: 230, w: 150, h: 55, against: true }], [door]);
    expect(230 + s.tv).toBeGreaterThanOrEqual(300);
  });
  it("keeps pieces against the wall from overlapping, and both clear of the door", () => {
    const s = keepClear(500, [{ id: "console", x: 110, w: 100, h: 85, against: true }, { id: "tv", x: 150, w: 150, h: 55, against: true }], [door]);
    const c = [110 + s.console, 210 + s.console], t = [150 + s.tv, 300 + s.tv];
    for (const [a, b] of [c, t]) expect(b <= 190 || a >= 300).toBe(true);
    expect(c[1] <= t[0] || t[1] <= c[0]).toBe(true);
  });
  it("lets a low piece stay under a window but not a tall one", () => {
    const win = { x: 100, w: 140, from: 90 };
    const s = keepClear(500, [{ id: "bench", x: 120, w: 100, h: 45, against: true }, { id: "shelf", x: 300, w: 80, h: 200, against: true }], [win]);
    expect(s.bench).toBe(0);
    const s2 = keepClear(500, [{ id: "shelf", x: 120, w: 80, h: 200, against: true }], [win]);
    expect(120 + s2.shelf >= 250 || 200 + s2.shelf <= 90).toBe(true);
  });
});

describe("a wall with a door", () => {
  const s = {
    ...EMPTY,
    room: { ...EMPTY.room, widthM: 4.7, lengthM: 3.8, ceilingM: 2.6 },
    placements: [{ id: "d1", kind: "doors", n: 1, wall: "C", pos: 45 }],
    layouts: [{ id: "L", name: "L", zones: [], notes: [], items: [
      { label: "Console", kind: "console", x: 30, y: 91, w: 22, h: 8 },
      { label: "Tv unit", kind: "tv unit", x: 38, y: 92, w: 32, h: 7 },
    ] }],
    chosenLayout: 0,
  } as unknown as JourneyState;
  it("draws nothing in front of the door in the outline", () => {
    const o = outlineFor(s, "C", { items: [] } as never);
    const d = o.openings.find((x) => x.kind === "door")!;
    for (const p of o.pieces) expect(p.x + p.w <= d.x || p.x >= d.x + d.w).toBe(true);
  });
  it("moves the pieces in the 3D room too", () => {
    const m = buildModel(s), len = 470;
    const d = m.openings.find((o) => o.kind === "door")!, dc = len - d.at * 100;
    for (const p of m.pieces.filter((x) => x.wall === "C")) expect(p.toCm <= dc - 45 || p.fromCm >= dc + 45).toBe(true);
  });
});
