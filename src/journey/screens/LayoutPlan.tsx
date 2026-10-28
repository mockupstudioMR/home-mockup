/**
 * The room plan with a layout on it, drawn to scale. One drawing for every place a layout is shown — the big plan on
 * the layout page (editable there) and the small plans on the summaries and in steps 5–7 — so they always match.
 */
import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import type { JourneyState, Layout, LayoutItem, Placement, Wall } from "../state";
import { roomSize } from "../plan/room";
import { keepInside, moveBy } from "../plan/editLayout";
import { fixedMark } from "./Step3";

/** Material texture per kind of piece. */
export const TEX: Record<string, string> = { sofa: "t-sofa", chair: "t-chair", keep: "t-keep", table: "t-table", rug: "t-rug", storage: "t-shelf", bed: "t-bed", desk: "t-table", bench: "t-bench", other: "t-other" };

const m = (n: number) => n.toFixed(2);

/** One opening drawn on the plan: a gap in the wall, plus the swing for a door. `t` is the wall thickness in px. */
function Opening({ p, W, L, t }: { p: Placement; W: number; L: number; t: number }) {
  if (!p.wall || p.pos == null) return null;
  const door = p.kind === "doors";
  const widthM = door ? 0.85 : 1.2;
  const along = p.wall === "A" || p.wall === "C" ? W : L;
  const len = Math.min(100, (widthM / along) * 100);
  const at = Math.min(100 - len, Math.max(0, p.pos - len / 2));
  const horiz = p.wall === "A" || p.wall === "C";
  const gap: CSSProperties = horiz
    ? { left: `${at}%`, width: `${len}%`, [p.wall === "A" ? "top" : "bottom"]: -t, height: t }
    : { top: `${at}%`, height: `${len}%`, [p.wall === "D" ? "left" : "right"]: -t, width: t };
  const swingSize = horiz ? { width: `${len}%`, aspectRatio: "1" } : { height: `${len}%`, aspectRatio: "1" };
  const swing: CSSProperties = horiz ? { left: `${at}%`, [p.wall === "A" ? "top" : "bottom"]: 0, ...swingSize } : { top: `${at}%`, [p.wall === "D" ? "left" : "right"]: 0, ...swingSize };
  return (
    <>
      <span className={door ? "lp-door" : "lp-win"} style={gap} />
      {door && <span className={`lp-swing w${p.wall}`} style={swing} />}
    </>
  );
}

/** Any other fixed feature (radiator, socket, column, water point…) as a lettered mark against its wall. */
function FixedFeature({ p, small }: { p: Placement; small: boolean }) {
  if (!p.wall || p.pos == null) return null;
  const { mark, color, name } = fixedMark(p.kind);
  const size = small ? 8 : p.kind === "radiators" ? 0 : 20;
  const st: CSSProperties = { background: color };
  const along = `${Math.min(96, Math.max(4, p.pos))}%`;
  if (p.kind === "radiators" && !small) {
    // a long, thin bar along the wall
    Object.assign(st, p.wall === "A" || p.wall === "C" ? { width: "16%", height: 8, left: `calc(${along} - 8%)` } : { height: "16%", width: 8, top: `calc(${along} - 8%)` });
  } else {
    Object.assign(st, { width: size, height: size }, p.wall === "A" || p.wall === "C" ? { left: `calc(${along} - ${size / 2}px)` } : { top: `calc(${along} - ${size / 2}px)` });
  }
  Object.assign(st, { A: { top: 2 }, C: { bottom: 2 }, D: { left: 2 }, B: { right: 2 } }[p.wall as Wall]);
  return (
    <span className={`lp-fx${small ? " sm" : ""}`} style={st} title={name} aria-hidden="true">
      {small || p.kind === "radiators" ? "" : mark}
    </span>
  );
}

export type PlanEditing = {
  selected: number | null;
  onSelect: (n: number | null) => void;
  /** A piece was moved or resized on the plan. */
  onChange: (n: number, item: LayoutItem) => void;
};

/**
 * The chosen layout drawn to scale, each piece textured by material and numbered.
 * `max` is the box the room must fit in, in px. `compact` is the small version (no sizes, numbers or wall letters).
 * With `edit`, pieces can be picked, dragged and resized with the corner handle (arrow keys move the picked one).
 */
export function LayoutPlan({ layout, s, max = { w: 440, h: 560 }, compact = false, edit }: { layout: Layout; s: JourneyState; max?: { w: number; h: number }; compact?: boolean; edit?: PlanEditing }) {
  const { w, l } = roomSize(s);
  const t = compact ? Math.max(3, Math.round(Math.min(max.w, max.h) / 30)) : 12;
  const scale = Math.min((max.w - 2 * t) / w, (max.h - 2 * t) / l);
  const W = Math.round(w * scale), H = Math.round(l * scale);
  const pct = (v: number) => `${v}%`;
  const room = useRef<HTMLDivElement>(null);
  // a piece being dragged is drawn from here and saved once, when it's let go
  const [draft, setDraft] = useState<{ n: number; item: LayoutItem } | null>(null);
  const drag = useRef<{ n: number; mode: "move" | "size"; x: number; y: number; start: LayoutItem; moved: boolean } | null>(null);

  const begin = (e: PointerEvent, n: number, mode: "move" | "size") => {
    if (!edit) return;
    e.stopPropagation();
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    edit.onSelect(n);
    drag.current = { n, mode, x: e.clientX, y: e.clientY, start: layout.items[n], moved: false };
  };
  const moveTo = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = ((e.clientX - d.x) / W) * 100, dy = ((e.clientY - d.y) / H) * 100;
    if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 2) d.moved = true;
    const item = d.mode === "move" ? moveBy(d.start, dx, dy) : keepInside({ ...d.start, w: Math.max(2, d.start.w + dx), h: Math.max(2, d.start.h + dy) });
    setDraft({ n: d.n, item });
  };
  const end = () => {
    const d = drag.current;
    drag.current = null;
    if (d && d.moved && draft && draft.n === d.n) edit?.onChange(d.n, draft.item);
    setDraft(null);
  };
  const key = (e: KeyboardEvent, n: number) => {
    if (!edit) return;
    const step = e.shiftKey ? 5 : 1;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    edit.onChange(n, moveBy(layout.items[n], d[0], d[1]));
  };

  const items = layout.items.map((i, n) => (draft?.n === n ? draft.item : i));
  const label = (i: LayoutItem) => i.label || i.kind.replace(/^\w/, (c) => c.toUpperCase());
  return (
    <div
      className={`lp${compact ? " sm" : ""}${edit ? " edit" : ""}`}
      role={edit ? "group" : "img"}
      aria-label={`Floor plan, ${m(w)} by ${m(l)} metres: ${layout.items.map(label).join(", ")}`}
    >
      {!compact && <span className="lp-dim lp-dw">{m(w)} m</span>}
      {!compact && <span className="lp-dim lp-dl">{m(l)} m</span>}
      <div
        ref={room}
        className="lp-room"
        style={{ width: W, height: H, borderWidth: t }}
        onPointerMove={edit ? moveTo : undefined}
        onPointerUp={edit ? end : undefined}
        onPointerCancel={edit ? end : undefined}
        onPointerDown={edit ? () => edit.onSelect(null) : undefined}
      >
        {!compact &&
          (["A", "B", "C", "D"] as Wall[]).map((x) => (
            <b key={x} className={`lp-wl w${x}`}>
              {x}
            </b>
          ))}
        {s.placements
          .filter((p) => p.kind === "doors" || p.kind === "windows")
          .map((p) => (
            <Opening key={p.id} p={p} W={w} L={l} t={t} />
          ))}
        {items
          .map((i, n) => ({ i, n }))
          .sort((a, b) => Number(b.i.kind === "rug") - Number(a.i.kind === "rug"))
          .map(({ i, n }) => {
            const sel = edit?.selected === n;
            const st: CSSProperties = { left: pct(i.x), top: pct(i.y), width: pct(i.w), height: pct(i.h) };
            const num = !compact && <span className={i.kind === "rug" ? "lp-n rug" : "lp-n"}>{n + 1}</span>;
            if (!edit)
              return (
                <div key={n} className={`lp-f ${TEX[i.kind] ?? "t-other"}`} style={st}>
                  {num}
                </div>
              );
            return (
              <div
                key={n}
                role="button"
                tabIndex={0}
                aria-pressed={sel}
                aria-label={`${n + 1}. ${label(i)} — drag to move${sel ? ", arrow keys to nudge" : ""}`}
                className={`lp-f ${TEX[i.kind] ?? "t-other"}${sel ? " sel" : ""}`}
                style={st}
                onPointerDown={(e) => begin(e, n, "move")}
                onKeyDown={(e) => key(e, n)}
                onFocus={() => edit.onSelect(n)}
              >
                {num}
                {sel && <span className="lp-h" aria-hidden="true" onPointerDown={(e) => begin(e, n, "size")} />}
              </div>
            );
          })}
        {s.placements
          .filter((p) => p.kind !== "doors" && p.kind !== "windows")
          .map((p) => (
            <FixedFeature key={p.id} p={p} small={compact} />
          ))}
        {layout.route && (
          <svg className="lp-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line x1={layout.route.x1} y1={layout.route.y1} x2={layout.route.x2} y2={layout.route.y2} vectorEffect="non-scaling-stroke" />
          </svg>
        )}
      </div>
    </div>
  );
}

/** The small plan used on summaries and in steps 5–7: the same drawing as the layout page, fitted in `box`. */
export function PlanDrawing({ layout, s, box = { w: 300, h: 392 } }: { layout: Layout; s: JourneyState; box?: { w: number; h: number }; t?: number; mini?: boolean }) {
  return <LayoutPlan layout={layout} s={s} max={box} compact />;
}
