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
import { centreOf, composite, cutLayer, driftOutside, itemMask, pxBox, type PctBox, type Rgba } from "./layers";
import { wallItems, type WallItem } from "./items";

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
  at: string;
};
export type Progress = { wall: Wall; step: string; done: number; total: number };

export const WALLS: Wall[] = ["A", "B", "C", "D"];
const ALIGN_LIMIT = 20; // mean change outside the item (0–255) above which an alternative moved the photo
const PARALLEL = 4;

const previewImage = (s: JourneyState) => s.preview?.versions[s.preview.current]?.image;

/** A short fingerprint of everything a wall's picture is made from. */
export function wallKey(s: JourneyState, m: ShowroomModel, wall: Wall) {
  const pieces = m.pieces.filter((p) => p.wall === wall).map((p) => [p.id, p.shape, p.color, Math.round(p.fromCm), Math.round(p.toCm)]);
  const raw = JSON.stringify([wall, previewImage(s) ?? "", m.palette.map((p) => p.hex), m.room, m.openings.filter((o) => o.wall === wall), pieces, m.extras.filter((e) => e.wall === wall).map((e) => [e.id, e.color]), m.surfaces]);
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

async function ai(body: Record<string, unknown>): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { data, error } = await invokeAi<{ imageUrl?: string; error?: string; retryable?: boolean }>("generate-wall-scene", { body, timeoutMs: 150_000 });
    if (data?.imageUrl) return data.imageUrl;
    const msg = getAiErrorMessage(error ?? data, "The picture could not be made.");
    if (/credits|blocked|sign in/i.test(msg) || attempt === 3) throw new Error(msg);
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
  report({ wall, step: "Drawing your wall from your layout", done: 0, total: 1 });
  const guide = renderGuide(m, wall);
  const items = wallItems(s, m, wall).filter((it) => guide.boxes[it.id]);
  const total = 2 + items.reduce((n, it) => n + it.alts.length, 0);
  let done = 0;
  const tick = (step: string) => report({ wall, step, done: Math.min(total, ++done), total });

  const guideUrl = await storeDesignImage(guide.image);
  const pieces = m.pieces.filter((p) => guide.boxes[p.id] && p.category !== "rug").map((p) => ({ name: p.kept ? `${p.name} (the client's own, keep as it is)` : p.name, detail: `${p.shapeName}, ${p.fabric ?? ""} ${m.palette.find((x) => x.hex === p.color)?.name ?? p.color}`.replace(/\s+/g, " "), box: guide.boxes[p.id] }));
  report({ wall, step: "Making the photograph of your wall", done, total });
  const baseData = await ai({ mode: "base", imageUrl: /^https:/.test(guideUrl) ? guideUrl : guide.image, styleImageUrl: previewImage(s), wall, style: s.moodboard?.name, palette: m.palette, pieces, moodboardDescription: s.moodboard?.description });
  if (stopped()) throw new Error("Stopped.");
  const background = await storeDesignImage(baseData);
  const base = await pixels(baseData);
  tick("Making the alternatives");

  // every alternative of every item, a few at a time
  type Job = { item: WallItem; alt: number };
  const jobs: Job[] = items.flatMap((item) => item.alts.map((_, alt) => ({ item, alt })));
  const results = await inBatches(jobs.map((j) => async () => {
    if (stopped()) throw new Error("Stopped.");
    const box = guide.boxes[j.item.id], a = j.item.alts[j.alt];
    const req = { mode: "variation", imageUrl: /^https:/.test(background) ? background : baseData, item: { name: j.item.title, current: j.item.current, target: a.target, box }, productImageUrl: a.productImageUrl };
    for (let tries = 1; tries <= 2; tries++) {
      const px = await pixels(await ai(req), base.width, base.height);
      if (driftOutside(base, px, pxBox(box, base.width, base.height, 0.15)) <= ALIGN_LIMIT) return px;
    }
    throw new Error("The alternative moved the rest of the picture.");
  }), PARALLEL, () => tick("Making the alternatives"));
  if (stopped()) throw new Error("Stopped.");

  report({ wall, step: "Cutting the layers", done, total });
  const up = await uploader(`${key}-${wall.toLowerCase()}-${Date.now().toString(36)}`);
  const layers: Record<string, unknown> = {};
  const saved: NonNullable<WallScene["layers"]> = [];
  const skipped: string[] = [];
  let order = 10;
  for (const item of items) {
    const ok: { px: Rgba; name: string }[] = [];
    item.alts.forEach((a, i) => {
      const r = results[jobs.findIndex((j) => j.item === item && j.alt === i)];
      if (r?.status === "fulfilled") ok.push({ px: r.value as Rgba, name: a.name });
    });
    if (!ok.length) { skipped.push(item.title); continue; }
    const mask = itemMask(base, ok.map((o) => o.px), guide.boxes[item.id] as PctBox);
    const variants = [{ px: base, name: item.mainName }, ...ok];
    const name = item.id.replace(/[^a-zA-Z0-9_-]/g, "-");
    const urls: string[] = [], thumbs: string[] = [];
    for (const [i, v] of variants.entries()) {
      const layer = cutLayer(v.px, mask.alpha);
      const blob = await toBlob(layer, "image/webp");
      urls.push(await up.put(`${name}-${i + 1}.${blob.type === "image/webp" ? "webp" : "png"}`, blob, blob.type));
      const t = await toBlob(composite(base, layer), "image/jpeg", mask.box, 260);
      thumbs.push(await up.put(`${name}-${i + 1}-thumb.jpg`, t, "image/jpeg"));
    }
    const c = centreOf(mask.alpha, base.width, mask.box);
    layers[name] = {
      title: item.title, group: item.group, order: order++, visible: true,
      variations: urls, thumbnails: thumbs, variationNames: variants.map((v) => v.name),
      hotspot: { id: name, title: item.title, visible: true, position: c },
    };
    saved.push({ id: item.id, title: item.title, names: variants.map((v) => v.name) });
  }
  if (!saved.length) throw new Error("None of the alternatives could be made for this wall. Try again.");
  const manifest = { background, imageSize: { width: base.width, height: base.height }, layers, enhancements: { brightness: 100, contrast: 100, saturation: 100 } };
  const manifestUrl = await up.put("manifest.json", new Blob([JSON.stringify(manifest)], { type: "application/json" }), "application/json");
  tick("Done");
  return { status: "ready", key, manifestUrl, assetsUrl: up.assetsUrl, background, layers: saved, skipped, at: new Date().toISOString() };
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
