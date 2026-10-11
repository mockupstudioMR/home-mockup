/** Fixed content of the journey: the choices people pick from. Words follow the design boards. */

export const STEP_NAMES = ["", "Project", "Inspiration", "Daily life", "Layout", "Furniture", "Colours", "Lighting", "Details", "Make it happen", "Together"];
/** Name of each step in the progress bar ("Step 4 of 10 · Your layout"). */
export const STEP_TITLES = ["", "Your project", "Inspiration & moodboard", "How you use the space", "Your layout", "Main furniture", "Colours & materials", "Lighting", "Finishing details", "Make it happen", "See everything together"];

export type Intent = "new_space" | "redesign" | "exploring";
export const INTENTS: { id: Intent; title: [string, string]; text: string; brief: string }[] = [
  { id: "new_space", title: ["Setting up a", "new space"], text: "New home, new build or a room you're starting fresh.", brief: "New home" },
  { id: "redesign", title: ["Redesigning", "what I have"], text: "Refresh a room and work around what stays.", brief: "Redesign" },
  { id: "exploring", title: ["Just exploring", "for now"], text: "Browse styles and ideas with no commitment.", brief: "Exploring" },
];

export type Property = "apartment" | "house" | "studio" | "loft";
export const PROPERTIES: { id: Property; title: string; text: string }[] = [
  { id: "apartment", title: "Apartment", text: "Flat in a shared building" },
  { id: "house", title: "House", text: "Detached, semi or townhouse" },
  { id: "studio", title: "Studio", text: "One room for living and sleeping" },
  { id: "loft", title: "Loft", text: "Open plan, high ceilings" },
];

export const ROOMS: { id: string; title: string; short: string; tint: "a" | "b" | "c" | "d" }[] = [
  { id: "living-room", title: "Living Room", short: "Living room", tint: "a" },
  { id: "bedroom", title: "Bedroom", short: "Bedroom", tint: "c" },
  { id: "kitchen", title: "Kitchen", short: "Kitchen", tint: "d" },
  { id: "dining-room", title: "Dining Room", short: "Dining room", tint: "a" },
  { id: "office", title: "Home Office", short: "Home office", tint: "b" },
  { id: "bathroom", title: "Bathroom", short: "Bathroom", tint: "c" },
  { id: "kids-room", title: "Kids' Room", short: "Kids' room", tint: "d" },
  { id: "hallway", title: "Hallway & Entry", short: "Hallway & entry", tint: "b" },
];
export const roomName = (id?: string) => ROOMS.find((r) => r.id === id)?.short ?? (id ? id.replace(/-/g, " ") : "Room");
export const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

export type HouseState = "core-shell" | "empty" | "partial" | "redoing";
export type ScopeKey = "furniture" | "walls" | "floors" | "lighting" | "builtins" | "electrical" | "water" | "ac" | "heating" | "data";
export const ROOM_SCOPE: ScopeKey[] = ["furniture", "walls", "floors", "lighting", "builtins"];
export const WALL_SCOPE: ScopeKey[] = ["electrical", "water", "ac", "heating", "data"];
/** Names in the project brief's "In scope" row. */
export const SCOPE_TAG: Record<ScopeKey, string> = {
  furniture: "Furniture", walls: "Walls", floors: "Floors", lighting: "Lighting", electrical: "Electrical features",
  water: "Water & plumbing", ac: "AC & ventilation", heating: "Heating", data: "Data, TV & sound", builtins: "Built-ins & niches",
};
const TAG_ORDER: ScopeKey[] = ["furniture", "walls", "floors", "lighting", "electrical", "water", "ac", "heating", "data", "builtins"];

type ScopeLine = { label: string; note: string; on: boolean };
export const STATES: {
  id: HouseState; title: [string, string]; board: string; tint: "a" | "b" | "c" | "d"; lbl: string; headline: string; tag: string;
  scope: Record<ScopeKey, ScopeLine>;
}[] = [
  {
    id: "core-shell", title: ["Core &", "shell"], board: "S1-State", tint: "c", lbl: "Core & shell",
    headline: "Everything from the walls in — including what runs inside them.", tag: "Full scope",
    scope: {
      furniture: { label: "Furniture", note: "All pieces, new", on: true },
      walls: { label: "Walls & finishes", note: "Plaster, paint, panels, arches", on: true },
      floors: { label: "Floors", note: "Flooring and skirting", on: true },
      lighting: { label: "Lighting", note: "Ceiling, wall and lamps", on: true },
      builtins: { label: "Built-ins & niches", note: "Recessed shelves, fitted storage", on: true },
      electrical: { label: "Electrical points", note: "Sockets, switches, dimmers", on: true },
      water: { label: "Water & plumbing", note: "Supply, drains, taps", on: true },
      ac: { label: "AC & ventilation", note: "AC units, vents, ducts", on: true },
      heating: { label: "Heating", note: "Radiators, underfloor", on: true },
      data: { label: "Data, TV & sound", note: "Network, TV, speaker cabling", on: true },
    },
  },
  {
    id: "empty", title: ["Empty", ""], board: "S1-State-Empty", tint: "d", lbl: "Empty",
    headline: "We furnish and finish the surfaces — the room itself stays as built.", tag: "Light touch",
    scope: {
      furniture: { label: "Furniture", note: "All pieces, new", on: true },
      walls: { label: "Wall surfaces", note: "Paint, wallpaper, panels", on: true },
      floors: { label: "Floors", note: "Kept · rugs only", on: false },
      lighting: { label: "Lighting", note: "Fixtures on existing points, lamps", on: true },
      builtins: { label: "Built-ins & niches", note: "Freestanding only", on: false },
      electrical: { label: "Electrical points", note: "Kept as is", on: false },
      water: { label: "Water & plumbing", note: "Kept as is", on: false },
      ac: { label: "AC & ventilation", note: "Kept as is", on: false },
      heating: { label: "Heating", note: "Kept as is", on: false },
      data: { label: "Data, TV & sound", note: "Kept as is", on: false },
    },
  },
  {
    id: "partial", title: ["Partially", "furnished"], board: "S1-State-Partial", tint: "a", lbl: "Partially furnished",
    headline: "We design around the pieces you keep, and refresh the rest.", tag: "Work around what stays",
    scope: {
      furniture: { label: "Furniture", note: "New pieces around what stays", on: true },
      walls: { label: "Wall surfaces", note: "Paint, wallpaper, panels", on: true },
      floors: { label: "Floors", note: "Kept · on request", on: false },
      lighting: { label: "Lighting", note: "Fixtures on existing points, lamps", on: true },
      builtins: { label: "Built-ins & niches", note: "On request", on: false },
      electrical: { label: "Electrical points", note: "Kept · on request", on: false },
      water: { label: "Water & plumbing", note: "Kept · on request", on: false },
      ac: { label: "AC & ventilation", note: "Kept · on request", on: false },
      heating: { label: "Heating", note: "Kept · on request", on: false },
      data: { label: "Data, TV & sound", note: "Kept · on request", on: false },
    },
  },
  {
    id: "redoing", title: ["Redoing", "it all"], board: "S1-State-Redo", tint: "b", lbl: "Redoing it all",
    headline: "Start over — furniture, finishes and what's inside the walls.", tag: "Full scope",
    scope: {
      furniture: { label: "Furniture", note: "Existing pieces open to change", on: true },
      walls: { label: "Walls & finishes", note: "Strip back and refinish", on: true },
      floors: { label: "Floors", note: "Replace flooring and skirting", on: true },
      lighting: { label: "Lighting", note: "New points and fixtures", on: true },
      builtins: { label: "Built-ins & niches", note: "Recessed shelves, fitted storage", on: true },
      electrical: { label: "Electrical points", note: "Move or add", on: true },
      water: { label: "Water & plumbing", note: "Move or add, if drains allow", on: true },
      ac: { label: "AC & ventilation", note: "New units, vents, ducts", on: true },
      heating: { label: "Heating", note: "Move radiators or go underfloor", on: true },
      data: { label: "Data, TV & sound", note: "Network, TV, speaker cabling", on: true },
    },
  },
];
export const stateInfo = (id?: HouseState) => STATES.find((s) => s.id === id) ?? STATES[0];

/** What is in scope: the state's defaults, plus everything inside the walls when the person allowed changes there. */
export function scopeTags(state?: HouseState, allowInWalls = false): string[] {
  const s = stateInfo(state);
  return TAG_ORDER.filter((k) => s.scope[k].on || (allowInWalls && WALL_SCOPE.includes(k))).map((k) => SCOPE_TAG[k]);
}

export const BUDGETS = ["Not decided yet", "Under €5,000", "€5,000 – €15,000", "€15,000 – €30,000", "€30,000+"];
export const TIMINGS = ["Not decided yet", "Within 1 month", "1–3 months", "3–6 months", "6+ months"];
export const RESTRICTIONS = ["Not sure", "None — I own it", "Rented — limited changes", "Building rules apply"];
