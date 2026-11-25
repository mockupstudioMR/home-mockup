/**
 * Makes the hyper-realistic, layered picture of every wall of the room, all at once:
 * 1. the hidden 3D room draws the wall as a guide (exact size, order and placement of each piece);
 * 2. the image AI turns the guide into a photograph in the style of the person's own preview;
 * 3. for every item on the wall it makes two alternatives (a product from their shop, or their palette);
 * 4. each alternative is compared with the photograph and cut into an aligned transparent layer;
 * 5. the layers and a Generator PRO manifest are stored, and the wall's scene is saved with the journey.
 * Runs in the browser; the page has to stay open while it works.
 */
import { supabase } from "@/lib/looseDb";
import { invokeAi } from "@/lib/invokeAi";
import { getAiErrorMessage } from "@/lib/aiErrorMessage";
import { storeDesignImage } from "../services";
import type { JourneyState, Wall } from "../state";
import { buildModel, seenOn, type ShowroomModel } from "../showroom3d/model";
import { flatIntrusion, proPiece, surfaceLayer, type ProPiece } from "./proLayers";
import { editMaskFrom, segmentPhoto } from "./segment";
import { paintWall, wallMask, wallSeeds } from "./wallPaint";
import { alphaBox, altMask, keepOff, limitAlpha, centreOf, composite, cutAlt, cutLayer, driftOutside, matchTone, pxBox, unionAlpha, type AltCut, type PctBox, type Rgba } from "./layers";
import { wallItems, type WallItem } from "./items";
import { canvasFor, composeWall, loadRules, saveComposition, wallLength, type ItemAssets } from "./composition";

export type WallScene = {
  status: "making" | "ready" | "failed";
  /** What the scene was made from; a different key means the room changed since. */
  key: string;
  manifestUrl?: string;
  assetsUrl?: string;
  background?: string;
  layers?: { id: string; title: string; names: string[] }[];
  /** Items that got no usable alternative, by title. */
  skipped?: string[];
  error?: string;
  /** The canvas it was drawn on (one of the stored presets) and its scale. */
  canvas?: { preset: string; width: number; height: number; pxPerCm: number };
  at: string;
};
/** A picture of the room: one per wall, and one of the whole room (free-standing pieces included). */
export type Pic = Wall | "room";
export type Progress = { wall: Pic; step: string; done: number; total: number };

export const WALLS: Wall[] = ["A", "B", "C", "D"];
export const PICTURES: Pic[] = [...WALLS, "room"];
const ALIGN_LIMIT = 14; // mean change outside the item (0–255), after matching tones, above which an alternative moved the photo
const PARALLEL = 4;
/** Raised when the way pictures are made changes, so walls made the old way are made again. */
const PICTURE_VERSION = 18;

const previewImage = (s: JourneyState) => s.preview?.versions[s.preview.current]?.image;

/** A short fingerprint of everything a wall's picture is made from. */
export function wallKey(s: JourneyState, m: ShowroomModel, wall: Pic) {
  const pieces = m.pieces.filter((p) => seenOn(p, wall)).map((p) => [p.id, p.shape, p.color, Math.round(p.fromCm), Math.round(p.toCm)]);
  const raw = JSON.stringify([PICTURE_VERSION, wall, previewImage(s) ?? "", m.palette.map((p) => p.hex), m.room, m.openings.filter((o) => wall === "room" || o.wall === wall), pieces, m.extras.filter((e) => wall === "room" || e.wall === wall).map((e) => [e.id, e.color]), m.surfaces]);
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) h = Math.imul(h ^ raw.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

/* ---------- pictures in the browser ---------- */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("A picture could not be loaded."));
    img.src = src;
  });
}
async function pixels(src: string, width?: number, height?: number): Promise<Rgba> {
  const img = await loadImage(src);
  const w = width ?? img.naturalWidth, h = height ?? img.naturalHeight;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(img, 0, 0, w, h);
  return { data: g.getImageData(0, 0, w, h).data, width: w, height: h };
}
function toBlob(px: Rgba, type: "image/webp" | "image/jpeg", crop?: { x0: number; y0: number; x1: number; y1: number }, maxSide?: number): Promise<Blob> {
  const c = document.createElement("canvas");
  c.width = px.width; c.height = px.height;
  c.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(px.data), px.width, px.height), 0, 0);
  let out = c;
  if (crop) {
    const cw = crop.x1 - crop.x0, ch = crop.y1 - crop.y0, k = maxSide ? Math.min(1, maxSide / Math.max(cw, ch)) : 1;
    out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(cw * k)); out.height = Math.max(1, Math.round(ch * k));
    out.getContext("2d")!.drawImage(c, crop.x0, crop.y0, cw, ch, 0, 0, out.width, out.height);
  }
  return new Promise((resolve, reject) => out.toBlob((b) => (b ? resolve(b) : reject(new Error("A layer could not be saved."))), type, 0.93));
}

/* ---------- storage ---------- */

async function uploader(folderKey: string) {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error("Sign in to make your room's pictures.");
  const folder = `${uid}/scenes/${folderKey}`;
  const put = async (name: string, body: Blob, contentType: string) => {
    let last: unknown = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { error } = await supabase.storage.from("design-images").upload(`${folder}/${name}`, body, { contentType, upsert: true });
      if (!error) return supabase.storage.from("design-images").getPublicUrl(`${folder}/${name}`).data.publicUrl as string;
      last = error;
      await new Promise((r) => setTimeout(r, 700 * attempt));
    }
    throw new Error((last as { message?: string })?.message || "The pictures could not be saved.");
  };
  const assetsUrl = supabase.storage.from("design-images").getPublicUrl(`${folder}/`).data.publicUrl as string;
  return { put, assetsUrl: assetsUrl.endsWith("/") ? assetsUrl : `${assetsUrl}/` };
}

/* ---------- AI calls ---------- */

type AiBody = {
  mode: "base" | "plate" | "variation"; imageUrl: string; styleImageUrl?: string; wall?: string; style?: string;
  palette?: { name: string; hex: string; use?: string }[]; pieces?: { name: string; detail: string; box: PctBox }[];
  item?: { name: string; current: string; target: string; box: PctBox; group?: string }; productImageUrl?: string;
  moodboardDescription?: string; styleText?: string; roomType?: string;
  /** The wall is seen from slightly above, with the floor in front of it. */
  floorView?: boolean;
  /** The picture's size ("1792x1008"), so the picture model draws at the canvas size. */
  size?: string;
  /** For a swap: a PNG the size of the picture, see-through only where the item may change. */
  maskUrl?: string;
};
/** Set once the wall-picture function turns out not to be deployed: from then on the preview function is used. */
let wallFnMissing = false;
const NOT_THERE = /failed to send a request|not.?found|function.*(missing|does not exist)|404/i;
const STOP = /credits|blocked|sign in/i;
const pct = (b: PctBox) => `${Math.round(b[0])}% from the left, ${Math.round(b[1])}% from the top, ${Math.round(b[2])}% wide, ${Math.round(b[3])}% high`;

/** What makes the pictures read as photographs, not renders: shared by both functions' prompts. */
const REAL = "It must look like a real photograph taken by an interior photographer with a full-frame camera: soft daylight from one consistent direction, gentle falloff across the wall, real fabric weave and wood grain, slight natural imperfections. Shadows only where light really makes them: soft contact shadows under and behind each piece, no dark halos, no floating shadows, no shadow rectangles or patches. Every piece complete and whole, never cut off by the frame or by another piece; nothing partly entering at the edges. A table with its chairs is one composed set: the whole table top and legs visible, each chair complete and turned to the table, evenly spaced, styled like a magazine interior shot. No CGI look, no plastic surfaces, no text, no watermark. Painted walls are smooth, plain, flat matt paint in one even colour: no texture, plaster, limewash or sponge effect, no brush strokes, no panel or stripe.";

/** The same request through generate-design (the preview's function, always deployed), as a surgical edit. */
async function viaPreviewFunction(b: AiBody): Promise<string> {
  const palette = (b.palette ?? []).map((p) => `${p.name} ${p.hex}${p.use ? ` for ${p.use.toLowerCase()}` : ""}`).join(", ");
  const change = b.mode === "plate"
    ? "Remove every piece of furniture and everything standing or lying in the room (sofas, chairs, tables, cabinets, shelves, lamps, plants, cushions, rugs, decor, things on the wall). Continue the bare wall, skirting and floor where they stood, with no trace or shadow. Keep the walls, door, windows, floor, camera, light and size exactly. Painted walls are plain flat matt paint in one even colour."
    : b.mode === "base"
    ? `Render this exact ${b.wall === "room" ? "view of the whole room, from its corner at eye height," : b.floorView ? "view of the wall, straight on and from slightly above so the floor and rug in front of it show," : "straight-on wall elevation"} as a real, photorealistic interior photograph${b.wall === "room" ? "" : ` of wall ${b.wall ?? ""}`}. Turn every simple 3D shape into the real piece it stands for, with real materials and textures, in the ${b.style ?? "chosen"} style${b.styleText ? ` (${b.styleText})` : ""}. Colours: ${palette}. Pieces, left to right: ${(b.pieces ?? []).map((p) => `${p.name} (${p.detail}) at ${pct(p.box)}`).join("; ")}. Keep every piece, door and window exactly where it is and exactly its size; keep ${b.wall === "room" ? "the same camera and view of the room" : b.floorView ? "the same slightly-from-above view with the floor in front" : "the straight-on view with the wall filling the frame"}. ${(b.pieces ?? []).length ? `These ${(b.pieces ?? []).length} are the ONLY pieces: count them before you finish. Add no other furniture, lamps, plants, shelves, cabinets, art, rugs or objects, not even cut off at an edge of the picture.` : "This wall is kept clear: show only the bare wall with its windows and doors, the skirting and a strip of floor, with no furniture or decor at all."} Do not copy furniture or layout from any other picture of the room. ${REAL}`
    : `Replace only the ${b.item!.current} (${pct(b.item!.box)}) with ${b.item!.target}. Same position, size and perspective; the whole new piece fits inside that area, complete, never cut off. Keep the photo's exact light, colours, brightness and grain everywhere else, with a soft natural contact shadow only where the new piece touches the floor or wall.`;
  const layer = b.mode === "base" ? undefined : b.item?.group === "walls" || b.item?.group === "floor" ? "architecture" : b.item?.group === "furniture" ? "furniture" : "decor";
  const { data, error } = await invokeAi<{ imageUrl?: string; error?: string }>("generate-design", {
    body: { stylePreference: (b.style ?? "").toLowerCase().replace(/[&\s]+/g, "-"), colorPalette: (b.palette ?? []).map((p) => p.name).join(", "), roomType: b.roomType ?? "living-room", budgetFeel: "mid", mustHaveElements: [], detectedColors: (b.palette ?? []).map((p) => p.hex), sourceImageUrl: b.imageUrl, modificationPrompt: change, ...(layer ? { refinementLayer: layer } : {}) },
    timeoutMs: 150_000,
  });
  if (data?.imageUrl) return data.imageUrl;
  throw new Error(getAiErrorMessage(error ?? data, "The picture could not be made."));
}

async function ai(body: AiBody): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (wallFnMissing) {
      try { return await viaPreviewFunction(body); } catch (e) {
        const msg = (e as Error).message;
        if (STOP.test(msg) || attempt === 3) throw e;
        await new Promise((r) => setTimeout(r, 4000 * attempt));
        continue;
      }
    }
    const { data, error } = await invokeAi<{ imageUrl?: string; error?: string; retryable?: boolean }>("generate-wall-scene", { body, timeoutMs: 150_000 });
    if (data?.imageUrl) return data.imageUrl;
    const raw = `${error?.message ?? ""} ${data?.error ?? ""}`;
    if (NOT_THERE.test(raw)) { wallFnMissing = true; attempt--; continue; }
    const msg = getAiErrorMessage(error ?? data, "The picture could not be made.");
    if (STOP.test(msg) || attempt === 3) throw new Error(msg);
    await new Promise((r) => setTimeout(r, 4000 * attempt));
  }
  throw new Error("The picture could not be made.");
}

async function inBatches<T>(jobs: (() => Promise<T>)[], n: number, onDone: () => void): Promise<PromiseSettledResult<T>[]> {
  const out: PromiseSettledResult<T>[] = new Array(jobs.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, jobs.length) }, async () => {
    while (next < jobs.length) {
      const i = next++;
      try { out[i] = { status: "fulfilled", value: await jobs[i]() }; } catch (e) { out[i] = { status: "rejected", reason: e }; }
      onDone();
    }
  }));
  return out;
}

/* ---------- one wall ---------- */

async function makeWall(s: JourneyState, m: ShowroomModel, wall: Pic, report: (p: Progress) => void, stopped: () => boolean): Promise<WallScene> {
  const key = wallKey(s, m, wall);
  const { renderGuide, renderRoomGuide, floorDepthFor, wallViewExtent } = await import("../showroom3d/scene");
  report({ wall, step: wall === "room" ? "Drawing your whole room" : "Drawing your wall from its outline", done: 0, total: 1 });
  // the wall on its stored canvas preset, at one scale, so every picture and layer of it shares one size
  const rules = await loadRules();
  // a wall with seating is seen from slightly above, so the floor and the rug in front of it show (and swap);
  // the whole room is seen from its corner at eye height, on a 16:9 canvas
  const floorM = wall === "room" ? 0 : floorDepthFor(m, wall);
  const ext = wall === "room" ? { w: 16, h: 9 } : wallViewExtent(m.room, wall, floorM);
  const canvas = canvasFor(ext.w * 100, ext.h * 100, rules.presets);
  const guide = wall === "room" ? renderRoomGuide(m, canvas.width, canvas.height) : renderGuide(m, wall, canvas.width, canvas.height, floorM);
  const comp = composeWall(m, wall as Wall, guide.boxes, canvas, rules.specs);
  const placed = new Map(comp.items.map((it) => [it.key, it]));
  const items = wallItems(s, m, wall).filter((it) => guide.boxes[it.id]);
  const total = 2 + items.reduce((n, it) => n + it.alts.length, 0);
  let done = 0;
  const tick = (step: string) => report({ wall, step, done: Math.min(total, ++done), total });

  const guideUrl = await storeDesignImage(guide.image);
  const hasTable = m.pieces.some((p) => guide.boxes[p.id] && (p.category === "dining" || p.category === "desk"));
  const pieces = m.pieces.filter((p) => guide.boxes[p.id]).map((p) => ({ name: p.kept ? `${p.name} (the client's own, keep as it is)` : p.category === "rug" ? `${p.name} (lying flat on the floor${wall === "room" ? "" : " in front of the wall"})` : hasTable && (p.category === "dchair" || p.category === "chair") ? `${p.name} (at the table: the table and every chair whole, chairs tucked in)` : p.name, detail: `${p.shapeName}, ${p.fabric ?? ""} ${m.palette.find((x) => x.hex === p.color)?.name ?? p.color}`.replace(/\s+/g, " "), box: guide.boxes[p.id] }));
  // what hangs on the wall counts too (curtains, art, mirrors), so "only these" never removes them
  for (const e of m.extras) if (guide.boxes[e.id]) pieces.push({ name: e.name, detail: `${e.kind}, ${m.palette.find((x) => x.hex === e.color)?.name ?? e.color}`, box: guide.boxes[e.id] });
  report({ wall, step: "Making the photograph of your wall", done, total });
  if (!/^https:/.test(guideUrl)) throw new Error("Your wall's drawing could not be saved. Check that you're signed in and try again.");
  const styleText = (s.preview?.read ?? []).filter((r) => r.key !== "lighting").map((r) => r.text).join(" ").slice(0, 600);
  const size = `${canvas.width}x${canvas.height}`;
  const baseData = await ai({ mode: "base", size, floorView: floorM > 0, imageUrl: guideUrl, styleImageUrl: previewImage(s), wall, style: s.moodboard?.name, palette: m.palette, pieces, moodboardDescription: s.moodboard?.description, styleText, roomType: s.current ?? s.startRoom });
  if (stopped()) throw new Error("Stopped.");
  // the photo brought to the canvas size, so it lines up with the guide and every layer pixel for pixel
  const base = await pixels(baseData, canvas.width, canvas.height);
  const up = await uploader(`${key}-${wall.toLowerCase()}-${Date.now().toString(36)}`);
  const background = await up.put("background.jpg", await toBlob(base, "image/jpeg"), "image/jpeg").catch(() => storeDesignImage(baseData));
  tick("Making the alternatives");

  // A wall colour is repainted on the picture itself (no image AI), so it can never leave a band, a patch
  // or an outline: only the wall's own pixels change, keeping the photo's light.
  const isPaint = (it: WallItem, i: number) => it.id === "walls" && !!it.alts[i]?.paint;
  /** Lies flat on the floor (a rug): other pieces stand on it. */
  const isFlat = (it: WallItem) => /rug|carpet|\bmat\b/i.test(`${it.id} ${it.title}`);
  const seedsFor = (img: Rgba) => {
    const W = img.width, H = img.height;
    const wb = guide.boxes["walls"] ? pxBox(guide.boxes["walls"] as PctBox, W, H, 0) : { x0: 0, y0: 0, x1: W, y1: H };
    const avoid = Object.entries(guide.boxes).filter(([k]) => k !== "walls" && k !== "floor").map(([, b]) => pxBox(b as PctBox, W, H, 0.12));
    return wallSeeds(W, H, wb, avoid);
  };
  /** The wall ends where the floor begins: the repaint never runs past it (light wood, a jute rug or a beige
   *  skirting can share a warm wall's colour family, and the wall would leak onto them). */
  const aboveFloor = (img: Rgba) => {
    const fb = guide.boxes["floor"] ? pxBox(guide.boxes["floor"] as PctBox, img.width, img.height, 0) : null;
    const y1 = fb && fb.y0 > img.height * 0.3 ? Math.min(img.height, fb.y0 + Math.round(img.height * 0.01)) : img.height;
    return { x0: 0, y0: 0, x1: img.width, y1 };
  };
  /** Where a photo shows the wall itself, so no piece's outline or cut-out takes any of it (see proPiece). */
  const wallOf = (img: Rgba) => wallMask(img, seedsFor(img), aboveFloor(img));
  /** A cut-out without the wall's own pixels: an alternative made on a photo still carries the old wall colour
   *  round it (shelves made on the empty room bring a block of the old wall), drawn over a new one. */
  const cutOffWall = (alpha: Float32Array, img: Rgba) => {
    const wm = wallOf(img);
    const out = new Float32Array(alpha.length);
    for (let p = 0; p < alpha.length; p++) out[p] = wm[p] >= 0.5 ? 0 : alpha[p];
    return out;
  };
  async function paintLayers(img: Rgba, item: WallItem) {
    const seeds = seedsFor(img);
    const mask = wallMask(img, seeds, aboveFloor(img));
    const out: { name: string; layer: Rgba }[] = [];
    item.alts.forEach((a) => { if (a.paint) out.push({ name: a.name, layer: paintWall(img, mask, seeds, a.paint) }); });
    return out;
  }

  // The Generator PRO way: an empty room underneath, and every piece as its own see-through image with its cast
  // shadow (multiply) over it, so nothing of the wall or floor travels with a piece. Every outline comes from
  // segmentation of the photo itself, never from the 3D guide (the AI photo doesn't match it pixel for pixel).
  // Falls back to the earlier cut-outs if the empty room or the outlines can't be made.
  try {
    const pro = await makeProLayers();
    if (pro) return pro;
  } catch (e) {
    if (stopped() || STOP.test((e as Error).message)) throw e;
    console.warn("[wall pictures] PRO layers failed, using cut-outs", e);
  }

  async function makeProLayers(): Promise<WallScene | null> {
    const W = canvas.width, H = canvas.height;
    const photoUrl = /^https:/.test(background) ? background : baseData;
    const SURFACE = (id: string) => id === "walls" || id === "floor" || id === "doors" || id.startsWith("window-");
    const pieceIds = new Set([...m.pieces.map((p) => p.id), ...m.extras.map((e) => e.id)]);
    const pieceItems = items.filter((it) => pieceIds.has(it.id));
    if (!pieceItems.length) return null;

    // 1. the pieces' outlines on the photo
    report({ wall, step: "Outlining every piece", done, total });
    const baseMasks = await segmentPhoto(photoUrl, pieceItems.map((it) => ({ key: it.id, name: it.current })), W, H);
    // the background is the empty room, so a piece without an outline would leave a gap: use the cut-outs then
    if (pieceItems.some((it) => !baseMasks[it.id])) return null;
    /** Where the other pieces are on the photo, so they are never taken for this piece's shadow. */
    let baseWall: Float32Array | undefined;
    // the floor and rugs (lying flat): a standing piece's outline never takes them, so a new floor or rug shows
    // between a table's legs and under a chair instead of the old one
    const flatIds = new Set(pieceItems.filter((it) => isFlat(it)).map((it) => it.id));
    const floorTop = aboveFloor(base).y1 - Math.round(H * 0.01);
    const surfaceFor = (id: string) => {
      const sm = new Float32Array(W * H);
      for (let p = floorTop * W; p < sm.length; p++) sm[p] = 1;
      for (const fid of flatIds) if (fid !== id && baseMasks[fid]) { const mk = baseMasks[fid]; for (let p = 0; p < sm.length; p++) if (mk[p] >= 0.5) sm[p] = 1; }
      return sm;
    };
    const standingOthers = (id: string) => {
      const o = new Float32Array(W * H);
      for (const [k, mk] of Object.entries(baseMasks)) if (k !== id && !flatIds.has(k)) for (let p = 0; p < o.length; p++) if (mk[p] > o[p]) o[p] = mk[p];
      return o;
    };
    /** What must not be drawn with a piece: the wall, and (for anything but the floor itself) floor or rugs. */
    const notPiece = (img: Rgba, mk: Float32Array, id: string, area: { x0: number; y0: number; x1: number; y1: number }, wall: Float32Array) => {
      const flat = flatIntrusion(img, mk, surfaceFor(id), standingOthers(id), area);
      const out = new Float32Array(wall);
      for (let p = 0; p < out.length; p++) if (flat[p]) out[p] = 1;
      return out;
    };
    const othersOf = (id: string) => {
      const o = new Float32Array(W * H);
      for (const [k, mk] of Object.entries(baseMasks)) if (k !== id) for (let p = 0; p < o.length; p++) if (mk[p] > o[p]) o[p] = mk[p];
      return o;
    };
    if (stopped()) throw new Error("Stopped.");

    // 2. the empty room: everything outlined (a little wider) is taken out
    report({ wall, step: "Clearing the room for the layers", done, total });
    const plateData = await ai({ mode: "plate", size, maskUrl: editMaskFrom(Object.values(baseMasks), W, H, Math.round(W * 0.02)), imageUrl: photoUrl, wall, style: s.moodboard?.name, palette: m.palette, roomType: s.current ?? s.startRoom });
    if (stopped()) throw new Error("Stopped.");
    const plate = await pixels(plateData, W, H);
    // the empty room must be the same photo with the pieces taken out: if the rest moved, don't build on it
    const pieceArea = Object.entries(guide.boxes).filter(([k]) => pieceIds.has(k)).map(([, b]) => pxBox(b as PctBox, W, H, 0.35))
      .reduce((a, b) => ({ x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) }));
    if (driftOutside(base, plate, pieceArea) > ALIGN_LIMIT * 1.5) return null;
    const plateUrl = await up.put("room.jpg", await toBlob(plate, "image/jpeg"), "image/jpeg");
    const surfaces = items.filter((it) => SURFACE(it.id));
    const plateMasks = surfaces.length
      ? await segmentPhoto(plateUrl, surfaces.map((it) => ({ key: it.id, name: it.id === "walls" ? "the painted wall surface, all of it up to the ceiling (not the door, windows, skirting or floor)" : it.id === "floor" ? "the floor" : it.current })), W, H)
      : {};
    const blank = await up.put("none.webp", await toBlob({ data: new Uint8ClampedArray(4), width: 1, height: 1 }, "image/webp"), "image/webp");

    // 3. the alternatives: a piece is changed in the photo, a wall, floor, door or window in the empty room
    type Kind = "piece" | "surface" | "free";
    const kindOf = (it: WallItem): Kind => (pieceIds.has(it.id) ? "piece" : SURFACE(it.id) && plateMasks[it.id] ? "surface" : "free");
    type Made = { px: Rgba; piece?: ProPiece; alpha?: Float32Array };
    const proJobs = items.flatMap((item) => item.alts.map((_, alt) => ({ item, alt }))).filter((j) => !isPaint(j.item, j.alt));
    const made = await inBatches(proJobs.map((j) => async (): Promise<Made> => {
      if (stopped()) throw new Error("Stopped.");
      const kind = kindOf(j.item), box = guide.boxes[j.item.id] as PctBox, a = j.item.alts[j.alt], grow = placed.get(j.item.id)?.cutPadding ?? 0.28;
      const onPlate = kind !== "piece";
      const area = pxBox(box, W, H, grow);
      const maskUrl = kind === "surface" ? editMaskFrom([plateMasks[j.item.id]], W, H, Math.round(W * 0.004)) : kind === "piece" && baseMasks[j.item.id] ? editMaskFrom([baseMasks[j.item.id]], W, H, Math.round(W * 0.03)) : editMask(W, H, area);
      const req: AiBody = { mode: "variation", size, maskUrl, imageUrl: onPlate ? plateUrl : photoUrl, item: { name: j.item.title, current: kind === "free" ? `the empty area at ${j.item.title.toLowerCase()}` : j.item.current, target: a.target, box, group: j.item.group }, productImageUrl: a.productImageUrl, style: s.moodboard?.name, palette: m.palette, roomType: s.current ?? s.startRoom };
      const from = onPlate ? plate : base;
      for (let tries = 1; tries <= 2; tries++) {
        const raw = await pixels(await ai(req), W, H);
        // a wall or floor colour changes everywhere on purpose: only a piece's tones are brought back to the photo's
        const px = kind === "surface" ? raw : matchTone(from, raw, area);
        if (kind === "surface") return { px };
        if (driftOutside(from, px, area) > ALIGN_LIMIT) continue;
        if (kind === "piece") {
          const url = await up.put(`tmp-${j.item.id.replace(/[^a-zA-Z0-9_-]/g, "-")}-${j.alt}.jpg`, await toBlob(px, "image/jpeg"), "image/jpeg");
          const mk = (await segmentPhoto(url, [{ key: j.item.id, name: a.target }], W, H))[j.item.id];
          if (!mk) throw new Error("The alternative could not be outlined.");
          const pArea = pxBox(box, W, H, grow + 0.4);
          const piece = proPiece(px, plate, mk, pxBox(box, W, H, 0.03), pArea, othersOf(j.item.id), notPiece(px, mk, j.item.id, pArea, wallOf(px)));
          if (piece.cover >= 0.05 && !piece.clipped) return { px, piece };
          continue;
        }
        const cut = altMask(plate, px, box, grow);
        if (cut.usable) return { px, alpha: cut.alpha };
      }
      throw new Error("The alternative did not fit the photo.");
    }), PARALLEL, () => tick("Making the alternatives"));
    if (stopped()) throw new Error("Stopped.");

    // 4. the layers
    report({ wall, step: "Building the layers", done, total });
    const layers: Record<string, unknown> = {}, spots: Record<string, unknown> = {}, assets: Record<string, ItemAssets> = {};
    const saved: NonNullable<WallScene["layers"]> = [], skipped: string[] = [];
    const ORDER: Record<string, number> = { walls: 1, floor: 2, doors: 3 };
    const NOTE = "Only the main option for now: its alternatives didn't fit the photo. Make the wall again to try once more.";
    for (const item of items) {
      const kind = kindOf(item), at = placed.get(item.id), name = item.id.replace(/[^a-zA-Z0-9_-]/g, "-");
      const ok: (Made & { name: string })[] = [];
      item.alts.forEach((a, i) => {
        const r = made[proJobs.findIndex((j) => j.item === item && j.alt === i)];
        if (r?.status === "fulfilled") ok.push({ ...(r.value as Made), name: a.name });
      });
      const box = guide.boxes[item.id] as PctBox;
      const order = ORDER[item.id] ?? (item.id.startsWith("window-") ? 4 : at?.zOrder ?? 10);
      const hotspot = { id: name, title: item.title, visible: true, position: at?.hotspot ?? (({ x0, y0, x1, y1 }) => ({ x: Math.round((x0 + x1) / 2), y: Math.round((y0 + y1) / 2) }))(pxBox(box, W, H, 0)) };
      const thumbArea = pxBox(box, W, H, 0.25);
      if (kind === "piece") {
        // a piece is always drawn (the room underneath is empty), its main option cut from the photo itself
        const bm = baseMasks[item.id];
        const mArea = pxBox(box, W, H, (at?.cutPadding ?? 0.28) + 0.4);
        const main = bm ? proPiece(base, plate, bm, pxBox(box, W, H, 0.03), mArea, othersOf(item.id), notPiece(base, bm, item.id, mArea, baseWall ??= wallOf(base))) : null;
        // never a gap where a piece stood: if one can't be cut, the whole wall uses the cut-outs over the photo
        if (!main || main.cover < 0.05) return null;
        const variants = [{ px: base, piece: main, name: item.mainName }, ...ok.filter((o) => o.piece).map((o) => ({ px: o.px, piece: o.piece!, name: o.name }))];
        const colours: string[] = [], shadows: string[] = [], thumbs: string[] = [];
        for (const [i, v] of variants.entries()) {
          shadows.push(await up.put(`${name}-${i + 1}-shadow.webp`, await toBlob(v.piece.shadow, "image/webp"), "image/webp"));
          colours.push(await up.put(`${name}-${i + 1}.webp`, await toBlob(v.piece.colour, "image/webp"), "image/webp"));
          thumbs.push(await up.put(`${name}-${i + 1}-thumb.jpg`, await toBlob(v.px, "image/jpeg", thumbArea, 260), "image/jpeg"));
        }
        if (variants.length < 2 && !item.note) skipped.push(item.title);
        layers[name] = { title: item.title, group: item.group, order, visible: true, blend: "pro", variations: colours, shadows, shadow: shadows[0], thumbnails: thumbs, variationNames: variants.map((v) => v.name), ...(variants.length < 2 ? { note: item.note ?? NOTE } : {}), hotspot };
        assets[item.id] = { variations: colours, thumbnails: thumbs, names: variants.map((v) => v.name) };
        saved.push({ id: item.id, title: item.title, names: variants.map((v) => v.name) });
        continue;
      }
      // the wall colour: repainted on the empty room
      if (item.id === "walls" && item.alts.some((a) => a.paint)) {
        const painted = await paintLayers(plate, item);
        const urls = [blank], thumbs = [await up.put(`${name}-1-thumb.jpg`, await toBlob(plate, "image/jpeg", thumbArea, 260), "image/jpeg")];
        for (const [i, p] of painted.entries()) {
          urls.push(await up.put(`${name}-${i + 2}.webp`, await toBlob(p.layer, "image/webp"), "image/webp"));
          thumbs.push(await up.put(`${name}-${i + 2}-thumb.jpg`, await toBlob(composite(plate, p.layer), "image/jpeg", thumbArea, 260), "image/jpeg"));
        }
        const names = [item.mainName, ...painted.map((p) => p.name)];
        layers[name] = { title: item.title, group: item.group, order, visible: true, variations: urls, thumbnails: thumbs, variationNames: names, hotspot };
        assets[item.id] = { variations: urls, thumbnails: thumbs, names };
        saved.push({ id: item.id, title: item.title, names });
        continue;
      }
      // walls, floor, door, windows, wall decor: the main option is the empty room itself
      if (!ok.length) {
        if (!item.note) skipped.push(item.title);
        if (at) spots[name] = { title: item.title, group: item.group, order, visible: true, variations: [], thumbnails: [], variationNames: [item.mainName], note: item.note ?? NOTE, hotspot };
        continue;
      }
      const urls = [blank], thumbs = [await up.put(`${name}-1-thumb.jpg`, await toBlob(kind === "free" ? base : plate, "image/jpeg", thumbArea, 260), "image/jpeg")];
      for (const [i, o] of ok.entries()) {
        const layer = kind === "surface" ? surfaceLayer(o.px, plateMasks[item.id]) : cutLayer(o.px, cutOffWall(o.alpha!, o.px));
        const blob = await toBlob(layer, "image/webp");
        urls.push(await up.put(`${name}-${i + 2}.${blob.type === "image/webp" ? "webp" : "png"}`, blob, blob.type));
        thumbs.push(await up.put(`${name}-${i + 2}-thumb.jpg`, await toBlob(o.px, "image/jpeg", thumbArea, 260), "image/jpeg"));
      }
      const names = [item.mainName, ...ok.map((o) => o.name)];
      layers[name] = { title: item.title, group: item.group, order, visible: true, variations: urls, thumbnails: thumbs, variationNames: names, hotspot };
      assets[item.id] = { variations: urls, thumbnails: thumbs, names };
      saved.push({ id: item.id, title: item.title, names });
    }
    if (!Object.values(layers).some((l) => (l as { blend?: string }).blend === "pro")) return null;
    const composition = { preset: canvas.preset, pxPerCm: canvas.pxPerCm, wall: { lengthCm: canvas.lengthCm, heightCm: canvas.heightCm, x: canvas.wallX, y: canvas.wallY }, items: comp.items };
    const manifest = { mode: "pro", background: plateUrl, photo: background, imageSize: { width: W, height: H }, layers, hotspots: spots, composition, enhancements: { brightness: 100, contrast: 100, saturation: 100 } };
    const manifestUrl = await up.put("manifest.json", new Blob([JSON.stringify(manifest)], { type: "application/json" }), "application/json");
    if (wall !== "room") void saveComposition(s, comp, { sceneKey: key, guideUrl, background: plateUrl, manifestUrl, assets });
    tick("Done");
    return { status: "ready", key, manifestUrl, assetsUrl: up.assetsUrl, background: plateUrl, layers: saved, skipped, canvas: { preset: canvas.preset, width: W, height: H, pxPerCm: canvas.pxPerCm }, at: new Date().toISOString() };
  }

  // every alternative of every item, a few at a time
  type Job = { item: WallItem; alt: number };
  const jobs: Job[] = items.flatMap((item) => item.alts.map((_, alt) => ({ item, alt }))).filter((j) => !isPaint(j.item, j.alt));
  const results = await inBatches(jobs.map((j) => async (): Promise<{ px: Rgba; cut: AltCut }> => {
    if (stopped()) throw new Error("Stopped.");
    const box = guide.boxes[j.item.id], a = j.item.alts[j.alt], grow = placed.get(j.item.id)?.cutPadding ?? 0.28;
    const req: AiBody = { mode: "variation", size, maskUrl: editMask(canvas.width, canvas.height, pxBox(box as PctBox, canvas.width, canvas.height, grow)), imageUrl: /^https:/.test(background) ? background : baseData, item: { name: j.item.title, current: j.item.current, target: a.target, box, group: j.item.group }, productImageUrl: a.productImageUrl, style: s.moodboard?.name, palette: m.palette, roomType: s.current ?? s.startRoom };
    // an alternative is kept only when it sits in the photo like the original: same tones, the rest of the
    // photo untouched, the new piece whole (not cut off by its area) and not a re-lit rectangle
    for (let tries = 1; tries <= 2; tries++) {
      const raw = await pixels(await ai(req), base.width, base.height);
      const area = pxBox(box, base.width, base.height, grow);
      const px = matchTone(base, raw, area);
      if (driftOutside(base, px, area) > ALIGN_LIMIT) continue;
      const cut = altMask(base, px, box as PctBox, grow);
      if (!cut.usable) continue;
      // keep the layer off the other pieces' pixels, so swapping one piece never repaints another. Not for the
      // floor or a rug: the 3D guide doesn't line up with the photo, and keeping a new rug off the guide's table
      // legs punched leg-shaped holes in it where the old rug showed (the new rug's own cut follows the photo)
      if (guide.ids && j.item.id !== "floor" && !isFlat(j.item)) {
        const surface = j.item.id === "walls" || j.item.id === "floor";
        const others = new Set<number>();
        guide.ids.keys.forEach((k, i) => { if (k !== j.item.id && (surface || (k !== "walls" && k !== "floor"))) others.add(i + 1); });
        const shrink = Math.max(4, Math.round(base.width * 0.008));
        const area = { x0: Math.max(0, cut.box.x0 - shrink), y0: Math.max(0, cut.box.y0 - shrink), x1: Math.min(base.width, cut.box.x1 + shrink), y1: Math.min(base.height, cut.box.y1 + shrink) };
        cut.alpha = limitAlpha(cut.alpha, keepOff(guide.ids.data, base.width, base.height, others, area, shrink));
      }
      // a piece's or a shelf's cut-out never carries the old wall round it (the wall colour sits under it)
      if (j.item.id !== "walls" && j.item.id !== "floor") cut.alpha = cutOffWall(cut.alpha, px);
      return { px, cut };
    }
    throw new Error("The alternative did not fit the photo.");
  }), PARALLEL, () => tick("Making the alternatives"));
  if (stopped()) throw new Error("Stopped.");

  report({ wall, step: "Cutting the layers", done, total });
  const layers: Record<string, unknown> = {};
  const assets: Record<string, ItemAssets> = {};
  /** Items with nothing to swap: clickable spots kept apart from the layers (the Generator PRO viewer reads only layers). */
  const spots: Record<string, unknown> = {};
  const saved: NonNullable<WallScene["layers"]> = [];
  const skipped: string[] = [];
  for (const item of items) {
    if (item.id === "walls" && item.alts.some((a) => a.paint)) {
      // the wall colour, repainted on the photo: drawn over it only when picked, so the main option is empty
      const painted = await paintLayers(base, item);
      const name = item.id;
      const at = placed.get(item.id);
      const wb = guide.boxes["walls"] ? pxBox(guide.boxes["walls"] as PctBox, base.width, base.height, 0) : { x0: 0, y0: 0, x1: base.width, y1: base.height };
      const blank = await up.put("none.webp", await toBlob({ data: new Uint8ClampedArray(4), width: 1, height: 1 }, "image/webp"), "image/webp");
      const urls = [blank], thumbs = [await up.put(`${name}-1-thumb.jpg`, await toBlob(base, "image/jpeg", wb, 260), "image/jpeg")];
      for (const [i, p] of painted.entries()) {
        urls.push(await up.put(`${name}-${i + 2}.webp`, await toBlob(p.layer, "image/webp"), "image/webp"));
        thumbs.push(await up.put(`${name}-${i + 2}-thumb.jpg`, await toBlob(composite(base, p.layer), "image/jpeg", wb, 260), "image/jpeg"));
      }
      const names = [item.mainName, ...painted.map((p) => p.name)];
      assets[item.id] = { variations: urls, thumbnails: thumbs, names };
      // drawn right over the photo, under every swapped piece: a new piece that reaches past the old one's
      // outline is never painted over
      layers[name] = { title: item.title, group: item.group, order: 0.5, visible: true, variations: urls, thumbnails: thumbs, variationNames: names, hotspot: { id: name, title: item.title, visible: true, position: at?.hotspot ?? { x: Math.round((wb.x0 + wb.x1) / 2), y: Math.round(wb.y0 + (wb.y1 - wb.y0) * 0.15) } } };
      saved.push({ id: item.id, title: item.title, names });
      continue;
    }
    const ok: { px: Rgba; cut: AltCut; name: string }[] = [];
    item.alts.forEach((a, i) => {
      const r = results[jobs.findIndex((j) => j.item === item && j.alt === i)];
      if (r?.status === "fulfilled") { const v = r.value as { px: Rgba; cut: AltCut }; ok.push({ ...v, name: a.name }); }
    });
    if (!ok.length) {
      // still clickable: its hotspot opens what it is, with no layer to swap
      if (!item.note) skipped.push(item.title);
      const at = placed.get(item.id);
      if (at) spots[item.id.replace(/[^a-zA-Z0-9_-]/g, "-")] = {
        title: item.title, group: item.group, order: at.zOrder, visible: true, variations: [], thumbnails: [], variationNames: [item.mainName],
        note: item.note ?? "Only the main option for now: its alternatives didn't fit the photo. Make the wall again to try once more.",
        hotspot: { id: item.id, title: item.title, visible: true, position: at.hotspot },
      };
      continue;
    }
    // each alternative is cut to its own shape; the main option covers wherever any of them drew,
    // and since it is the photo itself it never shows a seam
    const all = unionAlpha(ok.map((o) => o.cut));
    const area = alphaBox(all, base.width, base.height, ok[0].cut.box);
    const variants = [{ px: base, alpha: all, name: item.mainName }, ...ok.map((o) => ({ px: o.px, alpha: o.cut.alpha, name: o.name }))];
    const piece = pxBox(guide.boxes[item.id] as PctBox, base.width, base.height, 0.03);
    const name = item.id.replace(/[^a-zA-Z0-9_-]/g, "-");
    const urls: string[] = [], thumbs: string[] = [];
    for (const [i, v] of variants.entries()) {
      const layer = i === 0 ? cutLayer(v.px, v.alpha) : cutAlt(base, v.px, v.alpha, piece, 8, /rug|carpet/i.test(`${item.id} ${item.title}`));
      const blob = await toBlob(layer, "image/webp");
      urls.push(await up.put(`${name}-${i + 1}.${blob.type === "image/webp" ? "webp" : "png"}`, blob, blob.type));
      const t = await toBlob(composite(base, layer), "image/jpeg", area, 260);
      thumbs.push(await up.put(`${name}-${i + 1}-thumb.jpg`, t, "image/jpeg"));
    }
    const at = placed.get(item.id);
    const c = at?.hotspot ?? centreOf(all, base.width, area);
    assets[item.id] = { variations: urls, thumbnails: thumbs, names: variants.map((v) => v.name) };
    layers[name] = {
      title: item.title, group: item.group, order: at?.zOrder ?? 10, visible: true,
      variations: urls, thumbnails: thumbs, variationNames: variants.map((v) => v.name),
      hotspot: { id: name, title: item.title, visible: true, position: c },
    };
    saved.push({ id: item.id, title: item.title, names: variants.map((v) => v.name) });
  }
  // Even if no alternatives succeeded, the original photo and its item hotspots
  // remain a usable wall; never discard that photo after an outlining timeout.
  const composition = { preset: canvas.preset, pxPerCm: canvas.pxPerCm, wall: { lengthCm: canvas.lengthCm, heightCm: canvas.heightCm, x: canvas.wallX, y: canvas.wallY }, items: comp.items };
  const manifest = { background, imageSize: { width: base.width, height: base.height }, layers, hotspots: spots, composition, enhancements: { brightness: 100, contrast: 100, saturation: 100 } };
  const manifestUrl = await up.put("manifest.json", new Blob([JSON.stringify(manifest)], { type: "application/json" }), "application/json");
  if (wall !== "room") void saveComposition(s, comp, { sceneKey: key, guideUrl, background, manifestUrl, assets });
  tick("Done");
  return { status: "ready", key, manifestUrl, assetsUrl: up.assetsUrl, background, layers: saved, skipped, canvas: { preset: canvas.preset, width: canvas.width, height: canvas.height, pxPerCm: canvas.pxPerCm }, at: new Date().toISOString() };
}

/** Record a finished wall in the database too, so the scene is found from any device (best effort). */
async function publish(s: JourneyState, wall: Pic, scene: WallScene) {
  const layoutId = s.layouts[s.chosenLayout ?? 0]?.id;
  if (!s.projectId || !s.roomId || !layoutId || !scene.manifestUrl) return;
  try {
    const view = wall === "room" ? "room" : `wall_${wall.toLowerCase()}`;
    const { data } = await supabase.from("showroom_scenes").select("version").eq("project_id", s.projectId).eq("room_id", s.roomId).eq("layout_id", layoutId).eq("view", view).order("version", { ascending: false }).limit(1);
    await supabase.from("showroom_scenes").insert({ project_id: s.projectId, room_id: s.roomId, layout_id: layoutId, view, manifest_url: scene.manifestUrl, assets_url: scene.assetsUrl, status: "ready", version: (data?.[0]?.version ?? 0) + 1 });
  } catch {
    /* the journey keeps its own copy */
  }
}

/** A mask for a swap: opaque everywhere except the item's area, which the picture model may change. */
function editMask(width: number, height: number, area: { x0: number; y0: number; x1: number; y1: number }): string | undefined {
  try {
    const c = document.createElement("canvas");
    c.width = width; c.height = height;
    const g = c.getContext("2d")!;
    g.fillStyle = "#000";
    g.fillRect(0, 0, width, height);
    g.clearRect(area.x0, area.y0, area.x1 - area.x0, area.y1 - area.y0);
    return c.toDataURL("image/png");
  } catch {
    return undefined;
  }
}

/* ---------- the whole room, with one runner per page ---------- */

type Listener = (p: Progress | null) => void;
let running: { stop: boolean } | null = null;
let progress: Progress | null = null;
const listeners = new Set<Listener>();
const emit = (p: Progress | null) => { progress = p; listeners.forEach((l) => l(p)); };
export const isRunning = () => !!running;
export const currentProgress = () => progress;
export function onProgress(l: Listener) { listeners.add(l); return () => { listeners.delete(l); }; }
export function stopMaking() { if (running) running.stop = true; }

/** Which walls still need a picture: never made, failed, or made from an older version of the room. */
export function wallsToMake(s: JourneyState): Pic[] {
  const m = buildModel(s);
  return PICTURES.filter((w) => {
    const sc = s.showroom?.scenes?.[w];
    return !sc || sc.status !== "ready" || sc.key !== wallKey(s, m, w);
  });
}

/**
 * Make every wall that needs it. `get` reads the latest journey state and `save` stores one wall's scene,
 * so the result lands even if the person moved on to another screen meanwhile.
 */
export async function makeRoomPictures(get: () => JourneyState, save: (wall: Pic, scene: WallScene) => void, walls = wallsToMake(get())) {
  if (running) return;
  const run = { stop: false };
  running = run;
  try {
    for (const wall of walls) {
      if (run.stop) break;
      const s = get(), m = buildModel(s), key = wallKey(s, m, wall);
      save(wall, { status: "making", key, at: new Date().toISOString() });
      try {
        const scene = await makeWall(s, m, wall, emit, () => run.stop);
        save(wall, scene);
        void publish(get(), wall, scene);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "The picture could not be made.";
        save(wall, { status: "failed", key, error: msg, at: new Date().toISOString() });
        if (/credits|blocked|sign in/i.test(msg)) break;
      }
    }
  } finally {
    running = null;
    emit(null);
  }
}
