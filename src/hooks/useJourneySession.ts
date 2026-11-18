import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";

/**
 * One always-current row per user in `journey_sessions`.
 * Reads once on mount, then rewrites (debounced 400 ms) on every change so
 * the next visit hydrates instantly from the DB instead of re-generating.
 */
export type JourneyStage = "start" | "analyze" | "generate" | "done";

export interface JourneySnapshot {
  stage: JourneyStage;
  sub_step: string | null;
  payload: Record<string, unknown>;
}

export function useJourneySession() {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<JourneySnapshot | null>(null);
  const [ready, setReady] = useState(false);
  const pendingRef = useRef<JourneySnapshot | null>(null);
  const timerRef = useRef<number | null>(null);

  // Hydrate once.
  useEffect(() => {
    let cancelled = false;
    if (!user) { setReady(true); return; }
    (async () => {
      const { data } = await supabase
        .from("journey_sessions")
        .select("stage, sub_step, payload")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setSnapshot(
        data
          ? { stage: (data.stage as JourneyStage) ?? "start", sub_step: data.sub_step, payload: (data.payload as JourneySnapshot["payload"] | null) ?? {} }
          : { stage: "start", sub_step: null, payload: {} },
      );
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const flush = useCallback(async () => {
    if (!user || !pendingRef.current) return;
    const next = pendingRef.current;
    pendingRef.current = null;
    await supabase.from("journey_sessions").upsert(
      { user_id: user.id, stage: next.stage, sub_step: next.sub_step, payload: next.payload as Json },
      { onConflict: "user_id" },
    );
  }, [user]);

  const save = useCallback((next: JourneySnapshot) => {
    setSnapshot(next);
    pendingRef.current = next;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => { void flush(); }, 400);
  }, [flush]);

  const patch = useCallback((partial: Partial<JourneySnapshot> & { payload?: JourneySnapshot["payload"] }) => {
    setSnapshot((prev) => {
      const base: JourneySnapshot = prev ?? { stage: "start", sub_step: null, payload: {} };
      const merged: JourneySnapshot = {
        stage: partial.stage ?? base.stage,
        sub_step: partial.sub_step ?? base.sub_step,
        payload: partial.payload ? { ...base.payload, ...partial.payload } : base.payload,
      };
      pendingRef.current = merged;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => { void flush(); }, 400);
      return merged;
    });
  }, [flush]);

  const clear = useCallback(async () => {
    if (!user) return;
    await supabase.from("journey_sessions").delete().eq("user_id", user.id);
    setSnapshot({ stage: "start", sub_step: null, payload: {} });
  }, [user]);

  return { snapshot, ready, save, patch, flush, clear };
}