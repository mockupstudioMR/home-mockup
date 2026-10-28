/**
 * What the journey screens ask of the backend: photo uploads and the AI functions that already exist
 * (analyze-style, generate-design, read-design …). Each returns plain data the screens put in the journey state.
 */
import { supabase } from "@/integrations/supabase/client";
import { invokeAi } from "@/lib/invokeAi";
import { getAiErrorMessage } from "@/lib/aiErrorMessage";
import { getAiOptimizedImageUrl, optimizeImageFileSafe } from "@/lib/imageOptimization";
import { getStyleMoodboardUrls } from "@/lib/styleMoodboards";
import { trackEvent } from "@/lib/analytics";
import { mergeSize, parseArea, parseLength, readWritten, type Written, type WrittenText } from "../../supabase/functions/_shared/dimensions";
import { curRoom, uid, type JourneyState, type Layout, type Piece, type StyleMatch, type Swatch } from "./state";

const userId = async () => (await supabase.auth.getUser()).data.user?.id ?? null;

/** Upload one photo to the room-photos bucket and return its public address. */
export async function uploadPhoto(file: File, bucket = "room-photos"): Promise<string> {
  const id = await userId();
  if (!id) throw new Error("Sign in to upload photos.");
  const optimized = await optimizeImageFileSafe(file, { maxDimension: 2048 });
  if (optimized.size > 25 * 1024 * 1024) throw new Error(`"${file.name}" is too large (over 25 MB).`);
  const ext = (optimized.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${id}/${Date.now()}-${uid()}.${ext}`;
  let last: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error } = await supabase.storage.from(bucket).upload(path, optimized, { contentType: optimized.type || "image/jpeg", upsert: true });
    if (!error) return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    last = error;
    await new Promise((r) => setTimeout(r, 700 * attempt));
  }
  throw new Error((last as { message?: string })?.message || "The upload service is busy. Try again in a moment.");
}

/** A generated image comes back as a data address; keep it in design-images so it has a lasting link. */
export async function storeDesignImage(dataUri: string): Promise<string> {
  if (!dataUri.startsWith("data:")) return dataUri;
  const id = await userId();
  if (!id) return dataUri;
  const mime = /^data:(image\/\w+);base64,/.exec(dataUri)?.[1] || "image/png";
  const bytes = Uint8Array.from(atob(dataUri.replace(/^data:image\/\w+;base64,/, "")), (c) => c.charCodeAt(0));
  const path = `${id}/journey-${Date.now()}-${uid()}.${mime === "image/jpeg" ? "jpg" : "png"}`;
  const { error } = await supabase.storage.from("design-images").upload(path, new Blob([bytes], { type: mime }), { contentType: mime });
  if (error) return dataUri;
  return supabase.storage.from("design-images").getPublicUrl(path).data.publicUrl;
}

type AnalyzedStyle = { styleName: string; confidence: number; description?: string; keywords?: string[]; iconicItem?: string };
type Analysis = { styles?: AnalyzedStyle[]; moodboardDescription?: string; dominantColors?: string[]; materials?: string[] };

/** Read the inspiration photos (or a written description) into style matches, colours and cues. */
export async function analyzeStyles(s: JourneyState, opts: { exclude?: string[] } = {}) {
  trackEvent("ai_call", "journey", { fn: "analyze-style" });
  const prompt = [s.visionMode === "describe" ? s.note : null, s.note && s.visionMode !== "describe" ? `Notes: ${s.note}` : null, s.quickNotes.length ? s.quickNotes.join(", ") : null]
    .filter(Boolean)
    .join(". ");
  const { data, error } = await invokeAi<Analysis>("analyze-style", {
    body: {
      images: s.photos.map(getAiOptimizedImageUrl),
      mode: "room",
      prompt: s.visionMode === "describe" || !s.photos.length ? prompt || undefined : undefined,
      excludeStyles: opts.exclude,
      onlyOneStyle: opts.exclude ? true : undefined,
    },
    timeoutMs: 90_000,
  });
  if (error || !data) throw new Error(getAiErrorMessage(error, "We couldn't read your photos. Try again."));
  const styles: StyleMatch[] = (data.styles ?? []).map((st) => {
    const words = st.keywords ?? [];
    return {
      name: st.styleName,
      score: Math.round((st.confidence > 1 ? st.confidence / 100 : st.confidence) * 100),
      description: st.description,
      keywords: words.map((w, i) => ({ word: w, on: i < Math.min(3, words.length) })),
      pieces: [],
    };
  });
  const cues = [
    data.dominantColors?.length ? describeColours(data.dominantColors) : null,
    ...(data.materials ?? []).slice(0, 2).map((m) => m[0].toUpperCase() + m.slice(1)),
    ...styles.slice(0, 2).map((st) => st.keywords.slice(0, 2).map((k) => k.word).join(" and ")),
  ].filter(Boolean) as string[];
  return { styles, colors: data.dominantColors ?? [], materials: data.materials ?? [], description: data.moodboardDescription, cues };
}

/** Pieces from the product library that carry a style's words, for "Add to moodboard". */
export async function findStylePieces(style: StyleMatch, limit = 4): Promise<Piece[]> {
  const words = style.keywords.map((k) => k.word.toLowerCase());
  try {
    const { data } = await supabase
      .from("shop_products")
      .select("id, name, image_urls, ai_style_tags")
      .eq("is_active", true)
      .overlaps("ai_style_tags", [...words, style.name.toLowerCase()])
      .limit(limit);
    return (data ?? [])
      .filter((p) => (p.image_urls as string[] | null)?.length)
      .map((p) => ({ id: p.id, label: p.name, image: (p.image_urls as string[])[0], added: false, source: "library" }));
  } catch {
    return [];
  }
}

const NAMED: [string, [number, number, number]][] = [
  ["Plum", [91, 46, 69]], ["Emerald green", [47, 91, 74]], ["Dark walnut", [74, 48, 34]], ["Brushed brass", [180, 151, 90]], ["Grey plaster", [107, 104, 98]],
  ["Warm white", [244, 238, 228]], ["Linen", [224, 214, 196]], ["Sand", [201, 180, 148]], ["Terracotta", [181, 98, 66]], ["Rust", [164, 70, 47]],
  ["Ochre", [196, 148, 58]], ["Sage", [158, 170, 140]], ["Olive", [110, 112, 66]], ["Forest green", [46, 72, 52]], ["Navy", [38, 48, 78]],
  ["Dusty blue", [124, 146, 170]], ["Charcoal", [54, 54, 58]], ["Black", [20, 20, 22]], ["Oak", [176, 138, 96]], ["Blush", [222, 184, 176]],
  ["Burgundy", [104, 32, 44]], ["Mustard", [206, 168, 62]], ["Stone", [168, 160, 148]], ["Greige", [182, 172, 158]], ["Lavender", [170, 156, 190]],
];
const rgb = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as [number, number, number];
};
export function colourName(hex: string) {
  const [r, g, b] = rgb(hex);
  let best = NAMED[0][0], d = Infinity;
  for (const [name, [R, G, B]] of NAMED) {
    const dd = (R - r) ** 2 + (G - g) ** 2 + (B - b) ** 2;
    if (dd < d) {
      d = dd;
      best = name;
    }
  }
  return best;
}
function describeColours(hexes: string[]) {
  const names = Array.from(new Set(hexes.slice(0, 4).map((h) => colourName(h).toLowerCase())));
  const s = names.slice(0, 3);
  const t = s.length > 1 ? `${s.slice(0, -1).join(", ")} and ${s[s.length - 1]}` : s[0];
  return t ? t[0].toUpperCase() + t.slice(1) : "Colours";
}
const USES = ["Seating, curtains", "Accents", "Wood, floor", "Metal, lighting", "Walls"];
export const paletteFrom = (hexes: string[]): Swatch[] => hexes.slice(0, 5).map((hex, i) => ({ name: colourName(hex), hex, use: USES[i] }));

/** The moodboard's name: the two strongest styles blended ("Eclectic" + "Modern"). */
export function blendName(styles: StyleMatch[]) {
  const top = [...styles].sort((a, b) => b.score - a.score);
  if (!top.length) return "Your direction";
  if (top.length === 1) return top[0].name;
  const a = top[0].name.split(/[\s&]+/).filter(Boolean)[0];
  const words = top[1].name.split(/[\s&]+/).filter(Boolean);
  const b = words[words.length - 1];
  return a.toLowerCase() === b.toLowerCase() ? top[0].name : `${a} ${b === "Contemporary" ? "Modern" : b}`;
}

/** The one inspired preview of step 2 (or a new version from a change request). */
export async function generatePreview(s: JourneyState, opts: { sourceImage?: string; change?: string } = {}) {
  const mb = s.moodboard;
  const words = s.styles.flatMap((st) => st.keywords.filter((k) => k.on).map((k) => k.word));
  const added = s.styles.flatMap((st) => st.pieces.filter((p) => p.added));
  trackEvent("ai_call", "journey", { fn: "generate-design" });
  const { data, error } = await invokeAi<{ imageUrl?: string; error?: string }>("generate-design", {
    body: {
      stylePreference: (mb?.name ?? s.styles[0]?.name ?? "").toLowerCase().replace(/[&\s]+/g, "-"),
      colorPalette: (mb?.palette ?? []).map((p) => p.name).join(", "),
      roomType: curRoom(s) ?? "living-room",
      budgetFeel: "mid",
      mustHaveElements: [],
      detectedColors: (mb?.palette ?? []).map((p) => p.hex),
      detectedKeywords: words,
      moodboardDescription: mb?.description,
      furnitureReferences: added.map((p) => ({ label: p.label, imageUrl: p.image })),
      moodboardReferences: s.photos.map((src, i) => ({ label: `Inspiration ${i + 1}`, imageUrl: src })),
      styleImageUrls: [...s.photos, ...getStyleMoodboardUrls(s.styles.map((st) => st.name).join(","))],
      sourceImageUrl: opts.sourceImage,
      modificationPrompt: opts.change,
    },
  });
  if (error || !data?.imageUrl) throw new Error(getAiErrorMessage(error ?? data, "The preview could not be made. Try again."));
  return storeDesignImage(data.imageUrl);
}

export type ReadPart = { key: "finishes" | "furniture" | "colours" | "decor" | "lighting"; text: string; keywords: string[]; x: number; y: number };
/** Sum a design image up in five parts (step 2.7). */
export async function readDesign(imageUrl: string, style?: string): Promise<ReadPart[]> {
  const { data, error } = await invokeAi<{ parts?: ReadPart[]; error?: string }>("read-design", { body: { imageUrl, style }, timeoutMs: 60_000 });
  if (error || !data?.parts) throw new Error(getAiErrorMessage(error ?? data, "We couldn't read the preview. Try again."));
  return data.parts;
}

/** Read an uploaded floor plan: the room's two side lengths, in metres. */
export async function analyzePlan(imageUrl: string): Promise<{ widthM: number; lengthM: number; shape?: string; written?: Written } | null> {
  const { data, error } = await invokeAi<{
    floorplan?: {
      walls?: { length_m: number }[];
      shape_description?: string;
      written_dimensions?: { width_m?: number; length_m?: number; area_sqm?: number } | null;
      /** What the model copied from the plan, as printed. */
      printed_text?: WrittenText | null;
    };
  }>("analyze-floorplan", { body: { imageUrl }, timeoutMs: 120_000 });
  if (error) throw new Error(getAiErrorMessage(error, "We couldn't read the plan. Try a clearer image."));
  const round = (n: number) => Math.round(n * 100) / 100;
  const fp = data?.floorplan;
  // Printed numbers, read again here from the copied text so a function that hasn't been redeployed still works.
  const fromText = readWritten(fp?.printed_text);
  const wd = fp?.written_dimensions;
  const written: Written = {
    width: fromText.width ?? parseLength(wd?.width_m),
    length: fromText.length ?? parseLength(wd?.length_m),
    area: fromText.area ?? parseArea(wd?.area_sqm),
  };
  for (const k of Object.keys(written) as (keyof Written)[]) if (written[k] == null) delete written[k];
  const walls = fp?.walls ?? [];
  const hasWritten = Object.keys(written).length > 0;
  if (walls.length < 2 && !hasWritten) return null;
  const est = walls.length >= 2 ? { width: round(walls[0].length_m), length: round(walls[1].length_m) } : { width: 3.75, length: 4.9 };
  const size = mergeSize(written, est);
  return { widthM: size.width, lengthM: size.length, shape: fp?.shape_description, written: hasWritten ? written : undefined };
}

/** One layout for the room (step 4.3), built by generate-layout from everything known so far. */
export async function makeLayout(s: JourneyState, opts: { emphasis?: number; avoid?: string[] } = {}) {
  const { data, error } = await invokeAi<{ layout?: Omit<Layout, "id">; error?: string }>("generate-layout", {
    body: {
      journey: true,
      roomType: curRoom(s) ?? "living-room",
      widthM: s.room.widthM ?? 3.75,
      lengthM: s.room.lengthM ?? 4.9,
      activities: s.activities,
      priorities: s.priorities,
      style: s.moodboard?.name,
      keep: s.keeping.map((k) => ({ name: k.name, w: k.w ?? 100, d: k.d ?? 50, wall: k.wall, fixedSpot: k.fixedSpot })),
      fixed: s.placements.map((p) => ({ kind: p.kind, wall: p.wall, pos: p.pos })),
      emphasis: opts.emphasis,
      avoid: opts.avoid,
    },
    timeoutMs: 90_000,
  });
  if (error || !data?.layout) throw new Error(getAiErrorMessage(error ?? data, "The layout couldn't be made. Try again."));
  const l = data.layout;
  return { id: uid(), name: l.name, items: l.items ?? [], zones: l.zones ?? [], route: l.route, notes: (l.notes ?? []).slice(0, 3) } as Layout;
}

/** A product-style picture of one piece (generate-highlight-visuals, editable prompt "highlight_accent_furniture"). */
export async function pieceVisual(s: JourneyState, name: string, description: string) {
  const { data, error } = await invokeAi<{ imageUrl?: string }>("generate-highlight-visuals", {
    body: { type: "accentFurniture", style: s.moodboard?.name ?? "", room: (curRoom(s) ?? "living-room").replace(/-/g, " "), furnitureName: name, furnitureDescription: description, colors: s.moodboard?.palette.map((p) => p.name) },
    timeoutMs: 120_000,
  });
  if (error || !data?.imageUrl) throw new Error(getAiErrorMessage(error, "The picture couldn't be made."));
  return storeDesignImage(data.imageUrl);
}

/** A flat-lay of the palette's materials (generate-highlight-visuals "colorPalette"). */
export async function paletteVisual(s: JourneyState) {
  const { data, error } = await invokeAi<{ imageUrl?: string }>("generate-highlight-visuals", {
    body: { type: "colorPalette", style: s.moodboard?.name ?? "", room: (curRoom(s) ?? "living-room").replace(/-/g, " "), colors: s.moodboard?.palette.map((p) => p.name), materials: s.analysis?.materials },
    timeoutMs: 120_000,
  });
  if (error || !data?.imageUrl) throw new Error(getAiErrorMessage(error, "The picture couldn't be made."));
  return storeDesignImage(data.imageUrl);
}
