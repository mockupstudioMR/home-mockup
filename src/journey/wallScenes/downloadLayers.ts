/**
 * Debugging: every layer of every made wall picture, in one ZIP, so a wall can be checked file by file.
 * One folder per picture (wall-A … wall-D, whole-room), each with:
 *   manifest.json                 the Generator PRO manifest as published
 *   00-empty-room.* / 00-photo.*  the background the layers are drawn on, and the photo they were cut from
 *   NN-<layer>/                   one folder per layer, NN = drawing order (01 is drawn first, at the bottom)
 *     1-<option>.webp             the colour image of each option (the piece on black: drawn with lighten)
 *     1-<option>-shadow.webp      that option's own shadow (multiply), or shadow.webp when shared
 *     1-<option>-thumb.jpg        its thumbnail
 *   layers.txt                    the same, as a list: order, blend, options and which shadow each one uses
 *   MISSING.txt                   files that could not be fetched (only if any)
 */
import type { Pic, WallScene } from "./runner";

type Layer = {
  title?: string; order?: number; blend?: string; group?: string;
  variations?: string[]; shadows?: string[]; shadow?: string; thumbnails?: string[]; variationNames?: string[];
  box?: { x: number; y: number; w: number; h: number };
};
type Manifest = { background?: string; photo?: string; imageSize?: { width: number; height: number }; layers?: Record<string, Layer> };

const FOLDER: Record<Pic, string> = { A: "wall-A", B: "wall-B", C: "wall-C", D: "wall-D", room: "whole-room" };
const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "option";
const ext = (url: string, fallback: string) => {
  const m = /\.([a-z0-9]{2,5})(?:$|[?#])/i.exec(url.split("?")[0].split("#")[0]);
  return m ? `.${m[1].toLowerCase()}` : fallback;
};

/** The files of one picture: [path in the ZIP, URL], plus its layers.txt. */
function filesOf(folder: string, m: Manifest, scene: WallScene) {
  const files: [string, string][] = [];
  const lines: string[] = [
    `${folder}  ·  ${scene.status}${scene.at ? `  ·  made ${scene.at}` : ""}`,
    `size ${m.imageSize?.width ?? "?"} × ${m.imageSize?.height ?? "?"}${scene.canvas ? `  ·  canvas ${scene.canvas.preset}, ${scene.canvas.pxPerCm} px/cm` : ""}`,
    "",
    "Drawn bottom to top: the background, then each layer in order. A layer with a shadow: shadow (multiply), then the option (lighten). Without one: the option as a see-through image.",
    "",
  ];
  if (m.background) files.push([`${folder}/00-empty-room${ext(m.background, ".jpg")}`, m.background]);
  if (m.photo && m.photo !== m.background) files.push([`${folder}/00-photo${ext(m.photo, ".jpg")}`, m.photo]);
  const layers = Object.entries(m.layers ?? {}).sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0));
  layers.forEach(([name, l], i) => {
    const dir = `${folder}/${String(i + 1).padStart(2, "0")}-${slug(name)}`;
    const vs = l.variations ?? [];
    lines.push(`${String(i + 1).padStart(2, "0")}  ${l.title ?? name}  (order ${l.order ?? "?"}${l.blend ? `, blend ${l.blend}` : ""}${l.group ? `, ${l.group}` : ""}${l.box ? `, box ${l.box.x},${l.box.y} ${l.box.w}×${l.box.h}` : ""})`);
    if (!vs.length) lines.push("    no options: only a hotspot");
    vs.forEach((v, j) => {
      const label = `${j + 1}-${slug(l.variationNames?.[j] ?? `option ${j + 1}`)}`;
      files.push([`${dir}/${label}${ext(v, ".webp")}`, v]);
      const own = l.shadows?.[j];
      if (own) files.push([`${dir}/${label}-shadow${ext(own, ".webp")}`, own]);
      const th = l.thumbnails?.[j];
      if (th) files.push([`${dir}/${label}-thumb${ext(th, ".jpg")}`, th]);
      lines.push(`    ${label}: ${own ? "own shadow" : l.shadow ? "shared shadow" : "no shadow (see-through)"}${/none\.webp/.test(v) ? "  ·  empty (the room as it is)" : ""}`);
    });
    if (l.shadow && !(l.shadows ?? []).includes(l.shadow)) files.push([`${dir}/shadow${ext(l.shadow, ".webp")}`, l.shadow]);
  });
  return { files, text: lines.join("\n") + "\n" };
}

/**
 * Fetches every layer of every picture that has a manifest and downloads them as one ZIP.
 * Returns how many files went in and which could not be fetched.
 */
export async function downloadWallLayers(scenes: Partial<Record<Pic, WallScene>>, onProgress?: (done: number, total: number) => void) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const jobs: [string, string][] = [];
  const missing: Record<string, string[]> = {};
  for (const pic of Object.keys(FOLDER) as Pic[]) {
    const scene = scenes[pic];
    if (!scene?.manifestUrl) continue;
    const folder = FOLDER[pic];
    try {
      const res = await fetch(scene.manifestUrl);
      if (!res.ok) throw new Error(`${res.status}`);
      const raw = await res.text();
      zip.file(`${folder}/manifest.json`, raw);
      const { files, text } = filesOf(folder, JSON.parse(raw) as Manifest, scene);
      zip.file(`${folder}/layers.txt`, text);
      jobs.push(...files);
    } catch (e) {
      (missing[folder] ??= []).push(`manifest.json  ${scene.manifestUrl}  (${(e as Error).message})`);
    }
  }
  if (!jobs.length && !Object.keys(missing).length) throw new Error("No wall pictures have been made yet.");

  let done = 0, next = 0, added = 0;
  onProgress?.(0, jobs.length);
  await Promise.all(Array.from({ length: Math.min(6, jobs.length) }, async () => {
    while (next < jobs.length) {
      const [path, url] = jobs[next++];
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${res.status}`);
        // pictures are already compressed: stored as they are
        zip.file(path, await res.arrayBuffer(), { compression: "STORE" });
        added++;
      } catch (e) {
        (missing[path.split("/")[0]] ??= []).push(`${path}  ${url}  (${(e as Error).message})`);
      }
      onProgress?.(++done, jobs.length);
    }
  }));
  for (const [folder, list] of Object.entries(missing)) zip.file(`${folder}/MISSING.txt`, list.join("\n") + "\n");

  const blob = await zip.generateAsync({ type: "blob" });
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `room-layers-${stamp}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  return { files: added, missing: Object.values(missing).flat() };
}
