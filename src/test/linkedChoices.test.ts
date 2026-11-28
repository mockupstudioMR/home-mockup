import { describe, expect, it } from "vitest";
import { linkOf, setLinked } from "@/journey/wallScenes/linkedChoices";
import { EMPTY, type JourneyState } from "@/journey/state";
import type { WallScene } from "@/journey/wallScenes/runner";

const scene = (layers: { id: string; names: string[] }[]): WallScene => ({ status: "ready", key: "k", at: "", manifestUrl: "m", layers: layers.map((l) => ({ ...l, title: l.id })) });
const floor = (names = ["Walnut planks", "Herringbone parquet", "Light oak planks"]) => ({ id: "floor", names });
const chairs = new Set(["lay-5", "lay-6", "lay-7"]);
const s = {
  ...EMPTY,
  showroom: {
    edits: {},
    scenes: {
      A: scene([floor(), { id: "lay-1", names: ["Sofa", "Green sofa"] }]),
      B: scene([floor(["Walnut planks", "Light oak planks"]), { id: "lay-5", names: ["Spindle · oak", "Black", "Cane"] }, { id: "lay-6", names: ["Spindle · oak", "Black", "Cane"] }]),
      room: scene([floor(), { id: "lay-5", names: ["Spindle · oak", "Black", "Cane"] }, { id: "lay-7", names: ["Spindle · oak", "Black", "Cane"] }]),
    },
    picks: { A: { "lay-1": 1 } },
  },
} as unknown as JourneyState;

describe("one choice for the whole room", () => {
  it("knows the floor and the dining chairs, and nothing else", () => {
    expect(linkOf("floor", chairs)).toBe("floor");
    expect(linkOf("lay-6", chairs)).toBe("dining-chairs");
    expect(linkOf("lay-1", chairs)).toBeNull();
    expect(linkOf("walls", chairs)).toBeNull();
  });

  it("a floor chosen on wall A is the floor on every wall, matched by name; a wall that lacks it keeps its main floor", () => {
    const out = setLinked(s, "floor", chairs, { name: "Herringbone parquet", index: 1, from: "A" });
    expect(out.showroom!.picks!.A).toEqual({ "lay-1": 1, floor: 1 }); // the sofa pick is untouched
    expect(out.showroom!.picks!.room!.floor).toBe(1);
    expect(out.showroom!.picks!.B!.floor).toBe(0); // B's herringbone couldn't be made: never another floor
    expect(out.showroom!.linked!.floor).toEqual({ name: "Herringbone parquet", index: 1, from: "A" });
  });

  it("changing one dining chair changes them all, on every picture", () => {
    const out = setLinked(s, "dining-chairs", chairs, { name: "Cane", index: 2, from: "B" });
    expect(out.showroom!.picks!.B).toMatchObject({ "lay-5": 2, "lay-6": 2 });
    expect(out.showroom!.picks!.room).toMatchObject({ "lay-5": 2, "lay-7": 2 });
    expect(out.showroom!.picks!.A).toEqual({ "lay-1": 1 }); // no chairs on A
  });

  it("going back to the preview clears it for the whole room", () => {
    const chosen = { ...s, ...setLinked(s, "floor", chairs, { name: "Light oak planks", index: 2, from: "C" as never }) } as JourneyState;
    const back = setLinked(chosen, "floor", chairs, null);
    expect(back.showroom!.linked!.floor).toBeUndefined();
    for (const pic of ["A", "B", "room"] as const) expect(back.showroom!.picks![pic]!.floor).toBe(0);
  });
});
