import { describe, expect, it } from "vitest";
import { arrange, fallbackGroups, type Opening, type Placed } from "../../supabase/functions/_shared/arrange";
import { DEFAULT_GROUPINGS, DEFAULT_SPECS, groupingsFor, mergeGroupings, mergeSpecs } from "../../supabase/functions/_shared/layoutRules";

const base = { specs: DEFAULT_SPECS, groupings: DEFAULT_GROUPINGS };
const find = (items: Placed[], label: string) => items.filter((i) => i.label.toLowerCase() === label.toLowerCase());
const one = (items: Placed[], label: string) => {
  const f = find(items, label);
  expect(f, label).toHaveLength(1);
  return f[0];
};
const cx = (p: Placed) => p.x + p.w / 2, cy = (p: Placed) => p.y + p.h / 2;
const overlap = (a: Placed, b: Placed) => a.x + 1 < b.x + b.w && b.x + 1 < a.x + a.w && a.y + 1 < b.y + b.h && b.y + 1 < a.y + a.h;

describe("placing a grouping against a wall", () => {
  it("sofa with its back on wall A faces into the room; coffee table 45 cm in front; TV across, facing it", () => {
    const r = arrange({ ...base, W: 480, L: 470, openings: [], groups: [{ key: "tv-lounge", wall: "A", along: 50 }] });
    const sofa = one(r.items, "3-seat sofa"), table = one(r.items, "coffee table"), tv = one(r.items, "tv unit");
    expect(sofa).toMatchObject({ y: 0, w: 220, h: 95, facing: "down" });
    expect(cx(sofa)).toBe(240);
    expect(Math.abs(table.y - (sofa.y + sofa.h) - 45)).toBeLessThanOrEqual(1);
    expect(cx(table)).toBe(240);
    expect(tv).toMatchObject({ facing: "up", w: 160, h: 40 });
    expect(tv.y + tv.h).toBe(470);
    expect(cx(tv)).toBe(240);
  });

  it("the same grouping on a side wall is turned: the sofa's back on wall D, facing right", () => {
    const r = arrange({ ...base, W: 480, L: 470, openings: [], groups: [{ key: "tv-lounge", wall: "D", along: 50 }] });
    const sofa = one(r.items, "3-seat sofa"), tv = one(r.items, "tv unit");
    expect(sofa).toMatchObject({ x: 0, w: 95, h: 220, facing: "right" });
    expect(tv).toMatchObject({ facing: "left", w: 40, h: 160 });
    expect(tv.x + tv.w).toBe(480);
  });

  it("armchairs beside the coffee table turn in towards it", () => {
    const r = arrange({ ...base, W: 520, L: 480, openings: [], groups: [{ key: "conversation", wall: "A", along: 50 }] });
    const chairs = find(r.items, "Armchair").sort((a, b) => a.x - b.x);
    expect(chairs).toHaveLength(2);
    expect(chairs[0].facing).toBe("right");
    expect(chairs[1].facing).toBe("left");
  });

  it("slides along the wall to keep a door clear", () => {
    const doors: Opening[] = [{ kind: "doors", wall: "A", pos: 50 }];
    const r = arrange({ ...base, W: 600, L: 470, openings: doors, groups: [{ key: "tv-lounge", wall: "A", along: 50 }] });
    const sofa = one(r.items, "3-seat sofa");
    expect(sofa.y).toBe(0);
    // the door strip is 250–350 cm along wall A
    expect(sofa.x + sofa.w <= 250 || sofa.x >= 350).toBe(true);
  });

  it("moves to another wall when the asked-for wall can't take it", () => {
    const r = arrange({ ...base, W: 480, L: 470, openings: [{ kind: "doors", wall: "A", pos: 30 }, { kind: "doors", wall: "A", pos: 75 }], groups: [{ key: "tv-lounge", wall: "A", along: 50 }] });
    expect(one(r.items, "3-seat sofa").facing).not.toBe("down");
  });
});

describe("beds, tables and kept pieces", () => {
  it("bed: head on the wall, a nightstand on each side, never with its head under a window", () => {
    const r = arrange({ ...base, W: 420, L: 400, openings: [{ kind: "windows", wall: "A", pos: 50 }], groups: [{ key: "bed-set", wall: "A", along: 50 }] });
    const bed = one(r.items, "bed");
    expect(bed.facing).not.toBe("down"); // not against wall A, where the window is
    const stands = find(r.items, "nightstand");
    expect(stands).toHaveLength(2);
    for (const n of stands) expect(n.facing).toBe(bed.facing);
  });

  it("dining chairs face the table from both sides", () => {
    const r = arrange({ ...base, W: 400, L: 360, openings: [], groups: [{ key: "dining-4" }] });
    const table = one(r.items, "dining table");
    const chairs = find(r.items, "dining chair");
    expect(chairs).toHaveLength(4);
    for (const c of chairs) {
      if (c.facing === "down") expect(cy(c)).toBeLessThan(cy(table));
      else if (c.facing === "up") expect(cy(c)).toBeGreaterThan(cy(table));
      else throw new Error(`chair faces ${c.facing}`);
    }
  });

  it("a kept piece with a fixed spot stays on its wall, and groups go around it", () => {
    const r = arrange({ ...base, W: 480, L: 470, openings: [], keep: [{ name: "Upright piano", w: 150, d: 60, wall: "A", along: 50, fixedSpot: true }], groups: [{ key: "tv-lounge", wall: "A", along: 50 }] });
    const piano = one(r.items, "Upright piano");
    expect(piano).toMatchObject({ y: 0, kind: "keep", facing: "down" });
    const sofa = one(r.items, "3-seat sofa");
    expect(overlap(piano, sofa)).toBe(false);
  });

  it("a kept piece that is a grouping's main piece gets the grouping's other pieces, not a second copy", () => {
    const r = arrange({ ...base, W: 375, L: 490, openings: [], keep: [{ name: "Upright piano", w: 150, d: 60, wall: "B", fixedSpot: true }], groups: [{ key: "piano", wall: "A" }] });
    expect(r.items.filter((i) => /piano$/i.test(i.label))).toHaveLength(1);
    const piano = one(r.items, "Upright piano"), bench = one(r.items, "Piano bench");
    expect(piano).toMatchObject({ kind: "keep", facing: "left", x: 315 });
    expect(bench.facing).toBe("right");
  });

  it("says when a grouping had to move to another wall", () => {
    const r = arrange({ ...base, W: 375, L: 490, openings: [], keep: [{ name: "Upright piano", w: 150, d: 60, wall: "B" }], groups: [{ key: "conversation", wall: "A", along: 50 }] });
    expect(r.moved).toEqual([{ name: "Sofa with two armchairs", from: "A", to: expect.any(String) }]);
  });

  it("no two groups overlap, and nothing sits in a door swing", () => {
    const openings: Opening[] = [{ kind: "doors", wall: "C", pos: 20 }, { kind: "windows", wall: "B", pos: 50 }];
    const r = arrange({ ...base, W: 520, L: 620, openings, groups: [{ key: "tv-lounge", wall: "A" }, { key: "dining-4" }, { key: "reading-corner", wall: "B" }] });
    const solid = r.items.filter((i) => i.kind !== "rug");
    for (const a of solid) for (const b of solid) if (a !== b && a.group !== b.group) expect(overlap(a, b), `${a.label} / ${b.label}`).toBe(false);
    const door = { x: 104 - 50, y: 520, w: 100, h: 100 };
    for (const a of solid) expect(a.x + 1 < door.x + door.w && door.x + 1 < a.x + a.w && a.y + 1 < door.y + door.h && door.y + 1 < a.y + a.h, a.label).toBe(false);
  });

  it("in a small room optional pieces are left out first; a grouping that can't fit at all is reported", () => {
    const r = arrange({ ...base, W: 250, L: 240, openings: [], groups: [{ key: "tv-lounge", wall: "A" }, { key: "dining-6" }] });
    expect(find(r.items, "3-seat sofa")).toHaveLength(1);
    expect(r.left_out).toContain("Table for six");
  });
});

describe("the size and grouping tables", () => {
  it("rows from the database override the defaults, and new ones are added", () => {
    const specs = mergeSpecs([{ name: "3-seat sofa", variant: "standard", width_cm: 230, depth_cm: 100 }, { name: "chaise", variant: "standard", width_cm: 170, depth_cm: 80, kind: "sofa", facing: "wall" }]);
    expect(specs.find((s) => s.name === "3-seat sofa")).toMatchObject({ width_cm: 230, depth_cm: 100, facing: "wall", kind: "sofa" });
    expect(specs.find((s) => s.name === "chaise")).toMatchObject({ facing: "wall" });
  });

  it("an admin can switch a grouping off", () => {
    const gs = mergeGroupings([{ ...DEFAULT_GROUPINGS[0], is_active: false }]);
    expect(gs.find((g) => g.key === DEFAULT_GROUPINGS[0].key)).toBeUndefined();
  });

  it("groupings are chosen by room and activity, and placed without the AI", () => {
    const gs = groupingsFor(DEFAULT_GROUPINGS, "living-room", ["Play piano", "Relax"]);
    expect(gs[0].activities.some((a) => a === "Play piano" || a === "Relax")).toBe(true);
    const req = fallbackGroups(gs, [{ kind: "doors", wall: "C", pos: 20 }], 480, 470);
    expect(req.length).toBeGreaterThan(1);
    expect(req.filter((q) => q.key === "tv-lounge" || q.key === "conversation")).toHaveLength(1); // one sofa
    const r = arrange({ ...base, W: 480, L: 470, openings: [{ kind: "doors", wall: "C", pos: 20 }], groups: req });
    expect(find(r.items, "Upright piano")).toHaveLength(1);
  });
});

describe("rows typed into the size table", () => {
  it("get a kind and facing from their name when they have none", () => {
    const specs = mergeSpecs([{ name: "Corner sofa", variant: "standard", width_cm: 260, depth_cm: 200 }, { name: "Bedside table", variant: "standard", width_cm: 45, depth_cm: 40 }, { name: "King bed", variant: "standard", width_cm: 180, depth_cm: 200 }]);
    expect(specs.find((s) => s.name === "corner sofa")).toMatchObject({ kind: "sofa", facing: "wall" });
    expect(specs.find((s) => s.name === "bedside table")).toMatchObject({ kind: "storage", facing: "wall" });
    expect(specs.find((s) => s.name === "king bed")).toMatchObject({ kind: "bed", facing: "head_wall" });
  });
});
