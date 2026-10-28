import { describe, it, expect } from "vitest";
import { EMPTY, type JourneyState } from "@/journey/state";
import { KEEP_FLOOR, decorFor, partOf, surfacesFor, wallsLine } from "@/journey/finishes";
import { buyList } from "@/journey/buylist";

const base: JourneyState = {
  ...EMPTY,
  houseState: "redoing",
  moodboard: { name: "Eclectic", palette: [{ name: "Plum", hex: "#6E3550", material: "Plum velvet" }, { name: "Grey", hex: "#6B6862", material: "Grey plaster" }, { name: "Walnut", hex: "#5A3A26", material: "Dark walnut" }], feels: ["greenery"] },
};

describe("step 6 parts", () => {
  it("reads the part from the address", () => {
    expect(partOf("?part=surfaces")).toBe("surfaces");
    expect(partOf("")).toBe("accents");
    expect(partOf("?part=nonsense")).toBe("accents");
  });

  it("suggests walls and floor from the palette", () => {
    const sf = surfacesFor(base);
    expect(sf.walls).toEqual({ A: "Grey plaster", B: "Warm greige", C: "Warm greige", D: "Grey plaster" });
    expect(sf.floor).toBe("Walnut flooring");
    expect(surfacesFor({ ...base, houseState: "partial" }).floor).toBe(KEEP_FLOOR);
    expect(wallsLine(sf.walls)).toBe("Grey plaster on A, D · Warm greige on B, C");
  });

  it("puts the chosen finishes and decor on the buying list", () => {
    const s = { ...base, surfaces: { walls: { A: "Sage paint", B: "Sage paint", C: "Sage paint", D: "Terracotta plaster" } as const, floor: KEEP_FLOOR }, decor: [...decorFor(base).map((d) => ({ ...d, on: d.name !== "Curtains" })), { name: "Floor mirror", on: true }] };
    const rows = buyList(s);
    expect(rows.filter((r) => r.tab === "finishes" && r.id.startsWith("f-wall")).map((r) => `${r.name}: ${r.wall}`)).toEqual(["Sage paint: A, B, C", "Terracotta plaster: D"]);
    expect(rows.some((r) => r.id === "f-floor")).toBe(false);
    expect(rows.some((r) => r.name === "Floor mirror")).toBe(true);
    expect(rows.some((r) => r.name === "Plants + pots")).toBe(true);
    expect(rows.some((r) => r.name === "Curtains")).toBe(false);
  });
});
