import { describe, it, expect } from "vitest";
import { getExtractedColors, hasExtractedColors, metadataObject, splitTypeTags } from "@/lib/productColors";

describe("productColors helpers", () => {
  it("metadataObject returns {} for null, arrays and primitives", () => {
    expect(metadataObject(null)).toEqual({});
    expect(metadataObject(undefined)).toEqual({});
    expect(metadataObject([1, 2])).toEqual({});
    expect(metadataObject("x")).toEqual({});
    expect(metadataObject({ a: 1 })).toEqual({ a: 1 });
  });

  it("getExtractedColors reads well-formed colours", () => {
    const meta = { extracted_colors: [{ name: "Sage", hex: "#9caf88", percentage: 40 }] };
    expect(getExtractedColors(meta)).toEqual([{ name: "Sage", hex: "#9caf88", percentage: 40 }]);
  });

  it("getExtractedColors fills defaults and skips malformed entries", () => {
    const meta = { extracted_colors: [{ name: "Oak" }, { hex: "#000" }, null, "red", { name: "" }] };
    expect(getExtractedColors(meta)).toEqual([{ name: "Oak", hex: "#888888", percentage: 0 }]);
  });

  it("getExtractedColors returns [] when missing or not an array", () => {
    expect(getExtractedColors(null)).toEqual([]);
    expect(getExtractedColors({ extracted_colors: "red" })).toEqual([]);
  });

  it("hasExtractedColors distinguishes 'never extracted' from 'extracted'", () => {
    expect(hasExtractedColors({})).toBe(false);
    expect(hasExtractedColors({ extracted_colors: [] })).toBe(true);
  });

  it("splitTypeTags trims and drops empty tags", () => {
    expect(splitTypeTags("sofa, chair ,, ")).toEqual(["sofa", "chair"]);
    expect(splitTypeTags(null)).toEqual([]);
  });
});
