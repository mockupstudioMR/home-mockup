import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { IllustratedFurniture, IllustratedLegend } from "@/components/floorplan/IllustratedFurniture";
import { LayoutGrid } from "lucide-react";

interface LayoutItem {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  reason?: string;
}

interface FloorPlanContext {
  shape: string;
  dimensions: Record<string, number>;
  roomType: string;
  furnitureItems: string[];
  openings: { type: string; wall: string; position: number }[];
  layout: {
    name: string;
    description: string;
    items: LayoutItem[];
  };
}

export default function FloorPlanPreview() {
  const [ctx, setCtx] = useState<FloorPlanContext | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("floor_plan_context");
      if (raw) setCtx(JSON.parse(raw));
    } catch {}
  }, []);

  if (!ctx?.layout) return null;

  const canvasW = 340;
  const canvasH = 260;
  const { layout, shape, dimensions, roomType } = ctx;

  const dimLabel = Object.entries(dimensions)
    .map(([k, v]) => `${v}m`)
    .join(" × ");

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <LayoutGrid className="w-4 h-4 text-primary" />
          <span>Floor Plan — {layout.name}</span>
        </div>

        <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-center border border-border/30">
          <svg viewBox={`0 0 ${canvasW} ${canvasH}`} className="w-full h-auto max-h-[220px]">
            <defs>
              <pattern id="fp-grid" width="15" height="15" patternUnits="userSpaceOnUse">
                <path d="M 15 0 L 0 0 0 15" fill="none" stroke="hsl(var(--border) / 0.3)" strokeWidth="0.3" />
              </pattern>
            </defs>
            {/* Room outline */}
            <rect x={10} y={10} width={canvasW - 20} height={canvasH - 20} fill="url(#fp-grid)" stroke="hsl(var(--foreground) / 0.4)" strokeWidth={2} rx={1} />
            <rect x={8} y={8} width={canvasW - 16} height={canvasH - 16} fill="none" stroke="hsl(var(--foreground) / 0.15)" strokeWidth={5} rx={2} />
            {/* Furniture */}
            {layout.items.map((item, i) => {
              const x = (item.x / 100) * (canvasW - 20) + 10;
              const y = (item.y / 100) * (canvasH - 20) + 10;
              const w = (item.w / 100) * (canvasW - 20);
              const h = (item.h / 100) * (canvasH - 20);
              return <IllustratedFurniture key={i} x={x} y={y} w={w} h={h} label={item.label} />;
            })}
          </svg>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{layout.description}</p>
          <p className="text-[10px] text-muted-foreground/70 capitalize">
            {shape} · {dimLabel} · {roomType?.replace(/_/g, " ")}
          </p>
          <IllustratedLegend items={layout.items.map((it) => it.label)} />
        </div>
      </CardContent>
    </Card>
  );
}
