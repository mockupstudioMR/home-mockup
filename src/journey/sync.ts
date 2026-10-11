/**
 * Mirrors journey answers to the database (projects, rooms, step progress). Best effort: when the
 * project tables are not in the database yet, nothing is written and the journey keeps working from this browser.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { projectsReady } from "@/lib/projectStore";
import { roomName } from "./data";
import { orderedRooms, type JourneyState } from "./state";

const STATE_MAP: Record<string, Tables<"rooms">["starting_state"]> = {
  "core-shell": "core_shell",
  empty: "empty",
  partial: "partially_furnished",
  redoing: "redo_all",
};
const BUDGET: Record<string, [number | null, number | null]> = {
  "Under €5,000": [null, 5000],
  "€5,000 – €15,000": [5000, 15000],
  "€15,000 – €30,000": [15000, 30000],
  "€30,000+": [30000, null],
};

const isQa = () => {
  try {
    return localStorage.getItem("hm_qa") === "1";
  } catch {
    return false;
  }
};

/** Step 1 answers → a project with its rooms in order. Updates the project when it already exists. */
export async function saveStep1(s: JourneyState): Promise<{ projectId: string; roomId: string | null } | null> {
  if (isQa() || !(await projectsReady())) return null;
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return null;
    const [bmin, bmax] = BUDGET[s.brief.budget ?? ""] ?? [null, null];
    const fields = {
      owner_id: userId,
      name: "My home",
      intent: s.intent ?? "exploring",
      property_type: s.propertyType ?? null,
      step1_completed_at: new Date().toISOString(),
      budget_min: bmin,
      budget_max: bmax,
      target_timing: s.brief.when && s.brief.when !== "Not decided yet" ? s.brief.when : null,
      city_or_postcode: s.brief.city || null,
      renovation_restriction: s.brief.restrictions && s.brief.restrictions !== "Not sure" ? s.brief.restrictions : null,
    } as Tables<"projects">;

    let projectId = s.projectId ?? null;
    if (projectId) {
      const { error } = await supabase.from("projects").update(fields).eq("id", projectId);
      if (error) projectId = null;
    }
    if (!projectId) {
      const { data, error } = await supabase.from("projects").insert(fields).select("id").single();
      if (error || !data) return null;
      projectId = data.id;
      try {
        localStorage.setItem("hm_project_id", projectId);
      } catch {
        /* ignore */
      }
    }

    const ordered = orderedRooms(s);
    const { data: existing } = await supabase.from("rooms").select("id, room_type").eq("project_id", projectId);
    const have = new Map((existing ?? []).map((r) => [r.room_type, r.id]));
    const state = s.houseState ? STATE_MAP[s.houseState] : null;
    for (const [i, roomType] of ordered.entries()) {
      const row = { user_id: userId, project_id: projectId, name: roomName(roomType), room_type: roomType, sequence_no: i + 1, starting_state: state };
      if (have.has(roomType)) await supabase.from("rooms").update(row).eq("id", have.get(roomType)!);
      else await supabase.from("rooms").insert(row);
    }
    const { data: first } = await supabase.from("rooms").select("id").eq("project_id", projectId).eq("room_type", ordered[0]).maybeSingle();
    const roomId = first?.id ?? null;
    if (roomId) {
      try {
        localStorage.setItem("hm_room_id", roomId);
      } catch {
        /* ignore */
      }
      await supabase.from("rooms").update({ current_step: 2 }).eq("id", roomId).lt("current_step", 2);
    }
    await supabase.from("step_progress").upsert({ project_id: projectId, step_no: 1, status: "completed" }, { onConflict: "project_id,room_id,step_no", ignoreDuplicates: true });
    return { projectId, roomId };
  } catch (e) {
    console.warn("[journey] could not save step 1", e);
    return null;
  }
}

/** A step of the current room is finished: move the room on to the next one. */
export async function saveStepDone(s: JourneyState, step: number) {
  if (isQa() || !s.roomId || !(await projectsReady())) return;
  try {
    await supabase.from("rooms").update({ current_step: Math.min(10, step + 1) }).eq("id", s.roomId).lt("current_step", step + 1);
  } catch {
    /* best effort */
  }
}
