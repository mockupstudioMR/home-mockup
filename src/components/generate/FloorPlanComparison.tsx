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
  openings: { type: "door" | "window" | "balcony"; wall: "top" | "right" | "bottom" | "left"; position: number }[];
  layout: { name: string; description: string; items: LayoutItem[] };
}

interface Props {
  designImageUrl: string | null;
  /** Current design id — used to fetch the room spec tied to THIS design (not a stale session one) */
  designId?: string | null;
  onRealign: (extra: {
    plannedItems: LayoutItem[];
    shape: string;
    dimensions: Record<string, number>;
  }) => Promise<void> | void;
  isRealigning?: boolean;
}

export default function FloorPlanComparison({
  designImageUrl,
  designId,
  onRealign,
  isRealigning,
}: Props) {
  const [ctx, setCtx] = useState<FloorPlanContext | null>(null);
  const [topViewUrl, setTopViewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load the floor plan that belongs to THIS design.
  // 1) If designId points at a real DB row, follow design.room_id → rooms row.
  // 2) Otherwise fall back to the active session floor_plan_context (fresh wizard run).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // helper: read session fallback
      const readSession = (): FloorPlanContext | null => {
        try {
          const raw = sessionStorage.getItem("floor_plan_context");
          return raw ? (JSON.parse(raw) as FloorPlanContext) : null;
        } catch {
          return null;
        }
      };

      const isRealId = designId && !designId.startsWith("design-");
      if (!isRealId) {
        if (!cancelled) setCtx(readSession());
        return;
      }

      try {
        const { data: design } = await supabase
          .from("generated_designs")
          .select("room_id")
          .eq("id", designId!)
          .maybeSingle();

        if (cancelled) return;
        const roomId = (design as any)?.room_id;
        if (!roomId) {
          setCtx(readSession());
          return;
        }

        const { data: room } = await supabase
          .from("rooms" as any)
          .select("shape, dimensions, room_type, furniture, walls, layout")
          .eq("id", roomId)
          .maybeSingle();

        if (cancelled) return;
        if (!room || !(room as any).layout) {
          setCtx(readSession());
          return;
        }

        const r: any = room;
        const flatOpenings = (r.walls ?? []).flatMap((w: any) =>
          (w.openings ?? []).map((o: any) => ({
            type: o.type,
            wall: w.id,
            position: o.position_pct,
          })),
        );

        setCtx({
          shape: r.shape,
          dimensions: r.dimensions ?? {},
          roomType: r.room_type,
          furnitureItems: r.furniture?.selectedItems ?? [],
          openings: flatOpenings,
          layout: r.layout,
        });
      } catch (e) {
        if (!cancelled) setCtx(readSession());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [designId]);

  // Auto-generate realistic top-down photo when design image is available
  useEffect(() => {
    if (!designImageUrl || !ctx?.layout) return;
    if (designImageUrl.startsWith("data:")) return; // wait for storage URL
    let cancelled = false;
    (async () => {
      setLoading(true);
      setTopViewUrl(null);
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
        if (data?.error) throw new Error(data.error);
        setTopViewUrl(data?.imageUrl || null);
      } catch (e: any) {
        if (cancelled) return;
        console.error("Top-view generation failed:", e);
        toast({
          title: "Couldn't generate top view",
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
            Re-align design to plan (1:1)
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
              <Eye className="w-3 h-3" /> Top view of the design (photorealistic)
            </div>
            <div className="bg-muted/30 rounded-lg p-2 border border-border/30 min-h-[220px] flex items-center justify-center overflow-hidden">
              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> Rendering top view…
                </div>
              )}
              {!loading && topViewUrl && (
                <img
                  src={topViewUrl}
                  alt="Top-down photorealistic view of the design"
                  className="w-full h-auto rounded-md object-contain"
                  loading="lazy"
                />
              )}
              {!loading && !topViewUrl && (
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

        <IllustratedLegend items={planned.map((it) => it.label)} />
      </CardContent>
    </Card>
  );
}
