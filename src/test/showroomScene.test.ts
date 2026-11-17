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

describe("guide pictures for the wall photographs", () => {
  it("knows where each piece is in a wall's picture", async () => {
    const { screenBox } = await import("@/journey/showroom3d/scene");
    const m = room([piece("sofa", "curved", { cx: 1.9, cz: 0.6, w: 2.4, d: 0.9 }), piece("table", "oval", { id: "behind", cx: 1.9, cz: 4.8, w: 1, d: 0.6 })]);
    const b = buildScene(m, false), c = viewFor("A", m.room, 1.5);
    const cam = new THREE.PerspectiveCamera(c.f, 1.5, 0.08, 80);
    cam.position.set(c.p[0], c.p[1], c.p[2]); cam.lookAt(c.t[0], c.t[1], c.t[2]); cam.updateMatrixWorld();
    const sofa = b.scene.children.find((o) => o.userData.id === "sofa-curved")!;
    const box = screenBox(sofa, cam)!;
    expect(box[0]).toBeGreaterThan(10);
    expect(box[0] + box[2]).toBeLessThan(90);
    expect(box[1] + box[3]).toBeGreaterThan(55); // stands low in the picture
    expect(box[2]).toBeGreaterThan(30); // 2.4 m of a 3.75 m wall
    const behind = b.scene.children.find((o) => o.userData.id === "behind")!;
    expect(screenBox(behind, cam)).toBeNull(); // behind the camera
  });
});

describe("the guide is the wall's outline, straight on", () => {
  it("frames exactly the wall, left to right as seen from inside", async () => {
    const { elevationCamera, screenBox } = await import("@/journey/showroom3d/scene");
    const sofa = piece("sofa", "straight", { cx: 2.3, cz: 0.6, w: 2.4, d: 0.95, wall: "A" });
    const m = room([sofa]);
    const b = buildScene(m, false);
    const cam = elevationCamera(m.room, "A");
    const box = screenBox(b.scene.children.find((o) => o.userData.id === sofa.id)!, cam)!;
    // the sofa runs 1.10 – 3.50 m along a 3.75 m wall
    expect(box[0]).toBeCloseTo((1.1 / 3.75) * 100, 0);
    expect(box[0] + box[2]).toBeCloseTo((3.5 / 3.75) * 100, 0);
    expect(box[1] + box[3]).toBeCloseTo(100, 0); // stands on the floor line
    // wall C is seen from inside too: its plan axis runs right to left
    const camC = elevationCamera(m.room, "C");
    const t = piece("table", "rect", { id: "c", cx: 0.6, cz: 4.5, w: 0.8, d: 0.4 });
    const g = buildPiece(t, { wood: "#8A6440", metal: "#B08D57", accent: "#5E4268", light: "#F1EBE2", seating: "#8C8577" }, false);
    const bc = screenBox(g, camC)!;
    expect(bc[0]).toBeGreaterThan(70); // near the D corner, so on the right of the picture
  });
});

describe("keeping every piece whole in a wall picture", () => {
  it("slides a piece that runs past the corner back onto the wall", async () => {
    const { keepInFrame } = await import("@/journey/showroom3d/scene");
    const scene = new THREE.Scene();
    const sofa = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 0.9));
    sofa.userData.id = "sofa";
    sofa.position.set(1.9, 0, 0);
    scene.add(sofa);
    const cam = new THREE.OrthographicCamera(-2, 2, 1, -1, 0.1, 20);
    cam.position.set(0, 0, 5);
    cam.lookAt(0, 0, 0);
    keepInFrame(scene, cam);
    const bb = new THREE.Box3().setFromObject(sofa);
    expect(bb.max.x).toBeLessThanOrEqual(2.0001);
    expect(bb.min.x).toBeCloseTo(1, 3);
  });
});
