import { describe, it, expect } from "vitest";
import {
  errorMessage,
  moodboardLabels,
  parseDesignItems,
  parseDetectedOpenings,
  parsePrefillOpenings,
} from "@/lib/floorPlanParsing";

const ids = () => {
  let n = 0;
  return () => `id-${++n}`;
};

describe("parsePrefillOpenings", () => {
  it("maps wall indexes clockwise, defaults unknown types to doors and clamps positions", () => {
    const result = parsePrefillOpenings(
      [
        { type: "window", wall_index: 1, position_pct: 30 },
        { type: "skylight", wall_index: 5, position_pct: 140 },
        { type: "balcony", wall_index: -2 },
        null,
        { type: "door" },
      ],
      ids(),
    );
    expect(result).toEqual([
      { id: "id-1", type: "window", wall: "right", position: 30 },
      { id: "id-2", type: "door", wall: "right", position: 100 },
      { id: "id-3", type: "balcony", wall: "bottom", position: 50 },
    ]);
  });

  it("returns an empty list for non-array input", () => {
    expect(parsePrefillOpenings(undefined)).toEqual([]);
    expect(parsePrefillOpenings({ wall_index: 0 })).toEqual([]);
  });
});

describe("parseDetectedOpenings", () => {
  it("keeps openings on the four walls and rounds positions", () => {
    const result = parseDetectedOpenings(
      [
        { type: "door", wall_index: 0, position_pct: 12.6 },
        { type: "window", wall_index: 3, position_pct: 80 },
        { type: "window", wall_index: 4, position_pct: 50 },
      ],
      ids(),
    );
    expect(result).toEqual([
      { id: "id-1", type: "door", wall: "top", position: 13 },
      { id: "id-2", type: "window", wall: "left", position: 80 },
    ]);
  });
});

describe("parseDesignItems", () => {
  it("normalises the different item name fields and drops unnamed items", () => {
    expect(
      parseDesignItems([
        { item_name: "Sofa", item_type: "seating", color: "olive" },
        { name: "Rug", material: "wool" },
        { label: "Lamp", type: "lighting", style: "japandi" },
        { color: "red" },
        null,
      ]),
    ).toEqual([
      { name: "Sofa", type: "seating", color: "olive", material: undefined, style: undefined },
      { name: "Rug", type: undefined, color: undefined, material: "wool", style: undefined },
      { name: "Lamp", type: "lighting", color: undefined, material: undefined, style: "japandi" },
    ]);
    expect(parseDesignItems("not a list")).toEqual([]);
  });
});

describe("moodboardLabels", () => {
  it("extracts labels and drops entries without one", () => {
    expect(moodboardLabels([{ label: "Oak" }, { label: "" }, "Linen", null])).toEqual(["Oak"]);
  });

  it("keeps plain values when allowed", () => {
    expect(moodboardLabels([{ label: "Oak" }, "Linen", null], true)).toEqual(["Oak", "Linen"]);
  });
});

describe("errorMessage", () => {
  it("uses the error's message or the fallback", () => {
    expect(errorMessage(new Error("Boom"), "Try again")).toBe("Boom");
    expect(errorMessage({ message: "" }, "Try again")).toBe("Try again");
    expect(errorMessage("oops", "Try again")).toBe("Try again");
    expect(errorMessage(null, "Try again")).toBe("Try again");
  });
});
