import { describe, expect, it } from "vitest";
import fs from "node:fs";
import { SYMBOL_SIZE, symbolOf, symbolPlacement } from "@/journey/plan/symbols";
import { DEFAULT_SPECS, mergeSpecs } from "../../supabase/functions/_shared/layoutRules";
import { arrange } from "../../supabase/functions/_shared/arrange";
import { DEFAULT_GROUPINGS } from "../../supabase/functions/_shared/layoutRules";

describe("furniture symbols", () => {
  it("every size has a symbol, and every symbol has its file", () => {
    for (const s of DEFAULT_SPECS) {
      expect(s.symbol, s.name).toBeTruthy();
      expect(fs.existsSync(`public/furniture-symbols/${s.symbol}.svg`), s.symbol!).toBe(true);
    }
    for (const k of Object.keys(SYMBOL_SIZE)) expect(fs.existsSync(`public/furniture-symbols/${k}.svg`), k).toBe(true);
  });

  it("rows without a symbol get one from their name", () => {
    const specs = mergeSpecs([{ name: "Corner sofa", variant: "standard", width_cm: 260, depth_cm: 200 }, { name: "Grand piano", variant: "standard", width_cm: 150, depth_cm: 170 }]);
    expect(specs.find((s) => s.name === "corner sofa")?.symbol).toBe("sofa-l");
    expect(specs.find((s) => s.name === "grand piano")?.symbol).toBe("piano-grand");
  });

  it("placed pieces carry their symbol; older pieces get one from their label", () => {
    const r = arrange({ W: 480, L: 470, openings: [], groups: [{ key: "tv-lounge", wall: "A" }], specs: DEFAULT_SPECS, groupings: DEFAULT_GROUPINGS });
    expect(r.items.find((i) => i.label === "3-seat sofa")?.symbol).toBe("sofa-3");
    expect(symbolOf({ label: "Upright piano", kind: "keep" })).toBe("piano-upright");
    expect(symbolOf({ label: "Something odd", kind: "other" })).toBe("generic");
  });

  it("turns with the piece: a sofa facing left is the drawing turned a quarter", () => {
    expect(symbolPlacement("sofa-3", "down", 220, 95)).toMatchObject({ width: 220, height: 95, transform: undefined });
    expect(symbolPlacement("sofa-3", "up", 220, 95).transform).toBe("rotate(180deg)");
    const left = symbolPlacement("sofa-3", "left", 95, 220);
    expect(left).toMatchObject({ width: 220, height: 95, transform: "rotate(90deg)" });
    expect(left.left).toBe((95 - 220) / 2);
  });

  it("a symbol drawn with its front on another edge is turned so its front still points the right way", () => {
    // drawn front on the left: a quarter turn anticlockwise puts it at the bottom
    expect(symbolPlacement("sofa-3", "down", 95, 220, "left")).toMatchObject({ width: 220, height: 95, transform: "rotate(-90deg)" });
    expect(symbolPlacement("sofa-3", "left", 95, 220, "top").transform).toBe("rotate(-90deg)");
  });

  it("a table standing the other way round is turned too, a round one isn't", () => {
    expect(symbolPlacement("dining-table", undefined, 80, 140).transform).toBe("rotate(90deg)");
    expect(symbolPlacement("side-table", undefined, 45, 45).transform).toBeUndefined();
  });
});

describe("furniture set symbols", () => {
  it("every set has its symbol, built from the current sets (run qa/furniture-sets/build-set-symbols.ts after changing one)", async () => {
    const { DEFAULT_GROUPINGS, setSymbolUrl } = await import("../../supabase/functions/_shared/layoutRules");
    for (const g of DEFAULT_GROUPINGS) {
      const file = `public${setSymbolUrl(g)}`;
      expect(fs.existsSync(file), file).toBe(true);
      const svg = fs.readFileSync(file, "utf8");
      // one drawn piece per member plus the main piece, so a set changed without rebuilding is caught
      expect((svg.match(/<g[ >]/g) ?? []).length, g.key).toBeGreaterThanOrEqual(1 + g.members.filter((m) => !m.optional).length);
    }
  });
});
