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
    case 5: {
      const a = s.anchor;
      if (!a) return "Main piece not chosen";
      const colour = (a.material ?? "").split(" ")[0];
      return `${a.shape} ${colour && colour !== a.material ? colour + " " : ""}${a.kind}`;
    }
    case 6: {
      const n = s.moodboard?.palette.length ?? 0;
      const a = s.accent && s.accent.decision !== "skip" ? `, ${s.accent.name.replace(" statement", "").toLowerCase()} accent chair`.replace(" chair accent chair", " accent chair") : "";
      return `${n} materials${a}`;
    }
    case 7: {
      const n = s.lighting?.layers.length ?? 0;
      const metal = s.moodboard?.palette.find((x) => /brass|black|nickel|bronze|copper|steel|chrome/i.test(x.material ?? x.name));
      return n ? `${n} light layers${metal ? ` in ${(metal.material ?? metal.name).split(" ").slice(-1)[0].toLowerCase()}` : ""}` : "Lighting not set";
    }
    case 8: {
      const ws = Object.values(s.walls);
      const changed = ws.filter((w) => w?.status === "changed").length;
      return ws.length ? `${ws.length} walls, ${changed} changed` : "Walls not reviewed";
    }
    default:
      return "";
  }
}

export function soFar(s: JourneyState, upto: number): [string, string][] {
  return Array.from({ length: upto }, (_, i) => [String(i + 1), stepLine(s, i + 1)] as [string, string]).filter(([, t]) => t);
}

export { list };
