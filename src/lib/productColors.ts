import type { Json } from "@/integrations/supabase/types";

export interface ExtractedColor {
  name: string;
  hex: string;
  percentage: number;
}

type JsonObject = { [key: string]: Json | undefined };

/** Returns product metadata as a plain object, or {} when it is missing or not an object. */
export function metadataObject(metadata: Json | null | undefined): JsonObject {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as JsonObject;
  }
  return {};
}

/** Reads `metadata.extracted_colors`, keeping only entries that have a colour name. */
export function getExtractedColors(metadata: Json | null | undefined): ExtractedColor[] {
  const raw = metadataObject(metadata).extracted_colors;
  if (!Array.isArray(raw)) return [];
  const colors: ExtractedColor[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const { name, hex, percentage } = entry as JsonObject;
    if (typeof name !== "string" || !name) continue;
    colors.push({
      name,
      hex: typeof hex === "string" ? hex : "#888888",
      percentage: typeof percentage === "number" ? percentage : 0,
    });
  }
  return colors;
}

/** True when the product has had colour extraction run (even if the result was empty). */
export function hasExtractedColors(metadata: Json | null | undefined): boolean {
  return Array.isArray(metadataObject(metadata).extracted_colors);
}

/** Splits a comma-separated product type ("sofa, chair") into trimmed tags. */
export function splitTypeTags(type: string | null | undefined): string[] {
  return type ? type.split(",").map((t) => t.trim()).filter(Boolean) : [];
}
