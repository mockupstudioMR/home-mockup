/**
 * The journey kept with the person's account, not only in this browser: every change is saved to
 * journey_states (one row per person), and a browser with no answers gets them back on the next visit.
 * Newer answers from another device come in step by step through useCloudSync (step_progress); this is
 * the safety net for an empty browser. Best effort: without the table or a signed-in person, the journey works from this browser.
 */
import { supabase } from "@/lib/looseDb";
import type { JourneyState } from "./state";

export const SAVED_AT_KEY = "hm_journey_saved_at";
let off = false; // the table isn't there (or not allowed): stop trying for this visit

const userId = async () => {
  try {
    return (await supabase.auth.getUser()).data.user?.id ?? null;
  } catch {
    return null;
  }
};
const isQa = () => {
  try { return localStorage.getItem("hm_qa") === "1"; } catch { return false; }
};
export const markSaved = (at = new Date().toISOString()) => {
  try { localStorage.setItem(SAVED_AT_KEY, at); } catch { /* private mode */ }
};

/** True when this browser has nothing worth keeping: no room, style, layout or walls yet. */
export const isBlank = (s: JourneyState) =>
  !s.rooms.length && !s.moodboard && !s.layouts.length && !Object.keys(s.walls ?? {}).length && !s.preview?.versions?.length;

/** The account's journey, when it is newer than this browser's (or this browser has none). */
export async function newerFromAccount(local: JourneyState): Promise<JourneyState | null> {
  if (off || isQa()) return null;
  const id = await userId();
  if (!id) return null;
  const { data, error } = await supabase.from("journey_states").select("state, updated_at").eq("user_id", id).maybeSingle();
  if (error) { off = true; return null; }
  if (!data?.state) return null;
  // a browser with answers is kept in step with other devices step by step (useCloudSync); this copy
  // only fills a browser that has nothing yet
  if (!isBlank(local)) return null;
  markSaved(data.updated_at);
  return data.state as JourneyState;
}

/** Keep the journey with the account. */
export async function saveToAccount(s: JourneyState) {
  if (off || isQa() || isBlank(s)) return;
  const id = await userId();
  if (!id) return;
  const at = new Date().toISOString();
  const { error } = await supabase.from("journey_states").upsert({ user_id: id, state: s, updated_at: at }, { onConflict: "user_id" });
  if (error) { off = true; return; }
  markSaved(at);
}
