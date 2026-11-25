/**
 * Outlines of named things on a photo, from the segment-photo function (Gemini segmentation), as full-size
 * 0–1 masks lined up with the photo. Best effort: a thing the model didn't find has no mask.
 */
import { invokeAi } from "@/lib/invokeAi";

export type Masks = Record<string, Float32Array>;

function img(src: string) {
  return new Promise<HTMLImageElement>((ok, no) => {
    const i = new Image(); i.crossOrigin = "anonymous";
    i.onload = () => ok(i); i.onerror = () => no(new Error("mask")); i.src = src;
  });
}

export async function segmentPhoto(imageUrl: string, items: { key: string; name: string }[], width: number, height: number): Promise<Masks> {
  const out: Masks = {};
  // a few things per call: the model outlines a short list more carefully
  for (let i = 0; i < items.length; i += 8) {
    const part = items.slice(i, i + 8);
    let masks: { key: string; box: number[]; mask: string }[] = [];
    for (let attempt = 1; attempt <= 2 && !masks.length; attempt++) {
      const { data } = await invokeAi<{ masks?: { key: string; box: number[]; mask: string }[] }>("segment-photo", { body: { imageUrl, items: part }, timeoutMs: 100_000 });
      masks = data?.masks ?? [];
    }
    const c = document.createElement("canvas"); c.width = width; c.height = height;
    const g = c.getContext("2d", { willReadFrequently: true })!;
    for (const m of masks) {
      const [y0, x0, y1, x1] = m.box.map((v) => v / 1000);
      const bx = Math.round(x0 * width), by = Math.round(y0 * height), bw = Math.max(1, Math.round((x1 - x0) * width)), bh = Math.max(1, Math.round((y1 - y0) * height));
      try {
        const im = await img(m.mask);
        g.clearRect(0, 0, width, height);
        g.drawImage(im, bx, by, bw, bh);
        const d = g.getImageData(0, 0, width, height).data;
        const a = out[m.key] ?? new Float32Array(width * height);
        for (let p = 0; p < a.length; p++) { const v = d[p * 4] / 255; if (d[p * 4 + 3] > 0 && v > a[p]) a[p] = v; }
        out[m.key] = a;
      } catch { /* a broken mask: that thing stays without one */ }
    }
  }
  return out;
}

/** Where any of the masks covers, a little wider: a see-through edit mask (PNG data address) for the AI. */
export function editMaskFrom(masks: Float32Array[], width: number, height: number, grow: number): string {
  const on = new Uint8Array(width * height);
  for (const m of masks) for (let p = 0; p < on.length; p++) if (m[p] >= 0.5) on[p] = 1;
  // grow by a square of `grow` pixels (two passes)
  const tmp = new Uint8Array(on.length), all = new Uint8Array(on.length);
  for (let y = 0; y < height; y++) { let last = -1e9; for (let x = 0; x < width; x++) { if (on[y * width + x]) last = x; if (x - last <= grow) tmp[y * width + x] = 1; } last = 1e9; for (let x = width - 1; x >= 0; x--) { if (on[y * width + x]) last = x; if (last - x <= grow) tmp[y * width + x] = 1; } }
  for (let x = 0; x < width; x++) { let last = -1e9; for (let y = 0; y < height; y++) { if (tmp[y * width + x]) last = y; if (y - last <= grow) all[y * width + x] = 1; } last = 1e9; for (let y = height - 1; y >= 0; y--) { if (tmp[y * width + x]) last = y; if (last - y <= grow) all[y * width + x] = 1; } }
  const c = document.createElement("canvas"); c.width = width; c.height = height;
  const g = c.getContext("2d")!, im = g.createImageData(width, height);
  for (let p = 0; p < all.length; p++) im.data[p * 4 + 3] = all[p] ? 0 : 255;
  g.putImageData(im, 0, 0);
  return c.toDataURL("image/png");
}
