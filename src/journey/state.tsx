/**
 * The journey's working state: one project, the room being designed, and every answer so far.
 * Kept in this browser (so nothing is lost on reload) and mirrored to the database where tables exist
 * (projects, rooms, shop choices — see lib/projectStore).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { HouseState, Intent, Property } from "./data";

export const STORAGE_KEY = "hm_journey_v1";

export type Keyword = { word: string; on: boolean };
export type Piece = { id: string; label: string; image: string; added: boolean; source?: string };
export type StyleMatch = { name: string; score: number; description?: string; keywords: Keyword[]; pieces: Piece[] };
export type Swatch = { name: string; hex: string; use?: string; image?: string; material?: string };
export type PreviewVersion = { id: string; image: string; request?: string; createdAt: string };
export type ReadKey = "finishes" | "furniture" | "colours" | "decor" | "lighting";

export type Wall = "A" | "B" | "C" | "D";
export type KeepItem = {
  id: string;
  /** What it is, e.g. "Upright piano". */
  name: string;
  /** The size variant picked, e.g. "Upright piano · standard". */
  variant?: string;
  photos: string[];
  measured: boolean;
  w?: number; d?: number; h?: number; // cm
  /** A companion piece and its size, e.g. bench "56 × 36 × 49". */
  extraLabel?: string;
  extra?: string;
  wall?: Wall;
  /** Position along the wall, 0–100. */
  pos?: number;
  fixedSpot: boolean;
};
export type LayoutItem = { label: string; kind: string; x: number; y: number; w: number; h: number; rotate?: number };
export type Layout = {
  id: string;
  name: string;
  items: LayoutItem[];
  zones: { label: string; x: number; y: number; w: number; h: number; tone?: string }[];
  route?: { x1: number; y1: number; x2: number; y2: number };
  notes: { ok: boolean; text: string }[];
};
export type WallItem = {
  n: number;
  group: "furniture" | "finishes" | "lighting" | "inside";
  name: string;
  note: string;
  action: "Buy" | "Keep" | "Use mine" | "Changed" | "TBC" | "—" | "Custom";
  code?: string;
  x: number;
  y: number;
};
export type WallPlan = {
  role: string; // "Sofa"
  image?: string;
  /** Kept as designed, changed, or still to review. */
  status: "review" | "kept" | "changed";
  change?: string;
  items: WallItem[];
};
export type FixedKind = "windows" | "doors" | "radiators" | "columns" | "sockets" | "builtins" | "water" | "stacks" | "ac" | "panels";
/** One counted thing that can't move, placed on a wall of the plan. */
export type Placement = { id: string; kind: FixedKind; n: number; wall?: Wall; pos?: number; photo?: string };

export type JourneyState = {
  v: 1;
  // Step 1 — project
  intent?: Intent;
  propertyType?: Property;
  rooms: string[];
  startRoom?: string;
  houseState?: HouseState;
  allowInWalls: boolean;
  brief: { budget?: string; when?: string; city?: string; restrictions?: string };
  projectId?: string | null;
  roomId?: string | null;
  // Step 2 — inspiration
  visionMode?: "upload" | "describe" | "discover";
  photos: string[];
  pinterest?: string;
  note?: string;
  quickNotes: string[];
  analysis?: { colors: string[]; cues: string[]; materials?: string[]; description?: string };
  styles: StyleMatch[];
  moodboard?: { name: string; description?: string; image?: string; palette: Swatch[]; feels: string[] };
  preview?: {
    versions: PreviewVersion[];
    current: number;
    /** The AI read-out of the current version (step 2.7), five parts. */
    read?: { key: "finishes" | "furniture" | "colours" | "decor" | "lighting"; text: string; keywords: string[]; x: number; y: number }[];
    readOf?: string;
    changes?: Partial<Record<"finishes" | "furniture" | "colours" | "decor" | "lighting", string>>;
    request?: string;
    kept?: boolean;
  };
  // Step 3 — daily life
  activities: string[];
  priorities: string[];
  keeping: KeepItem[];
  nothingKept?: boolean;
  fixedCounts: Partial<Record<FixedKind, number>>;
  /** Things inside the walls the person isn't sure about yet. */
  fixedTbc: FixedKind[];
  placements: Placement[];
  /** Photos of the room taken in 3.4 that aren't tied to one feature. */
  fixedPhotos: string[];
  // Step 4 — layout
  room: {
    input?: "plan" | "photos" | "draw";
    planImage?: string;
    wallPhotos: string[];
    /** Wall A / C length and wall B / D length, in metres. Example sizes until confirmed. */
    widthM?: number;
    lengthM?: number;
    ceilingM?: number;
    scaleRef?: string;
    confirmed?: boolean;
  };
  layouts: Layout[];
  chosenLayout?: number;
  // Step 5 — main furniture
  /** Catalogue or shop photos added on 5.0, used as references when matching pieces. */
  catalogPhotos: string[];
  anchor?: {
    kind: string; // "sofa", "bed" …
    shape: string; // "Curved"
    variant?: string;
    w?: number; d?: number; h?: number;
    material?: string; // "plum velvet"
    images: Record<string, string>;
    clearance?: number;
  };
  // Step 6 — colours & materials
  accent?: { name: string; wall?: Wall; decision: "keep" | "adjust" | "skip"; change?: string; image?: string };
  supporting: { name: string; material: string }[];
  supportImage?: string;
  samplesAdded?: boolean;
  // Step 7 — lighting & power
  lighting?: {
    layers: { key: "overall" | "task" | "accent"; name: string; text: string; image?: string; pos?: string; decision: "keep" | "change"; change?: string }[];
    sockets?: number;
    switches?: number;
    dimmer: boolean;
    blind: boolean;
    stripImage?: string;
  };
  // Step 8 — wall by wall
  walls: Partial<Record<Wall, WallPlan>>;
  // later steps are added as their screens are built
  [key: string]: unknown;
  /** Steps finished for this room (1–10). */
  done: number[];
};

export const EMPTY: JourneyState = {
  v: 1,
  rooms: [],
  allowInWalls: false,
  brief: {},
  photos: [],
  quickNotes: [],
  styles: [],
  activities: [],
  priorities: [],
  keeping: [],
  fixedCounts: {},
  fixedTbc: [],
  placements: [],
  fixedPhotos: [],
  room: { wallPhotos: [] },
  catalogPhotos: [],
  supporting: [],
  walls: {},
  layouts: [],
  done: [],
};

function load(): JourneyState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    /* private mode or bad data */
  }
  return EMPTY;
}

type Ctx = {
  s: JourneyState;
  set: (patch: Partial<JourneyState> | ((s: JourneyState) => Partial<JourneyState>)) => void;
  reset: () => void;
};
const JourneyCtx = createContext<Ctx | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<JourneyState>(load);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* quota */
    }
  }, [s]);
  const set = useCallback<Ctx["set"]>((patch) => setS((prev) => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) })), []);
  const reset = useCallback(() => setS(EMPTY), []);
  const value = useMemo(() => ({ s, set, reset }), [s, set, reset]);
  return <JourneyCtx.Provider value={value}>{children}</JourneyCtx.Provider>;
}

export function useJourney() {
  const ctx = useContext(JourneyCtx);
  if (!ctx) throw new Error("useJourney must be used inside JourneyProvider");
  return ctx;
}

/** Rooms in the order they will be designed: the start room first. */
export const orderedRooms = (s: JourneyState) => (s.startRoom ? [s.startRoom, ...s.rooms.filter((r) => r !== s.startRoom)] : s.rooms);
export const uid = () => Math.random().toString(36).slice(2, 10);
