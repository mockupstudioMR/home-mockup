import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, Loader2, Printer, RotateCcw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getAiErrorMessage } from "@/lib/aiErrorMessage";
import { invokeQueued } from "@/lib/aiQueue";
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

interface WritableFileHandle {
  createWritable: () => Promise<{
    write: (data: Blob) => Promise<void>;
    close: () => Promise<void>;
  }>;
}

type SaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: Array<{ description: string; accept: Record<string, string[]> }>;
  }) => Promise<WritableFileHandle>;
};

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
  const [pdfDownload, setPdfDownload] = useState<{ blob: Blob; url: string; filename: string } | null>(null);
  const requested = useRef(false);

  useEffect(() => {
    return () => {
      if (pdfDownload?.url.startsWith("blob:")) URL.revokeObjectURL(pdfDownload.url);
    };
  }, [pdfDownload]);

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

  // Attach photos extracted from this exact design. When an older design has
  // never been analysed, analyse it here first and wait for the bounding boxes
  // before revealing the list. Never substitute catalog/generic imagery.
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

        type Cand = {
          label: string;
          url?: string;
          bbox?: { x: number; y: number; width: number; height: number };
          id?: string;
          itemName?: string;
          itemType?: string;
          itemDescription?: string;
        };

        // 1) The items detected in this design.
        const designPhotos: Cand[] = [];
        const pushRow = (row: any) => {
          const bb = row?.bounding_box ?? row?.boundingBox;
          const bbox =
            bb && typeof bb.x === "number" && typeof bb.width === "number"
              ? { x: bb.x, y: bb.y, width: bb.width, height: bb.height }
              : undefined;
          const url = row?.product_photo_url || row?.productPhotoUrl || undefined;
          if (!url && !bbox) return;
          const itemName = row.item_name || row.itemName || row.name;
          const itemType = row.item_type || row.itemType || row.type;
          const itemDescription = row.item_description || row.itemDescription;
          designPhotos.push({
            label: [itemName, itemType, itemDescription].filter(Boolean).join(" "),
            url,
            bbox,
            id: row.id,
            itemName,
            itemType,
            itemDescription,
          });
        };

        if (designId) {
          const { data: di, error: itemsError } = await supabase
            .from("design_items")
            .select("id, item_name, item_type, item_description, product_photo_url, bounding_box")
            .eq("design_id", designId)
            .limit(200);
          if (itemsError) throw itemsError;
          (di || []).forEach(pushRow);


          // Older generated designs can have an image but no extraction rows.
          // Run the same extraction used by design refinement, then consume its
          // exact bounding boxes immediately rather than showing placeholders.
          if (!designPhotos.length) {
            const { data: gd } = await supabase
              .from("generated_designs")
              .select("extracted_items")
              .eq("id", designId)
              .maybeSingle();
            const raw = Array.isArray((gd as any)?.extracted_items) ? (gd as any).extracted_items : [];
            raw.forEach(pushRow);
          }

          if (!designPhotos.length && design?.imageUrl) {
            const { data: extracted, error: extractionError } = await invokeQueued<{
              success?: boolean;
              error?: string;
              items?: unknown[];
            }>("extract-room-items", { imageUrl: design.imageUrl, designId });
            if (extractionError) throw extractionError;
            if (extracted?.success === false) throw new Error(extracted.error || "Item extraction failed");
            const extractedRows = Array.isArray(extracted?.items) ? extracted.items : [];
            extractedRows.forEach(pushRow);
          }
        }

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
        const pending: Array<{ rowName: string; cand: Cand }> = [];

        for (const it of list.items) {
          const want = new Set([...tokens(it.name), ...tokens(it.spec || "")]);
          const fromDesign = bestMatch(want, designPhotos, 1, usedDesign);

          if (fromDesign) usedDesign.add(fromDesign);
          if (!fromDesign) continue;

          // 1) The isolated single-item photo on a white background — the
          // cleanest possible thumbnail.
          if (fromDesign.url) {
            const ready = await preload(fromDesign.url);
            if (ready) {
              map[it.name] = fromDesign.url;
              continue;
            }
          }

          // 2) Fall back to a crop of the design image while the isolated photo
          // is being generated.
          if (fromDesign.bbox && design?.imageUrl) {
            boxMap[it.name] = fromDesign.bbox;
            cropMap[it.name] = cssCrop(fromDesign.bbox, design.imageUrl);
          }

          if (fromDesign.id) pending.push({ rowName: it.name, cand: fromDesign });

          // No generic fallback: an unmatched construction/material row
          // intentionally has no thumbnail.
        }

        if (!cancelled) {
          setImages(map);
          setCropBoxes(boxMap);
          setCrops(cropMap);
          setThumbsReady(true);
        }

        // Generate the white-background, single-item photos for anything that
        // only has a crop so far, then swap them in as they arrive.
        if (pending.length && designId && design?.imageUrl) {
          const { data: iso } = await invokeQueued<{
            success?: boolean;
            results?: Array<{ itemId: string; photoUrl: string | null }>;
          }>("isolate-product-photos", {
            designId,
            designImageUrl: design.imageUrl,
            items: pending.map(({ cand }) => ({
              id: cand.id,
              item_name: cand.itemName || cand.label,
              item_description: cand.itemDescription || cand.label,
              item_type: cand.itemType || "furniture",
              bounding_box: cand.bbox,
            })),
          });

          const byId = new Map((iso?.results || []).map((r) => [r.itemId, r.photoUrl]));
          const fresh: Record<string, string> = {};
          for (const { rowName, cand } of pending) {
            const url = cand.id ? byId.get(cand.id) : null;
            if (!url) continue;
            if (await preload(url)) fresh[rowName] = url;
          }
          if (!cancelled && Object.keys(fresh).length) {
            setImages((prev) => ({ ...prev, ...fresh }));
          }
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

  const requestSaveHandle = (filename: string, mime: string) => {
    const picker = (window as SaveFilePickerWindow).showSaveFilePicker;
    if (!picker) return null;
    const extension = `.${filename.split(".").pop() || "pdf"}`;
    return picker.call(window, {
      suggestedName: filename,
      types: [{ description: `${extension.slice(1).toUpperCase()} file`, accept: { [mime]: [extension] } }],
    });
  };

  const createHostedDownload = async (blob: Blob, filename: string) => {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (authError || !userId) throw authError || new Error("Sign in is required to download files");

    const safeName = filename.replace(/[^a-z0-9._-]+/gi, "-");
    const path = `${userId}/exports/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("room-uploads").upload(path, blob, {
      contentType: blob.type || "application/octet-stream",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: signed, error: signedError } = await supabase.storage
      .from("room-uploads")
      .createSignedUrl(path, 300, { download: filename });
    if (signedError || !signed?.signedUrl) throw signedError || new Error("Could not prepare download");

    return signed.signedUrl;
  };

  const saveBlob = async (blob: Blob, filename: string, handle?: WritableFileHandle | null) => {
    if (handle) {
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      toast({ title: "Download complete", description: `${filename} was saved.` });
      return;
    }

    const signedUrl = await createHostedDownload(blob, filename);

    const frame = document.createElement("iframe");
    frame.hidden = true;
    frame.src = signedUrl;
    document.body.appendChild(frame);
    window.setTimeout(() => frame.remove(), 60_000);
    toast({ title: "Download ready", description: `${filename} is being saved.` });
  };

  const download = async (content: string, filename: string, mime: string) => {
    try {
      const handle = await requestSaveHandle(filename, mime);
      await saveBlob(new Blob([content], { type: `${mime};charset=utf-8;` }), filename, handle);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Download failed", error);
      toast({ title: "Download failed", description: "The file could not be saved. Please try again.", variant: "destructive" });
    }
  };

  const printPreparedPdf = () => {
    document.body.classList.add("printing-shopping-list");
    const cleanup = () => document.body.classList.remove("printing-shopping-list");
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1_000);
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
    void download(rows.map((r) => r.map(esc).join(",")).join("\n"), `shopping-list-${Date.now()}.csv`, "text/csv");
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
    void download(lines.join("\n"), `shopping-list-${Date.now()}.txt`, "text/plain");
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
      let settled = false;
      const finish = (value: string | null) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        resolve(value);
      };
      const timeout = window.setTimeout(() => finish(null), 5000);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext("2d");
          if (!ctx) return finish(null);
          const side = Math.min(img.width, img.height);
          ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256);
          finish(canvas.toDataURL("image/jpeg", 0.82));
        } catch {
          finish(null);
        }
      };
      img.onerror = () => finish(null);
      img.src = src;
    });

  /** Crop a region (percentages) out of the design image for the PDF thumbnails. */
  const cropDataUrl = (src: string, box: { x: number; y: number; width: number; height: number }): Promise<string | null> =>
    new Promise((resolve) => {
      let settled = false;
      const finish = (value: string | null) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        resolve(value);
      };
      const timeout = window.setTimeout(() => finish(null), 5000);
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
          if (!ctx) return finish(null);
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
          finish(canvas.toDataURL("image/jpeg", 0.82));
        } catch {
          finish(null);
        }
      };
      img.onerror = () => finish(null);
      img.src = src;
    });

  const exportPdf = async () => {
    if (!list) return;
    setPdfDownload(null);
    const safe = (roomLabel || "room").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const filename = `shopping-list-${safe || "room"}.pdf`;
    setExportingPdf(true);
    try {
      // jsPDF ships both a named and a default export depending on the bundle
      // interop; pick whichever is the actual constructor.
      const mod: any = await import("jspdf");
      const jsPDF: any = typeof mod?.jsPDF === "function" ? mod.jsPDF : typeof mod?.default === "function" ? mod.default : mod?.default?.jsPDF;
      if (typeof jsPDF !== "function") throw new Error("jsPDF failed to load");
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

      const blob: Blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      setPdfDownload({ blob, url, filename });
      toast({ title: "PDF ready", description: "Use Print / Save as PDF below." });
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
              {pdfDownload ? (
                <Button type="button" onClick={printPreparedPdf}>
                  <Printer className="w-4 h-4 mr-2" /> Print / Save as PDF
                </Button>
              ) : (
                <Button onClick={exportPdf} disabled={exportingPdf}>
                  {exportingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  {exportingPdf ? "Building PDF…" : "Download PDF"}
                </Button>
              )}
              <Button variant="secondary" onClick={() => build(true)} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                Recalculate
              </Button>
            </div>
          }
        />
      )}

      {pdfDownload && (
        <section className="shopping-print-view space-y-5 bg-card p-5 sm:p-8 border" aria-label="Printable shopping list">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">HomeMockUp</p>
              <h2 className="text-2xl font-semibold">Shopping list</h2>
              <p className="text-sm text-muted-foreground">{roomLabel || design?.title || "Your room"}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" className="print:hidden" onClick={() => setPdfDownload(null)} aria-label="Close printable view">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div><p className="text-muted-foreground">Floor area</p><p className="font-semibold">{fmt(measurements.floorAreaSqm)} m²</p></div>
            <div><p className="text-muted-foreground">Wall area</p><p className="font-semibold">{fmt(measurements.netWallAreaSqm)} m²</p></div>
            <div><p className="text-muted-foreground">Perimeter</p><p className="font-semibold">{fmt(measurements.perimeterM)} m</p></div>
            <div><p className="text-muted-foreground">Estimated total</p><p className="font-semibold">{euro(total)}</p></div>
          </div>

          {grouped.map(([category, items]) => (
            <div key={category} className="space-y-2 break-inside-avoid">
              <h3 className="border-b pb-1 font-semibold">{CATEGORY_LABELS[category] || category}</h3>
              {items.map((item, index) => (
                <div key={`${category}-${item.name}-${index}`} className="grid grid-cols-[1fr_auto] gap-4 border-b py-2 text-sm break-inside-avoid">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground">{[item.spec, item.size_constraint, item.notes].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{fmt(item.quantity)} {item.unit}</p>
                    {item.unit_price_eur ? <p className="text-muted-foreground">{euro(item.unit_price_eur * item.quantity)}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div className="flex justify-between border-t-2 border-primary pt-4 text-lg font-semibold">
            <span>Estimated total</span><span>{euro(total)}</span>
          </div>

          <Button type="button" onClick={printPreparedPdf} className="print:hidden w-full sm:w-auto">
            <Printer className="w-4 h-4 mr-2" /> Print / Save as PDF
          </Button>
        </section>
      )}
    </div>
  );
};

export default BuyListStep;
