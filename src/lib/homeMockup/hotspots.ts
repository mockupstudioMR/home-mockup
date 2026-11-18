/**
 * Home Mockup / Generator PRO hotspot integration domain.
 * Pure functions, safe to use from React and the Svelte showroom adapter.
 * Paid unlocks require a separately authenticated server implementation.
 */
export const HOTSPOT_VISIBLE_LIMIT = 5;
export const ADDITIONAL_CHOICES_CREDITS = 10;

export interface HotspotOption {
  id: string;
  hotspotId: string;
  layerId: string;
  imagePath: string;
  shadowPath?: string | null;
  assetReady: boolean;
  verifiedVariant?: boolean;
  productId?: string;
  materialId?: string;
  available?: boolean;
  licensed?: boolean;
  roomCompatible?: boolean;
  moodboardTags: string[];
  designDnaScore?: number;
  roomScore?: number;
  moodboardScore?: number;
  favorite?: boolean;
  variantKey?: string;
}

export interface HotspotContext {
  currentOptionId: string;
  moodboardTags: string[];
}

export interface ShowroomSelections {
  selections: Record<string, string>;
  history: Array<{ hotspotId: string; previousId: string | null; nextId: string }>;
}

export function eligibleOption(option: HotspotOption, context: HotspotContext): boolean {
  if (!option.id || !option.assetReady || !option.imagePath) return false;
  if (option.available === false || option.licensed === false || option.roomCompatible === false) return false;
  if (option.productId && !option.verifiedVariant) return false;
  if (option.id === context.currentOptionId) return true;
  return option.moodboardTags.some(tag => context.moodboardTags.includes(tag));
}

export function rankHotspotOptions(
  options: HotspotOption[],
  context: HotspotContext,
  excludeIds: string[] = [],
): HotspotOption[] {
  const excluded = new Set(excludeIds);
  const seen = new Set<string>();
  const score = (o: HotspotOption) =>
    (o.id === context.currentOptionId ? 100000 : 0) +
    (o.designDnaScore ?? 0) * 5 +
    (o.roomScore ?? 0) * 3 +
    (o.moodboardScore ?? 0) * 4 +
    (o.favorite ? 12 : 0);
  return options
    .filter(o => !excluded.has(o.id) && eligibleOption(o, context))
    .sort((a, b) => score(b) - score(a) || a.id.localeCompare(b.id))
    .filter(o => {
      const key = o.variantKey || o.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function initialHotspotChoices(options: HotspotOption[], context: HotspotContext): HotspotOption[] {
  return rankHotspotOptions(options, context).slice(0, HOTSPOT_VISIBLE_LIMIT);
}

export function paidHotspotChoices(
  options: HotspotOption[],
  context: HotspotContext,
  previouslyUnlockedIds: string[],
): HotspotOption[] {
  return rankHotspotOptions(options, context, [...previouslyUnlockedIds, context.currentOptionId])
    .slice(0, HOTSPOT_VISIBLE_LIMIT);
}

export function selectHotspotOption(
  state: ShowroomSelections,
  hotspotId: string,
  option: HotspotOption,
): ShowroomSelections {
  if (option.hotspotId !== hotspotId || !option.assetReady) throw new Error("Invalid hotspot selection");
  const previousId = state.selections[hotspotId] ?? null;
  if (previousId === option.id) return state;
  return {
    selections: { ...state.selections, [hotspotId]: option.id },
    history: [...state.history, { hotspotId, previousId, nextId: option.id }].slice(-50),
  };
}

export function undoHotspotOption(state: ShowroomSelections): ShowroomSelections {
  if (!state.history.length) return state;
  const history = state.history.slice();
  const last = history.pop()!;
  const selections = { ...state.selections };
  if (last.previousId === null) delete selections[last.hotspotId];
  else selections[last.hotspotId] = last.previousId;
  return { selections, history };
}

export function generatorProAssetManifest(option: HotspotOption) {
  if (!option.assetReady || !option.imagePath) throw new Error("Missing prepared WebP variation");
  return {
    layerId: option.layerId,
    variationId: option.id,
    imagePath: option.imagePath,
    shadowPath: option.shadowPath ?? null,
    productId: option.productId ?? null,
    materialId: option.materialId ?? null,
  };
}
