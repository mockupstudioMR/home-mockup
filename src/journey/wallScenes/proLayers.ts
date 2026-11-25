/**
 * Layers built the way the Generator PRO showroom builds them (ShowroomConfigurator.svelte): an empty-room
 * background, and for every piece two full-size images drawn in order on top of it:
 *   - a SHADOW image, white everywhere, black where the piece stands and soft grey where it casts its shadow,
 *     drawn with MULTIPLY;
 *   - a COLOUR image, the piece itself on black, drawn with LIGHTEN.
 * So a piece carries its own silhouette and contact shadow and nothing of the wall or floor around it: a new wall
 * colour can never show the old one around a sofa, and a table keeps its shadow under it instead of floating.
 * Walls and floor are ordinary see-through layers cut from the empty room.
 *
 * Pure functions on raw RGBA pixels (see layers.ts), so they run in the browser and in tests alike.
 */
import { dropSpecks, feather, morph, type PxBox, type Rgba } from "./layers";

const lum = (img: Rgba, i: number) => img.data[i] * 0.299 + img.data[i + 1] * 0.587 + img.data[i + 2] * 0.114;
const diff = (a: Rgba, b: Rgba, i: number) => Math.max(Math.abs(a.data[i] - b.data[i]), Math.abs(a.data[i + 1] - b.data[i + 1]), Math.abs(a.data[i + 2] - b.data[i + 2]));

/**
 * Which piece every pixel is nearest to, from the guide's item map: the piece itself where the guide drew it,
 * else the nearest piece (so a photo's piece drawn a little bigger or shifted still belongs to it). `pieces` are
 * the item-map numbers of the pieces (not walls or floor). Also returns how far each pixel is from its piece.
 */
export function nearestPiece(ids: Uint16Array, width: number, height: number, pieces: Set<number>) {
  const owner = new Int32Array(width * height).fill(0);
  const dist = new Int32Array(width * height).fill(-1);
  let queue = new Int32Array(width * height), head = 0, tail = 0;
  for (let p = 0; p < ids.length; p++) if (pieces.has(ids[p])) { owner[p] = ids[p]; dist[p] = 0; queue[tail++] = p; }
  while (head < tail) {
    const p = queue[head++], x = p % width;
    const next = [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, p >= width ? p - width : -1, p + width < ids.length ? p + width : -1];
    for (const q of next) if (q >= 0 && dist[q] < 0) { dist[q] = dist[p] + 1; owner[q] = owner[p]; queue[tail++] = q; }
  }
  queue = new Int32Array(0);
  return { owner, dist };
}

/** How much the photo differs from the empty room where no piece is near: the threshold sits above it. */
export function plateNoise(photo: Rgba, plate: Rgba, dist: Int32Array, far: number) {
  const hist = new Uint32Array(256);
  let n = 0;
  for (let p = 0; p < dist.length; p += 3) if (dist[p] > far || dist[p] < 0) { hist[diff(photo, plate, p * 4)]++; n++; }
  if (n < 200) return 10;
  for (let k = 0, acc = 0; k < 256; k++) { acc += hist[k]; if (acc >= n * 0.75) return k; }
  return 10;
}

export type ProPiece = {
  /** 0–1 per pixel: where the piece itself is (full picture size). */
  alpha: Float32Array;
  /** White, black under the piece, grey where it shades the room. Draw with multiply. */
  shadow: Rgba;
  /** The piece on black. Draw with lighten. */
  colour: Rgba;
  /** The area it covers, with its shadow. */
  box: PxBox;
  /** How much of the piece's own (guide) area it fills. */
  cover: number;
  /** It runs past the area it may use: too big for its place. */
  clipped: boolean;
};

/**
 * One piece, as shadow + colour images, from a photo that shows it (`photo`) and the empty room (`plate`).
 * `id` is its number in the item map; `core` is where the guide drew it; `area` is how far it (and its shadow)
 * may reach. Pixels nearer another piece belong to that piece, so pieces in front or behind never mix.
 */
export function proPiece(photo: Rgba, plate: Rgba, owner: Int32Array, id: number, core: PxBox, area: PxBox, threshold: number): ProPiece {
  const { width: w, height: h } = photo;
  let m: Float32Array = new Float32Array(w * h);
  for (let y = area.y0; y < area.y1; y++) for (let x = area.x0; x < area.x1; x++) {
    const p = y * w + x;
    if (owner[p] === id && diff(photo, plate, p * 4) >= threshold) m[p] = 1;
  }
  const r = Math.max(2, Math.round(Math.min(core.x1 - core.x0, core.y1 - core.y0) / 70));
  m = morph(morph(m, w, area, r, true), w, area, r, false); // close small gaps
  m = morph(morph(m, w, area, 1, false), w, area, 1, true); // drop thin noise
  m = dropSpecks(m, w, area, Math.max(40, Math.round((core.x1 - core.x0) * (core.y1 - core.y0) * 0.003)));
  // only what joins up with the piece's own area
  const keep = new Float32Array(w * h), stack: number[] = [];
  for (let y = core.y0; y < core.y1; y++) for (let x = core.x0; x < core.x1; x++) { const p = y * w + x; if (m[p] >= 0.5 && !keep[p]) { keep[p] = 1; stack.push(p); } }
  while (stack.length) {
    const p = stack.pop()!, x = p % w, y = (p - x) / w;
    for (const q of [x > area.x0 ? p - 1 : -1, x < area.x1 - 1 ? p + 1 : -1, y > area.y0 ? p - w : -1, y < area.y1 - 1 ? p + w : -1]) if (q >= 0 && !keep[q] && m[q] >= 0.5) { keep[q] = 1; stack.push(q); }
  }
  // fill holes inside the piece (a flat cushion the same colour as the wall), then a crisp edge
  m = morph(morph(keep, w, area, r * 2, true), w, area, r * 2, false);
  // the soft edge lies on the piece's own rim, never on the wall beside it (that would be a halo of the old wall)
  const alpha = feather(morph(m, w, area, 1, false), w, area, 1);
  const near = morph(m, w, area, 1, true); // the piece and a hair around it: not part of its cast shadow
  let inCore = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = area.y0; y < area.y1; y++) for (let x = area.x0; x < area.x1; x++) if (alpha[y * w + x] >= 0.5) {
    if (x >= core.x0 && x < core.x1 && y >= core.y0 && y < core.y1) inCore++;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const cover = inCore / Math.max(1, (core.x1 - core.x0) * (core.y1 - core.y0));
  const touches = (a: number, b: number, edge: number, limit: number) => a <= edge && edge > 0 && b >= 0 && edge < limit;
  const clipped = x1 >= 0 && (touches(x0, x1, area.x0, w) || (x1 >= area.x1 - 1 && area.x1 < w) || (y0 <= area.y0 && area.y0 > 0));

  // the shadow: how much darker the photo is than the empty room around the piece (only darker, smoothed),
  // black under the piece itself
  const ratio = new Float32Array(w * h);
  for (let y = area.y0; y < area.y1; y++) for (let x = area.x0; x < area.x1; x++) {
    const p = y * w + x;
    ratio[p] = owner[p] === id && near[p] < 0.5 ? Math.min(1, (lum(photo, p * 4) + 6) / (lum(plate, p * 4) + 6)) : 1;
  }
  const soft = feather(ratio, w, area, 3);
  const shadow: Rgba = { data: new Uint8ClampedArray(w * h * 4).fill(255), width: w, height: h };
  const colour: Rgba = { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
  for (let p = 0; p < w * h; p++) colour.data[p * 4 + 3] = 255;
  for (let y = area.y0; y < area.y1; y++) for (let x = area.x0; x < area.x1; x++) {
    const p = y * w + x, i = p * 4, a = alpha[p];
    const k = Math.max(0.35, Math.min(1, soft[p] < 0.985 ? soft[p] : 1)); // ignore tiny differences
    const s = Math.round(255 * (1 - a) * (a > 0.01 ? 1 : k));
    shadow.data[i] = shadow.data[i + 1] = shadow.data[i + 2] = s;
    for (let c = 0; c < 3; c++) colour.data[i + c] = Math.round(photo.data[i + c] * a);
  }
  const box = x1 < 0 ? core : { x0: Math.max(area.x0, x0 - 2 * r), y0: Math.max(area.y0, y0 - 2 * r), x1: Math.min(area.x1, x1 + 2 * r + 1), y1: Math.min(area.y1, y1 + 2 * r + 1) };
  return { alpha, shadow, colour, box, cover, clipped };
}

/** A wall or floor variant, cut to its own surface (the item map's wall or floor pixels, a little wider). */
export function surfaceLayer(img: Rgba, ids: Uint16Array, surface: number, grow = 3): Rgba {
  const { width: w, height: h } = img;
  const full: PxBox = { x0: 0, y0: 0, x1: w, y1: h };
  let m: Float32Array = new Float32Array(w * h);
  for (let p = 0; p < ids.length; p++) if (ids[p] === surface) m[p] = 1;
  m = feather(morph(m, w, full, grow, true), w, full, 1);
  const out = new Uint8ClampedArray(w * h * 4);
  for (let p = 0; p < w * h; p++) { const i = p * 4; out[i] = img.data[i]; out[i + 1] = img.data[i + 1]; out[i + 2] = img.data[i + 2]; out[i + 3] = Math.round(255 * Math.min(1, m[p])); }
  return { data: out, width: w, height: h };
}

/** Draw a PRO piece over a picture, as the viewer does (multiply the shadow, then lighten with the colour). */
export function drawPro(under: Rgba, piece: { shadow: Rgba; colour: Rgba }): Rgba {
  const out = new Uint8ClampedArray(under.data);
  for (let i = 0; i < out.length; i += 4) for (let c = 0; c < 3; c++) out[i + c] = Math.max(Math.round((under.data[i + c] * piece.shadow.data[i + c]) / 255), piece.colour.data[i + c]);
  return { data: out, width: under.width, height: under.height };
}
