import { describe, expect, it } from "vitest";
import { backSide, facingOf, turnDir } from "@/journey/plan/facing";
import { turn } from "@/journey/plan/editLayout";

describe("which way a piece faces on the plan", () => {
  it("uses the facing a layout gives it", () => {
    expect(facingOf({ label: "Sofa", kind: "sofa", x: 10, y: 40, w: 20, h: 40, facing: "right" }, 4.8, 4.7)).toBe("right");
  });
  it("older layouts: a sofa faces away from the wall it stands on", () => {
    expect(facingOf({ label: "Sofa", kind: "sofa", x: 27, y: 0, w: 46, h: 20 }, 4.8, 4.7)).toBe("down");
    expect(facingOf({ label: "Sofa", kind: "sofa", x: 27, y: 80, w: 46, h: 20 }, 4.8, 4.7)).toBe("up");
    expect(facingOf({ label: "Sofa", kind: "sofa", x: 80, y: 30, w: 20, h: 46 }, 4.8, 4.7)).toBe("left");
  });
  it("a bed faces away from the wall its head is on", () => {
    expect(facingOf({ label: "Bed", kind: "bed", x: 30, y: 0, w: 38, h: 50 }, 4.2, 4.0)).toBe("down");
    expect(facingOf({ label: "Bed", kind: "bed", x: 0, y: 30, w: 48, h: 40 }, 4.2, 4.0)).toBe("right");
  });
  it("tables and rugs have no front", () => {
    expect(facingOf({ label: "Table", kind: "table", x: 30, y: 30, w: 20, h: 10 }, 4, 4)).toBeUndefined();
  });
  it("turning a piece turns its front and swaps its sides", () => {
    const t = turn({ label: "Sofa", kind: "sofa", x: 27, y: 0, w: 46, h: 20, facing: "down" }, 4.8, 4.7);
    expect(t.facing).toBe("left");
    expect(turnDir("left")).toBe("up");
    expect(backSide("left")).toBe("right");
  });
});
