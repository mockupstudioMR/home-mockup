import React from "react";

// Architectural top-view furniture SVG components
// All render within a 0-1 normalized coordinate space, scaled by parent

interface FurnitureProps {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}

const stroke = "hsl(var(--foreground) / 0.7)";
const fill = "hsl(var(--foreground) / 0.08)";
const accent = "hsl(var(--primary) / 0.15)";
const textColor = "hsl(var(--foreground) / 0.55)";

function matchLabel(label: string, keywords: string[]): boolean {
  const l = label.toLowerCase();
  return keywords.some((k) => l.includes(k));
}

export function ArchFurniture({ x, y, w, h, label }: FurnitureProps) {
  const l = label.toLowerCase();

  // Sofa / Couch
  if (matchLabel(l, ["sofa", "couch", "settee"])) {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill={accent} stroke={stroke} strokeWidth={0.8} rx={1.5} />
        {/* Back cushion */}
        <rect x={x + 1} y={y + 1} width={w - 2} height={h * 0.25} fill={stroke} opacity={0.15} rx={1} />
        {/* Seat cushions */}
        <line x1={x + w * 0.33} y1={y + h * 0.3} x2={x + w * 0.33} y2={y + h - 1} stroke={stroke} strokeWidth={0.4} opacity={0.3} />
        <line x1={x + w * 0.66} y1={y + h * 0.3} x2={x + w * 0.66} y2={y + h - 1} stroke={stroke} strokeWidth={0.4} opacity={0.3} />
        {/* Arms */}
        <rect x={x} y={y} width={w * 0.08} height={h} fill={stroke} opacity={0.1} rx={1} />
        <rect x={x + w - w * 0.08} y={y} width={w * 0.08} height={h} fill={stroke} opacity={0.1} rx={1} />
      </g>
    );
  }

  // Armchair / Chair
  if (matchLabel(l, ["armchair", "accent chair", "lounge chair"])) {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill={accent} stroke={stroke} strokeWidth={0.8} rx={2} />
        {/* Back */}
        <rect x={x + 1} y={y + 1} width={w - 2} height={h * 0.22} fill={stroke} opacity={0.15} rx={1} />
        {/* Arms */}
        <rect x={x} y={y} width={w * 0.15} height={h} fill={stroke} opacity={0.1} rx={1} />
        <rect x={x + w - w * 0.15} y={y} width={w * 0.15} height={h} fill={stroke} opacity={0.1} rx={1} />
      </g>
    );
  }

  // Dining/Office Chair
  if (matchLabel(l, ["chair", "dining chair", "office chair", "desk chair"])) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.min(w, h) / 2 - 1;
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={accent} stroke={stroke} strokeWidth={0.7} />
        {/* Back indicator */}
        <path d={`M${cx - r * 0.6},${y + 2} Q${cx},${y} ${cx + r * 0.6},${y + 2}`} fill="none" stroke={stroke} strokeWidth={1} opacity={0.4} />
      </g>
    );
  }

  // Coffee Table
  if (matchLabel(l, ["coffee table"])) {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill="hsl(var(--primary) / 0.08)" stroke={stroke} strokeWidth={0.7} rx={2} />
        {/* Inner surface */}
        <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} fill="none" stroke={stroke} strokeWidth={0.3} rx={1} opacity={0.3} />
      </g>
    );
  }

  // Dining Table
  if (matchLabel(l, ["dining table", "table"])) {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill="hsl(var(--primary) / 0.06)" stroke={stroke} strokeWidth={0.8} rx={1} />
        {/* Legs */}
        <circle cx={x + 3} cy={y + 3} r={1.5} fill={stroke} opacity={0.3} />
        <circle cx={x + w - 3} cy={y + 3} r={1.5} fill={stroke} opacity={0.3} />
        <circle cx={x + 3} cy={y + h - 3} r={1.5} fill={stroke} opacity={0.3} />
        <circle cx={x + w - 3} cy={y + h - 3} r={1.5} fill={stroke} opacity={0.3} />
      </g>
    );
  }

  // Bed
  if (matchLabel(l, ["bed"])) {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill={accent} stroke={stroke} strokeWidth={0.8} rx={1} />
        {/* Headboard */}
        <rect x={x} y={y} width={w} height={h * 0.12} fill={stroke} opacity={0.25} rx={1} />
        {/* Pillows */}
        <rect x={x + w * 0.08} y={y + h * 0.14} width={w * 0.38} height={h * 0.15} fill={stroke} opacity={0.12} rx={2} />
        <rect x={x + w * 0.54} y={y + h * 0.14} width={w * 0.38} height={h * 0.15} fill={stroke} opacity={0.12} rx={2} />
        {/* Duvet fold line */}
        <line x1={x + 2} y1={y + h * 0.55} x2={x + w - 2} y2={y + h * 0.55} stroke={stroke} strokeWidth={0.3} opacity={0.2} />
      </g>
    );
  }

  // Desk
  if (matchLabel(l, ["desk", "work"])) {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill="hsl(var(--primary) / 0.06)" stroke={stroke} strokeWidth={0.7} rx={1} />
        {/* Monitor/keyboard area */}
        <rect x={x + w * 0.3} y={y + 2} width={w * 0.4} height={h * 0.2} fill={stroke} opacity={0.1} rx={0.5} />
        <rect x={x + w * 0.25} y={y + h * 0.4} width={w * 0.5} height={h * 0.12} fill={stroke} opacity={0.08} rx={0.5} />
      </g>
    );
  }

  // TV Unit / Entertainment
  if (matchLabel(l, ["tv", "television", "entertainment", "media"])) {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill="hsl(var(--foreground) / 0.05)" stroke={stroke} strokeWidth={0.7} rx={1} />
        {/* TV screen */}
        <rect x={x + w * 0.1} y={y + 1} width={w * 0.8} height={h * 0.35} fill={stroke} opacity={0.2} rx={0.5} />
      </g>
    );
  }

  // Bookshelf / Shelving
  if (matchLabel(l, ["bookshelf", "shelf", "shelving", "storage", "cabinet"])) {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill="hsl(var(--foreground) / 0.06)" stroke={stroke} strokeWidth={0.7} rx={0.5} />
        {/* Shelf lines */}
        {[0.25, 0.5, 0.75].map((frac) => (
          <line key={frac} x1={x + 1} y1={y + h * frac} x2={x + w - 1} y2={y + h * frac} stroke={stroke} strokeWidth={0.4} opacity={0.25} />
        ))}
      </g>
    );
  }

  // Rug
  if (matchLabel(l, ["rug", "carpet"])) {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill="hsl(var(--primary) / 0.1)" stroke={stroke} strokeWidth={0.5} strokeDasharray="2 1.5" rx={2} opacity={0.6} />
        {/* Inner border */}
        <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} fill="none" stroke={stroke} strokeWidth={0.3} strokeDasharray="1.5 1" rx={1} opacity={0.2} />
      </g>
    );
  }

  // Plant
  if (matchLabel(l, ["plant", "planter", "tree"])) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.min(w, h) / 2 - 1;
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill="hsl(150 40% 55% / 0.15)" stroke="hsl(150 40% 40% / 0.5)" strokeWidth={0.6} />
        {/* Cross pattern for foliage */}
        <line x1={cx - r * 0.5} y1={cy} x2={cx + r * 0.5} y2={cy} stroke="hsl(150 40% 40% / 0.25)" strokeWidth={0.4} />
        <line x1={cx} y1={cy - r * 0.5} x2={cx} y2={cy + r * 0.5} stroke="hsl(150 40% 40% / 0.25)" strokeWidth={0.4} />
        <circle cx={cx} cy={cy} r={r * 0.3} fill="hsl(150 40% 40% / 0.1)" stroke="none" />
      </g>
    );
  }

  // Side Table / Nightstand
  if (matchLabel(l, ["side table", "nightstand", "end table", "lamp table"])) {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill="hsl(var(--primary) / 0.06)" stroke={stroke} strokeWidth={0.6} rx={1.5} />
        {/* Lamp circle */}
        <circle cx={x + w / 2} cy={y + h / 2} r={Math.min(w, h) * 0.2} fill={stroke} opacity={0.08} />
      </g>
    );
  }

  // Wardrobe / Closet
  if (matchLabel(l, ["wardrobe", "closet", "dresser"])) {
    return (
      <g>
        <rect x={x} y={y} width={w} height={h} fill="hsl(var(--foreground) / 0.07)" stroke={stroke} strokeWidth={0.8} rx={0.5} />
        {/* Door division */}
        <line x1={x + w / 2} y1={y + 1} x2={x + w / 2} y2={y + h - 1} stroke={stroke} strokeWidth={0.5} opacity={0.3} />
        {/* Handles */}
        <circle cx={x + w / 2 - 2} cy={y + h / 2} r={0.8} fill={stroke} opacity={0.3} />
        <circle cx={x + w / 2 + 2} cy={y + h / 2} r={0.8} fill={stroke} opacity={0.3} />
      </g>
    );
  }

  // Lamp (floor lamp)
  if (matchLabel(l, ["lamp", "floor lamp"])) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.min(w, h) / 2 - 1;
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill="hsl(40 80% 65% / 0.15)" stroke="hsl(40 60% 50% / 0.5)" strokeWidth={0.6} />
        <circle cx={cx} cy={cy} r={r * 0.35} fill="hsl(40 80% 65% / 0.25)" stroke="none" />
      </g>
    );
  }

  // Generic fallback
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={0.6} rx={1} />
      <text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fontSize={Math.min(w, h) > 25 ? 7 : 5} fill={textColor}>
        {label.length > 10 ? label.slice(0, 9) + "…" : label}
      </text>
    </g>
  );
}

// Legend for the architectural drawing
export function ArchLegend({ items }: { items: string[] }) {
  const unique = [...new Set(items)];
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground mt-2">
      {unique.slice(0, 8).map((item) => (
        <span key={item} className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm border border-border bg-primary/10 inline-block" />
          {item}
        </span>
      ))}
    </div>
  );
}
