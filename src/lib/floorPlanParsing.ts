// Typed parsers for loosely-shaped data the Floor Plan page receives from
// AI functions, sessionStorage and the generated_designs table.
// Kept pure so they can be unit-tested without rendering the page.

export type OpeningType = "door" | "window" | "balcony";
export type WallSide = "top" | "right" | "bottom" | "left";

export interface ParsedOpening {
  id: string;
  type: OpeningType;
  wall: WallSide;
  position: number;
}

/** An opening as returned by the floor-plan AI functions. */
export interface DetectedOpening {
  type?: string;
  wall_index?: number;
  position_pct?: number;
}

const WALL_ORDER: WallSide[] = ["top", "right", "bottom", "left"];
const OPENING_TYPES: OpeningType[] = ["door", "window", "balcony"];

const newId = () => crypto.randomUUID();

/**
 * Openings coming from a scanned multi-room plan prefill.
 * Lenient: unknown types become doors, wall indexes wrap, positions clamp to 0–100.
 */
export function parsePrefillOpenings(raw: unknown, makeId: () => string = newId): ParsedOpening[] {
  if (!Array.isArray(raw)) return [];
  return (raw as (DetectedOpening | null | undefined)[])
    .filter((o): o is DetectedOpening & { wall_index: number } => !!o && typeof o.wall_index === "number")
    .map((o) => ({
      id: makeId(),
      type: (OPENING_TYPES as string[]).includes(o.type ?? "") ? (o.type as OpeningType) : "door",
      wall: WALL_ORDER[Math.abs(Math.round(o.wall_index)) % WALL_ORDER.length],
      position: Math.min(100, Math.max(0, Math.round(Number(o.position_pct) || 50))),
    }));
}

/**
 * Openings detected by analyse-floorplan on an uploaded image.
 * Keeps the AI's type and position as given; drops openings on walls beyond the fourth.
 */
export function parseDetectedOpenings(raw: unknown, makeId: () => string = newId): ParsedOpening[] {
  if (!Array.isArray(raw)) return [];
  return (raw as DetectedOpening[])
    .filter((o): o is DetectedOpening & { wall_index: number } =>
      typeof o?.wall_index === "number" && o.wall_index < WALL_ORDER.length)
    .map((o) => ({
      id: makeId(),
      type: o.type as OpeningType,
      wall: WALL_ORDER[o.wall_index % WALL_ORDER.length],
      position: Math.round(Number(o.position_pct)),
    }));
}

export interface DesignItem {
  name: string;
  type?: string;
  color?: string;
  material?: string;
  style?: string;
}

interface RawDesignItem {
  item_name?: string;
  name?: string;
  label?: string;
  item_type?: string;
  type?: string;
  color?: string;
  material?: string;
  style?: string;
}

/** Normalises `generated_designs.extracted_items` into named items; unnamed entries are dropped. */
export function parseDesignItems(raw: unknown): DesignItem[] {
  if (!Array.isArray(raw)) return [];
  return (raw as (RawDesignItem | null | undefined)[])
    .map((it) => ({
      name: it?.item_name || it?.name || it?.label || "",
      type: it?.item_type || it?.type,
      color: it?.color,
      material: it?.material,
      style: it?.style,
    }))
    .filter((it) => it.name);
}

/**
 * Pulls the `label` out of each moodboard entry. With `allowPlain`, entries that are
 * already plain values (e.g. strings) are kept as they are. Empty results are dropped.
 */
export function moodboardLabels(raw: unknown, allowPlain = false): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m: unknown) => {
      const label = (m as { label?: unknown } | null | undefined)?.label;
      return allowPlain ? label || m : label;
    })
    .filter(Boolean);
}

/** Message to show for a caught error, falling back when there is none. */
export function errorMessage(e: unknown, fallback: string): string {
  const msg = (e as { message?: unknown } | null | undefined)?.message;
  return typeof msg === "string" && msg ? msg : fallback;
}
