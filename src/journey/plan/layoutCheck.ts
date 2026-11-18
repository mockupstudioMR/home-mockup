/**
 * Measured facts about one layout on the real room: piece sizes in cm, which wall each piece stands against, why it
 * is there, and the fit checks shown on the layout screen (door swing, window, walking route, sofa-to-table gap,
 * kept pieces). Layout items are in percent of the room's inside (x from wall D, y from wall A).
 */
import type { JourneyState, LayoutItem, Placement, Wall } from "../state";

export type Rect = { x: number; y: number; w: number; h: number }; // cm
export type Check = { ok: boolean; value: string; label: string; /** A one-tap fix the screen can offer. */ fix?: "onto-walls" };
export type PieceInfo = { item: LayoutItem; n: number; size: string; where: string; why: string; kept: boolean };

const DOOR_CM = 85;
const WINDOW_CM = 120;
const ROUTE_CM = 90;

/** An item's footprint in cm. */
export const cmRect = (i: { x: number; y: number; w: number; h: number }, wM: number, lM: number): Rect => ({
  x: (i.x / 100) * wM * 100,
  y: (i.y / 100) * lM * 100,
  w: (i.w / 100) * wM * 100,
  h: (i.h / 100) * lM * 100,
});

const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

/** Distance from a rect to each wall, in cm. */
function wallGaps(r: Rect, W: number, L: number): Record<Wall, number> {
  return { A: r.y, C: L - (r.y + r.h), D: r.x, B: W - (r.x + r.w) };
}

/** The wall a piece backs onto: the nearer of the two walls along its long side. */
export function nearestWall(r: Rect, W: number, L: number): { wall: Wall; gap: number } {
  const g = wallGaps(r, W, L);
  const pair: Wall[] = r.w >= r.h ? ["A", "C"] : ["D", "B"];
  const wall = g[pair[0]] <= g[pair[1]] ? pair[0] : pair[1];
  return { wall, gap: g[wall] };
}

/** The strip of floor in front of an opening, in cm: its width along the wall and `depth` into the room. */
export function openingZone(p: Placement, W: number, L: number, width: number, depth: number): Rect | null {
  if (!p.wall || p.pos == null) return null;
  const along = p.wall === "A" || p.wall === "C" ? W : L;
  const c = (p.pos / 100) * along;
  const a = Math.max(0, c - width / 2);
  const span = Math.min(along, c + width / 2) - a;
  switch (p.wall) {
    case "A":
      return { x: a, y: 0, w: span, h: depth };
    case "C":
      return { x: a, y: L - depth, w: span, h: depth };
    case "D":
      return { x: 0, y: a, w: depth, h: span };
    default:
      return { x: W - depth, y: a, w: depth, h: span };
  }
}

/** A rect 2 cm smaller on every side, so pieces that only touch don't count as overlapping. */
const shrink = (r: Rect): Rect => ({ x: r.x + 2, y: r.y + 2, w: Math.max(0, r.w - 4), h: Math.max(0, r.h - 4) });
const name = (i: LayoutItem) => (i.label || i.kind).replace(/^\w/, (c) => c.toUpperCase());

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Smallest gap between two rects in cm (0 when they touch or overlap). */
export function gapCm(a: Rect, b: Rect) {
  const dx = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
  const dy = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h));
  return Math.hypot(dx, dy);
}

/**
 * Is there a walking route at least `clear` cm wide from the door to the target zone? Furniture (rugs excluded) is
 * grown by half the route width on a 10 cm grid, and the free cells are flooded from the door.
 */
export function hasRoute(blocks: Rect[], W: number, L: number, from: Rect, to: Rect, clear = ROUTE_CM): boolean {
  const step = 10;
  const cols = Math.max(1, Math.ceil(W / step)), rows = Math.max(1, Math.ceil(L / step));
  const half = clear / 2;
  const free = (cx: number, cy: number) => {
    const x = cx * step + step / 2, y = cy * step + step / 2;
    if (x < half - step || y < half - step || x > W - half + step || y > L - half + step) return false;
    return !blocks.some((b) => x > b.x - half && x < b.x + b.w + half && y > b.y - half && y < b.y + b.h + half);
  };
  const inZone = (cx: number, cy: number, z: Rect) => {
    const x = cx * step + step / 2, y = cy * step + step / 2;
    return x >= z.x - half && x <= z.x + z.w + half && y >= z.y - half && y <= z.y + z.h + half;
  };
  const seen = new Uint8Array(cols * rows);
  const queue: number[] = [];
  for (let cy = 0; cy < rows; cy++)
    for (let cx = 0; cx < cols; cx++)
      if (inZone(cx, cy, from) && free(cx, cy)) {
        seen[cy * cols + cx] = 1;
        queue.push(cy * cols + cx);
      }
  while (queue.length) {
    const c = queue.shift()!;
    const cx = c % cols, cy = (c - cx) / cols;
    if (inZone(cx, cy, to)) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const k = ny * cols + nx;
      if (seen[k] || !free(nx, ny)) continue;
      seen[k] = 1;
      queue.push(k);
    }
  }
  return false;
}

const TALL = new Set(["storage", "keep", "bed", "other"]);

/** Size, wall and a one-line reason for every piece of a layout. */
export function pieceInfo(s: JourneyState, items: LayoutItem[], wM: number, lM: number): PieceInfo[] {
  const W = wM * 100, L = lM * 100;
  const windows = s.placements.filter((p) => p.kind === "windows" && p.wall);
  const winZones = windows.map((p) => openingZone(p, W, L, WINDOW_CM + 200, 160)).filter(Boolean) as Rect[];
  const seats = items.filter((i) => i.kind === "sofa" || i.kind === "chair").map((i) => cmRect(i, wM, lM));
  return items.map((item, idx) => {
    const r = cmRect(item, wM, lM);
    const { wall, gap } = nearestWall(r, W, L);
    const long = Math.max(r.w, r.h), short = Math.min(r.w, r.h);
    const size = `${round5(long)} × ${round5(short)} cm`;
    const against = gap < 25;
    const where = item.kind === "rug" || item.kind === "table" ? (against ? `by wall ${wall}` : "in the middle of the seating") : against ? `against wall ${wall}` : `near wall ${wall}, ${round5(gap)} cm out`;
    const byWindow = winZones.some((z) => overlaps(r, z));
    const kept = item.kind === "keep";
    const why =
      (item as LayoutItem & { why?: string }).why ??
      (kept
        ? `Yours — it keeps its place on wall ${wall}.`
        : item.kind === "sofa"
          ? `Faces into the room${winZones.length ? " and towards the light" : ""}, with its back to wall ${wall}.`
          : item.kind === "chair"
            ? byWindow
              ? "Gets daylight from the window — good for reading."
              : "An extra seat within talking distance of the sofa."
            : item.kind === "table"
              ? seats.length
                ? `In easy reach: ${round5(Math.min(...seats.map((x) => gapCm(x, r))))} cm from the nearest seat.`
                : "Central and easy to reach."
              : item.kind === "rug"
                ? "Ties the seating into one zone and stops short of the walking route."
                : item.kind === "storage"
                  ? "Shallow and against the wall, out of the walking route."
                  : item.kind === "desk"
                    ? byWindow
                      ? "Side light from the window for work."
                      : `Against wall ${wall}, out of the walking route.`
                    : item.kind === "bed"
                      ? `Headboard against wall ${wall}, with space to walk round it.`
                      : `Against wall ${wall}.`);
    return { item, n: idx + 1, size, where, why, kept };
  });
}

/** The fit checks shown beside the plan. Only checks the room data supports are returned. */
export function layoutChecks(s: JourneyState, items: LayoutItem[], wM: number, lM: number): Check[] {
  const W = wM * 100, L = lM * 100;
  const solid = items.filter((i) => i.kind !== "rug").map((i) => ({ i, r: cmRect(i, wM, lM) }));
  const out: Check[] = [];
  const doors = s.placements.filter((p) => p.kind === "doors" && p.wall && p.pos != null);
  const windows = s.placements.filter((p) => p.kind === "windows" && p.wall && p.pos != null);
  for (const d of doors.slice(0, 1)) {
    const z = openingZone(d, W, L, DOOR_CM, DOOR_CM)!;
    const hit = solid.find(({ r }) => overlaps(r, z));
    out.push(hit ? { ok: false, value: "Blocked", label: `Door swing — move the ${hit.i.label.toLowerCase() || hit.i.kind}` } : { ok: true, value: "Clear", label: `Door swing, ${DOOR_CM} cm` });
    const target = windows[0] ? openingZone(windows[0], W, L, WINDOW_CM, 40)! : { x: W / 2 - 20, y: L / 2 - 20, w: 40, h: 40 };
    const ok = hasRoute(solid.map((x) => x.r), W, L, z, target);
    out.push(ok ? { ok: true, value: `${ROUTE_CM}+ cm`, label: `Route door → ${windows[0] ? "window" : "room"}` } : { ok: false, value: `< ${ROUTE_CM} cm`, label: `Route door → ${windows[0] ? "window" : "room"} is tight` });
  }
  if (windows[0]) {
    const z = openingZone(windows[0], W, L, WINDOW_CM, 40)!;
    const hit = solid.find(({ i, r }) => TALL.has(i.kind) && overlaps(r, z));
    out.push(hit ? { ok: false, value: "Blocked", label: `Window — the ${hit.i.label.toLowerCase() || hit.i.kind} stands in front` } : { ok: true, value: "Free", label: "Window kept clear" });
  }
  // pieces standing on top of each other (a rug under them is fine)
  const clash = solid.flatMap((a, n) => solid.slice(n + 1).filter((b) => overlaps(shrink(a.r), shrink(b.r))).map((b) => [a.i, b.i] as const))[0];
  if (clash) out.push({ ok: false, value: "Overlap", label: `${name(clash[0])} and ${name(clash[1]).toLowerCase()} overlap` });
  const sofa = solid.find(({ i }) => i.kind === "sofa");
  const table = solid.find(({ i }) => i.kind === "table");
  if (sofa && table) {
    const g = Math.round(gapCm(sofa.r, table.r));
    out.push({ ok: g >= 35 && g <= 60, value: `${round5(g)} cm`, label: "Sofa → table · 40–50 ideal" });
  }
  if (s.keeping.length) {
    const placed = items.filter((i) => i.kind === "keep").length;
    const all = placed >= s.keeping.length;
    out.push({ ok: all, value: `${Math.min(placed, s.keeping.length)} of ${s.keeping.length}`, label: all ? "Your pieces placed" : "Your pieces — not all placed" });
  }
  // pieces that belong against a wall but stand out in the room
  const stray = strayPieces(items, wM, lM)[0];
  if (stray) out.unshift({ ok: false, value: `${round5(stray.gap)} cm out`, label: `${name(stray.item)} belongs against a wall`, fix: "onto-walls" });
  const seats = items.filter((i) => i.kind === "sofa").length * 3 + items.filter((i) => i.kind === "chair").length;
  if (seats) out.push({ ok: true, value: `${seats} seats`, label: "Sofa counts as 3" });
  return out.slice(0, 7);
}

/* ---------- pieces that belong against a wall ---------- */

const WALL_BOUND = /tv|media|sideboard|console|book(shelf|case)|shel(f|v)|wardrobe|dresser|cabinet|storage|piano/;
const AGAINST_CM = 40;
/** A piece that only works with its back to a wall (a TV unit, a sideboard, shelving…); kept pieces keep their place. */
export const wallBound = (i: LayoutItem) => i.kind !== "keep" && i.kind !== "rug" && WALL_BOUND.test(`${i.kind} ${i.label}`.toLowerCase());
const isTall = (i: LayoutItem) => TALL.has(i.kind) || /wardrobe|book|shel|piano|cabinet/.test(`${i.kind} ${i.label}`.toLowerCase());

/** Pieces that belong against a wall but stand out in the room, with how far out (cm). */
export function strayPieces(items: LayoutItem[], wM: number, lM: number) {
  const W = wM * 100, L = lM * 100;
  return items.flatMap((item, n) => {
    if (!wallBound(item)) return [];
    const r = cmRect(item, wM, lM), g = wallGaps(r, W, L);
    const gap = Math.min(...Object.values(g));
    return gap > AGAINST_CM ? [{ n, item, gap }] : [];
  });
}

/**
 * Moves every piece that belongs against a wall but stands out in the room (a TV unit 2 m out, say) onto a wall:
 * a TV or media unit onto the wall facing the sofa when it can, anything else onto the nearest wall. Along that
 * wall it goes as close to where it was as it can while keeping the door swing (plus a margin), a window (for
 * tall pieces), the other pieces and the walking route clear. A piece that fits nowhere stays where it is.
 */
export function moveOntoWalls(s: JourneyState, items: LayoutItem[], wM: number, lM: number): { items: LayoutItem[]; moved: string[] } {
  const W = wM * 100, L = lM * 100;
  const out = items.map((i) => ({ ...i }));
  const moved: string[] = [];
  const doors = s.placements.filter((p) => p.kind === "doors" && p.wall && p.pos != null);
  const windows = s.placements.filter((p) => p.kind === "windows" && p.wall && p.pos != null);
  const doorZones = doors.map((d) => openingZone(d, W, L, DOOR_CM + 30, DOOR_CM + 10)!).filter(Boolean);
  const winZones = windows.map((d) => openingZone(d, W, L, WINDOW_CM, 40)!).filter(Boolean);
  const sofa = out.find((i) => i.kind === "sofa");
  const sofaWall = sofa ? nearestWall(cmRect(sofa, wM, lM), W, L).wall : undefined;
  const OPP: Record<Wall, Wall> = { A: "C", C: "A", B: "D", D: "B" };
  const FACE: Record<Wall, NonNullable<LayoutItem["facing"]>> = { A: "down", C: "up", D: "right", B: "left" };
  for (const { n, item } of strayPieces(out, wM, lM)) {
    const r = cmRect(item, wM, lM), long = Math.max(r.w, r.h), deep = Math.min(r.w, r.h);
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const g = wallGaps(r, W, L);
    const media = /tv|media/.test(`${item.kind} ${item.label}`.toLowerCase());
    const walls = (["A", "B", "C", "D"] as Wall[]).sort((a, b) => g[a] - g[b]);
    if (media && sofaWall) walls.sort((a, b) => Number(b === OPP[sofaWall]) - Number(a === OPP[sofaWall]));
    const others = out.filter((_, k) => k !== n && out[k].kind !== "rug").map((o) => cmRect(o, wM, lM));
    const doorZ = doorZones[0];
    const fits = (c: Rect) =>
      c.x >= 0 && c.y >= 0 && c.x + c.w <= W && c.y + c.h <= L &&
      !doorZones.some((z) => overlaps(c, z)) &&
      !(isTall(item) && winZones.some((z) => overlaps(c, z))) &&
      !others.some((o) => overlaps(shrink(c), shrink(o)));
    let best: Rect | null = null;
    for (const w of walls) {
      const across = w === "A" || w === "C", len = across ? W : L;
      const at = across ? cx : cy;
      const rect = (c: number): Rect => {
        const a = Math.max(0, Math.min(len - long, c - long / 2));
        return w === "A" ? { x: a, y: 2, w: long, h: deep } : w === "C" ? { x: a, y: L - deep - 2, w: long, h: deep }
          : w === "D" ? { x: 2, y: a, w: deep, h: long } : { x: W - deep - 2, y: a, w: deep, h: long };
      };
      const tries = Array.from({ length: Math.ceil(len / 10) * 2 + 1 }, (_, k) => at + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 10);
      for (const c of tries) {
        const cand = rect(c);
        if (!fits(cand)) continue;
        // and the walking route from the door still works with it there
        if (doorZ) {
          const target = windows[0] ? openingZone(windows[0], W, L, WINDOW_CM, 40)! : { x: W / 2 - 20, y: L / 2 - 20, w: 40, h: 40 };
          if (!hasRoute([...others, cand], W, L, doorZ, target)) continue;
        }
        best = cand;
        break;
      }
      if (best) {
        out[n] = { ...item, x: (best.x / W) * 100, y: (best.y / L) * 100, w: (best.w / W) * 100, h: (best.h / L) * 100, facing: FACE[w] };
        moved.push(item.label || item.kind);
        break;
      }
    }
  }
  return { items: out, moved };
}
