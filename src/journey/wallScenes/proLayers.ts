/**
 * Layers built the way the Generator PRO showroom builds them (ShowroomConfigurator.svelte): an empty-room
 * background, and for every piece two full-size images drawn in order on top of it:
 *   - a SHADOW image: black where the piece is, soft grey where it casts its shadow, white everywhere else,
 *     drawn with MULTIPLY (so the room under the piece goes black and its contact shadow darkens the floor);
 *   - a COLOUR image: the piece itself on black, drawn with LIGHTEN (so only the piece shows).
 * This is PRO's own composite model, kept as it is. The piece's edge is hard (the photo's own mixed edge pixel is
 * dropped), so lighten draws no dark rim and no rim of the old wall colour travels with the piece.
 * Walls and floor are ordinary see-through layers cut from the empty room. Every outline comes from
 * segmentation of the photo itself (segment-photo), never from the 3D guide, which the AI photo doesn't match
 * pixel for pixel.
 *
 * Pure functions on raw RGBA pixels (see layers.ts), so they run in the browser and in tests alike.
 */
import { dropSpecks, feather, morph, type PxBox, type Rgba } from "./layers";

const lum = (img: Rgba, i: number) => img.data[i] * 0.299 + img.data[i + 1] * 0.587 + img.data[i + 2] * 0.114;

export type ProPiece = {
  /** 0 or 1 per pixel: where the piece itself is (full picture size). */
  alpha: Float32Array;
  /** Black on the piece, grey where it shades the room, white elsewhere. Draw with multiply. */
  shadow: Rgba;
  /** The piece itself on black. Draw with lighten, over its shadow. */
  colour: Rgba;
  /** The area it covers, with its shadow. */
  box: PxBox;
  /** How much of the piece's own (guide) area it fills. */
  cover: number;
  /** It runs past the area it may use: too big for its place. */
  clipped: boolean;
};

/** City-block distance (in pixels) of every pixel of `area` to the nearest pixel where `m` is set. */
function distanceTo(m: Float32Array, w: number, area: PxBox): Float32Array {
  const d = new Float32Array(m.length).fill(1e9);
  for (let y = area.y0; y < area.y1; y++) for (let x = area.x0; x < area.x1; x++) {
    const p = y * w + x;
    if (m[p] >= 0.5) { d[p] = 0; continue; }
    if (x > area.x0) d[p] = Math.min(d[p], d[p - 1] + 1);
    if (y > area.y0) d[p] = Math.min(d[p], d[p - w] + 1);
  }
  for (let y = area.y1 - 1; y >= area.y0; y--) for (let x = area.x1 - 1; x >= area.x0; x--) {
    const p = y * w + x;
    if (x < area.x1 - 1) d[p] = Math.min(d[p], d[p + 1] + 1);
    if (y < area.y1 - 1) d[p] = Math.min(d[p], d[p + w] + 1);
  }
  return d;
}

/**
 * One piece, from a photo that shows it, the empty room (`plate`) and the piece's outline on that photo (`mask`,
 * from segmentation of the photo itself, 0–1). `core` is where the piece should be; `area` how far it and its
 * shadow may reach. `others`: where the other pieces are on the photo, so they are never taken for its shadow.
 * Its cast shadow is only the darkening right around the piece, after the empty room's overall brightness is
 * brought to the photo's, and it fades out well before the edge of `area`.
 */
/**
 * `wall` (optional, 0–1): where the photo shows the wall itself (wallPaint.wallMask). Segmentation outlines are
 * soft blobs; any wall inside one would be drawn with the piece (multiply blacks it out, lighten brings the photo
 * back) and show the old wall colour round the piece over a new one. Those pixels are taken out last, after the
 * hole filling, so wall seen through an armrest or under a table stays out too.
 */
export function proPiece(photo: Rgba, plate: Rgba, mask: Float32Array, core: PxBox, area: PxBox, others?: Float32Array, wall?: Float32Array): ProPiece {
  const { width: w, height: h } = photo;
  let m: Float32Array = new Float32Array(w * h);
  for (let y = area.y0; y < area.y1; y++) for (let x = area.x0; x < area.x1; x++) { const p = y * w + x; if (mask[p] >= 0.5) m[p] = 1; }
  const r = Math.max(1, Math.round(Math.min(core.x1 - core.x0, core.y1 - core.y0) / 120));
  m = morph(morph(m, w, area, r, true), w, area, r, false); // close hairline gaps
  m = dropSpecks(m, w, area, Math.max(30, Math.round((core.x1 - core.x0) * (core.y1 - core.y0) * 0.002)));
  // only what joins up with the piece's own area
  const keep = new Float32Array(w * h), stack: number[] = [];
  for (let y = core.y0; y < core.y1; y++) for (let x = core.x0; x < core.x1; x++) { const p = y * w + x; if (m[p] >= 0.5 && !keep[p]) { keep[p] = 1; stack.push(p); } }
  while (stack.length) {
    const p = stack.pop()!, x = p % w, y = (p - x) / w;
    for (const q of [x > area.x0 ? p - 1 : -1, x < area.x1 - 1 ? p + 1 : -1, y > area.y0 ? p - w : -1, y < area.y1 - 1 ? p + w : -1]) if (q >= 0 && !keep[q] && m[q] >= 0.5) { keep[q] = 1; stack.push(q); }
  }
  m = fillHoles(keep, w, area);
  if (wall) for (let y = area.y0; y < area.y1; y++) for (let x = area.x0; x < area.x1; x++) { const p = y * w + x; if (wall[p] >= 0.5) m[p] = 0; }
  // a hard edge one pixel inside the outline: the photo's mixed edge pixel (part piece, part old wall) is left out
  const alpha = morph(m, w, area, 1, false);
  let inCore = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = area.y0; y < area.y1; y++) for (let x = area.x0; x < area.x1; x++) if (alpha[y * w + x] >= 0.5) {
    if (x >= core.x0 && x < core.x1 && y >= core.y0 && y < core.y1) inCore++;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const cover = inCore / Math.max(1, (core.x1 - core.x0) * (core.y1 - core.y0));
  const clipped = x1 >= 0 && ((x0 <= area.x0 && area.x0 > 0) || (x1 >= area.x1 - 1 && area.x1 < w) || (y0 <= area.y0 && area.y0 > 0));

  // the cast shadow: how much darker the photo is than the empty room, right around the piece only
  const near = morph(m, w, area, 1, true);
  const other = others ? morph(others.map((v, p) => (v >= 0.5 && near[p] < 0.5 ? 1 : 0)), w, area, 2 * r + 1, true) : null;
  const dist = distanceTo(near, w, area);
  const reach = Math.max(8, Math.round(Math.min(core.x1 - core.x0, core.y1 - core.y0) * 0.5));
  const raw = (p: number) => (lum(photo, p * 4) + 6) / (lum(plate, p * 4) + 6);
  // the empty room is a separate AI picture, never exactly as bright: compare like with like. Shadows only
  // darken, so the brighter part of the room around the piece (its upper quarter) is the unshaded reference.
  const ref: number[] = [];
  for (let y = area.y0; y < area.y1; y += 2) for (let x = area.x0; x < area.x1; x += 2) {
    const p = y * w + x;
    if (near[p] < 0.5 && !(other && other[p] >= 0.5)) ref.push(raw(p));
  }
  ref.sort((a, b) => a - b);
  const gain = ref.length >= 20 ? Math.min(1.25, Math.max(0.8, ref[Math.floor(ref.length * 0.75)])) : 1;
  const weight = new Float32Array(w * h), num = new Float32Array(w * h);
  for (let y = area.y0; y < area.y1; y++) for (let x = area.x0; x < area.x1; x++) {
    const p = y * w + x;
    if (near[p] >= 0.5 || (other && other[p] >= 0.5)) continue;
    weight[p] = 1; num[p] = Math.min(1, raw(p) / gain);
  }
  const sw = feather(weight, w, area, 2), sn = feather(num, w, area, 2);
  const shadow: Rgba = { data: new Uint8ClampedArray(w * h * 4).fill(255), width: w, height: h };
  const colour: Rgba = { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
  for (let y = area.y0; y < area.y1; y++) for (let x = area.x0; x < area.x1; x++) {
    const p = y * w + x, i = p * 4;
    colour.data[i + 3] = 255; // black around the piece: lighten leaves the room as it is
    if (alpha[p] >= 0.5) {
      shadow.data[i] = shadow.data[i + 1] = shadow.data[i + 2] = 0;
      colour.data[i] = photo.data[i]; colour.data[i + 1] = photo.data[i + 1]; colour.data[i + 2] = photo.data[i + 2];
      continue;
    }
    if (sw[p] <= 0.05 || (other && other[p] >= 0.5)) continue;
    const soft = sn[p] / sw[p];
    if (soft >= 0.985) continue; // ignore tiny differences
    // full strength next to the piece, gone at `reach`, and never reaching the edge of its area
    const d = dist[p], fade = d <= reach / 2 ? 1 : Math.max(0, 1 - (d - reach / 2) / (reach / 2));
    const edge = Math.min(1, Math.min(x - area.x0, area.x1 - 1 - x, y - area.y0, area.y1 - 1 - y) / 4);
    const k = 1 - (1 - Math.max(0.35, soft)) * fade * edge;
    shadow.data[i] = shadow.data[i + 1] = shadow.data[i + 2] = Math.round(255 * k);
  }
  const box = x1 < 0 ? core : { x0: Math.max(area.x0, x0 - 2 * r), y0: Math.max(area.y0, y0 - 2 * r), x1: Math.min(area.x1, x1 + 2 * r + 1), y1: Math.min(area.y1, y1 + 2 * r + 1) };
  return { alpha, shadow, colour, box, cover, clipped };
}

/** Fill the holes of a shape (a cushion the colour of the wall): whatever the outside can't reach is inside. */
function fillHoles(m: Float32Array, w: number, area: PxBox): Float32Array {
  const out = new Float32Array(m.length), seen = new Uint8Array(m.length), stack: number[] = [];
  const push = (p: number) => { if (!seen[p] && m[p] < 0.5) { seen[p] = 1; stack.push(p); } };
  for (let x = area.x0; x < area.x1; x++) { push(area.y0 * w + x); push((area.y1 - 1) * w + x); }
  for (let y = area.y0; y < area.y1; y++) { push(y * w + area.x0); push(y * w + area.x1 - 1); }
  while (stack.length) {
    const p = stack.pop()!, x = p % w, y = (p - x) / w;
    if (x > area.x0) push(p - 1); if (x < area.x1 - 1) push(p + 1); if (y > area.y0) push(p - w); if (y < area.y1 - 1) push(p + w);
  }
  for (let y = area.y0; y < area.y1; y++) for (let x = area.x0; x < area.x1; x++) { const p = y * w + x; out[p] = seen[p] ? 0 : 1; }
  return out;
}

/** A wall or floor variant, cut to its own surface (`mask`, 0–1, from segmentation of the empty room). */
export function surfaceLayer(img: Rgba, mask: Float32Array, grow = 2): Rgba {
  const { width: w, height: h } = img;
  const full: PxBox = { x0: 0, y0: 0, x1: w, y1: h };
  let m: Float32Array = new Float32Array(w * h);
  for (let p = 0; p < m.length; p++) if (mask[p] >= 0.5) m[p] = 1;
  m = feather(morph(m, w, full, grow, true), w, full, 1);
  const out = new Uint8ClampedArray(w * h * 4);
  for (let p = 0; p < w * h; p++) { const i = p * 4; out[i] = img.data[i]; out[i + 1] = img.data[i + 1]; out[i + 2] = img.data[i + 2]; out[i + 3] = Math.round(255 * Math.min(1, m[p])); }
  return { data: out, width: w, height: h };
}

/** Draw a piece over a picture, as the viewer does (Generator PRO): multiply the shadow, then lighten the piece. */
export function drawPro(under: Rgba, piece: { shadow: Rgba; colour: Rgba }): Rgba {
  const out = new Uint8ClampedArray(under.data);
  for (let i = 0; i < out.length; i += 4) {
    const a = piece.colour.data[i + 3] / 255;
    for (let c = 0; c < 3; c++) {
      const v = Math.round((under.data[i + c] * piece.shadow.data[i + c]) / 255);
      out[i + c] = Math.round(v * (1 - a) + Math.max(v, piece.colour.data[i + c]) * a);
    }
  }
  return { data: out, width: under.width, height: under.height };
}

/**
 * The floor or a rug seen inside a standing piece's outline (between a table's legs, under a chair): those
 * pixels would be drawn with the piece and show the old floor or rug over a new one. A floor or rug has a
 * pattern, so it is found by its own colours: sampled just outside the piece where the surface lies, grouped into
 * a few colours, then grown into the lower part of the piece's outline through pixels of those colours with
 * small steps between neighbours (the piece's own edges stop it). Returns the pixels to take out (0/1).
 *
 * `blob`: the piece's outline; `surface`: where the floor or rugs are (0–1); `others`: other standing pieces.
 */
export function flatIntrusion(img: Rgba, blob: Float32Array, surface: Float32Array, others: Float32Array | undefined, area: PxBox): Float32Array {
  const { width: w, data: d } = img;
  const out = new Float32Array(blob.length);
  // the piece's extent, so only its lower part (legs, the gap under it) is searched
  let by0 = Infinity, by1 = -1;
  for (let y = area.y0; y < area.y1; y++) for (let x = area.x0; x < area.x1; x++) if (blob[y * w + x] >= 0.5) { by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
  if (by1 < 0) return out;
  const low = Math.round(by0 + (by1 - by0) * 0.4);
  const free = (p: number) => blob[p] < 0.5 && surface[p] >= 0.5 && !(others && others[p] >= 0.5);
  // samples of the surface round the piece
  const samples: number[][] = [];
  const stride = Math.max(1, Math.round(Math.sqrt(((area.x1 - area.x0) * (area.y1 - area.y0)) / 6000)));
  for (let y = Math.max(area.y0, low); y < area.y1; y += stride) for (let x = area.x0; x < area.x1; x += stride) {
    const p = y * w + x;
    if (free(p)) samples.push([d[p * 4], d[p * 4 + 1], d[p * 4 + 2]]);
  }
  if (samples.length < 40) return out;
  // a few colours (k-means, k ≤ 6)
  const k = Math.min(6, Math.floor(samples.length / 10));
  let cs = Array.from({ length: k }, (_, i) => [...samples[Math.floor(((i + 0.5) * samples.length) / k)]]);
  for (let it = 0; it < 8; it++) {
    const sum = cs.map(() => [0, 0, 0, 0]);
    for (const s of samples) {
      let bi = 0, bd = Infinity;
      cs.forEach((c, i) => { const dd = (c[0] - s[0]) ** 2 + (c[1] - s[1]) ** 2 + (c[2] - s[2]) ** 2; if (dd < bd) { bd = dd; bi = i; } });
      sum[bi][0] += s[0]; sum[bi][1] += s[1]; sum[bi][2] += s[2]; sum[bi][3]++;
    }
    cs = cs.map((c, i) => (sum[i][3] ? [sum[i][0] / sum[i][3], sum[i][1] / sum[i][3], sum[i][2] / sum[i][3]] : c));
  }
  // how far the surface's own pixels lie from their colour: the tolerance follows the pattern's spread
  let spread = 0;
  for (const s of samples) spread += Math.sqrt(Math.min(...cs.map((c) => (c[0] - s[0]) ** 2 + (c[1] - s[1]) ** 2 + (c[2] - s[2]) ** 2)));
  const T = Math.max(18, Math.min(40, (spread / samples.length) * 2.2));
  const near = (p: number) => { const i = p * 4; return Math.min(...cs.map((c) => (c[0] - d[i]) ** 2 + (c[1] - d[i + 1]) ** 2 + (c[2] - d[i + 2]) ** 2)) < T * T; };
  const step = (p: number, q: number) => Math.max(Math.abs(d[p * 4] - d[q * 4]), Math.abs(d[p * 4 + 1] - d[q * 4 + 1]), Math.abs(d[p * 4 + 2] - d[q * 4 + 2]));
  const STEP = Math.max(16, Math.min(34, T));
  // grow from the surface just outside the outline into its lower part
  const stack: number[] = [];
  for (let y = Math.max(area.y0 + 1, low); y < area.y1 - 1; y++) for (let x = area.x0 + 1; x < area.x1 - 1; x++) {
    const p = y * w + x;
    if (!free(p)) continue;
    for (const q of [p - 1, p + 1, p - w, p + w]) if (blob[q] >= 0.5 && !out[q] && near(q) && step(p, q) <= STEP) { out[q] = 1; stack.push(q); }
  }
  while (stack.length) {
    const p = stack.pop()!, x = p % w, y = (p - x) / w;
    for (const q of [x > area.x0 ? p - 1 : -1, x < area.x1 - 1 ? p + 1 : -1, y > low ? p - w : -1, y < area.y1 - 1 ? p + w : -1]) {
      if (q >= 0 && !out[q] && blob[q] >= 0.5 && near(q) && step(p, q) <= STEP) { out[q] = 1; stack.push(q); }
    }
  }
  return out;
}
