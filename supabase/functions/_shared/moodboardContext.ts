interface Reference {
  label: string;
  imageUrl?: string;
}

export interface MoodboardContext {
  detectedColors?: string[];
  moodboardDescription?: string;
  moodboardMaterials?: Reference[];
  moodboardReferences?: Reference[];
  architectureReferences?: Reference[];
  furnitureReferences?: Reference[];
  decorReferences?: Reference[];
  styleImageUrls?: string[];
}

/** Keep every curated reference, with role labels rather than an ambiguous image pool. */
export function collectMoodboardReferences(data: MoodboardContext) {
  const seen = new Set<string>();
  const references: { label: string; url: string }[] = [];
  const groups: [string, Reference[]][] = [
    ["Architecture / finishes", data.architectureReferences || []],
    ["Material / texture", data.moodboardMaterials || []],
    ["User-selected style", data.moodboardReferences || []],
    ["Furniture inspiration", data.furnitureReferences || []],
    ["Decor inspiration", data.decorReferences || []],
    ["Style moodboard", (data.styleImageUrls || []).map(imageUrl => ({ label: "Style reference", imageUrl }))],
  ];
  for (const [role, items] of groups) {
    for (const item of items) {
      if (!item.imageUrl || seen.has(item.imageUrl)) continue;
      seen.add(item.imageUrl);
      references.push({ label: `${role}: ${item.label}`, url: item.imageUrl });
    }
  }
  return references;
}

/** Always present, even when a saved prompt template omits moodboard placeholders. */
export function buildMoodboardDirective(data: MoodboardContext) {
  const details = [
    data.moodboardDescription,
    data.detectedColors?.length ? `Selected palette: ${data.detectedColors.join(", ")}. Use this palette for editable surfaces and accents; preserve exact pinned products and locked room elements.` : "",
    ...([
      ["Architecture / finishes", data.architectureReferences],
      ["Materials / textures", data.moodboardMaterials],
      ["Style", data.moodboardReferences],
      ["Furniture", data.furnitureReferences],
      ["Decor", data.decorReferences],
    ] as [string, Reference[] | undefined][]).map(([role, items]) =>
      items?.length ? `${role}: ${items.map(item => item.label).filter(Boolean).join(", ")}.` : ""),
  ].filter(Boolean);
  if (!details.length && !data.styleImageUrls?.length) return "";
  return `USER MOODBOARD — AUTHORITATIVE VISUAL BRIEF: ${details.join(" ")} Study every labeled reference image. The rendered room must visibly reflect the selected finishes, textures, furniture silhouettes, decor and palette together, not a generic interpretation of a style name. User-curated references take precedence over generic style examples and default palettes. Keep the required room geometry, furniture list and exact must-include objects; use the moodboard to determine their permitted appearance.\n\n`;
}