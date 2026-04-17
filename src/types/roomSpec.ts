/**
 * Canonical Room Spec — single source of truth for everything about a room.
 *
 * Lives in `public.rooms` (DB, source of truth) and is mirrored to sessionStorage
 * (cache, instant reads) under `room_spec_active` plus the legacy
 * `floor_plan_context` / `quiz_data_cache` keys for backward-compat consumers.
 *
 * Everything that flows into the design generator (architecture, openings, style,
 * furniture, layout) MUST originate from this object so /floor-plan, /generate,
 * /gallery and the edge functions stay in lockstep.
 */

export const ROOM_SPEC_VERSION = 1;

export type WallSurface = "plain" | "brick" | "wood" | "stone" | "concrete" | "wallpaper";

export type OpeningType = "door" | "window" | "balcony" | "sliding-door" | "archway";

export interface RoomOpening {
  type: OpeningType;
  /** position along the wall, 0-100, ordered along the wall (clockwise) */
  position_pct: number;
  width_pct?: number;
  swing?: "in-left" | "in-right" | "out-left" | "out-right";
}

export interface RoomWall {
  /** Stable id: "N" | "E" | "S" | "W" for rectangle, or "wall-1".."wall-n" for custom */
  id: string;
  length_m?: number;
  surface: WallSurface;
  /** Openings ordered along the wall in the room's clockwise traversal */
  openings: RoomOpening[];
}

export interface RoomStyle {
  preference: string;          // e.g. "modern_minimal"
  colorPalette: string;        // e.g. "neutral"
  budgetFeel: string;          // e.g. "mid-range"
  mustHaveElements: string[];
  referenceImageUrl?: string;
}

export interface RoomFurniture {
  selectedItems: string[];     // resolved labels e.g. ["bed", "nightstand (left of bed)"]
}

export interface RoomLayoutItem {
  label: string;
  /** percentage of room bbox (0-100) */
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  reason?: string;
}

export interface RoomLayoutFeedback {
  item: string;
  agreed: boolean | null;
  note?: string | null;
}

export interface RoomLayout {
  name: string;
  description: string;
  items: RoomLayoutItem[];
  feedback?: RoomLayoutFeedback[];
}

export interface RoomSpec {
  /** undefined until first persisted */
  id?: string;
  user_id?: string;
  name: string;
  room_type: string;

  // Architecture
  shape: string;                                  // "rectangle" | "l-shape" | "u-shape" | "custom"
  dimensions: Record<string, number>;
  custom_walls?: { x: number; y: number }[][];    // vertices for "custom"
  walls: RoomWall[];

  // Style + furniture + layout
  style: RoomStyle;
  furniture: RoomFurniture;
  layout?: RoomLayout;

  schema_version: number;
  created_at?: string;
  updated_at?: string;
}

/** A blank, valid spec — useful as a starting point. */
export const emptyRoomSpec = (): RoomSpec => ({
  name: "Untitled Room",
  room_type: "living-room",
  shape: "rectangle",
  dimensions: {},
  walls: [],
  style: { preference: "", colorPalette: "neutral", budgetFeel: "mid-range", mustHaveElements: [] },
  furniture: { selectedItems: [] },
  schema_version: ROOM_SPEC_VERSION,
});
