/**
 * Choices made once for the whole room, on every wall picture: the floor (one floor for the room) and the dining
 * chairs (all alike). Kept in the journey as `showroom.linked`, matched by option name, and written into every
 * picture's picks so confirmed pictures elsewhere know they are outdated.
 */
import type { JourneyState } from "../state";
import { buildModel } from "../showroom3d/model";
import type { Pic, WallScene } from "./runner";

/** A layer's name for an item id (as runner.ts names them). */
export const layerName = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "-");
export type Link = "floor" | "dining-chairs";
export const LINK_NOTE: Record<Link, string> = {
  floor: "One floor for the whole room: changing it here changes it on every wall.",
  "dining-chairs": "All dining chairs change together, on every wall.",
};
/** The layer names of the dining chairs in this room. */
export function diningChairs(s: JourneyState): Set<string> {
  try {
    return new Set(buildModel(s, s.showroom?.edits ?? {}).pieces.filter((p) => p.category === "dchair").map((p) => layerName(p.id)));
  } catch {
    return new Set();
  }
}
export const linkOf = (name: string, chairs: Set<string>): Link | null => (name === "floor" ? "floor" : chairs.has(name) ? "dining-chairs" : null);

/**
 * Sets a room-wide choice (or clears it, with null) and writes it into every picture's picks, so a confirmed
 * picture elsewhere is known to be outdated and every flattened picture uses it.
 */
export function setLinked(p: JourneyState, link: Link, chairs: Set<string>, choice: { name: string; index: number; from: Pic } | null): Partial<JourneyState> {
  const sh = p.showroom ?? { edits: {} };
  const picks = { ...(sh.picks ?? {}) };
  for (const [pic, sc] of Object.entries(sh.scenes ?? {}) as [Pic, WallScene | undefined][]) {
    for (const l of sc?.layers ?? []) {
      const n = layerName(l.id);
      if (linkOf(n, chairs) !== link) continue;
      // matched by name: where that option couldn't be made for this picture, its main option (never another one)
      picks[pic] = { ...(picks[pic] ?? {}), [n]: choice ? Math.max(0, choice.index === 0 ? 0 : l.names.indexOf(choice.name)) : 0 };
    }
  }
  const linked = { ...(sh.linked ?? {}) };
  if (choice) linked[link] = choice; else delete linked[link];
  return { showroom: { ...sh, edits: sh.edits ?? {}, picks, linked } };
}

