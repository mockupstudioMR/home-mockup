import { describe, it, expect } from "vitest";
import { mergeSize, parseArea, parseLength, parsePair, readWritten } from "../../supabase/functions/_shared/dimensions";

describe("reading printed lengths", () => {
  it("reads metres, centimetres and millimetres, with or without units", () => {
    expect(parseLength("3,75")).toBe(3.75);
    expect(parseLength("3.75 m")).toBe(3.75);
    expect(parseLength("375")).toBe(3.75);
    expect(parseLength("375 cm")).toBe(3.75);
    expect(parseLength("4900")).toBe(4.9);
    expect(parseLength("4 900 mm")).toBe(4.9);
    expect(parseLength("3⁷⁵")).toBe(3.75);
    expect(parseLength("12'3\"")).toBe(3.73);
    expect(parseLength("12 ft")).toBe(3.66);
    expect(parseLength(4.2)).toBe(4.2);
    expect(parseLength("3.75m")).toBe(3.75);
    expect(parseLength("420cm")).toBe(4.2);
  });
  it("uses the plan's stated unit when the label has none", () => {
    expect(parseLength("20", "cm")).toBeUndefined(); // 20 cm can't be a room side
    expect(parseLength("420", "cm")).toBe(4.2);
    expect(parseLength("4,20", "m")).toBe(4.2);
  });
  it("rejects what can't be a room side", () => {
    expect(parseLength("")).toBeUndefined();
    expect(parseLength("0,2")).toBeUndefined();
    expect(parseLength("D1")).toBeUndefined();
    expect(parseLength("WC 2")).toBeUndefined();
    expect(parseLength(null)).toBeUndefined();
  });
  it("reads pairs and areas", () => {
    expect(parsePair("3,75 x 4,90")).toEqual([3.75, 4.9]);
    expect(parsePair("375/490")).toEqual([3.75, 4.9]);
    expect(parsePair("3.75 × 4.90 m")).toEqual([3.75, 4.9]);
    expect(parseArea("18,4 m²")).toBe(18.4);
    expect(parseArea("198 sq ft")).toBe(18.39);
  });
  it("collects what was copied from the plan", () => {
    expect(readWritten({ width_text: "", length_text: "4,90", pair_text: null, area_text: "18,4 m²" })).toEqual({ length: 4.9, area: 18.4 });
    expect(readWritten({ pair_text: "375 x 490" })).toEqual({ width: 3.75, length: 4.9 });
  });
});

describe("printed numbers beat estimates", () => {
  const est = { width: 3.2, length: 4.0 }; // door-scale guess, proportions 0.8

  it("uses both printed sides over the estimate", () => {
    expect(mergeSize({ width: 3.75, length: 4.9 }, est)).toMatchObject({ width: 3.75, length: 4.9, source: { width: "written", length: "written" } });
  });
  it("turns a pair printed the other way round", () => {
    expect(mergeSize({ width: 4.9, length: 3.75 }, est)).toMatchObject({ width: 3.75, length: 4.9 });
  });
  it("estimates only the side that isn't printed, from the proportions", () => {
    expect(mergeSize({ width: 3.75 }, est)).toEqual({ width: 3.75, length: 4.69, source: { width: "written", length: "estimated" } });
    expect(mergeSize({ length: 5 }, est)).toEqual({ width: 4, length: 5, source: { width: "estimated", length: "written" } });
  });
  it("uses a printed area for the missing side", () => {
    expect(mergeSize({ width: 4, area: 18 }, est)).toMatchObject({ width: 4, length: 4.5, source: { length: "from area" } });
  });
  it("scales the estimate to a printed area when no side is printed", () => {
    expect(mergeSize({ area: 20 }, est)).toMatchObject({ width: 4, length: 5, source: { width: "from area" } });
  });
  it("keeps the estimate when nothing is printed", () => {
    expect(mergeSize({}, est)).toMatchObject({ width: 3.2, length: 4, source: { width: "estimated", length: "estimated" } });
  });
});
