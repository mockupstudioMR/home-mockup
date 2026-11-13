/**
 * Keeps the journey in step with the database so a project continues on any device:
 * loads the saved steps when the journey opens (and when the tab comes back), then saves
 * changed steps 1.5 s after the last change. Signed-out people and QA runs are untouched.
 */
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { JourneyState } from "./state";
import { pendingWrites, stepFromPath } from "./cloudSync";
import { loadMeta, pull, push, saveMeta } from "./cloudSyncDb";

const DEBOUNCE_MS = 1500;
export const UPDATED_NOTE = "Updated from your other device";

const currentPath = () => (typeof window === "undefined" ? "" : window.location.pathname);

export function useCloudSync(s: JourneyState, set: (patch: Partial<JourneyState>) => void) {
  const latest = useRef(s);
  latest.current = s;
  const meta = useRef(loadMeta());
  const ready = useRef(false);
  const busy = useRef(false);
  const again = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstChange = useRef<string | null>(null);
  const changedAt = useRef<Record<string, string>>({});
  const setRef = useRef(set);
  setRef.current = set;
  const saveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let alive = true;

    const apply = (patch: Partial<JourneyState>, replaced: string[]) => {
      if (!alive || !Object.keys(patch).length) return;
      setRef.current(patch);
      if (replaced.length) toast(UPDATED_NOTE);
    };

    const save = async () => {
      if (busy.current) {
        again.current = true;
        return;
      }
      busy.current = true;
      try {
        const path = currentPath();
        const openStep = stepFromPath(path);
        const at = firstChange.current ?? new Date().toISOString();
        firstChange.current = null;
        for (const w of pendingWrites(latest.current, meta.current, openStep)) changedAt.current[w.key] ??= at;
        const res = await push(latest.current, meta.current, openStep, path || null, changedAt.current);
        for (const key of Object.keys(res.meta)) if (res.meta[key] !== meta.current[key]) delete changedAt.current[key];
        meta.current = res.meta;
        saveMeta(res.meta);
        if (res.remote) {
          meta.current = res.remote.meta;
          saveMeta(res.remote.meta);
          apply(res.remote.patch, res.remote.replaced);
        }
      } catch (e) {
        console.warn("[journey] sync failed; will retry on the next change", e);
      } finally {
        busy.current = false;
        if (again.current) {
          again.current = false;
          void save();
        }
      }
    };

    const load = async () => {
      try {
        const res = await pull(latest.current, meta.current);
        if (!res || !alive) return;
        meta.current = res.meta;
        saveMeta(res.meta);
        apply({ ...res.ids, ...res.patch }, res.replaced);
      } catch (e) {
        console.warn("[journey] could not load saved steps", e);
      }
    };

    saveRef.current = () => void save();
    void load().finally(() => {
      ready.current = true;
      void save();
    });
    const onOnline = () => void save();
    const onVisible = () => {
      if (document.visibilityState === "visible" && ready.current) void load();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive = false;
      saveRef.current = null;
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!ready.current) return;
    firstChange.current ??= new Date().toISOString();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      saveRef.current?.();
    }, DEBOUNCE_MS);
  }, [s]);
}
