import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY, type JourneyState } from "@/journey/state";
import { rowKey, type SyncMeta } from "@/journey/cloudSync";

/** A tiny stand-in for the step_progress table, enough for push(). */
type Row = Record<string, unknown>;
let rows: Row[] = [];
const updates: { fields: Row; filters: [string, unknown][] }[] = [];

function table() {
  const filters: [string, unknown][] = [];
  let mode: "select" | "update" | "insert" = "select";
  let fields: Row = {};
  const match = () => rows.filter((r) => filters.every(([k, v]) => r[k] === v));
  const q = {
    select: () => q,
    limit: () => q,
    eq: (k: string, v: unknown) => (filters.push([k, v]), q),
    is: (k: string, v: unknown) => (filters.push([k, v]), q),
    update: (f: Row) => ((mode = "update"), (fields = f), q),
    insert: async (f: Row) => {
      rows.push({ id: `r${rows.length + 1}`, ...f });
      return { error: null };
    },
    maybeSingle: async () => ({ data: match()[0] ?? null, error: null }),
    then: (resolve: (v: unknown) => void) => {
      if (mode === "update") {
        const hit = match();
        updates.push({ fields, filters: [...filters] });
        hit.forEach((r) => Object.assign(r, fields));
        resolve({ data: hit.map((r) => ({ id: r.id })), error: null });
      } else resolve({ data: match(), error: null });
    },
  };
  void mode;
  return q;
}

vi.mock("@/lib/looseDb", () => ({
  supabase: { auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) }, from: () => table() },
}));
vi.mock("@/lib/projectStore", () => ({ projectsReady: async () => true }));
vi.mock("@/lib/journeyPersistence", () => ({ mirrorToStorage: async () => ({ url: "https://stored/img.png", path: "u1/journey/img.png" }) }));

const { push } = await import("@/journey/cloudSyncDb");

const s: JourneyState = { ...EMPTY, projectId: "p1", roomId: "room-1", note: "mine", photos: ["data:image/png;base64,AAA"], done: [1] };
const key2 = rowKey(2, "room-1");

beforeEach(() => {
  rows = [];
  updates.length = 0;
});

describe("saving steps", () => {
  it("creates rows, storing inline photos as links", async () => {
    const res = await push(s, {}, 2, "/journey/2/vision");
    const row2 = rows.find((r) => r.step_no === 2)!;
    expect(row2.step_payload).toMatchObject({ note: "mine", photos: ["https://stored/img.png"] });
    expect(row2.status).toBe("in_progress");
    expect(row2.sub_step).toBe("/journey/2/vision");
    expect(res.meta[key2].version).toBe(1);
  });

  it("updates only the version it has seen and bumps it", async () => {
    rows.push({ id: "a", project_id: "p1", room_id: "room-1", step_no: 2, status: "in_progress", step_payload: { note: "old" }, version: 3, updated_at: "2026-11-13T09:00:00Z" });
    const meta: SyncMeta = { [key2]: { at: "2026-11-13T09:00:00Z", hash: "old", version: 3 } };
    const res = await push(s, meta, 2, null);
    expect(updates[0].filters).toContainEqual(["version", 3]);
    expect(rows[0].version).toBe(4);
    expect(res.meta[key2].version).toBe(4);
  });

  it("does not overwrite a newer save from another device: it loads it instead", async () => {
    const later = new Date(Date.now() + 60_000).toISOString();
    rows.push({ id: "a", project_id: "p1", room_id: "room-1", step_no: 2, status: "in_progress", step_payload: { note: "from phone", _at: later }, version: 5, updated_at: later });
    const meta: SyncMeta = { [key2]: { at: "2026-11-13T09:00:00Z", hash: "old", version: 3 } };
    const res = await push(s, meta, 2, null, { [key2]: "2026-11-13T09:30:00Z" });
    expect(updates.filter((u) => u.filters.some(([k, v]) => k === "id" && v === "a"))).toEqual([]);
    expect(res.remote?.patch.note).toBe("from phone");
    expect(res.remote?.replaced).toEqual([key2]);
  });
});
