/** Turn what the plan reader measured into the room's size and the doors and windows on its walls. */
import type { FixedKind, JourneyState, Placement, PlanReading } from "../state";
import { uid } from "../state";
import { PLAN_DOOR_M, type PlanRead } from "./reader";

const KIND: Record<"door" | "window", FixedKind> = { door: "doors", window: "windows" };

export function applyPlanRead(s: JourneyState, read: Extract<PlanRead, { ok: true }>, fallbackW = 3.75): Pick<JourneyState, "room" | "placements" | "fixedCounts"> {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  // Size: the reader's proportions are exact; the metres are a first guess from the door until the person types one
  // real measurement on the next screen.
  const widthM = read.scale ? read.scale.width_m : r2(s.room.widthM ?? fallbackW);
  const lengthM = read.scale ? read.scale.length_m : r2(widthM / read.ratio);
  const doors = read.openings.filter((o) => o.type === "door");
  const windows = read.openings.filter((o) => o.type === "window");
  const planRead: PlanReading = {
    ratio: read.ratio,
    shape: read.shape,
    confidence: read.confidence,
    box: read.box,
    rooms: read.rooms.map((r) => r.box),
    picked: read.picked,
    doors: doors.length,
    windows: windows.length,
    guessM: read.scale ? [read.scale.width_m, read.scale.length_m] : undefined,
  };
  // Openings: re-reading replaces what the reader placed before; features the person placed by hand stay.
  const kept = s.placements.filter((p) => p.fromPlan !== "new").map((p) => (p.fromPlan === "placed" ? { ...p, wall: undefined, pos: undefined, fromPlan: undefined } : p));
  const placements: Placement[] = [...kept];
  const counts = { ...s.fixedCounts };
  for (const kind of ["door", "window"] as const) {
    const k = KIND[kind];
    const found = read.openings.filter((o) => o.type === kind).sort((a, b) => a.wall.localeCompare(b.wall) || a.pos - b.pos);
    // counted in step 3 but not yet placed: give them the positions found, in order
    const open = placements.filter((p) => p.kind === k && !p.wall);
    let n = placements.filter((p) => p.kind === k).reduce((m, p) => Math.max(m, p.n), 0);
    for (const o of found) {
      const already = placements.some((p) => p.kind === k && p.wall === o.wall && p.pos != null && Math.abs(p.pos - o.pos) < 6);
      if (already) continue;
      const slot = open.shift();
      if (slot) {
        const i = placements.indexOf(slot);
        placements[i] = { ...slot, wall: o.wall, pos: Math.round(o.pos), fromPlan: "placed" };
      } else {
        placements.push({ id: uid(), kind: k, n: ++n, wall: o.wall, pos: Math.round(o.pos), fromPlan: "new" });
      }
    }
    counts[k] = Math.max(counts[k] ?? 0, placements.filter((p) => p.kind === k).length);
  }
  return {
    room: { ...s.room, input: "plan", widthM, lengthM, confirmed: false, planRead, doorM: read.scale ? PLAN_DOOR_M : s.room.doorM },
    placements,
    fixedCounts: counts,
  };
}
