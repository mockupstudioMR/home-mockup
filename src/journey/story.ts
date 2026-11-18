/** One-line recaps of each finished step, for "Your project so far" and the final page. */
import { PROPERTIES, roomName, stateInfo } from "./data";
import { curRoom, type JourneyState } from "./state";

const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");

export function stepLine(s: JourneyState, step: number): string {
  switch (step) {
    case 1: {
      const prop = PROPERTIES.find((p) => p.id === s.propertyType)?.title.toLowerCase();
      return [roomName(curRoom(s)), prop, s.houseState ? stateInfo(s.houseState).lbl.toLowerCase() : null].filter(Boolean).join(" · ");
    }
    case 2: {
      const pv = s.preview;
      const changed = pv && pv.current > 0 ? pv.versions[pv.current].request : undefined;
      const short = changed ? changed.split(/[.—,]/)[0].trim().toLowerCase() : "";
      return `${s.moodboard?.name ?? "Your"}${short ? `, ${short}` : " direction"}`;
    }
    case 3: {
      const acts = s.activities.slice(0, 2);
      return acts.length ? list(acts) : "Everyday life";
    }
    case 4: {
      const w = (s.room.widthM ?? 3.75).toFixed(2), l = (s.room.lengthM ?? 4.9).toFixed(2);
      return s.layouts.length ? `Layout ${(s.chosenLayout ?? 0) + 1} on a ${w} × ${l} m room` : "Layout not chosen";
    }
    case 5: {
      const ws = Object.values(s.walls);
      const changed = ws.filter((w) => w?.status === "changed").length;
      return ws.length ? `${ws.length} walls, ${changed} changed` : "Walls not reviewed";
    }
    case 6:
      return "List, sizes and to-do ready";
    default:
      return "";
  }
}

export function soFar(s: JourneyState, upto: number): [string, string][] {
  return Array.from({ length: upto }, (_, i) => [String(i + 1), stepLine(s, i + 1)] as [string, string]).filter(([, t]) => t);
}

export { list };
