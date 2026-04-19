/**
 * Public URLs for the style moodboard images shown in the quiz/StyleTree.
 * These are sent to the AI design generator so the model can actually look at
 * the colors, materials and furniture vibe of the user-selected styles —
 * not just the style names.
 */

const BASE =
  "https://bofbkmgsefjnfbtvjgdz.supabase.co/storage/v1/object/public/design-images/style-moodboards";

const MAP: Record<string, string> = {
  "modern-minimal": `${BASE}/modern-minimal.png`,
  "classic-historical": `${BASE}/classic-historical.png`,
  "rustic-nature": `${BASE}/rustic-nature.png`,
  mediterranean: `${BASE}/mediterranean.png`,
  "bohemian-eclectic": `${BASE}/bohemian-eclectic.png`,
  "glam-luxe": `${BASE}/glam-luxe.png`,
};

const normalize = (key: string) => key.trim().toLowerCase().replace(/_/g, "-");

/** Resolve a single style key (underscore or hyphen) to a public moodboard URL. */
export const getStyleMoodboardUrl = (styleKey: string): string | undefined =>
  MAP[normalize(styleKey)];

/**
 * Resolve a comma-separated stylePreference string into the list of moodboard
 * URLs the user actually picked.
 */
export const getStyleMoodboardUrls = (stylePreference: string | undefined): string[] => {
  if (!stylePreference) return [];
  return stylePreference
    .split(",")
    .map((s) => getStyleMoodboardUrl(s))
    .filter((u): u is string => Boolean(u));
};
