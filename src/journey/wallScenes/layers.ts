/**
 * Turning a wall picture and its edited copies into swappable layers.
 *
 * Each alternative is the same photograph with one item redrawn. Comparing it with the original, inside the
 * item's box, gives the pixels that belong to the item. The union of those pixels over all alternatives is the
 * layer's shape; every variation (the original included) is cut to that same shape, so swapping is seamless.
 *
 * Pure functions on raw RGBA pixels, so they run in the browser and in tests alike.
 */

export type Rgba = { data: Uint8ClampedArray; width: number; height: number };
/** [x, y, w, h] in percent of the picture. */
export type PctBox = [number, number, number, number];
type PxBox = { x0: number; y0: number; x1: number; y1: number };

/** A percent box in pixels, grown by `grow` of its size on every side and clipped to the picture. */
export function pxBox(b: PctBox, width: number, height: number, grow = 0.12): PxBox {
  const w = (b[2] / 100) * width, h = (b[3] / 100) * height;
  const gx = Math.max(6, w * grow), gy = Math.max(6, h * grow);
  return {
    x0: Math.max(0, Math.floor((b[0] / 100) * width - gx)),
    y0: Math.max(0, Math.floor((b[1] / 100) * height - gy)),
    x1: Math.min(width, Math.ceil(((b[0] + b[2]) / 100) * width + gx)),
    y1: Math.min(height, Math.ceil(((b[1] + b[3]) / 100) * height + gy)),
  };
}

/** How much an alternative changed the picture outside the item's box (mean of the largest channel difference, 0–255). */
export function driftOutside(base: Rgba, alt: Rgba, box: PxBox, step = 4): number {
  let sum = 0, n = 0;
  for (let y = 0; y < base.height; y += step) for (let x = 0; x < base.width; x += step) {
    if (x >= box.x0 && x < box.x1 && y >= box.y0 && y < box.y1) continue;
    const i = (y * base.width + x) * 4;
    sum += Math.max(Math.abs(base.data[i] - alt.data[i]), Math.abs(base.data[i + 1] - alt.data[i + 1]), Math.abs(base.data[i + 2] - alt.data[i + 2]));
    n++;
  }
  return n ? sum / n : 0;
}

/** Grow (max) or shrink (min) a mask by `r` pixels inside the box, as two separable passes. */
function morph(m: Float32Array, w: number, box: PxBox, r: number, grow: boolean): Float32Array {
  if (r <= 0) return m;
  const tmp = new Float32Array(m.length), out = new Float32Array(m.length);
  const pick = grow ? Math.max : Math.min;
  for (let y = box.y0; y < box.y1; y++) for (let x = box.x0; x < box.x1; x++) {
    let v = grow ? 0 : 1;
    for (let k = Math.max(box.x0, x - r); k <= Math.min(box.x1 - 1, x + r); k++) v = pick(v, m[y * w + k]);
    tmp[y * w + x] = v;
  }
  for (let y = box.y0; y < box.y1; y++) for (let x = box.x0; x < box.x1; x++) {
    let v = grow ? 0 : 1;
    for (let k = Math.max(box.y0, y - r); k <= Math.min(box.y1 - 1, y + r); k++) v = pick(v, tmp[k * w + x]);
    out[y * w + x] = v;
  }
  return out;
}

/** Soft edges: a box blur of radius r, inside the box. */
function feather(m: Float32Array, w: number, box: PxBox, r: number): Float32Array {
  if (r <= 0) return m;
  const tmp = new Float32Array(m.length), out = new Float32Array(m.length);
  for (let y = box.y0; y < box.y1; y++) for (let x = box.x0; x < box.x1; x++) {
    let s = 0, n = 0;
    for (let k = Math.max(box.x0, x - r); k <= Math.min(box.x1 - 1, x + r); k++) { s += m[y * w + k]; n++; }
    tmp[y * w + x] = s / n;
  }
  for (let y = box.y0; y < box.y1; y++) for (let x = box.x0; x < box.x1; x++) {
    let s = 0, n = 0;
    for (let k = Math.max(box.y0, y - r); k <= Math.min(box.y1 - 1, y + r); k++) { s += tmp[k * w + x]; n++; }
    out[y * w + x] = s / n;
  }
  return out;
}

/** Keep only connected parts of the mask that are at least `minArea` pixels (drops specks of noise). */
function dropSpecks(m: Float32Array, w: number, box: PxBox, minArea: number): Float32Array {
  const seen = new Uint8Array(m.length), out = new Float32Array(m.length), stack: number[] = [];
  for (let y = box.y0; y < box.y1; y++) for (let x = box.x0; x < box.x1; x++) {
    const s = y * w + x;
    if (seen[s] || m[s] < 0.5) continue;
    const part: number[] = [];
    stack.push(s); seen[s] = 1;
    while (stack.length) {
      const p = stack.pop()!, px = p % w, py = (p - px) / w;
      part.push(p);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = px + dx, ny = py + dy;
        if (nx < box.x0 || nx >= box.x1 || ny < box.y0 || ny >= box.y1) continue;
        const q = ny * w + nx;
        if (!seen[q] && m[q] >= 0.5) { seen[q] = 1; stack.push(q); }
      }
    }
    if (part.length >= minArea) for (const p of part) out[p] = 1;
  }
  return out;
}

export type MaskResult = {
  /** 0–1 per pixel, full picture size; zero outside the item's box. */
  alpha: Float32Array;
  box: PxBox;
  /** Share of the box the item covers. */
  cover: number;
  /** True when the change could not be found and the whole box was used instead. */
  fallback: boolean;
};

/**
 * The shape of one item: every pixel inside its box that any alternative changed.
 * `threshold` is the smallest channel difference (0–255) that counts as a change.
 */
export function itemMask(base: Rgba, alts: Rgba[], b: PctBox, threshold = 30): MaskResult {
  const { width: w, height: h } = base, box = pxBox(b, w, h);
  const bw = box.x1 - box.x0, bh = box.y1 - box.y0, area = Math.max(1, bw * bh);
  let m: Float32Array = new Float32Array(w * h);
  for (const alt of alts) {
    for (let y = box.y0; y < box.y1; y++) for (let x = box.x0; x < box.x1; x++) {
      const i = (y * w + x) * 4;
      const d = Math.max(Math.abs(base.data[i] - alt.data[i]), Math.abs(base.data[i + 1] - alt.data[i + 1]), Math.abs(base.data[i + 2] - alt.data[i + 2]));
      if (d >= threshold) m[y * w + x] = 1;
    }
  }
  const r = Math.max(2, Math.round(Math.min(bw, bh) / 60));
  m = morph(morph(m, w, box, r, true), w, box, r, false); // close small gaps inside the piece
  m = morph(morph(m, w, box, 1, false), w, box, 1, true); // open: drop single-pixel noise
  m = dropSpecks(m, w, box, Math.max(40, Math.round(area * 0.004)));
  let on = 0;
  for (let y = box.y0; y < box.y1; y++) for (let x = box.x0; x < box.x1; x++) on += m[y * w + x];
  const cover = on / area;
  let fallback = false;
  if (cover < 0.03) {
    // The change could not be found: use the item's box itself (the edit kept the rest of the photo).
    fallback = true;
    const inner = pxBox(b, w, h, 0.04);
    m = new Float32Array(w * h);
    for (let y = inner.y0; y < inner.y1; y++) for (let x = inner.x0; x < inner.x1; x++) m[y * w + x] = 1;
  }
  m = morph(m, w, box, 2, true); // a little extra around the edge so no old outline shows
  const alpha = feather(m, w, box, Math.max(2, Math.round(r * 0.8)));
  return { alpha, box, cover: fallback ? 0 : cover, fallback };
}

/** One full-picture variation: the source's colours where the item is, transparent everywhere else. */
export function cutLayer(src: Rgba, alpha: Float32Array): Rgba {
  const out = new Uint8ClampedArray(src.width * src.height * 4);
  for (let p = 0, i = 0; p < alpha.length; p++, i += 4) {
    const a = alpha[p];
    if (a <= 0.002) continue;
    out[i] = src.data[i]; out[i + 1] = src.data[i + 1]; out[i + 2] = src.data[i + 2];
    out[i + 3] = Math.round(Math.min(1, a) * 255);
  }
  return { data: out, width: src.width, height: src.height };
}

/** The base picture with one variation laid over it (for thumbnails). */
export function composite(base: Rgba, layer: Rgba): Rgba {
  const out = new Uint8ClampedArray(base.data);
  for (let i = 0; i < out.length; i += 4) {
    const a = layer.data[i + 3] / 255;
    if (!a) continue;
    for (let c = 0; c < 3; c++) out[i + c] = Math.round(layer.data[i + c] * a + base.data[i + c] * (1 - a));
  }
  return { data: out, width: base.width, height: base.height };
}

/** The centre of the item, in pixels, for its hotspot. */
export function centreOf(alpha: Float32Array, width: number, box: PxBox): { x: number; y: number } {
  let sx = 0, sy = 0, n = 0;
  for (let y = box.y0; y < box.y1; y++) for (let x = box.x0; x < box.x1; x++) {
    const a = alpha[y * width + x];
    if (a > 0.5) { sx += x; sy += y; n++; }
  }
  return n ? { x: Math.round(sx / n), y: Math.round(sy / n) } : { x: Math.round((box.x0 + box.x1) / 2), y: Math.round((box.y0 + box.y1) / 2) };
}

/* ---------- one alternative at a time ---------- */

const diffAt = (a: Rgba, b: Rgba, i: number) => Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]));
const inside = (x: number, y: number, b: PxBox) => x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1;

/**
 * The image AI often shifts the whole photo's brightness or colour a little when it redraws one piece; cut as
 * it is, the piece then sits in a visibly lighter or darker rectangle. This brings the alternative's tones back
 * to the original's, measured on everything outside the item's area.
 */
export function matchTone(base: Rgba, alt: Rgba, box: PxBox, step = 3): Rgba {
  const s = [0, 0, 0], ss = [0, 0, 0], t = [0, 0, 0], tt = [0, 0, 0];
  let n = 0;
  for (let y = 0; y < base.height; y += step) for (let x = 0; x < base.width; x += step) {
    if (inside(x, y, box)) continue;
    const i = (y * base.width + x) * 4;
    for (let c = 0; c < 3; c++) { const a = alt.data[i + c], b = base.data[i + c]; s[c] += a; ss[c] += a * a; t[c] += b; tt[c] += b * b; }
    n++;
  }
  if (n < 50) return alt;
  const out = new Uint8ClampedArray(alt.data);
  const gain: number[] = [], off: number[] = [];
  for (let c = 0; c < 3; c++) {
    const ma = s[c] / n, mb = t[c] / n;
    const sa = Math.sqrt(Math.max(1, ss[c] / n - ma * ma)), sb = Math.sqrt(Math.max(1, tt[c] / n - mb * mb));
    gain[c] = Math.max(0.85, Math.min(1.18, sb / sa));
    off[c] = mb - gain[c] * ma;
  }
  for (let i = 0; i < out.length; i += 4) for (let c = 0; c < 3; c++) out[i + c] = alt.data[i + c] * gain[c] + off[c];
  return { data: out, width: alt.width, height: alt.height };
}

export type AltCut = {
  /** 0–1 per pixel, full picture size. */
  alpha: Float32Array;
  box: PxBox;
  cover: number;
  /** The new piece runs past its area, so cutting it would show an incomplete piece. */
  clipped: boolean;
  /** The change is a plain rectangle: a re-lit patch of the photo rather than the piece itself. */
  patch: boolean;
  /** Safe to show: something changed, the piece is whole and it isn't a patch. */
  usable: boolean;
};

/**
 * The pixels one (tone-matched) alternative changed around its item. The area is generous, so a slightly
 * larger new piece is still cut whole; one that runs past it anyway is marked `clipped` and not shown.
 */
export function altMask(base: Rgba, alt: Rgba, b: PctBox): AltCut {
  const { width: w, height: h } = base, box = pxBox(b, w, h, 0.28), ring = pxBox(b, w, h, 0.5);
  const bw = box.x1 - box.x0, bh = box.y1 - box.y0, area = Math.max(1, bw * bh);
  // how much the photo changes where nothing should have changed: the threshold sits above that noise
  const hist = new Uint32Array(256);
  let hn = 0;
  for (let y = ring.y0; y < ring.y1; y += 2) for (let x = ring.x0; x < ring.x1; x += 2) {
    if (inside(x, y, box)) continue;
    hist[diffAt(base, alt, (y * w + x) * 4)]++; hn++;
  }
  let noise = 0;
  for (let k = 0, acc = 0; k < 256 && hn; k++) { acc += hist[k]; if (acc >= hn * 0.9) { noise = k; break; } }
  const threshold = Math.max(26, Math.min(60, noise + 14));
  let m: Float32Array = new Float32Array(w * h);
  for (let y = box.y0; y < box.y1; y++) for (let x = box.x0; x < box.x1; x++) if (diffAt(base, alt, (y * w + x) * 4) >= threshold) m[y * w + x] = 1;
  const r = Math.max(2, Math.round(Math.min(bw, bh) / 60));
  m = morph(morph(m, w, box, r, true), w, box, r, false);
  m = morph(morph(m, w, box, 1, false), w, box, 1, true);
  m = dropSpecks(m, w, box, Math.max(40, Math.round(area * 0.004)));
  let on = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = box.y0; y < box.y1; y++) for (let x = box.x0; x < box.x1; x++) if (m[y * w + x] >= 0.5) {
    on++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const cover = on / area;
  // runs past the left, right or top of its area (the picture's own edges and the floor below don't count)
  const side = (len: number, at: (k: number) => number) => { let c = 0; for (let k = 0; k < len; k++) c += at(k) >= 0.5 ? 1 : 0; return c / Math.max(1, len); };
  const left = box.x0 > 0 ? side(bh, (k) => m[(box.y0 + k) * w + box.x0]) : 0;
  const right = box.x1 < w ? side(bh, (k) => m[(box.y0 + k) * w + box.x1 - 1]) : 0;
  const top = box.y0 > 0 ? side(bw, (k) => m[box.y0 * w + box.x0 + k]) : 0;
  const clipped = Math.max(left, right, top) > 0.2;
  const bboxArea = on ? (x1 - x0 + 1) * (y1 - y0 + 1) : 1;
  const patch = on > 0 && on / bboxArea > 0.96 && bboxArea > area * 0.75;
  m = morph(m, w, box, 2, true);
  const alpha = feather(m, w, box, Math.max(3, Math.round(r * 1.5)));
  return { alpha, box, cover, clipped, patch, usable: cover >= 0.02 && !clipped && !patch };
}

/** Several cut-outs as one (for the main option, which must cover wherever any alternative drew). */
export function unionAlpha(cuts: AltCut[]): Float32Array {
  const out = new Float32Array(cuts[0]?.alpha.length ?? 0);
  for (const c of cuts) for (let i = 0; i < out.length; i++) if (c.alpha[i] > out[i]) out[i] = c.alpha[i];
  return out;
}

/** The smallest box around a cut-out (for thumbnails and the hotspot). */
export function alphaBox(alpha: Float32Array, width: number, height: number, fallback: PxBox): PxBox {
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let p = 0; p < alpha.length; p++) if (alpha[p] > 0.5) {
    const x = p % width, y = (p - x) / width;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return x1 < 0 ? fallback : { x0, y0, x1: Math.min(width, x1 + 1), y1: Math.min(height, y1 + 1) };
}
