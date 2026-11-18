import { describe, expect, it, vi } from "vitest";
import { EMPTY, ROOM_KEYS, type JourneyState } from "@/journey/state";
import {
  ROOM_STEP_KEYS,
  hashPayload,
  isEmptyPayload,
  mapStrings,
  mergeRows,
  pendingWrites,
  pickNewer,
  rowKey,
  stepFromPath,
  stepPayload,
  type StepRow,
  type SyncMeta,
} from "@/journey/cloudSync";

const ROOM = "room-1";
const T1 = "2026-11-13T10:00:00.000Z";
const T2 = "2026-11-13T11:00:00.000Z";

/** A project with steps 1–4 answered in room-1. */
const filled: JourneyState = {
  ...EMPTY,
  projectName: "Flat in Vienna",
  intent: "redesign",
  propertyType: "apartment",
  rooms: ["living", "bedroom"],
  startRoom: "living",
  brief: { budget: "€5,000 – €15,000", city: "1010" },
  projectId: "proj-1",
  roomId: ROOM,
  visionMode: "describe",
  note: "warm, calm, lots of wood",
  photos: ["https://x.supabase.co/storage/v1/object/sign/moodboard-assets/u/a.png"],
  moodboard: { name: "Warm minimal", palette: [{ name: "Oat", hex: "#e8dcc8" }], feels: ["calm"] },
  activities: ["reading", "tv"],
  priorities: ["storage"],
  room: { wallPhotos: [], widthM: 4.2, lengthM: 5.1, confirmed: true },
  layouts: [{ id: "l1", name: "Facing the window" } as never],
  chosenLayout: 0,
  done: [1, 2, 3, 4],
};

/** The rows the first device saves (as pendingWrites would send them). */
function rowsFrom(s: JourneyState, at: string, version = 1): StepRow[] {
  return pendingWrites(s, {}, null).map((w) => ({
    step_no: w.step,
    room_id: w.step === 1 ? null : s.roomId!,
    status: w.status ?? "in_progress",
    step_payload: { ...w.payload, _at: at },
    version,
    updated_at: at,
  }));
}

describe("step payloads", () => {
  it("room steps 2–9 own exactly the room answers", () => {
    const all = Object.values(ROOM_STEP_KEYS).flat().sort();
    expect(all).toEqual([...ROOM_KEYS].sort());
    expect(new Set(all).size).toBe(all.length);
  });

  it("step 1 holds the project answers but never ids, the room's finished steps or the current room", () => {
    const p = stepPayload(1, { ...filled, current: "living" });
    expect(p.projectName).toBe("Flat in Vienna");
    expect(p.rooms).toEqual(["living", "bedroom"]);
    for (const k of ["projectId", "roomId", "done", "current", "v", "note", "room"]) expect(p).not.toHaveProperty(k);
  });

  it("an untouched step is empty", () => {
    expect(isEmptyPayload(stepPayload(5, filled))).toBe(true);
    expect(isEmptyPayload(stepPayload(3, filled))).toBe(false);
  });

  it("the fingerprint ignores key order", () => {
    expect(hashPayload({ a: 1, b: { c: 2, d: 3 } })).toBe(hashPayload({ b: { d: 3, c: 2 }, a: 1 }));
    expect(hashPayload({ a: 1 })).not.toBe(hashPayload({ a: 2 }));
  });

  it("reads the step from a journey path", () => {
    expect(stepFromPath("/journey/4/plan")).toBe(4);
    expect(stepFromPath("/journey/10/final")).toBe(10);
    expect(stepFromPath("/journey")).toBeNull();
    expect(stepFromPath("/project")).toBeNull();
  });

  it("inline images can be swapped for stored links or dropped", () => {
    const out = mapStrings({ photos: ["data:image/png;base64,AAA", "https://a/b.png"], img: "data:x" }, (s) =>
      s.startsWith("data:") ? null : s,
    );
    expect(out).toEqual({ photos: ["https://a/b.png"] });
  });
});

describe("the merge rule", () => {
  it("remote newer: the database copy wins", () => {
    const meta: SyncMeta = { [rowKey(2, ROOM)]: { at: T1, hash: "old", version: 1 } };
    const local = { ...filled, note: "old note" };
    const rows = rowsFrom({ ...filled, note: "new note" }, T2, 2).filter((r) => r.step_no === 2);
    const res = mergeRows(local, rows, meta, ROOM);
    expect(res.patch.note).toBe("new note");
    expect(res.replaced).toEqual([rowKey(2, ROOM)]);
    expect(res.meta[rowKey(2, ROOM)].version).toBe(2);
  });

  it("local newer: the browser copy stays", () => {
    const meta: SyncMeta = { [rowKey(2, ROOM)]: { at: T2, hash: "x", version: 1 } };
    const rows = rowsFrom({ ...filled, note: "remote note" }, T1).filter((r) => r.step_no === 2);
    const res = mergeRows({ ...filled, note: "mine" }, rows, meta, ROOM);
    expect(res.patch).toEqual({});
    expect(res.pulled).toEqual([]);
  });

  it("equal times: the browser copy stays", () => {
    expect(pickNewer(T1, T1)).toBe("equal");
    const meta: SyncMeta = { [rowKey(2, ROOM)]: { at: T1, hash: "x", version: 1 } };
    const rows = rowsFrom({ ...filled, note: "remote" }, T1).filter((r) => r.step_no === 2);
    expect(mergeRows({ ...filled, note: "mine" }, rows, meta, ROOM).patch).toEqual({});
  });

  it("pickNewer compares times, a missing time counts as oldest", () => {
    expect(pickNewer(T1, T2)).toBe("remote");
    expect(pickNewer(T2, T1)).toBe("local");
    expect(pickNewer(undefined, T1)).toBe("remote");
    expect(pickNewer(T1, undefined)).toBe("local");
  });

  it("an empty row saved before this feature never wipes the browser's answers", () => {
    const legacy: StepRow = { step_no: 1, room_id: null, status: "completed", step_payload: {}, version: 1, updated_at: T2 };
    const res = mergeRows(filled, [legacy], {}, ROOM);
    expect(res.patch).toEqual({});
  });

  it("rows of another room are ignored", () => {
    const rows = rowsFrom(filled, T2).map((r) => ({ ...r, room_id: r.step_no === 1 ? null : "room-2" }));
    const res = mergeRows({ ...EMPTY, roomId: ROOM }, rows, {}, ROOM);
    expect(res.pulled).toEqual([rowKey(1, ROOM)]);
  });
});

describe("continue on another device", () => {
  it("steps 1–4 come back on an empty browser", () => {
    const rows = rowsFrom(filled, T1);
    expect(rows.map((r) => r.step_no)).toEqual([1, 2, 3, 4]);
    const fresh: JourneyState = { ...EMPTY, projectId: "proj-1", roomId: ROOM };
    const res = mergeRows(fresh, rows, {}, ROOM);
    const restored = { ...fresh, ...res.patch } as JourneyState;
    for (const step of [1, 2, 3, 4]) expect(stepPayload(step, restored)).toEqual(stepPayload(step, filled));
    expect(restored.done).toEqual([1, 2, 3, 4]);
    expect(res.replaced).toEqual([]); // nothing of this browser's was overwritten: no note
    // Once restored, nothing needs saving back.
    expect(pendingWrites(restored, res.meta, null)).toEqual([]);
  });

  it("only changed steps are saved again", () => {
    const meta: SyncMeta = {};
    for (const w of pendingWrites(filled, {}, null)) meta[w.key] = { at: T1, hash: w.hash, version: 1, status: w.status ?? undefined };
    expect(pendingWrites(filled, meta, null)).toEqual([]);
    const changed = pendingWrites({ ...filled, activities: ["reading"] }, meta, null);
    expect(changed.map((w) => w.step)).toEqual([3]);
  });

  it("a finished step is not set back to in progress when the person revisits it", () => {
    const meta: SyncMeta = {};
    for (const w of pendingWrites(filled, {}, null)) meta[w.key] = { at: T1, hash: w.hash, version: 1, status: w.status ?? undefined };
    expect(pendingWrites(filled, meta, 3)).toEqual([]);
  });
});

describe("signed-out people", () => {
  it("nothing is read or written", async () => {
    vi.resetModules();
    const from = vi.fn();
    vi.doMock("@/lib/looseDb", () => ({ supabase: { auth: { getUser: async () => ({ data: { user: null } }) }, from } }));
    vi.doMock("@/lib/projectStore", () => ({ projectsReady: async () => true }));
    vi.doMock("@/lib/journeyPersistence", () => ({ mirrorToStorage: vi.fn() }));
    const db = await import("@/journey/cloudSyncDb");
    expect(await db.pull(filled, {})).toBeNull();
    expect(await db.push(filled, {}, 2, "/journey/2/vision")).toEqual({ meta: {} });
    expect(from).not.toHaveBeenCalled();
    vi.doUnmock("@/lib/looseDb");
    vi.doUnmock("@/lib/projectStore");
    vi.doUnmock("@/lib/journeyPersistence");
  });
});
