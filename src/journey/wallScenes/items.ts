/**
 * What can be swapped on each wall picture, and its two alternatives.
 * Every item comes from the person's own room (showroom3d/model.ts): its main option is what their preview
 * and moodboard gave it; its alternatives are a real product they picked from their own shop on this wall
 * (step 5), and otherwise options in their moodboard's palette.
 */
import type { JourneyState, Wall } from "../state";
import { LIBRARY, type Category } from "../showroom3d/library";
import { hsl, seenOn, type ShowroomModel } from "../showroom3d/model";

export type Alt = { name: string; target: string; productImageUrl?: string; productId?: string };
export type WallItem = {
  id: string;
  title: string;
  group: "furniture" | "walls" | "floor" | "lighting" | "decor";
  /** What it is now, in words the image AI can find in the picture. */
  current: string;
  /** The name of the main option, as shown in the picker. */
  mainName: string;
  alts: Alt[];
  /** Shown instead of options when the item can't be swapped (a piece being kept, say); it stays clickable. */
  note?: string;
};

const NOUN: Record<Category, string> = {
  sofa: "sofa", chair: "lounge chair", table: "coffee table", side: "side table", shelf: "shelving unit", console: "console table",
  bed: "bed", dining: "dining table", dchair: "dining chair", desk: "desk", media: "media unit", wardrobe: "wardrobe", bench: "bench",
  lamp: "floor lamp", plant: "plant", rug: "rug", piano: "piano", other: "piece of furniture",
};
const GROUP: Partial<Record<Category, WallItem["group"]>> = { lamp: "lighting", plant: "decor", rug: "decor" };

const sameHex = (a: string, b: string) => a.toUpperCase() === b.toUpperCase();
/** A colour's name from the moodboard, or its value when it isn't one of them. */
export const colourName = (m: ShowroomModel, hex: string) => m.palette.find((p) => sameHex(p.hex, hex))?.name.toLowerCase() ?? hex.toUpperCase();

/** Two other moodboard colours for an item, the most different from its own first; never the wall colour on furniture. */
function otherColours(m: ShowroomModel, hex: string, avoidWall: boolean): string[] {
  const me = hsl(hex);
  return m.palette
    .filter((p) => !sameHex(p.hex, hex) && !(avoidWall && sameHex(p.hex, m.surfaces.wall)))
    .map((p) => { const c = hsl(p.hex); return { hex: p.hex, d: Math.abs(c.l - me.l) + Math.min(Math.abs(c.h - me.h), 360 - Math.abs(c.h - me.h)) / 180 + c.c }; })
    .sort((a, b) => b.d - a.d)
    .map((x) => x.hex);
}

/** The products the person picked for this wall in step 5 (with a photo), by the layout piece they stand for. */
function productsOn(s: JourneyState, wall: Wall) {
  const out = new Map<string, Alt[]>();
  for (const it of s.walls[wall]?.items ?? []) {
    if (!it.choice?.image || !/^https:\/\//.test(it.choice.image)) continue;
    const key = it.ref ?? `name:${it.name.toLowerCase()}`;
    out.set(key, [...(out.get(key) ?? []), { name: it.choice.name, target: it.choice.name, productImageUrl: it.choice.image, productId: it.choice.productId }]);
  }
  return out;
}

const two = (picked: Alt[], ai: Alt[]) => [...picked, ...ai].slice(0, 2);

/** The swappable items of one wall, in drawing order (surfaces first, then furniture, then decor). */
export function wallItems(s: JourneyState, m: ShowroomModel, wall: Wall): WallItem[] {
  const items: WallItem[] = [];
  const products = productsOn(s, wall);
  const wallName = colourName(m, m.surfaces.wall);
  const [w1, w2] = otherColours(m, m.surfaces.wall, false);
  items.push({
    id: "walls", title: "Wall colour", group: "walls", current: `${wallName} painted wall surface (only the paint, not the furniture, doors or windows)`, mainName: `${wallName[0].toUpperCase()}${wallName.slice(1)}`,
    alts: [
      { name: "A shade lighter", target: `the same wall painted a lighter, softer tone of ${wallName}, matt limewash finish` },
      { name: w2 ? `${colourName(m, w2)} feature wall` : "Deeper tone", target: w2 ? `the wall painted ${colourName(m, w2)} (${w2}), matt finish` : `the same wall painted a deeper tone of ${wallName}` },
    ].filter(Boolean),
  });
  const wood = colourName(m, m.surfaces.floor);
  items.push({
    id: "floor", title: "Floor", group: "floor", current: `${wood} wooden floor`, mainName: `${wood[0].toUpperCase()}${wood.slice(1)} planks`,
    alts: [
      { name: "Herringbone parquet", target: `a herringbone wood parquet floor in a ${wood} tone` },
      { name: "Light oak planks", target: "light natural oak wide-plank floor, matt oiled" },
    ],
  });
  const door = m.openings.find((o) => o.wall === wall && o.kind === "door");
  if (door) {
    const dn = colourName(m, m.surfaces.door), [d1] = otherColours(m, m.surfaces.door, false);
    items.push({
      id: "doors", title: door.arched ? "Arched doorway" : "Door", group: "walls", current: `${dn} ${door.arched ? "arched doorway and its door" : "door and its frame"}`, mainName: dn[0].toUpperCase() + dn.slice(1),
      alts: [
        ...(d1 ? [{ name: colourName(m, d1)[0].toUpperCase() + colourName(m, d1).slice(1), target: `the same ${door.arched ? "arched doorway and door" : "door and frame"} painted ${colourName(m, d1)} (${d1}), satin finish` }] : []),
        { name: "Natural wood", target: `the same ${door.arched ? "arched door" : "door"} in natural ${wood} wood with a satin finish` },
      ],
    });
  }

  // windows: their frames
  for (const o of m.openings.filter((x) => x.wall === wall && x.kind === "window")) {
    const wd = colourName(m, m.surfaces.wood);
    items.push({
      id: `window-${o.id}`, title: "Window", group: "walls", current: "white window frame and sill (keep the glass and the view)", mainName: "White frames",
      alts: [
        { name: "Black metal frames", target: "the same window with slim black metal frames and sill, the same glass and view" },
        { name: `${wd[0].toUpperCase()}${wd.slice(1)} wood frames`, target: `the same window with natural ${wd} wood frames and sill, the same glass and view` },
      ],
    });
  }

  for (const p of m.pieces) {
    if (!seenOn(p, wall)) continue;
    if (p.kept || p.category === "piano") {
      // still clickable: it's theirs, so it stays as it is
      items.push({ id: p.id, title: p.name, group: GROUP[p.category] ?? "furniture", current: p.name, mainName: p.kept ? "Yours" : p.shapeName, alts: [], note: p.kept ? "Yours, kept as it is." : "Stays as it is." });
      continue;
    }
    const noun = NOUN[p.category], cn = colourName(m, p.color), mat = p.fabric ? ` ${p.fabric}` : "";
    const shapes = LIBRARY[p.category].filter((x) => x.id !== p.shape);
    const [c1] = otherColours(m, p.color, true);
    const ai: Alt[] = [];
    if (c1) ai.push({ name: `${colourName(m, c1)[0].toUpperCase()}${colourName(m, c1).slice(1)}${mat}`, target: `the same ${p.shapeName.toLowerCase()} ${noun} in ${colourName(m, c1)} (${c1})${mat}` });
    if (shapes[0]) ai.push({ name: shapes[0].name, target: `a ${shapes[0].name.toLowerCase()} ${noun} (${shapes[0].note.toLowerCase()}) in ${cn}${mat}, the same size` });
    if (ai.length < 2 && shapes[1]) ai.push({ name: shapes[1].name, target: `a ${shapes[1].name.toLowerCase()} ${noun} in ${cn}${mat}, the same size` });
    const picked = products.get(p.id) ?? products.get(`name:${p.name.toLowerCase()}`) ?? [];
    items.push({
      id: p.id, title: p.name, group: GROUP[p.category] ?? "furniture",
      current: `${cn}${mat} ${p.shapeName.toLowerCase()} ${noun}`, mainName: `${p.shapeName} · ${cn}`,
      alts: two(picked, ai),
    });
  }

  // the wall above the main low piece: bare, or a painting, or shelves
  if (!m.extras.some((e) => e.wall === wall && (e.kind === "art" || e.kind === "mirror"))) {
    const main = m.pieces.filter((p) => seenOn(p, wall) && p.onWall && p.h < 1.4 && p.category !== "rug").sort((a, b) => b.w - a.w)[0];
    if (main) {
      const accent = colourName(m, m.surfaces.accent), wd = colourName(m, m.surfaces.wood);
      items.push({
        id: `decor-${wall}`, title: "Wall decor", group: "decor", current: `the empty wall area above the ${main.name.toLowerCase()}`, mainName: "Bare wall",
        alts: [
          { name: "Large painting", target: `one large framed abstract painting in ${accent} and soft neutral tones, hung centred in this area, its frame fully inside it` },
          { name: "Floating shelves", target: `two floating ${wd} wood shelves styled with a few books, ceramics and a small trailing plant, centred in this area` },
        ],
      });
    }
  }

  for (const e of m.extras) {
    if (e.wall !== wall || e.kind === "pendant") continue;
    const cn = colourName(m, e.color), [c1] = otherColours(m, e.color, true), metal = colourName(m, m.surfaces.metal);
    const ai: Alt[] =
      e.kind === "curtains" ? [
        ...(c1 ? [{ name: `${colourName(m, c1)[0].toUpperCase()}${colourName(m, c1).slice(1)} curtains`, target: `floor-length curtains in ${colourName(m, c1)} (${c1}) velvet, same rod and length` }] : []),
        { name: "Sheer linen", target: "light sheer off-white linen curtains, same rod and length" },
      ] : e.kind === "mirror" ? [
        { name: "Arched mirror", target: `an arched mirror with a slim ${metal} frame, the same height` },
        { name: "Wood-framed round", target: `a round mirror with a wide ${colourName(m, m.surfaces.wood)} wood frame, the same size` },
      ] : [
        { name: "Large painting", target: `one large abstract canvas in ${colourName(m, m.surfaces.accent)} and ${metal} tones, in the same space` },
        { name: "Floating shelves", target: `two floating ${colourName(m, m.surfaces.wood)} wood shelves styled with books and ceramics, in the same space` },
      ];
    const picked = products.get(`name:${e.name.toLowerCase()}`) ?? [];
    items.push({ id: e.id, title: e.name, group: "decor", current: e.kind === "curtains" ? `${cn} curtains` : e.kind === "mirror" ? `${metal} framed mirror` : "artwork on the wall", mainName: "From your preview", alts: two(picked, ai) });
  }
  return items.filter((it) => it.alts.length > 0 || it.note);
}
