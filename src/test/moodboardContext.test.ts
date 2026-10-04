import { describe, expect, it } from "vitest";
import { buildMoodboardDirective, collectMoodboardReferences } from "../../supabase/functions/_shared/moodboardContext";

describe("moodboard generation context", () => {
  it("preserves architecture and every material instead of truncating to two images", () => {
    const references = collectMoodboardReferences({
      architectureReferences: [{ label: "Panelled wall", imageUrl: "wall.jpg" }],
      moodboardMaterials: ["oak", "linen", "stone"].map(label => ({ label, imageUrl: `${label}.jpg` })),
      moodboardReferences: [{ label: "Room style", imageUrl: "style.jpg" }],
      styleImageUrls: ["style.jpg", "generic.jpg"],
    });
    expect(references).toHaveLength(6);
    expect(references[0].label).toContain("Architecture");
    expect(references.map(ref => ref.url)).toContain("stone.jpg");
  });
  it("makes curated details authoritative without depending on template placeholders", () => {
    const brief = buildMoodboardDirective({
      detectedColors: ["#abcdef"],
      architectureReferences: [{ label: "Limewash" }],
      moodboardMaterials: [{ label: "Walnut" }],
    });
    expect(brief).toContain("#abcdef");
    expect(brief).toContain("Limewash");
    expect(brief).toContain("Walnut");
    expect(brief).toContain("preserve exact pinned products");
    expect(buildMoodboardDirective({})).toBe("");
  });
});