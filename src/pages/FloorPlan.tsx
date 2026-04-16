import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/QuizContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Logo from "@/components/Logo";
import { ArrowLeft, ArrowRight, Loader2, RotateCcw, X, Sofa, Bed, UtensilsCrossed, Monitor, Bath, ThumbsUp, ThumbsDown, Save, Upload, Image as ImageIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { ArchFurniture, ArchLegend } from "@/components/floorplan/ArchFurniture";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Style images
import modernMinimalImg from "@/assets/styles/modern-minimal.png";
import bohemianEclecticImg from "@/assets/styles/bohemian-eclectic.png";
import classicHistoricalImg from "@/assets/styles/classic-historical.png";
import glamLuxeImg from "@/assets/styles/glam-luxe.png";
import mediterraneanImg from "@/assets/styles/mediterranean.png";
import rusticNatureImg from "@/assets/styles/rustic-nature.png";

const STYLE_OPTIONS = [
  { value: "modern_minimal", label: "Modern Minimal", description: "Clean lines, neutral tones, minimalist furniture", imageUrl: modernMinimalImg },
  { value: "classic_historical", label: "Classic Historical", description: "Timeless elegance with rich textures", imageUrl: classicHistoricalImg },
  { value: "rustic_nature", label: "Rustic Nature", description: "Warm wood tones, natural materials", imageUrl: rusticNatureImg },
  { value: "mediterranean", label: "Mediterranean", description: "Sun-kissed colors, terracotta, coastal vibes", imageUrl: mediterraneanImg },
  { value: "bohemian_eclectic", label: "Bohemian Eclectic", description: "Eclectic patterns, vibrant colors", imageUrl: bohemianEclecticImg },
  { value: "glam_luxe", label: "Glam Luxe", description: "Luxurious finishes, bold accents", imageUrl: glamLuxeImg },
];

// Room shape definitions
type ShapeId = "rectangle" | "l-shape" | "u-shape" | "open-plan" | "custom";

interface WallSegment {
  length_m: number;
  angle_deg: number;
}

interface RoomShape {
  id: ShapeId;
  label: string;
  description: string;
  defaultDimensions: Record<string, number>;
  dimensionLabels: Record<string, string>;
}

const ROOM_SHAPES: RoomShape[] = [
  {
    id: "rectangle",
    label: "Rectangle",
    description: "Standard rectangular room",
    defaultDimensions: { width: 5, height: 4 },
    dimensionLabels: { width: "Width (m)", height: "Length (m)" },
  },
  {
    id: "l-shape",
    label: "L-Shape",
    description: "L-shaped room with two sections",
    defaultDimensions: { mainW: 6, mainH: 4, wingW: 3, wingH: 3 },
    dimensionLabels: {
      mainW: "Main Width (m)",
      mainH: "Main Length (m)",
      wingW: "Wing Width (m)",
      wingH: "Wing Length (m)",
    },
  },
  {
    id: "u-shape",
    label: "U-Shape",
    description: "U-shaped room with three sections",
    defaultDimensions: { totalW: 7, totalH: 5, cutoutW: 3, cutoutH: 3 },
    dimensionLabels: {
      totalW: "Total Width (m)",
      totalH: "Total Length (m)",
      cutoutW: "Cutout Width (m)",
      cutoutH: "Cutout Length (m)",
    },
  },
  {
    id: "open-plan",
    label: "Open Plan",
    description: "Large open space with kitchen island area",
    defaultDimensions: { width: 8, height: 6 },
    dimensionLabels: { width: "Width (m)", height: "Length (m)" },
  },
  {
    id: "custom",
    label: "Custom Shape",
    description: "Define walls with angles",
    defaultDimensions: {},
    dimensionLabels: {},
  },
];

// Compute polygon vertices from wall segments
function wallSegmentsToVertices(segments: WallSegment[]): { x: number; y: number }[] {
  const vertices: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  let heading = 0; // degrees, 0 = right/east
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const rad = (heading * Math.PI) / 180;
    const lastV = vertices[vertices.length - 1];
    vertices.push({
      x: lastV.x + seg.length_m * Math.cos(rad),
      y: lastV.y + seg.length_m * Math.sin(rad),
    });
    heading += seg.angle_deg;
  }
  return vertices;
}

function verticesBBox(verts: { x: number; y: number }[]) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const v of verts) {
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  }
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
}

// SVG for custom polygon shape
function CustomShapeSVG({ segments, className = "" }: { segments: WallSegment[]; className?: string }) {
  if (segments.length < 3) return null;
  const verts = wallSegmentsToVertices(segments);
  const bb = verticesBBox(verts);
  const pad = 30;
  const scale = Math.min(200 / (bb.w || 1), 160 / (bb.h || 1));
  const points = verts.map(v => `${(v.x - bb.minX) * scale + pad},${(v.y - bb.minY) * scale + pad}`).join(" ");
  const svgW = bb.w * scale + pad * 2;
  const svgH = bb.h * scale + pad * 2;

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className={className}>
      <polygon
        points={points}
        fill="hsl(var(--primary) / 0.08)"
        stroke="hsl(var(--primary))"
        strokeWidth={2}
      />
      {/* Label each wall with length */}
      {verts.slice(0, -1).map((v, i) => {
        const next = verts[i + 1];
        const mx = ((v.x - bb.minX + next.x - bb.minX) / 2) * scale + pad;
        const my = ((v.y - bb.minY + next.y - bb.minY) / 2) * scale + pad;
        return (
          <text key={i} x={mx} y={my - 4} textAnchor="middle" fontSize={9} fill="hsl(var(--muted-foreground))">
            {segments[i].length_m}m
          </text>
        );
      })}
    </svg>
  );
}

// Opening types
type OpeningType = "door" | "window" | "balcony";
type WallSide = "top" | "right" | "bottom" | "left";

// Clockwise wall order
const WALLS_CLOCKWISE: WallSide[] = ["top", "right", "bottom", "left"];

const WALL_LABELS: Record<WallSide, string> = {
  top: "Wall A (North)",
  right: "Wall B (East)",
  bottom: "Wall C (South)",
  left: "Wall D (West)",
};

const WALL_SURFACE_OPTIONS = [
  { value: "flat", label: "Flat (Standard)" },
  { value: "brick", label: "Brick" },
  { value: "wood_panel", label: "Wood Panel" },
  { value: "stone", label: "Stone" },
  { value: "concrete", label: "Concrete" },
  { value: "glass", label: "Glass" },
];

interface RoomOpening {
  id: string;
  type: OpeningType;
  wall: WallSide;
  position: number;
}

const OPENING_TYPES: { type: OpeningType; label: string; icon: string; color: string }[] = [
  { type: "door", label: "Door", icon: "🚪", color: "hsl(var(--primary))" },
  { type: "window", label: "Window", icon: "🪟", color: "hsl(25 80% 55%)" },
  { type: "balcony", label: "Balcony", icon: "🏠", color: "hsl(150 50% 45%)" },
];

// SVG shape renderers
function ShapeSVG({ shapeId, dims, scale = 1, className = "" }: { shapeId: ShapeId; dims: Record<string, number>; scale?: number; className?: string }) {
  const s = scale;
  const stroke = "hsl(var(--primary))";
  const fill = "hsl(var(--primary) / 0.08)";

  switch (shapeId) {
    case "rectangle": {
      const w = (dims.width || 5) * 30 * s;
      const h = (dims.height || 4) * 30 * s;
      return (
        <svg viewBox={`-20 -20 ${w + 40} ${h + 40}`} className={className}>
          <rect x={0} y={0} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={2} rx={2} />
          <text x={w / 2} y={h + 16} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))">{dims.width}m</text>
          <text x={-12} y={h / 2} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))" transform={`rotate(-90, -12, ${h / 2})`}>{dims.height}m</text>
        </svg>
      );
    }
    case "l-shape": {
      const mw = (dims.mainW || 6) * 25 * s;
      const mh = (dims.mainH || 4) * 25 * s;
      const ww = (dims.wingW || 3) * 25 * s;
      const wh = (dims.wingH || 3) * 25 * s;
      const path = `M0,0 H${mw} V${wh} H${ww} V${mh} H0 Z`;
      return (
        <svg viewBox={`-20 -20 ${mw + 40} ${mh + 40}`} className={className}>
          <path d={path} fill={fill} stroke={stroke} strokeWidth={2} />
          <text x={mw / 2} y={-6} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">{dims.mainW}m</text>
          <text x={-12} y={mh / 2} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))" transform={`rotate(-90, -12, ${mh / 2})`}>{dims.mainH}m</text>
        </svg>
      );
    }
    case "u-shape": {
      const tw = (dims.totalW || 7) * 22 * s;
      const th = (dims.totalH || 5) * 22 * s;
      const cw = (dims.cutoutW || 3) * 22 * s;
      const ch = (dims.cutoutH || 3) * 22 * s;
      const cx = (tw - cw) / 2;
      const path = `M0,0 H${tw} V${th} H${cx + cw} V${th - ch} H${cx} V${th} H0 Z`;
      return (
        <svg viewBox={`-20 -20 ${tw + 40} ${th + 40}`} className={className}>
          <path d={path} fill={fill} stroke={stroke} strokeWidth={2} />
          <text x={tw / 2} y={-6} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">{dims.totalW}m</text>
          <text x={-12} y={th / 2} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))" transform={`rotate(-90, -12, ${th / 2})`}>{dims.totalH}m</text>
        </svg>
      );
    }
    case "open-plan": {
      const w = (dims.width || 8) * 25 * s;
      const h = (dims.height || 6) * 25 * s;
      return (
        <svg viewBox={`-20 -20 ${w + 40} ${h + 40}`} className={className}>
          <rect x={0} y={0} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={2} rx={2} />
          <rect x={w * 0.6} y={h * 0.2} width={w * 0.25} height={h * 0.15} fill="hsl(var(--primary) / 0.15)" stroke={stroke} strokeWidth={1} strokeDasharray="4 2" rx={1} />
          <text x={w / 2} y={h + 16} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))">{dims.width}m</text>
          <text x={-12} y={h / 2} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))" transform={`rotate(-90, -12, ${h / 2})`}>{dims.height}m</text>
        </svg>
      );
    }
    case "custom":
      return null; // CustomShapeSVG handles this
  }
}

// Compute polygon vertices in SVG coords for any shape
function getShapeVertices(
  shapeId: ShapeId,
  dims: Record<string, number>,
  padding: number,
  customWalls?: WallSegment[]
): { x: number; y: number }[] {
  const scale = 30;
  switch (shapeId) {
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
    case "custom": {
      if (customWalls && customWalls.length >= 3) {
        const verts = wallSegmentsToVertices(customWalls);
        const bb = verticesBBox(verts);
        const w = (dims.width || dims.mainW || dims.totalW || 5) * scale;
        const h = (dims.height || dims.mainH || dims.totalH || 4) * scale;
        const s = Math.min(w / (bb.w || 1), h / (bb.h || 1));
        return verts.map((v) => ({
          x: (v.x - bb.minX) * s + padding,
          y: (v.y - bb.minY) * s + padding,
        }));
      }
      // fallback to rect
      const w = (dims.width || 5) * scale;
      const h = (dims.height || 4) * scale;
      return [
        { x: padding, y: padding },
        { x: padding + w, y: padding },
        { x: padding + w, y: padding + h },
        { x: padding, y: padding + h },
      ];
    }
    default: {
      // rectangle & open-plan
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

// Map edge index to closest WallSide based on edge direction
function edgeToWallSide(v1: { x: number; y: number }, v2: { x: number; y: number }): WallSide {
  const dx = v2.x - v1.x;
  const dy = v2.y - v1.y;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI; // -180..180
  // Normalize: top=going right (0°), right=going down (90°), bottom=going left (180°), left=going up (-90°)
  if (angle >= -45 && angle < 45) return "top";
  if (angle >= 45 && angle < 135) return "right";
  if (angle >= -135 && angle < -45) return "left";
  return "bottom";
}

// Interactive room SVG with openings
function RoomWithOpenings({
  shapeId,
  dims,
  openings,
  activeType: _activeType,
  onWallClick,
  onRemoveOpening,
  customWalls,
}: {
  shapeId: ShapeId;
  dims: Record<string, number>;
  openings: RoomOpening[];
  activeType: OpeningType;
  onWallClick: (wall: WallSide, position: number) => void;
  onRemoveOpening: (id: string) => void;
  customWalls?: WallSegment[];
}) {
  const padding = 40;
  const w = (dims.width || dims.mainW || dims.totalW || 5) * 30;
  const h = (dims.height || dims.mainH || dims.totalH || 4) * 30;
  const svgW = w + padding * 2;
  const svgH = h + padding * 2;

  const stroke = "hsl(var(--primary))";
  const fill = "hsl(var(--primary) / 0.06)";

  const vertices = getShapeVertices(shapeId, dims, padding, customWalls);

  // Build edges
  const edges = vertices.map((v, i) => {
    const next = vertices[(i + 1) % vertices.length];
    return { v1: v, v2: next, wallSide: edgeToWallSide(v, next), index: i };
  });

  // Build SVG path from vertices
  const shapePath = vertices.map((v, i) => `${i === 0 ? "M" : "L"}${v.x},${v.y}`).join(" ") + " Z";

  const openingColor = (type: OpeningType) => {
    return OPENING_TYPES.find((t) => t.type === type)?.color || stroke;
  };

  // Get opening position along actual wall edge
  const getOpeningPos = (opening: RoomOpening) => {
    // Find the best matching edge for this opening's wall side
    const matchingEdges = edges.filter(e => e.wallSide === opening.wall);
    // Use first matching edge (or fallback to any edge)
    const edge = matchingEdges[0] || edges[0];
    const pos = opening.position / 100;
    const size = opening.type === "door" ? 18 : opening.type === "balcony" ? 24 : 20;
    const x = edge.v1.x + (edge.v2.x - edge.v1.x) * pos;
    const y = edge.v1.y + (edge.v2.y - edge.v1.y) * pos;
    const dx = edge.v2.x - edge.v1.x;
    const dy = edge.v2.y - edge.v1.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    // Unit direction along the wall
    const ux = dx / (len || 1);
    const uy = dy / (len || 1);
    // Normal (pointing inward — we'll pick based on which side)
    const nx = -uy;
    const ny = ux;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    return { x, y, ux, uy, nx, ny, size, horizontal, edge };
  };

  // Soft brand-palette wall colors (salmon, lilac, sage, muted variants)
  const WALL_COLORS = [
    "hsl(15 55% 70%)",    // salmon / peach
    "hsl(280 30% 68%)",   // lilac / mauve
    "hsl(140 25% 58%)",   // sage green
    "hsl(25 45% 65%)",    // warm sand
    "hsl(300 25% 72%)",   // soft rose
    "hsl(160 28% 55%)",   // muted teal
    "hsl(10 40% 72%)",    // blush
    "hsl(260 22% 65%)",   // lavender
  ];

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full max-h-[350px]">
      <path d={shapePath} fill={fill} stroke="none" />

      {/* Colored wall edges */}
      {edges.map((edge, i) => {
        const dx = edge.v2.x - edge.v1.x;
        const dy = edge.v2.y - edge.v1.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 5) return null;
        return (
          <line
            key={`wall-${i}`}
            x1={edge.v1.x}
            y1={edge.v1.y}
            x2={edge.v2.x}
            y2={edge.v2.y}
            stroke={WALL_COLORS[i % WALL_COLORS.length]}
            strokeWidth={3}
            strokeLinecap="round"
            className="pointer-events-none"
          />
        );
      })}

      {/* Openings */}
      {openings.map((opening) => {
        const pos = getOpeningPos(opening);
        const color = openingColor(opening.type);
        const icon = OPENING_TYPES.find((t) => t.type === opening.type)?.icon || "?";

        return (
          <g key={opening.id} className="cursor-pointer" onClick={() => onRemoveOpening(opening.id)}>
            {/* Opening line along wall */}
            <line
              x1={pos.x - pos.ux * pos.size / 2}
              y1={pos.y - pos.uy * pos.size / 2}
              x2={pos.x + pos.ux * pos.size / 2}
              y2={pos.y + pos.uy * pos.size / 2}
              stroke={color}
              strokeWidth={4}
              strokeLinecap="round"
            />
            {opening.type === "door" && (
              <path
                d={`M${pos.x - pos.ux * pos.size / 2},${pos.y - pos.uy * pos.size / 2} A${pos.size / 2},${pos.size / 2} 0 0,1 ${pos.x + pos.ux * pos.size / 2},${pos.y + pos.uy * pos.size / 2}`}
                fill="none"
                stroke={color}
                strokeWidth={1}
                strokeDasharray="3 2"
                opacity={0.5}
              />
            )}
            {opening.type === "balcony" && (
              <rect
                x={pos.x - pos.ux * pos.size / 2}
                y={pos.y - pos.uy * pos.size / 2}
                width={pos.horizontal ? pos.size : 10}
                height={pos.horizontal ? 10 : pos.size}
                fill={color}
                opacity={0.15}
                stroke={color}
                strokeWidth={1}
                rx={1}
                transform={`translate(${pos.nx * -5},${pos.ny * -5})`}
              />
            )}
            <text
              x={pos.x + pos.nx * 16}
              y={pos.y + pos.ny * 16}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12}
              className="pointer-events-none"
            >
              {icon}
            </text>
          </g>
        );
      })}

      {/* Clickable wall hit areas along actual edges — rendered last so on top */}
      {edges.map((edge, i) => {
        const dx = edge.v2.x - edge.v1.x;
        const dy = edge.v2.y - edge.v1.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 5) return null;
        return (
          <line
            key={`hit-${i}`}
            x1={edge.v1.x}
            y1={edge.v1.y}
            x2={edge.v2.x}
            y2={edge.v2.y}
            stroke="transparent"
            strokeWidth={28}
            className="cursor-crosshair"
            onClick={(e) => {
              const svg = e.currentTarget.closest("svg");
              if (!svg) return;
              const rect = svg.getBoundingClientRect();
              const vb = svg.viewBox.baseVal;
              const scaleX = vb.width / rect.width;
              const scaleY = vb.height / rect.height;
              const svgX = (e.clientX - rect.left) * scaleX;
              const svgY = (e.clientY - rect.top) * scaleY;
              // Project click onto the edge to get percentage
              const ex = svgX - edge.v1.x;
              const ey = svgY - edge.v1.y;
              const dot = (ex * dx + ey * dy) / (len * len);
              const pct = Math.max(10, Math.min(90, Math.round(dot * 100)));
              onWallClick(edge.wallSide, pct);
            }}
          />
        );
      })}
    </svg>
  );
}
function ArchFurnitureOverlay({ items, canvasW, canvasH }: { items: LayoutItem[]; canvasW: number; canvasH: number }) {
  return (
    <>
      {items.map((item, i) => {
        const x = (item.x / 100) * canvasW + 10;
        const y = (item.y / 100) * canvasH + 10;
        const w = (item.w / 100) * canvasW;
        const h = (item.h / 100) * canvasH;
        return <ArchFurniture key={i} x={x} y={y} w={w} h={h} label={item.label} />;
      })}
    </>
  );
}

interface LayoutItem {
  label: string;
  x: number; y: number; w: number; h: number;
  reason?: string;
}

interface LayoutSuggestion {
  name: string;
  description: string;
  items: LayoutItem[];
}

const FloorPlan = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { updateQuizData } = useQuiz();

  // Steps: 0=shape, 1=dimensions, 2=room type & furniture, 3=openings, 4=layout, 5=style
  const [step, setStep] = useState(0);
  const [selectedShape, setSelectedShape] = useState<RoomShape | null>(null);
  const [dimensions, setDimensions] = useState<Record<string, number>>({});
  const [selectedRoomType, setSelectedRoomType] = useState<string>("");
  const [selectedFurniture, setSelectedFurniture] = useState<string[]>([]);
  const [openings, setOpenings] = useState<RoomOpening[]>([]);
  const [activeOpeningType, setActiveOpeningType] = useState<OpeningType>("door");
  const [wallSurfaces, setWallSurfaces] = useState<Record<WallSide, string>>({
    top: "flat", right: "flat", bottom: "flat", left: "flat",
  });

  // Custom shape
  const [customWalls, setCustomWalls] = useState<WallSegment[]>([
    { length_m: 5, angle_deg: 90 },
    { length_m: 4, angle_deg: 90 },
    { length_m: 5, angle_deg: 90 },
    { length_m: 4, angle_deg: 90 },
  ]);

  // Floor plan upload
  const [floorPlanUploading, setFloorPlanUploading] = useState(false);
  const [floorPlanAnalyzing, setFloorPlanAnalyzing] = useState(false);
  const [floorPlanImageUrl, setFloorPlanImageUrl] = useState<string>("");

  // Style step
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [referenceImageUrl, setReferenceImageUrl] = useState<string>("");
  const [uploadingRef, setUploadingRef] = useState(false);

  // Layout step
  const [layout, setLayout] = useState<LayoutSuggestion | null>(null);
  const [generating, setGenerating] = useState(false);
  const [itemScores, setItemScores] = useState<Record<number, boolean | null>>({});
  const [itemNotes, setItemNotes] = useState<Record<number, string>>({});
  const [savingFeedback, setSavingFeedback] = useState(false);

  // Fetch room furniture configs from DB
  const { data: roomConfigs } = useQuery({
    queryKey: ["room-furniture-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_furniture_config")
        .select("*")
        .order("room_label");
      if (error) throw error;
      return data as { id: string; room_type: string; room_label: string; furniture_items: string[]; description: string | null }[];
    },
  });

  // Fetch CMS styles (optional override)
  const { data: cmsStyles } = useQuery({
    queryKey: ["cms-quiz-styles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_content")
        .select("key, value, metadata")
        .like("key", "quiz_style_%")
        .eq("content_type", "image_url");
      if (error) throw error;
      return data;
    },
  });

  const styleOptions = cmsStyles?.length
    ? cmsStyles.map((item) => {
        const styleKey = item.key.replace("quiz_style_", "");
        const meta = item.metadata as { label?: string; title?: string; description?: string } | null;
        return {
          value: styleKey,
          label: meta?.label || meta?.title || styleKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          description: meta?.description || "",
          imageUrl: item.value,
        };
      })
    : STYLE_OPTIONS;

  const ROOM_ICONS: Record<string, React.ReactNode> = {
    "living-room": <Sofa className="w-6 h-6" />,
    "bedroom": <Bed className="w-6 h-6" />,
    "kitchen": <UtensilsCrossed className="w-6 h-6" />,
    "office": <Monitor className="w-6 h-6" />,
    "bathroom": <Bath className="w-6 h-6" />,
  };

  const activeRoomConfig = roomConfigs?.find(r => r.room_type === selectedRoomType);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const selectShape = useCallback((shape: RoomShape) => {
    setSelectedShape(shape);
    if (shape.id !== "custom") {
      setDimensions({ ...shape.defaultDimensions });
    }
    setStep(1);
  }, []);

  const handleFloorPlanUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setFloorPlanUploading(true);
    setFloorPlanAnalyzing(false);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/floorplan_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("room-uploads").upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("room-uploads").getPublicUrl(path);
      setFloorPlanImageUrl(urlData.publicUrl);
      setFloorPlanUploading(false);
      setFloorPlanAnalyzing(true);

      // Call AI to analyze the floor plan
      const { data, error } = await supabase.functions.invoke("analyze-floorplan", {
        body: { imageUrl: urlData.publicUrl },
      });
      if (error) throw error;

      if (data?.floorplan?.walls && data.floorplan.walls.length >= 3) {
        setCustomWalls(data.floorplan.walls);
        // Set shape to custom and go to step 1
        const customShape = ROOM_SHAPES.find(s => s.id === "custom")!;
        setSelectedShape(customShape);

        // Auto-import detected openings
        if (data.floorplan.openings?.length > 0) {
          const wallLabels: WallSide[] = ["top", "right", "bottom", "left"];
          const importedOpenings: RoomOpening[] = data.floorplan.openings
            .filter((o: any) => o.wall_index < wallLabels.length)
            .map((o: any) => ({
              id: crypto.randomUUID(),
              type: o.type as OpeningType,
              wall: wallLabels[o.wall_index % wallLabels.length],
              position: Math.round(o.position_pct),
            }));
          setOpenings(importedOpenings);
        }

        toast({ title: "Floor plan analyzed!", description: data.floorplan.shape_description || "Shape extracted successfully" });
        setStep(1);
      } else {
        throw new Error("Could not extract room shape from image");
      }
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message || "Please try again", variant: "destructive" });
    } finally {
      setFloorPlanUploading(false);
      setFloorPlanAnalyzing(false);
    }
  }, [user]);

  const addWallSegment = useCallback(() => {
    setCustomWalls(prev => [...prev, { length_m: 3, angle_deg: 90 }]);
  }, []);

  const removeWallSegment = useCallback((index: number) => {
    setCustomWalls(prev => prev.length > 3 ? prev.filter((_, i) => i !== index) : prev);
  }, []);

  const updateWallSegment = useCallback((index: number, field: "length_m" | "angle_deg", value: number) => {
    setCustomWalls(prev => prev.map((w, i) => i === index ? { ...w, [field]: value } : w));
  }, []);

  const updateDim = useCallback((key: string, val: string) => {
    const n = parseFloat(val);
    if (!isNaN(n) && n > 0 && n <= 30) {
      setDimensions(prev => ({ ...prev, [key]: n }));
    }
  }, []);

  const addOpening = useCallback((wall: WallSide, position: number) => {
    setOpenings(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: activeOpeningType,
        wall,
        position: Math.round(position),
      },
    ]);
  }, [activeOpeningType]);

  const removeOpening = useCallback((id: string) => {
    setOpenings(prev => prev.filter(o => o.id !== id));
  }, []);

  const handleReferenceUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingRef(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/ref_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("room-uploads").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("room-uploads").getPublicUrl(path);
      setReferenceImageUrl(urlData.publicUrl);
      toast({ title: "Reference uploaded", description: "Your style reference has been saved." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingRef(false);
    }
  }, [user]);

  // Build clockwise walls data for the prompt
  const buildWallsClockwise = useCallback(() => {
    return WALLS_CLOCKWISE.map((wall) => {
      const wallOpenings = openings.filter(o => o.wall === wall);
      return {
        wall: WALL_LABELS[wall],
        surface: wallSurfaces[wall],
        openings: wallOpenings.map(o => ({
          type: o.type,
          position_pct: o.position,
        })),
      };
    });
  }, [openings, wallSurfaces]);

  const generateLayouts = useCallback(async () => {
    if (!selectedShape) return;
    setGenerating(true);
    setLayout(null);

    try {
      const wallsData = buildWallsClockwise();
      const body: Record<string, any> = {
        shape: selectedShape.id,
        dimensions,
        roomType: selectedRoomType,
        furnitureItems: selectedFurniture,
        openings: openings.map(o => ({ type: o.type, wall: o.wall, position: o.position })),
        walls: wallsData,
        // Layout is generated based on room geometry only — style is chosen after
      };
      if (selectedShape.id === "custom") {
        body.customWalls = customWalls;
      }
      const { data, error } = await supabase.functions.invoke("generate-layout", {
        body,
      });

      if (error) throw error;

      if (data?.layout) {
        setLayout(data.layout);
      } else {
        throw new Error("Invalid layout response");
      }
      setStep(4);
    } catch (e: any) {
      console.error("Layout generation error:", e);
      toast({ title: "Layout Generation Failed", description: e.message || "Please try again.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }, [selectedShape, dimensions, selectedRoomType, selectedFurniture, openings, buildWallsClockwise, customWalls]);

  const saveFeedbackAndProceed = useCallback(async () => {
    if (!layout || !selectedShape || !user) return;
    setSavingFeedback(true);

    try {
      const feedbackRows = layout.items
        .map((item, i) => {
          const agreed = itemScores[i];
          if (agreed === null || agreed === undefined) return null;
          return {
            user_id: user.id,
            room_type: selectedRoomType || null,
            room_shape: selectedShape.id,
            room_dimensions: dimensions,
            openings: openings.map(o => ({ type: o.type, wall: o.wall, position: o.position })),
            layout_name: layout.name,
            furniture_item: item.label,
            position_x: item.x,
            position_y: item.y,
            width_pct: item.w,
            height_pct: item.h,
            ai_reason: item.reason || null,
            agreed,
            user_note: itemNotes[i] || null,
          };
        })
        .filter(Boolean);

      if (feedbackRows.length > 0) {
        await supabase.from("layout_feedback").insert(feedbackRows);
      }
    } catch { /* non-critical */ }

    // Save full floor plan context including walls, style, and feedback
    const floorPlanContext = {
      shape: selectedShape.id,
      dimensions,
      roomType: selectedRoomType,
      furnitureItems: selectedFurniture,
      walls: buildWallsClockwise(),
      style: selectedStyle,
      referenceImageUrl: referenceImageUrl || undefined,
      layout,
      feedback: layout.items.map((item, i) => ({
        item: item.label,
        position: { x: item.x, y: item.y, w: item.w, h: item.h },
        reason: item.reason,
        agreed: itemScores[i] ?? null,
        note: itemNotes[i] || null,
      })),
    };
    sessionStorage.setItem("floor_plan_context", JSON.stringify(floorPlanContext));

    const roomType = selectedRoomType || "living_room";
    const stylePreference = selectedStyle || "modern_minimal";
    updateQuizData({ roomType, stylePreference });

    try {
      await supabase.from("quiz_responses").insert({
        user_id: user.id,
        style_preference: stylePreference,
        color_palette: "neutral",
        room_type: roomType,
        budget_feel: "mid-range",
        must_have_elements: selectedFurniture,
        furniture_source: null,
      });
    } catch { /* non-critical */ }

    setSavingFeedback(false);
    sessionStorage.setItem('generate_quiz_nonce', crypto.randomUUID());
    navigate("/generate", { state: { quizData: { roomType, stylePreference, colorPalette: "neutral", budgetFeel: "mid-range", mustHaveElements: selectedFurniture } } });
  }, [layout, selectedShape, dimensions, selectedRoomType, selectedFurniture, openings, navigate, updateQuizData, user, itemScores, itemNotes, buildWallsClockwise, selectedStyle, referenceImageUrl]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const STEP_LABELS = ["Shape", "Dimensions", "Room & Furniture", "Openings", "Layout", "Style"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : navigate("/start")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <div className="flex items-center gap-3">
          <Logo size={28} />
          <span className="font-semibold text-foreground">HomeMockUp</span>
        </div>
        <div className="w-16" />
      </header>

      {/* Progress */}
      <div className="flex justify-center gap-2 px-4 pb-4">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
              i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {i + 1}
            </div>
            <span className={`text-xs hidden sm:inline ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
            {i < STEP_LABELS.length - 1 && <div className={`w-8 h-px ${i < step ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <main className="relative z-10 px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Step 0: Choose Shape */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold">Choose Your Room Shape</h1>
                <p className="text-muted-foreground">Select the shape that best matches your room</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {ROOM_SHAPES.filter(s => s.id !== "custom").map((shape) => (
                  <Card
                    key={shape.id}
                    className="group cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => selectShape(shape)}
                  >
                    <CardContent className="p-4 flex flex-col items-center gap-3">
                      <div className="w-full aspect-square flex items-center justify-center">
                        <ShapeSVG shapeId={shape.id} dims={shape.defaultDimensions} scale={0.7} className="w-full h-full" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{shape.label}</h3>
                        <p className="text-xs text-muted-foreground">{shape.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Custom & Upload options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Custom shape */}
                <Card
                  className="group cursor-pointer hover:border-primary/50 transition-all border-dashed"
                  onClick={() => selectShape(ROOM_SHAPES.find(s => s.id === "custom")!)}
                >
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 40 40" className="w-8 h-8">
                        <polygon points="5,35 5,10 15,5 35,10 35,30 20,35" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">Custom Shape</h3>
                      <p className="text-xs text-muted-foreground">Define walls with lengths and angles for any room shape</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Upload floor plan */}
                <Card className="group hover:border-primary/50 transition-all border-dashed">
                  <CardContent className="p-5">
                    <label className="flex items-center gap-4 cursor-pointer">
                      <div className="w-14 h-14 rounded-xl bg-accent/50 flex items-center justify-center shrink-0">
                        {floorPlanUploading || floorPlanAnalyzing ? (
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        ) : (
                          <Upload className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">Upload Floor Plan</h3>
                        <p className="text-xs text-muted-foreground">
                          {floorPlanAnalyzing ? "Analyzing your floor plan…" : floorPlanUploading ? "Uploading…" : "Upload a photo or sketch and we'll extract the shape"}
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFloorPlanUpload}
                        disabled={floorPlanUploading || floorPlanAnalyzing}
                      />
                    </label>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 1: Set Dimensions / Custom Wall Editor */}
          {step === 1 && selectedShape && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {selectedShape.id === "custom" ? "Define Your Room Walls" : "Set Room Dimensions"}
                </h1>
                <p className="text-muted-foreground">
                  {selectedShape.id === "custom" ? "Add wall segments with lengths and turning angles" : "Enter measurements in meters"}
                </p>
              </div>

              {selectedShape.id === "custom" ? (
                /* Custom wall segment editor */
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div className="bg-card rounded-xl border p-6 flex items-center justify-center min-h-[300px]">
                    {customWalls.length >= 3 ? (
                      <CustomShapeSVG segments={customWalls} className="w-full h-full max-h-[280px]" />
                    ) : (
                      <p className="text-muted-foreground text-sm">Add at least 3 walls to preview shape</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Wall Segments ({customWalls.length})</Label>
                      <Button variant="outline" size="sm" onClick={addWallSegment}>
                        + Add Wall
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                      {customWalls.map((wall, i) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/40 border border-border/50">
                          <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">Wall {i + 1}</span>
                          <div className="flex-1 space-y-1">
                            <div className="flex gap-2 items-center">
                              <Input
                                type="number"
                                min={0.5}
                                max={20}
                                step={0.1}
                                value={wall.length_m}
                                onChange={(e) => updateWallSegment(i, "length_m", parseFloat(e.target.value) || 1)}
                                className="h-7 text-xs"
                              />
                              <span className="text-xs text-muted-foreground shrink-0">m</span>
                            </div>
                            <div className="flex gap-2 items-center">
                              <Input
                                type="number"
                                min={-180}
                                max={180}
                                step={1}
                                value={wall.angle_deg}
                                onChange={(e) => updateWallSegment(i, "angle_deg", parseFloat(e.target.value) || 0)}
                                className="h-7 text-xs"
                              />
                              <span className="text-xs text-muted-foreground shrink-0">° turn</span>
                            </div>
                          </div>
                          {customWalls.length > 3 && (
                            <button
                              onClick={() => removeWallSegment(i)}
                              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {floorPlanImageUrl && (
                      <div className="rounded-lg border overflow-hidden">
                        <img src={floorPlanImageUrl} alt="Uploaded floor plan" className="w-full h-24 object-cover" />
                        <p className="text-[10px] text-muted-foreground p-1.5">Extracted from uploaded floor plan — adjust values as needed</p>
                      </div>
                    )}

                    <div className="pt-3 flex gap-3">
                      <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                        <RotateCcw className="w-4 h-4 mr-2" /> Change Shape
                      </Button>
                      <Button onClick={() => setStep(2)} disabled={customWalls.length < 3} className="flex-1">
                        Next: Room Type <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard dimension editor */
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div className="bg-card rounded-xl border p-6 flex items-center justify-center min-h-[300px]">
                    <ShapeSVG shapeId={selectedShape.id} dims={dimensions} scale={1} className="w-full h-full max-h-[280px]" />
                  </div>

                  <div className="space-y-4">
                    {Object.entries(selectedShape.dimensionLabels).map(([key, label]) => (
                      <div key={key} className="space-y-1.5">
                        <Label htmlFor={key}>{label}</Label>
                        <Input
                          id={key}
                          type="number"
                          min={1}
                          max={30}
                          step={0.1}
                          value={dimensions[key] || ""}
                          onChange={(e) => updateDim(key, e.target.value)}
                        />
                      </div>
                    ))}

                    <div className="pt-4 flex gap-3">
                      <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                        <RotateCcw className="w-4 h-4 mr-2" /> Change Shape
                      </Button>
                      <Button onClick={() => setStep(2)} className="flex-1">
                        Next: Room Type <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Room Type & Furniture Selection */}
          {step === 2 && selectedShape && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold">Select Room Type & Furniture</h1>
                <p className="text-muted-foreground">Choose what type of room this is, then pick the furniture you want</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-start">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Room Type</Label>
                  <div className="grid gap-2">
                    {(roomConfigs || []).map((rc) => (
                      <button
                        key={rc.room_type}
                        onClick={() => {
                          setSelectedRoomType(rc.room_type);
                          setSelectedFurniture([...rc.furniture_items]);
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                          selectedRoomType === rc.room_type
                            ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                            : "border-border hover:border-primary/30 bg-card"
                        }`}
                      >
                        <div className="text-primary">
                          {ROOM_ICONS[rc.room_type] || <Sofa className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{rc.room_label}</div>
                          {rc.description && (
                            <div className="text-xs text-muted-foreground">{rc.description}</div>
                          )}
                        </div>
                      </button>
                    ))}
                    {(!roomConfigs || roomConfigs.length === 0) && (
                      <div className="text-sm text-muted-foreground py-4 text-center">Loading room types...</div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Furniture Items {selectedFurniture.length > 0 && `(${selectedFurniture.length} selected)`}
                    </Label>
                    {activeRoomConfig && (
                      <button
                        onClick={() => {
                          if (selectedFurniture.length === activeRoomConfig.furniture_items.length) {
                            setSelectedFurniture([]);
                          } else {
                            setSelectedFurniture([...activeRoomConfig.furniture_items]);
                          }
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        {selectedFurniture.length === activeRoomConfig.furniture_items.length ? "Deselect all" : "Select all"}
                      </button>
                    )}
                  </div>

                  {activeRoomConfig ? (
                    <div className="space-y-1.5 max-h-[400px] overflow-y-auto rounded-xl border bg-card p-3">
                      {activeRoomConfig.furniture_items.map((item) => (
                        <label
                          key={item}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                            selectedFurniture.includes(item) ? "bg-primary/8" : "hover:bg-muted/50"
                          }`}
                        >
                          <Checkbox
                            checked={selectedFurniture.includes(item)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedFurniture(prev => [...prev, item]);
                              } else {
                                setSelectedFurniture(prev => prev.filter(f => f !== item));
                              }
                            }}
                          />
                          <span className="text-sm">{item}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                      ← Select a room type first to see available furniture
                    </div>
                  )}

                  {selectedFurniture.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedFurniture.map((item) => (
                        <Badge key={item} variant="secondary" className="text-xs gap-1">
                          {item}
                          <button onClick={() => setSelectedFurniture(prev => prev.filter(f => f !== item))}>
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dimensions
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!selectedRoomType || selectedFurniture.length === 0}
                >
                  Next: Openings <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Openings & Wall Surfaces */}
          {step === 3 && selectedShape && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold">Walls, Doors & Windows</h1>
                <p className="text-muted-foreground">Set wall surfaces and place openings. Click a wall to add, click an opening to remove.</p>
              </div>

              <div className="grid md:grid-cols-[1fr_300px] gap-6 items-start">
                <div className="bg-card rounded-xl border p-4 min-h-[400px] flex items-center justify-center">
                  <RoomWithOpenings
                    shapeId={selectedShape.id}
                    dims={dimensions}
                    openings={openings}
                    activeType={activeOpeningType}
                    onWallClick={addOpening}
                    onRemoveOpening={removeOpening}
                    customWalls={customWalls}
                  />
                </div>

                <div className="space-y-5">
                  {/* Wall surfaces */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Wall Surfaces</Label>
                    <div className="space-y-2">
                      {WALLS_CLOCKWISE.map((wall, i) => {
                        const WALL_COLORS_SIDEBAR = [
                          "hsl(15 55% 70%)",
                          "hsl(280 30% 68%)",
                          "hsl(140 25% 58%)",
                          "hsl(25 45% 65%)",
                        ];
                        return (
                          <div key={wall} className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-sm shrink-0 border border-border/50"
                              style={{ backgroundColor: WALL_COLORS_SIDEBAR[i] }}
                            />
                            <Select
                              value={wallSurfaces[wall]}
                              onValueChange={(val) => setWallSurfaces(prev => ({ ...prev, [wall]: val }))}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {WALL_SURFACE_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Opening type selector */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Placing:</Label>
                    <div className="flex flex-col gap-2">
                      {OPENING_TYPES.map((ot) => (
                        <button
                          key={ot.type}
                          onClick={() => setActiveOpeningType(ot.type)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left text-sm transition-all ${
                            activeOpeningType === ot.type
                              ? "border-primary bg-primary/10 font-medium"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <span className="text-lg">{ot.icon}</span>
                          <span>{ot.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Placed openings list */}
                  {openings.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Placed ({openings.length}):</Label>
                      <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                        {openings.map((o) => {
                          const typeInfo = OPENING_TYPES.find(t => t.type === o.type);
                          return (
                            <div
                              key={o.id}
                              className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/50 text-sm"
                            >
                              <span>
                                {typeInfo?.icon} {typeInfo?.label} — {WALL_LABELS[o.wall]}
                              </span>
                              <button
                                onClick={() => removeOpening(o.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    <Button onClick={generateLayouts} disabled={generating}>
                      {generating ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Layout...</>
                      ) : (
                        <>Generate Layout <ArrowRight className="w-4 h-4 ml-2" /></>
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={generateLayouts} disabled={generating} className="text-xs text-muted-foreground">
                      Skip — no openings to add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Style Selection */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold">What's Your Design Style?</h1>
                <p className="text-muted-foreground">Pick a style or upload a reference image for inspiration</p>
              </div>

              {/* Reference image upload */}
              <div className="max-w-md mx-auto">
                <div className="rounded-xl border-2 border-dashed border-border/50 p-4 text-center space-y-2">
                  {referenceImageUrl ? (
                    <div className="relative">
                      <img src={referenceImageUrl} alt="Reference" className="w-full h-32 object-cover rounded-lg" />
                      <button
                        onClick={() => setReferenceImageUrl("")}
                        className="absolute top-1 right-1 bg-background/80 rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <p className="text-xs text-muted-foreground mt-2">Reference image uploaded — style will be matched to this</p>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-2 py-2">
                      {uploadingRef ? (
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      ) : (
                        <Upload className="w-6 h-6 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">Upload a reference image (optional)</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleReferenceUpload} disabled={uploadingRef} />
                    </label>
                  )}
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">— or pick a style —</div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {styleOptions.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setSelectedStyle(style.value)}
                    className={`relative group overflow-hidden rounded-xl border-2 transition-all ${
                      selectedStyle === style.value
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {style.imageUrl ? (
                      <img
                        src={style.imageUrl}
                        alt={style.label}
                        className="w-full aspect-[4/3] object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-[4/3] bg-muted flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                      <p className="text-white font-semibold text-sm">{style.label}</p>
                      {style.description && (
                        <p className="text-white/70 text-xs line-clamp-2">{style.description}</p>
                      )}
                    </div>
                    {selectedStyle === style.value && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(4)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Layout
                </Button>
                <Button
                  onClick={saveFeedbackAndProceed}
                  disabled={savingFeedback || (!selectedStyle && !referenceImageUrl)}
                >
                  {savingFeedback ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" /> Generate Design</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Layout Result */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold">Your Suggested Layout</h1>
                <p className="text-muted-foreground">
                  {layout ? layout.description : `Optimized arrangement for your ${selectedShape?.label} room`}
                </p>
              </div>

              {!layout ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-[1fr_320px] gap-6 items-start">
                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <h3 className="font-semibold text-lg">{layout.name}</h3>
                        <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-center border border-border/30">
                          {(() => {
                            const canvasW = 400;
                            const canvasH = 320;
                            return (
                              <svg viewBox={`0 0 ${canvasW} ${canvasH}`} className="w-full h-auto max-h-[350px]">
                                <defs>
                                  <pattern id="grid-single" width="15" height="15" patternUnits="userSpaceOnUse">
                                    <path d="M 15 0 L 0 0 0 15" fill="none" stroke="hsl(var(--border) / 0.3)" strokeWidth="0.3" />
                                  </pattern>
                                </defs>
                                <rect x={10} y={10} width={canvasW - 20} height={canvasH - 20} fill="url(#grid-single)" stroke="hsl(var(--foreground) / 0.4)" strokeWidth={2} rx={1} />
                                <rect x={8} y={8} width={canvasW - 16} height={canvasH - 16} fill="none" stroke="hsl(var(--foreground) / 0.15)" strokeWidth={5} rx={2} />
                                <ArchFurnitureOverlay items={layout.items} canvasW={canvasW - 20} canvasH={canvasH - 20} />
                              </svg>
                            );
                          })()}
                        </div>
                        <ArchLegend items={layout.items.map(it => it.label)} />
                      </CardContent>
                    </Card>

                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Score each placement</h3>
                      <p className="text-xs text-muted-foreground">Agree or disagree — your feedback trains better layouts</p>
                      <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                        {layout.items.map((item, i) => {
                          const score = itemScores[i];
                          return (
                            <div key={i} className={`p-3 rounded-lg border transition-colors ${
                              score === true ? "bg-green-500/10 border-green-500/30" :
                              score === false ? "bg-red-500/10 border-red-500/30" :
                              "bg-secondary/40 border-border/50"
                            }`}>
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm">{item.label}</p>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => setItemScores(prev => ({ ...prev, [i]: prev[i] === true ? null : true }))}
                                    className={`p-1.5 rounded-md transition-colors ${
                                      score === true ? "bg-green-500/20 text-green-600" : "hover:bg-muted text-muted-foreground"
                                    }`}
                                    title="Agree"
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setItemScores(prev => ({ ...prev, [i]: prev[i] === false ? null : false }))}
                                    className={`p-1.5 rounded-md transition-colors ${
                                      score === false ? "bg-red-500/20 text-red-600" : "hover:bg-muted text-muted-foreground"
                                    }`}
                                    title="Disagree"
                                  >
                                    <ThumbsDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              {item.reason && (
                                <p className="text-xs text-muted-foreground mt-1">💡 {item.reason}</p>
                              )}
                              {score !== null && score !== undefined && (
                                <Textarea
                                  placeholder={score ? "What do you like about this?" : "Where would you prefer it?"}
                                  value={itemNotes[i] || ""}
                                  onChange={(e) => setItemNotes(prev => ({ ...prev, [i]: e.target.value }))}
                                  className="mt-2 text-xs min-h-[40px] h-10 resize-none"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {Object.keys(itemScores).length > 0 && (
                        <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                          <span className="text-green-600">
                            ✓ {Object.values(itemScores).filter(v => v === true).length} agreed
                          </span>
                          <span className="text-red-500">
                            ✗ {Object.values(itemScores).filter(v => v === false).length} disagreed
                          </span>
                          <span>
                            {layout.items.length - Object.values(itemScores).filter(v => v !== null && v !== undefined).length} unscored
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center gap-3 pt-4">
                    <Button variant="outline" onClick={() => { setStep(3); }}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back to Openings
                    </Button>
                    <Button variant="outline" onClick={() => { setItemScores({}); setItemNotes({}); generateLayouts(); }} disabled={generating}>
                      {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                      Regenerate
                    </Button>
                    <Button onClick={() => setStep(5)} disabled={!layout}>
                      Next: Style <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FloorPlan;
