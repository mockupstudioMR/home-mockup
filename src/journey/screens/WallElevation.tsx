/** A wall drawn as an outline (step 5): openings, fixed things, pieces from the layout and numbered pins. */
import type { Outline, OutlinePiece } from "../wallOutline";
import type { WallItem, WallPlan } from "../state";

const INK = "#34203B";
const MUTE = "#9A8C9E";
const PLUM = "#5E4268";
const OK = "#3E5A33";
const BLUE = "#6F98B0";
const ORANGE = "#B4572E";
const WOOD = "rgba(176,132,92,.22)";
const SOFT = "rgba(94,66,104,.06)";
const PAD = { x: 34, top: 26, bottom: 48 };

function PieceShape({ p, selected, image }: { p: OutlinePiece; selected: boolean; image?: string }) {
  const col = p.kept ? OK : PLUM;
  const common = {
    stroke: col,
    strokeWidth: selected ? 3 : 1.8,
    strokeDasharray: p.kept || selected || image ? undefined : "7 5",
    fill: selected ? "rgba(94,66,104,.1)" : SOFT,
    vectorEffect: "non-scaling-stroke" as const,
  };
  const { x, y, w, h } = p;
  if (image) {
    const id = `clip-${p.ref}`;
    return (
      <g>
        <clipPath id={id}>
          <rect x={x} y={y} width={w} height={h} rx={6} />
        </clipPath>
        <image href={image} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id})`} />
        <rect x={x} y={y} width={w} height={h} rx={6} {...common} fill="none" />
      </g>
    );
  }
  const t = `${p.kind} ${p.label}`.toLowerCase();
  const floor = y + h;
  // a chair of a table set seen from the side: back post on the outside, seat towards the table
  if (p.view === "side-left" || p.view === "side-right") {
    const cw = Math.min(w, 55), cx = p.view === "side-left" ? x + w - cw : x, seat = floor - 46;
    const flip = p.view === "side-right" ? `translate(${2 * cx + cw} 0) scale(-1 1)` : undefined;
    return (
      <g transform={flip}>
        <path d={`M${cx + 4} ${floor} L${cx + 7} ${seat} L${cx + 5} ${y + 8} Q${cx + 6} ${y} ${cx + 14} ${y + 2} L${cx + 15} ${seat - 4}`} {...common} fill="none" />
        <path d={`M${cx + 3} ${seat} h${cw - 6} q3 0 3 3 v3 h-${cw - 3} z`} {...common} fill={WOOD} />
        <path d={`M${cx + cw - 7} ${seat + 6} L${cx + cw - 5} ${floor}`} {...common} fill="none" />
      </g>
    );
  }
  // tables and desks: a solid top, an apron and tapered legs
  if (/table|desk/.test(t) && !/bench/.test(t)) {
    const top = Math.min(6, h * 0.12), inset = Math.min(12, w * 0.12), apron = Math.min(10, h * 0.14);
    return (
      <g>
        <rect x={x} y={y} width={w} height={top} rx={2} {...common} fill={selected ? common.fill : WOOD} />
        {w > 70 && <path d={`M${x + inset} ${y + top} h${w - 2 * inset} v${apron} h-${w - 2 * inset} z`} {...common} />}
        <path d={`M${x + inset} ${y + top} h7 l-2 ${h - top} h-3 z M${x + w - inset - 7} ${y + top} h7 l-2 ${h - top} h-3 z`} {...common} fill={WOOD} />
      </g>
    );
  }
  if (/sofa|couch/.test(t))
    return (
      <g>
        <path d={`M${x} ${y + 30} q0 -30 30 -30 h${w - 60} q30 0 30 30 v${h - 30} h-${w} z`} {...common} />
        <path d={`M${x + 18} ${y + h - 12} v-28 h${w - 36} v28`} {...common} fill="none" />
      </g>
    );
  if (/chair|armchair/.test(t))
    return <path d={`M${x + 6} ${y + h} v-40 q0 -${h - 40} ${w / 2 - 6} -${h - 40} q${w / 2 - 6} 0 ${w / 2 - 6} ${h - 40} v40 M${x} ${y + h - 38} h${w}`} {...common} />;
  if (/piano/.test(t))
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} rx={4} {...common} />
        <path d={`M${x} ${y + h * 0.42} h${w}`} {...common} fill="none" />
      </g>
    );
  if (/shel(f|v)|bookcase|wardrobe/.test(t))
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} {...common} />
        {[1, 2, 3, 4].map((k) => <path key={k} d={`M${x} ${y + (k * h) / 5} h${w}`} {...common} fill="none" />)}
      </g>
    );
  if (/bench/.test(t)) return <path d={`M${x} ${y} h${w} M${x + 10} ${y} v${h} M${x + w - 10} ${y} v${h}`} {...common} fill="none" />;
  if (/bed/.test(t))
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} rx={8} {...common} />
        <path d={`M${x} ${y + h - 45} h${w}`} {...common} fill="none" />
      </g>
    );
  return <rect x={x} y={y} width={w} height={h} rx={5} {...common} />;
}

export function WallElevation({ o, wp, selected, onPick, compact = false, labels = false }: {
  o: Outline;
  wp: WallPlan;
  selected?: number;
  onPick?: (n: number) => void;
  /** Small version for the overview cards: no measurements. */
  compact?: boolean;
  labels?: boolean;
}) {
  const L = o.length;
  const H = o.height;
  const vb = `${-PAD.x} ${-PAD.top} ${L + 2 * PAD.x} ${H + PAD.top + (compact ? 14 : PAD.bottom)}`;
  const items = new Map(wp.items.map((i) => [i.n, i]));
  const pieceItem = (p: OutlinePiece): WallItem | undefined => wp.items.find((i) => i.ref === p.ref);
  const r = Math.max(6, H * 0.026);
  const freeNote = o.free?.length ? (
    <p className="small elev-free">
      Free-standing in the room: {o.free.map((f) => `${f.label}, ${(f.gapCm / 100).toFixed(1)} m from this wall`).join(" · ")}
    </p>
  ) : null;
  return (
    <>
    <svg className="elev-svg" viewBox={vb} role="img" aria-label={`Wall ${o.wall}, ${wp.role.toLowerCase()} wall: outline, ${(L / 100).toFixed(2)} m wide, ${(H / 100).toFixed(2)} m high`}>
      <rect x={0} y={0} width={L} height={H} fill="#FFFDFB" stroke={INK} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      <path d={`M${-PAD.x + 6} ${H} H${L + PAD.x - 6}`} stroke={INK} strokeWidth={3} vectorEffect="non-scaling-stroke" />
      <path d={`M0 ${H - 10} H${L}`} stroke={MUTE} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      {o.openings.map((op, k) =>
        op.kind === "window" ? (
          <g key={`o${k}`}>
            <rect x={op.x} y={op.y} width={op.w} height={op.h} fill="rgba(111,152,176,.12)" stroke={BLUE} strokeWidth={2} vectorEffect="non-scaling-stroke" />
            <path d={`M${op.x + op.w / 2} ${op.y} v${op.h} M${op.x} ${op.y + op.h + 8} h${op.w}`} stroke={BLUE} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
          </g>
        ) : (
          <rect key={`o${k}`} x={op.x} y={op.y} width={op.w} height={op.h} fill="rgba(111,152,176,.10)" stroke={BLUE} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        ),
      )}
      {o.fixed.map((f, k) => (
        <rect key={`f${k}`} x={f.x} y={f.y} width={f.w} height={f.h} rx={3} fill="rgba(154,140,158,.08)" stroke={MUTE} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
      ))}
      {/* Each layout box as one soft bracket behind its pieces, with its name, so it reads as one group. */}
      {(o.boxes ?? []).map((b) => (
        <g key={b.key} className="elev-box" aria-label={`${b.label}: shown together`}>
          <rect x={b.x - 8} y={H - b.h - 22} width={b.w + 16} height={b.h + 22} rx={14} fill="rgba(94,66,104,.045)" stroke="rgba(94,66,104,.35)" strokeWidth={1.4} strokeDasharray="2 6" strokeLinecap="round" />
          {!compact && <text x={b.x - 2} y={H - b.h - 30} fontSize={15} fontWeight={600} fill="#6E5F73">{b.label}</text>}
        </g>
      ))}
      {/* Taller pieces first, so a low table in front of a sofa stays visible. */}
      {[...o.pieces].sort((a, b) => b.h - a.h).map((p) => {
        const it = pieceItem(p);
        const sel = !!it && it.n === selected;
        return (
          <g key={p.ref} style={onPick && it ? { cursor: "pointer" } : undefined} onClick={onPick && it ? () => onPick(it.n) : undefined}>
            <PieceShape p={p} selected={sel} image={it?.choice?.image} />
            {labels && !it?.choice?.image && (
              <text x={p.x + p.w / 2} y={p.y + Math.min(p.h / 2, 26) + 5} textAnchor="middle" fontSize={Math.max(12, H * 0.045)} fontWeight={600} fill={p.kept ? OK : PLUM}>
                {p.kept ? "Yours" : p.label}
              </text>
            )}
          </g>
        );
      })}
      {o.points.map((pt, k) => (
        <rect key={`p${k}`} x={pt.x - 7} y={pt.y - 7} width={14} height={14} rx={2.5} fill="#B08D57" stroke="#B08D57" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
      ))}
      {!compact &&
        o.order.map((n, i) => {
          const it = items.get(n);
          const p = o.pins[n];
          if (!it || !p) return null;
          const sel = n === selected;
          const fill = it.group === "inside" ? MUTE : it.choice ? OK : it.added ? ORANGE : sel ? INK : PLUM;
          return (
            <g key={`pin${n}`} style={onPick ? { cursor: "pointer" } : undefined} onClick={onPick ? () => onPick(n) : undefined}>
              <circle cx={p.x} cy={p.y} r={sel ? r * 1.2 : r} fill={fill} stroke="#fff" strokeWidth={3} vectorEffect="non-scaling-stroke" />
              <text x={p.x} y={p.y + r * 0.38} textAnchor="middle" fontSize={r * 1.05} fontWeight={700} fill="#fff">
                {i + 1}
              </text>
            </g>
          );
        })}
      {!compact && (
        <g>
          <path d={`M0 ${H + 26} H${L} M0 ${H + 20} v12 M${L} ${H + 20} v12`} stroke={MUTE} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <rect x={L / 2 - 50} y={H + 15} width={100} height={22} fill="#FBF4EF" />
          <text x={L / 2} y={H + 31} textAnchor="middle" fontSize={Math.max(12, H * 0.045)} fontWeight={700} fill={INK}>
            {L} cm{o.example ? " · example" : ""}
          </text>
        </g>
      )}
    </svg>
    {freeNote}
    </>
  );
}
