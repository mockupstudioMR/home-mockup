import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, ImageIcon, Loader2, Printer, RotateCcw, Ruler, ShoppingBasket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getAiErrorMessage } from "@/lib/aiErrorMessage";

export interface BuyListMeasurements {
  roomWidthM?: number;
  roomLengthM?: number;
  ceilingHeightM: number;
  floorAreaSqm: number;
  perimeterM: number;
  netWallAreaSqm: number;
  skirtingM: number;
}

export interface BuyListItem {
  category: string;
  name: string;
  spec?: string;
  quantity: number;
  unit: string;
  basis: string;
  size_constraint?: string;
  unit_price_eur?: number;
  notes?: string;
}

interface BuyList {
  summary: string;
  currency?: string;
  items: BuyListItem[];
}

interface Props {
  measurements: BuyListMeasurements;
  payload: Record<string, unknown>;
  roomLabel?: string;
  design?: { title: string | null; imageUrl: string | null; itemCount: number };
  /** Persistence keys — the list is stored once per room/design and reloaded instead of regenerated. */
  roomId?: string | null;
  designId?: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  materials: "Materials & finishes",
  furniture: "Furniture",
  lighting: "Lighting",
  textiles: "Textiles",
  decor: "Decor",
  labour: "Labour",
};

const CATEGORY_ORDER = ["materials", "furniture", "lighting", "textiles", "decor", "labour"];

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
const euro = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const BuyListStep = ({ measurements, payload, roomLabel, design, roomId, designId }: Props) => {
  const [list, setList] = useState<BuyList | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const requested = useRef(false);

  const scopeKey = `${roomId || "no-room"}:${designId || "no-design"}`;

  const persist = useCallback(
    async (built: BuyList) => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id;
        if (!userId) return;
        const { error } = await supabase.from("shopping_lists").upsert(
          {
            user_id: userId,
            scope_key: scopeKey,
            room_id: roomId ?? null,
            design_id: designId ?? null,
            room_label: roomLabel ?? null,
            measurements: measurements as any,
            list: built as any,
            metadata: { payload } as any,
          },
          { onConflict: "user_id,scope_key" },
        );
        if (error) throw error;
        setSavedAt(new Date().toISOString());
      } catch (e) {
        console.warn("[buy-list] save failed", e);
      }
    },
    [scopeKey, roomId, designId, roomLabel, measurements, payload],
  );

  const build = useCallback(async (force = false) => {
    setLoading(true);
    try {
      if (!force) {
        // Reuse the stored list for this room/design instead of regenerating.
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id;
        if (userId) {
          const { data: saved } = await supabase
            .from("shopping_lists")
            .select("list, updated_at")
            .eq("user_id", userId)
            .eq("scope_key", scopeKey)
            .maybeSingle();
          const stored = saved?.list as unknown as BuyList | undefined;
          if (stored?.items?.length) {
            setList(stored);
            setSavedAt(saved?.updated_at ?? null);
            return;
          }
        }
      }

      const { data, error } = await supabase.functions.invoke("generate-buy-list", {
        body: { ...payload, measurements },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.list?.items?.length) throw new Error("Empty shopping list");
      const built = data.list as BuyList;
      setList(built);
      void persist(built);
    } catch (e) {
      toast({
        title: "Could not build the list",
        description: getAiErrorMessage(e),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [payload, measurements, scopeKey, persist]);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    build();
  }, [build]);

  // Match each line item to a catalog product photo (best token overlap on name/type).
  useEffect(() => {
    if (!list?.items?.length) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("shop_products")
          .select("name, type, style, image_urls")
          .eq("is_active", true)
          .not("image_urls", "is", null)
          .limit(500);
        if (cancelled || !data?.length) return;
        const tokens = (s: string) =>
          (s || "")
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter((t) => t.length > 2);
        const map: Record<string, string> = {};
        list.items.forEach((it) => {
          const want = new Set([...tokens(it.name), ...tokens(it.spec || "")]);
          let best: { score: number; url?: string } = { score: 0 };
          data.forEach((p: any) => {
            const url = Array.isArray(p.image_urls) ? p.image_urls[0] : undefined;
            if (!url) return;
            const have = [...tokens(p.name), ...tokens(p.type || ""), ...tokens(p.style || "")];
            const score = have.reduce((s, t) => s + (want.has(t) ? 1 : 0), 0);
            if (score > best.score) best = { score, url };
          });
          if (best.score >= 1 && best.url) map[it.name] = best.url;
        });
        if (!cancelled) setImages(map);
      } catch (e) {
        console.warn("[buy-list] image match failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [list]);

  const grouped = useMemo(() => {
    const map: Record<string, BuyListItem[]> = {};
    (list?.items || []).forEach((it) => {
      const key = CATEGORY_ORDER.includes(it.category) ? it.category : "decor";
      (map[key] ||= []).push(it);
    });
    return CATEGORY_ORDER.filter((c) => map[c]?.length).map((c) => [c, map[c]] as const);
  }, [list]);

  const total = useMemo(
    () => (list?.items || []).reduce((sum, it) => sum + (it.unit_price_eur || 0) * (it.quantity || 0), 0),
    [list],
  );

  const download = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    if (!list) return;
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Category", "Item", "Spec", "Quantity", "Unit", "Size constraint", "Basis", "Unit price (EUR)", "Line total (EUR)", "Notes"],
      ...list.items.map((it) => [
        CATEGORY_LABELS[it.category] || it.category,
        it.name,
        it.spec,
        fmt(it.quantity),
        it.unit,
        it.size_constraint,
        it.basis,
        it.unit_price_eur ?? "",
        it.unit_price_eur ? fmt(it.unit_price_eur * it.quantity) : "",
        it.notes,
      ]),
      [],
      ["", "", "", "", "", "", "Estimated total", "", fmt(total), ""],
    ];
    download(rows.map((r) => r.map(esc).join(",")).join("\n"), `shopping-list-${Date.now()}.csv`, "text/csv");
  };

  const exportTxt = () => {
    if (!list) return;
    const lines = [
      `SHOPPING LIST — ${roomLabel || "Room"}`,
      list.summary,
      "",
      `Floor ${measurements.floorAreaSqm} m² · perimeter ${measurements.perimeterM} m · walls ${measurements.netWallAreaSqm} m² · ceiling ${measurements.ceilingHeightM} m`,
      "",
      ...grouped.flatMap(([cat, items]) => [
        (CATEGORY_LABELS[cat] || cat).toUpperCase(),
        ...items.map(
          (it) =>
            `  • ${it.name} — ${fmt(it.quantity)} ${it.unit}${it.spec ? ` (${it.spec})` : ""}` +
            (it.size_constraint ? `\n      max size: ${it.size_constraint}` : "") +
            `\n      basis: ${it.basis}` +
            (it.unit_price_eur ? `\n      ${euro(it.unit_price_eur)} / ${it.unit} → ${euro(it.unit_price_eur * it.quantity)}` : ""),
        ),
        "",
      ]),
      `Estimated total: ${euro(total)}`,
    ];
    download(lines.join("\n"), `shopping-list-${Date.now()}.txt`, "text/plain");
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">What to buy</h1>
        <p className="text-muted-foreground">
          Quantified from your room measurements and the layout you picked — no new design is generated.
        </p>
      </div>

      {design && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            {design.imageUrl && (
              <img
                src={design.imageUrl}
                alt={design.title || "Your generated design"}
                loading="lazy"
                className="w-20 h-20 rounded-lg object-cover shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Built from your design</p>
              <p className="font-semibold truncate">{design.title || "Your generated design"}</p>
              <p className="text-xs text-muted-foreground">
                {design.itemCount > 0
                  ? `${design.itemCount} detected items carried into this list`
                  : "Description and moodboard carried into this list"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Ruler className="w-4 h-4 text-primary" /> Measured basis
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          {[
            ["Floor", `${measurements.floorAreaSqm} m²`],
            ["Perimeter", `${measurements.perimeterM} m`],
            ["Wall area", `${measurements.netWallAreaSqm} m²`],
            ["Skirting", `${measurements.skirtingM} m`],
            ["Ceiling", `${measurements.ceilingHeightM} m`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-secondary/40 p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-semibold">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {loading && !list && (
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Calculating quantities and size constraints…
            </div>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {list && (
        <>
          {list.summary && (
            <p className="text-sm text-muted-foreground text-center max-w-2xl mx-auto">{list.summary}</p>
          )}

          {grouped.map(([cat, items]) => (
            <Card key={cat}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShoppingBasket className="w-4 h-4 text-primary" />
                  {CATEGORY_LABELS[cat] || cat}
                  <Badge variant="outline" className="text-xs">{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.map((it, i) => (
                  <div key={`${cat}-${i}`} className="rounded-lg border border-border/50 bg-background/60 p-3 space-y-1">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{it.name}</p>
                        {it.spec && <p className="text-xs text-muted-foreground">{it.spec}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm">
                          {fmt(it.quantity)} {it.unit}
                        </p>
                        {it.unit_price_eur ? (
                          <p className="text-xs text-muted-foreground">
                            {euro(it.unit_price_eur)} / {it.unit} · {euro(it.unit_price_eur * it.quantity)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {it.size_constraint && (
                      <p className="text-xs">
                        <span className="font-medium text-primary">Max size:</span> {it.size_constraint}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">📐 {it.basis}</p>
                    {it.notes && <p className="text-xs text-muted-foreground">{it.notes}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Estimated total</p>
                <p className="text-2xl font-bold">{euro(total)}</p>
                {savedAt && (
                  <p className="text-xs text-muted-foreground">
                    Saved · {new Date(savedAt).toLocaleString("de-DE")}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={exportCsv}>
                  <Download className="w-4 h-4 mr-2" /> Export CSV
                </Button>
                <Button variant="outline" onClick={exportTxt}>
                  <FileText className="w-4 h-4 mr-2" /> Export text
                </Button>
                <Button variant="secondary" onClick={() => build(true)} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                  Recalculate
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default BuyListStep;
