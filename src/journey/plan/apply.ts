/** Turn what the plan reader measured into the room's size and the doors and windows on its walls. */
import type { FixedKind, JourneyState, Placement, PlanReading } from "../state";
import { uid } from "../state";
import { PLAN_DOOR_M, type PlanRead } from "./reader";
import { printedForBox } from "./printedText";
import { mergeSize, pickPrinted, readWritten, type PrintedRoom, type Written } from "../../../supabase/functions/_shared/dimensions";

/**
 * The sizes printed for the room inside `box` (its outline on the plan, 0–1), from every room's printed sizes.
 * Undefined when nothing is printed for that room, so another room's numbers are never used.
 */
export function writtenFor(rooms: PrintedRoom[] | undefined, box: readonly number[] | undefined): Written | undefined {
  const w = readWritten(pickPrinted(rooms, box));
  return Object.keys(w).length ? w : undefined;
}

/**
 * Everything known to be printed for the room inside `box`: the text read in the browser (exactly what is printed
 * at that spot, so it wins) and the AI's reading (fills what the text reading missed). An AI reading without room
 * positions only counts for the room first read, never for a room tapped later.
 */
export function printedForRoom(room: JourneyState["room"], box: readonly number[] | undefined, firstRoom: boolean): Written | undefined {
  const ai = room.printedRooms ? writtenFor(room.printedRooms, box) : firstRoom ? room.aiWritten : undefined;
  const ocr = readWritten(printedForBox(room.planText, box));
  const w = { ...(ai ?? {}), ...ocr };
  return Object.keys(w).length ? w : undefined;
}

const KIND: Record<"door" | "window", FixedKind> = { door: "doors", window: "windows" };

export function applyPlanRead(s: JourneyState, read: Extract<PlanRead, { ok: true }>, fallbackW = 3.75, written?: Written): Pick<JourneyState, "room" | "placements" | "fixedCounts"> {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  // Size: the reader's proportions are exact; the metres are a first guess from the door until the person types one
  // real measurement on the next screen.
  // without a door scale the width stays as it was, unless it was printed for the room read before
  const widthM = read.scale ? read.scale.width_m : r2((s.room.sizeSource ? undefined : s.room.widthM) ?? fallbackW);
  const lengthM = read.scale ? read.scale.length_m : r2(widthM / read.ratio);
  const doors = read.openings.filter((o) => o.type === "door");
  const windows = read.openings.filter((o) => o.type === "window");
  const planRead: PlanReading = {
    ratio: read.ratio,
    shape: read.shape,
    confidence: read.confidence,
    box: read.box,
    // an outline the person set keeps the rooms found on the first reading, to tap later
    rooms: read.picked === "box" ? s.room.planRead?.rooms ?? [] : read.rooms.map((r) => r.box),
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
    room: { ...s.room, input: "plan", ...withWritten({ widthM, lengthM }, written), planRead, doorM: read.scale ? PLAN_DOOR_M : s.room.doorM },
    placements,
    fixedCounts: counts,
  };
}

/**
 * The room size once the sizes printed on the plan are known: printed numbers overrule the estimate side by side,
 * and only what isn't printed stays estimated (from the drawing's proportions or a printed area).
 * Confirmed only when neither side is an estimate.
 */
export function withWritten(estimate: { widthM: number; lengthM: number }, written?: Written): Pick<JourneyState["room"], "widthM" | "lengthM" | "confirmed" | "written" | "sizeSource"> {
  if (!written || !Object.keys(written).length) return { ...estimate, confirmed: false, written: undefined, sizeSource: undefined };
  const size = mergeSize(written, { width: estimate.widthM, length: estimate.lengthM });
  return {
    widthM: size.width,
    lengthM: size.length,
    confirmed: size.source.width !== "estimated" && size.source.length !== "estimated",
    written,
    sizeSource: size.source,
  };
}

type Source = NonNullable<JourneyState["room"]["sizeSource"]>;
export type ScaleRef = "Wall A length" | "Wall B length" | "Door width";

/**
 * A measurement typed in the "A measurement you know" box, applied to the room. Sides printed on the plan overrule
 * any reference: the other wall or the door width only rescales the sides that aren't printed. Typing a wall's own
 * length is a correction of that wall, so it replaces that side even when it was printed.
 */
export function fromReference(
  room: { widthM: number; lengthM: number; doorM: number; sizeSource?: Source },
  ref: ScaleRef,
  v: number,
): { widthM: number; lengthM: number; doorM?: number; sizeSource?: Source } {
  const r2 = (n: number) => +n.toFixed(2);
  const { widthM: w, lengthM: l, doorM, sizeSource: src } = room;
  const printedW = src?.width === "written", printedL = src?.length === "written";
  const typed = ref === "Wall A length" ? "width" : ref === "Wall B length" ? "length" : null;
  const keep = (side: "width" | "length") => (src?.[side] === "written" && typed !== side ? "written" : "estimated");
  const sizeSource: Source | undefined = keep("width") === "written" || keep("length") === "written" ? { width: keep("width"), length: keep("length") } : undefined;
  if (ref === "Wall A length") return { widthM: v, lengthM: printedL ? l : r2(v * (l / w)), sizeSource };
  if (ref === "Wall B length") return { widthM: printedW ? w : r2(v * (w / l)), lengthM: v, sizeSource };
  return { widthM: printedW ? w : r2((w * v) / doorM), lengthM: printedL ? l : r2((l * v) / doorM), doorM: v, sizeSource };
}
