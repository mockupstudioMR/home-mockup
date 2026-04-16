import React from "react";

// Top-down illustrated furniture in the brand palette (salmon/lilac/sage + warm wood).
// Each piece is a fully grouped functional element rendered as SVG.
// Coordinates are in SVG user-space; the parent provides x,y,w,h.

interface FurnitureProps {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

// Palette
const WOOD_LIGHT = "hsl(28 45% 68%)";
const WOOD = "hsl(25 42% 55%)";
const WOOD_DARK = "hsl(22 38% 42%)";
const LILAC = "hsl(280 35% 80%)";
const LILAC_DEEP = "hsl(280 30% 68%)";
const LINEN = "hsl(40 30% 96%)";
const LINEN_SHADOW = "hsl(35 18% 88%)";
const SAGE = "hsl(140 25% 58%)";
const SAGE_LIGHT = "hsl(140 30% 75%)";
const SALMON = "hsl(15 55% 78%)";
const OUTLINE = "hsl(25 25% 30% / 0.55)";
const SHADOW = "hsl(25 25% 20% / 0.18)";

function has(label: string, keywords: string[]): boolean {
  const l = label.toLowerCase();
  return keywords.some((k) => l.includes(k));
}

function Bed({ x, y, w, h }: Omit<FurnitureProps, "label">) {
  // Headboard at top, mattress, duvet, two pillows
  const headH = h * 0.08;
  const pillowY = y + headH + h * 0.04;
  const pillowH = h * 0.18;
  const pillowW = (w - h * 0.12) / 2 - h * 0.02;
  const duvetY = pillowY + pillowH + h * 0.02;
  return (
    <g>
      {/* shadow */}
      <rect x={x + 2} y={y + 4} width={w} height={h} rx={3} fill={SHADOW} />
      {/* mattress base */}
      <rect x={x} y={y} width={w} height={h} rx={3} fill={LINEN} stroke={OUTLINE} strokeWidth={0.6} />
      {/* headboard */}
      <rect x={x + h * 0.04} y={y} width={w - h * 0.08} height={headH} rx={2} fill={LILAC_DEEP} stroke={OUTLINE} strokeWidth={0.5} />
      {/* pillows */}
      <rect x={x + h * 0.06} y={pillowY} width={pillowW} height={pillowH} rx={2} fill="white" stroke={OUTLINE} strokeWidth={0.5} />
      <rect x={x + h * 0.06 + pillowW + h * 0.04} y={pillowY} width={pillowW} height={pillowH} rx={2} fill="white" stroke={OUTLINE} strokeWidth={0.5} />
      {/* duvet (lilac) */}
      <rect x={x + h * 0.04} y={duvetY} width={w - h * 0.08} height={y + h - duvetY - h * 0.02} rx={2} fill={LILAC} stroke={OUTLINE} strokeWidth={0.5} />
      {/* duvet folds */}
      <path d={`M${x + h * 0.08},${duvetY + h * 0.08} Q${x + w / 2},${duvetY + h * 0.18} ${x + w - h * 0.08},${duvetY + h * 0.08}`} stroke={LILAC_DEEP} strokeWidth={0.4} fill="none" opacity={0.6} />
      <path d={`M${x + h * 0.08},${duvetY + h * 0.22} Q${x + w / 2},${duvetY + h * 0.32} ${x + w - h * 0.08},${duvetY + h * 0.22}`} stroke={LILAC_DEEP} strokeWidth={0.4} fill="none" opacity={0.5} />
    </g>
  );
}

function Nightstand({ x, y, w, h }: Omit<FurnitureProps, "label">) {
  return (
    <g>
      <rect x={x + 1} y={y + 2} width={w} height={h} rx={1.5} fill={SHADOW} />
      <rect x={x} y={y} width={w} height={h} rx={1.5} fill={WOOD_LIGHT} stroke={OUTLINE} strokeWidth={0.5} />
      {/* drawer line */}
      <line x1={x + w * 0.1} y1={y + h * 0.45} x2={x + w * 0.9} y2={y + h * 0.45} stroke={WOOD_DARK} strokeWidth={0.4} opacity={0.6} />
      {/* handle */}
      <rect x={x + w * 0.35} y={y + h * 0.5} width={w * 0.3} height={h * 0.06} rx={0.5} fill={WOOD_DARK} opacity={0.7} />
    </g>
  );
}

function Lamp({ x, y, w, h }: Omit<FurnitureProps, "label">) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) * 0.4;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={LINEN} stroke={OUTLINE} strokeWidth={0.5} />
      <circle cx={cx} cy={cy} r={r * 0.45} fill={SALMON} opacity={0.85} />
      <circle cx={cx} cy={cy} r={r * 0.18} fill={WOOD_DARK} />
    </g>
  );
}

function Wardrobe({ x, y, w, h }: Omit<FurnitureProps, "label">) {
  // True top-down: a slim cabinet (depth ~60cm) with hanging rod line and door-swing arcs.
  const horiz = w >= h;
  const depth = horiz ? h : w; // the "thin" axis = depth from wall
  const length = horiz ? w : h; // the "long" axis = run along wall
  const doors = Math.max(2, Math.min(4, Math.round(length / Math.max(depth * 1.2, 1))));
  return (
    <g>
      {/* shadow */}
      <rect x={x + 1} y={y + 2} width={w} height={h} rx={0.5} fill={SHADOW} />
      {/* cabinet body (top of carcass) */}
      <rect x={x} y={y} width={w} height={h} rx={0.5} fill={WOOD} stroke={OUTLINE} strokeWidth={0.6} />
      {/* inner hanging rod line, parallel to the wall side */}
      {horiz ? (
        <line x1={x + depth * 0.15} y1={y + depth * 0.5} x2={x + w - depth * 0.15} y2={y + depth * 0.5} stroke={WOOD_DARK} strokeWidth={0.5} opacity={0.7} strokeDasharray="2 1.5" />
      ) : (
        <line x1={x + depth * 0.5} y1={y + depth * 0.15} x2={x + depth * 0.5} y2={y + h - depth * 0.15} stroke={WOOD_DARK} strokeWidth={0.5} opacity={0.7} strokeDasharray="2 1.5" />
      )}
      {/* front edge highlight (where doors meet the room) */}
      {horiz ? (
        <line x1={x} y1={y + h} x2={x + w} y2={y + h} stroke={WOOD_LIGHT} strokeWidth={0.6} opacity={0.9} />
      ) : (
        <line x1={x + w} y1={y} x2={x + w} y2={y + h} stroke={WOOD_LIGHT} strokeWidth={0.6} opacity={0.9} />
      )}
      {/* door dividers */}
      {Array.from({ length: doors - 1 }).map((_, i) => {
        const t = (i + 1) / doors;
        return horiz ? (
          <line key={i} x1={x + w * t} y1={y} x2={x + w * t} y2={y + h} stroke={WOOD_DARK} strokeWidth={0.3} opacity={0.5} />
        ) : (
          <line key={i} x1={x} y1={y + h * t} x2={x + w} y2={y + h * t} stroke={WOOD_DARK} strokeWidth={0.3} opacity={0.5} />
        );
      })}
      {/* door-swing arcs (subtle) showing this is a wardrobe opening outward */}
      {Array.from({ length: doors }).map((_, i) => {
        const seg = (horiz ? w : h) / doors;
        const r = seg * 0.9;
        if (horiz) {
          const x0 = x + seg * i;
          const cx = x0;
          const cy = y + h;
          return (
            <path
              key={i}
              d={`M ${cx} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`}
              fill="none"
              stroke={WOOD_DARK}
              strokeWidth={0.25}
              opacity={0.45}
              strokeDasharray="1.5 1.5"
            />
          );
        }
        const y0 = y + seg * i;
        const cx = x + w;
        const cy = y0;
        return (
          <path
            key={i}
            d={`M ${cx} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy + r}`}
            fill="none"
            stroke={WOOD_DARK}
            strokeWidth={0.25}
            opacity={0.45}
            strokeDasharray="1.5 1.5"
          />
        );
      })}
    </g>
  );
}

function Armchair({ x, y, w, h }: Omit<FurnitureProps, "label">) {
  return (
    <g>
      <rect x={x + 1} y={y + 2} width={w} height={h} rx={3} fill={SHADOW} />
      {/* outer body */}
      <rect x={x} y={y} width={w} height={h} rx={4} fill={LILAC_DEEP} stroke={OUTLINE} strokeWidth={0.6} />
      {/* seat cushion */}
      <rect x={x + w * 0.12} y={y + h * 0.32} width={w * 0.76} height={h * 0.6} rx={3} fill={LILAC} stroke={OUTLINE} strokeWidth={0.4} />
      {/* back cushion */}
      <rect x={x + w * 0.18} y={y + h * 0.06} width={w * 0.64} height={h * 0.28} rx={3} fill="white" opacity={0.85} stroke={OUTLINE} strokeWidth={0.4} />
    </g>
  );
}

function Sofa({ x, y, w, h }: Omit<FurnitureProps, "label">) {
  const horiz = w >= h;
  if (horiz) {
    return (
      <g>
        <rect x={x + 1} y={y + 2} width={w} height={h} rx={3} fill={SHADOW} />
        <rect x={x} y={y} width={w} height={h} rx={4} fill={LILAC_DEEP} stroke={OUTLINE} strokeWidth={0.6} />
        {/* back cushion */}
        <rect x={x + h * 0.18} y={y + h * 0.06} width={w - h * 0.36} height={h * 0.28} rx={2} fill="white" opacity={0.85} stroke={OUTLINE} strokeWidth={0.4} />
        {/* seat cushions */}
        {[0, 1, 2].map((i) => (
          <rect key={i} x={x + h * 0.18 + ((w - h * 0.36) / 3) * i + 1} y={y + h * 0.38} width={(w - h * 0.36) / 3 - 2} height={h * 0.55} rx={2} fill={LILAC} stroke={OUTLINE} strokeWidth={0.4} />
        ))}
      </g>
    );
  }
  // vertical
  return (
    <g>
      <rect x={x + 1} y={y + 2} width={w} height={h} rx={3} fill={SHADOW} />
      <rect x={x} y={y} width={w} height={h} rx={4} fill={LILAC_DEEP} stroke={OUTLINE} strokeWidth={0.6} />
      <rect x={x + w * 0.06} y={y + w * 0.18} width={w * 0.28} height={h - w * 0.36} rx={2} fill="white" opacity={0.85} stroke={OUTLINE} strokeWidth={0.4} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={x + w * 0.38} y={y + w * 0.18 + ((h - w * 0.36) / 3) * i + 1} width={w * 0.55} height={(h - w * 0.36) / 3 - 2} rx={2} fill={LILAC} stroke={OUTLINE} strokeWidth={0.4} />
      ))}
    </g>
  );
}

function CoffeeTable({ x, y, w, h }: Omit<FurnitureProps, "label">) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) / 2;
  return (
    <g>
      <ellipse cx={cx + 1} cy={cy + 2} rx={r} ry={r * (h / w)} fill={SHADOW} />
      <ellipse cx={cx} cy={cy} rx={r} ry={r * (h / w)} fill={WOOD_LIGHT} stroke={OUTLINE} strokeWidth={0.6} />
      <ellipse cx={cx} cy={cy} rx={r * 0.7} ry={r * (h / w) * 0.7} fill="none" stroke={WOOD_DARK} strokeWidth={0.3} opacity={0.4} />
    </g>
  );
}

function Rug({ x, y, w, h }: Omit<FurnitureProps, "label">) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={2} fill={LINEN} stroke={LINEN_SHADOW} strokeWidth={0.6} />
      <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} rx={1.5} fill="none" stroke={LINEN_SHADOW} strokeWidth={0.4} strokeDasharray="2 2" opacity={0.7} />
    </g>
  );
}

function Plant({ x, y, w, h }: Omit<FurnitureProps, "label">) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.min(w, h) / 2;
  return (
    <g>
      {/* pot */}
      <circle cx={cx} cy={cy} r={r * 0.95} fill={LINEN} stroke={OUTLINE} strokeWidth={0.5} />
      {/* leaves */}
      <circle cx={cx - r * 0.35} cy={cy - r * 0.25} r={r * 0.45} fill={SAGE} opacity={0.95} />
      <circle cx={cx + r * 0.35} cy={cy - r * 0.15} r={r * 0.4} fill={SAGE_LIGHT} opacity={0.95} />
      <circle cx={cx} cy={cy + r * 0.3} r={r * 0.45} fill={SAGE} opacity={0.95} />
      <circle cx={cx} cy={cy} r={r * 0.18} fill={WOOD_DARK} opacity={0.6} />
    </g>
  );
}

function TVUnit({ x, y, w, h }: Omit<FurnitureProps, "label">) {
  return (
    <g>
      <rect x={x + 1} y={y + 2} width={w} height={h} rx={1} fill={SHADOW} />
      <rect x={x} y={y} width={w} height={h} rx={1} fill={WOOD} stroke={OUTLINE} strokeWidth={0.5} />
      <rect x={x + w * 0.05} y={y + h * 0.2} width={w * 0.9} height={h * 0.6} rx={0.5} fill={WOOD_DARK} opacity={0.7} />
      <line x1={x + w / 2} y1={y + h * 0.2} x2={x + w / 2} y2={y + h * 0.8} stroke={WOOD_LIGHT} strokeWidth={0.4} opacity={0.5} />
    </g>
  );
}

function Bookshelf({ x, y, w, h }: Omit<FurnitureProps, "label">) {
  const shelves = 4;
  return (
    <g>
      <rect x={x + 1} y={y + 2} width={w} height={h} rx={1} fill={SHADOW} />
      <rect x={x} y={y} width={w} height={h} rx={1} fill={WOOD} stroke={OUTLINE} strokeWidth={0.5} />
      {Array.from({ length: shelves - 1 }).map((_, i) => {
        const horiz = w >= h;
        return horiz
          ? <line key={i} x1={x + (w / shelves) * (i + 1)} y1={y + h * 0.1} x2={x + (w / shelves) * (i + 1)} y2={y + h * 0.9} stroke={WOOD_DARK} strokeWidth={0.4} opacity={0.5} />
          : <line key={i} x1={x + w * 0.1} y1={y + (h / shelves) * (i + 1)} x2={x + w * 0.9} y2={y + (h / shelves) * (i + 1)} stroke={WOOD_DARK} strokeWidth={0.4} opacity={0.5} />;
      })}
    </g>
  );
}

function DiningTable({ x, y, w, h }: Omit<FurnitureProps, "label">) {
  return (
    <g>
      <rect x={x + 1} y={y + 2} width={w} height={h} rx={3} fill={SHADOW} />
      <rect x={x} y={y} width={w} height={h} rx={3} fill={WOOD_LIGHT} stroke={OUTLINE} strokeWidth={0.6} />
      <rect x={x + w * 0.05} y={y + h * 0.05} width={w * 0.9} height={h * 0.9} rx={2} fill="none" stroke={WOOD_DARK} strokeWidth={0.3} opacity={0.4} />
    </g>
  );
}

function Chair({ x, y, w, h }: Omit<FurnitureProps, "label">) {
  return (
    <g>
      <rect x={x + 1} y={y + 1} width={w} height={h} rx={1.5} fill={SHADOW} />
      <rect x={x} y={y} width={w} height={h} rx={1.5} fill={WOOD_LIGHT} stroke={OUTLINE} strokeWidth={0.5} />
      <rect x={x + w * 0.1} y={y + h * 0.1} width={w * 0.8} height={h * 0.4} rx={1} fill={LILAC} opacity={0.8} />
    </g>
  );
}

function Desk({ x, y, w, h }: Omit<FurnitureProps, "label">) {
  return (
    <g>
      <rect x={x + 1} y={y + 2} width={w} height={h} rx={1} fill={SHADOW} />
      <rect x={x} y={y} width={w} height={h} rx={1} fill={WOOD_LIGHT} stroke={OUTLINE} strokeWidth={0.5} />
      <rect x={x + w * 0.6} y={y + h * 0.15} width={w * 0.3} height={h * 0.5} rx={0.5} fill={WOOD_DARK} opacity={0.5} />
    </g>
  );
}

function GenericBox({ x, y, w, h, label }: FurnitureProps) {
  return (
    <g>
      <rect x={x + 1} y={y + 2} width={w} height={h} rx={2} fill={SHADOW} />
      <rect x={x} y={y} width={w} height={h} rx={2} fill={SALMON} opacity={0.7} stroke={OUTLINE} strokeWidth={0.5} />
      <text x={x + w / 2} y={y + h / 2 + 2} textAnchor="middle" fontSize={Math.min(w, h) * 0.18} fill={OUTLINE}>
        {label.split(" ")[0]}
      </text>
    </g>
  );
}

export function IllustratedFurniture(props: FurnitureProps) {
  const { label } = props;

  if (has(label, ["bed", "matress", "mattress"]) && !has(label, ["bedside", "nightstand"])) return <Bed {...props} />;
  if (has(label, ["nightstand", "bedside", "side table"])) return <Nightstand {...props} />;
  if (has(label, ["lamp"])) return <Lamp {...props} />;
  if (has(label, ["wardrobe", "closet", "dresser", "chest of drawers"])) return <Wardrobe {...props} />;
  if (has(label, ["armchair", "lounge chair", "accent chair"])) return <Armchair {...props} />;
  if (has(label, ["sofa", "couch", "settee"])) return <Sofa {...props} />;
  if (has(label, ["coffee table", "side table", "round table"])) return <CoffeeTable {...props} />;
  if (has(label, ["rug", "carpet", "mat"])) return <Rug {...props} />;
  if (has(label, ["plant", "planter", "tree"])) return <Plant {...props} />;
  if (has(label, ["tv", "television", "media", "console"])) return <TVUnit {...props} />;
  if (has(label, ["bookshelf", "shelf", "shelves", "bookcase"])) return <Bookshelf {...props} />;
  if (has(label, ["dining table"])) return <DiningTable {...props} />;
  if (has(label, ["chair", "stool"])) return <Chair {...props} />;
  if (has(label, ["desk"])) return <Desk {...props} />;

  return <GenericBox {...props} />;
}

// Legend showing each unique furniture type with a small swatch
export function IllustratedLegend({ items }: { items: string[] }) {
  const unique = Array.from(new Set(items));
  return (
    <div className="flex flex-wrap gap-2 pt-2">
      {unique.map((label) => (
        <div key={label} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-muted/40 border border-border/30">
          <svg width={20} height={16} viewBox="0 0 20 16">
            <IllustratedFurniture x={1} y={1} w={18} h={14} label={label} />
          </svg>
          <span className="text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
