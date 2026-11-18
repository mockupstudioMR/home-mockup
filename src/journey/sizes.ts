/**
 * Standard sizes. The admin keeps them in furniture_specs (Curate › Sizes); the list below is only used
 * when the database has nothing for a piece yet, so a screen never shows an empty size.
 */
import { supabase } from "@/lib/looseDb";

export type SizeVariant = { label: string; w: number; d: number; h: number; extraLabel?: string; extra?: string; clearance?: number };

const FALLBACK: Record<string, SizeVariant[]> = {
  "upright piano": [
    { label: "Upright piano · standard", w: 150, d: 60, h: 125, extraLabel: "Bench · standard", extra: "56 × 36 × 49" },
    { label: "Upright piano · compact", w: 140, d: 55, h: 110, extraLabel: "Bench · standard", extra: "56 × 36 × 49" },
    { label: "Upright piano · tall", w: 155, d: 62, h: 132, extraLabel: "Bench · standard", extra: "56 × 36 × 49" },
    { label: "Digital piano", w: 136, d: 40, h: 90, extraLabel: "Bench · standard", extra: "56 × 36 × 49" },
    { label: "Baby grand", w: 150, d: 160, h: 100, extraLabel: "Bench · standard", extra: "76 × 36 × 49" },
  ],
  sofa: [
    { label: "3-seater sofa · standard", w: 220, d: 95, h: 85 },
    { label: "3-seater sofa · compact", w: 200, d: 90, h: 85 },
    { label: "L-shape sofa · standard", w: 270, d: 170, h: 85 },
    { label: "L-shape sofa · large", w: 300, d: 200, h: 85 },
    { label: "Curved sofa · 3-seat standard", w: 240, d: 105, h: 80 },
    { label: "Curved sofa · 2-seat compact", w: 200, d: 95, h: 80 },
    { label: "Curved sofa · 4-seat large", w: 290, d: 115, h: 80 },
  ],
  rug: [
    { label: "Rug · 200 × 300", w: 200, d: 300, h: 1 },
    { label: "Rug · 160 × 230", w: 160, d: 230, h: 1 },
    { label: "Rug · 240 × 340", w: 240, d: 340, h: 1 },
  ],
  bookshelf: [
    { label: "Bookshelf · tall", w: 80, d: 35, h: 200 },
    { label: "Bookshelf · low", w: 120, d: 35, h: 90 },
  ],
  tv: [
    { label: "TV · 55 inch", w: 123, d: 7, h: 71, extraLabel: "TV unit", extra: "160 × 40 × 50" },
    { label: "TV · 65 inch", w: 145, d: 7, h: 83, extraLabel: "TV unit", extra: "180 × 40 × 50" },
  ],
  artwork: [
    { label: "Artwork · medium", w: 80, d: 3, h: 100 },
    { label: "Artwork · large", w: 120, d: 4, h: 150 },
  ],
  armchair: [{ label: "Armchair · standard", w: 80, d: 85, h: 85 }],
  "coffee table": [{ label: "Coffee table · standard", w: 110, d: 65, h: 38 }],
  "dining table": [{ label: "Dining table · 6 seats", w: 180, d: 90, h: 75 }],
  bed: [{ label: "Bed · double", w: 160, d: 210, h: 100 }],
  desk: [{ label: "Desk · standard", w: 140, d: 70, h: 75 }],
  sideboard: [{ label: "Sideboard · standard", w: 180, d: 45, h: 80 }],
};

const key = (name: string) => name.toLowerCase().replace(/\s*·.*$/, "").trim();

/** Size variants for a piece: the database's first, the built-in list if there are none. */
export async function sizeVariants(name: string): Promise<SizeVariant[]> {
  const k = key(name);
  try {
    const { data } = await supabase
      .from("furniture_specs")
      .select("name, variant, width_cm, depth_cm, height_cm, min_clearance_cm, is_default")
      .ilike("name", `%${k}%`)
      .order("is_default", { ascending: false })
      .limit(8);
    if (data?.length) {
      const fb = fallbackFor(k)[0];
      return data.map((r) => ({
        label: `${r.name}${r.variant ? ` · ${r.variant}` : ""}`,
        w: r.width_cm,
        d: r.depth_cm,
        h: r.height_cm ?? 0,
        clearance: r.min_clearance_cm,
        extraLabel: fb?.extraLabel,
        extra: fb?.extra,
      }));
    }
  } catch {
    /* fall back */
  }
  return fallbackFor(k);
}

export function fallbackFor(name: string): SizeVariant[] {
  const k = key(name);
  const hit = FALLBACK[k] ?? Object.entries(FALLBACK).find(([n]) => k.includes(n) || n.includes(k))?.[1];
  return hit ?? [{ label: `${name} · standard`, w: 100, d: 50, h: 80 }];
}

export const dims = (v: { w?: number; d?: number; h?: number }) => [v.w, v.d, v.h].filter((x) => x != null && x > 0).join(" × ");
