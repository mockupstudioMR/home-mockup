/**
 * Sizes printed on a floor plan. Rule: a number written on the plan always beats an estimate (door scale,
 * proportions, AI guess); only what isn't written is estimated.
 *
 * The AI copies the printed text exactly ("3,75", "375", "12'3\"", "14.2 m²") and this file turns it into metres,
 * so unit handling is deterministic rather than left to the model. Plain TS, no Deno APIs: used by the edge functions
 * and by the app (and its tests).
 */

/** A room side in metres must be between these to be believable. */
const MIN_M = 0.5;
const MAX_M = 30;

const ok = (m: number) => Number.isFinite(m) && m >= MIN_M && m <= MAX_M;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** "3,75" → 3.75; "1.234,5" → 1234.5; "4 900" → 4900. */
function toNumber(t: string): number {
  let s = t.trim().replace(/\s+/g, "");
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "").replace(",", "."); // 1.234,5
  else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, ""); // 1,234.5
  else s = s.replace(",", ".");
  return Number(s);
}

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
/** German/Austrian plans print centimetres raised after the metres: "3⁷⁵" = 3.75 m. */
const supToDecimal = (t: string) => t.replace(/(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (_, m: string, sup: string) => `${m}.${[...sup].map((c) => SUP.indexOf(c)).join("")}`);

/** Words printed before a size: "ca. 3,75", "L = 3,75", "Breite: 4,90 m", "approx. 12 ft". */
const LABEL = /^(?:(?:ca|circa|approx|approximately|about|appr|etwa|rd|~|≈|±)\.?\s*)?(?:(?:length|width|depth|länge|laenge|breite|tiefe|lichte?\s*(?:weite|breite|länge)?|wall|wand|seite|side|len|lw|(?:l|b|w|d|t)(?=\s*[:=]|\s+\d+[.,]\d))\s*[:=]?\s*)?(?:(?:ca|circa|approx|etwa)\.?\s*)?/;
/** A height isn't a room side: "H 2,50", "RH 2,60", "BRH 0,90", "Höhe 2,50". */
const HEIGHT = /^(?:h|rh|brh|stuh|sth|höhe|hoehe|height|ceiling|raumhöhe)\s*[:=.]?\s*\d/;

/**
 * One printed length in metres, or undefined when it can't be a room side.
 * Units printed win; without a unit the size decides: ≤ 30 metres, ≤ 3000 centimetres, ≤ 30000 millimetres.
 * A chain of segments along one wall ("1,20 + 2,55", "1,20 2,55") is added up.
 */
export function parseLength(text: unknown, unitHint?: string): number | undefined {
  if (typeof text === "number") return parseLength(String(text), unitHint);
  if (typeof text !== "string" || !text.trim()) return undefined;
  let t = supToDecimal(text).toLowerCase().replace(/[’′]/g, "'").replace(/[”″]/g, '"').replace(/\s+/g, " ").trim();
  if (HEIGHT.test(t)) return undefined;
  t = t.replace(LABEL, "").trim();
  // two sizes in one label ("3,75 x 4,90") aren't one length; readWritten reads them as a pair
  if (/\d\s*(?:mm|cm|m)?\s*(?:x|×|\*)\s*\d/.test(t)) return undefined;
  // only numbers and units: "D1", "WC 2" or "Bad" aren't sizes
  if (/[a-z]/.test(t.replace(/(mm|cm|meters?|metres?|m|ft|feet|inch(es)?|in)(?![a-z])/g, ""))) return undefined;
  // a dimension chain: segments joined by "+" add up to the wall
  const parts = t.split(/\s*\+\s*/).filter(Boolean);
  if (parts.length > 1) {
    const unit = /(mm|cm|m)\s*$/.exec(t)?.[1] ?? unitHint;
    const sides = parts.map((p) => parseSingle(p, unit, true));
    if (sides.some((x) => x == null)) return undefined;
    const sum = sides.reduce((a, b) => a! + b!, 0)!;
    return ok(sum) ? r2(sum) : undefined;
  }
  // several decimal sizes side by side ("1,20 2,55") could be a chain or two walls: don't guess
  if (/\d[.,]\d+\s*(?:mm|cm|m)?\s+\d+[.,]\d/.test(t)) return undefined;
  return parseSingle(t, unitHint);
}

/** One number with an optional unit. A segment of a chain may be shorter than a room side. */
function parseSingle(t: string, unitHint?: string, segment = false): number | undefined {
  const fits = (m: number) => (segment ? Number.isFinite(m) && m > 0 && m <= MAX_M : ok(m));
  // feet and inches: 12'3", 12' 3", 12'-6", 12 ft 3 in
  const ft = /(\d+(?:[.,]\d+)?)\s*(?:'|ft|feet)\s*-?\s*(?:(\d+(?:[.,]\d+)?)\s*(?:"|in|inch(?:es)?)?)?/.exec(t);
  if (ft) {
    const m = toNumber(ft[1]) * 0.3048 + (ft[2] ? toNumber(ft[2]) * 0.0254 : 0);
    return fits(m) ? r2(m) : undefined;
  }
  const m = /(\d[\d.,\s]*\d|\d)\s*(mm|cm|m(?![²2])|meter|metre)?/.exec(t);
  if (!m) return undefined;
  const v = toNumber(m[1]);
  if (!Number.isFinite(v) || v <= 0) return undefined;
  const unit = (m[2] ?? unitHint ?? "").toLowerCase();
  let metres: number;
  if (unit === "mm") metres = v / 1000;
  else if (unit === "cm") metres = v / 100;
  else if (unit.startsWith("m")) metres = v;
  else metres = v <= MAX_M ? v : v <= 3000 ? v / 100 : v / 1000;
  return fits(metres) ? (segment ? Math.round(metres * 1000) / 1000 : r2(metres)) : undefined;
}

/** A printed area in m² ("14,2 m²", "14.2 sqm", "14.2"), or undefined. */
export function parseArea(text: unknown): number | undefined {
  if (typeof text === "number") return text > 1 && text < 900 ? r2(text) : undefined;
  if (typeof text !== "string" || !text.trim()) return undefined;
  const t = text.toLowerCase();
  const sqft = /(\d[\d.,]*)\s*(sq\.?\s*ft|ft²|ft2)/.exec(t);
  if (sqft) {
    const a = toNumber(sqft[1]) * 0.092903;
    return a > 1 && a < 900 ? r2(a) : undefined;
  }
  const m = /(\d[\d.,]*)/.exec(t);
  if (!m) return undefined;
  const a = toNumber(m[1]);
  return a > 1 && a < 900 ? r2(a) : undefined;
}

/** "3,75 x 4,90" / "375/490" / "3.75 × 4.90 m" → both sides, in the order printed. */
export function parsePair(text: unknown, unitHint?: string): [number, number] | undefined {
  if (typeof text !== "string") return undefined;
  // "3,75 x 4,90 = 18,38 m²": the area after "=" isn't a side
  const parts = text.split("=")[0].split(/\s*(?:×|\*|\/|(?<![a-ln-wyz])x(?![a-z])|\bby\b)\s*/i).filter(Boolean);
  if (parts.length !== 2) return undefined;
  // a unit written once at the end applies to both ("3,75 x 4,90 m")
  const unit = /(mm|cm|m)\s*$/i.exec(parts[1])?.[1] ?? unitHint;
  const a = parseLength(parts[0], unit), b = parseLength(parts[1], unit);
  return a && b ? [a, b] : undefined;
}

/** What the AI copied from the plan for one room. Every field optional: only what is printed. */
export type WrittenText = {
  /** The horizontal size as printed, e.g. "3,75". */
  width_text?: string | null;
  /** The vertical size as printed. */
  length_text?: string | null;
  /** Both sides in one label, e.g. "3.75 x 4.90". */
  pair_text?: string | null;
  /** The printed floor area, e.g. "18,4 m²". */
  area_text?: string | null;
  /** The unit the plan says it uses ("cm", "mm", "m"), when stated in a legend or title block. */
  unit?: string | null;
};
export type Written = { width?: number; length?: number; area?: number };

/** Turns the copied text into metres. A pair label fills sides that weren't printed on their own. */
export function readWritten(w: WrittenText | null | undefined): Written {
  if (!w) return {};
  const unit = w.unit ?? undefined;
  // a label with both sizes is sometimes copied into a single side's field
  const pair = parsePair(w.pair_text ?? undefined, unit) ?? parsePair(w.width_text ?? undefined, unit) ?? parsePair(w.length_text ?? undefined, unit);
  const out: Written = {
    width: parseLength(w.width_text, unit) ?? pair?.[0],
    length: parseLength(w.length_text, unit) ?? pair?.[1],
    area: parseArea(w.area_text),
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v != null)) as Written;
}

export type SizeSource = "written" | "estimated" | "from area";

/**
 * The room size: printed numbers first, the estimate for the rest.
 * - both sides printed → both used (swapped if the estimate's proportions clearly say the label is turned)
 * - one side printed → the other from the printed area, or from the estimate's proportions
 * - only the area printed → the estimate scaled to that area
 */
export function mergeSize(written: Written, estimate: { width: number; length: number }): { width: number; length: number; source: { width: SizeSource; length: SizeSource } } {
  const { width: ew, length: el } = estimate;
  const ratio = ew > 0 && el > 0 ? ew / el : undefined;
  let { width: w, length: l } = written;
  const area = written.area;
  if (w && l) {
    if (ratio) {
      const asIs = Math.abs(Math.log(w / l / ratio)), turned = Math.abs(Math.log(l / w / ratio));
      if (turned + 0.25 < asIs) [w, l] = [l, w];
    }
    return { width: w, length: l, source: { width: "written", length: "written" } };
  }
  if (w) {
    const other = area ? area / w : ratio ? w / ratio : el;
    return { width: w, length: r2(other), source: { width: "written", length: area ? "from area" : "estimated" } };
  }
  if (l) {
    const other = area ? area / l : ratio ? l * ratio : ew;
    return { width: r2(other), length: l, source: { width: area ? "from area" : "estimated", length: "written" } };
  }
  if (area && ew > 0 && el > 0) {
    const k = Math.sqrt(area / (ew * el));
    return { width: r2(ew * k), length: r2(el * k), source: { width: "from area", length: "from area" } };
  }
  return { width: r2(ew), length: r2(el), source: { width: "estimated", length: "estimated" } };
}

/** JSON-schema properties for asking a model to copy printed sizes (shared by the plan functions). */
export const WRITTEN_SCHEMA = {
  type: "object",
  properties: {
    width_text: { type: "string", description: "The room's horizontal size exactly as printed on the plan, or empty" },
    length_text: { type: "string", description: "The room's vertical size exactly as printed on the plan, or empty" },
    pair_text: { type: "string", description: "A label giving both sizes, e.g. '3,75 x 4,90', exactly as printed, or empty" },
    area_text: { type: "string", description: "The room's floor area exactly as printed, e.g. '18,4 m²', or empty" },
    unit: { type: "string", description: "The unit the plan states it uses (m, cm, mm), or empty" },
  },
} as const;

/** Prompt text explaining how to copy printed sizes. */
export const WRITTEN_RULES = `PRINTED SIZES (most important — numbers on the plan always beat estimates):
- Look carefully for every number printed on or next to the room: dimension lines with ticks or arrows along its walls, labels inside the room such as "3,75 x 4,90", "375/490" or "3.75 × 4.90", single numbers along one wall, and the floor area such as "18,4 m²".
- Copy each one EXACTLY as printed (keep commas, units, raised digits and words like "ca."; don't convert or round): width_text = the size along the horizontal walls as the plan is drawn, length_text = the size along the vertical walls, pair_text = a label with both, area_text = the printed area, unit = the unit stated in a legend or title block.
- Sizes along vertical walls are often printed rotated 90°; read them too. Small raised digits after a number are centimetres ("3⁷⁵" = 3,75): copy them as raised digits.
- When a wall has one overall dimension line, copy that. When it only has a chain of segments, copy every segment joined with " + " (e.g. "1,20 + 2,55"). Ignore heights (H, RH, BRH, Höhe) and the sizes of doors and windows.
- Leave a field empty when nothing is printed for it. Never invent a number, and don't copy sizes of other rooms, the whole flat, furniture, doors or windows.`;

/** One room's printed sizes and where the room sits on the plan image (its centre, 0–100 % of width and height). */
export type PrintedRoom = WrittenText & { name?: string | null; x_pct?: number | null; y_pct?: number | null };

/** JSON schema for copying the printed sizes of every room, with each room's position. */
export const PRINTED_ROOMS_SCHEMA = {
  type: "object",
  properties: {
    unit: WRITTEN_SCHEMA.properties.unit,
    rooms: {
      type: "array",
      description: "Every room on the plan that has sizes printed for it",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "The room's printed name, e.g. 'Wohnen', 'Bedroom 2', or empty" },
          x_pct: { type: "number", description: "Horizontal position of the room's centre, 0 = left edge of the image, 100 = right edge" },
          y_pct: { type: "number", description: "Vertical position of the room's centre, 0 = top edge of the image, 100 = bottom edge" },
          ...WRITTEN_SCHEMA.properties,
        },
        required: ["x_pct", "y_pct"],
      },
    },
  },
  required: ["rooms"],
} as const;

/**
 * The printed sizes of the room inside `box` ([x0, y0, x1, y1], 0–1 of the plan): the printed room whose centre lies
 * in the box (nearest the box centre when several do). Without a box: the room with the largest printed size.
 * Undefined when no printed room lies in the box, so another room's numbers are never used.
 */
export function pickPrinted(rooms: PrintedRoom[] | null | undefined, box?: readonly number[] | null, unit?: string | null): WrittenText | undefined {
  const withText = (rooms ?? []).filter((r) => r && (r.width_text || r.length_text || r.pair_text || r.area_text));
  if (!withText.length) return undefined;
  const at = (r: PrintedRoom) => [Number(r.x_pct) / 100, Number(r.y_pct) / 100] as const;
  let room: PrintedRoom | undefined;
  if (box && box.length === 4) {
    const [x0, y0, x1, y1] = box, pad = 0.03, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const inside = withText.filter((r) => {
      const [x, y] = at(r);
      return Number.isFinite(x) && Number.isFinite(y) && x >= x0 - pad && x <= x1 + pad && y >= y0 - pad && y <= y1 + pad;
    });
    room = inside.sort((a, b) => Math.hypot(at(a)[0] - cx, at(a)[1] - cy) - Math.hypot(at(b)[0] - cx, at(b)[1] - cy))[0];
  } else {
    const size = (r: PrintedRoom) => {
      const w = readWritten({ ...r, unit: r.unit ?? unit });
      return w.area ?? ((w.width ?? 0) * (w.length ?? 0) || (w.width ?? w.length ?? 0));
    };
    room = [...withText].sort((a, b) => size(b) - size(a))[0];
  }
  if (!room) return undefined;
  const { width_text, length_text, pair_text, area_text } = room;
  return { width_text, length_text, pair_text, area_text, unit: room.unit ?? unit ?? undefined };
}
