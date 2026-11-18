/**
 * Browser-session cache for the Generate page.
 *
 * The Generate page keeps its working state in sessionStorage so a refresh,
 * a tab switch or a chunk-reload does not lose the design. Before this module
 * every key was a string literal in several files, and three places (new
 * quiz, opening a design from the Gallery, starting over) each cleared their
 * own, different list of keys, which left stale data behind (for example the
 * previous design's camera angles).
 *
 * All keys and all clearing now live here. Moving this cache to the
 * database later (journey_sessions) only needs changes in this file.
 */

export const GENERATE_KEYS = {
  // What is on screen for one design
  design: "generate_design_cache",
  angles: "generate_angles_cache",
  highlights: "generate_highlights_cache",
  styleProfile: "generate_styleprofile_cache",
  items: "generate_items_cache",
  extracting: "generate_extracting_cache",
  description: "generate_description_cache",
  history: "generate_history_cache",
  imageHistory: "generate_image_history_stack",
  debugSteps: "generate_debug_steps_cache",
  debugPrompt: "generate_debug_prompt_cache",
  products: "generate_products_cache",
  // Inputs the design was generated from
  quizData: "generate_quiz_data_cache",
  quizResponseId: "generate_quiz_response_id",
  quizHash: "generate_quiz_hash",
  quizNonce: "generate_quiz_nonce",
  consumedQuizNonce: "generate_consumed_quiz_nonce",
  moodboard: "generate_moodboard_cache",
  inspirations: "generate_inspirations_cache",
  inspirationDetails: "generate_inspiration_details_cache",
  analysis: "generate_analysis_cache",
} as const;

export type GenerateKey = (typeof GENERATE_KEYS)[keyof typeof GENERATE_KEYS];

/** Everything shown for a single design. Cleared whenever a different design is opened. */
export const DESIGN_VIEW_KEYS: GenerateKey[] = [
  GENERATE_KEYS.design,
  GENERATE_KEYS.angles,
  GENERATE_KEYS.highlights,
  GENERATE_KEYS.styleProfile,
  GENERATE_KEYS.items,
  GENERATE_KEYS.extracting,
  GENERATE_KEYS.description,
  GENERATE_KEYS.history,
  GENERATE_KEYS.imageHistory,
  GENERATE_KEYS.debugSteps,
  GENERATE_KEYS.debugPrompt,
  GENERATE_KEYS.products,
];

/** Dropped first when the browser's storage quota is full (can be regenerated). */
const EVICT_ON_QUOTA: GenerateKey[] = [
  GENERATE_KEYS.highlights,
  GENERATE_KEYS.products,
  GENERATE_KEYS.styleProfile,
  GENERATE_KEYS.debugSteps,
];

const storage = (): Storage | null => {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null; // blocked storage (privacy mode, sandboxed iframe)
  }
};

export function readString(key: string): string | null {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function readJson<T>(key: string, fallback: T): T {
  const raw = readString(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Writes a string; on a full quota, evicts regenerable caches once and retries. */
export function writeString(key: string, value: string): boolean {
  const s = storage();
  if (!s) return false;
  try {
    s.setItem(key, value);
    return true;
  } catch {
    console.warn("[generateSession] storage quota exceeded, evicting caches");
    EVICT_ON_QUOTA.filter((k) => k !== key).forEach((k) => {
      try { s.removeItem(k); } catch { /* ignore */ }
    });
    try {
      s.setItem(key, value);
      return true;
    } catch {
      console.warn("[generateSession] unable to cache", key);
      return false;
    }
  }
}

export function writeJson(key: string, value: unknown): boolean {
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return false;
  }
  return writeString(key, serialized);
}

export function remove(...keys: string[]): void {
  const s = storage();
  if (!s) return;
  keys.forEach((k) => {
    try { s.removeItem(k); } catch { /* ignore */ }
  });
}

// Prefer the value passed from the previous screen (and remember it);
// otherwise fall back to what was remembered in this browser session.
export function fromRouteOrCache<T>(key: string, fromRoute: T | undefined, isUsable: (v: T | undefined) => boolean = (v) => v !== undefined): T | undefined {
  if (fromRoute !== undefined && fromRoute !== null) {
    writeJson(key, fromRoute);
    return fromRoute;
  }
  const cached = readJson<T | undefined>(key, undefined);
  return isUsable(cached) ? cached : undefined;
}

/** Forget everything shown for the current design (not the quiz inputs). */
export function clearDesignView(): void {
  remove(...DESIGN_VIEW_KEYS);
}

export type GenerateMoodboard = {
  colors?: string[];
  materials?: { label: string; imageUrl?: string }[];
  references?: { label: string; imageUrl?: string }[];
  furnitureReferences?: { label: string; imageUrl?: string }[];
  decorReferences?: { label: string; imageUrl?: string }[];
  architectureReferences?: { label: string; imageUrl?: string }[];
  mustInclude?: { label: string; imageUrl?: string }[];
};

const ANALYZE_ROOM_KEY = "analyze_room_cache";

/**
 * Rebuild the analyze-room cache from a saved moodboard, so "Back to
 * Moodboard" reopens the exact curated inspiration instead of restarting.
 * Used by the Generate page and the Gallery.
 */
export function hydrateAnalyzeRoomCacheFromMoodboard(mb: GenerateMoodboard): void {
  const existing = readJson<Record<string, unknown> & { editableColors?: string[] }>(ANALYZE_ROOM_KEY, {});
  writeJson(ANALYZE_ROOM_KEY, {
    ...existing,
    moodboard: {
      materials: mb.materials || [],
      references: mb.references || [],
      furnitureReferences: mb.furnitureReferences || [],
      decorReferences: mb.decorReferences || [],
      architectureReferences: mb.architectureReferences || [],
      mustInclude: mb.mustInclude || [],
    },
    moodboardReady: true,
    moodboardStep: 5,
    editableColors: mb.colors || existing.editableColors || [],
  });
}
