/** The buying list (step 9.1), put together from every decision made in steps 3–8. */
import type { JourneyState, Wall } from "./state";
import { dims } from "./sizes";

export type Action = "Buy" | "Keep" | "Custom" | "Keep · yours" | "Own or buy" | "Buy or keep";
export type BuyRow = {
  id: string;
  tab: "furniture" | "finishes";
  name: string;
  qty: string;
  size: string;
  wall: string;
  action: Action;
  /** The status tag next to the action ("Fit TBC", "Quote TBC" …). */
  status?: string;
  image?: string;
  colour?: string;
};

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const word = (m?: string) => (m ?? "").split(" ")[0].toLowerCase();
/** Where the piece comes from can be switched per piece (step 5.0 sets the default). */
export const SOURCES: Action[] = ["Buy", "Custom", "Keep · yours"];
export const statusFor = (a: Action, r: Pick<BuyRow, "tab" | "name" | "status">) =>
  a === "Custom" ? "Quote TBC" : a === "Keep · yours" || a === "Keep" ? undefined : r.status;

export function composeBuyList(s: JourneyState): BuyRow[] {
  const rows: BuyRow[] = [];
  const pal = s.moodboard?.palette ?? [];
  const sw = (i: number) => ({ image: pal[i]?.image, colour: pal[i]?.hex });
  const byGroup = (re: RegExp) => pal.findIndex((p) => re.test((p.material ?? p.name).toLowerCase()));
  const woodI = byGroup(/walnut|oak|ash|teak|wood/);
  const metalI = byGroup(/brass|black|nickel|bronze|copper/);
  const wallI = byGroup(/plaster|paint|limewash|wallpaper|greige/);
  const walls = s.walls;
  const wallOfRole = (re: RegExp) => (Object.entries(walls) as [Wall, { role?: string }][]).filter(([, w]) => re.test(w?.role ?? "")).map(([k]) => k)[0];
  const anchorWall = wallOfRole(/sofa|bed|table|desk/i) ?? "A";
  const windowWall = wallOfRole(/window/i) ?? s.placements.find((p) => p.kind === "windows")?.wall ?? "C";
  const entryWall = wallOfRole(/entry/i) ?? s.placements.find((p) => p.kind === "doors")?.wall ?? "D";
  const keepWall = s.keeping[0]?.wall ?? "B";

  if (s.anchor) {
    const colour = word(s.anchor.material);
    rows.push({ id: "anchor", tab: "furniture", name: cap(`${colour && colour !== s.anchor.shape.toLowerCase() ? colour + " " : ""}${s.anchor.shape.toLowerCase()} ${s.anchor.kind}`), qty: "1", size: dims(s.anchor), wall: anchorWall, action: "Buy", status: "Fit TBC", ...sw(0) });
  }
  if (s.accent && s.accent.decision !== "skip")
    rows.push({ id: "accent", tab: "furniture", name: s.accent.name.replace("statement", "accent"), qty: "1", size: "80 × 85 × 85", wall: s.accent.wall ?? windowWall, action: "Buy", status: "Fit TBC", ...sw(1) });
  const sup = s.supporting.map((x) => x.name);
  for (const [i, n] of sup.entries()) {
    const size = /coffee/i.test(n) ? "110 × 65 × 38" : /side/i.test(n) ? "Ø 45 × H 50" : /console/i.test(n) ? "100 × 30 × 80" : "Example size";
    const wall = /coffee/i.test(n) ? "Centre" : /side/i.test(n) ? s.accent?.wall ?? windowWall : /console/i.test(n) ? entryWall : "TBC";
    rows.push({ id: `sup${i}`, tab: "furniture", name: /console/i.test(n) ? "Slim console" : n, qty: "1", size, wall, action: "Buy", status: "Fit TBC", ...sw(i === 1 ? metalI : woodI) });
  }
  for (const k of s.keeping) {
    const set = !!k.extraLabel;
    rows.push({
      id: `keep-${k.id}`,
      tab: "furniture",
      name: `${k.status === "buy" ? "Your pick:" : k.status === "bought" ? "Bought" : "Existing"} ${k.name.toLowerCase().replace(/^upright /, "")}${set ? ` + ${k.extraLabel!.split(" ")[0].toLowerCase()}` : ""}`,
      qty: set ? "1 set" : "1",
      size: k.measured ? `${dims(k)}` : "Measure actual W × D × H",
      wall: k.wall ?? keepWall,
      action: k.status === "buy" ? "Buy" : "Keep",
      status: k.status === "buy" ? "You buy it" : k.status === "bought" ? "Arriving" : "required",
      image: k.photos[0],
      colour: "#4A3022",
    });
  }
  const furnRead = (s.preview?.read ?? []).find((r) => r.key === "furniture")?.keywords.join(" ").toLowerCase() ?? "";
  if (/shelv/.test(furnRead)) {
    const wood = (pal[woodI]?.material ?? "walnut").split(" ").slice(-1)[0].toLowerCase();
    const metal = word(pal[metalI]?.material?.split(" ").slice(-1)[0] ?? "brass");
    rows.push({ id: "builtin", tab: "furniture", name: `${cap(wood)} shelving + ${metal} inset`, qty: "1 set", size: "Wall width × depth × height TBC", wall: anchorWall, action: "Custom", status: "Quote TBC", ...sw(woodI) });
  }
  const lay = s.layouts[s.chosenLayout ?? 0];
  if (lay?.items.some((i) => i.kind === "rug")) rows.push({ id: "rug", tab: "furniture", name: "Rug", qty: "1", size: "240 × 340", wall: "Centre", action: "Buy", status: "Layout TBC", colour: "#A4462F" });
  if (s.placements.some((p) => p.kind === "windows")) rows.push({ id: "curtains", tab: "furniture", name: "Curtains + track", qty: "1 set", size: "Track width, drop, fullness TBC", wall: windowWall, action: "Buy", status: "Measure first", ...sw(0) });
  // Pieces swapped for the person's own on step 8.
  for (const [w, plan] of Object.entries(walls) as [Wall, { items?: { name: string; action: string }[] }][])
    for (const it of plan?.items ?? []) if (it.action === "Use mine") rows.push({ id: `mine-${w}-${it.name}`, tab: "furniture", name: it.name, qty: "1", size: /mirror/i.test(it.name) ? "Ø 80" : "Your own", wall: w, action: "Keep · yours", colour: "#C4A060" });
  const decor = (s.preview?.read ?? []).find((r) => r.key === "decor")?.keywords.join(" ").toLowerCase() ?? "";
  rows.push({ id: "art", tab: "furniture", name: "Artwork", qty: "1–2", size: "Example 80 × 100 each", wall: keepWall, action: "Own or buy", colour: "#2F5B4A" });
  if (/cushion/.test(decor) || s.anchor?.kind === "sofa") rows.push({ id: "cushions", tab: "furniture", name: "Cushions", qty: "4", size: "45 × 45 or 50 × 50", wall: anchorWall, action: "Buy or keep", colour: "#6E3550" });
  if (/plant/.test(decor) || /greenery|plant/.test(s.moodboard?.feels.join(" ") ?? "")) rows.push({ id: "plants", tab: "furniture", name: "Plants + pots", qty: "2–4", size: "Pot Ø 25–35, height TBC", wall: `${anchorWall}, ${windowWall}`, action: "Buy or keep", colour: "#4F7A4A" });
  if (/ceramic|vase|object|book/.test(decor)) rows.push({ id: "ceramics", tab: "furniture", name: "Ceramics & decor", qty: "Small set", size: "Objects 15–30 high", wall: anchorWall, action: "Buy or keep", colour: "#B4572E" });

  // Finishes, lighting & electrical
  const wallMat = pal[wallI]?.material ?? pal[wallI]?.name ?? "Wall paint";
  rows.push({ id: "f-wall", tab: "finishes", name: wallMat, qty: "m² TBC", size: "Wall area after survey", wall: "A, D", action: "Buy", status: "Measure first", ...sw(wallI) });
  rows.push({ id: "f-wall2", tab: "finishes", name: "Wall paint · second colour", qty: "m² TBC", size: "Wall area after survey", wall: "B, C", action: "Buy", status: "Measure first", colour: "#B6AC9E" });
  if (s.houseState === "core-shell" || s.houseState === "redoing")
    rows.push({ id: "f-floor", tab: "finishes", name: `${cap((pal[woodI]?.material ?? "oak").split(" ").slice(-1)[0].toLowerCase())} flooring`, qty: "m² TBC", size: "Room area + 10%", wall: "Floor", action: "Buy", status: "Measure first", ...sw(woodI) });
  for (const l of s.lighting?.layers ?? []) rows.push({ id: `l-${l.key}`, tab: "finishes", name: l.decision === "change" && l.change ? l.change : l.name, qty: "1", size: l.key === "overall" ? "Drop TBC" : "Example size", wall: l.key === "overall" ? "Ceiling" : l.key === "task" ? s.accent?.wall ?? windowWall : keepWall, action: "Buy", status: "Spec TBC", ...sw(metalI) });
  if (Object.values(walls).some((w) => w?.items?.some((i) => i.name === "Wall sconce"))) rows.push({ id: "l-sconce", tab: "finishes", name: "Wall sconce", qty: "1", size: "Example size", wall: entryWall, action: "Buy", status: "Spec TBC", ...sw(metalI) });
  rows.push({ id: "e-sockets", tab: "finishes", name: "Sockets", qty: s.lighting?.sockets ? String(s.lighting.sockets) : "TBC", size: "Standard plate", wall: "All", action: "Buy", status: "Electrician", ...sw(metalI) });
  rows.push({ id: "e-switch", tab: "finishes", name: s.lighting?.dimmer ? "Switch + dimmer" : "Switches", qty: s.lighting?.switches ? String(s.lighting.switches) : "TBC", size: "Standard plate", wall: entryWall, action: "Buy", status: "Electrician", ...sw(metalI) });
  if (s.lighting?.blind) rows.push({ id: "e-blind", tab: "finishes", name: "Blind power", qty: "1", size: "Outlet", wall: windowWall, action: "Buy", status: "Electrician", ...sw(metalI) });
  if (s.houseState === "core-shell" || s.houseState === "redoing" || s.allowInWalls) rows.push({ id: "e-ac", tab: "finishes", name: "AC unit", qty: "1", size: "Indoor unit · size TBC", wall: anchorWall, action: "Buy", status: "Position TBC", colour: "#7C9AA8" });
  if (s.samplesAdded) rows.push({ id: "samples", tab: "finishes", name: "Material samples", qty: String(pal.length), size: "Sample size", wall: "—", action: "Buy", status: "Order first", ...sw(0) });
  return rows;
}

/** The composed list with the person's own edits (sizes, where each piece comes from) applied. */
export function buyList(s: JourneyState): BuyRow[] {
  const edits = s.buyEdits ?? {};
  return composeBuyList(s).map((r) => {
    const e = edits[r.id];
    if (!e) return r;
    const action = (e.action as Action) ?? r.action;
    return { ...r, size: e.size ?? r.size, action, status: e.action ? statusFor(action, r) : r.status };
  });
}

export function tally(rows: BuyRow[]) {
  return {
    toBuy: rows.filter((r) => r.action === "Buy").length,
    keeping: rows.filter((r) => r.action === "Keep" || r.action === "Keep · yours" || r.action === "Buy or keep").length,
    custom: rows.filter((r) => r.action === "Custom").length,
  };
}

export const toCsv = (rows: BuyRow[]) =>
  ["Item,Qty,Size (cm),Wall,Action,Status", ...rows.map((r) => [r.name, r.qty, r.size, r.wall, r.action, r.status ?? ""].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
