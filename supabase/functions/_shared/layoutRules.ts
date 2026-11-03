/**
 * Furniture sizes, which way each piece faces, and the groupings professionals use (a sofa with its coffee table and
 * TV, a bed with its nightstands, a table with its chairs). The database tables furniture_specs and
 * furniture_groupings hold the same data and can be edited in the admin; these defaults are used when a table is
 * empty or not there yet, so layouts never depend on the AI alone. Plain TS: used by the edge function and the app.
 */

/**
 * How a piece stands in the room:
 * - wall: back against a wall, front into the room (sofa, wardrobe, desk, TV unit)
 * - head_wall: head end against a wall (bed)
 * - anchor: faces the piece it belongs to (dining chair → table, armchair → coffee table)
 * - free: no front (coffee table, rug, lamp)
 */
export type SpecFacing = "wall" | "head_wall" | "anchor" | "free";
/** What the plan draws it as. */
export type SpecKind = "sofa" | "chair" | "table" | "rug" | "storage" | "bed" | "desk" | "bench" | "other";

export type Spec = {
  name: string;
  variant: string;
  kind: SpecKind;
  /** Width along the wall it stands against (or its long side), depth away from it, in cm. */
  width_cm: number;
  depth_cm: number;
  height_cm?: number | null;
  /** Free space needed in front of it, in cm. */
  min_clearance_cm: number;
  facing: SpecFacing;
  /** Its top-view symbol on the plan: public/furniture-symbols/<symbol>.svg (back at the top). */
  symbol?: string | null;
  is_default: boolean;
};

/**
 * Where a member sits, drawn as if the main piece stands against the TOP wall facing down into the room:
 * dx = sideways (right +), dy = into the room (+), both to the member's centre, in cm. For a piece against a
 * wall they're measured from the middle of its back (on the wall); for a free-standing piece from its centre.
 * faces: which way the member's front points in that drawing. at: "opposite_wall" puts it against the wall
 * facing the main piece (a TV unit across from the sofa), lined up with it.
 */
export type MemberFaces = "into_room" | "toward_wall" | "left" | "right" | "none";
export type Member = {
  spec_name: string;
  spec_variant?: string | null;
  label?: string | null;
  dx_cm: number;
  dy_cm: number;
  faces: MemberFaces;
  at?: "offset" | "opposite_wall";
  optional?: boolean;
};
export type Grouping = {
  key: string;
  name: string;
  room_types: string[];
  /** Activities from step 3 this grouping serves (room_activities.activity_name). */
  activities: string[];
  anchor_name: string;
  anchor_variant?: string | null;
  /** Against a wall, or free-standing in the room. */
  anchor_place: "wall" | "floating";
  /** Lower first when several groupings serve the same activity. */
  priority: number;
  /** One upper-case word for the zone on the plan, e.g. RELAX. */
  zone: string;
  members: Member[];
};

export const DEFAULT_SPECS: Spec[] = [
  // seating
  { name: "3-seat sofa", variant: "standard", kind: "sofa", width_cm: 220, depth_cm: 95, height_cm: 85, min_clearance_cm: 60, facing: "wall", symbol: "sofa-3", is_default: true },
  { name: "curved sofa", variant: "3-seat", kind: "sofa", width_cm: 240, depth_cm: 105, height_cm: 80, min_clearance_cm: 60, facing: "wall", symbol: "sofa-curved", is_default: true },
  { name: "l-shape sofa", variant: "standard", kind: "sofa", width_cm: 280, depth_cm: 180, height_cm: 85, min_clearance_cm: 60, facing: "wall", symbol: "sofa-l", is_default: true },
  { name: "accent chair", variant: "standard", kind: "chair", width_cm: 80, depth_cm: 85, height_cm: 85, min_clearance_cm: 50, facing: "anchor", symbol: "armchair", is_default: true },
  { name: "dining chair", variant: "standard", kind: "chair", width_cm: 45, depth_cm: 50, height_cm: 85, min_clearance_cm: 0, facing: "anchor", symbol: "dining-chair", is_default: true },
  { name: "desk chair", variant: "standard", kind: "chair", width_cm: 60, depth_cm: 60, height_cm: 100, min_clearance_cm: 0, facing: "anchor", symbol: "desk-chair", is_default: true },
  { name: "bench", variant: "standard", kind: "bench", width_cm: 120, depth_cm: 40, height_cm: 45, min_clearance_cm: 0, facing: "free", symbol: "bench", is_default: true },
  { name: "piano bench", variant: "standard", kind: "bench", width_cm: 56, depth_cm: 36, height_cm: 49, min_clearance_cm: 0, facing: "anchor", symbol: "piano-bench", is_default: true },
  // tables
  { name: "coffee table", variant: "standard", kind: "table", width_cm: 110, depth_cm: 65, height_cm: 38, min_clearance_cm: 45, facing: "free", symbol: "coffee-table", is_default: true },
  { name: "side table", variant: "standard", kind: "table", width_cm: 45, depth_cm: 45, height_cm: 50, min_clearance_cm: 0, facing: "free", symbol: "side-table", is_default: true },
  { name: "dining table", variant: "4-seat", kind: "table", width_cm: 140, depth_cm: 80, height_cm: 75, min_clearance_cm: 80, facing: "free", symbol: "dining-table", is_default: true },
  { name: "dining table", variant: "6-seat", kind: "table", width_cm: 180, depth_cm: 90, height_cm: 75, min_clearance_cm: 80, facing: "free", symbol: "dining-table", is_default: false },
  { name: "desk", variant: "standard", kind: "desk", width_cm: 120, depth_cm: 60, height_cm: 75, min_clearance_cm: 90, facing: "wall", symbol: "desk", is_default: true },
  // beds
  { name: "bed", variant: "double", kind: "bed", width_cm: 160, depth_cm: 200, height_cm: 100, min_clearance_cm: 60, facing: "head_wall", symbol: "bed-double", is_default: true },
  { name: "bed", variant: "king", kind: "bed", width_cm: 180, depth_cm: 200, height_cm: 100, min_clearance_cm: 60, facing: "head_wall", symbol: "bed-king", is_default: false },
  { name: "bed", variant: "single", kind: "bed", width_cm: 90, depth_cm: 200, height_cm: 90, min_clearance_cm: 60, facing: "head_wall", symbol: "bed-single", is_default: false },
  { name: "nightstand", variant: "standard", kind: "storage", width_cm: 45, depth_cm: 40, height_cm: 55, min_clearance_cm: 0, facing: "wall", symbol: "nightstand", is_default: true },
  // storage
  { name: "wardrobe", variant: "standard", kind: "storage", width_cm: 200, depth_cm: 60, height_cm: 220, min_clearance_cm: 90, facing: "wall", symbol: "wardrobe", is_default: true },
  { name: "dresser", variant: "standard", kind: "storage", width_cm: 120, depth_cm: 50, height_cm: 80, min_clearance_cm: 80, facing: "wall", symbol: "dresser", is_default: true },
  { name: "tv unit", variant: "standard", kind: "storage", width_cm: 160, depth_cm: 40, height_cm: 50, min_clearance_cm: 0, facing: "wall", symbol: "tv-unit", is_default: true },
  { name: "bookshelf", variant: "standard", kind: "storage", width_cm: 90, depth_cm: 35, height_cm: 200, min_clearance_cm: 70, facing: "wall", symbol: "bookshelf", is_default: true },
  { name: "sideboard", variant: "standard", kind: "storage", width_cm: 160, depth_cm: 45, height_cm: 80, min_clearance_cm: 80, facing: "wall", symbol: "sideboard", is_default: true },
  { name: "console", variant: "slim", kind: "storage", width_cm: 100, depth_cm: 30, height_cm: 80, min_clearance_cm: 60, facing: "wall", symbol: "console", is_default: true },
  // instruments
  { name: "upright piano", variant: "standard", kind: "other", width_cm: 150, depth_cm: 60, height_cm: 125, min_clearance_cm: 90, facing: "wall", symbol: "piano-upright", is_default: true },
  // decor & lighting
  { name: "rug", variant: "large", kind: "rug", width_cm: 240, depth_cm: 340, height_cm: 1, min_clearance_cm: 0, facing: "free", symbol: "rug", is_default: true },
  { name: "rug", variant: "medium", kind: "rug", width_cm: 230, depth_cm: 160, height_cm: 1, min_clearance_cm: 0, facing: "free", symbol: "rug", is_default: false },
  { name: "floor lamp", variant: "standard", kind: "other", width_cm: 30, depth_cm: 30, height_cm: 155, min_clearance_cm: 0, facing: "free", symbol: "floor-lamp", is_default: true },
];

export const DEFAULT_GROUPINGS: Grouping[] = [
  {
    key: "tv-lounge", name: "Sofa, coffee table and TV", room_types: ["living-room"], activities: ["Relax", "Watch films"],
    anchor_name: "3-seat sofa", anchor_place: "wall", priority: 1, zone: "RELAX",
    members: [
      { spec_name: "rug", spec_variant: "medium", dx_cm: 0, dy_cm: 150, faces: "none", optional: true },
      { spec_name: "coffee table", dx_cm: 0, dy_cm: 173, faces: "none" }, // 95 sofa + 45 gap + 32.5 half table
      { spec_name: "tv unit", dx_cm: 0, dy_cm: 0, faces: "toward_wall", at: "opposite_wall", optional: true },
      { spec_name: "side table", dx_cm: 138, dy_cm: 30, faces: "none", optional: true },
      { spec_name: "floor lamp", dx_cm: -130, dy_cm: 25, faces: "none", optional: true },
    ],
  },
  {
    key: "conversation", name: "Sofa with two armchairs", room_types: ["living-room"], activities: ["Host friends", "Relax"],
    anchor_name: "3-seat sofa", anchor_place: "wall", priority: 2, zone: "SOCIAL",
    members: [
      { spec_name: "rug", spec_variant: "medium", dx_cm: 0, dy_cm: 160, faces: "none", optional: true },
      { spec_name: "coffee table", dx_cm: 0, dy_cm: 173, faces: "none" },
      // armchairs beside the table, turned in towards it
      { spec_name: "accent chair", label: "Armchair", dx_cm: -140, dy_cm: 185, faces: "right" },
      { spec_name: "accent chair", label: "Armchair", dx_cm: 140, dy_cm: 185, faces: "left", optional: true },
    ],
  },
  {
    key: "reading-corner", name: "Reading chair and lamp", room_types: ["living-room", "bedroom", "office"], activities: ["Read"],
    anchor_name: "accent chair", anchor_place: "wall", priority: 3, zone: "READ",
    members: [
      { spec_name: "floor lamp", dx_cm: -62, dy_cm: 22, faces: "none" },
      { spec_name: "side table", dx_cm: 65, dy_cm: 30, faces: "none", optional: true },
    ],
  },
  {
    key: "piano", name: "Upright piano and bench", room_types: ["living-room", "kids-room"], activities: ["Play piano"],
    anchor_name: "upright piano", anchor_place: "wall", priority: 2, zone: "MUSIC",
    members: [{ spec_name: "piano bench", dx_cm: 0, dy_cm: 88, faces: "toward_wall" }],
  },
  {
    key: "work-desk", name: "Desk and chair", room_types: ["living-room", "bedroom", "office", "kids-room"], activities: ["Work", "Study", "Video calls", "Paint & craft"],
    anchor_name: "desk", anchor_place: "wall", priority: 2, zone: "WORK",
    members: [
      { spec_name: "desk chair", dx_cm: 0, dy_cm: 78, faces: "toward_wall" },
      { spec_name: "bookshelf", dx_cm: 115, dy_cm: 18, faces: "into_room", optional: true },
    ],
  },
  {
    key: "dining-4", name: "Table for four", room_types: ["dining-room", "living-room", "kitchen"], activities: ["Eat here", "Host friends", "Cook", "Play board games"],
    anchor_name: "dining table", anchor_variant: "4-seat", anchor_place: "floating", priority: 2, zone: "DINING",
    members: [
      { spec_name: "dining chair", dx_cm: -35, dy_cm: -62, faces: "into_room" },
      { spec_name: "dining chair", dx_cm: 35, dy_cm: -62, faces: "into_room" },
      { spec_name: "dining chair", dx_cm: -35, dy_cm: 62, faces: "toward_wall" },
      { spec_name: "dining chair", dx_cm: 35, dy_cm: 62, faces: "toward_wall" },
    ],
  },
  {
    key: "dining-6", name: "Table for six", room_types: ["dining-room"], activities: ["Eat here", "Host friends", "Play board games"],
    anchor_name: "dining table", anchor_variant: "6-seat", anchor_place: "floating", priority: 1, zone: "DINING",
    members: [
      { spec_name: "dining chair", dx_cm: -55, dy_cm: -67, faces: "into_room" },
      { spec_name: "dining chair", dx_cm: 0, dy_cm: -67, faces: "into_room" },
      { spec_name: "dining chair", dx_cm: 55, dy_cm: -67, faces: "into_room" },
      { spec_name: "dining chair", dx_cm: -55, dy_cm: 67, faces: "toward_wall" },
      { spec_name: "dining chair", dx_cm: 0, dy_cm: 67, faces: "toward_wall" },
      { spec_name: "dining chair", dx_cm: 55, dy_cm: 67, faces: "toward_wall" },
      { spec_name: "sideboard", dx_cm: 0, dy_cm: 0, faces: "toward_wall", at: "opposite_wall", optional: true },
    ],
  },
  {
    key: "bed-set", name: "Bed with two nightstands", room_types: ["bedroom"], activities: ["Sleep", "Relax"],
    anchor_name: "bed", anchor_variant: "double", anchor_place: "wall", priority: 1, zone: "SLEEP",
    members: [
      { spec_name: "rug", spec_variant: "medium", dx_cm: 0, dy_cm: 150, faces: "none", optional: true },
      { spec_name: "nightstand", dx_cm: -108, dy_cm: 20, faces: "into_room" },
      { spec_name: "nightstand", dx_cm: 108, dy_cm: 20, faces: "into_room", optional: true },
      { spec_name: "bench", label: "Bench at the foot of the bed", dx_cm: 0, dy_cm: 228, faces: "into_room", optional: true },
    ],
  },
  {
    key: "single-bed", name: "Single bed and nightstand", room_types: ["kids-room", "bedroom", "office"], activities: ["Sleep", "Guests stay"],
    anchor_name: "bed", anchor_variant: "single", anchor_place: "wall", priority: 3, zone: "SLEEP",
    members: [{ spec_name: "nightstand", dx_cm: 75, dy_cm: 20, faces: "into_room" }],
  },
  {
    key: "wardrobe", name: "Wardrobe", room_types: ["bedroom", "kids-room", "hallway"], activities: ["Get dressed", "Store coats & shoes", "Sleep"],
    anchor_name: "wardrobe", anchor_place: "wall", priority: 4, zone: "DRESS", members: [],
  },
  {
    key: "dresser", name: "Dresser", room_types: ["bedroom"], activities: ["Get dressed"],
    anchor_name: "dresser", anchor_place: "wall", priority: 5, zone: "DRESS", members: [],
  },
  {
    key: "bookshelf-wall", name: "Bookshelves", room_types: ["living-room", "office", "kids-room"], activities: ["Read", "Kids play", "Study"],
    anchor_name: "bookshelf", anchor_place: "wall", priority: 5, zone: "BOOKS",
    members: [{ spec_name: "bookshelf", dx_cm: 92, dy_cm: 18, faces: "into_room", optional: true }],
  },
  {
    key: "entry-console", name: "Console by the door", room_types: ["hallway", "living-room"], activities: ["Arrive & leave", "Store coats & shoes", "Read the post"],
    anchor_name: "console", anchor_place: "wall", priority: 6, zone: "ENTRY", members: [],
  },
];

/** The spec for a name and variant (the default variant when none is given). */
export function findSpec(specs: Spec[], name: string, variant?: string | null): Spec | undefined {
  const n = name.toLowerCase().trim();
  const same = specs.filter((s) => s.name.toLowerCase() === n);
  return (variant ? same.find((s) => s.variant === variant) : undefined) ?? same.find((s) => s.is_default) ?? same[0];
}

/** The symbol for a piece by its name (and size), for rows and plan pieces that don't name one. */
export function symbolForName(name: string, variant?: string, kind?: string): string {
  const n = `${name} ${variant ?? ""}`.toLowerCase();
  if (/l-shape|corner|chaise/.test(n) && /sofa/.test(n)) return "sofa-l";
  if (/curved/.test(n) && /sofa/.test(n)) return "sofa-curved";
  if (/sofa|couch|settee/.test(n)) return /2-seat|loveseat/.test(n) ? "sofa-2" : /4-seat/.test(n) ? "sofa-4" : "sofa-3";
  if (/grand piano/.test(n)) return "piano-grand";
  if (/digital piano|keyboard/.test(n)) return "piano-digital";
  if (/piano bench/.test(n)) return "piano-bench";
  if (/piano/.test(n)) return "piano-upright";
  if (/bedside|nightstand|night stand/.test(n)) return "nightstand";
  if (/\bbed\b|crib|cot/.test(n)) return /single|90/.test(n) ? "bed-single" : /king|180/.test(n) ? "bed-king" : "bed-double";
  if (/desk chair|office chair/.test(n)) return "desk-chair";
  if (/dining chair|chair.*dining/.test(n)) return "dining-chair";
  if (/chair/.test(n)) return "armchair";
  if (/bench|stool/.test(n)) return "bench";
  if (/coffee table/.test(n)) return "coffee-table";
  if (/side table|end table/.test(n)) return "side-table";
  if (/dining|table for/.test(n)) return "dining-table";
  if (/desk/.test(n)) return "desk";
  if (/wardrobe|closet/.test(n)) return "wardrobe";
  if (/dresser|chest of drawers/.test(n)) return "dresser";
  if (/tv/.test(n)) return "tv-unit";
  if (/book|shel/.test(n)) return "bookshelf";
  if (/sideboard|credenza|buffet/.test(n)) return "sideboard";
  if (/console/.test(n)) return "console";
  if (/\brug\b|carpet/.test(n)) return "rug";
  if (/mirror/.test(n)) return "mirror-round";
  if (/lamp|light/.test(n)) return "floor-lamp";
  if (/cushion|pillow/.test(n)) return "cushion";
  const byKind: Record<string, string> = { sofa: "sofa-3", chair: "armchair", table: "dining-table", rug: "rug", bed: "bed-double", desk: "desk", bench: "bench", storage: "sideboard" };
  return (kind && byKind[kind]) || "generic";
}

/** For a row typed into the table without a kind or facing: what its name says it is. */
export function guessKind(name: string, againstWall?: boolean | null): { kind: SpecKind; facing: SpecFacing } {
  const n = name.toLowerCase();
  if (/sofa|couch|settee/.test(n)) return { kind: "sofa", facing: "wall" };
  if (/bedside|nightstand|night stand|console table|tv (unit|stand)/.test(n)) return { kind: "storage", facing: "wall" };
  if (/\bbed\b|crib|cot/.test(n)) return { kind: "bed", facing: "head_wall" };
  if (/bench|stool|ottoman|pouf/.test(n)) return { kind: "bench", facing: "free" };
  if (/chair|armchair/.test(n)) return { kind: "chair", facing: "anchor" };
  if (/desk/.test(n)) return { kind: "desk", facing: "wall" };
  if (/table/.test(n)) return { kind: "table", facing: "free" };
  if (/\brug\b|carpet/.test(n)) return { kind: "rug", facing: "free" };
  if (/wardrobe|closet|dresser|chest|cabinet|shel|bookcase|sideboard|console|unit|nightstand|bedside|cupboard/.test(n)) return { kind: "storage", facing: "wall" };
  return { kind: "other", facing: againstWall ? "wall" : "free" };
}

/** Database rows first, defaults for anything they don't have (by name + variant, and by grouping key). */
export function mergeSpecs(rows: Partial<Spec>[] | null | undefined): Spec[] {
  const out = new Map(DEFAULT_SPECS.map((s) => [`${s.name}|${s.variant}`, s]));
  for (const r of rows ?? []) {
    if (!r?.name || !r.width_cm || !r.depth_cm) continue;
    const key = `${r.name.toLowerCase()}|${r.variant ?? "standard"}`;
    const base = out.get(key);
    const guess = guessKind(r.name, (r as { must_against_wall?: boolean }).must_against_wall);
    out.set(key, {
      name: r.name.toLowerCase(),
      variant: r.variant ?? "standard",
      kind: (r.kind as SpecKind) ?? base?.kind ?? guess.kind,
      width_cm: r.width_cm,
      depth_cm: r.depth_cm,
      height_cm: r.height_cm ?? base?.height_cm ?? null,
      min_clearance_cm: r.min_clearance_cm ?? base?.min_clearance_cm ?? 40,
      facing: (r.facing as SpecFacing) ?? base?.facing ?? guess.facing,
      symbol: r.symbol ?? base?.symbol ?? symbolForName(r.name, r.variant ?? undefined),
      is_default: r.is_default ?? base?.is_default ?? false,
    });
  }
  return [...out.values()];
}

export function mergeGroupings(rows: (Omit<Grouping, "members"> & { members?: Member[] | null; is_active?: boolean })[] | null | undefined): Grouping[] {
  const out = new Map(DEFAULT_GROUPINGS.map((g) => [g.key, g]));
  for (const r of rows ?? []) {
    if (!r?.key || !r.anchor_name) continue;
    if (r.is_active === false) {
      out.delete(r.key);
      continue;
    }
    out.set(r.key, { ...r, members: r.members ?? out.get(r.key)?.members ?? [], room_types: r.room_types ?? [], activities: r.activities ?? [], zone: r.zone ?? r.key.toUpperCase() });
  }
  return [...out.values()];
}

/** The groupings that suit a room and what the person does in it, best first. */
export function groupingsFor(groupings: Grouping[], roomType: string, activities: string[] = []): Grouping[] {
  const acts = activities.map((a) => a.toLowerCase());
  const inRoom = groupings.filter((g) => g.room_types.includes(roomType) || g.room_types.includes(roomType.replace(/_/g, "-")));
  const score = (g: Grouping) => (g.activities.some((a) => acts.includes(a.toLowerCase())) ? 0 : 100) + g.priority;
  return inRoom.sort((a, b) => score(a) - score(b));
}
