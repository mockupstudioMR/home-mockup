import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Plus, Check, Pencil, Sparkles, Image as ImageIcon, Blend, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { getThumbnailImageUrl, optimizeImageFile } from "@/lib/imageOptimization";
import { MOODBOARD_DRAG_MIME } from "./TagVisual";

interface DraggedItem { label: string; imageUrl?: string | null; source?: string }

// Average two hex colors in RGB space → new hex
const mixHex = (a: string, b: string): string => {
  const parse = (h: string) => {
    const s = h.replace("#", "");
    const n = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${toHex((r1 + r2) / 2)}${toHex((g1 + g2) / 2)}${toHex((b1 + b2) / 2)}`;
};

interface ConclusionVisualsProps {
  dominantColors: string[];
  onDominantColorsChange: (colors: string[]) => void;
  styleNames: string[];
  /** Optional seed materials/textures extracted from analysis. */
  seedElements?: string[];
  /** Extra materials added externally (e.g., from style match tags). Merged into materials. */
  extraMaterials?: string[];
  /** Map of styleName -> iconic item label (e.g., "Wassily chair") for single-item style ref visuals. */
  iconicItems?: Record<string, string>;
  /** Items the user MUST keep — appear in their own section with their actual images. */
  mustIncludeItems?: { label: string; imageUrl?: string }[];
  roomType?: string;
  /** Emit the current moodboard (materials + references + must-include with images) so the parent can use it downstream. */
  onMoodboardChange?: (mb: {
    materials: { label: string; imageUrl?: string }[];
    references: { label: string; imageUrl?: string }[];
    furnitureReferences: { label: string; imageUrl?: string }[];
    decorReferences: { label: string; imageUrl?: string }[];
    mustInclude: { label: string; imageUrl?: string }[];
  }) => void;
}

type VisualKind = "material" | "styleReference";

interface VisualChipProps {
  label: string;
  kind: VisualKind;
  styleSlug: string;
  roomType: string;
  /** For style references: the iconic item to render (e.g., "Wassily chair"). */
  iconicItem?: string;
  imageUrl?: string;
  onImageReady: (url: string) => void;
  onRename: (next: string) => void;
  onRemove: () => void;
  /** Auto-generate visual on mount. */
  autoGenerate?: boolean;
}

const VisualChip = ({
  label,
  kind,
  styleSlug,
  roomType,
  iconicItem,
  imageUrl,
  onImageReady,
  onRename,
  onRemove,
  autoGenerate,
}: VisualChipProps) => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(label);

  const generate = async () => {
    if (loading || imageUrl) return;
    setLoading(true);
    try {
      const itemForStyle = iconicItem || `signature ${label} furniture piece`;
      const body =
        kind === "material"
          ? {
              type: "accentFurniture",
              style: styleSlug,
              room: roomType,
              furnitureName: label,
              furnitureDescription: `Macro detail shot of the material/texture "${label}". Show the surface up close: weave, grain, finish, light reflection. Editorial close-up photography on a neutral background.`,
            }
          : {
              type: "accentFurniture",
              style: label.toLowerCase().replace(/\s+/g, "-"),
              room: roomType,
              furnitureName: itemForStyle,
              furnitureDescription: `A single iconic ${label} furniture or decor piece — "${itemForStyle}" — shown alone as a hero product shot on a clean neutral background. ONE item only, no full room, no collage.`,
            };
      const { data, error } = await supabase.functions.invoke(
        "generate-highlight-visuals",
        { body },
      );
      if (!error && data?.imageUrl) onImageReady(data.imageUrl);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoGenerate && !imageUrl && !loading) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, label]);

  const commitRename = () => {
    const v = value.trim();
    if (!v) {
      onRemove();
    } else if (v !== label) {
      onRename(v);
    }
    setEditing(false);
  };

  return (
    <div className="group relative w-24">
      <div className="aspect-square rounded-lg overflow-hidden border border-border bg-secondary/30 relative">
        {loading ? (
          <Skeleton className="w-full h-full" />
        ) : imageUrl ? (
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={generate}
            className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
            title="Generate visual"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px]">Generate</span>
          </button>
        )}

        <button
          type="button"
          onClick={onRemove}
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Remove"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="mt-1">
        {editing ? (
          <Input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commitRename(); }
              if (e.key === "Escape") { setValue(label); setEditing(false); }
            }}
            onBlur={commitRename}
            className="h-6 text-[11px] px-1.5 py-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full text-[11px] leading-tight text-left flex items-center gap-1 hover:text-primary"
            title="Rename"
          >
            <span className="truncate">{label}</span>
            <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
};

const ConclusionVisuals = ({
  dominantColors,
  onDominantColorsChange,
  styleNames,
  seedElements,
  extraMaterials,
  iconicItems,
  mustIncludeItems,
  roomType = "living room",
  onMoodboardChange,
}: ConclusionVisualsProps) => {
  const styleSlug = useMemo(
    () => styleNames[0]?.toLowerCase().replace(/\s+/g, "-") || "modern-minimal",
    [styleNames],
  );

  // Must-include items (uploaded products OR user-added furniture).
  // Items added via the "+" tile start without an imageUrl and auto-generate one.
  const initialMustInclude = useMemo(
    () => (mustIncludeItems || []).filter((m) => m.label),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [(mustIncludeItems || []).map((m) => `${m.label}|${m.imageUrl || ""}`).join("~")],
  );
  const [mustInclude, setMustInclude] = useState(initialMustInclude);
  useEffect(() => setMustInclude(initialMustInclude), [initialMustInclude]);
  const removeMustInclude = (label: string) =>
    setMustInclude((prev) => prev.filter((m) => m.label !== label));
  const renameMustInclude = (oldLabel: string, next: string) =>
    setMustInclude((prev) => prev.map((m) => (m.label === oldLabel ? { ...m, label: next } : m)));
  const setMustIncludeImage = (label: string, url: string) =>
    setMustInclude((prev) => prev.map((m) => (m.label === label ? { ...m, imageUrl: url } : m)));
  const [newMustInclude, setNewMustInclude] = useState("");
  const [addingMustInclude, setAddingMustInclude] = useState(false);
  const [uploadingMustInclude, setUploadingMustInclude] = useState(false);
  const commitNewMustInclude = () => {
    const v = newMustInclude.trim();
    if (v && !mustInclude.some((m) => m.label.toLowerCase() === v.toLowerCase())) {
      setMustInclude((prev) => [...prev, { label: v }]);
    }
    setNewMustInclude("");
    setAddingMustInclude(false);
  };
  const handleMustIncludeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setUploadingMustInclude(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await Promise.all(files.map(async (file) => {
        if (!file.type.startsWith("image/")) return;
        const optimizedFile = await optimizeImageFile(file, { maxDimension: 2048 });
        const path = `${user.id}/must-include/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
        const { error: upErr } = await supabase.storage
          .from("room-photos")
          .upload(path, optimizedFile, { contentType: optimizedFile.type });
        if (upErr) { console.error("upload failed", upErr); return; }
        const { data: urlData } = supabase.storage.from("room-photos").getPublicUrl(path);
        const baseLabel = file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "Uploaded item";
        setMustInclude((prev) => {
          let label = baseLabel; let i = 2;
          while (prev.some((m) => m.label.toLowerCase() === label.toLowerCase())) {
            label = `${baseLabel} ${i++}`;
          }
          return [...prev, { label, imageUrl: urlData.publicUrl }];
        });
      }));
    } finally {
      setUploadingMustInclude(false);
    }
  };

  // Materials & Textures
  const initialMaterials = useMemo(
    () => Array.from(new Set((seedElements || []).filter(Boolean))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [(seedElements || []).join("|")],
  );
  const [materials, setMaterials] = useState<string[]>(initialMaterials);
  const [materialImages, setMaterialImages] = useState<Record<string, string>>({});
  useEffect(() => setMaterials(initialMaterials), [initialMaterials]);

  // Merge external additions (e.g., from style match tags) without dropping user edits
  const extraKey = (extraMaterials || []).join("|");
  useEffect(() => {
    if (!extraMaterials || extraMaterials.length === 0) return;
    setMaterials((prev) => {
      const set = new Set(prev);
      let changed = false;
      for (const m of extraMaterials) {
        if (m && !set.has(m)) { set.add(m); changed = true; }
      }
      return changed ? Array.from(set) : prev;
    });
  }, [extraKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Style References (only the actual detected style names — visuals)
  const initialReferences = useMemo(
    () => Array.from(new Set(styleNames.filter(Boolean))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [styleNames.join("|")],
  );
  const [references, setReferences] = useState<string[]>(initialReferences);
  const [referenceImages, setReferenceImages] = useState<Record<string, string>>({});
  useEffect(() => setReferences(initialReferences), [initialReferences]);

  // Furniture References — AI-generated examples of furniture pieces matching the detected style.
  // Treated as STYLE INSPIRATION (use similar pieces), not exact match. Users can also upload.
  const [furnitureReferences, setFurnitureReferences] = useState<{ label: string; imageUrl?: string }[]>([]);
  const [uploadingFurnitureRef, setUploadingFurnitureRef] = useState(false);
  const [generatingFurnitureRef, setGeneratingFurnitureRef] = useState(false);

  // Decor References — AI-generated accessories, textiles, lighting (lamps, vases, art, cushions, rugs).
  const [decorReferences, setDecorReferences] = useState<{ label: string; imageUrl?: string }[]>([]);
  const [uploadingDecorRef, setUploadingDecorRef] = useState(false);
  const [generatingDecorRef, setGeneratingDecorRef] = useState(false);

  // Drag-and-drop hover state for the two reference sections
  const [isFurnitureDropActive, setIsFurnitureDropActive] = useState(false);
  const [isDecorDropActive, setIsDecorDropActive] = useState(false);

  // Generate an AI visual for a dragged-in label that has no image yet
  const generateAiReferenceForLabel = async (
    label: string,
    kind: "furniture" | "decor",
    setter: React.Dispatch<React.SetStateAction<{ label: string; imageUrl?: string }[]>>,
  ) => {
    try {
      const body = {
        type: "accentFurniture",
        style: styleSlug,
        room: roomType,
        furnitureName: label,
        furnitureDescription:
          kind === "furniture"
            ? `A single ${styleNames[0] || "modern"}-style "${label}" furniture piece as a hero product shot on a clean neutral background. ONE item only, no full room, no collage.`
            : `A single ${styleNames[0] || "modern"}-style "${label}" decor/accessory item as a hero product shot on a clean neutral background. ONE item only, no full room, no collage.`,
      };
      const { data, error } = await supabase.functions.invoke("generate-highlight-visuals", { body });
      if (!error && data?.imageUrl) {
        setter((prev) => prev.map((m) => (m.label === label ? { ...m, imageUrl: data.imageUrl } : m)));
      }
    } catch { /* ignore */ }
  };

  const handleReferenceDrop = async (
    e: React.DragEvent,
    kind: "furniture" | "decor",
    setter: React.Dispatch<React.SetStateAction<{ label: string; imageUrl?: string }[]>>,
    setUploading: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    e.preventDefault();
    if (kind === "furniture") setIsFurnitureDropActive(false);
    else setIsDecorDropActive(false);

    // 1) Internal moodboard tag drag (from TagVisual / other moodboard items)
    const raw = e.dataTransfer.getData(MOODBOARD_DRAG_MIME);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as DraggedItem;
        const label = (parsed.label || "Reference").trim();
        if (!label) return;
        let added = false;
        setter((prev) => {
          if (prev.some((m) => m.label.toLowerCase() === label.toLowerCase())) return prev;
          added = true;
          return [...prev, { label, imageUrl: parsed.imageUrl || undefined }];
        });
        if (added && !parsed.imageUrl) {
          generateAiReferenceForLabel(label, kind, setter);
        }
        return;
      } catch { /* fall through */ }
    }

    // 2) Files dragged from desktop
    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith("image/"));
    if (files.length) {
      setUploading(true);
      try {
        await uploadInspirationImages(files, kind === "furniture" ? "furniture-ref" : "decor-ref", setter);
      } finally {
        setUploading(false);
      }
      return;
    }

    // 3) Plain-text drag (e.g., from style match keywords)
    const text = e.dataTransfer.getData("text/plain")?.trim();
    if (text) {
      let added = false;
      setter((prev) => {
        if (prev.some((m) => m.label.toLowerCase() === text.toLowerCase())) return prev;
        added = true;
        return [...prev, { label: text }];
      });
      if (added) generateAiReferenceForLabel(text, kind, setter);
    }
  };

  const handleReferenceDragOver = (e: React.DragEvent, kind: "furniture" | "decor") => {
    if (
      e.dataTransfer.types.includes(MOODBOARD_DRAG_MIME) ||
      e.dataTransfer.types.includes("text/plain") ||
      e.dataTransfer.types.includes("Files")
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      if (kind === "furniture") setIsFurnitureDropActive(true);
      else setIsDecorDropActive(true);
    }
  };

  // Auto-generate AI references for furniture & decor when style is known
  const generateAiReference = async (
    kind: "furniture" | "decor",
    setter: React.Dispatch<React.SetStateAction<{ label: string; imageUrl?: string }[]>>,
    setBusy: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    if (!styleNames[0]) return;
    setBusy(true);
    try {
      const furnitureExamples = ["sofa", "armchair", "dining table", "bed frame", "sideboard"];
      const decorExamples = ["floor lamp", "vase", "wall art", "cushion", "area rug", "pendant light"];
      const pool = kind === "furniture" ? furnitureExamples : decorExamples;
      const existing = (kind === "furniture" ? furnitureReferences : decorReferences).map((r) =>
        r.label.toLowerCase(),
      );
      const available = pool.filter((p) => !existing.some((l) => l.includes(p.toLowerCase())));
      const candidates = available.length > 0 ? available : pool;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      const label = `${styleNames[0]} ${pick}`;
      const body = {
        type: "accentFurniture",
        style: styleSlug,
        room: roomType,
        furnitureName: pick,
        furnitureDescription:
          kind === "furniture"
            ? `A single ${styleNames[0]}-style ${pick} as a hero product shot on a clean neutral background. ONE item only, no full room, no collage.`
            : `A single ${styleNames[0]}-style ${pick} (decor/accessory) as a hero product shot on a clean neutral background. ONE item only, no full room, no collage.`,
      };
      const { data, error } = await supabase.functions.invoke("generate-highlight-visuals", { body });
      if (!error && data?.imageUrl) {
        setter((prev) => [...prev, { label, imageUrl: data.imageUrl }]);
      }
    } catch { /* ignore */ } finally {
      setBusy(false);
    }
  };

  // Auto-seed one AI reference of each kind once style is detected
  useEffect(() => {
    if (!styleNames[0]) return;
    if (furnitureReferences.length === 0 && !generatingFurnitureRef) {
      generateAiReference("furniture", setFurnitureReferences, setGeneratingFurnitureRef);
    }
    if (decorReferences.length === 0 && !generatingDecorRef) {
      generateAiReference("decor", setDecorReferences, setGeneratingDecorRef);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleNames[0]]);

  const uploadInspirationImages = async (
    files: File[],
    bucketFolder: string,
    setter: React.Dispatch<React.SetStateAction<{ label: string; imageUrl?: string }[]>>,
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await Promise.all(files.map(async (file) => {
      if (!file.type.startsWith("image/")) return;
      const optimizedFile = await optimizeImageFile(file, { maxDimension: 2048 });
      const path = `${user.id}/${bucketFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
      const { error: upErr } = await supabase.storage
        .from("room-photos")
        .upload(path, optimizedFile, { contentType: optimizedFile.type });
      if (upErr) { console.error("upload failed", upErr); return; }
      const { data: urlData } = supabase.storage.from("room-photos").getPublicUrl(path);
      const baseLabel = file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "Reference";
      setter((prev) => {
        let label = baseLabel; let i = 2;
        while (prev.some((m) => m.label.toLowerCase() === label.toLowerCase())) label = `${baseLabel} ${i++}`;
        return [...prev, { label, imageUrl: urlData.publicUrl }];
      });
    }));
  };

  // Emit moodboard upward whenever it changes
  useEffect(() => {
    if (!onMoodboardChange) return;
    onMoodboardChange({
      materials: materials.map((m) => ({ label: m, imageUrl: materialImages[m] })),
      references: references.map((r) => ({ label: r, imageUrl: referenceImages[r] })),
      furnitureReferences,
      decorReferences,
      mustInclude,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materials, references, materialImages, referenceImages, mustInclude, furnitureReferences, decorReferences]);

  // Add new material/reference state
  const [newMaterial, setNewMaterial] = useState("");
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [isDropActive, setIsDropActive] = useState(false);

  const renameMaterial = (oldName: string, next: string) => {
    setMaterials((prev) => prev.map((m) => (m === oldName ? next : m)));
    setMaterialImages((prev) => {
      const { [oldName]: img, ...rest } = prev;
      return img ? { ...rest, [next]: img } : rest;
    });
  };
  const removeMaterial = (name: string) => {
    setMaterials((prev) => prev.filter((m) => m !== name));
    setMaterialImages((prev) => {
      const { [name]: _, ...rest } = prev;
      return rest;
    });
  };

  const renameReference = (oldName: string, next: string) => {
    setReferences((prev) => prev.map((m) => (m === oldName ? next : m)));
    setReferenceImages((prev) => {
      const { [oldName]: img, ...rest } = prev;
      // Renamed reference points to a different style — drop image so it regenerates
      return rest;
    });
  };
  const removeReference = (name: string) => {
    setReferences((prev) => prev.filter((m) => m !== name));
    setReferenceImages((prev) => {
      const { [name]: _, ...rest } = prev;
      return rest;
    });
  };

  // Color mixing selection
  const [mixSelection, setMixSelection] = useState<number[]>([]);
  const [isColorDropActive, setIsColorDropActive] = useState(false);
  const [extractingColors, setExtractingColors] = useState(false);

  // Extract dominant colors from an image URL using a canvas (client-side, no API call)
  const extractDominantColorsFromImage = async (url: string, count = 4): Promise<string[]> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const size = 64;
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve([]);
          ctx.drawImage(img, 0, 0, size, size);
          const { data } = ctx.getImageData(0, 0, size, size);
          const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
          for (let i = 0; i < data.length; i += 4) {
            const a = data[i + 3];
            if (a < 200) continue;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            // Skip near-white/black backgrounds
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            if (max > 245 && min > 245) continue;
            if (max < 15) continue;
            // Quantize to buckets of 32
            const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
            const cur = buckets.get(key);
            if (cur) { cur.r += r; cur.g += g; cur.b += b; cur.n += 1; }
            else buckets.set(key, { r, g, b, n: 1 });
          }
          const sorted = Array.from(buckets.values()).sort((a, b) => b.n - a.n).slice(0, count);
          const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
          resolve(sorted.map((c) => `#${toHex(c.r / c.n)}${toHex(c.g / c.n)}${toHex(c.b / c.n)}`));
        } catch {
          resolve([]);
        }
      };
      img.onerror = () => resolve([]);
      img.src = url;
    });
  };

  const handleColorDrop = async (imageUrl: string) => {
    setExtractingColors(true);
    try {
      const colors = await extractDominantColorsFromImage(imageUrl, 4);
      if (colors.length) {
        const merged = [...dominantColors];
        for (const c of colors) if (!merged.includes(c)) merged.push(c);
        onDominantColorsChange(merged);
      }
    } finally {
      setExtractingColors(false);
    }
  };

  const toggleMixPick = (index: number) => {
    setMixSelection((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      const next = [...prev, index];
      if (next.length === 2) {
        const mixed = mixHex(dominantColors[next[0]], dominantColors[next[1]]);
        onDominantColorsChange([...dominantColors, mixed]);
        return [];
      }
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-5">
      {/* Must-Include Furniture — uploaded products + user-added items */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 font-medium">
          Must-Include Furniture <span className="normal-case text-muted-foreground/70">— we'll design the room around these (optional)</span>
        </p>
        <div className="flex flex-wrap gap-3 items-start">
          {mustInclude.map((item) => (
            item.imageUrl ? (
              // Uploaded product (or already-generated visual): keep the original tile with image
              <div key={item.label} className="group relative w-24">
                <div className="aspect-square rounded-lg overflow-hidden border-2 border-primary/40 bg-secondary/30 relative">
                  <img src={getThumbnailImageUrl(item.imageUrl)} alt={item.label} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  <button
                    type="button"
                    onClick={() => removeMustInclude(item.label)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-primary/90 text-primary-foreground text-[9px] font-medium">
                    Must-have
                  </div>
                </div>
                <div className="mt-1 text-[11px] leading-tight truncate" title={item.label}>
                  {item.label}
                </div>
              </div>
            ) : (
              // User-added item: use VisualChip so it auto-generates an image and is renameable
              <VisualChip
                key={item.label}
                label={item.label}
                kind="material"
                styleSlug={styleSlug}
                roomType={roomType}
                imageUrl={undefined}
                onImageReady={(url) => setMustIncludeImage(item.label, url)}
                onRename={(next) => renameMustInclude(item.label, next)}
                onRemove={() => removeMustInclude(item.label)}
                autoGenerate
              />
            )
          ))}

          <label
            className={cn(
              "w-24 aspect-square rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-1",
              uploadingMustInclude
                ? "border-primary/40 bg-primary/5 text-primary cursor-wait"
                : "border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary cursor-pointer",
            )}
            title="Upload an image of furniture you want to keep"
          >
            {uploadingMustInclude ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[10px]">Uploading…</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span className="text-[10px]">Add item</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleMustIncludeUpload}
              disabled={uploadingMustInclude}
            />
          </label>
        </div>
      </div>

      {/* Furniture References — AI-generated + uploads, inspiration, "use similar" */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 font-medium">
          Furniture References <span className="normal-case text-muted-foreground/70">— drag tags or images here · AI examples of sofas, beds, tables, chairs in your style</span>
        </p>
        <div
          onDragOver={(e) => handleReferenceDragOver(e, "furniture")}
          onDragLeave={() => setIsFurnitureDropActive(false)}
          onDrop={(e) => handleReferenceDrop(e, "furniture", setFurnitureReferences, setUploadingFurnitureRef)}
          className={cn(
            "flex flex-wrap gap-3 items-start rounded-lg p-2 -m-2 transition-colors",
            isFurnitureDropActive && "bg-primary/5 ring-2 ring-primary/40 ring-dashed",
          )}
        >
          {furnitureReferences.map((item) => (
            <div key={item.label} className="group relative w-24">
              <div className="aspect-square rounded-lg overflow-hidden border border-border bg-secondary/30 relative">
                {item.imageUrl && (
                  <img src={getThumbnailImageUrl(item.imageUrl)} alt={item.label} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                )}
                <button
                  type="button"
                  onClick={() => setFurnitureReferences((prev) => prev.filter((m) => m.label !== item.label))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-foreground/80 text-background text-[9px] font-medium">
                  Inspiration
                </div>
              </div>
              <div className="mt-1 text-[11px] leading-tight truncate" title={item.label}>{item.label}</div>
            </div>
          ))}
          <label className={cn(
            "w-24 aspect-square rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-1",
            uploadingFurnitureRef
              ? "border-primary/40 bg-primary/5 text-primary cursor-wait"
              : "border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary cursor-pointer",
          )}>
            {uploadingFurnitureRef ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-[10px]">Uploading…</span></>
            ) : (
              <><Plus className="w-4 h-4" /><span className="text-[10px]">Add furniture</span></>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploadingFurnitureRef}
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                e.target.value = "";
                if (!files.length) return;
                setUploadingFurnitureRef(true);
                try { await uploadInspirationImages(files, "furniture-ref", setFurnitureReferences); }
                finally { setUploadingFurnitureRef(false); }
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => generateAiReference("furniture", setFurnitureReferences, setGeneratingFurnitureRef)}
            disabled={generatingFurnitureRef || !styleNames[0]}
            className={cn(
              "w-24 aspect-square rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-1",
              generatingFurnitureRef
                ? "border-primary/40 bg-primary/5 text-primary cursor-wait"
                : "border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary",
            )}
            title="Generate another AI furniture reference"
          >
            {generatingFurnitureRef ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-[10px]">Generating…</span></>
            ) : (
              <><Sparkles className="w-4 h-4" /><span className="text-[10px]">AI suggest</span></>
            )}
          </button>
        </div>
      </div>

      {/* Decor References — AI-generated + uploads, accessories, textiles, lighting */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 font-medium">
          Decor References <span className="normal-case text-muted-foreground/70">— drag tags or images here · AI examples of lamps, vases, art, cushions, rugs in your style</span>
        </p>
        <div
          onDragOver={(e) => handleReferenceDragOver(e, "decor")}
          onDragLeave={() => setIsDecorDropActive(false)}
          onDrop={(e) => handleReferenceDrop(e, "decor", setDecorReferences, setUploadingDecorRef)}
          className={cn(
            "flex flex-wrap gap-3 items-start rounded-lg p-2 -m-2 transition-colors",
            isDecorDropActive && "bg-primary/5 ring-2 ring-primary/40 ring-dashed",
          )}
        >
          {decorReferences.map((item) => (
            <div key={item.label} className="group relative w-24">
              <div className="aspect-square rounded-lg overflow-hidden border border-border bg-secondary/30 relative">
                {item.imageUrl && (
                  <img src={getThumbnailImageUrl(item.imageUrl)} alt={item.label} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                )}
                <button
                  type="button"
                  onClick={() => setDecorReferences((prev) => prev.filter((m) => m.label !== item.label))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-foreground/80 text-background text-[9px] font-medium">
                  Inspiration
                </div>
              </div>
              <div className="mt-1 text-[11px] leading-tight truncate" title={item.label}>{item.label}</div>
            </div>
          ))}
          <label className={cn(
            "w-24 aspect-square rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-1",
            uploadingDecorRef
              ? "border-primary/40 bg-primary/5 text-primary cursor-wait"
              : "border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary cursor-pointer",
          )}>
            {uploadingDecorRef ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-[10px]">Uploading…</span></>
            ) : (
              <><Plus className="w-4 h-4" /><span className="text-[10px]">Add decor</span></>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploadingDecorRef}
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                e.target.value = "";
                if (!files.length) return;
                setUploadingDecorRef(true);
                try { await uploadInspirationImages(files, "decor-ref", setDecorReferences); }
                finally { setUploadingDecorRef(false); }
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => generateAiReference("decor", setDecorReferences, setGeneratingDecorRef)}
            disabled={generatingDecorRef || !styleNames[0]}
            className={cn(
              "w-24 aspect-square rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-1",
              generatingDecorRef
                ? "border-primary/40 bg-primary/5 text-primary cursor-wait"
                : "border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary",
            )}
            title="Generate another AI decor reference"
          >
            {generatingDecorRef ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-[10px]">Generating…</span></>
            ) : (
              <><Sparkles className="w-4 h-4" /><span className="text-[10px]">AI suggest</span></>
            )}
          </button>
        </div>
      </div>

      {/* Dominant Colors */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            Dominant Colors <span className="normal-case text-muted-foreground/70">— drag tags here to add their colors</span>
          </p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Blend className="w-3 h-3" />
            {extractingColors
              ? "Extracting colors…"
              : mixSelection.length === 1
                ? "Pick a 2nd color to mix"
                : "Click 2 colors to blend"}
          </p>
        </div>
        <div
          onDragOver={(e) => {
            if (
              e.dataTransfer.types.includes(MOODBOARD_DRAG_MIME) ||
              e.dataTransfer.types.includes("text/plain")
            ) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
              setIsColorDropActive(true);
            }
          }}
          onDragLeave={() => setIsColorDropActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsColorDropActive(false);
            const raw = e.dataTransfer.getData(MOODBOARD_DRAG_MIME);
            let imageUrl: string | null = null;
            if (raw) {
              try {
                const parsed = JSON.parse(raw) as DraggedItem;
                imageUrl = parsed.imageUrl || null;
              } catch { /* ignore */ }
            }
            if (!imageUrl) return;
            handleColorDrop(imageUrl);
          }}
          className={cn(
            "flex flex-wrap gap-2 items-center rounded-lg p-2 -m-2 transition-colors",
            isColorDropActive && "bg-primary/5 ring-2 ring-primary/40 ring-dashed",
          )}
        >
          {dominantColors.map((color, index) => {
            const picked = mixSelection.includes(index);
            return (
              <div key={index} className="relative group">
                <button
                  type="button"
                  onClick={() => toggleMixPick(index)}
                  className={cn(
                    "w-10 h-10 rounded-lg border-2 transition-all",
                    picked
                      ? "border-primary ring-2 ring-primary/40 scale-105"
                      : "border-border hover:border-primary/50",
                  )}
                  style={{ backgroundColor: color }}
                  title={`${color} — click to mix`}
                />
                <input
                  type="color"
                  value={color}
                  onChange={(e) =>
                    onDominantColorsChange(
                      dominantColors.map((c, i) => (i === index ? e.target.value : c)),
                    )
                  }
                  className="absolute inset-0 w-10 h-10 opacity-0 cursor-pointer pointer-events-none"
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={() => {
                    onDominantColorsChange(dominantColors.filter((_, i) => i !== index));
                    setMixSelection([]);
                  }}
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove color"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
          <label className="w-10 h-10 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors">
            <Plus className="w-4 h-4 text-muted-foreground" />
            <input
              type="color"
              defaultValue="#808080"
              onChange={(e) => onDominantColorsChange([...dominantColors, e.target.value])}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* Materials & Textures with visuals (drop target) */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 font-medium">
          Materials &amp; Textures <span className="normal-case text-muted-foreground/70">— drag tags here</span>
        </p>
        <div
          onDragOver={(e) => {
            if (
              e.dataTransfer.types.includes(MOODBOARD_DRAG_MIME) ||
              e.dataTransfer.types.includes("text/plain")
            ) {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
              setIsDropActive(true);
            }
          }}
          onDragLeave={() => setIsDropActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDropActive(false);
            const raw = e.dataTransfer.getData(MOODBOARD_DRAG_MIME);
            let label = "";
            let imageUrl: string | null = null;
            if (raw) {
              try {
                const parsed = JSON.parse(raw) as DraggedItem;
                label = (parsed.label || "").trim();
                imageUrl = parsed.imageUrl || null;
              } catch { /* ignore */ }
            }
            if (!label) label = (e.dataTransfer.getData("text/plain") || "").trim();
            if (!label) return;
            setMaterials((prev) => (prev.includes(label) ? prev : [...prev, label]));
            if (imageUrl) {
              setMaterialImages((prev) => ({ ...prev, [label]: imageUrl as string }));
            }
          }}
          className={cn(
            "flex flex-wrap gap-3 items-start rounded-lg p-2 -m-2 transition-colors",
            isDropActive && "bg-primary/5 ring-2 ring-primary/40 ring-dashed",
          )}
        >
          {materials.map((m) => (
            <VisualChip
              key={m}
              label={m}
              kind="material"
              styleSlug={styleSlug}
              roomType={roomType}
              imageUrl={materialImages[m]}
              autoGenerate={!materialImages[m]}
              onImageReady={(url) => setMaterialImages((prev) => ({ ...prev, [m]: url }))}
              onRename={(next) => renameMaterial(m, next)}
              onRemove={() => removeMaterial(m)}
            />
          ))}

          {addingMaterial ? (
            <div className="w-24">
              <div className="aspect-square rounded-lg border-2 border-dashed border-primary/50 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <Input
                autoFocus
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = newMaterial.trim();
                    if (v && !materials.includes(v)) setMaterials((prev) => [...prev, v]);
                    setNewMaterial("");
                    setAddingMaterial(false);
                  }
                  if (e.key === "Escape") { setNewMaterial(""); setAddingMaterial(false); }
                }}
                onBlur={() => {
                  const v = newMaterial.trim();
                  if (v && !materials.includes(v)) setMaterials((prev) => [...prev, v]);
                  setNewMaterial("");
                  setAddingMaterial(false);
                }}
                placeholder="oak, linen…"
                className="mt-1 h-6 text-[11px] px-1.5 py-0"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingMaterial(true)}
              className="w-24 aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="text-[10px]">Add material</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default ConclusionVisuals;
