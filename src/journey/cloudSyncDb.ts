/**
 * "Continue a project on any device": reads and writes step_progress rows (step_payload +
 * version). Best effort like sync.ts: when the columns are not in the database yet, or the
 * network is down, nothing is written, the journey keeps working from this browser, and the
 * next change tries again.
 */
import { supabase } from "@/lib/looseDb";
import { projectsReady } from "@/lib/projectStore";
import { mirrorToStorage } from "@/lib/journeyPersistence";
import type { JourneyState } from "./state";
import {
  inlineImages,
  mapStrings,
  mergeRows,
  pendingWrites,
  pickNewer,
  remoteAt,
  type MergeResult,
  type Payload,
  type StepRow,
  type SyncMeta,
} from "./cloudSync";

export const SYNC_META_KEY = "hm_journey_sync_v1";
const COLS = "id, step_no, room_id, status, sub_step, step_payload, version, updated_at";

export function loadMeta(): SyncMeta {
  try {
    return JSON.parse(localStorage.getItem(SYNC_META_KEY) ?? "{}") as SyncMeta;
  } catch {
    return {};
  }
}
export function saveMeta(meta: SyncMeta) {
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  } catch {
    /* private mode */
  }
}

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const isQa = () => read("hm_qa") === "1";

/** True when the signed-in person can use the step payload columns. */
let columnsCache: Promise<boolean> | null = null;
function payloadColumnsReady(): Promise<boolean> {
  if (!columnsCache) {
    columnsCache = (async () => {
      try {
        const { error } = await supabase.from("step_progress").select("step_payload, version").limit(1);
        return !error;
      } catch {
        return false;
      }
    })();
  }
  return columnsCache;
}

async function signedInUser(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

/** Can this browser sync at all (signed in, not QA, tables and columns live)? */
export async function canSync(): Promise<string | null> {
  if (isQa()) return null;
  const userId = await signedInUser();
  if (!userId) return null;
  if (!(await projectsReady()) || !(await payloadColumnsReady())) return null;
  return userId;
}

/** The project and room this browser works on; on a new device, the person's latest project. */
async function locate(s: JourneyState, userId: string): Promise<{ projectId: string; roomId: string | null; roomType: string | null } | null> {
  let projectId = s.projectId ?? read("hm_project_id");
  if (!projectId) {
    const { data } = await supabase
      .from("projects")
      .select("id")
      .eq("owner_id", userId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    projectId = data?.id ?? null;
  }
  if (!projectId) return null;
  let roomId = s.roomId ?? read("hm_room_id");
  let roomType: string | null = null;
  if (roomId) {
    const { data } = await supabase.from("rooms").select("id, room_type, project_id").eq("id", roomId).maybeSingle();
    if (data && data.project_id === projectId) roomType = data.room_type;
    else roomId = null;
  }
  if (!roomId) {
    // The room still being designed, else the first one.
    const { data } = await supabase.from("rooms").select("id, room_type, current_step, sequence_no").eq("project_id", projectId).order("sequence_no");
    const rooms = (data ?? []) as { id: string; room_type: string; current_step: number }[];
    const open = rooms.find((r) => (r.current_step ?? 0) < 10) ?? rooms[0];
    if (open) {
      roomId = open.id;
      roomType = open.room_type;
    }
  }
  return { projectId, roomId, roomType };
}

export type PullResult = MergeResult & { ids: Partial<JourneyState> };

/** Load the project's saved steps and merge them with this browser's copy (newest wins per step). */
export async function pull(s: JourneyState, meta: SyncMeta): Promise<PullResult | null> {
  const userId = await canSync();
  if (!userId) return null;
  try {
    const where = await locate(s, userId);
    if (!where) return null;
    const { data, error } = await supabase.from("step_progress").select(COLS).eq("project_id", where.projectId);
    if (error) return null;
    const rows = ((data ?? []) as StepRow[]).filter((r) => r.room_id === null || r.room_id === where.roomId);
    const ids: Partial<JourneyState> = {};
    if (s.projectId !== where.projectId) ids.projectId = where.projectId;
    if (where.roomId && s.roomId !== where.roomId) ids.roomId = where.roomId;
    if (where.roomType && !s.current && !s.startRoom) ids.current = where.roomType;
    try {
      localStorage.setItem("hm_project_id", where.projectId);
      if (where.roomId) localStorage.setItem("hm_room_id", where.roomId);
    } catch {
      /* private mode */
    }
    const merged = mergeRows({ ...s, ...ids } as JourneyState, rows, meta, where.roomId);
    return { ...merged, ids };
  } catch (e) {
    console.warn("[journey] could not load saved steps", e);
    return null;
  }
}

/** Inline photos are stored in moodboard-assets once; rows only keep the stored link. */
const stored = new Map<string, string | null>();
async function withStoredImages(payload: Payload, userId: string): Promise<Payload> {
  for (const img of inlineImages(payload)) {
    if (stored.has(img)) continue;
    const res = await mirrorToStorage(img, userId, "journey");
    stored.set(img, res?.url ?? null);
  }
  return mapStrings(payload, (str) => (str.startsWith("data:") ? stored.get(str) ?? null : str)) as Payload;
}

export type PushResult = { meta: SyncMeta; remote?: MergeResult };

/**
 * Save every step that changed. Each row carries a version: a write only lands when nobody
 * saved a newer one in between; otherwise the newer side wins (see mergeRows).
 */
export async function push(
  s: JourneyState,
  meta: SyncMeta,
  openStep: number | null,
  subStep: string | null,
  /** When this browser's change to each row happened (defaults to now). */
  changedAt: Record<string, string> = {},
): Promise<PushResult> {
  const userId = await canSync();
  if (!userId || !s.projectId) return { meta };
  const next: SyncMeta = { ...meta };
  const conflicts: StepRow[] = [];
  for (const w of pendingWrites(s, meta, openStep)) {
    try {
      const roomId = w.step === 1 ? null : s.roomId ?? null;
      if (w.step !== 1 && !roomId) continue;
      const now = new Date().toISOString();
      let q = supabase.from("step_progress").select(COLS).eq("project_id", s.projectId).eq("step_no", w.step);
      q = roomId ? q.eq("room_id", roomId) : q.is("room_id", null);
      const { data: row, error: readErr } = await q.maybeSingle();
      if (readErr) continue;
      const known = meta[w.key];
      const remoteMoved = row && (known ? (row.version ?? 1) > known.version : false);
      if (remoteMoved && pickNewer(changedAt[w.key] ?? now, remoteAt(row as StepRow)) === "remote") {
        // Another device saved this step after this browser's last save, and its change is the newer one.
        conflicts.push(row as StepRow);
        continue;
      }
      const body = { ...(await withStoredImages(w.payload, userId)), _at: now };
      const status = w.status === "in_progress" && row?.status === "completed" ? "completed" : w.status ?? row?.status ?? "in_progress";
      const fields: Record<string, unknown> = { step_payload: body, status, sub_step: w.step === openStep ? subStep : row?.sub_step ?? null };
      if (status === "completed" && !row?.completed_at) fields.completed_at = now;
      let version: number;
      if (row) {
        version = (row.version ?? 1) + 1;
        const { data: upd, error } = await supabase
          .from("step_progress")
          .update({ ...fields, version })
          .eq("id", row.id)
          .eq("version", row.version ?? 1)
          .select("id");
        if (error) continue;
        if (!upd?.length) continue; // changed in between: tried again on the next change
      } else {
        version = 1;
        const { error } = await supabase
          .from("step_progress")
          .insert({ project_id: s.projectId, room_id: roomId, step_no: w.step, started_at: now, version, ...fields });
        if (error) continue;
      }
      next[w.key] = { at: now, hash: w.hash, version, status: status as string };
    } catch (e) {
      console.warn("[journey] could not save step", w.step, e);
    }
  }
  if (conflicts.length) return { meta: next, remote: mergeRows(s, conflicts, next, s.roomId) };
  return { meta: next };
}
