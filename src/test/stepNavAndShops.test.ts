import { describe, it, expect } from "vitest";
import { STEP_FIRST, stepState } from "@/journey/stepNav";
import { rankPieces } from "@/journey/shopPieces";
import { DEFAULT_SHOP_CHOICE, type ShopChoice, type ShopPreferences } from "@/lib/projectStore";

describe("step bar", () => {
  it("starts each step on its first screen", () => {
    expect(STEP_FIRST[1]).toBe("S1-Why");
    expect(STEP_FIRST[4]).toBe("S4-Input");
    expect(STEP_FIRST[10]).toBe("S10-Final");
  });

  it("shows finished steps as done wherever you are, and the next unfinished one after this step", () => {
    const done = [1, 2, 3, 4, 5];
    // went back to step 2: later finished steps stay done
    expect([1, 2, 3, 4, 5, 6, 7].map((n) => stepState(done, n, 2))).toEqual(["done", "now", "done", "done", "done", "next", "todo"]);
    // jumped ahead to step 8 without finishing 6 and 7
    expect([5, 6, 7, 8, 9].map((n) => stepState(done, n, 8))).toEqual(["done", "todo", "todo", "now", "next"]);
  });
});

describe("shop pieces", () => {
  const row = (id: string, name: string, extra: Record<string, unknown> = {}) => ({ id, name, type: "sofa", description: null, price: 900, currency: "€", image_urls: [`${id}.jpg`], source_url: `https://shop/${id}`, ...extra });
  const prefs = (choice: Partial<ShopChoice>, own: string[] = [], visible: string[] | null = null): ShopPreferences => ({
    choice: { ...DEFAULT_SHOP_CHOICE, use_suggested: true, use_own_shops: false, own_shops_first: false, ...choice },
    ownShopIds: new Set(own),
    visibleShopIds: visible ? new Set(visible) : null,
  });

  it("keeps the right kind of piece and ranks by matching words", () => {
    const rows = [row("a", "Straight sofa"), row("b", "Curved velvet sofa"), row("c", "Oak side table", { type: "table" }), row("d", "Curved sofa")];
    expect(rankPieces(rows, "sofa", ["Curved", "plum", "velvet"], null).map((p) => p.id)).toEqual(["b", "d", "a"]);
  });

  it("follows the shop choice: own shops first, own shops only, hidden shops removed", () => {
    const rows = [row("a", "Curved sofa", { shop_ref: "s1" }), row("b", "Sofa two", { shop_ref: "mine" }), row("c", "Sofa three", { shop_ref: "hidden" })];
    const asked = ["curved"];
    expect(rankPieces(rows, "sofa", asked, prefs({ use_own_shops: true, own_shops_first: true }, ["mine"], ["s1", "mine"])).map((p) => [p.id, p.own])).toEqual([
      ["b", true],
      ["a", false],
    ]);
    expect(rankPieces(rows, "sofa", asked, prefs({ use_suggested: false, use_own_shops: true }, ["mine"])).map((p) => p.id)).toEqual(["b"]);
  });
});
