/**
 * The floor-plan reader (public/py/floorplan.py) as a promise: runs in a Web Worker so the page stays smooth.
 * Pure geometry from the drawing — proportions, doors and windows on each wall — with no AI involved.
 */
export type PlanOpening = { type: "door" | "window"; wall: "A" | "B" | "C" | "D"; pos: number; start: number; end: number; len_px: number };
export type PlanRead =
  | {
      ok: true;
      width_px: number;
      length_px: number;
      ratio: number;
      shape: string;
      wall_px: number;
      tilt_deg: number;
      image: [number, number];
      /** The room's inside edges on the straightened plan, 0–1. */
      box: [number, number, number, number];
      outline: [number, number][];
      openings: PlanOpening[];
      scale: { m_per_px: number; from: "door"; width_m: number; length_m: number } | null;
      rooms: { box: [number, number, number, number]; area: number }[];
      confidence: number;
      picked: "largest" | "tap" | "tap_missed";
    }
  | { ok: false; reason: string; message: string };

/** Where Pyodide comes from. A pinned public CDN by default; can point at a self-hosted copy. */
const INDEX_URL = (import.meta.env.VITE_PYODIDE_URL as string | undefined) ?? "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
const SCRIPT_URL = "/py/floorplan.py";
/** The door width the reader assumes for its first scale guess, in metres (as in floorplan.py). */
export const PLAN_DOOR_M = 0.85;

let worker: Worker | null = null;
let seq = 0;
const waiting = new Map<number, { ok: (r: PlanRead) => void; fail: (e: Error) => void }>();
const listeners = new Set<(s: string) => void>();
let isReady = false;

function get(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./reader.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e: MessageEvent) => {
    const m = e.data as { type: string; id?: number; json?: string; message?: string; text?: string };
    if (m.type === "status") listeners.forEach((l) => l(m.text ?? ""));
    if (m.type === "ready") isReady = true;
    if (m.type === "result" && m.id != null) {
      waiting.get(m.id)?.ok(JSON.parse(m.json ?? "{}"));
      waiting.delete(m.id);
    }
    if (m.type === "error") {
      const err = new Error(m.message || "The plan reader stopped.");
      if (m.id != null && m.id >= 0) {
        waiting.get(m.id)?.fail(err);
        waiting.delete(m.id);
      } else {
        waiting.forEach((w) => w.fail(err));
        waiting.clear();
      }
    }
  };
  worker.onerror = () => {
    waiting.forEach((w) => w.fail(new Error("The plan reader couldn't start.")));
    waiting.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

/** Start downloading the reader before it's needed (call when the person is about to upload a plan). */
export function warmPlanReader() {
  if (typeof Worker === "undefined") return;
  try {
    get().postMessage({ type: "warm", indexURL: INDEX_URL, scriptURL: SCRIPT_URL });
  } catch {
    /* no workers: the AI reader is used instead */
  }
}

export const planReaderReady = () => isReady;
export function onPlanReaderStatus(l: (s: string) => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Read one room of a plan. `tap` = the point the person tapped (0–1 of the image) to choose the room. */
export async function readPlan(file: Blob, tap?: [number, number], timeoutMs = 120_000): Promise<PlanRead> {
  const bytes = await file.arrayBuffer();
  const id = ++seq;
  const w = get();
  return new Promise<PlanRead>((ok, fail) => {
    const timer = setTimeout(() => {
      waiting.delete(id);
      fail(new Error("Reading the plan took too long."));
    }, timeoutMs);
    waiting.set(id, {
      ok: (r) => {
        clearTimeout(timer);
        ok(r);
      },
      fail: (e) => {
        clearTimeout(timer);
        fail(e);
      },
    });
    w.postMessage({ type: "read", id, bytes, tap, indexURL: INDEX_URL, scriptURL: SCRIPT_URL }, [bytes]);
  });
}
