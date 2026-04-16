import React from "react";

export type WallSide = "top" | "right" | "bottom" | "left";
export type OpeningType = "door" | "window" | "balcony";

export interface RoomOpeningInput {
  type: OpeningType;
  wall: WallSide;
  position: number; // 0-100
}

interface Vertex {
  x: number;
  y: number;
}

function edgeToWallSide(v1: Vertex, v2: Vertex): WallSide {
  const dx = v2.x - v1.x;
  const dy = v2.y - v1.y;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle >= -45 && angle < 45) return "top";
  if (angle >= 45 && angle < 135) return "right";
  if (angle >= -135 && angle < -45) return "left";
  return "bottom";
}

interface Props {
  vertices: Vertex[];
  openings: RoomOpeningInput[];
  /** Approximate scale of the room SVG; used to size opening glyphs. */
  scale?: number;
}

/**
 * Renders doors / windows / balconies on top of a room polygon.
 * Doors: gap in the wall + quarter-circle swing arc.
 * Windows: thin double parallel line along the wall.
 * Balconies: dashed extension box outside the wall.
 */
export default function RoomOpenings({ vertices, openings, scale = 1 }: Props) {
  if (vertices.length < 3 || openings.length === 0) return null;

  const edges = vertices.map((v, i) => {
    const next = vertices[(i + 1) % vertices.length];
    return { v1: v, v2: next, wallSide: edgeToWallSide(v, next) };
  });

  // Centroid for inward-normal disambiguation
  const centroid = vertices.reduce(
    (acc, v) => ({ x: acc.x + v.x / vertices.length, y: acc.y + v.y / vertices.length }),
    { x: 0, y: 0 }
  );

  return (
    <g>
      {openings.map((o, i) => {
        const edge = edges.find((e) => e.wallSide === o.wall) || edges[0];
        const t = Math.max(0, Math.min(1, o.position / 100));
        const cx = edge.v1.x + (edge.v2.x - edge.v1.x) * t;
        const cy = edge.v1.y + (edge.v2.y - edge.v1.y) * t;
        const dx = edge.v2.x - edge.v1.x;
        const dy = edge.v2.y - edge.v1.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        // Two normal candidates; pick the one pointing toward centroid (inward)
        const n1 = { x: -uy, y: ux };
        const dot = (centroid.x - cx) * n1.x + (centroid.y - cy) * n1.y;
        const nx = dot >= 0 ? n1.x : -n1.x;
        const ny = dot >= 0 ? n1.y : -n1.y;

        // Sizes scaled to room
        const doorW = 22 * scale;
        const windowW = 28 * scale;
        const balconyW = 32 * scale;
        const balconyD = 14 * scale;

        if (o.type === "door") {
          const half = doorW / 2;
          const x1 = cx - ux * half;
          const y1 = cy - uy * half;
          const x2 = cx + ux * half;
          const y2 = cy + uy * half;
          // Door swing arc (inward)
          const arcEndX = x1 + nx * doorW;
          const arcEndY = y1 + ny * doorW;
          return (
            <g key={i}>
              {/* Cut the wall: white gap line */}
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(35 35% 86%)" strokeWidth={4} strokeLinecap="butt" />
              {/* Door panel */}
              <line x1={x1} y1={y1} x2={arcEndX} y2={arcEndY} stroke="hsl(25 30% 35%)" strokeWidth={1.5} />
              {/* Swing arc */}
              <path
                d={`M ${x2} ${y2} A ${doorW} ${doorW} 0 0 0 ${arcEndX} ${arcEndY}`}
                fill="none"
                stroke="hsl(25 30% 35%)"
                strokeWidth={0.6}
                strokeDasharray="2 2"
                opacity={0.7}
              />
            </g>
          );
        }

        if (o.type === "window") {
          const half = windowW / 2;
          const x1 = cx - ux * half;
          const y1 = cy - uy * half;
          const x2 = cx + ux * half;
          const y2 = cy + uy * half;
          const off = 1.6;
          return (
            <g key={i}>
              {/* white gap to break the wall stroke */}
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(35 35% 86%)" strokeWidth={4} strokeLinecap="butt" />
              {/* Two parallel lines = window */}
              <line x1={x1 + nx * off} y1={y1 + ny * off} x2={x2 + nx * off} y2={y2 + ny * off} stroke="hsl(210 70% 55%)" strokeWidth={1} />
              <line x1={x1 - nx * off} y1={y1 - ny * off} x2={x2 - nx * off} y2={y2 - ny * off} stroke="hsl(210 70% 55%)" strokeWidth={1} />
              {/* End caps */}
              <line x1={x1 + nx * off} y1={y1 + ny * off} x2={x1 - nx * off} y2={y1 - ny * off} stroke="hsl(210 70% 55%)" strokeWidth={0.8} />
              <line x1={x2 + nx * off} y1={y2 + ny * off} x2={x2 - nx * off} y2={y2 - ny * off} stroke="hsl(210 70% 55%)" strokeWidth={0.8} />
            </g>
          );
        }

        // balcony — extends outward (opposite of inward normal)
        const half = balconyW / 2;
        const ox = -nx;
        const oy = -ny;
        const ax = cx - ux * half;
        const ay = cy - uy * half;
        const bx = cx + ux * half;
        const by = cy + uy * half;
        const cx2 = bx + ox * balconyD;
        const cy2 = by + oy * balconyD;
        const dx2 = ax + ox * balconyD;
        const dy2 = ay + oy * balconyD;
        return (
          <g key={i}>
            {/* gap on wall */}
            <line x1={ax} y1={ay} x2={bx} y2={by} stroke="hsl(35 35% 86%)" strokeWidth={4} strokeLinecap="butt" />
            {/* balcony floor */}
            <path
              d={`M ${ax} ${ay} L ${bx} ${by} L ${cx2} ${cy2} L ${dx2} ${dy2} Z`}
              fill="hsl(150 30% 75% / 0.35)"
              stroke="hsl(150 40% 35%)"
              strokeWidth={1}
              strokeDasharray="3 2"
            />
          </g>
        );
      })}
    </g>
  );
}
