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
  /** Already theirs, bought or ordered, or something they'll buy themselves (no status = have it). */
  status?: "have" | "bought" | "buy";
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
export type Placement = { id: string; kind: FixedKind; n: number; wall?: Wall; pos?: number; photo?: string; /** "new": added by the plan reader; "placed": counted by the person, put on its wall by the reader */ fromPlan?: "new" | "placed" };
/** What the plan reader measured on the uploaded plan (see src/journey/plan). */
export type PlanReading = {
  ratio: number;
  shape: string;
  confidence: number;
  /** The room on the straightened plan, 0–1, and the other rooms found (to pick a different one). */
  box: [number, number, number, number];
  rooms: [number, number, number, number][];
  picked: "largest" | "tap" | "tap_missed" | "box";
  doors: number;
  windows: number;
  /** Size guessed from the door width, before the person types a real measurement. */
  guessM?: [number, number];
};

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
    /** Read from the plan by the plan reader (geometry, not AI). */
    planRead?: PlanReading;
    /** The door width the current scale assumes, in metres. */
    doorM?: number;
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
  // Step 9 — make it happen
  buyEdits?: Record<string, { size?: string; action?: string }>;
  /** Space available, per buying-list row (the second of the three sizes). */
  spaceAvail?: Record<string, string>;
  checks?: Record<string, boolean[]>;
  todo?: Record<string, boolean>;
  team?: { role: string; email: string }[];
  // Step 10 / more rooms
  /** The room being designed now (steps 2–10 repeat per room). Defaults to the start room. */
  current?: string;
  roomsDone: string[];
  /** Each finished room's answers, kept for the project page. */
  archive?: Record<string, Partial<JourneyState>>;
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
  roomsDone: [],
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
/** The room being designed now. */
export const curRoom = (s: JourneyState) => s.current ?? s.startRoom;
/** Answers that belong to one room (steps 2–10); the rest are the project's. */
export const ROOM_KEYS: (keyof JourneyState)[] = [
  "visionMode", "photos", "pinterest", "note", "quickNotes", "analysis", "styles", "moodboard", "preview",
  "activities", "priorities", "keeping", "nothingKept", "fixedCounts", "fixedTbc", "placements", "fixedPhotos",
  "room", "layouts", "chosenLayout", "anchor", "accent", "supporting", "supportImage", "samplesAdded", "lighting", "walls",
  "buyEdits", "spaceAvail", "checks", "todo",
];
export const uid = () => Math.random().toString(36).slice(2, 10);

/** Open the journey on another room of the project (used by the project page). Steps 2–10 start fresh for it. */
export function resumeRoomInJourney(roomType: string, roomId?: string) {
  try {
    const cur: JourneyState = { ...EMPTY, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") };
    if ((cur.current ?? cur.startRoom) === roomType) return;
    const reset: Partial<JourneyState> = {};
    for (const k of ROOM_KEYS) (reset as Record<string, unknown>)[k] = (EMPTY as Record<string, unknown>)[k];
    const archived = cur.archive?.[roomType] ?? {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, ...reset, ...archived, current: roomType, roomId: roomId ?? cur.roomId, rooms: cur.rooms.includes(roomType) ? cur.rooms : [...cur.rooms, roomType] }));
  } catch {
    /* private mode */
  }
}

/** The first screen of the step after the last finished one. */
export function resumePath(s: JourneyState) {
  const last = Math.max(0, ...s.done);
  const firsts = ["1/why", "2/vision", "3/activities", "4/input", "5/shops", "6/palette", "7/lighting", "8/walls", "9/buy", "10/final", "10/final"];
  return `/journey/${firsts[Math.min(10, last)]}`;
}
