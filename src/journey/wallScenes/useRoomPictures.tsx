/**
 * The room's layered wall pictures on screen: starts making them as soon as the walls step opens (all walls at
 * once, as decided), shows how far it got, and keeps the saved style record of the room up to date.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveStyleRecord } from "../sync";
import { useJourney, type JourneyState, type Wall } from "../state";
import { buildModel } from "../showroom3d/model";
import { buildRecord, sameRecord } from "../showroom3d/record";
import { currentProgress, isRunning, makeRoomPictures, onProgress, stopMaking, wallKey, WALLS, wallsToMake, type Progress, type WallScene } from "./runner";

/** What a wall's picture is doing, for display. */
export type WallStatus = "ready" | "making" | "waiting" | "failed" | "outdated" | "stopped" | "none";

export function useRoomPictures(autoStart = false) {
  const { s, set } = useJourney();
  const latest = useRef(s);
  latest.current = s;
  const [prog, setProg] = useState<Progress | null>(currentProgress());
  const [, rerender] = useState(0);
  useEffect(() => onProgress((p) => { setProg(p); rerender((n) => n + 1); }), []);

  const save = useCallback((wall: Wall, scene: WallScene) => set((p) => ({
    showroom: { ...(p.showroom ?? { edits: {} }), edits: p.showroom?.edits ?? {}, scenes: { ...(p.showroom?.scenes ?? {}), [wall]: scene } },
  })), [set]);
  const start = useCallback((walls?: Wall[]) => void makeRoomPictures(() => latest.current, save, walls ?? wallsToMake(latest.current)), [save]);

  const model = useMemo(() => buildModel(s), [s]);
  const keys = useMemo(() => Object.fromEntries(WALLS.map((w) => [w, wallKey(s, model, w)])) as Record<Wall, string>, [s, model]);
  const scenes = s.showroom?.scenes ?? {};
  const running = isRunning();
  const status = (w: Wall): WallStatus => {
    const sc = scenes[w];
    if (prog?.wall === w) return "making";
    if (!sc) return running ? "waiting" : "none";
    if (sc.status === "making") return running ? "waiting" : "stopped";
    if (sc.status === "failed") return sc.key === keys[w] ? "failed" : running ? "waiting" : "outdated";
    return sc.key === keys[w] ? "ready" : running ? "waiting" : "outdated";
  };
  const ready = canMake(s);

  // All walls up front: start once when the walls step opens. Failed walls are retried only by the person.
  const tried = useRef(false);
  useEffect(() => {
    if (!autoStart || tried.current || running || ready !== true) return;
    const todo = WALLS.filter((w) => { const st = status(w); return st === "none" || st === "outdated" || st === "stopped"; });
    tried.current = true;
    if (todo.length) start(todo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, ready]);

  // The saved style of the room follows whatever the room is made from.
  const layoutId = s.layouts[s.chosenLayout ?? 0]?.id;
  const recordKey = useMemo(() => JSON.stringify([model, layoutId]), [model, layoutId]);
  useEffect(() => {
    const t = window.setTimeout(() => {
      const st = latest.current;
      const record = buildRecord(buildModel(st, st.showroom?.edits ?? {}), st.showroom?.edits ?? {}, layoutId);
      if (sameRecord(record, st.showroom?.record)) return;
      set((p) => ({ showroom: { ...(p.showroom ?? { edits: {} }), edits: p.showroom?.edits ?? {}, record } }));
      void saveStyleRecord(st, record);
    }, 800);
    return () => window.clearTimeout(t);
  }, [recordKey, layoutId, set]);

  return { scenes, status, progress: prog, running, start, stop: stopMaking, ready };
}

/** Whether the pictures can be made yet, or what is missing. */
export function canMake(s: JourneyState): true | string {
  if (!s.layouts[s.chosenLayout ?? 0]) return "Choose a layout in step 4 first.";
  if (!s.preview?.versions[s.preview.current]?.image) return "Make your preview in step 2 first: the pictures copy its style.";
  return true;
}
