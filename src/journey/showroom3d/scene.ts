/**
 * The 3D room. Everything is drawn from a ShowroomModel (see model.ts): the room's real size, its doors and
 * windows, each layout piece at its place and footprint, in the moodboard's colours and the matched shape.
 * No part of the scene is fixed to one example room.
 *
 * Shapes are built at a typical size facing +z, then fitted to the piece's footprint from the layout.
 */
import * as THREE from "three";
import type { Wall } from "../state";
import type { Extra, Opening, PieceModel, ShowroomModel } from "./model";

export type View = "room" | "A" | "B" | "C" | "D" | "doll" | "plan";
type G = THREE.Group;
type Mat = THREE.Material;
const PI = Math.PI;

/* ---------- small helpers ---------- */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
const col = (c: string) => new THREE.Color(c);
const tint = (c: string) => col(c).multiplyScalar(1.22);
const lighter = (c: string, t: number) => "#" + col(c).lerp(col("#ffffff"), t).getHexString();
const darker = (c: string, t: number) => "#" + col(c).lerp(col("#000000"), t).getHexString();

type Ctx2D = CanvasRenderingContext2D;
const texCache = new Map<string, THREE.CanvasTexture>();
function ctex(key: string, w: number, h: number, draw: (g: Ctx2D, w: number, h: number) => void, srgb = true) {
  const hit = texCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  if (g) draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  texCache.set(key, t);
  return t;
}
function blot(g: Ctx2D, x: number, y: number, r: number, c: string) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, c); gr.addColorStop(1, "rgba(128,128,128,0)");
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
}
function mottle(g: Ctx2D, w: number, h: number, seed: number, n: number, rmin: number, rmax: number, dark: string, light: string) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rad = rmin + r() * (rmax - rmin), c = r() < 0.5 ? dark : light;
    for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
      if (x + ox * w + rad < 0 || x + ox * w - rad > w || y + oy * h + rad < 0 || y + oy * h - rad > h) continue;
      blot(g, x + ox * w, y + oy * h, rad, c);
    }
  }
}
function grain(g: Ctx2D, w: number, h: number, seed: number, n: number, amax: number) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const y = r() * h, a = 0.04 + r() * amax, amp = 1 + r() * 5, k = 1 + Math.floor(r() * 3), ph = r() * 6.283;
    g.strokeStyle = `rgba(${r() < 0.8 ? "70,70,70" : "0,0,0"},${a})`;
    g.lineWidth = 0.6 + r() * 1.8;
    g.beginPath();
    for (let x = 0; x <= w; x += 16) {
      const yy = y + amp * Math.sin((x / w) * 6.283 * k + ph);
      if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy);
    }
    g.stroke();
  }
}
/* Textures are grey so one image serves every colour: the material's colour tints it. */
const plasterTex = () => {
  const t = ctex("plaster", 512, 512, (g, w, h) => {
    g.fillStyle = "#ECECEC"; g.fillRect(0, 0, w, h);
    mottle(g, w, h, 11, 260, 30, 120, "rgba(60,55,50,0.07)", "rgba(255,255,255,0.09)");
    mottle(g, w, h, 23, 900, 3, 14, "rgba(40,36,32,0.05)", "rgba(255,255,255,0.06)");
  });
  t.repeat.set(0.5, 0.5);
  return t;
};
const woodTex = () => ctex("wood", 512, 512, (g, w, h) => {
  g.fillStyle = "#D6D6D6"; g.fillRect(0, 0, w, h);
  mottle(g, w, h, 5, 40, 40, 160, "rgba(90,90,90,0.25)", "rgba(255,255,255,0.08)");
  grain(g, w, h, 17, 240, 0.2);
});
const plankTex = () => ctex("planks", 1024, 1024, (g, w, h) => {
  const r = rng(107), rows = 16, ph = h / rows;
  for (let j = 0; j < rows; j++) {
    const n = 2 + (r() < 0.5 ? 1 : 0), off = r() * w, cuts: number[] = [];
    for (let i = 0; i < n; i++) cuts.push((off + (i * w) / n + ((r() - 0.5) * w) / n * 0.5 + w) % w);
    cuts.sort((a, b) => a - b);
    for (let i = 0; i < n; i++) {
      const x0 = cuts[i], x1 = i < n - 1 ? cuts[i + 1] : cuts[0] + w, v = Math.round(220 - r() * 60);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(x0, j * ph, x1 - x0, ph);
      if (x1 > w) g.fillRect(x0 - w, j * ph, x1 - x0, ph);
      g.fillStyle = "rgba(0,0,0,0.55)"; g.fillRect(x0 - 1, j * ph, 2, ph);
    }
  }
  grain(g, w, h, 33, 1500, 0.16);
  g.fillStyle = "rgba(0,0,0,0.5)";
  for (let j = 0; j <= rows; j++) g.fillRect(0, j * ph - 1, w, 2);
});
const weaveTex = () => ctex("weave", 256, 256, (g, w, h) => {
  g.fillStyle = "#808080"; g.fillRect(0, 0, w, h);
  const r = rng(4);
  for (let i = 0; i < 5000; i++) { g.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)"; g.fillRect(r() * w, r() * h, 1.5, 1.5); }
}, false);
const rugTex = () => ctex("rug", 1024, 724, (g, w, h) => {
  g.fillStyle = "#E2E2E2"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#F4F4F4"; g.lineWidth = 10; g.strokeRect(46, 46, w - 92, h - 92);
  g.strokeStyle = "rgba(90,90,90,0.45)"; g.lineWidth = 3; g.strokeRect(70, 70, w - 140, h - 140);
  const r = rng(40);
  for (let i = 0; i < 26000; i++) { g.fillStyle = r() < 0.5 ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)"; g.fillRect(r() * w, r() * h, 2, 2); }
});
const skyTex = (eve: boolean) => ctex(`sky${eve ? 1 : 0}`, 256, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  if (eve) { gr.addColorStop(0, "#141A33"); gr.addColorStop(0.6, "#2B2A4A"); gr.addColorStop(1, "#141A22"); }
  else { gr.addColorStop(0, "#CFE3F2"); gr.addColorStop(0.55, "#F1F3EA"); gr.addColorStop(0.62, "#9DB790"); gr.addColorStop(1, "#6F9068"); }
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = rng(12);
  for (let i = 0; i < 26; i++) blot(g, r() * w, h * 0.5 + r() * h * 0.5, 20 + r() * 40, eve ? "rgba(10,20,18,0.5)" : "rgba(74,120,80,0.5)");
});
function artTex(colors: string[], n: number) {
  return ctex(`art${colors.join("")}${n}`, 512, 360, (g, w, h) => {
    const r = rng(60 + n * 3);
    g.fillStyle = colors[2]; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) { g.fillStyle = colors[Math.floor(r() * colors.length)]; g.globalAlpha = 0.82; g.fillRect(r() * w * 0.8, r() * h * 0.8, 60 + r() * 200, 50 + r() * 150); }
    g.globalAlpha = 1;
    g.strokeStyle = colors[3]; g.lineWidth = 5; g.beginPath(); g.arc(w * (0.3 + r() * 0.4), h * 0.5, 70, 0, 6.283); g.stroke();
  });
}

/* ---------- materials ---------- */

const std = (c: string, rough: number, metal = 0) => new THREE.MeshStandardMaterial({ color: col(c), roughness: rough, metalness: metal });
const paint = (c: string, rough = 0.5) => std(c, rough, 0);
const metalM = (c: string) => std(c, 0.34, 1);
const woodM = (c: string, rough = 0.42) => new THREE.MeshStandardMaterial({ map: woodTex(), color: tint(c), roughness: rough });
function velvet(c: string) {
  const k = col(c);
  return new THREE.MeshPhysicalMaterial({ color: k, roughness: 0.92, sheen: 1, sheenRoughness: 0.42, sheenColor: k.clone().lerp(col("#ffffff"), 0.5), bumpMap: weaveTex(), bumpScale: 0.0015 });
}
const leather = (c: string) => new THREE.MeshPhysicalMaterial({ color: col(c), roughness: 0.48, clearcoat: 0.3, clearcoatRoughness: 0.55, bumpMap: weaveTex(), bumpScale: 0.0008 });
const linen = (c: string) => new THREE.MeshStandardMaterial({ color: col(c), roughness: 0.95, bumpMap: weaveTex(), bumpScale: 0.002 });
const boucle = (c: string) => new THREE.MeshStandardMaterial({ color: col(c), roughness: 1, bumpMap: weaveTex(), bumpScale: 0.007 });
const fab = (kind: string | undefined, c: string): Mat => (kind === "boucle" ? boucle(c) : kind === "leather" ? leather(c) : kind === "velvet" ? velvet(c) : linen(c));
const glass = (c: string, op: number) => new THREE.MeshPhysicalMaterial({ color: col(c), roughness: 0.04, transparent: true, opacity: op, depthWrite: false });
function glow(eve: boolean, k = 1) {
  const v = (eve ? 2.4 : 1.25) * k, m = new THREE.MeshBasicMaterial();
  m.color.setRGB(v, v * 0.84, v * 0.58);
  return m;
}

/* ---------- geometry ---------- */

function add(g: THREE.Object3D, geo: THREE.BufferGeometry, mat: Mat, x = 0, y = 0, z = 0, noShadow = false) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = !noShadow; m.receiveShadow = true;
  g.add(m);
  return m;
}
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (r1: number, r2: number, h: number, seg = 32) => new THREE.CylinderGeometry(r1, r2, h, seg);
function rrect(w: number, d: number, r: number) {
  const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
  r = Math.max(0.001, Math.min(r, w / 2 - 0.001, d / 2 - 0.001));
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -PI / 2, 0, false);
  s.lineTo(x + w, y + d - r); s.absarc(x + w - r, y + d - r, r, 0, PI / 2, false);
  s.lineTo(x + r, y + d); s.absarc(x + r, y + d - r, r, PI / 2, PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, PI, PI * 1.5, false);
  return s;
}
function extr(shape: THREE.Shape, h: number, b = 0, seg = 14) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.001, h - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 4, curveSegments: seg });
  g.rotateX(-PI / 2); g.translate(0, b, 0);
  return g;
}
const slab = (w: number, d: number, h: number, r: number, b = 0) => extr(rrect(w - 2 * b, d - 2 * b, Math.max(0.002, r - b)), h, b);
function sector(rin: number, rout: number, a0: number, a1: number, h: number, b = 0) {
  rin += b; rout -= b; a0 += b / rout; a1 -= b / rout;
  const s = new THREE.Shape();
  s.moveTo(rout * Math.cos(a0), rout * Math.sin(a0));
  s.absarc(0, 0, rout, a0, a1, false);
  s.lineTo(rin * Math.cos(a1), rin * Math.sin(a1));
  s.absarc(0, 0, rin, a1, a0, true);
  s.closePath();
  return extr(s, h, b, 40);
}
const lathe = (pts: number[][], seg = 40) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg);
function archShape(w: number, straight: number, x0 = 0) {
  const s = new THREE.Shape(), r = w / 2;
  s.moveTo(x0, 0); s.lineTo(x0, straight); s.absarc(x0 + r, straight, r, PI, 0, true); s.lineTo(x0 + w, 0); s.closePath();
  return s;
}
function rectShape(x0: number, y0: number, w: number, h: number) {
  const s = new THREE.Shape();
  s.moveTo(x0, y0); s.lineTo(x0 + w, y0); s.lineTo(x0 + w, y0 + h); s.lineTo(x0, y0 + h); s.closePath();
  return s;
}
function legs4(g: G, m: Mat, hw: number, hd: number, h: number, zc = 0) {
  for (const [x, z] of [[hw, hd], [-hw, hd], [hw, -hd], [-hw, -hd]]) add(g, cyl(0.02, 0.015, h, 12), m, x, h / 2, zc + z);
}
function pillow(g: G, mat: Mat, x: number, y: number, z: number, ry = 0, rx = 0, s = 1) {
  const pm = add(g, new THREE.SphereGeometry(0.2, 28, 20), mat, x, y, z);
  pm.scale.set(s, s * 0.95, s * 0.4); pm.rotation.order = "YXZ"; pm.rotation.y = ry; pm.rotation.x = rx;
  return pm;
}
const leafM = (i: number) => new THREE.MeshStandardMaterial({ color: col(i % 3 === 0 ? "#3C6B4A" : i % 3 === 1 ? "#2F5A3D" : "#28503A"), roughness: 0.4 });

/* ---------- furniture shapes (typical size, front towards +z) ---------- */

type Style = { wood: string; metal: string; accent: string; light: string; seating: string };
type Build = (g: G, p: PieceModel, st: Style, eve: boolean) => void;

const sofa: Build = (g, p, st) => {
  const sh = p.shape, mat = fab(p.fabric, p.color), br = metalM(st.metal), pm1 = fab("linen", st.accent), pm2 = fab("linen", st.light);
  if (sh === "curved" || sh === "channel") {
    const R = 2.6, th = Math.asin(1.2 / R), a0 = PI / 2 - th, a1 = PI / 2 + th;
    const c = new THREE.Group(); c.position.set(0, 0, R); g.add(c);
    add(c, sector(R - 0.84, R - 0.06, a0 + 0.02, a1 - 0.02, 0.07), std("#1E1512", 0.6));
    add(c, sector(R - 0.9, R, a0, a1, 0.3, 0.035), mat, 0, 0.07, 0);
    for (let i = 0; i < 3; i++) add(c, sector(R - 0.93, R - 0.25, a0 + ((a1 - a0) * i) / 3 + 0.006, a0 + ((a1 - a0) * (i + 1)) / 3 - 0.006, 0.16, 0.045), mat, 0, 0.33, 0);
    if (sh === "channel") {
      add(c, sector(R - 0.07, R, a0, a1, 0.44, 0.02), mat, 0, 0.35, 0);
      for (let i = 0; i < 13; i++) { const a = a0 + ((i + 0.5) / 13) * (a1 - a0); add(c, new THREE.CapsuleGeometry(0.088, 0.36, 8, 18), mat, (R - 0.15) * Math.cos(a), 0.628, -(R - 0.15) * Math.sin(a)); }
    } else add(c, sector(R - 0.27, R, a0, a1, 0.48, 0.06), mat, 0, 0.35, 0);
    for (const [a, m, t] of [[a0 + 0.17, pm1, 0.12], [a1 - 0.2, pm2, -0.1]] as [number, Mat, number][]) pillow(c, m, (R - 0.4) * Math.cos(a), 0.66, -(R - 0.4) * Math.sin(a), a + PI / 2 + t, 0.28);
    return;
  }
  if (sh === "modular") {
    for (const x of [-0.8, 0, 0.8]) { add(g, slab(0.79, 0.95, 0.38, 0.09, 0.06), mat, x, 0, 0.475); add(g, slab(0.79, 0.3, 0.36, 0.11, 0.08), mat, x, 0.36, 0.16); }
    pillow(g, pm1, -0.75, 0.58, 0.48, 0.3, -0.2, 0.9); pillow(g, pm2, 0.85, 0.58, 0.48, -0.2, -0.2, 0.9);
    return;
  }
  if (sh === "daybed") {
    const wd = woodM(st.wood, 0.45);
    add(g, slab(2.4, 0.95, 0.06, 0.02, 0.01), wd, 0, 0.2, 0.475);
    for (const [x, z] of [[1.12, 0.08], [-1.12, 0.08], [1.12, 0.87], [-1.12, 0.87]]) add(g, box(0.06, 0.2, 0.06), wd, x, 0.1, z);
    add(g, slab(2.34, 0.9, 0.2, 0.07, 0.05), mat, 0, 0.26, 0.475);
    for (const x of [-1.02, 1.02]) add(g, new THREE.CapsuleGeometry(0.1, 0.62, 8, 18), mat, x, 0.56, 0.475).rotation.x = PI / 2;
    [-0.6, 0, 0.6].forEach((x, j) => { add(g, slab(0.52, 0.16, 0.4, 0.07, 0.055), j === 1 ? pm1 : mat, x, 0.46, 0.12).rotation.x = -0.16; });
    return;
  }
  const tux = sh === "tuxedo", armH = tux ? 0.46 : 0.3, backH = tux ? 0.46 : 0.5;
  legs4(g, br, 1.1, 0.375, 0.11, 0.475);
  add(g, slab(2.4, 0.95, 0.25, 0.05, 0.03), mat, 0, 0.11, 0.475);
  add(g, slab(2.4, 0.2, backH, 0.06, 0.04), mat, 0, 0.33, 0.1);
  if (sh === "rolled") {
    for (const x of [-1.08, 1.08]) { add(g, cyl(0.16, 0.16, 0.93, 28), mat, x, 0.5, 0.475).rotation.x = PI / 2; add(g, slab(0.26, 0.93, 0.2, 0.04, 0.03), mat, x, 0.33, 0.475); }
    add(g, cyl(0.11, 0.11, 2.36, 28), mat, 0, 0.83, 0.1).rotation.z = PI / 2;
  } else for (const x of [-1.1, 1.1]) add(g, slab(0.2, 0.95, armH, 0.06, 0.04), mat, x, 0.33, 0.475);
  if (tux) {
    add(g, slab(1.98, 0.72, 0.16, 0.05, 0.04), mat, 0, 0.34, 0.57);
    for (const x of [-0.74, -0.25, 0.25, 0.74]) add(g, slab(0.46, 0.14, 0.3, 0.06, 0.05), mat, x, 0.49, 0.28).rotation.x = -0.1;
  } else {
    for (const x of [-0.66, 0, 0.66]) { add(g, slab(0.65, 0.7, 0.16, 0.05, 0.04), mat, x, 0.34, 0.58); add(g, slab(0.63, 0.17, 0.36, 0.07, 0.055), mat, x, 0.49, 0.3).rotation.x = -0.14; }
    pillow(g, pm1, -0.78, 0.7, 0.42, 0.25, -0.25); pillow(g, pm2, 0.8, 0.7, 0.42, -0.2, -0.25);
  }
  if (sh === "chaise") { add(g, slab(0.84, 0.66, 0.25, 0.05, 0.03), mat, 0.78, 0.11, 1.26); add(g, slab(0.8, 0.64, 0.16, 0.05, 0.04), mat, 0.78, 0.34, 1.25); }
};

const chair: Build = (g, p, st) => {
  const sh = p.shape, mat = fab(p.fabric, p.color), br = metalM(st.metal);
  if (sh === "tub" || sh === "channelt") {
    for (const [x, z] of [[0.22, 0.22], [-0.22, 0.22], [0.22, -0.22], [-0.22, -0.22]]) add(g, cyl(0.02, 0.014, 0.14, 14), br, x, 0.07, z);
    add(g, lathe([[0, 0], [0.33, 0], [0.365, 0.03], [0.375, 0.2], [0.36, 0.26], [0, 0.26]]), mat, 0, 0.14, 0);
    add(g, lathe([[0, 0], [0.26, 0], [0.3, 0.03], [0.305, 0.08], [0.27, 0.12], [0, 0.125]]), mat, 0, 0.37, 0.02);
    const b0 = -PI / 2 + 0.95, b1 = PI * 1.5 - 0.95;
    if (sh === "channelt") {
      add(g, sector(0.35, 0.385, b0, b1, 0.42, 0.015), mat, 0, 0.36, 0);
      for (let i = 0; i < 12; i++) { const a = b0 + ((i + 0.5) / 12) * (b1 - b0); add(g, new THREE.CapsuleGeometry(0.052, 0.3, 6, 14), mat, 0.315 * Math.cos(a), 0.57, -0.315 * Math.sin(a)); }
    } else add(g, sector(0.255, 0.385, b0, b1, 0.46, 0.05), mat, 0, 0.36, 0);
  } else if (sh === "club" || sh === "wing") {
    legs4(g, br, 0.3, 0.3, 0.1);
    add(g, slab(0.78, 0.78, 0.26, 0.06, 0.04), mat, 0, 0.1, 0);
    for (const x of [-0.31, 0.31]) add(g, slab(0.16, 0.78, 0.3, 0.06, 0.04), mat, x, 0.34, 0);
    add(g, slab(0.78, 0.18, sh === "wing" ? 0.68 : 0.44, 0.07, 0.05), mat, 0, 0.34, -0.3);
    add(g, slab(0.46, 0.56, 0.14, 0.05, 0.04), mat, 0, 0.35, 0.07);
    if (sh === "wing") for (const x of [-0.34, 0.34]) add(g, slab(0.1, 0.3, 0.38, 0.04, 0.03), mat, x, 0.64, -0.12);
  } else if (sh === "slipper") {
    legs4(g, br, 0.26, 0.28, 0.1);
    add(g, slab(0.64, 0.68, 0.26, 0.07, 0.05), mat, 0, 0.1, 0);
    add(g, slab(0.64, 0.16, 0.48, 0.07, 0.05), mat, 0, 0.3, -0.27).rotation.x = -0.15;
  } else {
    for (const x of [-0.31, 0.31]) {
      add(g, box(0.02, 0.02, 0.72), br, x, 0.01, 0); add(g, box(0.02, 0.58, 0.02), br, x, 0.29, 0.35);
      add(g, box(0.02, 0.82, 0.02), br, x, 0.41, -0.35); add(g, box(0.02, 0.02, 0.72), br, x, 0.58, 0);
    }
    add(g, slab(0.6, 0.62, 0.05, 0.02, 0.015), mat, 0, 0.33, 0.02).rotation.x = 0.12;
    add(g, slab(0.6, 0.05, 0.5, 0.02, 0.015), mat, 0, 0.36, -0.3).rotation.x = -0.2;
  }
};

const table: Build = (g, p, st) => {
  const sh = p.shape, wd = () => woodM(p.color, 0.35), br = metalM(st.metal);
  const disc = (r: number, y: number, sx: number, sz: number, th: number, x = 0, z = 0, m: Mat = wd()) => { const d = add(g, lathe([[0, 0], [r - 0.02, 0], [r, 0.012], [r, th - 0.012], [r - 0.02, th], [0, th]], 64), m, x, y, z); d.scale.set(sx, 1, sz); };
  const drum = (r: number, h: number, x: number, z: number) => add(g, lathe([[0, 0], [r - 0.015, 0], [r, 0.015], [r, h - 0.015], [r - 0.015, h], [0, h]], 56), paint(p.color, 0.3), x, 0, z);
  if (sh === "oval") { disc(0.52, 0.354, 1.06, 0.6, 0.046); add(g, cyl(0.1, 0.12, 0.355, 32), wd(), -0.26, 0.1775, 0); add(g, cyl(0.1, 0.12, 0.355, 32), wd(), 0.26, 0.1775, 0); }
  else if (sh === "ovalframe") {
    disc(0.5, 0.382, 1.08, 0.6, 0.02, 0, 0, glass("#4A3F38", 0.5));
    for (const [r, y, t] of [[0.5, 0.38, 0.013], [0.36, 0.12, 0.009]]) { const m = add(g, new THREE.TorusGeometry(r, t, 12, 80), br, 0, y, 0); m.rotation.x = PI / 2; m.scale.set(1.08, 0.6, 1); }
    for (const [x, z] of [[0.4, 0.14], [-0.4, 0.14], [0.4, -0.14], [-0.4, -0.14]]) add(g, cyl(0.011, 0.011, 0.38, 12), br, x, 0.19, z);
  } else if (sh === "drums") { drum(0.345, 0.38, -0.2, 0); drum(0.235, 0.3, 0.36, 0.08); }
  else if (sh === "round") { disc(0.44, 0.36, 1, 1, 0.045); add(g, lathe([[0, 0], [0.26, 0], [0.27, 0.02], [0.1, 0.08], [0.08, 0.3], [0.14, 0.36], [0, 0.36]], 40), wd(), 0, 0, 0); }
  else if (sh === "rect") { add(g, slab(1.1, 0.6, 0.05, 0.03, 0.01), wd(), 0, 0.35, 0); for (const [x, z] of [[0.5, 0.25], [-0.5, 0.25], [0.5, -0.25], [-0.5, -0.25]]) add(g, box(0.05, 0.35, 0.05), wd(), x, 0.175, z); add(g, slab(1.0, 0.5, 0.02, 0.02, 0.005), wd(), 0, 0.1, 0); }
  else if (sh === "plinth") { add(g, slab(0.96, 0.56, 0.05, 0.02, 0.005), std("#1E1512", 0.6)); add(g, slab(1.04, 0.62, 0.31, 0.03, 0.015), wd(), 0, 0.05, 0); }
  else if (sh === "nest") {
    disc(0.36, 0.385, 1, 1, 0.025, -0.18, 0); disc(0.26, 0.295, 1, 1, 0.025, 0.36, 0.1);
    for (let i = 0; i < 3; i++) { const a = i * 2.094; add(g, cyl(0.009, 0.009, 0.385, 10), br, -0.18 + Math.cos(a) * 0.3, 0.1925, Math.sin(a) * 0.3); add(g, cyl(0.009, 0.009, 0.295, 10), br, 0.36 + Math.cos(a + 1) * 0.21, 0.1475, 0.1 + Math.sin(a + 1) * 0.21); }
  } else {
    disc(0.42, 0.36, 1.1, 0.62, 0.04, -0.16, 0); disc(0.33, 0.36, 1, 0.72, 0.04, 0.26, 0.08);
    for (const [x, z] of [[-0.42, 0], [0.38, 0.1], [0, -0.12]]) add(g, cyl(0.03, 0.02, 0.36, 16), wd(), x, 0.18, z);
  }
};

const side: Build = (g, p, st) => {
  const sh = p.shape, top = () => woodM(p.color, 0.38), br = metalM(st.metal);
  const tdisc = (r: number, y: number, th: number) => add(g, lathe([[0, 0], [r - 0.01, 0], [r, 0.01], [r, th - 0.008], [r - 0.01, th], [0, th]], 48), top(), 0, y, 0);
  if (sh === "tripod") { tdisc(0.22, 0.466, 0.034); for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5, lg = add(g, cyl(0.011, 0.009, 0.5, 12), br, Math.cos(a) * 0.12, 0.235, Math.sin(a) * 0.12); lg.rotation.order = "YXZ"; lg.rotation.y = -a; lg.rotation.z = -0.22; } }
  else if (sh === "drum") add(g, lathe([[0, 0], [0.185, 0], [0.2, 0.015], [0.2, 0.485], [0.185, 0.5], [0, 0.5]], 48), paint(p.color, 0.3));
  else if (sh === "ctable") { add(g, slab(0.38, 0.36, 0.03, 0.015, 0.005), top(), 0, 0.47, 0); for (const z of [-0.15, 0.15]) { add(g, box(0.02, 0.47, 0.02), br, 0.17, 0.235, z); add(g, box(0.34, 0.015, 0.02), br, 0.01, 0.0075, z); } }
  else if (sh === "cube") add(g, slab(0.38, 0.38, 0.5, 0.025, 0.012), top());
  else if (sh === "discs") for (const [r, y] of [[0.2, 0], [0.13, 0.17], [0.2, 0.33]]) add(g, lathe([[0, 0], [r - 0.02, 0], [r, 0.03], [r, 0.14], [r - 0.02, 0.17], [0, 0.17]], 44), top(), 0, y, 0);
  else { tdisc(0.21, 0.46, 0.04); add(g, cyl(0.016, 0.016, 0.45, 16), br, 0, 0.235, 0); add(g, cyl(0.15, 0.16, 0.014, 40), br, 0, 0.007, 0); }
};

const shelf: Build = (g, p, st) => {
  const sh = p.shape, wd = woodM(p.color, 0.45), br = metalM(st.metal), bw = 0.8, bh = 2.0, bd = 0.35, t = 0.026, r = rng(77);
  const back = paint(st.accent, 0.3), n = 4, gap = (bh - 0.063) / n;
  const lv = Array.from({ length: n }, (_, i) => 0.063 + i * gap);
  let ys: number[];
  if (sh === "credenza") {
    legs4(g, br, 0.34, 0.12, 0.08, 0.19);
    add(g, slab(0.8, 0.38, 0.68, 0.015, 0.006), wd, 0, 0.08, 0.19);
    add(g, box(0.004, 0.62, 0.004), std("#1E1512", 0.6), 0, 0.42, 0.382, true);
    for (const y of [1.2, 1.55, 1.9]) add(g, box(0.8, 0.03, 0.24), wd, 0, y, 0.12);
    ys = [0.762, 1.217, 1.567];
  } else {
    if (sh === "etagere") {
      for (const [x, z] of [[-0.39, 0.01], [0.39, 0.01], [-0.39, 0.34], [0.39, 0.34]]) add(g, box(0.02, bh, 0.02), br, x, bh / 2, z);
      for (const y of [...lv, bh - 0.015]) add(g, box(bw - 0.04, 0.03, bd - 0.02), wd, 0, y, bd / 2);
    } else {
      add(g, box(bw, bh, 0.014), wd, 0, bh / 2, 0.007);
      for (const x of [-bw / 2 + t / 2, bw / 2 - t / 2]) add(g, box(t, bh, bd), wd, x, bh / 2, bd / 2);
      for (const y of [...lv, bh - t / 2]) add(g, box(bw - 2 * t, t, bd - 0.01), wd, 0, y, bd / 2);
      if (sh === "arch") {
        const fs = rectShape(-bw / 2, 0, bw, bh), ah = new THREE.Path();
        ah.moveTo(-0.33, 0.1); ah.lineTo(-0.33, bh - 0.45); ah.absarc(0, bh - 0.45, 0.33, PI, 0, true); ah.lineTo(0.33, 0.1); ah.closePath(); fs.holes.push(ah);
        add(g, new THREE.ExtrudeGeometry(fs, { depth: 0.02, bevelEnabled: false, curveSegments: 28 }), wd, 0, 0, bd - 0.01);
        add(g, box(bw - 2 * t - 0.01, bh - 0.1, 0.006), back, 0, bh / 2, 0.018, true);
      } else add(g, box(bw - 2 * t - 0.01, gap - t - 0.01, 0.006), back, 0, lv[1] + gap / 2, 0.018, true);
    }
    ys = lv.map((y) => y + 0.015);
  }
  const bc = [st.accent, st.seating, st.light, darker(p.color, 0.3), st.metal], zc = sh === "credenza" ? 0.12 : 0.16, xs = sh === "arch" ? 0.78 : 1;
  ys.forEach((y, j) => {
    let x = -0.34 * xs;
    const count = j % 2 ? 5 : 8;
    for (let k = 0; k < count; k++) { const w = 0.026 + r() * 0.03, hh = Math.min(gap - 0.08, 0.2 + r() * 0.1); add(g, box(w, hh, 0.15 + r() * 0.04), paint(bc[Math.floor(r() * bc.length)], 0.7), x + w / 2, y + hh / 2, zc); x += w + 0.003; }
    if (j % 2) add(g, lathe([[0, 0], [0.045, 0], [0.075, 0.07], [0.07, 0.15], [0.03, 0.22], [0.038, 0.26], [0, 0.26]], 30), paint(j === 1 ? st.accent : st.light, 0.25), 0.2 * xs, y, zc).scale.setScalar(Math.min(1, (gap - 0.06) / 0.26));
  });
};

const consoleT: Build = (g, p, st) => {
  const sh = p.shape, br = metalM(st.metal), mat = () => woodM(p.color, 0.4);
  if (sh === "waterfall") { add(g, slab(0.95, 0.35, 0.045, 0.01, 0.004), mat(), 0, 0.805, 0); for (const x of [-0.4525, 0.4525]) add(g, slab(0.045, 0.35, 0.81, 0.01, 0.004), mat(), x, 0, 0); }
  else if (sh === "demilune") {
    const top = add(g, sector(0.001, 0.46, 0, PI, 0.04, 0.005), mat(), 0, 0.81, -0.175); top.rotation.y = PI;
    for (const [x, z] of [[-0.38, -0.15], [0.38, -0.15], [0, 0.2]]) add(g, cyl(0.016, 0.01, 0.81, 14), br, x, 0.405, z);
  } else if (sh === "plinth") { add(g, slab(0.89, 0.31, 0.06, 0.01, 0.003), std("#1E1512", 0.6)); add(g, slab(0.95, 0.35, 0.79, 0.02, 0.01), mat(), 0, 0.06, 0); add(g, box(0.004, 0.7, 0.004), std("#1E1512", 0.6), 0, 0.45, 0.176, true); }
  else if (sh === "trestle") {
    add(g, slab(0.95, 0.35, 0.04, 0.012, 0.006), mat(), 0, 0.81, 0);
    for (const x of [-0.33, 0.33]) { [-0.1, 0.1].forEach((z, j) => { add(g, cyl(0.012, 0.012, 0.83, 12), br, x, 0.405, z).rotation.x = j ? -0.07 : 0.07; }); add(g, box(0.014, 0.014, 0.22), br, x, 0.3, 0); }
  } else {
    add(g, slab(0.95, 0.35, 0.04, 0.012, 0.006), mat(), 0, 0.81, 0); add(g, slab(0.89, 0.31, 0.13, 0.008, 0.004), mat(), 0, 0.68, 0);
    for (const x of [-0.22, 0.22]) add(g, new THREE.SphereGeometry(0.014, 14, 10), br, x, 0.745, 0.165);
    for (const [x, z] of [[0.42, 0.13], [-0.42, 0.13], [0.42, -0.13], [-0.42, -0.13]]) add(g, cyl(0.014, 0.01, 0.68, 14), br, x, 0.34, z);
  }
};

const bed: Build = (g, p, st) => {
  const sh = p.shape, mat = fab(p.fabric, p.color), wd = woodM(st.wood, 0.45), W = 1.7, D = 2.1;
  // head against -z, foot towards +z
  if (sh === "platform") { add(g, slab(W + 0.2, D + 0.1, 0.18, 0.02, 0.008), wd, 0, 0.06, 0); add(g, slab(W + 0.2, 0.06, 0.7, 0.02, 0.008), wd, 0, 0.24, -D / 2); legs4(g, wd, W / 2, D / 2 - 0.05, 0.06); }
  else {
    add(g, slab(W + 0.08, D + 0.06, 0.3, 0.04, 0.02), mat, 0, 0.04, 0);
    if (sh === "curvedhead") { const hb = add(g, new THREE.ExtrudeGeometry(archShape(W + 0.1, 0.55, -(W + 0.1) / 2), { depth: 0.1, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3, curveSegments: 28 }), mat, 0, 0.1, -D / 2 - 0.08); hb.scale.y = 0.75; }
    else if (sh === "channelhead") { add(g, slab(W + 0.1, 0.06, 1.0, 0.03, 0.015), mat, 0, 0.1, -D / 2 - 0.03); for (let i = 0; i < 9; i++) add(g, new THREE.CapsuleGeometry(0.085, 0.72, 6, 14), mat, -W / 2 + 0.1 + i * ((W - 0.2) / 8), 0.68, -D / 2 + 0.06); }
    else add(g, slab(W + 0.1, 0.12, 1.05, 0.06, 0.04), mat, 0, 0.1, -D / 2 - 0.04);
  }
  const top = sh === "platform" ? 0.24 : 0.34;
  add(g, slab(W, D - 0.06, 0.22, 0.08, 0.05), paint("#F3EEE6", 0.9), 0, top, 0.02);
  add(g, slab(W + 0.04, D * 0.62, 0.06, 0.06, 0.03), linen(st.light), 0, top + 0.2, D * 0.17);
  add(g, slab(W + 0.05, 0.55, 0.05, 0.05, 0.025), linen(st.accent), 0, top + 0.25, D / 2 - 0.36);
  for (const x of [-W / 4, W / 4]) add(g, slab(0.66, 0.42, 0.14, 0.09, 0.06), paint("#F6F2EA", 0.9), x, top + 0.2, -D / 2 + 0.32).rotation.x = 0.18;
};

const dining: Build = (g, p) => {
  const wd = () => woodM(p.color, 0.38);
  if (p.shape === "round") { add(g, lathe([[0, 0], [0.58, 0], [0.6, 0.012], [0.6, 0.038], [0.58, 0.05], [0, 0.05]], 64), wd(), 0, 0.7, 0); add(g, lathe([[0, 0], [0.34, 0], [0.35, 0.03], [0.09, 0.1], [0.07, 0.62], [0.16, 0.7], [0, 0.7]], 40), wd()); }
  else if (p.shape === "oval") { const d = add(g, lathe([[0, 0], [0.58, 0], [0.6, 0.012], [0.6, 0.038], [0.58, 0.05], [0, 0.05]], 64), wd(), 0, 0.7, 0); d.scale.set(1.6, 1, 0.8); for (const x of [-0.5, 0.5]) add(g, cyl(0.11, 0.16, 0.7, 32), wd(), x, 0.35, 0); }
  else { add(g, slab(1.8, 0.9, 0.05, 0.02, 0.008), wd(), 0, 0.7, 0); for (const [x, z] of [[0.82, 0.38], [-0.82, 0.38], [0.82, -0.38], [-0.82, -0.38]]) add(g, box(0.07, 0.7, 0.07), wd(), x, 0.35, z); }
};

const dchair: Build = (g, p, st) => {
  const wd = woodM(p.color, 0.45), seat = fab("linen", st.light);
  for (const [x, z] of [[0.19, 0.19], [-0.19, 0.19], [0.19, -0.19], [-0.19, -0.19]]) add(g, cyl(0.018, 0.014, 0.45, 12), wd, x, 0.225, z);
  add(g, slab(0.46, 0.46, 0.07, 0.06, 0.03), seat, 0, 0.44, 0);
  if (p.shape === "curvedback") add(g, sector(0.2, 0.235, 0.35, PI - 0.35, 0.36, 0.012), wd, 0, 0.5, 0.02);
  else { for (const x of [-0.19, 0.19]) add(g, cyl(0.016, 0.016, 0.42, 12), wd, x, 0.66, -0.2); add(g, slab(0.44, 0.03, 0.2, 0.012, 0.006), wd, 0, 0.68, -0.2); }
};

const desk: Build = (g, p, st) => {
  const wd = () => woodM(p.color, 0.4), br = metalM(st.metal);
  add(g, slab(1.4, 0.65, 0.04, 0.012, 0.006), wd(), 0, 0.71, 0);
  if (p.shape === "trestle") for (const x of [-0.5, 0.5]) { [-0.22, 0.22].forEach((z, j) => { add(g, cyl(0.014, 0.014, 0.73, 12), br, x, 0.355, z).rotation.x = j ? -0.1 : 0.1; }); add(g, box(0.014, 0.014, 0.4), br, x, 0.3, 0); }
  else { add(g, slab(1.3, 0.55, 0.1, 0.008, 0.004), wd(), 0, 0.61, 0); for (const [x, z] of [[0.64, 0.27], [-0.64, 0.27], [0.64, -0.27], [-0.64, -0.27]]) add(g, cyl(0.02, 0.014, 0.62, 14), br, x, 0.31, z); }
};

const media: Build = (g, p, st) => {
  add(g, slab(1.7, 0.4, 0.05, 0.01, 0.003), std("#1E1512", 0.6)); add(g, slab(1.8, 0.45, 0.45, 0.015, 0.006), woodM(p.color, 0.4), 0, 0.05, 0);
  for (const x of [-0.45, 0, 0.45]) add(g, box(0.004, 0.38, 0.004), std("#1E1512", 0.6), x, 0.28, 0.226, true);
  for (const x of [-0.5, 0.5]) add(g, new THREE.SphereGeometry(0.012, 12, 8), metalM(st.metal), x, 0.3, 0.232);
};

const wardrobe: Build = (g, p, st) => {
  add(g, slab(1.76, 0.56, 0.06, 0.01, 0.003), std("#1E1512", 0.6)); add(g, slab(1.8, 0.6, 2.14, 0.012, 0.006), woodM(p.color, 0.45), 0, 0.06, 0);
  for (const x of [-0.45, 0, 0.45]) add(g, box(0.004, 2.04, 0.004), std("#1E1512", 0.6), x, 1.13, 0.301, true);
  for (const x of [-0.5, -0.4, 0.4, 0.5]) add(g, cyl(0.008, 0.008, 0.3, 10), metalM(st.metal), x, 1.1, 0.315);
};

const bench: Build = (g, p, st) => {
  if (p.shape === "pouf") { add(g, lathe([[0, 0], [0.25, 0], [0.3, 0.06], [0.31, 0.3], [0.27, 0.38], [0, 0.4]], 48), fab(p.fabric ?? "boucle", p.color)); return; }
  legs4(g, metalM(st.metal), 0.52, 0.16, 0.3);
  add(g, slab(1.2, 0.42, 0.14, 0.06, 0.04), fab(p.fabric, p.color), 0, 0.3, 0);
};

const lamp: Build = (g, p, st, eve) => {
  const sh = p.shape, br = metalM(p.color), sc = st.light;
  const shadeM = () => new THREE.MeshStandardMaterial({ color: col(sc), roughness: 0.92, side: THREE.DoubleSide, emissive: col("#FFB978"), emissiveIntensity: eve ? 0.8 : 0.12, bumpMap: weaveTex(), bumpScale: 0.002 });
  const dome = () => new THREE.MeshStandardMaterial({ color: col(p.color), roughness: 0.34, metalness: 1, side: THREE.DoubleSide });
  if (sh === "column") { add(g, slab(0.3, 0.3, 0.04, 0.02, 0.008), br); add(g, cyl(0.125, 0.125, 1.2, 40), new THREE.MeshStandardMaterial({ color: col("#F4EBDB"), roughness: 0.95, emissive: col("#FFC98A"), emissiveIntensity: eve ? 0.9 : 0.25 }), 0, 0.64, 0, true); return; }
  if (sh === "tripod") {
    const wd = woodM(st.wood, 0.45);
    for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.4, lg = add(g, cyl(0.014, 0.018, 1.22, 12), wd, Math.cos(a) * 0.14, 0.59, Math.sin(a) * 0.14); lg.rotation.order = "YXZ"; lg.rotation.y = -a; lg.rotation.z = -0.23; }
    add(g, new THREE.CylinderGeometry(0.17, 0.22, 0.3, 44, 1, true), shadeM(), 0, 1.4, 0); add(g, new THREE.SphereGeometry(0.04, 14, 10), glow(eve), 0, 1.38, 0, true);
    return;
  }
  add(g, cyl(0.15, 0.16, 0.022, 40), br, 0, 0.011, 0);
  if (sh === "arc") {
    add(g, cyl(0.012, 0.012, 1.5, 14), br, 0, 0.75, 0);
    add(g, new THREE.TorusGeometry(0.55, 0.012, 10, 48, PI * 0.72), br, -0.55, 1.5, 0);
    const ex = -0.55 + 0.55 * Math.cos(PI * 0.72), ey = 1.5 + 0.55 * Math.sin(PI * 0.72);
    const dm = add(g, new THREE.SphereGeometry(0.17, 40, 20, 0, PI * 2, 0, PI / 2), dome(), ex - 0.03, ey - 0.2, 0);
    dm.receiveShadow = false;
    add(g, new THREE.SphereGeometry(0.045, 16, 12), glow(eve), ex - 0.03, ey - 0.16, 0, true);
    return;
  }
  add(g, cyl(0.011, 0.011, sh === "torch" ? 1.6 : 1.36, 14), br, 0, sh === "torch" ? 0.82 : 0.7, 0);
  if (sh === "torch") { add(g, new THREE.CylinderGeometry(0.17, 0.04, 0.16, 40, 1, true), dome(), 0, 1.68, 0); add(g, cyl(0.12, 0.12, 0.008, 30), glow(eve, 0.8), 0, 1.7, 0, true); }
  else if (sh === "globe") add(g, new THREE.SphereGeometry(0.14, 40, 28), new THREE.MeshStandardMaterial({ color: col("#FFF3DE"), roughness: 0.35, emissive: col("#FFC98A"), emissiveIntensity: eve ? 1.5 : 0.45 }), 0, 1.5, 0, true);
  else { add(g, new THREE.CylinderGeometry(0.14, 0.21, 0.28, 44, 1, true), shadeM(), 0, 1.47, 0); add(g, new THREE.SphereGeometry(0.04, 14, 10), glow(eve), 0, 1.44, 0, true); }
};

const plant: Build = (g, p) => {
  const sh = p.shape, r = rng(5), stem = std("#4A3A2A", 0.8);
  add(g, lathe([[0, 0], [0.13, 0], [0.17, 0.05], [0.19, 0.34], [0.175, 0.36], [0.165, 0.33], [0, 0.33]], 40), paint(p.color, 0.5));
  add(g, cyl(0.16, 0.16, 0.01, 30), paint("#2A1F18", 1), 0, 0.325, 0);
  if (sh === "snake") for (let i = 0; i < 16; i++) { const a = r() * 6.283, d = r() * 0.1, hh = 0.5 + r() * 0.55, lf = add(g, new THREE.SphereGeometry(0.5, 12, 14), leafM(i), Math.cos(a) * d, 0.33 + hh / 2, Math.sin(a) * d); lf.scale.set(0.085, hh, 0.02); lf.rotation.set((r() - 0.5) * 0.3, a, (r() - 0.5) * 0.3); }
  else if (sh === "palm") for (let i = 0; i < 9; i++) {
    const a = i * 0.7 + r() * 0.3, tilt = 0.25 + r() * 0.35, len = 0.9 + r() * 0.5, sx = Math.cos(a), sz = Math.sin(a);
    const s2 = add(g, cyl(0.006, 0.009, len, 6), std("#5C7A4A", 0.7), (sx * Math.sin(tilt) * len) / 2, 0.33 + (Math.cos(tilt) * len) / 2, (sz * Math.sin(tilt) * len) / 2); s2.rotation.order = "YXZ"; s2.rotation.y = -a; s2.rotation.z = -tilt;
    const lf = add(g, new THREE.SphereGeometry(0.5, 14, 10), leafM(i), sx * Math.sin(tilt) * (len + 0.12), 0.33 + Math.cos(tilt) * len + 0.02, sz * Math.sin(tilt) * (len + 0.12)); lf.scale.set(0.62, 0.03, 0.22); lf.rotation.order = "YXZ"; lf.rotation.y = -a; lf.rotation.z = -0.5 + tilt;
  } else if (sh === "olive") {
    add(g, cyl(0.014, 0.024, 1.15, 10), stem, 0, 0.905, 0);
    for (let i = 0; i < 90; i++) { const a = r() * 6.283, rr = Math.pow(r(), 0.6) * 0.34, yy = 1.3 + r() * 0.6, k = 1 - Math.abs(yy - 1.6) * 0.8, lf = add(g, new THREE.SphereGeometry(0.05, 8, 6), std(i % 2 ? "#7F8F72" : "#6B7C60", 0.6), Math.cos(a) * rr * k, yy, Math.sin(a) * rr * k); lf.scale.set(1, 0.22, 0.4); lf.rotation.set(r() * 3, r() * 6, r() * 3); }
  } else [[0, 0, 1.25, 0.02], [0.05, 0.04, 0.95, -0.12], [-0.05, -0.03, 0.8, 0.14]].forEach((s, si) => {
    add(g, cyl(0.011, 0.016, s[2], 8), stem, s[0], 0.33 + s[2] / 2, s[1]).rotation.z = s[3];
    const n = si === 0 ? 11 : 7;
    for (let i = 0; i < n; i++) { const hgt = 0.45 + (i / n) * (s[2] - 0.2) + 0.33, rad = 0.13 + r() * 0.05, a = i * 2.4 + si, lf = add(g, new THREE.SphereGeometry(0.12, 14, 10), leafM(i), s[0] - Math.sin(s[3]) * (hgt - 0.33) + Math.cos(a) * rad, hgt, s[1] + Math.sin(a) * rad); lf.scale.set(1.05, 0.07, 0.56); lf.rotation.order = "YXZ"; lf.rotation.y = -a; lf.rotation.z = 0.5 + r() * 0.3; }
  });
};

const piano: Build = (g, p, st) => {
  const wd = woodM(p.color, 0.28), br = metalM(st.metal);
  // back against -z, keys towards +z
  add(g, slab(1.5, 0.35, 1.25, 0.02, 0.008), wd, 0, 0, -0.125);
  add(g, slab(1.54, 0.39, 0.03, 0.01, 0.005), wd, 0, 1.25, -0.115);
  add(g, slab(1.46, 0.28, 0.1, 0.015, 0.006), wd, 0, 0.62, 0.17);
  add(g, box(1.24, 0.014, 0.15), paint("#F4EFE4", 0.25), 0, 0.726, 0.22);
  for (let i = 0; i < 51; i++) { const k = i % 7; if (k === 2 || k === 6) continue; add(g, box(0.012, 0.014, 0.09), paint("#17120F", 0.3), -0.608 + i * 0.0238, 0.738, 0.19, true); }
  for (const x of [-0.69, 0.69]) add(g, box(0.07, 0.62, 0.07), wd, x, 0.31, 0.26);
  for (const x of [-0.1, 0, 0.1]) add(g, box(0.03, 0.012, 0.09), br, x, 0.07, 0.1);
};

const other: Build = (g, p) => { add(g, slab(1, 1, 1, 0.03, 0.015), woodM(p.color, 0.5)); };

const BUILDERS: Record<string, Build> = { sofa, chair, table, side, shelf, console: consoleT, bed, dining, dchair, desk, media, wardrobe, bench, lamp, plant, piano, other };
/** Round or free-standing things keep their proportions; the rest stretch to the layout's footprint. */
const UNIFORM = new Set(["lamp", "plant", "side", "dchair", "chair"]);

/** One piece: its shape, moved and scaled onto its footprint from the layout. */
export function buildPiece(p: PieceModel, st: Style, eve: boolean): G {
  const outer = new THREE.Group();
  outer.userData.id = p.id;
  outer.position.set(p.cx, 0, p.cz);
  outer.rotation.y = p.rot;
  if (p.category === "rug") {
    const m = new THREE.MeshStandardMaterial({ map: rugTex(), color: tint(p.color), roughness: 1, bumpMap: weaveTex(), bumpScale: 0.004 });
    if (p.shape === "rect") { const geo = new THREE.PlaneGeometry(p.w, p.d); geo.rotateX(-PI / 2); add(outer, geo, m, 0, 0.012, 0, true); }
    else { const geo = new THREE.CircleGeometry(0.5, 72); geo.rotateX(-PI / 2); const c = add(outer, geo, m, 0, 0.012, 0, true); const k = p.shape === "round" ? Math.min(p.w, p.d) : 0; c.scale.set(k || p.w, 1, k || p.d); }
    return outer;
  }
  const inner = new THREE.Group();
  (BUILDERS[p.category] ?? other)(inner, p, st, eve);
  const bb = new THREE.Box3().setFromObject(inner), size = bb.getSize(new THREE.Vector3()), mid = bb.getCenter(new THREE.Vector3());
  inner.position.set(-mid.x, -bb.min.y, -mid.z);
  const scale = new THREE.Group();
  let sx = p.w / Math.max(0.01, size.x), sz = p.d / Math.max(0.01, size.z);
  if (UNIFORM.has(p.category)) sx = sz = Math.min(sx, sz);
  const sy = p.category === "other" || p.category === "piano" || p.category === "shelf" || p.category === "wardrobe" ? p.h / Math.max(0.01, size.y) : Math.max(0.8, Math.min(1.25, Math.sqrt(sx * sz)));
  scale.scale.set(sx, sy, sz);
  scale.add(inner); outer.add(scale);
  return outer;
}

/* ---------- the room shell ---------- */

type Frame = { len: number; /** World position for a point `t` metres along the plan axis, `y` up, `n` into the room. */ at: (t: number, y: number, n: number) => THREE.Vector3; ry: number; /** +1 when the wall's own x runs with the plan axis. */ sign: 1 | -1 };
function frames(W: number, L: number): Record<Wall, Frame> {
  return {
    A: { len: W, at: (t, y, n) => new THREE.Vector3(t, y, n), ry: 0, sign: 1 },
    C: { len: W, at: (t, y, n) => new THREE.Vector3(t, y, L - n), ry: PI, sign: -1 },
    D: { len: L, at: (t, y, n) => new THREE.Vector3(n, y, t), ry: PI / 2, sign: -1 },
    B: { len: L, at: (t, y, n) => new THREE.Vector3(W - n, y, t), ry: -PI / 2, sign: 1 },
  };
}

function openingHole(o: Opening, x: number) {
  if (o.kind === "door" && o.arched) return archShape(o.width, o.head - o.width / 2, x - o.width / 2);
  return rectShape(x - o.width / 2, o.sill, o.width, o.head - o.sill);
}

function buildShell(scene: THREE.Scene, m: ShowroomModel, eve: boolean) {
  const { w: W, l: L, h: H } = m.room, F = frames(W, L), sf = m.surfaces;
  const white = paint("#EFEAE2", 0.5);
  const shell = new THREE.Group(); scene.add(shell);
  add(shell, box(W + 0.5, 0.14, L + 0.5), paint("#D8CEC6", 0.9), W / 2, -0.071, L / 2, true);
  const ceil = add(shell, new THREE.PlaneGeometry(W, L), paint("#F1ECE5", 0.95), W / 2, H, L / 2, true); ceil.rotation.x = PI / 2;
  const floorTex = plankTex(), fgeo = new THREE.PlaneGeometry(L, W); fgeo.rotateX(-PI / 2);
  const fmat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.42, color: tint(sf.floor) });
  const fl = add(shell, fgeo, fmat, W / 2, 0, L / 2, true); fl.rotation.y = PI / 2; fl.userData.id = "floor";
  // one texture object serves every room size: set its tiling for this floor
  floorTex.repeat.set(L / 2, W / 2);

  const skirt = paint(lighter(sf.wall, 0.35), 0.6);
  for (const wall of ["A", "B", "C", "D"] as Wall[]) {
    const f = F[wall], grp = new THREE.Group();
    grp.position.copy(f.at(f.len / 2, 0, 0)); grp.rotation.y = f.ry; grp.userData.wall = wall; grp.userData.id = "walls";
    shell.add(grp);
    const lx = (t: number) => f.sign * (t - f.len / 2); // plan position → the wall's own x
    const here = m.openings.filter((o) => o.wall === wall);
    const shape = rectShape(-f.len / 2, 0, f.len, H);
    for (const o of here) shape.holes.push(openingHole(o, lx(o.at)));
    add(grp, new THREE.ShapeGeometry(shape, 24), new THREE.MeshStandardMaterial({ color: col(sf.wall), map: plasterTex(), bumpMap: plasterTex(), bumpScale: 0.006, roughness: 0.93 }), 0, 0, 0, true);
    // skirting, broken at doors
    const doors = here.filter((o) => o.kind === "door").map((o) => [lx(o.at) - o.width / 2 - 0.1, lx(o.at) + o.width / 2 + 0.1]).sort((a, b) => a[0] - b[0]);
    let x0 = -f.len / 2;
    for (const [a, b] of [...doors, [f.len / 2, f.len / 2]]) { if (a - x0 > 0.05) add(grp, box(a - x0, 0.09, 0.016), skirt, (a + x0) / 2, 0.045, 0.008, true); x0 = Math.max(x0, b); }

    for (const o of here) {
      const x = lx(o.at), og = new THREE.Group(); og.position.set(x, 0, 0); grp.add(og);
      if (o.kind === "window") {
        const hgt = o.head - o.sill, ring = rectShape(-o.width / 2, 0, o.width, hgt), hole = new THREE.Path();
        hole.moveTo(-o.width / 2 + 0.055, 0.055); hole.lineTo(o.width / 2 - 0.055, 0.055); hole.lineTo(o.width / 2 - 0.055, hgt - 0.055); hole.lineTo(-o.width / 2 + 0.055, hgt - 0.055); hole.closePath(); ring.holes.push(hole);
        add(og, new THREE.ExtrudeGeometry(ring, { depth: 0.22, bevelEnabled: false }), white, 0, o.sill, -0.22);
        add(og, box(0.05, hgt - 0.1, 0.05), white, 0, o.sill + hgt / 2, -0.12);
        add(og, new THREE.PlaneGeometry(o.width - 0.1, hgt - 0.1), glass("#DCEBF2", 0.12), 0, o.sill + hgt / 2, -0.13, true);
        add(og, box(o.width + 0.12, 0.035, 0.16), white, 0, o.sill - 0.015, 0.06);
        const sky = new THREE.MeshBasicMaterial({ map: skyTex(eve) }); sky.color.setRGB(eve ? 0.5 : 1.7, eve ? 0.5 : 1.7, eve ? 0.6 : 1.7);
        add(og, new THREE.PlaneGeometry(o.width + 1.6, hgt + 1.2), sky, 0, o.sill + hgt / 2, -0.75, true).userData.id = "sky";
      } else {
        const dm = paint(sf.door, 0.36); og.userData.id = "doors";
        if (o.arched) {
          const band = archShape(o.width + 0.18, o.head - o.width / 2, -o.width / 2 - 0.09); band.holes.push(archShape(o.width, o.head - o.width / 2, -o.width / 2));
          add(og, new THREE.ExtrudeGeometry(band, { depth: 0.13, bevelEnabled: false, curveSegments: 28 }), dm, 0, 0, -0.11);
          add(og, new THREE.ShapeGeometry(archShape(o.width, o.head - o.width / 2, -o.width / 2), 28), paint(sf.door, 0.32), 0, 0, -0.09, true);
        } else {
          const band = rectShape(-o.width / 2 - 0.07, 0, o.width + 0.14, o.head + 0.07); band.holes.push(rectShape(-o.width / 2, 0, o.width, o.head));
          add(og, new THREE.ExtrudeGeometry(band, { depth: 0.13, bevelEnabled: false }), white, 0, 0, -0.11);
          add(og, new THREE.PlaneGeometry(o.width, o.head), dm, 0, o.head / 2, -0.07, true);
        }
        const inset = paint(darker(sf.door, 0.2), 0.36), pw = o.width - 0.28;
        add(og, box(pw, 0.62, 0.012), inset, 0, 0.52, -0.064, true); add(og, box(pw, Math.max(0.3, o.head - (o.arched ? o.width / 2 : 0) - 1.1), 0.012), inset, 0, 0.98 + Math.max(0.3, o.head - (o.arched ? o.width / 2 : 0) - 1.1) / 2, -0.064, true);
        add(og, new THREE.SphereGeometry(0.03, 20, 14), metalM(sf.metal), o.width / 2 - 0.14, 1.02, -0.03);
      }
    }
    for (const r of m.radiators.filter((x) => x.wall === wall)) {
      const n = Math.round(r.width / 0.1);
      for (let i = 0; i < n; i++) add(grp, slab(0.075, 0.07, 0.4, 0.02, 0.008), white, lx(r.at) - r.width / 2 + 0.05 + i * 0.1, 0.2, 0.075);
    }
  }
  return F;
}

function buildExtras(scene: THREE.Scene, m: ShowroomModel, F: Record<Wall, Frame>, eve: boolean) {
  const sf = m.surfaces, H = m.room.h;
  for (const e of m.extras) {
    const f = F[e.wall], grp = new THREE.Group(); grp.userData.id = e.id; grp.userData.wall = e.wall; scene.add(grp);
    if (e.kind === "pendant") {
      grp.userData.wall = undefined;
      const over = m.pieces.find((p) => p.category === "dining") ?? m.pieces.find((p) => p.category === "table") ?? m.pieces.find((p) => p.category === "bed");
      const x = over?.cx ?? m.room.w / 2, z = over?.cz ?? m.room.l / 2, br = metalM(e.color), cord = std("#2A211C", 0.6);
      add(grp, cyl(0.16, 0.16, 0.02, 40), br, x, H - 0.01, z, true);
      for (const [dx, dz, y] of [[-0.3, 0.06, H - 0.72], [0.04, -0.12, H - 0.98], [0.31, 0.1, H - 0.6]]) {
        add(grp, cyl(0.004, 0.004, H - y - 0.14, 6), cord, x + dx, (H + y + 0.14) / 2, z + dz, true);
        add(grp, cyl(0.03, 0.036, 0.07, 20), br, x + dx, y + 0.135, z + dz);
        add(grp, new THREE.SphereGeometry(0.035, 16, 12), glow(eve), x + dx, y, z + dz, true);
        add(grp, new THREE.SphereGeometry(0.115, 40, 28), glass("#FFF4E0", 0.22), x + dx, y, z + dz, true);
      }
      continue;
    }
    grp.rotation.y = f.ry;
    if (e.kind === "curtains") {
      const mat = fab("linen", e.color); mat.side = THREE.DoubleSide;
      grp.position.copy(f.at(f.len / 2, 0, 0));
      const lx = (t: number) => f.sign * (t - f.len / 2);
      for (const o of m.openings.filter((x) => x.wall === e.wall && x.kind === "window")) {
        const top = Math.min(H - 0.12, o.head + 0.22), hgt = top - 0.03;
        for (const sgn of [-1, 1]) {
          const geo = new THREE.PlaneGeometry(0.56, hgt, 48, 10), pos = geo.attributes.position;
          for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), u = x / 0.56 + 0.5, pinch = 0.55 + 0.45 * ((y + hgt / 2) / hgt); pos.setZ(i, Math.sin(u * PI * 11) * 0.04 * (1.15 - pinch * 0.3)); pos.setX(i, x * (0.9 + 0.1 * pinch)); }
          geo.computeVertexNormals();
          add(grp, geo, mat, lx(o.at) + sgn * (o.width / 2 + 0.12), 0.03 + hgt / 2, 0.11);
        }
        add(grp, cyl(0.012, 0.012, o.width + 1.0, 14), metalM(sf.metal), lx(o.at), top + 0.02, 0.11).rotation.z = PI / 2;
      }
      continue;
    }
    grp.position.copy(f.at(Math.max(0.6, Math.min(f.len - 0.6, e.at)), e.y, 0));
    if (e.kind === "mirror") {
      add(grp, new THREE.CircleGeometry(0.39, 64), new THREE.MeshStandardMaterial({ color: col("#E4EAEE"), roughness: 0.03, metalness: 1 }), 0, 0, 0.016, true);
      add(grp, new THREE.TorusGeometry(0.395, 0.014, 16, 96), metalM(e.color), 0, 0, 0.02);
    } else {
      add(grp, box(1.0, 0.7, 0.03), metalM(sf.metal), 0, 0, 0.017);
      add(grp, new THREE.PlaneGeometry(0.94, 0.64), new THREE.MeshStandardMaterial({ map: artTex([e.color, sf.seating, sf.light, sf.metal], e.wall.charCodeAt(0)), roughness: 0.85 }), 0, 0, 0.034, true);
    }
  }
}

export type Built = { scene: THREE.Scene; envScene: THREE.Scene; sun: THREE.DirectionalLight; hemi: THREE.HemisphereLight; points: THREE.PointLight[] };

/** The whole room for a model. Needs no renderer, so it can be checked without a screen. */
export function buildScene(m: ShowroomModel, eve: boolean): Built {
  const { w: W, l: L, h: H } = m.room, sf = m.surfaces;
  const scene = new THREE.Scene();
  scene.background = col("#EFE7E1");
  const F = buildShell(scene, m, eve);
  const st: Style = { wood: sf.wood, metal: sf.metal, accent: sf.accent, light: sf.light, seating: sf.seating };
  for (const p of m.pieces) scene.add(buildPiece(p, st, eve));
  buildExtras(scene, m, F, eve);

  const hemi = new THREE.HemisphereLight(col("#FFF4E4"), col("#5A4A3C"), eve ? 0.07 : 0.34); scene.add(hemi);
  // daylight comes in through the first window; without one, from the wall C side
  const win = m.openings.find((o) => o.kind === "window"), wf = F[win?.wall ?? "C"], out = wf.at(win?.at ?? wf.len / 2, 0, -3.2), inn = wf.at(win?.at ?? wf.len / 2, 0, Math.min(W, L) * 0.7);
  const sun = new THREE.DirectionalLight(col("#FFF1DC"), eve ? 0 : 1.55);
  sun.position.set(out.x, H + 1.7, out.z); sun.target.position.set(inn.x, 0, inn.z); scene.add(sun); scene.add(sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const span = Math.max(W, L) * 0.85 + 1;
  Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 0.5, far: span * 3 + 8 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  const points: THREE.PointLight[] = [];
  const pt = (x: number, y: number, z: number, day: number, night: number, shadow = false) => {
    const p = new THREE.PointLight(col("#FFC98A"), eve ? night : day, Math.max(6.5, Math.max(W, L) * 1.3), 1.6);
    p.position.set(x, y, z);
    if (shadow) { p.castShadow = true; p.shadow.mapSize.set(1024, 1024); p.shadow.bias = -0.003; }
    scene.add(p); points.push(p);
  };
  pt(W / 2, H - 0.75, L / 2, 0.35, 2.3, true);
  for (const p of m.pieces.filter((x) => x.category === "lamp").slice(0, 2)) pt(p.cx, 1.42, p.cz, 0.22, 1.5);

  const envScene = new THREE.Scene();
  const eb = new THREE.Mesh(box(10, 6, 10), new THREE.MeshBasicMaterial({ side: THREE.BackSide })); (eb.material as THREE.MeshBasicMaterial).color.setRGB(0.42, 0.4, 0.37); envScene.add(eb);
  const panel = (w: number, h: number, x: number, y: number, z: number, ry: number, r: number, g2: number, b2: number) => { const pm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })); (pm.material as THREE.MeshBasicMaterial).color.setRGB(r, g2, b2); pm.position.set(x, y, z); pm.rotation.y = ry; envScene.add(pm); };
  panel(2.6, 2.0, 0, 0.3, 4.9, PI, 5, 5.2, 5.6); panel(1.4, 1.4, -4.9, 0.6, 0, PI / 2, 2.2, 1.8, 1.3); panel(1.2, 1.2, 4.9, 0.8, -1, -PI / 2, 2.4, 2.0, 1.5);
  const envI = eve ? 0.22 : 1;
  scene.traverse((o) => { const mt = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined; if (mt && "envMapIntensity" in mt) mt.envMapIntensity = envI; });
  return { scene, envScene, sun, hemi, points };
}

/* ---------- camera views ---------- */

export function viewFor(v: View, room: ShowroomModel["room"], aspect = 1.5) {
  const { w: W, l: L, h: H } = room, deg = (r: number) => (r * 180) / PI;
  const fit = (len: number, dist: number) => Math.max(34, Math.min(78, deg(2 * Math.atan(Math.max(H / 2 + 0.15, len / 2 / aspect) / dist))));
  const big = Math.max(W, L);
  switch (v) {
    case "A": return { p: [W / 2, 1.4, L - 0.3], t: [W / 2, 1.28, 0], f: fit(W, L - 0.3), mode: "look" as const, hide: [] as Wall[] };
    case "C": return { p: [W / 2, 1.5, 0.3], t: [W / 2, 1.25, L], f: fit(W, L - 0.3), mode: "look" as const, hide: [] as Wall[] };
    case "B": return { p: [0.3, 1.4, L / 2], t: [W, 1.25, L / 2], f: fit(L, W - 0.3), mode: "look" as const, hide: [] as Wall[] };
    case "D": return { p: [W - 0.3, 1.4, L / 2], t: [0, 1.28, L / 2], f: fit(L, W - 0.3), mode: "look" as const, hide: [] as Wall[] };
    case "doll": return { p: [W / 2 + big * 1.25, big * 1.25, L / 2 + big * 1.35], t: [W / 2, 0.7, L / 2], f: 34, mode: "orbit" as const, hide: ["B", "C"] as Wall[] };
    case "plan": return { p: [W / 2, big * 2 + 1.5, L / 2 + 0.01], t: [W / 2, 0, L / 2], f: 36, mode: "fixed" as const, hide: ["B", "C"] as Wall[] };
    default: return { p: [W - 0.6, 1.5, L - 0.4], t: [W * 0.38, 1.05, L * 0.2], f: 60, mode: "look" as const, hide: [] as Wall[] };
  }
}

/* ---------- the live showroom on a canvas ---------- */

export type Showroom = { update: (m: ShowroomModel, eve: boolean) => void; setView: (v: View, instant?: boolean) => void; dispose: () => void };

export function createShowroom(canvas: HTMLCanvasElement, model: ShowroomModel, onSelect: (id: string) => void): Showroom {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.useLegacyLights = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const camera = new THREE.PerspectiveCamera(60, 1.5, 0.08, 80);
  const pos = new THREE.Vector3(), tgt = new THREE.Vector3();
  let built: Built | null = null, env: THREE.Texture | null = null, m = model, view: View = "room";
  let mode: "look" | "orbit" | "fixed" = "look", dirty = true, raf = 0, cw = 0, ch = 0, alive = true;
  let tween: { p0: THREE.Vector3; t0: THREE.Vector3; f0: number; p: THREE.Vector3; t: THREE.Vector3; f: number; s: number } | null = null;

  const disposeScene = (b: Built) => b.scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    mesh.geometry?.dispose?.();
    const mt = mesh.material as Mat | Mat[] | undefined;
    (Array.isArray(mt) ? mt : mt ? [mt] : []).forEach((x) => x.dispose());
  });
  const applyHide = () => {
    const hide = viewFor(view, m.room).hide;
    built?.scene.traverse((o) => { if (o.userData.wall) o.visible = !hide.includes(o.userData.wall); });
  };
  const update = (next: ShowroomModel, eve: boolean) => {
    const resized = next.room.w !== m.room.w || next.room.l !== m.room.l || next.room.h !== m.room.h;
    m = next;
    if (built) disposeScene(built);
    built = buildScene(m, eve);
    if (!env) { try { env = pmrem.fromScene(built.envScene, 0.03).texture; } catch { env = null; } }
    built.scene.environment = env;
    renderer.toneMappingExposure = eve ? 1.3 : 1;
    applyHide();
    if (resized) setView(view, true);
    dirty = true;
  };
  const setView = (v: View, instant = false) => {
    view = v;
    const c = viewFor(v, m.room, cw && ch ? cw / ch : 1.5);
    mode = c.mode;
    applyHide();
    const p = new THREE.Vector3(...(c.p as [number, number, number])), t = new THREE.Vector3(...(c.t as [number, number, number]));
    if (instant) { pos.copy(p); tgt.copy(t); camera.fov = c.f; camera.updateProjectionMatrix(); tween = null; }
    else tween = { p0: pos.clone(), t0: tgt.clone(), f0: camera.fov, p, t, f: c.f, s: performance.now() };
    dirty = true;
  };

  const tick = () => {
    if (!alive) return;
    raf = requestAnimationFrame(tick);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w && h && (w !== cw || h !== ch)) { cw = w; ch = h; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true; }
    if (tween) {
      const u = Math.min(1, (performance.now() - tween.s) / 800), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      pos.lerpVectors(tween.p0, tween.p, e); tgt.lerpVectors(tween.t0, tween.t, e);
      camera.fov = tween.f0 + (tween.f - tween.f0) * e; camera.updateProjectionMatrix();
      if (u >= 1) tween = null;
      dirty = true;
    }
    if (dirty && built && w && h) { camera.position.copy(pos); camera.lookAt(tgt); renderer.render(built.scene, camera); dirty = false; }
  };

  let drag: { x: number; y: number; sx: number; sy: number; moved: boolean } | null = null;
  const down = (e: PointerEvent) => { drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, moved: false }; try { canvas.setPointerCapture(e.pointerId); } catch { /* not capturable */ } };
  const move = (e: PointerEvent) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 5) drag.moved = true;
    if (!drag.moved || mode === "fixed" || tween) return;
    const look = mode === "look", v = look ? tgt.clone().sub(pos) : pos.clone().sub(tgt), len = v.length();
    let yaw = Math.atan2(v.x, v.z), pitch = Math.asin(Math.max(-1, Math.min(1, v.y / len)));
    if (look) { yaw += dx * 0.004; pitch = Math.max(-0.9, Math.min(0.75, pitch + dy * 0.003)); }
    else { yaw -= dx * 0.005; pitch = Math.max(0.18, Math.min(1.45, pitch + dy * 0.004)); }
    v.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(len);
    if (look) tgt.copy(pos).add(v); else pos.copy(tgt).add(v);
    dirty = true;
  };
  const up = (e: PointerEvent) => {
    const d = drag; drag = null;
    if (!d || d.moved || !built) return;
    const rc = canvas.getBoundingClientRect(), ray = new THREE.Raycaster();
    camera.position.copy(pos); camera.lookAt(tgt); camera.updateMatrixWorld();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1), camera);
    for (const hit of ray.intersectObjects(built.scene.children, true)) {
      let vis = true, id: string | undefined;
      for (let o: THREE.Object3D | null = hit.object; o; o = o.parent) { if (!o.visible) vis = false; id ??= o.userData.id; }
      if (!vis) continue;
      if (id && id !== "sky") onSelect(id);
      return;
    }
  };
  canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);

  update(model, false);
  setView("room", true);
  raf = requestAnimationFrame(tick);
  return {
    update, setView,
    dispose: () => {
      alive = false; cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", up);
      if (built) disposeScene(built);
      env?.dispose(); pmrem.dispose(); renderer.dispose();
    },
  };
}

/* ---------- guide pictures for the hyper-realistic walls ---------- */

export type Guide = {
  /** The wall seen straight on, as a JPEG data address. */
  image: string;
  width: number; height: number;
  /** Where each item is in the picture, in percent: [x, y, w, h], clipped to the frame. Keyed by item id. */
  boxes: Record<string, [number, number, number, number]>;
};

/** A camera looking straight at a wall from inside the room, framing exactly the wall: its length and its height. */
export function elevationCamera(room: ShowroomModel["room"], wall: Wall) {
  const { w: W, l: L, h: H } = room, len = wall === "A" || wall === "C" ? W : L, depth = wall === "A" || wall === "C" ? L : W;
  const cam = new THREE.OrthographicCamera(-len / 2, len / 2, H / 2, -H / 2, 0.01, depth + 1);
  const at = { A: [W / 2, H / 2, depth - 0.02, W / 2, H / 2, 0], C: [W / 2, H / 2, L - depth + 0.02, W / 2, H / 2, L], B: [W - depth + 0.02, H / 2, L / 2, W, H / 2, L / 2], D: [depth - 0.02, H / 2, L / 2, 0, H / 2, L / 2] }[wall];
  cam.position.set(at[0], at[1], at[2]);
  cam.lookAt(at[3], at[4], at[5]);
  cam.updateMatrixWorld();
  return cam;
}

/** Where an object lands in a camera's picture, in percent of the frame, or null when it is out of view. */
export function screenBox(obj: THREE.Object3D, camera: THREE.Camera): [number, number, number, number] | null {
  const bb = new THREE.Box3().setFromObject(obj);
  if (bb.isEmpty()) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, ahead = 0;
  const v = new THREE.Vector3();
  const camPos = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld), dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
    v.set(x, y, z);
    if (v.clone().sub(camPos).dot(dir) <= 0.05) continue; // behind the camera
    ahead++;
    v.project(camera);
    x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
  }
  if (!ahead) return null;
  const px = (n: number) => Math.max(0, Math.min(100, ((n + 1) / 2) * 100));
  const py = (n: number) => Math.max(0, Math.min(100, ((1 - n) / 2) * 100));
  const L = px(x0), R = px(x1), T = py(y1), B = py(y0);
  return R - L > 0.5 && B - T > 0.5 ? [L, T, R - L, B - T] : null;
}

/**
 * Draws one wall of the person's room as a guide for the image AI, as the same straight-on elevation as the
 * wall's outline in step 5: the wall fills the frame edge to edge and floor to ceiling, with its doors and
 * windows and only the pieces the outline shows on it, at their real size and place. Needs WebGL.
 */
export function renderGuide(m: ShowroomModel, wall: Wall, width = 1536): Guide {
  const len = wall === "A" || wall === "C" ? m.room.w : m.room.l, H = m.room.h;
  const height = Math.max(256, Math.min(2048, Math.round((width * H) / len)));
  // only what the outline shows on this wall (rugs lie flat and can't be seen straight on)
  const onWall: ShowroomModel = { ...m, pieces: m.pieces.filter((p) => p.wall === wall && p.category !== "rug"), extras: m.extras.filter((e) => e.wall === wall && e.kind !== "pendant") };
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  try {
    renderer.setPixelRatio(1);
    renderer.setSize(width, height, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.useLegacyLights = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const built = buildScene(onWall, false);
    const pm = new THREE.PMREMGenerator(renderer);
    try { built.scene.environment = pm.fromScene(built.envScene, 0.03).texture; } catch { /* no reflections */ }
    const camera = elevationCamera(m.room, wall);
    renderer.render(built.scene, camera);
    const image = canvas.toDataURL("image/jpeg", 0.92);
    const boxes: Guide["boxes"] = {};
    for (const o of built.scene.children) {
      const id = o.userData.id as string | undefined;
      if (!id) continue;
      const b = screenBox(o, camera);
      if (b) boxes[id] = b;
    }
    // walls, floor and doors are parts of the shell: find them inside it
    built.scene.traverse((o) => {
      const id = o.userData.id as string | undefined;
      if (!id || boxes[id] || (id !== "walls" && id !== "floor" && id !== "doors")) return;
      // only this wall's own surface and door
      let w: unknown;
      for (let p: THREE.Object3D | null = o; p && !w; p = p.parent) w = p.userData.wall;
      if (id !== "floor" && w !== wall) return;
      const b = screenBox(o, camera);
      if (b) boxes[id] = b;
    });
    pm.dispose();
    built.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const mt = mesh.material as Mat | Mat[] | undefined;
      (Array.isArray(mt) ? mt : mt ? [mt] : []).forEach((x) => x.dispose());
    });
    return { image, width, height, boxes };
  } finally {
    renderer.dispose();
    renderer.forceContextLoss?.();
  }
}
