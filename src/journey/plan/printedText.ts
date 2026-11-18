/**
 * Sizes printed on an uploaded floor plan, read in the browser with text recognition (Tesseract), so they don't
 * depend on the AI edge function. Each piece of text keeps where it is on the plan (0–1), so the sizes of the room
 * being drawn can be picked: numbers inside the room (area, "3,75 x 4,90"), dimension lines above or below it
 * (its width) and to its left or right (its length, usually printed sideways, read on a turned copy of the plan).
 */
import { parseArea, parseLength, parsePair, type WrittenText } from "../../../supabase/functions/_shared/dimensions";

/**
 * Text shaped like a printed size: metres with decimals ("4.83", "3,75 m"), centimetres or millimetres ("375",
 * "4900 mm"), feet and inches (12'6"), or a chain of them joined with "+". Not a lone digit or digits with junk.
 */
export function isDimension(text: string): boolean {
  const one = String.raw`(?:ca\.?\s*)?(?:\d{1,2}[.,]\d{1,3}(?:\s*m)?|\d{3,5}(?:\s*(?:cm|mm))?|\d{1,4}\s*(?:m|cm|mm)|\d{1,2}\s*['′]\s*-?\s*(?:\d{1,2}\s*["″]?)?)`;
  return new RegExp(`^\\s*${one}(?:\\s*\\+\\s*${one})*\\s*$`, "i").test(text.trim());
}

/** One line of text found on the plan; x0..y1 are 0–1 of the plan image. */
export type PlanText = { text: string; x0: number; y0: number; x1: number; y1: number; conf: number; turned?: boolean };

const TESS = "https://cdn.jsdelivr.net/npm/";
const LANG_PATH = `${TESS}@tesseract.js-data/eng@1.0.0/4.0.0_best_int`;

/** Small plans are enlarged so printed sizes are big enough to read. */
const MIN_LONG_SIDE = 2000;

async function canvasOf(image: Blob, turn: boolean): Promise<{ canvas: HTMLCanvasElement; w: number; h: number }> {
  const bmp = await createImageBitmap(image);
  const k = Math.max(1, Math.min(3, MIN_LONG_SIDE / Math.max(bmp.width, bmp.height)));
  const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
  const canvas = document.createElement("canvas");
  canvas.width = turn ? h : w;
  canvas.height = turn ? w : h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (turn) {
    // a quarter turn clockwise: text printed bottom-to-top along a vertical wall becomes horizontal
    ctx.translate(h, 0);
    ctx.rotate(Math.PI / 2);
  }
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close?.();
  return { canvas, w: canvas.width, h: canvas.height };
}

type TessLine = { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } };

/** Every line of text on the plan, read upright and on a quarter-turned copy. */
export async function readPlanText(image: Blob): Promise<PlanText[]> {
  const { createWorker, PSM } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, { langPath: LANG_PATH });
  try {
    // sparse text: plans are drawings with scattered labels, not paragraphs
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    const out: PlanText[] = [];
    for (const turn of [false, true]) {
      const { canvas, w, h } = await canvasOf(image, turn);
      const { data } = await worker.recognize(canvas, {}, { blocks: true });
      const lines: TessLine[] = (data.blocks ?? []).flatMap((b: { paragraphs: { lines: TessLine[] }[] }) => b.paragraphs.flatMap((p) => p.lines));
      for (const l of lines) {
        const text = l.text.trim();
        if (!/\d/.test(text)) continue;
        const { x0, y0, x1, y1 } = l.bbox;
        if (!turn) out.push({ text, x0: x0 / w, y0: y0 / h, x1: x1 / w, y1: y1 / h, conf: l.confidence });
        // back from the turned copy: x = y' / h', y = 1 − x' / w'
        else out.push({ text, x0: y0 / h, x1: y1 / h, y0: 1 - x1 / w, y1: 1 - x0 / w, conf: l.confidence, turned: true });
      }
    }
    return out;
  } finally {
    await worker.terminate();
  }
}

/**
 * The sizes printed for the room inside `box` ([x0, y0, x1, y1], 0–1): an area or a size pair printed inside it,
 * the nearest dimension above or below it across its width, the nearest one to its left or right along its height.
 */
export function printedForBox(texts: PlanText[] | undefined, box: readonly number[] | undefined): WrittenText | undefined {
  if (!texts?.length || !box || box.length !== 4) return undefined;
  const [bx0, by0, bx1, by1] = box;
  const bw = bx1 - bx0, bh = by1 - by0;
  const good = texts.filter((t) => t.conf >= 50);
  const cx = (t: PlanText) => (t.x0 + t.x1) / 2, cy = (t: PlanText) => (t.y0 + t.y1) / 2;
  const inside = good.filter((t) => cx(t) > bx0 && cx(t) < bx1 && cy(t) > by0 && cy(t) < by1);

  const isArea = (t: string) => /m\s*[²2]|qm|sq\s*m|sqm|sq\.?\s*ft|ft²/i.test(t);
  const area = inside.find((t) => !t.turned && isArea(t.text) && parseArea(t.text));
  const pair = inside.find((t) => !t.turned && !isArea(t.text) && parsePair(t.text));

  // a dimension: a single length, outside the room, beside the wall it measures. Wall hatching and door swings
  // read as stray digits ("7", "2,"), so only text shaped like a printed size counts, read with good confidence.
  const lengthOnly = (t: PlanText) => t.conf >= (t.turned ? 75 : 60) && isDimension(t.text) && parseLength(t.text) != null;
  // dimension lines sit a little away from the wall; text right on the wall is its hatching read as digits
  const OFF_WALL = 0.02;
  const across = good
    .filter((t) => !t.turned && lengthOnly(t) && cx(t) > bx0 - 0.1 * bw && cx(t) < bx1 + 0.1 * bw && (cy(t) < by0 || cy(t) > by1))
    .map((t) => ({ t, d: cy(t) < by0 ? by0 - cy(t) : cy(t) - by1 }))
    .filter((c) => c.d > OFF_WALL && c.d < Math.max(0.25, 0.6 * bh))
    .sort((a, b) => a.d - b.d)[0]?.t;
  const along = good
    .filter((t) => lengthOnly(t) && cy(t) > by0 - 0.1 * bh && cy(t) < by1 + 0.1 * bh && (cx(t) < bx0 || cx(t) > bx1))
    // text printed sideways reads along the wall: taller than wide on the plan
    .filter((t) => t.turned || t.y1 - t.y0 > t.x1 - t.x0)
    .map((t) => ({ t, d: cx(t) < bx0 ? bx0 - cx(t) : cx(t) - bx1 }))
    .filter((c) => c.d > OFF_WALL && c.d < Math.max(0.25, 0.6 * bw))
    .sort((a, b) => a.d - b.d)[0]?.t;

  const out: WrittenText = {
    width_text: across?.text,
    length_text: along?.text,
    pair_text: pair?.text,
    area_text: area?.text,
  };
  return Object.values(out).some(Boolean) ? out : undefined;
}
