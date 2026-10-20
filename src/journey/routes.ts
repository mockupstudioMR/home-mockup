/** Every journey screen: its design board id, its address and its place in the 10 steps. */
export type ScreenId =
  | "Main" | "S1-Why" | "S1-Place" | "S1-Rooms" | "S1-Start" | "S1-State" | "S1-Summary"
  | "S2-Vision" | "S2-Upload" | "S2-Analyzing" | "S2-Matches" | "S2-Moodboard" | "S2-Preview" | "S2-Adjust" | "S2-Summary"
  | "S3-Activities" | "S3-Priorities" | "S3-Existing" | "S3-Fixed" | "S3-Summary"
  | "S4-Input" | "S4-Measure" | "S4-Layouts" | "S4-Summary"
  | "S5-Shops" | "S5-Anchor" | "S5-Summary" | "S6-Palette" | "S6-Summary" | "S7-Lighting" | "S7-Summary"
  | "S8-Walls" | "S8-WallDetail" | "S8-Summary" | "S9-BuyList" | "S9-Sizes" | "S9-Todo" | "S9-Summary" | "S10-Final";

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
  { id: "S2-Preview", path: "2/preview", step: 2 },
  { id: "S2-Adjust", path: "2/adjust", step: 2 },
  { id: "S2-Summary", path: "2/summary", step: 2 },
  { id: "S3-Activities", path: "3/activities", step: 3 },
  { id: "S3-Priorities", path: "3/priorities", step: 3 },
  { id: "S3-Existing", path: "3/existing", step: 3 },
  { id: "S3-Summary", path: "3/summary", step: 3 },
  { id: "S4-Input", path: "4/input", step: 4 },
  { id: "S4-Measure", path: "4/measure", step: 4 },
  { id: "S3-Fixed", path: "4/fixed", step: 4 },
  { id: "S4-Layouts", path: "4/layouts", step: 4 },
  { id: "S4-Summary", path: "4/summary", step: 4 },
  { id: "S5-Shops", path: "5/shops", step: 5 },
  { id: "S5-Anchor", path: "5/anchor", step: 5 },
  { id: "S5-Summary", path: "5/summary", step: 5 },
  { id: "S6-Palette", path: "6/palette", step: 6 },
  { id: "S6-Summary", path: "6/summary", step: 6 },
  { id: "S7-Lighting", path: "7/lighting", step: 7 },
  { id: "S7-Summary", path: "7/summary", step: 7 },
  { id: "S8-Walls", path: "8/walls", step: 8 },
  { id: "S8-WallDetail", path: "8/wall", step: 8 },
  { id: "S8-Summary", path: "8/summary", step: 8 },
  { id: "S9-BuyList", path: "9/buy", step: 9 },
  { id: "S9-Sizes", path: "9/sizes", step: 9 },
  { id: "S9-Todo", path: "9/todo", step: 9 },
  { id: "S9-Summary", path: "9/summary", step: 9 },
  { id: "S10-Final", path: "10/final", step: 10 },
];

export const hrefOf = (id: ScreenId, extra = "") => `/journey${SCREENS.find((s) => s.id === id)!.path ? "/" + SCREENS.find((s) => s.id === id)!.path : ""}${extra}`;

/** The screen for a URL path under /journey ("4/layouts", "8/wall/D"). */
export function screenFor(rest: string): { id: ScreenId; param?: string } | null {
  const clean = rest.replace(/^\/+|\/+$/g, "");
  const exact = SCREENS.find((s) => s.path === clean);
  if (exact) return { id: exact.id };
  if (clean === "3/fixed") return { id: "S3-Fixed" }; // old address: "what can't move" moved after the floor plan
  const wall = /^8\/wall\/([A-Za-z0-9]+)$/.exec(clean);
  if (wall) return { id: "S8-WallDetail", param: wall[1] };
  return null;
}
