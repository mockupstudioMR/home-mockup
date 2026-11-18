import { describe, expect, it } from "vitest";
import { initialHotspotChoices, paidHotspotChoices, selectHotspotOption, undoHotspotOption, type HotspotOption } from "./hotspots";

const option = (id: string): HotspotOption => ({
  id, hotspotId: "sofa", layerId: "furniture", imagePath: `scene/furniture/${id}.webp`,
  shadowPath: "scene/furniture/shadow.webp", assetReady: true, moodboardTags: ["sage"],
  designDnaScore: Number(id.replace(/\\D/g, "")) || 0,
});
const context = { currentOptionId: "o1", moodboardTags: ["sage"] };

describe("Home Mockup showroom hotspot", () => {
  it("limits visible options to five and preserves the current option", () => {
    const choices = initialHotspotChoices(Array.from({ length: 9 }, (_, i) => option(`o${i + 1}`)), context);
    expect(choices).toHaveLength(5);
    expect(choices[0].id).toBe("o1");
  });
  it("excludes already unlocked choices from a paid batch", () => {
    const choices = paidHotspotChoices(Array.from({ length: 12 }, (_, i) => option(`o${i + 1}`)), context, ["o2", "o3"]);
    expect(choices).toHaveLength(5);
    expect(choices.some(o => ["o1", "o2", "o3"].includes(o.id))).toBe(false);
  });
  it("rejects unverified retailer variants", () => {
    const bad = { ...option("bad"), productId: "sku-1", verifiedVariant: false };
    expect(initialHotspotChoices([bad], context)).toEqual([]);
  });
  it("updates a single layer and supports undo", () => {
    const state = { selections: { sofa: "o1", floor: "oak" }, history: [] };
    const updated = selectHotspotOption(state, "sofa", option("o2"));
    expect(updated.selections.floor).toBe("oak");
    expect(undoHotspotOption(updated).selections).toEqual(state.selections);
  });
});
