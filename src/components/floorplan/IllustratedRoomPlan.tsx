import { IllustratedFurniture } from "@/components/floorplan/IllustratedFurniture";

interface LayoutItem {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props {
  items: LayoutItem[];
  shape?: string;
  dimensions?: Record<string, number>;
  customWalls?: { x: number; y: number }[][];
  height?: number;
}

// Compute polygon vertices in SVG coords. Mirrors the logic in /pages/FloorPlan.tsx
// but accepts already-resolved customWalls vertices for "custom" shape.
function getVertices(
  shape: string,
  dims: Record<string, number>,
  padding: number,
): { x: number; y: number }[] {
  const scale = 30;
  switch (shape) {
    case "l-shape": {
      const mw = (dims.mainW || 6) * scale;
      const mh = (dims.mainH || 4) * scale;
      const ww = (dims.wingW || 3) * scale;
      const wh = (dims.wingH || 3) * scale;
      return [
        { x: padding, y: padding },
        { x: padding + mw, y: padding },
        { x: padding + mw, y: padding + wh },
        { x: padding + ww, y: padding + wh },
        { x: padding + ww, y: padding + mh },
        { x: padding, y: padding + mh },
      ];
    }
    case "u-shape": {
      const tw = (dims.totalW || 7) * scale;
      const th = (dims.totalH || 5) * scale;
      const cw = (dims.cutoutW || 3) * scale;
      const ch = (dims.cutoutH || 3) * scale;
      const cx = (tw - cw) / 2;
      return [
        { x: padding, y: padding },
        { x: padding + tw, y: padding },
        { x: padding + tw, y: padding + th },
        { x: padding + cx + cw, y: padding + th },
        { x: padding + cx + cw, y: padding + th - ch },
        { x: padding + cx, y: padding + th - ch },
        { x: padding + cx, y: padding + th },
        { x: padding, y: padding + th },
      ];
    }
    default: {
      const w = (dims.width || dims.mainW || dims.totalW || 5) * scale;
      const h = (dims.height || dims.mainH || dims.totalH || 4) * scale;
      return [
        { x: padding, y: padding },
        { x: padding + w, y: padding },
        { x: padding + w, y: padding + h },
        { x: padding, y: padding + h },
      ];
    }
  }
}

function bbox(verts: { x: number; y: number }[]) {
  const xs = verts.map((v) => v.x);
  const ys = verts.map((v) => v.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

let CLIP_ID_SEED = 0;

export default function IllustratedRoomPlan({
  items,
  shape = "rectangle",
  dimensions = {},
  height = 240,
}: Props) {
  const padding = 20;
  const verts = getVertices(shape, dimensions, padding);
  const bb = bbox(verts);
  const svgW = bb.maxX + padding;
  const svgH = bb.maxY + padding;
  const path = verts.map((v, i) => `${i === 0 ? "M" : "L"}${v.x},${v.y}`).join(" ") + " Z";
  const clipId = `room-clip-${++CLIP_ID_SEED}`;
  const patternId = `wood-floor-${CLIP_ID_SEED}`;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      className="w-full h-auto"
      style={{ maxHeight: height }}
    >
      <defs>
        <pattern id={patternId} width="14" height="60" patternUnits="userSpaceOnUse">
          <rect width="14" height="60" fill="hsl(35 35% 86%)" />
          <line x1="0" y1="0" x2="14" y2="0" stroke="hsl(28 30% 72%)" strokeWidth="0.4" opacity="0.6" />
          <line x1="7" y1="0" x2="7" y2="60" stroke="hsl(28 30% 72%)" strokeWidth="0.3" opacity="0.4" />
        </pattern>
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
      </defs>
      <path d={path} fill={`url(#${patternId})`} stroke="hsl(25 30% 35%)" strokeWidth={2.5} strokeLinejoin="round" />
      <g clipPath={`url(#${clipId})`}>
        {items.map((item, i) => {
          const x = (item.x / 100) * bb.w + bb.minX;
          const y = (item.y / 100) * bb.h + bb.minY;
          const w = (item.w / 100) * bb.w;
          const h = (item.h / 100) * bb.h;
          return <IllustratedFurniture key={i} x={x} y={y} w={w} h={h} label={item.label} />;
        })}
      </g>
    </svg>
  );
}
