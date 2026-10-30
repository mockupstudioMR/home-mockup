import { describe, expect, it } from "vitest";
import { paletteFromPayload } from "@/lib/paletteFromPayload";

describe("paletteFromPayload", () => {
  it("reads hex strings and { hex } objects from color_palette", () => {
    expect(paletteFromPayload({ color_palette: ["#A1B2C3", { hex: "d4e5f6" }] })).toEqual(["#A1B2C3", "#d4e5f6"]);
  });

  it("falls back to colors, then moodboard.colors", () => {
    expect(paletteFromPayload({ colors: ["#111111"] })).toEqual(["#111111"]);
    expect(paletteFromPayload({ moodboard: { colors: ["#222222"] } })).toEqual(["#222222"]);
  });

  it("splits a comma or semicolon separated string and trims", () => {
    expect(paletteFromPayload({ colors: " #aaaaaa, bbbbbb ;#cccccc" })).toEqual(["#aaaaaa", "#bbbbbb", "#cccccc"]);
  });

  it("drops invalid entries and caps at six", () => {
    const colors = ["red", "#123", null, 42, { hex: 7 }, ...Array.from({ length: 8 }, (_, i) => `#00000${i}`)];
    expect(paletteFromPayload({ colors })).toEqual(["#000000", "#000001", "#000002", "#000003", "#000004", "#000005"]);
  });

  it("returns an empty list for missing or odd payloads", () => {
    expect(paletteFromPayload(undefined)).toEqual([]);
    expect(paletteFromPayload(null)).toEqual([]);
    expect(paletteFromPayload({ colors: 5 })).toEqual([]);
  });
});
