import { describe, expect, it } from "vitest";
import { applyPlanRead } from "@/journey/plan/apply";
import type { PlanRead } from "@/journey/plan/reader";
import type { JourneyState } from "@/journey/state";

const read: Extract<PlanRead, { ok: true }> = {
  ok: true, width_px: 600, length_px: 400, ratio: 1.5, shape: "Rectangular", wall_px: 20, tilt_deg: 0, image: [1600, 1200],
  box: [0.2, 0.2, 0.6, 0.53], outline: [], confidence: 0.95, picked: "largest", rooms: [{ box: [0.2, 0.2, 0.6, 0.53], area: 240000 }],
  scale: { m_per_px: 0.0075, from: "door", width_m: 4.5, length_m: 3 },
  openings: [
    { type: "door", wall: "C", pos: 20, start: 15, end: 25, len_px: 113 },
    { type: "window", wall: "A", pos: 50.4, start: 35, end: 65, len_px: 180 },
    { type: "window", wall: "B", pos: 70, start: 60, end: 80, len_px: 80 },
  ],
};
const base = { room: { wallPhotos: [] }, placements: [], fixedCounts: {} } as unknown as JourneyState;

describe("applyPlanRead", () => {
  it("sets the size from the door guess and places every opening", () => {
    const out = applyPlanRead(base, read);
    expect(out.room.widthM).toBe(4.5);
    expect(out.room.lengthM).toBe(3);
    expect(out.room.confirmed).toBe(false);
    expect(out.room.planRead?.windows).toBe(2);
    expect(out.placements.map((p) => [p.kind, p.wall, p.pos])).toEqual([
      ["doors", "C", 20],
      ["windows", "A", 50],
      ["windows", "B", 70],
    ]);
    expect(out.fixedCounts).toEqual({ doors: 1, windows: 2 });
  });

  it("fills features counted earlier and keeps ones placed by hand; reading again doesn't duplicate", () => {
    const s = {
      ...base,
      placements: [
        { id: "w1", kind: "windows", n: 1, photo: "x.jpg" },
        { id: "r1", kind: "radiators", n: 1, wall: "A", pos: 50 },
      ],
      fixedCounts: { windows: 1, radiators: 1 },
    } as unknown as JourneyState;
    const once = applyPlanRead(s, read);
    const w1 = once.placements.find((p) => p.id === "w1")!;
    expect([w1.wall, w1.pos, w1.photo]).toEqual(["A", 50, "x.jpg"]);
    expect(once.placements.find((p) => p.id === "r1")?.wall).toBe("A");
    const twice = applyPlanRead({ ...s, ...once }, read);
    expect(twice.placements.length).toBe(once.placements.length);
    expect(twice.placements.find((p) => p.id === "w1")?.photo).toBe("x.jpg");
  });

  it("keeps the proportions when there is no door to guess the scale from", () => {
    const out = applyPlanRead(base, { ...read, scale: null, openings: [] }, 3);
    expect(out.room.widthM).toBe(3);
    expect(out.room.lengthM).toBe(2);
  });
});
