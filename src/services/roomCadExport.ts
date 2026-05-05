/**
 * Deterministic CAD/3D exports from a canonical RoomSpec.
 *
 *  - exportRoomDxf(spec)  → 2D floor plan (.dxf)  → SketchUp / AutoCAD / QCAD
 *  - exportRoomObj(spec)  → 3D model    (.obj)   → Blender / SketchUp (with importer)
 *
 * No AI, no external services. Walls are extruded to 2.6 m. Openings on
 * rectangle walls are cut as gaps in the wall outline (DXF) and skipped from
 * extrusion (OBJ). Furniture from `spec.layout.items` is emitted as labelled
 * boxes at floor level.
 */

import type { RoomSpec, RoomLayoutItem } from "@/types/roomSpec";

const WALL_HEIGHT_M = 2.6;
const WALL_THICKNESS_M = 0.12;
const FURNITURE_HEIGHT_M = 0.5;

/* ---------------- shared geometry ---------------- */

/** Returns the room outline in metres (clockwise, starting top-left). */
function roomOutline(spec: RoomSpec): { x: number; y: number }[] {
  if (spec.shape === "custom" && spec.custom_walls && spec.custom_walls.length > 0) {
    // custom_walls is already a polygon of vertices
    return spec.custom_walls[0];
  }
  // rectangle fallback — pull width/length/depth from dimensions
  const w = Number(spec.dimensions.width ?? spec.dimensions.w ?? 5);
  const h = Number(
    spec.dimensions.length ?? spec.dimensions.depth ?? spec.dimensions.l ?? spec.dimensions.h ?? 4,
  );
  return [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
}

function bbox(outline: { x: number; y: number }[]) {
  const xs = outline.map((p) => p.x);
  const ys = outline.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function safeName(spec: RoomSpec) {
  return (spec.name || "room").replace(/[^a-z0-9-_]+/gi, "_");
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------------- DXF (2D floor plan) ---------------- */

function dxfHeader() {
  return [
    "0", "SECTION",
    "2", "HEADER",
    "9", "$INSUNITS", "70", "6", // 6 = meters
    "0", "ENDSEC",
    "0", "SECTION",
    "2", "ENTITIES",
  ].join("\n");
}

function dxfFooter() {
  return ["0", "ENDSEC", "0", "EOF"].join("\n");
}

function dxfLine(x1: number, y1: number, x2: number, y2: number, layer = "WALLS") {
  return [
    "0", "LINE",
    "8", layer,
    "10", x1.toFixed(4),
    "20", y1.toFixed(4),
    "30", "0.0",
    "11", x2.toFixed(4),
    "21", y2.toFixed(4),
    "31", "0.0",
  ].join("\n");
}

function dxfText(x: number, y: number, height: number, value: string, layer = "LABELS") {
  return [
    "0", "TEXT",
    "8", layer,
    "10", x.toFixed(4),
    "20", y.toFixed(4),
    "30", "0.0",
    "40", height.toFixed(4),
    "1", value.replace(/\n/g, " "),
  ].join("\n");
}

function dxfRect(x: number, y: number, w: number, h: number, layer: string) {
  return [
    dxfLine(x, y, x + w, y, layer),
    dxfLine(x + w, y, x + w, y + h, layer),
    dxfLine(x + w, y + h, x, y + h, layer),
    dxfLine(x, y + h, x, y, layer),
  ].join("\n");
}

export function buildRoomDxf(spec: RoomSpec): string {
  const outline = roomOutline(spec);
  const box = bbox(outline);
  const roomW = box.maxX - box.minX;
  const roomH = box.maxY - box.minY;

  const parts: string[] = [dxfHeader()];

  // Walls — for rectangle, cut out openings as gaps. For custom, just draw outline.
  if (spec.shape !== "custom" && spec.walls && spec.walls.length > 0) {
    const sides: Record<string, { x1: number; y1: number; x2: number; y2: number }> = {
      N: { x1: box.minX, y1: box.maxY, x2: box.maxX, y2: box.maxY },
      E: { x1: box.maxX, y1: box.maxY, x2: box.maxX, y2: box.minY },
      S: { x1: box.maxX, y1: box.minY, x2: box.minX, y2: box.minY },
      W: { x1: box.minX, y1: box.minY, x2: box.minX, y2: box.maxY },
    };
    for (const wall of spec.walls) {
      const seg = sides[wall.id];
      if (!seg) continue;
      const dx = seg.x2 - seg.x1;
      const dy = seg.y2 - seg.y1;
      const len = Math.hypot(dx, dy);
      if (len === 0) continue;
      // Build sorted opening intervals along the wall (in metres along its direction)
      const openings = [...(wall.openings || [])]
        .map((o) => {
          const center = (o.position_pct / 100) * len;
          const widthPct = o.width_pct ?? 15;
          const w = (widthPct / 100) * len;
          return { start: Math.max(0, center - w / 2), end: Math.min(len, center + w / 2), type: o.type };
        })
        .sort((a, b) => a.start - b.start);
      let cursor = 0;
      const ux = dx / len;
      const uy = dy / len;
      for (const op of openings) {
        if (op.start > cursor) {
          parts.push(
            dxfLine(seg.x1 + ux * cursor, seg.y1 + uy * cursor, seg.x1 + ux * op.start, seg.y1 + uy * op.start),
          );
        }
        // Mark opening on its own layer
        const layer = op.type === "window" ? "WINDOWS" : "DOORS";
        parts.push(
          dxfLine(seg.x1 + ux * op.start, seg.y1 + uy * op.start, seg.x1 + ux * op.end, seg.y1 + uy * op.end, layer),
        );
        cursor = op.end;
      }
      if (cursor < len) {
        parts.push(dxfLine(seg.x1 + ux * cursor, seg.y1 + uy * cursor, seg.x2, seg.y2));
      }
    }
  } else {
    // Plain outline (custom polygon, or no walls metadata)
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i];
      const b = outline[(i + 1) % outline.length];
      parts.push(dxfLine(a.x, a.y, b.x, b.y));
    }
  }

  // Furniture — layout.items are percentages of the room bbox
  const items = spec.layout?.items ?? [];
  for (const it of items) {
    const x = box.minX + (it.x / 100) * roomW;
    const y = box.minY + (it.y / 100) * roomH;
    const w = (it.w / 100) * roomW;
    const h = (it.h / 100) * roomH;
    parts.push(dxfRect(x, y, w, h, "FURNITURE"));
    parts.push(dxfText(x + 0.05, y + h - 0.25, 0.18, it.label, "LABELS"));
  }

  parts.push(dxfFooter());
  return parts.join("\n");
}

export function exportRoomDxf(spec: RoomSpec, filename?: string) {
  downloadBlob(buildRoomDxf(spec), filename || `${safeName(spec)}.dxf`, "application/dxf");
}

/* ---------------- OBJ (3D model) ---------------- */

/** Append a box (axis-aligned) to OBJ buffers. Returns next vertex index. */
function appendBox(
  v: string[],
  f: string[],
  vIndex: number,
  groupName: string,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  h: number,
): number {
  // 8 corners
  const corners = [
    [x, y, z],
    [x + w, y, z],
    [x + w, y + d, z],
    [x, y + d, z],
    [x, y, z + h],
    [x + w, y, z + h],
    [x + w, y + d, z + h],
    [x, y + d, z + h],
  ];
  for (const c of corners) {
    v.push(`v ${c[0].toFixed(4)} ${c[1].toFixed(4)} ${c[2].toFixed(4)}`);
  }
  f.push(`g ${groupName}`);
  // 6 quad faces (1-indexed offsets)
  const i = vIndex;
  const quads: number[][] = [
    [0, 1, 2, 3], // bottom
    [4, 5, 6, 7], // top
    [0, 1, 5, 4], // front
    [1, 2, 6, 5], // right
    [2, 3, 7, 6], // back
    [3, 0, 4, 7], // left
  ];
  for (const q of quads) {
    f.push(`f ${i + q[0]} ${i + q[1]} ${i + q[2]} ${i + q[3]}`);
  }
  return vIndex + 8;
}

export function buildRoomObj(spec: RoomSpec): string {
  const outline = roomOutline(spec);
  const box = bbox(outline);
  const roomW = box.maxX - box.minX;
  const roomD = box.maxY - box.minY;

  const v: string[] = [];
  const f: string[] = [];
  let idx = 1;

  // Floor as a thin box
  idx = appendBox(v, f, idx, "Floor", box.minX, box.minY, -0.02, roomW, roomD, 0.02);

  // Walls — rectangle with sides N/E/S/W
  if (spec.shape !== "custom" && spec.walls && spec.walls.length > 0) {
    const sides: Record<string, { ax: number; ay: number; bx: number; by: number }> = {
      N: { ax: box.minX, ay: box.maxY, bx: box.maxX, by: box.maxY },
      E: { ax: box.maxX, ay: box.maxY, bx: box.maxX, by: box.minY },
      S: { ax: box.maxX, ay: box.minY, bx: box.minX, by: box.minY },
      W: { ax: box.minX, ay: box.minY, bx: box.minX, by: box.maxY },
    };
    for (const wall of spec.walls) {
      const seg = sides[wall.id];
      if (!seg) continue;
      const dx = seg.bx - seg.ax;
      const dy = seg.by - seg.ay;
      const len = Math.hypot(dx, dy);
      if (len === 0) continue;
      const ux = dx / len;
      const uy = dy / len;
      const openings = [...(wall.openings || [])]
        .map((o) => {
          const center = (o.position_pct / 100) * len;
          const widthPct = o.width_pct ?? 15;
          const w = (widthPct / 100) * len;
          return { start: Math.max(0, center - w / 2), end: Math.min(len, center + w / 2) };
        })
        .sort((a, b) => a.start - b.start);
      let cursor = 0;
      const segments: { start: number; end: number }[] = [];
      for (const op of openings) {
        if (op.start > cursor) segments.push({ start: cursor, end: op.start });
        cursor = Math.max(cursor, op.end);
      }
      if (cursor < len) segments.push({ start: cursor, end: len });
      for (const s of segments) {
        // Build a thin oriented box from start..end along (ux,uy)
        const sx = seg.ax + ux * s.start;
        const sy = seg.ay + uy * s.start;
        const ex = seg.ax + ux * s.end;
        const ey = seg.ay + uy * s.end;
        // Approximate as axis-aligned box if wall is N/S or E/W (always true for rectangle)
        const minX = Math.min(sx, ex) - (uy !== 0 ? WALL_THICKNESS_M / 2 : 0);
        const maxX = Math.max(sx, ex) + (uy !== 0 ? WALL_THICKNESS_M / 2 : 0);
        const minY = Math.min(sy, ey) - (ux !== 0 ? WALL_THICKNESS_M / 2 : 0);
        const maxY = Math.max(sy, ey) + (ux !== 0 ? WALL_THICKNESS_M / 2 : 0);
        idx = appendBox(
          v, f, idx, `Wall_${wall.id}`,
          minX, minY, 0,
          maxX - minX, maxY - minY, WALL_HEIGHT_M,
        );
      }
    }
  }

  // Furniture
  const items: RoomLayoutItem[] = spec.layout?.items ?? [];
  for (const it of items) {
    const x = box.minX + (it.x / 100) * roomW;
    const y = box.minY + (it.y / 100) * roomD;
    const w = (it.w / 100) * roomW;
    const d = (it.h / 100) * roomD;
    const groupName = (it.label || "Furniture").replace(/\s+/g, "_");
    idx = appendBox(v, f, idx, groupName, x, y, 0, w, d, FURNITURE_HEIGHT_M);
  }

  return [
    `# HomeMockUp room export — ${spec.name || "room"}`,
    `# units: meters · Z = up`,
    ...v,
    ...f,
    "",
  ].join("\n");
}

export function exportRoomObj(spec: RoomSpec, filename?: string) {
  downloadBlob(buildRoomObj(spec), filename || `${safeName(spec)}.obj`, "model/obj");
}