/** One-line recaps of each finished step, for "Your project so far" and the final page. */
import { PROPERTIES, roomName, stateInfo } from "./data";
import type { JourneyState } from "./state";

const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");

export function stepLine(s: JourneyState, step: number): string {
  switch (step) {
    case 1: {
      const prop = PROPERTIES.find((p) => p.id === s.propertyType)?.title.toLowerCase();
      return [roomName(s.startRoom), prop, s.houseState ? stateInfo(s.houseState).lbl.toLowerCase() : null].filter(Boolean).join(" · ");
    }
    case 2: {
      const pv = s.preview;
      const changed = pv && pv.current > 0 ? pv.versions[pv.current].request : undefined;
      const short = changed ? changed.split(/[.—,]/)[0].trim().toLowerCase() : "";
      return `${s.moodboard?.name ?? "Your"}${short ? `, ${short}` : " direction"}`;
    }
    case 3: {
      const acts = s.activities.slice(0, 1);
      const special = s.priorities.find((p) => /^Space to |^A |^Room to |^Clear /.test(p));
      const what = [acts[0], special ? special.replace(/^Space to play the /, "").replace(/^(Space to|A|Room to|Clear) /, "") : null].filter(Boolean).join(" + ");
      const keep = s.keeping.length ? `keeping the ${list(s.keeping.map((k) => k.name.toLowerCase().replace(/^upright /, "")))}` : "nothing kept";
      return `${what || "Everyday life"}, ${keep}`;
    }
    case 4: {
      const w = (s.room.widthM ?? 3.75).toFixed(2), l = (s.room.lengthM ?? 4.9).toFixed(2);
      return s.layouts.length ? `Layout ${(s.chosenLayout ?? 0) + 1} on a ${w} × ${l} m room` : "Layout not chosen";
    }
    default:
      return "";
  }
}

export function soFar(s: JourneyState, upto: number): [string, string][] {
  return Array.from({ length: upto }, (_, i) => [String(i + 1), stepLine(s, i + 1)] as [string, string]).filter(([, t]) => t);
}

export { list };
