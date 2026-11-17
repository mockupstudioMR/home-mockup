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
import { buildModel, type ShowroomModel } from "../showroom3d/model";
import { alphaBox, altMask, centreOf, composite, cutAlt, cutLayer, driftOutside, matchTone, pxBox, unionAlpha, type AltCut, type PctBox, type Rgba } from "./layers";
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
export type Progress = { wall: Wall; step: string; done: number; total: number };

export const WALLS: Wall[] = ["A", "B", "C", "D"];
const ALIGN_LIMIT = 14; // mean change outside the item (0–255), after matching tones, above which an alternative moved the photo
const PARALLEL = 4;
/** Raised when the way pictures are made changes, so walls made the old way are made again. */
const PICTURE_VERSION = 4;

const previewImage = (s: JourneyState) => s.preview?.versions[s.preview.current]?.image;

/** A short fingerprint of everything a wall's picture is made from. */
export function wallKey(s: JourneyState, m: ShowroomModel, wall: Wall) {
  const pieces = m.pieces.filter((p) => p.wall === wall).map((p) => [p.id, p.shape, p.color, Math.round(p.fromCm), Math.round(p.toCm)]);
  const raw = JSON.stringify([PICTURE_VERSION, wall, previewImage(s) ?? "", m.palette.map((p) => p.hex), m.room, m.openings.filter((o) => o.wall === wall), pieces, m.extras.filter((e) => e.wall === wall).map((e) => [e.id, e.color]), m.surfaces]);
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
  return new Promise((resolve, reject) => out.toBlob((b) => (b ? resolve(b) : reject(new Error("A layer could not be saved."))), type, type === "image/jpeg" ? 0.86 : 0.9));
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
  mode: "base" | "variation"; imageUrl: string; styleImageUrl?: string; wall?: string; style?: string;
  palette?: { name: string; hex: string; use?: string }[]; pieces?: { name: string; detail: string; box: PctBox }[];
  item?: { name: string; current: string; target: string; box: PctBox; group?: string }; productImageUrl?: string;
  moodboardDescription?: string; styleText?: string; roomType?: string;
};
/** Set once the wall-picture function turns out not to be deployed: from then on the preview function is used. */
let wallFnMissing = false;
const NOT_THERE = /failed to send a request|not.?found|function.*(missing|does not exist)|404/i;
const STOP = /credits|blocked|sign in/i;
const pct = (b: PctBox) => `${Math.round(b[0])}% from the left, ${Math.round(b[1])}% from the top, ${Math.round(b[2])}% wide, ${Math.round(b[3])}% high`;

/** What makes the pictures read as photographs, not renders: shared by both functions' prompts. */
const REAL = "It must look like a real photograph taken by an interior photographer with a full-frame camera: soft daylight from one consistent direction, gentle falloff across the wall, real fabric weave, wood grain and plaster texture, slight natural imperfections. Shadows only where light really makes them: soft contact shadows under and behind each piece, no dark halos, no floating shadows, no shadow rectangles or patches. Every piece complete and whole, never cut off by the frame or by another piece; nothing partly entering at the edges. No CGI look, no plastic surfaces, no text, no watermark.";

/** The same request through generate-design (the preview's function, always deployed), as a surgical edit. */
async function viaPreviewFunction(b: AiBody): Promise<string> {
  const palette = (b.palette ?? []).map((p) => `${p.name} ${p.hex}${p.use ? ` for ${p.use.toLowerCase()}` : ""}`).join(", ");
  const change = b.mode === "base"
    ? `Render this exact straight-on wall elevation as a real, photorealistic interior photograph of wall ${b.wall ?? ""}. Turn every simple 3D shape into the real piece it stands for, with real materials and textures, in the ${b.style ?? "chosen"} style${b.styleText ? ` (${b.styleText})` : ""}. Colours: ${palette}. Pieces, left to right: ${(b.pieces ?? []).map((p) => `${p.name} (${p.detail}) at ${pct(p.box)}`).join("; ")}. Keep every piece, door and window exactly where it is and exactly its size; keep the straight-on view with the wall filling the frame. ${REAL}`
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

async function makeWall(s: JourneyState, m: ShowroomModel, wall: Wall, report: (p: Progress) => void, stopped: () => boolean): Promise<WallScene> {
  const key = wallKey(s, m, wall);
  const { renderGuide } = await import("../showroom3d/scene");
  report({ wall, step: "Drawing your wall from its outline", done: 0, total: 1 });
  // the wall on its stored canvas preset, at one scale, so every picture and layer of it shares one size
  const rules = await loadRules();
  const canvas = canvasFor(wallLength(m, wall) * 100, m.room.h * 100, rules.presets);
  const guide = renderGuide(m, wall, canvas.width, canvas.height);
  const comp = composeWall(m, wall, guide.boxes, canvas, rules.specs);
  const placed = new Map(comp.items.map((it) => [it.key, it]));
  const items = wallItems(s, m, wall).filter((it) => guide.boxes[it.id]);
  const total = 2 + items.reduce((n, it) => n + it.alts.length, 0);
  let done = 0;
  const tick = (step: string) => report({ wall, step, done: Math.min(total, ++done), total });

  const guideUrl = await storeDesignImage(guide.image);
  const pieces = m.pieces.filter((p) => guide.boxes[p.id] && p.category !== "rug").map((p) => ({ name: p.kept ? `${p.name} (the client's own, keep as it is)` : p.name, detail: `${p.shapeName}, ${p.fabric ?? ""} ${m.palette.find((x) => x.hex === p.color)?.name ?? p.color}`.replace(/\s+/g, " "), box: guide.boxes[p.id] }));
  report({ wall, step: "Making the photograph of your wall", done, total });
  if (!/^https:/.test(guideUrl)) throw new Error("Your wall's drawing could not be saved. Check that you're signed in and try again.");
  const styleText = (s.preview?.read ?? []).filter((r) => r.key !== "lighting").map((r) => r.text).join(" ").slice(0, 600);
  const baseData = await ai({ mode: "base", imageUrl: guideUrl, styleImageUrl: previewImage(s), wall, style: s.moodboard?.name, palette: m.palette, pieces, moodboardDescription: s.moodboard?.description, styleText, roomType: s.current ?? s.startRoom });
  if (stopped()) throw new Error("Stopped.");
  // the photo brought to the canvas size, so it lines up with the guide and every layer pixel for pixel
  const base = await pixels(baseData, canvas.width, canvas.height);
  const up = await uploader(`${key}-${wall.toLowerCase()}-${Date.now().toString(36)}`);
  const background = await up.put("background.jpg", await toBlob(base, "image/jpeg"), "image/jpeg").catch(() => storeDesignImage(baseData));
  tick("Making the alternatives");

  // every alternative of every item, a few at a time
  type Job = { item: WallItem; alt: number };
  const jobs: Job[] = items.flatMap((item) => item.alts.map((_, alt) => ({ item, alt })));
  const results = await inBatches(jobs.map((j) => async (): Promise<{ px: Rgba; cut: AltCut }> => {
    if (stopped()) throw new Error("Stopped.");
    const box = guide.boxes[j.item.id], a = j.item.alts[j.alt], grow = placed.get(j.item.id)?.cutPadding ?? 0.28;
    const req: AiBody = { mode: "variation", imageUrl: /^https:/.test(background) ? background : baseData, item: { name: j.item.title, current: j.item.current, target: a.target, box, group: j.item.group }, productImageUrl: a.productImageUrl, style: s.moodboard?.name, palette: m.palette, roomType: s.current ?? s.startRoom };
    // an alternative is kept only when it sits in the photo like the original: same tones, the rest of the
    // photo untouched, the new piece whole (not cut off by its area) and not a re-lit rectangle
    for (let tries = 1; tries <= 2; tries++) {
      const raw = await pixels(await ai(req), base.width, base.height);
      const area = pxBox(box, base.width, base.height, grow);
      const px = matchTone(base, raw, area);
      if (driftOutside(base, px, area) > ALIGN_LIMIT) continue;
      const cut = altMask(base, px, box as PctBox, grow);
      if (cut.usable) return { px, cut };
    }
    throw new Error("The alternative did not fit the photo.");
  }), PARALLEL, () => tick("Making the alternatives"));
  if (stopped()) throw new Error("Stopped.");

  report({ wall, step: "Cutting the layers", done, total });
  const layers: Record<string, unknown> = {};
  const assets: Record<string, ItemAssets> = {};
  const saved: NonNullable<WallScene["layers"]> = [];
  const skipped: string[] = [];
  for (const item of items) {
    const ok: { px: Rgba; cut: AltCut; name: string }[] = [];
    item.alts.forEach((a, i) => {
      const r = results[jobs.findIndex((j) => j.item === item && j.alt === i)];
      if (r?.status === "fulfilled") { const v = r.value as { px: Rgba; cut: AltCut }; ok.push({ ...v, name: a.name }); }
    });
    if (!ok.length) { skipped.push(item.title); continue; }
    // each alternative is cut to its own shape; the main option covers wherever any of them drew,
    // and since it is the photo itself it never shows a seam
    const all = unionAlpha(ok.map((o) => o.cut));
    const area = alphaBox(all, base.width, base.height, ok[0].cut.box);
    const variants = [{ px: base, alpha: all, name: item.mainName }, ...ok.map((o) => ({ px: o.px, alpha: o.cut.alpha, name: o.name }))];
    const piece = pxBox(guide.boxes[item.id] as PctBox, base.width, base.height, 0.03);
    const name = item.id.replace(/[^a-zA-Z0-9_-]/g, "-");
    const urls: string[] = [], thumbs: string[] = [];
    for (const [i, v] of variants.entries()) {
      const layer = i === 0 ? cutLayer(v.px, v.alpha) : cutAlt(base, v.px, v.alpha, piece);
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
  if (!saved.length) throw new Error("None of the alternatives could be made for this wall. Try again.");
  const composition = { preset: canvas.preset, pxPerCm: canvas.pxPerCm, wall: { lengthCm: canvas.lengthCm, heightCm: canvas.heightCm, x: canvas.wallX, y: canvas.wallY }, items: comp.items };
  const manifest = { background, imageSize: { width: base.width, height: base.height }, layers, composition, enhancements: { brightness: 100, contrast: 100, saturation: 100 } };
  const manifestUrl = await up.put("manifest.json", new Blob([JSON.stringify(manifest)], { type: "application/json" }), "application/json");
  void saveComposition(s, comp, { sceneKey: key, guideUrl, background, manifestUrl, assets });
  tick("Done");
  return { status: "ready", key, manifestUrl, assetsUrl: up.assetsUrl, background, layers: saved, skipped, canvas: { preset: canvas.preset, width: canvas.width, height: canvas.height, pxPerCm: canvas.pxPerCm }, at: new Date().toISOString() };
}

/** Record a finished wall in the database too, so the scene is found from any device (best effort). */
async function publish(s: JourneyState, wall: Wall, scene: WallScene) {
  const layoutId = s.layouts[s.chosenLayout ?? 0]?.id;
  if (!s.projectId || !s.roomId || !layoutId || !scene.manifestUrl) return;
  try {
    const view = `wall_${wall.toLowerCase()}`;
    const { data } = await supabase.from("showroom_scenes").select("version").eq("project_id", s.projectId).eq("room_id", s.roomId).eq("layout_id", layoutId).eq("view", view).order("version", { ascending: false }).limit(1);
    await supabase.from("showroom_scenes").insert({ project_id: s.projectId, room_id: s.roomId, layout_id: layoutId, view, manifest_url: scene.manifestUrl, assets_url: scene.assetsUrl, status: "ready", version: (data?.[0]?.version ?? 0) + 1 });
  } catch {
    /* the journey keeps its own copy */
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
export function wallsToMake(s: JourneyState): Wall[] {
  const m = buildModel(s);
  return WALLS.filter((w) => {
    const sc = s.showroom?.scenes?.[w];
    return !sc || sc.status !== "ready" || sc.key !== wallKey(s, m, w);
  });
}

/**
 * Make every wall that needs it. `get` reads the latest journey state and `save` stores one wall's scene,
 * so the result lands even if the person moved on to another screen meanwhile.
 */
export async function makeRoomPictures(get: () => JourneyState, save: (wall: Wall, scene: WallScene) => void, walls = wallsToMake(get())) {
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
