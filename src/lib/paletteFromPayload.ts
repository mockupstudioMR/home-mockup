/**
 * Reads up to six hex colours from a journey payload for the shopping list.
 * Accepts `color_palette`, `colors` or `moodboard.colors`, each as an array of
 * hex strings / `{ hex }` objects or a comma/semicolon separated string.
 * Invalid entries are dropped; a missing "#" is added.
 */
export function paletteFromPayload(payload: unknown, max = 6): string[] {
  const p = payload as { color_palette?: unknown; colors?: unknown; moodboard?: { colors?: unknown } } | null | undefined;
  const raw = p?.color_palette ?? p?.colors ?? p?.moodboard?.colors ?? [];
  const list: unknown[] = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/[,;]/) : [];
  return list
    .map((c) => (typeof c === "string" ? c : (c as { hex?: unknown } | null)?.hex))
    .filter((c): c is string => typeof c === "string" && /^#?[0-9a-f]{6}$/i.test(c.trim()))
    .map((c) => (c.trim().startsWith("#") ? c.trim() : `#${c.trim()}`))
    .slice(0, max);
}
