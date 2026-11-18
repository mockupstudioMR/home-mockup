/**
 * Step 6 refinement: the five parts in their order, and the starting suggestions for walls & floors and decor
 * (from the palette, the preview's read-out and the moodboard). Shared by step 6, its summary and the buying list.
 */
import type { JourneyState, Wall } from "./state";

export type PartKey = "main" | "accents" | "tables" | "surfaces" | "decor";
export const PARTS: { key: PartKey; label: string }[] = [
  { key: "main", label: "Main furniture" },
  { key: "accents", label: "Accents" },
  { key: "tables", label: "Tables & chairs" },
  { key: "surfaces", label: "Walls & floors" },
  { key: "decor", label: "Decor" },
];
export const partOf = (search: string): Exclude<PartKey, "main"> => {
  const v = new URLSearchParams(search).get("part");
  return v === "tables" || v === "surfaces" || v === "decor" ? v : "accents";
};

export const KEEP_FLOOR = "Keep the current floor";
const WALLS: Wall[] = ["A", "B", "C", "D"];
const pick = (s: JourneyState, re: RegExp) => s.moodboard?.palette.find((p) => re.test((p.material ?? p.name).toLowerCase()));

/** Walls: the palette's wall finish on A and D, a calm second colour on B and C; floor: the palette's wood when the floor is being redone. */
export function surfacesFor(s: JourneyState): NonNullable<JourneyState["surfaces"]> {
  if (s.surfaces) return s.surfaces;
  const wall = pick(s, /plaster|paint|limewash|wallpaper|greige/);
  const main = wall?.material ?? wall?.name ?? "Warm greige";
  const second = main === "Warm greige" ? "Limewash white" : "Warm greige";
  const wood = pick(s, /walnut|oak|ash|teak|wood/);
  const redo = s.houseState === "core-shell" || s.houseState === "redoing";
  const floor = redo ? `${(wood?.material ?? "Light oak").split(" ").slice(-1)[0].replace(/^\w/, (c) => c.toUpperCase())} flooring` : KEEP_FLOOR;
  return { walls: Object.fromEntries(WALLS.map((w) => [w, w === "A" || w === "D" ? main : second])) as Record<Wall, string>, floor };
}

/** Decor suggestions from the preview's decor read-out and the moodboard's feel; all on to start with. */
export function decorFor(s: JourneyState): NonNullable<JourneyState["decor"]> {
  if (s.decor) return s.decor;
  const read = (s.preview?.read ?? []).find((r) => r.key === "decor")?.keywords.join(" ").toLowerCase() ?? "";
  const feels = s.moodboard?.feels.join(" ").toLowerCase() ?? "";
  const out: string[] = [];
  if (/cushion/.test(read) || s.anchor?.kind === "sofa") out.push("Cushions");
  if (/plant/.test(read) || /greenery|plant/.test(feels)) out.push("Plants + pots");
  if (/ceramic|vase|object|book/.test(read)) out.push("Ceramics & decor");
  out.push("Curtains", "Art & mirror");
  if (!s.layouts[s.chosenLayout ?? 0]?.items.some((i) => i.kind === "rug")) out.push("Rug");
  return Array.from(new Set(out)).map((name) => ({ name, on: true }));
}

/** "Grey plaster on A, D · Warm greige on B, C" */
export function wallsLine(walls: Record<Wall, string>) {
  const by = new Map<string, Wall[]>();
  for (const w of WALLS) by.set(walls[w], [...(by.get(walls[w]) ?? []), w]);
  return Array.from(by.entries())
    .map(([m, ws]) => `${m} on ${ws.join(", ")}`)
    .join(" · ");
}
