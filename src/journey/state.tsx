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
export type Swatch = { name: string; hex: string; use?: string; image?: string };
export type PreviewVersion = { id: string; image: string; request?: string; createdAt: string };
export type ReadKey = "finishes" | "furniture" | "colours" | "decor" | "lighting";

export type KeepItem = {
  id: string;
  type: string; // e.g. "Upright piano"
  label?: string;
  photo?: string;
  measured: boolean;
  w?: number; d?: number; h?: number; // cm
  extra?: string; // e.g. "Bench · standard"
  wall?: string; // A–D
  required?: boolean;
};
export type FixedFeature = { id: string; kind: string; count: number; wall?: string; unsure?: boolean; placed?: boolean };

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
  fixed: FixedFeature[];
  fixedPhotos: string[];
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
  fixed: [],
  fixedPhotos: [],
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
