/**
 * The showroom's furniture shape library: every shape the 3D room can draw, by category.
 * A piece from the layout is matched to the closest shape here from the words used to describe it
 * (the preview read-out, the piece's label, the anchor chosen in step 5).
 */

export type Category =
  | "sofa" | "chair" | "table" | "side" | "shelf" | "console" | "bed" | "dining" | "dchair" | "desk"
  | "media" | "wardrobe" | "bench" | "lamp" | "plant" | "rug" | "piano" | "other";

export type Shape = { id: string; name: string; note: string; /** Words that point to this shape. */ words?: RegExp };

export const LIBRARY: Record<Category, Shape[]> = {
  sofa: [
    { id: "straight", name: "Straight 3-seater", note: "Classic · track arms" },
    { id: "channel", name: "Channel-back curved", note: "Organic · fluted back", words: /channel|fluted|tufted|ribbed/ },
    { id: "curved", name: "Curved", note: "Organic · armless", words: /curv|round|organic|crescent|kidney/ },
    { id: "tuxedo", name: "Tuxedo", note: "Tailored · arms level with back", words: /tuxedo|boxy/ },
    { id: "modular", name: "Low modular", note: "Relaxed · block seats", words: /modular|low|lounge|cloud/ },
    { id: "chaise", name: "Chaise end", note: "Straight · lounge end", words: /chaise|corner|sectional|l-shape/ },
    { id: "rolled", name: "Rolled arm", note: "Traditional · round arms", words: /roll|chesterfield|classic english/ },
    { id: "daybed", name: "Daybed", note: "Backless · bolsters", words: /daybed|backless/ },
  ],
  chair: [
    { id: "tub", name: "Tub", note: "Round · wrapped back", words: /tub|barrel|round|curv/ },
    { id: "channelt", name: "Channel tub", note: "Round · fluted back", words: /channel|fluted|ribbed/ },
    { id: "club", name: "Club", note: "Boxy · deep seat", words: /club|boxy|cube/ },
    { id: "wing", name: "Wingback", note: "Tall · winged", words: /wing/ },
    { id: "slipper", name: "Slipper", note: "Armless · low", words: /slipper|armless|low/ },
    { id: "frame", name: "Sling lounge", note: "Metal frame · sling seat", words: /sling|frame|safari|cantilever/ },
  ],
  table: [
    { id: "oval", name: "Oval pedestal", note: "Soft · two pedestals", words: /oval/ },
    { id: "ovalframe", name: "Oval on frame", note: "Light · four legs", words: /glass|frame/ },
    { id: "drums", name: "Drum pair", note: "Sculptural · two heights", words: /drum|marble|stone|travertine/ },
    { id: "round", name: "Round pedestal", note: "Classic · single foot", words: /round|circular/ },
    { id: "rect", name: "Rectangular", note: "Straight · lower shelf", words: /rectang|square|slab/ },
    { id: "plinth", name: "Plinth block", note: "Monolithic · low", words: /plinth|block|monolith/ },
    { id: "nest", name: "Nesting rounds", note: "Light · two tables", words: /nest/ },
    { id: "kidney", name: "Kidney", note: "Organic · freeform", words: /kidney|organic|freeform|pebble/ },
  ],
  side: [
    { id: "stem", name: "Pedestal", note: "Round top · single stem", words: /pedestal|stem/ },
    { id: "tripod", name: "Tripod", note: "Round top · three legs", words: /tripod/ },
    { id: "drum", name: "Drum", note: "Solid · round", words: /drum|stone|marble/ },
    { id: "ctable", name: "C-table", note: "Slides over a seat", words: /c-table|cantilever/ },
    { id: "cube", name: "Cube", note: "Solid · square", words: /cube|square|box/ },
    { id: "discs", name: "Stacked discs", note: "Sculptural · turned", words: /stack|turned|sculpt/ },
  ],
  shelf: [
    { id: "grid", name: "Open bookcase", note: "Bays · back panels" },
    { id: "etagere", name: "Étagère", note: "Open · metal posts", words: /[eé]tag[eè]re|metal|open frame|industrial/ },
    { id: "arch", name: "Arched cabinet", note: "Arched front · niche", words: /arch/ },
    { id: "credenza", name: "Credenza + wall shelves", note: "Low cabinet · shelves above", words: /credenza|floating|wall shel/ },
  ],
  console: [
    { id: "legs", name: "Drawer console", note: "Slim legs · drawer" },
    { id: "waterfall", name: "Waterfall", note: "Three slabs", words: /waterfall|slab/ },
    { id: "demilune", name: "Demi-lune", note: "Half-round · three legs", words: /demi|half-round|half round|curv/ },
    { id: "plinth", name: "Plinth cabinet", note: "Solid · to the floor", words: /sideboard|cabinet|dresser|chest|credenza|plinth/ },
    { id: "trestle", name: "Trestle", note: "Top on two trestles", words: /trestle/ },
  ],
  bed: [
    { id: "panel", name: "Panel headboard", note: "Upholstered · straight" },
    { id: "curvedhead", name: "Curved headboard", note: "Upholstered · arched", words: /curv|arch|round/ },
    { id: "channelhead", name: "Channel headboard", note: "Upholstered · fluted", words: /channel|fluted|tufted/ },
    { id: "platform", name: "Platform", note: "Low · wooden frame", words: /platform|low|wood|japan/ },
  ],
  dining: [
    { id: "rect", name: "Rectangular table", note: "Four legs" },
    { id: "round", name: "Round table", note: "Pedestal foot", words: /round|circular|pedestal/ },
    { id: "oval", name: "Oval table", note: "Two pedestals", words: /oval/ },
  ],
  dchair: [
    { id: "side", name: "Dining chair", note: "Upholstered seat" },
    { id: "curvedback", name: "Curved-back chair", note: "Wrapped back", words: /curv|round|tub/ },
  ],
  desk: [
    { id: "legs", name: "Writing desk", note: "Four legs · drawer" },
    { id: "trestle", name: "Trestle desk", note: "Top on two trestles", words: /trestle/ },
  ],
  media: [{ id: "low", name: "Low media unit", note: "Doors · plinth" }],
  wardrobe: [{ id: "doors", name: "Wardrobe", note: "Full height · doors" }],
  bench: [
    { id: "bench", name: "Upholstered bench", note: "Slim legs" },
    { id: "pouf", name: "Pouf", note: "Round · soft", words: /pouf|ottoman|round/ },
  ],
  lamp: [
    { id: "shade", name: "Drum shade", note: "Straight stem · fabric shade" },
    { id: "globe", name: "Globe", note: "Straight stem · opal ball", words: /globe|ball|opal|sphere/ },
    { id: "arc", name: "Arc", note: "Curves over the seat", words: /arc|arch|curv/ },
    { id: "tripod", name: "Tripod", note: "Three wooden legs", words: /tripod/ },
    { id: "torch", name: "Uplighter", note: "Washes the ceiling", words: /uplight|torch/ },
    { id: "column", name: "Column", note: "Fabric column · floor glow", words: /column|paper|lantern/ },
  ],
  plant: [
    { id: "rubber", name: "Rubber plant", note: "Broad glossy leaves" },
    { id: "snake", name: "Snake plant", note: "Upright blades", words: /snake|sansevieria/ },
    { id: "palm", name: "Areca palm", note: "Arching fronds", words: /palm|fern/ },
    { id: "olive", name: "Olive tree", note: "Slim trunk · fine leaves", words: /olive|tree|ficus/ },
  ],
  rug: [
    { id: "rect", name: "Rectangle", note: "As in your layout" },
    { id: "round", name: "Round", note: "Fits the same space", words: /round|circular/ },
    { id: "oval", name: "Oval", note: "Fits the same space", words: /oval|organic/ },
  ],
  piano: [{ id: "upright", name: "Upright piano", note: "With bench" }],
  other: [{ id: "block", name: "Simple volume", note: "Its footprint and height" }],
};

/** The nouns that name each category in a sentence, to find the words written about that piece. */
const NOUN: Partial<Record<Category, RegExp>> = {
  sofa: /sofa|couch|settee|sectional/,
  chair: /armchair|lounge chair|accent chair|chair/,
  table: /coffee table|cocktail table|table/,
  side: /side table|end table|bedside|nightstand/,
  shelf: /shelv\w*|bookcase|bookshelf/,
  console: /console|sideboard|dresser|credenza/,
  bed: /headboard|bed/,
  dining: /dining table/,
  lamp: /floor lamp|lamp/,
  rug: /rug|carpet/,
  plant: /plant|tree|greenery/,
};

/** The few words written around a category's noun: "a plum curved velvet sofa" → "a plum curved velvet sofa". */
export function wordsNear(text: string, cat: Category): string {
  const noun = NOUN[cat];
  const t = text.toLowerCase();
  if (!noun) return "";
  const out: string[] = [];
  for (const clause of t.split(/[.;,·\n]| and | with /)) {
    const m = noun.exec(clause);
    if (!m) continue;
    const before = clause.slice(0, m.index).trim().split(/\s+/).slice(-5).join(" ");
    out.push(`${before} ${m[0]}`);
  }
  return out.join(" | ");
}

/** The closest shape for a category from the words that describe the piece; the category's first shape if none match. */
export function matchShape(cat: Category, described: string): { shape: Shape; matched: boolean } {
  const shapes = LIBRARY[cat];
  const t = described.toLowerCase();
  if (t) for (const s of shapes) if (s.words && s.words.test(t)) return { shape: s, matched: true };
  return { shape: shapes[0], matched: false };
}

export const shapeById = (cat: Category, id?: string) => LIBRARY[cat].find((s) => s.id === id);

export type Fabric = "velvet" | "leather" | "boucle" | "linen";
/** The upholstery named in a description, if any. */
export function fabricIn(text: string): Fabric | undefined {
  const t = text.toLowerCase();
  if (/velvet|velour/.test(t)) return "velvet";
  if (/leather/.test(t)) return "leather";
  if (/boucl|teddy|sherpa/.test(t)) return "boucle";
  if (/linen|cotton|weave|woven/.test(t)) return "linen";
  return undefined;
}

/** What a layout piece is, from its kind and label. `wM`/`dM` are its footprint in metres. */
export function categoryOf(kind: string, label: string, wM = 1, dM = 1): Category {
  const t = `${kind} ${label}`.toLowerCase();
  if (/piano/.test(t)) return "piano";
  if (/\brug\b|carpet/.test(t)) return "rug";
  if (/sofa|couch|sectional|settee|loveseat/.test(t)) return "sofa";
  if (/\bbed\b|bedframe/.test(t) && !/bedside/.test(t)) return "bed";
  if (/lamp|light/.test(t)) return "lamp";
  if (/plant|tree/.test(t)) return "plant";
  if (/desk/.test(t) && !/chair/.test(t)) return "desk";
  if (/dining/.test(t) && /table/.test(t)) return "dining";
  if (/(dining|desk|office|side) chair|stool/.test(t)) return "dchair";
  if (/bedside|nightstand|side table|end table/.test(t)) return "side";
  if (/table/.test(t)) return Math.max(wM, dM) < 0.75 ? "side" : "table";
  if (/chair|armchair/.test(t)) return "chair";
  if (/bench|ottoman|pouf|stool/.test(t)) return "bench";
  if (/shel|bookcase|[eé]tag/.test(t)) return "shelf";
  if (/wardrobe|closet|armoire/.test(t)) return "wardrobe";
  if (/\btv\b|media/.test(t)) return "media";
  if (/console|sideboard|dresser|credenza|chest|cabinet|storage/.test(t)) return /tall|full/.test(t) ? "wardrobe" : "console";
  return "other";
}
