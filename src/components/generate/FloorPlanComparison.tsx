import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LayoutGrid, Wand2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import IllustratedRoomPlan from "@/components/floorplan/IllustratedRoomPlan";
import { IllustratedLegend } from "@/components/floorplan/IllustratedFurniture";

interface LayoutItem {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface FloorPlanContext {
  shape: string;
  dimensions: Record<string, number>;
  roomType: string;
  furnitureItems: string[];
  openings: { type: string; wall: string; position: number }[];
  layout: { name: string; description: string; items: LayoutItem[] };
}

interface Props {
  designImageUrl: string | null;
  onRealign: (extra: {
    plannedItems: LayoutItem[];
    shape: string;
    dimensions: Record<string, number>;
  }) => Promise<void> | void;
  isRealigning?: boolean;
}

export default function FloorPlanComparison({
  designImageUrl,
  onRealign,
  isRealigning,
}: Props) {
  const [ctx, setCtx] = useState<FloorPlanContext | null>(null);
  const [detected, setDetected] = useState<LayoutItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("floor_plan_context");
      if (raw) setCtx(JSON.parse(raw));
    } catch {}
  }, []);

  // Auto-detect when design image is available
  useEffect(() => {
    if (!designImageUrl || !ctx?.layout) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke(
          "detect-top-view",
          {
            body: {
              imageUrl: designImageUrl,
              roomShape: ctx.shape,
              dimensions: ctx.dimensions,
              expectedFurniture: ctx.layout.items.map((i) => i.label),
            },
          }
        );
        if (cancelled) return;
        if (error) throw error;
        setDetected(data?.items || []);
      } catch (e: any) {
        console.error("Top-view detection failed:", e);
        toast({
          title: "Couldn't analyze design top view",
          description: e?.message || "Try again later.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [designImageUrl, ctx, toast]);

  if (!ctx?.layout) return null;

  const planned = ctx.layout.items;
  const allLabels = Array.from(
    new Set([...planned.map((i) => i.label), ...(detected || []).map((i) => i.label)])
  );

  return (
    <Card className="max-w-5xl mx-auto">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <LayoutGrid className="w-4 h-4 text-primary" />
            <span>Floor Plan vs Design — top view comparison</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              onRealign({
                plannedItems: planned,
                shape: ctx.shape,
                dimensions: ctx.dimensions,
              })
            }
            disabled={isRealigning}
          >
            {isRealigning ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            Re-align design to plan
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <LayoutGrid className="w-3 h-3" /> Planned layout — {ctx.layout.name}
            </div>
            <div className="bg-muted/30 rounded-lg p-2 border border-border/30">
              <IllustratedRoomPlan items={planned} shape={ctx.shape} dimensions={ctx.dimensions} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Eye className="w-3 h-3" /> Detected from design
            </div>
            <div className="bg-muted/30 rounded-lg p-2 border border-border/30 min-h-[200px] flex items-center justify-center">
              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Reading design…
                </div>
              )}
              {!loading && detected && detected.length > 0 && (
                <IllustratedRoomPlan items={detected} shape={ctx.shape} dimensions={ctx.dimensions} />
              )}
              {!loading && detected && detected.length === 0 && (
                <span className="text-xs text-muted-foreground">No furniture detected.</span>
              )}
              {!loading && !detected && (
                <span className="text-xs text-muted-foreground">Waiting for design…</span>
              )}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/80">
          {ctx.shape} ·{" "}
          {Object.entries(ctx.dimensions)
            .map(([, v]) => `${v}m`)
            .join(" × ")}{" "}
          · {ctx.roomType?.replace(/_/g, " ")}
        </p>

        <IllustratedLegend items={allLabels} />
      </CardContent>
    </Card>
  );
}
