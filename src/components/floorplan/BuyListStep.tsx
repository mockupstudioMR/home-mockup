import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getAiErrorMessage } from "@/lib/aiErrorMessage";
import BuyListJourney from "./BuyListJourney";
import LayerFilm from "@/components/journey/LayerFilm";

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
  const [thumbsReady, setThumbsReady] = useState(false);
  const [cropBoxes, setCropBoxes] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const [crops, setCrops] = useState<Record<string, React.CSSProperties>>({});



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

  // Attach a photo to every line item, extracted from the design itself (same
  // source as the design refinement list): the isolated product photo when it
  // exists, otherwise a real crop of the design image at the item's bounding
  // box. A catalog photo is only used when the design has no matching item.
  // Everything is resolved and preloaded before any thumbnail is shown.
  useEffect(() => {
    if (!list?.items?.length) return;
    let cancelled = false;
    setThumbsReady(false);
    (async () => {
      try {
        const tokens = (s: string) =>
          (s || "")
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter((t) => t.length > 2);

        type Cand = { label: string; url?: string; bbox?: { x: number; y: number; width: number; height: number } };

        // 1) The items detected in this design.
        const designPhotos: Cand[] = [];
        const pushRow = (row: any) => {
          const bb = row?.bounding_box;
          const bbox =
            bb && typeof bb.x === "number" && typeof bb.width === "number"
              ? { x: bb.x, y: bb.y, width: bb.width, height: bb.height }
              : undefined;
          const url = row?.product_photo_url || undefined;
          if (!url && !bbox) return;
          designPhotos.push({
            label: [row.item_name || row.name, row.item_type || row.type, row.item_description]
              .filter(Boolean)
              .join(" "),
            url,
            bbox,
          });
        };

        if (designId) {
          const { data: di } = await supabase
            .from("design_items")
            .select("item_name, item_type, item_description, product_photo_url, bounding_box")
            .eq("design_id", designId)
            .limit(200);
          (di || []).forEach(pushRow);

          // Fall back to the design's stored extracted_items when no rows exist.
          if (!designPhotos.length) {
            const { data: gd } = await supabase
              .from("generated_designs")
              .select("extracted_items")
              .eq("id", designId)
              .maybeSingle();
            const raw = Array.isArray((gd as any)?.extracted_items) ? (gd as any).extracted_items : [];
            raw.forEach(pushRow);
          }
        }


        // 2) Catalog fallback (only when the design has nothing matching).
        const { data: products } = await supabase
          .from("shop_products")
          .select("name, type, style, image_urls")
          .eq("is_active", true)
          .not("image_urls", "is", null)
          .limit(500);

        // Synonym families so "Sectional sofa" matches a design item called
        // "Couch" and "Floor lamp" matches "Lighting".
        const FAMILIES: string[][] = [
          ["sofa", "couch", "sectional", "settee", "loveseat"],
          ["chair", "armchair", "accent", "seat", "stool", "bench"],
          ["rug", "carpet", "mat"],
          ["lamp", "light", "lighting", "pendant", "sconce", "chandelier"],
          ["table", "coffee", "side", "console", "desk", "nightstand"],
          ["bed", "headboard", "mattress"],
          ["wardrobe", "closet", "storage", "cabinet", "sideboard", "dresser", "shelf", "shelving", "bookcase"],
          ["curtain", "drape", "blind", "shade"],
          ["art", "artwork", "print", "painting", "poster", "frame", "mirror"],
          ["plant", "planter", "greenery", "tree"],
          ["cushion", "pillow", "throw", "blanket", "textile"],
          ["vase", "bowl", "decor", "object", "sculpture", "candle"],
          ["paint", "wall", "colour", "color"],
          ["floor", "flooring", "wood", "tile", "parquet", "laminate"],
        ];
        const familyOf = (t: string) => FAMILIES.findIndex((f) => f.some((w) => t.startsWith(w) || w.startsWith(t)));

        const scoreCand = (want: Set<string>, cand: Cand) => {
          const have = tokens(cand.label);
          const wantArr = [...want];
          let score = 0;
          have.forEach((h) => {
            if (want.has(h)) score += 3;
            else if (wantArr.some((w) => w.startsWith(h) || h.startsWith(w))) score += 2;
            else {
              const fh = familyOf(h);
              if (fh >= 0 && wantArr.some((w) => familyOf(w) === fh)) score += 1;
            }
          });
          return score;
        };

        const bestMatch = (want: Set<string>, pool: Cand[], min = 1, used?: Set<Cand>): Cand | undefined => {
          let best: { score: number; cand?: Cand } = { score: 0 };
          pool.forEach((p) => {
            if (used?.has(p)) return;
            const score = scoreCand(want, p);
            if (score > best.score) best = { score, cand: p };
          });
          return best.score >= min ? best.cand : undefined;
        };

        const catalogPool: Cand[] = (products || [])
          .map((p: any) => ({
            label: [p.name, p.type, p.style].filter(Boolean).join(" "),
            url: Array.isArray(p.image_urls) ? p.image_urls[0] : undefined,
          }))
          .filter((p) => Boolean(p.url));

        const map: Record<string, string> = {};
        const boxMap: Record<string, { x: number; y: number; width: number; height: number }> = {};
        const cropMap: Record<string, React.CSSProperties> = {};

        const cssCrop = (box: { x: number; y: number; width: number; height: number }, src: string) => {
          const { x, y, width, height } = box;
          const scale = Math.min(100 / Math.max(width, 1), 100 / Math.max(height, 1), 4);
          return {
            backgroundImage: `url(${src})`,
            backgroundSize: `${scale * 100}%`,
            backgroundPosition: `${x + width / 2}% ${y + height / 2}%`,
            backgroundRepeat: "no-repeat",
          } as React.CSSProperties;
        };

        // Each design item is consumed at most once so distinct rows never share
        // the same crop.
        const usedDesign = new Set<Cand>();

        // Resolve sequentially: strongest matches first would need a full
        // assignment pass, and rows are few, so a single ordered pass is enough.
        for (const it of list.items) {
          const want = new Set([...tokens(it.name), ...tokens(it.spec || "")]);
          const fromDesign = bestMatch(want, designPhotos, 1, usedDesign);

          if (fromDesign) usedDesign.add(fromDesign);

          // 1) A crop of the design image at the item's bounding box — the item
          // exactly as it appears in the design (no CORS dependency).
          if (fromDesign?.bbox && design?.imageUrl) {
            boxMap[it.name] = fromDesign.bbox;
            cropMap[it.name] = cssCrop(fromDesign.bbox, design.imageUrl);
            continue;
          }

          // 2) The isolated product photo extracted from the design.
          if (fromDesign?.url) {
            const ready = await preload(fromDesign.url);
            if (ready) {
              map[it.name] = fromDesign.url;
              continue;
            }
          }

          // 3) Catalog photo only when the design has nothing matching.
          const url = bestMatch(want, catalogPool, 3)?.url;
          if (!url) continue;
          const ready = await preload(url);
          if (ready) map[it.name] = url;
        }


        if (!cancelled) {
          setImages(map);
          setCropBoxes(boxMap);
          setCrops(cropMap);
        }

      } catch (e) {
        console.warn("[buy-list] image match failed", e);
      } finally {
        if (!cancelled) setThumbsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [list, designId, design?.imageUrl]);




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

  /** Resolve only once the bitmap is actually decoded, so nothing pops in later. */
  const preload = (src: string): Promise<boolean> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });

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

  /** Crop a region (percentages) out of the design image for the PDF thumbnails. */
  const cropDataUrl = (src: string, box: { x: number; y: number; width: number; height: number }): Promise<string | null> =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const sx = (box.x / 100) * img.width;
          const sy = (box.y / 100) * img.height;
          const sw = Math.max(8, (box.width / 100) * img.width);
          const sh = Math.max(8, (box.height / 100) * img.height);
          const side = Math.max(sw, sh);
          const canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          ctx.fillStyle = "#f3eef5";
          ctx.fillRect(0, 0, 256, 256);
          ctx.drawImage(
            img,
            Math.max(0, sx + sw / 2 - side / 2),
            Math.max(0, sy + sh / 2 - side / 2),
            side,
            side,
            0,
            0,
            256,
            256,
          );
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
          const box = cropBoxes[it.name];
          const data = src
            ? await toDataUrl(src)
            : box && design?.imageUrl
              ? await cropDataUrl(design.imageUrl, box)
              : null;
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

      {/* The build order your shopping list follows, one layer at a time. */}
      <Card className="overflow-hidden border-0">
        <LayerFilm />
      </Card>



      {((loading && !list) || (list && !thumbsReady)) && (
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {list ? "Extracting each piece from your design…" : "Calculating quantities and size constraints…"}
            </div>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {list && thumbsReady && (
        <BuyListJourney
          summary={list.summary}
          items={list.items}
          measurements={measurements}
          roomLabel={roomLabel}
          palette={palette}
          paletteNote={palette.length ? "Pulled from your moodboard — every finish below is matched to it." : undefined}
          images={images}
          crops={crops}



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
