import { describe, it, expect } from "vitest";
import { EMPTY, type JourneyState } from "@/journey/state";
import { composeBuyList } from "@/journey/buylist";

const windows: JourneyState = {
  ...EMPTY,
  placements: [{ kind: "windows", wall: "C" }],
} as unknown as JourneyState;

const curtainsIn = (s: JourneyState) => composeBuyList(s).filter((r) => /curtain/i.test(r.name));

describe("buying list curtains", () => {
  it("adds one curtain line for a room with windows, never two", () => {
    const rows = curtainsIn(windows);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Curtains + track");
  });

  it("keeps a single curtain line even when decor curtains are switched on", () => {
    const s: JourneyState = { ...windows, decor: [{ name: "Curtains", on: true }, { name: "Art & mirror", on: true }] } as JourneyState;
    const rows = curtainsIn(s);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Curtains + track");
    expect(rows[0].status).toBe("Measure first");
  });

  it("still offers decor curtains when the room has no window placement", () => {
    const s: JourneyState = { ...EMPTY, decor: [{ name: "Curtains", on: true }] } as JourneyState;
    const rows = curtainsIn(s);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Curtains");
  });
});
