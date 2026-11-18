/**
 * How a wall picture is composed: the canvas it is drawn on, the scale, and every piece's place, size, drawing
 * order and hotspot. The rules live in the database (showroom_canvas_presets, showroom_item_specs per layout
 * box); the same defaults are kept here so pictures can still be made when they can't be read.
 * Every wall's composition is stored in wall_compositions and wall_composition_items.
 */
import { supabase } from "@/lib/looseDb";
import type { Category } from "../showroom3d/library";
import type { ShowroomModel } from "../showroom3d/model";
import type { JourneyState, Wall } from "../state";

export type CanvasPreset = { key: string; label: string; width: number; height: number };
/** Sizes the image models draw natively; mirrors the seeded showroom_canvas_presets. */
export const PRESETS: CanvasPreset[] = [
  { key: "4x3", label: "Short wall (4:3)", width: 1536, height: 1152 },
  { key: "3x2", label: "Compact wall (3:2)", width: 1536, height: 1024 },
  { key: "16x9", label: "Standard wall (16:9)", width: 1792, height: 1008 },
  { key: "2x1", label: "Long wall (2:1)", width: 2048, height: 1024 },
  { key: "21x9", label: "Very long wall (21:9)", width: 2048, height: 880 },
  { key: "3x1", label: "Gallery wall (3:1)", width: 2048, height: 688 },
];

export type Canvas = {
  preset: string; width: number; height: number;
  /** One scale for the whole wall. */
  pxPerCm: number;
  /** Where the wall's left end and ceiling line sit inside the canvas. */
  wallX: number; wallY: number;
  lengthCm: number; heightCm: number;
};

export const wallLength = (m: ShowroomModel, wall: Wall) => (wall === "A" || wall === "C" ? m.room.w : m.room.l);

/** The preset whose shape is closest to the wall's own (compared as ratios, so 2:1 and 1:2 are equally far). */
export function pickPreset(lengthCm: number, heightCm: number, presets: CanvasPreset[] = PRESETS): CanvasPreset {
  const r = lengthCm / Math.max(1, heightCm);
  return presets.reduce((best, p) => (Math.abs(Math.log(p.width / p.height / r)) < Math.abs(Math.log(best.width / best.height / r)) ? p : best), presets[0]);
}

/** The wall fitted whole onto the preset at one scale, centred. */
export function canvasFor(lengthCm: number, heightCm: number, presets: CanvasPreset[] = PRESETS): Canvas {
  const p = pickPreset(lengthCm, heightCm, presets);
  const pxPerCm = Math.min(p.width / lengthCm, p.height / heightCm);
  return {
    preset: p.key, width: p.width, height: p.height, pxPerCm,
    wallX: Math.round((p.width - lengthCm * pxPerCm) / 2), wallY: Math.round((p.height - heightCm * pxPerCm) / 2),
    lengthCm: Math.round(lengthCm), heightCm: Math.round(heightCm),
  };
}

/* ---------- rules per layout box ---------- */

export type ItemSpec = {
  specId?: string; name: string; kind?: string;
  mount: "floor" | "wall" | "ceiling"; bottomCm: number;
  /** 0 on the wall … 4 foreground: pieces further forward are drawn over those behind. */
  depthBand: number;
  layerGroup: "furniture" | "walls" | "floor" | "lighting" | "decor";
  /** Room around the piece for its cut-out, as a share of its size. */
  cutPadding: number; shadowMarginCm: number;
  hotspot: [number, number];
  /** Smallest side, in pixels, the piece should be drawn at. */
  minPx: number;
  inWallPictures: boolean;
};

/** The default rule for a piece, from its name and kind; the same rules seed showroom_item_specs. */
export function defaultSpec(name: string, kind = ""): ItemSpec {
  const n = name.toLowerCase();
  const r: ItemSpec = { name, kind, mount: "floor", bottomCm: 0, depthBand: 2, layerGroup: "furniture", cutPadding: 0.28, shadowMarginCm: 8, hotspot: [0.5, 0.5], minPx: 96, inWallPictures: true };
  if (/mirror|\bart\b|frame/.test(n)) return { ...r, mount: "wall", bottomCm: 110, depthBand: 0, layerGroup: "decor", cutPadding: 0.22, shadowMarginCm: 3, minPx: 80 };
  if (/pendant|ceiling/.test(n)) return { ...r, mount: "ceiling", depthBand: 3, layerGroup: "lighting", cutPadding: 0.35, shadowMarginCm: 0, hotspot: [0.5, 0.6], minPx: 64 };
  if (/lamp/.test(n)) return { ...r, depthBand: 3, layerGroup: "lighting", cutPadding: 0.4, hotspot: [0.5, 0.25], minPx: 64 };
  if (kind === "rug" || /^rug/.test(n)) return { ...r, depthBand: 1, layerGroup: "floor", inWallPictures: false, shadowMarginCm: 0 };
  if (/cushion|throw/.test(n)) return { ...r, depthBand: 4, layerGroup: "decor", cutPadding: 0.3, inWallPictures: false, minPx: 48 };
  if (kind === "sofa" || kind === "bed" || /sofa|bed\b/.test(n)) return { ...r, hotspot: [0.5, 0.55], minPx: 160 };
  if (kind === "chair" || kind === "bench" || /chair|bench|stool/.test(n)) return { ...r, depthBand: 3, hotspot: [0.5, 0.55] };
  if (kind === "table" || /table/.test(n)) return { ...r, depthBand: /coffee/.test(n) ? 4 : 3, hotspot: [0.5, 0.35], minPx: /side/.test(n) ? 64 : 112 };
  if (kind === "storage" || kind === "desk" || /shelf|console|sideboard|cabinet|unit|wardrobe|dresser|desk|piano/.test(n)) return { ...r, depthBand: 1, cutPadding: 0.22, hotspot: [0.5, 0.4] };
  return r;
}

/** Which stored layout box a piece of the room is, by its category. */
const SPEC_NAME: Partial<Record<Category, string>> = {
  sofa: "3-seat sofa", chair: "accent chair", table: "coffee table", side: "side table", shelf: "bookshelf", console: "console",
  bed: "bed", dining: "dining table", dchair: "dining chair", desk: "desk", media: "tv unit", wardrobe: "wardrobe", bench: "bench",
  lamp: "floor lamp", rug: "rug", piano: "upright piano",
};

export function specFor(category: Category | "mirror" | "art" | "curtains" | "door" | "surface", name: string, specs: ItemSpec[], shapeName = ""): ItemSpec {
  if (category === "door") return { ...defaultSpec("door"), depthBand: 0, layerGroup: "walls", cutPadding: 0.12, hotspot: [0.5, 0.55] };
  if (category === "surface") return { ...defaultSpec(name), depthBand: -1, layerGroup: name === "floor" ? "floor" : "walls", cutPadding: 0.05, minPx: 0 };
  if (category === "curtains") return { ...defaultSpec("curtains"), mount: "wall", depthBand: 0, layerGroup: "decor", hotspot: [0.5, 0.4] };
  if (category === "mirror" || category === "art") return specs.find((s) => /mirror/.test(s.name) && category === "mirror") ?? defaultSpec(category);
  const want = SPEC_NAME[category as Category];
  const shape = shapeName.toLowerCase();
  const named = specs.filter((s) => want && s.name === want);
  // a curved or corner sofa has its own box
  const special = category === "sofa" ? specs.find((s) => (/curved/.test(shape) && s.name === "curved sofa") || (/\bl\b|corner|l-shape/.test(shape) && s.name === "l-shape sofa")) : undefined;
  return special ?? named[0] ?? defaultSpec(want ?? name, category === "sofa" ? "sofa" : undefined);
}

type SpecRow = { spec_id: string; name: string; kind: string; is_default: boolean; mount: ItemSpec["mount"]; bottom_cm: number; depth_band: number; layer_group: ItemSpec["layerGroup"]; cut_padding: number; shadow_margin_cm: number; hotspot_x: number; hotspot_y: number; min_px: number; in_wall_pictures: boolean };
let cached: Promise<{ specs: ItemSpec[]; presets: CanvasPreset[] }> | null = null;

/** The stored rules (default size of each box first), or the built-in ones when they can't be read. */
export function loadRules() {
  cached ??= (async () => {
    try {
      const [specs, presets] = await Promise.all([
        supabase.from("showroom_item_specs_full").select("*").order("is_default", { ascending: false }),
        supabase.from("showroom_canvas_presets").select("key,label,width_px,height_px").eq("active", true),
      ]);
      return {
        specs: ((specs.data ?? []) as SpecRow[]).map((r) => ({
          specId: r.spec_id, name: r.name, kind: r.kind, mount: r.mount, bottomCm: r.bottom_cm, depthBand: r.depth_band, layerGroup: r.layer_group,
          cutPadding: Number(r.cut_padding), shadowMarginCm: r.shadow_margin_cm, hotspot: [Number(r.hotspot_x), Number(r.hotspot_y)] as [number, number],
          minPx: r.min_px, inWallPictures: r.in_wall_pictures,
        })),
        presets: ((presets.data ?? []) as { key: string; label: string; width_px: number; height_px: number }[]).map((p) => ({ key: p.key, label: p.label, width: p.width_px, height: p.height_px })),
      };
    } catch {
      return { specs: [], presets: [] };
    }
  })();
  return cached.then((r) => ({ specs: r.specs, presets: r.presets.length ? r.presets : PRESETS }));
}

/* ---------- one wall's composition ---------- */

export type CompositionItem = {
  key: string; specId?: string; label: string; layerGroup: ItemSpec["layerGroup"]; depthBand: number; zOrder: number;
  fromCm: number; widthCm: number; bottomCm: number; heightCm: number;
  x: number; y: number; w: number; h: number;
  hotspot: { x: number; y: number };
  cutPadding: number; lowRes: boolean;
};
export type WallComposition = { wall: Wall; canvas: Canvas; items: CompositionItem[] };

/**
 * Every item the guide drew on this wall, placed in centimetres and pixels, ordered back to front
 * (by depth band, then lower pieces in front of higher ones in the same band).
 */
export function composeWall(m: ShowroomModel, wall: Wall, boxes: Record<string, [number, number, number, number]>, canvas: Canvas, specs: ItemSpec[]): WallComposition {
  const found: { key: string; label: string; spec: ItemSpec }[] = [];
  for (const p of m.pieces) if (boxes[p.id]) found.push({ key: p.id, label: p.name, spec: specFor(p.category, p.name, specs, p.shapeName) });
  for (const e of m.extras) if (boxes[e.id]) found.push({ key: e.id, label: e.name, spec: specFor(e.kind === "pendant" ? "lamp" : e.kind, e.name, specs) });
  if (boxes.doors) found.push({ key: "doors", label: "Door", spec: specFor("door", "door", specs) });
  for (const k of ["walls", "floor"]) if (boxes[k]) found.push({ key: k, label: k === "walls" ? "Wall colour" : "Floor", spec: specFor("surface", k, specs) });
  for (const k of Object.keys(boxes)) {
    if (k.startsWith("window-")) found.push({ key: k, label: "Window", spec: { ...specFor("door", "window", specs), hotspot: [0.5, 0.82] } });
    else if (k.startsWith("decor-")) found.push({ key: k, label: "Wall decor", spec: { ...defaultSpec("art"), cutPadding: 0.15 } });
  }
  const items = found.map(({ key, label, spec }) => {
    const [bx, by, bw, bh] = boxes[key];
    const x = Math.round((bx / 100) * canvas.width), y = Math.round((by / 100) * canvas.height);
    const w = Math.round((bw / 100) * canvas.width), h = Math.round((bh / 100) * canvas.height);
    const toCm = (px: number) => Math.round(px / canvas.pxPerCm);
    return {
      key, specId: spec.specId, label, layerGroup: spec.layerGroup, depthBand: spec.depthBand, zOrder: 0,
      fromCm: toCm(x - canvas.wallX), widthCm: toCm(w),
      bottomCm: Math.max(0, toCm(canvas.wallY + canvas.heightCm * canvas.pxPerCm - (y + h))), heightCm: toCm(h),
      x, y, w, h,
      hotspot: { x: Math.round(x + w * spec.hotspot[0]), y: Math.round(y + h * spec.hotspot[1]) },
      cutPadding: spec.cutPadding,
      lowRes: spec.minPx > 0 && Math.min(w, h) < spec.minPx,
    } satisfies CompositionItem;
  });
  // back to front; within a band lower pieces in front, and chairs in front of the table they stand at
  const seat = (it: CompositionItem) => (/chair|stool/i.test(it.label) ? 1 : 0);
  items.sort((a, b) => a.depthBand - b.depthBand || (Math.abs((a.y + a.h) - (b.y + b.h)) > 4 ? (a.y + a.h) - (b.y + b.h) : seat(a) - seat(b)));
  items.forEach((it, i) => { it.zOrder = 10 + i; });
  return { wall, canvas, items };
}

/* ---------- storing it ---------- */

export type ItemAssets = { variations: string[]; thumbnails: string[]; names: string[] };

/** Keep the wall's composition with its layer files (best effort: the picture works without it). */
export async function saveComposition(s: JourneyState, comp: WallComposition, made: { sceneKey: string; guideUrl?: string; background?: string; manifestUrl?: string; assets: Record<string, ItemAssets> }) {
  try {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    const layoutId = s.layouts[s.chosenLayout ?? 0]?.id;
    if (!uid || !layoutId) return;
    const c = comp.canvas;
    const { data, error } = await supabase.from("wall_compositions").upsert({
      user_id: uid, project_id: s.projectId ?? null, room_id: s.roomId ?? null, layout_id: layoutId, wall: comp.wall,
      wall_length_cm: c.lengthCm, wall_height_cm: c.heightCm, preset_key: c.preset, canvas_width_px: c.width, canvas_height_px: c.height,
      px_per_cm: Number(c.pxPerCm.toFixed(3)), wall_x_px: c.wallX, wall_y_px: c.wallY, scene_key: made.sceneKey, status: "ready",
      guide_url: made.guideUrl ?? null, background_url: made.background ?? null, manifest_url: made.manifestUrl ?? null,
      made_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,layout_id,wall" }).select("id").single();
    if (error || !data?.id) return;
    await supabase.from("wall_composition_items").delete().eq("composition_id", data.id);
    const pick = s.showroom?.picks?.[comp.wall] ?? {};
    await supabase.from("wall_composition_items").insert(comp.items.map((it) => {
      const a = made.assets[it.key];
      return {
        composition_id: data.id, item_key: it.key, spec_id: it.specId ?? null, label: it.label, layer_group: it.layerGroup,
        depth_band: Math.max(0, it.depthBand), z_order: it.zOrder, from_cm: it.fromCm, width_cm: it.widthCm, bottom_cm: it.bottomCm, height_cm: it.heightCm,
        x_px: it.x, y_px: it.y, w_px: it.w, h_px: it.h, hotspot_x_px: it.hotspot.x, hotspot_y_px: it.hotspot.y, low_res: it.lowRes,
        variations: a?.variations ?? [], thumbnails: a?.thumbnails ?? [], variation_names: a?.names ?? [],
        picked: pick[it.key.replace(/[^a-zA-Z0-9_-]/g, "-")] ?? 0,
      };
    }));
  } catch {
    /* the journey keeps its own copy */
  }
}
