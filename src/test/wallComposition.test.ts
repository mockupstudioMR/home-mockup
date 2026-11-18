import { describe, expect, it } from "vitest";
import { canvasFor, composeWall, defaultSpec, pickPreset, PRESETS, specFor } from "@/journey/wallScenes/composition";
import type { ShowroomModel } from "@/journey/showroom3d/model";

describe("wall canvases", () => {
  it("draws a wall on the preset closest to its own shape", () => {
    expect(pickPreset(490, 270).key).toBe("16x9");
    expect(pickPreset(375, 270).key).toBe("4x3");
    expect(pickPreset(800, 270).key).toBe("3x1");
  });
  it("fits the whole wall at one scale, centred, on a native size", () => {
    const c = canvasFor(490, 270);
    expect(c.width % 16).toBe(0);
    expect(c.height % 16).toBe(0);
    expect(490 * c.pxPerCm).toBeLessThanOrEqual(c.width + 0.5);
    expect(270 * c.pxPerCm).toBeLessThanOrEqual(c.height + 0.5);
    expect(Math.max(490 * c.pxPerCm / c.width, 270 * c.pxPerCm / c.height)).toBeCloseTo(1, 3);
    expect(c.wallX * 2 + Math.round(490 * c.pxPerCm)).toBeGreaterThanOrEqual(c.width - 1);
  });
  it("only uses sizes the image models draw well", () => {
    for (const p of PRESETS) expect(Math.max(p.width, p.height)).toBeLessThanOrEqual(2048);
  });
});

describe("rules per layout box", () => {
  it("knows how each kind of piece is drawn", () => {
    expect(defaultSpec("round mirror").mount).toBe("wall");
    expect(defaultSpec("coffee table", "table").depthBand).toBeGreaterThan(defaultSpec("3-seat sofa", "sofa").depthBand);
    expect(defaultSpec("floor lamp").layerGroup).toBe("lighting");
    expect(defaultSpec("rug", "rug").inWallPictures).toBe(false);
  });
  it("uses the stored rule for a piece's box when there is one", () => {
    const stored = { ...defaultSpec("curved sofa", "sofa"), specId: "s-curved", minPx: 200 };
    expect(specFor("sofa", "Sofa", [stored], "Curved sofa").specId).toBe("s-curved");
    expect(specFor("sofa", "Sofa", [stored], "Track-arm sofa").specId).toBeUndefined();
  });
});

describe("a wall's composition", () => {
  const m = {
    room: { w: 4.9, l: 3.75, h: 2.7, example: false },
    pieces: [
      { id: "sofa", name: "Sofa", category: "sofa", shapeName: "Track-arm sofa" },
      { id: "table", name: "Coffee table", category: "table", shapeName: "Round" },
    ],
    extras: [{ id: "mirror", kind: "mirror", name: "Mirror" }],
  } as unknown as ShowroomModel;
  const c = canvasFor(490, 270);
  const comp = composeWall(m, "A", { sofa: [20, 60, 45, 30], table: [30, 80, 25, 15], mirror: [30, 20, 20, 25], walls: [0, 0, 100, 100] }, c, []);
  const at = (k: string) => comp.items.find((i) => i.key === k)!;

  it("draws pieces further forward over those behind", () => {
    expect(at("walls").zOrder).toBeLessThan(at("mirror").zOrder);
    expect(at("sofa").zOrder).toBeLessThan(at("table").zOrder);
  });
  it("places every piece in pixels and centimetres", () => {
    expect(at("sofa").x).toBe(Math.round(0.2 * c.width));
    expect(at("sofa").widthCm).toBe(Math.round(at("sofa").w / c.pxPerCm));
    expect(at("table").bottomCm).toBeLessThan(at("sofa").bottomCm + 1);
  });
  it("puts each hotspot where its rule says, inside the piece", () => {
    const s = at("sofa");
    expect(s.hotspot.x).toBe(Math.round(s.x + s.w / 2));
    expect(s.hotspot.y).toBeGreaterThan(s.y);
    expect(s.hotspot.y).toBeLessThan(s.y + s.h);
  });
});
