import {
  Blocks,
  Brush,
  DoorOpen,
  Droplets,
  Flame,
  Grid2x2,
  Hammer,
  Lightbulb,
  Package,
  PaintRoller,
  Plug,
  Ruler,
  Square,
  Thermometer,
  Wrench,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Construction and material rows (drywall, plaster, electrical points, screed…)
 * never appear as objects inside the rendered design, so they can never get a
 * crop or an isolated photo. They get a clear generic illustration instead of an
 * empty slot.
 */
const RULES: Array<{ keywords: string[]; Icon: LucideIcon; tint: string }> = [
  { keywords: ["socket", "switch", "electric", "cable", "wiring", "circuit", "conduit", "outlet", "point"], Icon: Plug, tint: "#C98F3E" },
  { keywords: ["light circuit", "downlight", "spot", "track", "bulb", "led"], Icon: Lightbulb, tint: "#C9A23E" },
  { keywords: ["pipe", "plumb", "water", "drain", "tap", "waste"], Icon: Droplets, tint: "#5E8FB0" },
  { keywords: ["radiator", "heating", "underfloor"], Icon: Thermometer, tint: "#B0685E" },
  { keywords: ["boiler", "flue", "gas"], Icon: Flame, tint: "#B0685E" },
  { keywords: ["drywall", "plasterboard", "stud", "partition", "board"], Icon: Blocks, tint: "#8C8397" },
  { keywords: ["plaster", "render", "screed", "levelling", "filler", "primer", "skim"], Icon: Brush, tint: "#9A8C7E" },
  { keywords: ["paint", "wallpaper", "varnish", "sealer", "coat"], Icon: PaintRoller, tint: "#A96A4C" },
  { keywords: ["tile", "grout", "adhesive", "parquet", "laminate", "vinyl", "underlay", "floor"], Icon: Grid2x2, tint: "#8F7A6A" },
  { keywords: ["skirting", "architrave", "cornice", "trim", "moulding", "beading", "panel"], Icon: Ruler, tint: "#7E8F7A" },
  { keywords: ["door", "window", "frame", "glazing"], Icon: DoorOpen, tint: "#7A8398" },
  { keywords: ["screw", "fixing", "bracket", "anchor", "labour", "install", "fitting"], Icon: Wrench, tint: "#8A7F95" },
  { keywords: ["wall", "brick", "block", "concrete"], Icon: Square, tint: "#8C8397" },
  { keywords: ["joinery", "carpentry", "timber", "worktop", "mdf", "plywood"], Icon: Hammer, tint: "#9A7B5E" },
];

export function pickGenericIcon(label: string): { Icon: LucideIcon; tint: string } {
  const s = (label || "").toLowerCase();
  const hit = RULES.find((r) => r.keywords.some((k) => s.includes(k)));
  return hit ? { Icon: hit.Icon, tint: hit.tint } : { Icon: Package, tint: "#8A7F95" };
}

export default function GenericItemThumb({
  label,
  size = 56,
  border = "#EDE3DE",
}: {
  label: string;
  size?: number;
  border?: string;
}) {
  const { Icon, tint } = pickGenericIcon(label);
  return (
    <div
      aria-label={`${label} (generic illustration)`}
      title={`${label} — not visible in the render`}
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        flex: "none",
        border: `1px solid ${border}`,
        background: "linear-gradient(160deg, #FDF7F4 0%, #F4EDE8 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={Math.round(size * 0.44)} strokeWidth={1.6} color={tint} />
    </div>
  );
}
