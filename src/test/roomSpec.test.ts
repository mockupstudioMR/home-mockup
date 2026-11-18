import { describe, it, expect, vi, beforeEach } from "vitest";

const maybeSingle = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => maybeSingle() }) }) }),
  },
}));

import {
  fromLegacySession,
  loadActiveRoomSpec,
  setActiveRoomId,
  toLegacyFloorPlanContext,
} from "@/services/roomSpec";
import { emptyRoomSpec, ROOM_SPEC_VERSION, type RoomSpec } from "@/types/roomSpec";

describe("fromLegacySession", () => {
  beforeEach(() => sessionStorage.clear());

  it("returns null when no legacy data is cached", () => {
    expect(fromLegacySession()).toBeNull();
  });

  it("ignores corrupt JSON instead of throwing", () => {
    sessionStorage.setItem("floor_plan_context", "{not json");
    expect(fromLegacySession()).toBeNull();
  });

  it("maps the floor plan context, falling back to the old `position` field", () => {
    sessionStorage.setItem(
      "floor_plan_context",
      JSON.stringify({
        shape: "l-shape",
        dimensions: { width: 4, length: 5 },
        roomType: "bedroom",
        furnitureItems: ["bed"],
        walls: [
          { wall: "N", openings: [{ type: "window", position: 30 }, { type: "door" }] },
          { wall: "E", surface: "brick", openings: [{ type: "door", position_pct: 80 }] },
        ],
        style: "japandi",
        layout: { name: "Calm", items: [] },
        feedback: [{ item: "bed", agreed: true }],
      }),
    );

    const spec = fromLegacySession()!;
    expect(spec.shape).toBe("l-shape");
    expect(spec.room_type).toBe("bedroom");
    expect(spec.furniture.selectedItems).toEqual(["bed"]);
    expect(spec.walls).toEqual([
      {
        id: "N",
        surface: "plain",
        openings: [
          { type: "window", position_pct: 30 },
          { type: "door", position_pct: 50 },
        ],
      },
      { id: "E", surface: "brick", openings: [{ type: "door", position_pct: 80 }] },
    ]);
    expect(spec.style.preference).toBe("japandi");
    expect(spec.layout).toEqual({
      name: "Calm",
      description: "",
      items: [],
      feedback: [{ item: "bed", agreed: true }],
    });
  });

  it("fills style fields from the quiz cache", () => {
    sessionStorage.setItem(
      "quiz_data_cache",
      JSON.stringify({ stylePreference: "boho", colorPalette: "warm", roomType: "kitchen", sourceImageUrl: "u" }),
    );
    const spec = fromLegacySession()!;
    expect(spec.style).toMatchObject({ preference: "boho", colorPalette: "warm", referenceImageUrl: "u" });
    expect(spec.room_type).toBe("kitchen");
  });

  it("round-trips walls and layout through the legacy mirror", () => {
    const spec: RoomSpec = {
      ...emptyRoomSpec(),
      shape: "rectangle",
      dimensions: { width: 3 },
      walls: [{ id: "S", surface: "wood", openings: [{ type: "balcony", position_pct: 40 }] }],
      layout: { name: "A", description: "d", items: [{ label: "sofa", x: 1, y: 2, w: 3, h: 4 }] },
    };
    toLegacyFloorPlanContext(spec);
    const back = fromLegacySession()!;
    expect(back.walls).toEqual(spec.walls);
    expect(back.layout).toMatchObject({ name: "A", description: "d", items: spec.layout!.items });
  });
});

describe("loadActiveRoomSpec", () => {
  beforeEach(() => {
    sessionStorage.clear();
    maybeSingle.mockReset();
  });

  it("returns null without an active room id", async () => {
    expect(await loadActiveRoomSpec()).toBeNull();
    expect(maybeSingle).not.toHaveBeenCalled();
  });

  it("maps a DB row with defaults for missing JSON fields", async () => {
    setActiveRoomId("room-1");
    maybeSingle.mockResolvedValue({
      data: {
        id: "room-1",
        user_id: "u1",
        name: "Living",
        room_type: "living-room",
        shape: "rectangle",
        dimensions: { width: 4 },
        custom_walls: null,
        walls: [],
        style: { preference: "modern" },
        furniture: {},
        layout: null,
        schema_version: 1,
        created_at: "c",
        updated_at: "u",
      },
      error: null,
    });

    const spec = await loadActiveRoomSpec();
    expect(spec).toMatchObject({
      id: "room-1",
      custom_walls: undefined,
      layout: undefined,
      style: { preference: "modern", colorPalette: "neutral", budgetFeel: "mid-range", mustHaveElements: [] },
      furniture: { selectedItems: [] },
      schema_version: ROOM_SPEC_VERSION,
    });
    // cached for the next read
    maybeSingle.mockReset();
    expect((await loadActiveRoomSpec())?.id).toBe("room-1");
    expect(maybeSingle).not.toHaveBeenCalled();
  });
});
