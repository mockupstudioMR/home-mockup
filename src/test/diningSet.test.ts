import { describe, expect, it } from "vitest";
import { EMPTY, type JourneyState, type LayoutItem } from "@/journey/state";
import { nearestWall, outlineFor, seatSets, wallsShowing } from "@/journey/wallOutline";

// a dining table in the right half of the room with two chairs above and two below it
const table: LayoutItem = { label: "Dining table", kind: "dining table", x: 55, y: 40, w: 30, h: 18 };
const chairs: LayoutItem[] = [
  { label: "Dining chair", kind: "chair", x: 60, y: 31, w: 9, h: 8 },
  { label: "Dining chair", kind: "chair", x: 72, y: 31, w: 9, h: 8 },
  { label: "Dining chair", kind: "chair", x: 60, y: 59, w: 9, h: 8 },
  { label: "Dining chair", kind: "chair", x: 72, y: 59, w: 9, h: 8 },
];
const sofa: LayoutItem = { label: "Sofa", kind: "sofa", x: 5, y: 2, w: 35, h: 15 };
const items = [table, ...chairs, sofa];

describe("a table and its chairs", () => {
  it("are one set; other pieces are not part of it", () => {
    const sets = seatSets(items);
    expect(sets.get(0)).toEqual([0, 1, 2, 3, 4]);
    expect(sets.get(3)?.[0]).toBe(0);
    expect(sets.has(5)).toBe(false);
  });
  it("show together on every wall any of them faces", () => {
    const walls = wallsShowing(items);
    const all = new Set(items.slice(0, 5).map(nearestWall));
    for (let i = 0; i < 5; i++) expect(new Set(walls[i])).toEqual(all);
    expect(walls[5]).toEqual([nearestWall(sofa)]);
  });
  it("draw the whole table between its chairs on the wall facing its end, chairs in profile", () => {
    const s = { ...EMPTY, room: { ...EMPTY.room, widthM: 4, lengthM: 5, ceilingM: 2.6 }, layouts: [{ id: "l", name: "L", items, zones: [], notes: [] }], chosenLayout: 0 } as JourneyState;
    const o = outlineFor(s, "B", { items: [] } as never);
    const t = o.pieces.find((p) => p.kind === "dining table")!;
    const seats = o.pieces.filter((p) => p.set);
    expect(t).toBeTruthy();
    expect(seats.map((p) => p.view).sort()).toEqual(["side-left", "side-right"]); // the two behind are hidden
    expect(o.pieces.indexOf(t)).toBeLessThan(o.pieces.indexOf(seats[0]));
    const left = seats.find((p) => p.view === "side-left")!;
    expect(left.x + left.w / 2).toBeLessThan(t.x + t.w / 2);
  });
});
