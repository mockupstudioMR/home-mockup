import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { LIBRARY, type Category } from "@/journey/showroom3d/library";
import type { PieceModel, ShowroomModel } from "@/journey/showroom3d/model";
import { buildPiece, buildScene, viewFor } from "@/journey/showroom3d/scene";

const style = { wood: "#8A6440", metal: "#B08D57", accent: "#5E4268", light: "#F1EBE2", seating: "#8C8577" };
const piece = (category: Category, shape: string, over: Partial<PieceModel> = {}): PieceModel => ({
  id: `${category}-${shape}`, name: category, category, kept: false, cx: 2, cz: 2, w: 1.6, d: 0.8, h: 0.8, rot: 0, wall: "A", onWall: true, fromCm: 0, toCm: 160,
  color: "#5E2B4F", colorFrom: "", shape, shapeName: shape, described: "", matched: false, edited: false, fabric: "velvet", ...over,
});
const room = (pieces: PieceModel[], w = 3.75, l = 4.9): ShowroomModel => ({
  style: "Test", room: { w, l, h: 2.7, example: false },
  openings: [
    { id: "d", wall: "D", kind: "door", at: 1.1, width: 1, sill: 0, head: 2.2, arched: true },
    { id: "d2", wall: "B", kind: "door", at: 1.1, width: 0.9, sill: 0, head: 2.1, arched: false },
    { id: "w", wall: "C", kind: "window", at: 1.8, width: 1.4, sill: 0.9, head: 2.3, arched: false },
  ],
  radiators: [{ wall: "C", at: 1.8, width: 1.2 }],
  pieces,
  extras: [
    { id: "c", kind: "curtains", name: "Curtains", wall: "C", at: 0, y: 0, color: "#5E2B4F", colorFrom: "", edited: false },
    { id: "a", kind: "art", name: "Art", wall: "A", at: 2, y: 1.5, color: "#1F5C4A", colorFrom: "", edited: false },
    { id: "m", kind: "mirror", name: "Mirror", wall: "D", at: 3, y: 1.5, color: "#B08D57", colorFrom: "", edited: false },
    { id: "p", kind: "pendant", name: "Pendant", wall: "A", at: 0, y: 0, color: "#B08D57", colorFrom: "", edited: false },
  ],
  surfaces: { wall: "#B9B3AA", floor: "#4A3226", wood: "#4A3226", metal: "#B08D57", seating: "#5E2B4F", accent: "#1F5C4A", light: "#E6E2DC", door: "#1F5C4A" },
  surfaceList: [], palette: [], noPalette: false,
});

describe("the 3D room", () => {
  it("draws every shape in the library, fitted to the layout's footprint", () => {
    for (const [cat, shapes] of Object.entries(LIBRARY) as [Category, { id: string }[]][]) {
      for (const sh of shapes) {
        const g = buildPiece(piece(cat, sh.id), style, false);
        const bb = new THREE.Box3().setFromObject(g), size = bb.getSize(new THREE.Vector3());
        expect(Number.isFinite(size.x + size.y + size.z), `${cat}/${sh.id}`).toBe(true);
        // no wider or deeper than its footprint (a hair of tolerance for rounding)
        expect(size.x, `${cat}/${sh.id} width`).toBeLessThanOrEqual(1.6 + 0.02);
        expect(size.z, `${cat}/${sh.id} depth`).toBeLessThanOrEqual(0.8 + 0.02);
        expect(bb.min.y, `${cat}/${sh.id} stands on the floor`).toBeGreaterThanOrEqual(-0.001);
        expect(g.position.x).toBe(2);
      }
    }
  });

  it("turns a piece to face the way the layout says", () => {
    const g = buildPiece(piece("sofa", "straight", { rot: Math.PI / 2, w: 2.2, d: 0.9 }), style, false);
    const size = new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3());
    expect(size.z).toBeCloseTo(2.2, 1); // its width now runs along z
    expect(size.x).toBeCloseTo(0.9, 1);
  });

  it("builds a whole room of any size, by day and in the evening", () => {
    const all = (Object.keys(LIBRARY) as Category[]).map((c, i) => piece(c, LIBRARY[c][0].id, { cx: 0.6 + (i % 4), cz: 0.6 + Math.floor(i / 4) }));
    for (const [w, l] of [[3.75, 4.9], [6.2, 3.1], [2.4, 2.4]]) {
      for (const eve of [false, true]) {
        const b = buildScene(room(all, w, l), eve);
        let meshes = 0, bad = 0;
        b.scene.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; meshes++; const p = m.geometry.attributes.position.array; for (let i = 0; i < p.length; i++) if (!Number.isFinite(p[i])) { bad++; break; } });
        expect(meshes).toBeGreaterThan(100);
        expect(bad).toBe(0);
        expect(b.sun.intensity > 0).toBe(!eve);
      }
    }
  });

  it("tags the walls and the pieces so a tap finds them", () => {
    const b = buildScene(room([piece("sofa", "curved")]), false);
    const ids = new Set<string>(), walls = new Set<string>();
    b.scene.traverse((o) => { if (o.userData.id) ids.add(o.userData.id); if (o.userData.wall) walls.add(o.userData.wall); });
    expect([...walls].sort()).toEqual(["A", "B", "C", "D"]);
    for (const id of ["walls", "floor", "doors", "sofa-curved", "c", "a", "m", "p"]) expect(ids.has(id), id).toBe(true);
  });

  it("frames each view on the room's own size", () => {
    const r = { w: 6, l: 3, h: 2.6, example: false };
    expect(viewFor("A", r).t).toEqual([3, 1.28, 0]);
    expect(viewFor("doll", r).hide).toEqual(["B", "C"]);
    expect(viewFor("B", r).p[0]).toBeLessThan(1);
  });
});
