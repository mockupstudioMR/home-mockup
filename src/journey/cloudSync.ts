/**
 * "Continue a project on any device": pure rules for splitting the journey into per-step
 * payloads (saved in step_progress.step_payload) and for merging what the database holds
 * with what this browser holds. No database access here; see cloudSyncDb.ts.
 */
import { EMPTY, ROOM_KEYS, type JourneyState } from "./state";

/** Answers that belong to each room step (2–9). Together they are exactly ROOM_KEYS. */
export const ROOM_STEP_KEYS: Record<number, (keyof JourneyState)[]> = {
  2: ["visionMode", "photos", "pinterest", "note", "quickNotes", "analysis", "styles", "moodboard", "preview"],
  3: ["activities", "priorities", "keeping", "nothingKept", "fixedCounts", "fixedTbc", "placements", "fixedPhotos"],
  4: ["room", "layouts", "chosenLayout"],
  5: ["anchor"],
  6: ["accent", "supporting", "supportImage", "samplesAdded", "surfaces", "decor", "refined"],
  7: ["lighting"],
  8: ["walls"],
  9: ["buyEdits", "spaceAvail", "checks", "todo"],
};

/**
 * Never saved in a payload: database ids (kept per device), the room's finished steps
 * (saved as each row's status), the room being designed (taken from the room row on
 * another device) and the format marker.
 */
const NOT_SAVED = new Set<string>(["v", "projectId", "roomId", "done", "current"]);
// Built on first use: state.tsx imports this module (through useCloudSync) before ROOM_KEYS exists.
let roomKeySet: Set<string> | null = null;
const isRoomKey = (k: string) => (roomKeySet ??= new Set<string>(ROOM_KEYS as string[])).has(k);

export type Payload = Record<string, unknown>;
export type StepRow = {
  step_no: number;
  room_id: string | null;
  status: string;
  sub_step?: string | null;
  step_payload?: Payload | null;
  version?: number | null;
  updated_at?: string | null;
};
/** What this browser last agreed with the database on, per row. */
export type RowMeta = { at: string; hash: string; version: number; status?: string };
export type SyncMeta = Record<string, RowMeta>;

export const rowKey = (step: number, roomId: string | null | undefined) => (step === 1 ? "p:1" : `${roomId ?? "-"}:${step}`);

/** The keys a step owns. Step 1 owns every project-level answer (anything not tied to a room). */
export function keysForStep(step: number, s: JourneyState): string[] {
  if (step === 1) return Object.keys({ ...EMPTY, ...s }).filter((k) => !NOT_SAVED.has(k) && !isRoomKey(k));
  if (step === 10) return [];
  return (ROOM_STEP_KEYS[step] ?? []) as string[];
}

/** The part of the journey a step's row stores. */
export function stepPayload(step: number, s: JourneyState): Payload {
  const out: Payload = {};
  for (const k of keysForStep(step, s)) if (s[k] !== undefined) out[k] = s[k];
  return out;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** True when the step holds nothing the person entered (only start values). */
export function isEmptyPayload(p: Payload): boolean {
  return Object.entries(p).every(([k, v]) => v === undefined || same(v, (EMPTY as Record<string, unknown>)[k]));
}

/** JSON with object keys sorted, so the same answers always give the same text. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((v) => (v === undefined ? "null" : stableStringify(v))).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

/** Short, stable fingerprint of a payload so the browser can tell what changed (djb2). */
export function hashPayload(p: Payload): string {
  const str = stableStringify(p);
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return `${(h >>> 0).toString(36)}.${str.length}`;
}

/** The status a row should have: finished steps are completed, the open step is in progress. */
export function stepStatus(step: number, s: JourneyState, openStep: number | null): "completed" | "in_progress" | null {
  if ((s.done ?? []).includes(step)) return "completed";
  if (openStep === step) return "in_progress";
  return null;
}

/** The step number of a journey path like /journey/4/plan. */
export function stepFromPath(path: string): number | null {
  const m = /^\/journey\/(\d+)(?:\/|$)/.exec(path);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 10 ? n : null;
}

/** When the row was last changed, by the device that changed it. */
export const remoteAt = (row: StepRow) => (typeof row.step_payload?._at === "string" ? (row.step_payload._at as string) : row.updated_at ?? "");

/**
 * The newest change wins. A browser that never saved this step counts as oldest; on a tie the
 * browser copy stays (nothing to reload).
 */
export function pickNewer(localAt: string | undefined, remote: string | undefined): "local" | "remote" | "equal" {
  const l = localAt ? Date.parse(localAt) : 0;
  const r = remote ? Date.parse(remote) : 0;
  const lv = Number.isFinite(l) ? l : 0;
  const rv = Number.isFinite(r) ? r : 0;
  if (rv > lv) return "remote";
  if (lv > rv) return "local";
  return "equal";
}

/** Copies every string in a payload through `swap` (used to replace inline images by stored ones); null drops the value. */
export function mapStrings(value: unknown, swap: (s: string) => string | null): unknown {
  if (typeof value === "string") return swap(value);
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, swap)).filter((v) => v !== null);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const next = mapStrings(v, swap);
      if (next !== null) out[k] = next;
    }
    return out;
  }
  return value;
}

/** Every inline (data:) image in a payload, so it can be stored before the row is written. */
export function inlineImages(value: unknown, found: Set<string> = new Set()): Set<string> {
  if (typeof value === "string") {
    if (value.startsWith("data:")) found.add(value);
  } else if (Array.isArray(value)) value.forEach((v) => inlineImages(v, found));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => inlineImages(v, found));
  return found;
}

export type MergeResult = {
  /** Answers to apply to the journey (empty when nothing came from the database). */
  patch: Partial<JourneyState>;
  /** Rows taken from the database. */
  pulled: string[];
  /** Rows taken from the database although this browser had its own answers there. */
  replaced: string[];
  meta: SyncMeta;
};

/**
 * Merge database rows into the journey: per step, the newer side wins. Rows of other rooms are
 * ignored. Steps taken from the database also take their finished / not finished state.
 */
export function mergeRows(s: JourneyState, rows: StepRow[], meta: SyncMeta, roomId: string | null | undefined): MergeResult {
  const patch: Partial<JourneyState> = {};
  const nextMeta: SyncMeta = { ...meta };
  const pulled: string[] = [];
  const replaced: string[] = [];
  let done: number[] | null = null;
  for (const row of rows) {
    const step = row.step_no;
    if (step !== 1 && (!roomId || row.room_id !== roomId)) continue;
    const key = rowKey(step, roomId);
    const local = meta[key];
    const at = remoteAt(row);
    const localPayload = stepPayload(step, s);
    const localEmpty = isEmptyPayload(localPayload);
    const winner = local ? pickNewer(local.at, at) : localEmpty ? "remote" : pickNewer(undefined, at);
    if (winner !== "remote") continue;
    const remote = { ...(row.step_payload ?? {}) };
    delete remote._at;
    // Rows saved before step payloads existed hold no answers: never let them wipe the browser's.
    if (!localEmpty && isEmptyPayload(remote)) continue;
    const remoteHash = hashPayload(remote);
    const changed = remoteHash !== hashPayload(localPayload);
    for (const k of keysForStep(step, { ...s, ...(remote as Partial<JourneyState>) } as JourneyState)) {
      (patch as Record<string, unknown>)[k] = k in remote ? remote[k] : (EMPTY as Record<string, unknown>)[k];
    }
    done = done ?? [...(s.done ?? [])];
    const isDone = row.status === "completed";
    if (isDone && !done.includes(step)) done.push(step);
    if (!isDone && done.includes(step)) done = done.filter((d) => d !== step);
    nextMeta[key] = { at: at || new Date(0).toISOString(), hash: remoteHash, version: row.version ?? 1, status: row.status };
    if (changed || isDone !== (s.done ?? []).includes(step)) {
      pulled.push(key);
      if (!localEmpty && changed) replaced.push(key);
    }
  }
  if (done && pulled.length) patch.done = done.sort((a, b) => a - b);
  // Only report real changes: equal payloads keep the browser's own copy.
  if (!pulled.length) return { patch: {}, pulled, replaced, meta: nextMeta };
  return { patch, pulled, replaced, meta: nextMeta };
}

export type PendingWrite = { step: number; key: string; payload: Payload; hash: string; status: "completed" | "in_progress" | null };

/** Steps whose answers or status changed since they were last saved. Empty, unstarted steps are skipped. */
export function pendingWrites(s: JourneyState, meta: SyncMeta, openStep: number | null): PendingWrite[] {
  const out: PendingWrite[] = [];
  const steps = s.roomId ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [1];
  for (const step of steps) {
    const payload = stepPayload(step, s);
    const status = stepStatus(step, s, openStep);
    if (isEmptyPayload(payload) && !status) continue;
    const key = rowKey(step, s.roomId);
    const hash = hashPayload(payload);
    const m = meta[key];
    // A finished step stays finished in the database when the browser only moved on.
    const statusChanged = status !== null && status !== m?.status && !(m?.status === "completed" && status === "in_progress");
    if (m && m.hash === hash && !statusChanged) continue;
    out.push({ step, key, payload, hash, status });
  }
  return out;
}
