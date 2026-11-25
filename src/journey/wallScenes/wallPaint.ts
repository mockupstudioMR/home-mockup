/**
 * A new wall colour without the image AI: the wall's own pixels, found on the photo by their colour and by
 * smooth steps between neighbours (so the fill stops at every piece's edge, a cushion the wall's colour
 * included), are recoloured keeping the photo's light and shading. Nothing else in the picture moves, so a
 * wall colour can never leave a band, a patch on a chair or an outline around the sofa.
 *
 * Pure functions on raw RGBA pixels, so they run in the browser and in tests alike.
 */
import type { PxBox, Rgba } from "./layers";

const lum = (d: Uint8ClampedArray, i: number) => d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;

/** The wall's colour: the middle colour of the seed area (by luminance), and its luminance. */
function reference(img: Rgba, seeds: PxBox) {
  const { width: w, data: d } = img;
  const vals: number[][] = [];
  for (let y = seeds.y0; y < seeds.y1; y += 2) for (let x = seeds.x0; x < seeds.x1; x += 2) {
    const i = (y * w + x) * 4;
    vals.push([lum(d, i), d[i], d[i + 1], d[i + 2]]);
  }
  vals.sort((a, b) => a[0] - b[0]);
  // the middle half, so a light switch or a frame in the seed area doesn't count
  const mid = vals.slice(Math.floor(vals.length * 0.25), Math.ceil(vals.length * 0.75));
  const avg = [0, 0, 0, 0];
  for (const v of mid) for (let k = 0; k < 4; k++) avg[k] += v[k] / mid.length;
  return { l: Math.max(1, avg[0]), rgb: [avg[1], avg[2], avg[3]] };
}

/**
 * Where the wall is (0–1 per pixel), grown from the seed area. `within` limits it (default: the whole picture).
 * A pixel joins when its colour, apart from brightness, is the wall's and the step from its neighbour is small.
 */
export function wallMask(img: Rgba, seeds: PxBox, within?: PxBox, opts: { chroma?: number; step?: number; edge?: number } = {}): Float32Array {
  const { width: w, height: h, data: d } = img;
  const area = within ?? { x0: 0, y0: 0, x1: w, y1: h };
  const ref = reference(img, seeds);
  // hue and saturation stay steady across a wall as daylight brightens or dims it; brightness doesn't
  const hs = (r: number, g: number, b: number) => {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), c = mx - mn;
    let hue = 0;
    if (c > 0) hue = mx === r ? ((g - b) / c + 6) % 6 : mx === g ? (b - r) / c + 2 : (r - g) / c + 4;
    return { hue: hue * 60, sat: mx ? c / mx : 0 };
  };
  const rh = hs(ref.rgb[0], ref.rgb[1], ref.rgb[2]);
  const grey = rh.sat < 0.12;
  const HUE = opts.chroma ?? 16, STEP = opts.step ?? 12;
  const likeWall = (i: number) => {
    const l = lum(d, i) / ref.l;
    if (l < 0.15 || l > 2.8) return false;
    const q = hs(d[i], d[i + 1], d[i + 2]);
    // in a piece's shadow the wall gets darker and its colour deeper and warmer: the darker the pixel, the
    // looser the colour match (the step check between neighbours still stops it at every piece's edge)
    const shade = l < 0.85 ? Math.min(1, (0.85 - l) / 0.6) : 0;
    if (grey) return q.sat < 0.16 + shade * 0.2;
    const dh = Math.abs(q.hue - rh.hue), dhue = Math.min(dh, 360 - dh);
    return dhue < HUE + shade * 22 && q.sat > rh.sat * 0.3 && q.sat < rh.sat * (1.6 + shade * 1.2);
  };
  const step = (i: number, j: number) => Math.max(Math.abs(d[i] - d[j]), Math.abs(d[i + 1] - d[j + 1]), Math.abs(d[i + 2] - d[j + 2]));
  // a soft (blurred) edge changes little from one pixel to the next but a lot over a few: measured across 4 px,
  // a cushion's or a seat's edge stops the fill even where it is the wall's own colour family
  const EDGE = opts.edge ?? 34;
  const across = (p: number) => {
    const x = p % w, y = (p - x) / w;
    let e = 0;
    if (x >= 2 && x < w - 2) e = Math.max(e, step((p - 2) * 4, (p + 2) * 4));
    if (y >= 2 && y < h - 2) e = Math.max(e, step((p - 2 * w) * 4, (p + 2 * w) * 4));
    return e;
  };
  const m = new Float32Array(w * h), stack: number[] = [];
  for (let y = seeds.y0; y < seeds.y1; y++) for (let x = seeds.x0; x < seeds.x1; x++) {
    const p = y * w + x;
    if (!m[p] && likeWall(p * 4)) { m[p] = 1; stack.push(p); }
  }
  while (stack.length) {
    const p = stack.pop()!, x = p % w, y = (p - x) / w;
    const next = [x > area.x0 ? p - 1 : -1, x < area.x1 - 1 ? p + 1 : -1, y > area.y0 ? p - w : -1, y < area.y1 - 1 ? p + w : -1];
    for (const q of next) if (q >= 0 && !m[q] && likeWall(q * 4) && step(p * 4, q * 4) <= STEP && across(q) <= EDGE) { m[q] = 1; stack.push(q); }
  }
  // fill pin-holes (grain, a speck) but never a whole object hung on the wall
  const seen = new Uint8Array(w * h), limit = Math.max(16, Math.round(w * h * 0.00015));
  for (let y = area.y0; y < area.y1; y++) for (let x = area.x0; x < area.x1; x++) {
    const p0 = y * w + x;
    if (m[p0] || seen[p0]) continue;
    // walk the whole hole (so none of it is visited again as a "small" one), keep it only if small and inside
    const comp: number[] = [p0], q: number[] = [p0]; seen[p0] = 1;
    let edge = false, size = 1;
    while (q.length) {
      const p = q.pop()!, px = p % w, py = (p - px) / w;
      if (px === area.x0 || px === area.x1 - 1 || py === area.y0 || py === area.y1 - 1) edge = true;
      for (const n of [px > area.x0 ? p - 1 : -1, px < area.x1 - 1 ? p + 1 : -1, py > area.y0 ? p - w : -1, py < area.y1 - 1 ? p + w : -1]) {
        if (n >= 0 && !m[n] && !seen[n]) { seen[n] = 1; q.push(n); size++; if (size <= limit) comp.push(n); }
      }
    }
    if (!edge && size <= limit) for (const p of comp) m[p] = 1;
  }
  // a soft rim one pixel wide, on the wall's side, for a clean edge against each piece
  const out = new Float32Array(m);
  for (let y = area.y0 + 1; y < area.y1 - 1; y++) for (let x = area.x0 + 1; x < area.x1 - 1; x++) {
    const p = y * w + x;
    if (!m[p]) continue;
    // the photo's anti-aliased edge pixel just outside, half covered, so no line of the old colour stays
    for (const q of [p - 1, p + 1, p - w, p + w]) if (!m[q] && out[q] < 0.5) out[q] = 0.5;
  }
  return out;
}

/** "#rrggbb" to [r, g, b]. */
export function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", "").slice(0, 6).padEnd(6, "0"), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * The wall in a new colour, as a see-through layer the size of the picture: each wall pixel is the new colour
 * times its own brightness against the wall's, so daylight, falloff and grain stay exactly as photographed.
 */
export function paintWall(img: Rgba, mask: Float32Array, seeds: PxBox, colour: string): Rgba {
  const { width: w, height: h, data: d } = img;
  const ref = reference(img, seeds);
  const [r, g, b] = hexRgb(colour);
  // a light colour needs headroom: shading is applied around its own brightness, never past white
  const tl = r * 0.299 + g * 0.587 + b * 0.114;
  const out = new Uint8ClampedArray(w * h * 4);
  for (let p = 0; p < w * h; p++) {
    const a = mask[p];
    if (!a) continue;
    const i = p * 4, k = lum(d, i) / ref.l;
    // a light colour keeps the shading but leaves room for sunlight, instead of burning out to white
    const lift = tl > 170 ? 0.94 * Math.pow(k, 0.55) : k;
    out[i] = r * lift; out[i + 1] = g * lift; out[i + 2] = b * lift; out[i + 3] = Math.round(255 * a);
  }
  return { data: out, width: w, height: h };
}

/** Where to look for the wall: the top part of the wall's area, away from the door and windows. */
export function wallSeeds(width: number, height: number, wallBox: PxBox, avoid: PxBox[]): PxBox {
  const y0 = Math.max(0, wallBox.y0 + Math.round((wallBox.y1 - wallBox.y0) * 0.04));
  const y1 = Math.min(height, y0 + Math.max(8, Math.round((wallBox.y1 - wallBox.y0) * 0.18)));
  // the widest run of columns at that height not covered by a door, window or piece
  const free = new Uint8Array(width).fill(1);
  for (const b of avoid) if (b.y0 < y1 && b.y1 > y0) for (let x = Math.max(0, b.x0); x < Math.min(width, b.x1); x++) free[x] = 0;
  let best = { x0: wallBox.x0, x1: wallBox.x1 }, run = -1, start = 0;
  for (let x = Math.max(0, wallBox.x0); x <= Math.min(width, wallBox.x1); x++) {
    if (x < Math.min(width, wallBox.x1) && free[x]) continue;
    if (x - start > run) { run = x - start; best = { x0: start, x1: x }; }
    start = x + 1;
  }
  const pad = Math.round((best.x1 - best.x0) * 0.1);
  return { x0: best.x0 + pad, x1: Math.max(best.x0 + pad + 4, best.x1 - pad), y0, y1 };
}

/**
 * A rug (or any flat surface) dyed a new colour on the photo itself: each pixel inside `mask` becomes the new
 * colour times its own brightness against the surface's, so the pattern, pile and light stay as photographed.
 * Returns the whole picture with the surface recoloured.
 */
export function dyeSurface(img: Rgba, mask: Float32Array, colour: string): Rgba {
  const { width: w, height: h, data: d } = img;
  const ls: number[] = [];
  for (let p = 0; p < w * h; p += 2) if (mask[p] >= 0.5) ls.push(lum(d, p * 4));
  ls.sort((a, b) => a - b);
  const ref = Math.max(1, ls.length ? ls[Math.floor(ls.length / 2)] : 128);
  const [r, g, b] = hexRgb(colour);
  const out = new Uint8ClampedArray(d);
  for (let p = 0; p < w * h; p++) {
    const a = mask[p];
    if (!a) continue;
    const i = p * 4, k = lum(d, i) / ref;
    out[i] = d[i] * (1 - a) + r * k * a; out[i + 1] = d[i + 1] * (1 - a) + g * k * a; out[i + 2] = d[i + 2] * (1 - a) + b * k * a;
  }
  return { data: out, width: w, height: h };
}
