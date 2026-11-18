/**
 * Builds one vector symbol per furniture set (public/furniture-sets/<key>.svg) from the piece symbols
 * (public/furniture-symbols) and the sets' rules, so a set always looks the way the app places it.
 * Run again after changing a set or a piece symbol:
 *
 *   npx tsx qa/furniture-sets/build-set-symbols.ts
 *
 * Each symbol shows the set from above with its main piece against the top wall (a free-standing set is shown
 * on its own). Pieces that are optional in the set are drawn lighter.
 */
import fs from "node:fs";
import path from "node:path";
import { arrange, type Placed } from "../../supabase/functions/_shared/arrange";
import { DEFAULT_GROUPINGS, DEFAULT_SPECS, type Grouping } from "../../supabase/functions/_shared/layoutRules";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const PIECES = path.join(ROOT, "public/furniture-symbols");
const OUT = path.join(ROOT, "public/furniture-sets");

/** A piece symbol's viewBox and drawing, without its outer <svg>. */
function piece(key: string): { w: number; h: number; body: string } {
  const file = path.join(PIECES, `${key}.svg`);
  const src = fs.readFileSync(fs.existsSync(file) ? file : path.join(PIECES, "generic.svg"), "utf8");
  const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(src)!;
  const body = src.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<!--[\s\S]*?-->/g, "").trim();
  return { w: +vb[1], h: +vb[2], body };
}

const DEG = { down: 0, up: 180, left: 90, right: -90 } as const;
const r1 = (n: number) => Math.round(n * 10) / 10;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

/** One placed piece: its symbol stretched to the piece, turned the way it faces. */
function drawPiece(p: Placed, ox: number, oy: number): string {
  const s = piece(p.symbol ?? "generic");
  const deg = p.facing ? DEG[p.facing] : (s.w >= s.h) !== (p.w >= p.h) && Math.abs(s.w / s.h - 1) > 0.15 ? 90 : 0;
  const quarter = Math.abs(deg) === 90;
  const w = quarter ? p.h : p.w, h = quarter ? p.w : p.h;
  const cx = p.x - ox + p.w / 2, cy = p.y - oy + p.h / 2;
  const inner = `<svg x="${r1(cx - w / 2)}" y="${r1(cy - h / 2)}" width="${r1(w)}" height="${r1(h)}" viewBox="0 0 ${s.w} ${s.h}" preserveAspectRatio="none" overflow="visible">${s.body}</svg>`;
  return `<g${deg ? ` transform="rotate(${deg} ${r1(cx)} ${r1(cy)})"` : ""}${p.optional ? ' opacity="0.55"' : ""}><title>${esc(p.label)}${p.optional ? " (optional)" : ""}</title>${inner}</g>`;
}

function setSymbol(g: Grouping): string {
  // a room roomy enough for every piece, optional ones included; across-the-room pieces land on the far wall
  // (a free-standing table's sideboard goes on the nearer wall, so its room is shallower)
  const across = g.members.some((m) => m.at === "opposite_wall");
  const W = 700, L = !across ? 700 : g.anchor_place === "floating" ? 330 : 460;
  const a = arrange({ W, L, openings: [], groups: [{ key: g.key, wall: g.anchor_place === "wall" ? "A" : null, along: 50 }], specs: DEFAULT_SPECS, groupings: [g] });
  const items = a.items.sort((p, q) => Number(q.kind === "rug") - Number(p.kind === "rug")); // rugs underneath
  const pad = 14;
  const onWall = g.anchor_place === "wall";
  const farWall = items.some((p) => p.y + p.h >= L - 1);
  const x0 = Math.min(...items.map((p) => p.x)) - pad, x1 = Math.max(...items.map((p) => p.x + p.w)) + pad;
  const y0 = onWall ? -8 : Math.min(...items.map((p) => p.y)) - pad;
  const y1 = farWall ? L + 8 : Math.max(...items.map((p) => p.y + p.h)) + pad;
  const w = r1(x1 - x0), h = r1(y1 - y0);
  const walls = [
    onWall ? `<rect x="0" y="0" width="${w}" height="8" fill="#3B3350"/>` : "",
    farWall ? `<rect x="0" y="${r1(h - 8)}" width="${w}" height="8" fill="#3B3350"/>` : "",
  ].join("");
  const pieces = items.map((p) => drawPiece(p, x0, y0)).join("\n");
  const names = items.filter((p) => !p.optional).map((p) => p.label.toLowerCase());
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(g.name)}">
<!-- Home Mockup furniture set: ${esc(g.name)} (${g.key}). Top view, ${onWall ? "main piece against the top wall" : "free-standing"}; lighter pieces are optional. ${Math.round(w)} × ${Math.round(h)} cm. Built by qa/furniture-sets/build-set-symbols.ts. -->
<title>${esc(g.name)}: ${esc(names.join(", "))}</title>
${walls}
${pieces}
</svg>
`;
}

fs.mkdirSync(OUT, { recursive: true });
for (const g of DEFAULT_GROUPINGS) fs.writeFileSync(path.join(OUT, `${g.key}.svg`), setSymbol(g));
console.log(`${DEFAULT_GROUPINGS.length} set symbols written to public/furniture-sets/`);
