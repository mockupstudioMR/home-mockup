/**
 * Layers built the way the Generator PRO showroom builds them (ShowroomConfigurator.svelte): an empty-room
 * background, and for every piece two full-size images drawn in order on top of it:
 *   - a SHADOW image, white everywhere and soft grey where the piece casts its shadow, drawn with MULTIPLY;
 *   - the piece itself as a see-through image laid on top (PRO's lighten pass drew a dark rim on soft edges,
 *     so the piece is drawn normally instead).
 * So a piece carries its own silhouette and contact shadow and nothing of the wall or floor around it: a new wall
 * colour can never show the old one around a sofa, and a table keeps its shadow under it instead of floating.
 * Walls and floor are ordinary see-through layers cut from the empty room. Every outline comes from
 * segmentation of the photo itself (segment-photo), never from the 3D guide, which the AI photo doesn't match
 * pixel for pixel.
 *
 * Pure functions on raw RGBA pixels (see layers.ts), so they run in the browser and in tests alike.
 */
import { dropSpecks, feather, morph, type PxBox, type Rgba } from "./layers";

const lum = (img: Rgba, i: number) => img.data[i] * 0.299 + img.data[i + 1] * 0.587 + img.data[i + 2] * 0.114;

export type ProPiece = {
  /** 0–1 per pixel: where the piece itself is (full picture size). */
  alpha: Float32Array;
  /** White, grey where the piece shades the room. Draw with multiply. */
  shadow: Rgba;
  /** The piece itself, see-through around it. Draw normally, over its shadow. */
  colour: Rgba;
  /** The area it covers, with its shadow. */
  box: PxBox;
  /** How much of the piece's own (guide) area it fills. */
  cover: number;
  /** It runs past the area it may use: too big for its place. */
  clipped: boolean;
};

/**
 * One piece, from a photo that shows it, the empty room (`plate`) and the piece's outline on that photo (`mask`,
 * from segmentation of the photo itself, 0–1). `core` is where the piece should be; `area` how far it and its
 * shadow may reach. Returns the piece as a normal see-through image (soft rim, no dark outline) and its cast
 * shadow alone: white everywhere, grey where the photo is darker than the empty room just around the piece.
 */
export function proPiece(photo: Rgba, plate: Rgba, mask: Float32Array, core: PxBox, area: PxBox): ProPiece {
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
  // a soft rim, kept on the piece's own edge pixels
  const alpha = feather(morph(m, w, area, 1, false), w, area, 1);
  let inCore = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = area.y0; y < area.y1; y++) for (let x = area.x0; x < area.x1; x++) if (alpha[y * w + x] >= 0.5) {
    if (x >= core.x0 && x < core.x1 && y >= core.y0 && y < core.y1) inCore++;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const cover = inCore / Math.max(1, (core.x1 - core.x0) * (core.y1 - core.y0));
  const clipped = x1 >= 0 && ((x0 <= area.x0 && area.x0 > 0) || (x1 >= area.x1 - 1 && area.x1 < w) || (y0 <= area.y0 && area.y0 > 0));

  // the cast shadow: how much darker the photo is than the empty room, outside the piece, smoothed
  const near = morph(m, w, area, 1, true);
  const ratio = new Float32Array(w * h).fill(1);
  for (let y = area.y0; y < area.y1; y++) for (let x = area.x0; x < area.x1; x++) {
    const p = y * w + x;
    if (near[p] < 0.5) ratio[p] = Math.min(1, (lum(photo, p * 4) + 6) / (lum(plate, p * 4) + 6));
  }
  // smoothed over the room around the piece only, so the piece's own pixels don't wash out its contact shadow
  const weight = new Float32Array(w * h), num = new Float32Array(w * h);
  for (let y = area.y0; y < area.y1; y++) for (let x = area.x0; x < area.x1; x++) { const p = y * w + x; if (near[p] < 0.5) { weight[p] = 1; num[p] = ratio[p]; } }
  const sw = feather(weight, w, area, 2), sn = feather(num, w, area, 2);
  const soft = new Float32Array(w * h).fill(1);
  for (let y = area.y0; y < area.y1; y++) for (let x = area.x0; x < area.x1; x++) { const p = y * w + x; if (sw[p] > 0.05) soft[p] = sn[p] / sw[p]; }
  const shadow: Rgba = { data: new Uint8ClampedArray(w * h * 4).fill(255), width: w, height: h };
  const colour: Rgba = { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
  for (let y = area.y0; y < area.y1; y++) for (let x = area.x0; x < area.x1; x++) {
    const p = y * w + x, i = p * 4, a = alpha[p];
    const k = soft[p] < 0.985 ? Math.max(0.35, soft[p]) : 1; // ignore tiny differences
    // under the piece the shadow fades out, so its own rim never darkens
    const sh = Math.round(255 * (k + (1 - k) * a));
    shadow.data[i] = shadow.data[i + 1] = shadow.data[i + 2] = sh;
    colour.data[i] = photo.data[i]; colour.data[i + 1] = photo.data[i + 1]; colour.data[i + 2] = photo.data[i + 2];
    colour.data[i + 3] = Math.round(255 * a);
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

/** Draw a piece over a picture, as the viewer does: multiply its cast shadow, then lay the piece on top. */
export function drawPro(under: Rgba, piece: { shadow: Rgba; colour: Rgba }): Rgba {
  const out = new Uint8ClampedArray(under.data);
  for (let i = 0; i < out.length; i += 4) {
    const a = piece.colour.data[i + 3] / 255;
    for (let c = 0; c < 3; c++) out[i + c] = Math.round(((under.data[i + c] * piece.shadow.data[i + c]) / 255) * (1 - a) + piece.colour.data[i + c] * a);
  }
  return { data: out, width: under.width, height: under.height };
}
