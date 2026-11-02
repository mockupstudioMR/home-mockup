import { describe, expect, it } from "vitest";
import { fromReference } from "@/journey/plan/apply";

const both = { width: "written", length: "written" } as const;
const onlyW = { width: "written", length: "estimated" } as const;

describe("printed sizes overrule the scale reference", () => {
  it("a door-width reference never rescales printed sides", () => {
    const r = fromReference({ widthM: 3.75, lengthM: 4.9, doorM: 0.9, sizeSource: both }, "Door width", 0.8);
    expect(r).toMatchObject({ widthM: 3.75, lengthM: 4.9, doorM: 0.8, sizeSource: both });
  });

  it("a door-width reference rescales only the side that isn't printed", () => {
    const r = fromReference({ widthM: 3.75, lengthM: 4.5, doorM: 0.9, sizeSource: onlyW }, "Door width", 0.8);
    expect(r.widthM).toBe(3.75);
    expect(r.lengthM).toBe(4);
    expect(r.sizeSource).toEqual(onlyW);
  });

  it("typing the other wall keeps the printed one", () => {
    const r = fromReference({ widthM: 3.75, lengthM: 4.5, doorM: 0.9, sizeSource: onlyW }, "Wall B length", 5.1);
    expect(r).toMatchObject({ widthM: 3.75, lengthM: 5.1 });
    expect(r.sizeSource?.width).toBe("written");
  });

  it("typing a printed wall's own length is a correction of that wall", () => {
    const r = fromReference({ widthM: 3.75, lengthM: 4.9, doorM: 0.9, sizeSource: both }, "Wall A length", 3.8);
    expect(r).toMatchObject({ widthM: 3.8, lengthM: 4.9 });
    expect(r.sizeSource).toEqual({ width: "estimated", length: "written" });
  });

  it("without printed sizes the reference scales the room as before", () => {
    const r = fromReference({ widthM: 3, lengthM: 4, doorM: 1, sizeSource: undefined }, "Door width", 0.9);
    expect(r).toMatchObject({ widthM: 2.7, lengthM: 3.6, doorM: 0.9, sizeSource: undefined });
    expect(fromReference({ widthM: 3, lengthM: 4, doorM: 1 }, "Wall A length", 4.5)).toMatchObject({ widthM: 4.5, lengthM: 6 });
  });
});
