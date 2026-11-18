/** Every journey screen: its design board id, its address and its place in the six steps. */
export type ScreenId =
  | "Main" | "S1-Why" | "S1-Place" | "S1-Rooms" | "S1-Start" | "S1-State" | "S1-Summary"
  | "S2-Vision" | "S2-Upload" | "S2-Analyzing" | "S2-Matches" | "S2-Moodboard" | "S2-Summary"
  | "S3-Activities" | "S3-Existing" | "S3-Fixed" | "S3-Summary"
  | "S4-Input" | "S4-Measure" | "S4-Layouts" | "S4-Summary" | "S4-Showroom"
  | "S5-Walls" | "S5-Wall" | "S5-Shops" | "S5-Anchor" | "S5-Summary" | "S6-Palette" | "S6-Summary" | "S7-Lighting" | "S7-Summary"
  | "S8-Walls" | "S8-WallDetail" | "S8-Summary" | "S9-BuyList" | "S9-Sizes" | "S9-Todo" | "S9-Summary";

export const SCREENS: { id: ScreenId; path: string; step: number }[] = [
  { id: "Main", path: "", step: 0 },
  { id: "S1-Why", path: "1/why", step: 1 },
  { id: "S1-Place", path: "1/place", step: 1 },
  { id: "S1-Rooms", path: "1/rooms", step: 1 },
  { id: "S1-Start", path: "1/start", step: 1 },
  { id: "S1-State", path: "1/state", step: 1 },
  { id: "S1-Summary", path: "1/brief", step: 1 },
  { id: "S2-Vision", path: "2/vision", step: 2 },
  { id: "S2-Upload", path: "2/upload", step: 2 },
  { id: "S2-Analyzing", path: "2/analyzing", step: 2 },
  { id: "S2-Matches", path: "2/matches", step: 2 },
  { id: "S2-Moodboard", path: "2/moodboard", step: 2 },
  { id: "S2-Summary", path: "2/summary", step: 2 },
  { id: "S3-Activities", path: "3/activities", step: 3 },
  { id: "S3-Summary", path: "3/summary", step: 3 },
  { id: "S4-Input", path: "4/input", step: 4 },
  { id: "S4-Measure", path: "4/measure", step: 4 },
  { id: "S3-Fixed", path: "4/fixed", step: 4 },
  { id: "S4-Layouts", path: "4/layouts", step: 4 },
  { id: "S4-Summary", path: "4/summary", step: 4 },
  { id: "S4-Showroom", path: "4/showroom", step: 4 },
  { id: "S5-Walls", path: "5/walls", step: 5 },
  { id: "S5-Wall", path: "5/wall", step: 5 },
  { id: "S3-Existing", path: "5/keeping", step: 5 },
  { id: "S5-Shops", path: "5/shops", step: 5 },
  { id: "S5-Anchor", path: "5/anchor", step: 5 },
  { id: "S5-Summary", path: "5/summary", step: 5 },
  { id: "S9-BuyList", path: "6/buy", step: 6 },
  { id: "S9-Sizes", path: "6/sizes", step: 6 },
  { id: "S9-Todo", path: "6/todo", step: 6 },
  { id: "S9-Summary", path: "6/summary", step: 6 },
];

export const hrefOf = (id: ScreenId, extra = "") => {
  const screen = SCREENS.find((s) => s.id === id);
  if (!screen) return "/journey/6/buy";
  return `/journey${screen.path ? "/" + screen.path : ""}${extra}`;
};

/** The screen for a URL path under /journey ("4/layouts", "8/wall/D"). */
export function screenFor(rest: string): { id: ScreenId; param?: string } | null {
  const clean = rest.replace(/^\/+|\/+$/g, "");
  const exact = SCREENS.find((s) => s.path === clean);
  if (exact) return { id: exact.id };
  if (clean === "3/existing") return { id: "S3-Existing" }; // "What are you keeping?" moved to the start of step 5
  if (clean === "3/priorities") return { id: "S3-Activities" }; // "What matters most?" was removed
  if (clean === "2/adjust" || clean === "2/preview") return { id: "S2-Moodboard" }; // preview and adjusting are part of "Your direction"
  if (clean === "3/fixed") return { id: "S3-Fixed" }; // old address: "what can't move" moved after the floor plan
  if (clean === "10/final") return { id: "S9-Summary" }; // old address: the final step is now 9 · Make it happen
  const legacyFinal = /^9\/(buy|sizes|todo|summary)$/.exec(clean);
  if (legacyFinal) return screenFor(`6/${legacyFinal[1]}`);
  if (/^[6-8]\//.test(clean)) return { id: "S9-BuyList" }; // removed steps continue to Make it happen
  const wall5 = /^5\/wall\/([A-Da-d])$/.exec(clean);
  if (wall5) return { id: "S5-Wall", param: wall5[1].toUpperCase() };
  return null;
}
