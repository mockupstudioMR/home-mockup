import { describe, it, expect } from "vitest";
import { ADDABLE, keepInside, moveBy, newPiece, resizeCm, sizeCm, turn } from "@/journey/plan/editLayout";
import { withWritten } from "@/journey/plan/apply";
import { layoutChecks } from "@/journey/plan/layoutCheck";
import { EMPTY } from "@/journey/state";

// a 4 m × 5 m room: 1% of the width is 4 cm, 1% of the length is 5 cm
const W = 4, L = 5;

describe("editing a layout", () => {
  it("adds a seat at its real size, centred", () => {
    const armchair = ADDABLE.find((a) => a.label === "Armchair")!;
    const p = newPiece(armchair.kind, armchair.label, armchair.w, armchair.d, W, L);
    expect(p).toMatchObject({ kind: "chair", label: "Armchair", w: 20, h: 16, x: 40, y: 42 });
    expect(sizeCm(p, W, L)).toEqual({ w: 80, d: 80 });
  });

  it("keeps moved pieces inside the room", () => {
    const p = { label: "Sofa", kind: "sofa", x: 10, y: 10, w: 50, h: 20 };
    expect(moveBy(p, 80, -30)).toMatchObject({ x: 50, y: 0 });
    expect(keepInside({ ...p, x: -5, y: 95 })).toMatchObject({ x: 0, y: 80 });
  });

  it("resizes in cm around the centre, with a 20 cm minimum", () => {
    const p = { label: "Table", kind: "table", x: 40, y: 40, w: 25, h: 12 }; // 100 × 60 cm
    const r = resizeCm(p, 120, 60, W, L);
    expect(sizeCm(r, W, L)).toEqual({ w: 120, d: 60 });
    expect(r.x + r.w / 2).toBeCloseTo(52.5, 1);
    expect(sizeCm(resizeCm(p, 5, 5, W, L), W, L)).toEqual({ w: 20, d: 20 });
  });

  it("turns a piece a quarter turn, swapping its real width and depth", () => {
    const p = { label: "Sofa", kind: "sofa", x: 20, y: 10, w: 52.5, h: 19 }; // 210 × 95 cm
    expect(sizeCm(turn(p, W, L), W, L)).toEqual({ w: 95, d: 210 });
  });
});

describe("sizes written on the plan", () => {
  const guess = { widthM: 3.2, lengthM: 4.0 }; // door-width guess from the drawing
  it("overrule the estimate side by side; only the missing side is estimated", () => {
    expect(withWritten(guess, { width: 3.75, length: 4.9 })).toMatchObject({ widthM: 3.75, lengthM: 4.9, confirmed: true });
    expect(withWritten(guess, { width: 3.75 })).toMatchObject({ widthM: 3.75, lengthM: 4.69, confirmed: false, sizeSource: { width: "written", length: "estimated" } });
  });
  it("leave the estimate alone when nothing is printed", () => {
    expect(withWritten(guess, {})).toMatchObject({ widthM: 3.2, lengthM: 4, confirmed: false, sizeSource: undefined });
  });
});

describe("fit checks after editing", () => {
  it("flags pieces that overlap, but not a rug under them", () => {
    const items = [
      { label: "Sofa", kind: "sofa", x: 10, y: 10, w: 50, h: 20 },
      { label: "Rug", kind: "rug", x: 0, y: 0, w: 80, h: 60 },
    ];
    expect(layoutChecks(EMPTY, items, W, L).some((c) => c.value === "Overlap")).toBe(false);
    const clash = [...items, { label: "Armchair", kind: "chair", x: 40, y: 15, w: 20, h: 16 }];
    expect(layoutChecks(EMPTY, clash, W, L).find((c) => c.value === "Overlap")).toMatchObject({ ok: false, label: "Sofa and armchair overlap" });
  });
});
