import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getAiErrorMessage } from "@/lib/aiErrorMessage";
import BuyListJourney from "./BuyListJourney";

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
  const [exportingPdf, setExportingPdf] = useState(false);
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

  // Attach a photo to every line item. Priority: the item as it appears in the
  // design (design_items photos, same source as the design refinement list),
  // then a catalog product photo matched on name/type.
  useEffect(() => {
    if (!list?.items?.length) return;
    let cancelled = false;
    (async () => {
      try {
        const tokens = (s: string) =>
          (s || "")
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter((t) => t.length > 2);

        // 1) Photos of the items detected in this design.
        const designPhotos: { label: string; url: string }[] = [];
        if (designId) {
          const { data: di } = await supabase
            .from("design_items")
            .select("item_name, item_type, item_description, product_photo_url, shop_products(image_urls)")
            .eq("design_id", designId)
            .limit(200);
          (di || []).forEach((row: any) => {
            const url =
              row.product_photo_url ||
              (Array.isArray(row.shop_products?.image_urls) ? row.shop_products.image_urls[0] : undefined);
            if (!url) return;
            designPhotos.push({
              label: [row.item_name, row.item_type, row.item_description].filter(Boolean).join(" "),
              url,
            });
          });
        }

        // 2) Catalog fallback.
        const { data: products } = await supabase
          .from("shop_products")
          .select("name, type, style, image_urls")
          .eq("is_active", true)
          .not("image_urls", "is", null)
          .limit(500);

        const bestMatch = (want: Set<string>, pool: { label: string; url: string }[], min = 1) => {
          let best: { score: number; url?: string } = { score: 0 };
          pool.forEach((p) => {
            const score = tokens(p.label).reduce((s, t) => s + (want.has(t) ? 1 : 0), 0);
            if (score > best.score) best = { score, url: p.url };
          });
          return best.score >= min ? best.url : undefined;
        };

        const catalogPool = (products || [])
          .map((p: any) => ({
            label: [p.name, p.type, p.style].filter(Boolean).join(" "),
            url: Array.isArray(p.image_urls) ? p.image_urls[0] : undefined,
          }))
          .filter((p): p is { label: string; url: string } => Boolean(p.url));

        const map: Record<string, string> = {};
        list.items.forEach((it) => {
          const want = new Set([...tokens(it.name), ...tokens(it.spec || "")]);
          const url = bestMatch(want, designPhotos) || bestMatch(want, catalogPool);
          if (url) map[it.name] = url;
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

  const toDataUrl = (src: string): Promise<string | null> =>
    new Promise((resolve) => {
      if (src.startsWith("data:")) return resolve(src);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          const side = Math.min(img.width, img.height);
          ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });

  const exportPdf = async () => {
    if (!list) return;
    setExportingPdf(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const margin = 14;
      let y = margin;

      const ensure = (needed: number) => {
        if (y + needed > pageH - margin) {
          doc.addPage();
          y = margin;
        }
      };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(`Shopping list — ${roomLabel || "Room"}`, margin, y + 4);
      y += 10;

      if (list.summary) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(107, 100, 114);
        const sum = doc.splitTextToSize(list.summary, pageW - margin * 2);
        doc.text(sum, margin, y);
        y += sum.length * 4 + 2;
      }

      doc.setFontSize(8);
      doc.setTextColor(75, 68, 83);
      doc.text(
        `Floor ${measurements.floorAreaSqm} m²  ·  Perimeter ${measurements.perimeterM} m  ·  Wall area ${measurements.netWallAreaSqm} m²  ·  Skirting ${measurements.skirtingM} m  ·  Ceiling ${measurements.ceilingHeightM} m`,
        margin,
        y,
      );
      y += 8;

      // Pre-resolve images for the items we will print.
      const entries = grouped.flatMap(([, items]) => items);
      const resolved: Record<string, string> = {};
      await Promise.all(
        entries.map(async (it) => {
          const src = images[it.name];
          if (!src) return;
          const data = await toDataUrl(src);
          if (data) resolved[it.name] = data;
        }),
      );

      for (const [cat, items] of grouped) {
        ensure(14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(122, 92, 134);
        doc.text((CATEGORY_LABELS[cat] || cat).toUpperCase(), margin, y);
        y += 5;

        for (const it of items) {
          const textX = margin + 20;
          const textW = pageW - margin * 2 - 20 - 34;
          const detail: string[] = [];
          if (it.spec) detail.push(it.spec);
          if (it.size_constraint) detail.push(`Max size: ${it.size_constraint}`);
          detail.push(`Basis: ${it.basis}`);
          if (it.notes) detail.push(it.notes);
          const detailLines = detail.flatMap((d) => doc.splitTextToSize(d, textW) as string[]);
          const rowH = Math.max(18, 6 + detailLines.length * 3.6);
          ensure(rowH + 2);

          const img = resolved[it.name];
          if (img) {
            try {
              doc.addImage(img, "JPEG", margin, y, 16, 16);
            } catch {
              /* ignore bad image */
            }
          } else {
            doc.setFillColor(243, 238, 245);
            doc.roundedRect(margin, y, 16, 16, 1.5, 1.5, "F");
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(43, 36, 48);
          doc.text(doc.splitTextToSize(it.name, textW)[0], textX, y + 4);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(107, 100, 114);
          doc.text(detailLines, textX, y + 8.5);

          const qtyX = pageW - margin;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(43, 36, 48);
          doc.text(`${fmt(it.quantity)} ${it.unit}`, qtyX, y + 4, { align: "right" });
          if (it.unit_price_eur) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(107, 100, 114);
            doc.text(`${euro(it.unit_price_eur)} / ${it.unit}`, qtyX, y + 8, { align: "right" });
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(43, 36, 48);
            doc.text(euro(it.unit_price_eur * it.quantity), qtyX, y + 12.5, { align: "right" });
          }

          y += rowH;
          doc.setDrawColor(236, 231, 239);
          doc.line(margin, y, pageW - margin, y);
          y += 3;
        }
        y += 3;
      }

      ensure(16);
      doc.setDrawColor(122, 92, 134);
      doc.setLineWidth(0.6);
      doc.line(margin, y, pageW - margin, y);
      doc.setLineWidth(0.2);
      y += 7;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(43, 36, 48);
      doc.text("Estimated total", margin, y);
      doc.text(euro(total), pageW - margin, y, { align: "right" });

      const safe = (roomLabel || "room").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      doc.save(`shopping-list-${safe || "room"}.pdf`);
    } catch (e) {
      console.error("PDF export failed", e);
      toast({
        title: "PDF export failed",
        description: "Could not build the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExportingPdf(false);
    }
  };

  const palette = useMemo(() => {
    const raw =
      (payload as any)?.color_palette ??
      (payload as any)?.colors ??
      (payload as any)?.moodboard?.colors ??
      [];
    const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/[,;]/) : [];
    return list
      .map((c: any) => (typeof c === "string" ? c : c?.hex))
      .filter((c: any): c is string => typeof c === "string" && /^#?[0-9a-f]{6}$/i.test(c.trim()))
      .map((c: string) => (c.trim().startsWith("#") ? c.trim() : `#${c.trim()}`))
      .slice(0, 6);
  }, [payload]);

  return (
    <div className="space-y-6">
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
        <BuyListJourney
          summary={list.summary}
          items={list.items}
          measurements={measurements}
          roomLabel={roomLabel}
          palette={palette}
          paletteNote={palette.length ? "Pulled from your moodboard — every finish below is matched to it." : undefined}
          images={images}
          total={total}
          savedAt={savedAt}
          actions={
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={exportCsv}>
                <Download className="w-4 h-4 mr-2" /> CSV
              </Button>
              <Button variant="outline" onClick={exportTxt}>
                <FileText className="w-4 h-4 mr-2" /> Text
              </Button>
              <Button onClick={exportPdf} disabled={exportingPdf}>
                {exportingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                {exportingPdf ? "Building PDF…" : "Download PDF"}
              </Button>
              <Button variant="secondary" onClick={() => build(true)} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                Recalculate
              </Button>
            </div>
          }
        />
      )}
    </div>
  );
};

export default BuyListStep;
