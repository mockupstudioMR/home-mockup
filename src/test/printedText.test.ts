import { describe, expect, it } from "vitest";
import { isDimension, printedForBox, type PlanText } from "@/journey/plan/printedText";
import { printedForRoom } from "@/journey/plan/apply";
import { readWritten } from "../../supabase/functions/_shared/dimensions";

// What text recognition read on a real test plan (1178 × 900 px): a bedroom with "4.83" on a dimension line above
// it and "22.9 m2" inside it, and an empty room to its right.
const W = 1178, H = 900;
const t = (text: string, x0: number, y0: number, x1: number, y1: number, conf = 90, turned = false): PlanText => ({ text, x0: x0 / W, y0: y0 / H, x1: x1 / W, y1: y1 / H, conf, turned });
const texts = [t("4.83", 474, 153, 513, 167, 93), t("22.9 m2", 425, 518, 506, 534, 82), t("7", 614, 317, 673, 346, 26)];
const bedroom = [268 / W, 268 / H, 737 / W, 726 / H];
const sideRoom = [751 / W, 268 / H, 931 / W, 726 / H];

describe("sizes printed on the plan, read as text", () => {
  it("takes the dimension above the room as its width and the area inside it", () => {
    expect(printedForBox(texts, bedroom)).toMatchObject({ width_text: "4.83", area_text: "22.9 m2" });
    expect(readWritten(printedForBox(texts, bedroom))).toEqual({ width: 4.83, area: 22.9 });
  });

  it("doesn't give a neighbour the bedroom's numbers", () => {
    expect(printedForBox(texts, sideRoom)).toBeUndefined();
  });

  it("reads a sideways dimension beside the room as its length", () => {
    const side = [...texts, t("4.74", 160, 470, 178, 520, 88, true)];
    expect(printedForBox(side, bedroom)).toMatchObject({ width_text: "4.83", length_text: "4.74" });
  });

  it("ignores low-confidence text", () => {
    expect(printedForBox([t("4.83", 474, 153, 513, 167, 30)], bedroom)).toBeUndefined();
  });

  it("the text reading wins over the AI, and fills what the AI missed", () => {
    const room = { wallPhotos: [], planText: texts, printedRooms: [{ x_pct: 40, y_pct: 55, width_text: "4,88", length_text: "4,70" }] };
    expect(printedForRoom(room, bedroom, true)).toEqual({ width: 4.83, length: 4.7, area: 22.9 });
  });

  it("an AI reading without positions counts only for the room first read", () => {
    const room = { wallPhotos: [], aiWritten: { width: 4.83 } };
    expect(printedForRoom(room, sideRoom, true)).toEqual({ width: 4.83 });
    expect(printedForRoom(room, sideRoom, false)).toBeUndefined();
  });
});

describe("what counts as a printed dimension", () => {
  it.each(["4.83", "3,75", "3,75 m", "375", "4900 mm", "12'6\"", "ca. 3,75", "1,20 + 2,55"])("%s is a dimension", (x) => expect(isDimension(x)).toBe(true));
  it.each(["7", "2,", "2722277272277", "—_3", "©2227)", "22.9 m2", "D1"])("%s is not", (x) => expect(isDimension(x)).toBe(false));

  it("stray digits from wall hatching are never taken as a size", () => {
    // as read on the test plan: "722" and "2," are the left wall's hatching, "=5" a door swing
    const junk = [t("2,", 252, 260, 267, 283, 59, true), t("7", 289, 728, 310, 742, 78, true), t("722", 252, 433, 267, 470, 70, true), t("=5", 540, 480, 547, 496, 63, true)];
    expect(printedForBox([...texts, ...junk], bedroom)).toEqual({ width_text: "4.83", length_text: undefined, pair_text: undefined, area_text: "22.9 m2" });
  });
});
