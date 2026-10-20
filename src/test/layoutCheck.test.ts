import { describe, expect, it } from "vitest";
import { cmRect, gapCm, hasRoute, layoutChecks, openingZone, pieceInfo } from "@/journey/plan/layoutCheck";
import type { JourneyState, LayoutItem, Placement } from "@/journey/state";

const W = 3.75, L = 4.9;
const door: Placement = { id: "d", kind: "doors", n: 1, wall: "D", pos: 15 };
const win: Placement = { id: "w", kind: "windows", n: 1, wall: "C", pos: 50 };
const state = (extra: Partial<JourneyState> = {}) => ({ placements: [door, win], keeping: [], ...extra }) as unknown as JourneyState;

describe("layout checks", () => {
  it("measures pieces in cm", () => {
    const r = cmRect({ x: 10, y: 10, w: 50, h: 20 }, W, L);
    expect(Math.round(r.w)).toBe(188);
    expect(Math.round(r.h)).toBe(98);
  });

  it("finds the gap between a sofa and a table", () => {
    expect(gapCm({ x: 0, y: 0, w: 200, h: 90 }, { x: 50, y: 135, w: 100, h: 50 })).toBe(45);
  });

  it("places a door zone on its wall", () => {
    const z = openingZone(door, W * 100, L * 100, 85, 85)!;
    expect(z.x).toBe(0);
    expect(Math.round(z.y + z.h / 2)).toBe(Math.round(0.15 * 490));
  });

  it("sees a blocked and an open route", () => {
    const from = { x: 0, y: 30, w: 85, h: 85 }, to = { x: 130, y: 450, w: 120, h: 40 };
    expect(hasRoute([], 375, 490, from, to)).toBe(true);
    const wall = { x: 0, y: 240, w: 375, h: 30 };
    expect(hasRoute([wall], 375, 490, from, to)).toBe(false);
  });

  it("flags furniture in the door swing", () => {
    const items: LayoutItem[] = [{ label: "Bookshelf", kind: "storage", x: 0, y: 8, w: 10, h: 20 }];
    const checks = layoutChecks(state(), items, W, L);
    expect(checks[0]).toMatchObject({ ok: false, value: "Blocked" });
  });

  it("passes a sample layout and explains each piece", () => {
    const items: LayoutItem[] = [
      { label: "Curved sofa", kind: "sofa", x: 25, y: 5, w: 70, h: 17 },
      { label: "Table", kind: "table", x: 45, y: 31, w: 28, h: 12 },
      { label: "Chair", kind: "chair", x: 8, y: 74, w: 22, h: 17 },
    ];
    const checks = layoutChecks(state(), items, W, L);
    expect(checks.find((c) => c.label.startsWith("Door"))?.ok).toBe(true);
    expect(checks.find((c) => c.label.startsWith("Window"))?.ok).toBe(true);
    const info = pieceInfo(state(), items, W, L);
    expect(info[0].where).toBe("against wall A");
    expect(info[2].why).toMatch(/daylight/);
  });
});
