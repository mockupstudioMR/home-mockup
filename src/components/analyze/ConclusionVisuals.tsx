import { useEffect, useMemo, useRef, useState } from "react";
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
    architectureReferences: { label: string; imageUrl?: string }[];
    mustInclude: { label: string; imageUrl?: string }[];
  }) => void;
  /** Called once the initial auto-seeded references (3 furniture + 3 decor) are all generated. */
  onSeedReady?: () => void;
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

  // Stable rotation per chip based on label hash
  const rot = useMemo(() => {
    let h = 0;
    for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0;
    return ((h % 500) / 500) * 5 - 2.5; // -2.5°..+2.5°
  }, [label]);

  return (
    <div
      className="group relative w-28"
      style={{ transform: `rotate(${rot}deg)` }}
    >
      {/* Polaroid frame */}
      <div className="bg-card p-1.5 pb-6 shadow-[0_6px_14px_-6px_hsl(var(--foreground)/0.35),0_2px_4px_-2px_hsl(var(--foreground)/0.2)] rounded-sm">
        {/* Tape accent */}
        <div
          aria-hidden
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-10 h-3 rotate-[-4deg] bg-secondary/70 border border-border/40 rounded-[2px] shadow-sm"
        />
        <div className="aspect-square overflow-hidden bg-muted/40 relative">
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

        {/* Handwritten caption */}
        <div className="mt-1.5 px-1">
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
              className="w-full text-[12px] leading-tight text-left flex items-center gap-1 hover:text-primary font-serif italic text-foreground/80"
              title="Rename"
            >
              <span className="truncate">{label}</span>
              <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 shrink-0" />
            </button>
          )}
        </div>
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
  onSeedReady,
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

  // Architecture References — wall treatments, mouldings, ceiling details, flooring patterns, built-ins.
  const [architectureReferences, setArchitectureReferences] = useState<{ label: string; imageUrl?: string }[]>([]);
  const [uploadingArchitectureRef, setUploadingArchitectureRef] = useState(false);
  const [generatingArchitectureRef, setGeneratingArchitectureRef] = useState(false);

  // Drag-and-drop hover state for the two reference sections
  const [isFurnitureDropActive, setIsFurnitureDropActive] = useState(false);
  const [isDecorDropActive, setIsDecorDropActive] = useState(false);
  const [isArchitectureDropActive, setIsArchitectureDropActive] = useState(false);
  const [isMustIncludeDropActive, setIsMustIncludeDropActive] = useState(false);

  // Helper to start a drag of a reference item (for moving into Must-Include or back out)
  const startItemDrag = (
    e: React.DragEvent,
    item: { label: string; imageUrl?: string },
    source: "reference" | "must-include" = "reference",
  ) => {
    const payload = JSON.stringify({ label: item.label, imageUrl: item.imageUrl || null, source });
    e.dataTransfer.setData(MOODBOARD_DRAG_MIME, payload);
    e.dataTransfer.setData("text/plain", item.label);
    e.dataTransfer.effectAllowed = "copyMove";
  };

  const handleMustIncludeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsMustIncludeDropActive(false);
    const raw = e.dataTransfer.getData(MOODBOARD_DRAG_MIME);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as DraggedItem;
      const label = (parsed.label || "").trim();
      if (!label) return;
      // Moving FROM a reference section INTO must-include: remove from origin
      if (parsed.source === "reference") {
        setFurnitureReferences((prev) => prev.filter((m) => m.label.toLowerCase() !== label.toLowerCase()));
        setDecorReferences((prev) => prev.filter((m) => m.label.toLowerCase() !== label.toLowerCase()));
        setArchitectureReferences((prev) => prev.filter((m) => m.label.toLowerCase() !== label.toLowerCase()));
      }
      setMustInclude((prev) => {
        if (prev.some((m) => m.label.toLowerCase() === label.toLowerCase())) return prev;
        return [...prev, { label, imageUrl: parsed.imageUrl || undefined }];
      });
    } catch { /* ignore */ }
  };


  // Generate an AI visual for a dragged-in label that has no image yet
  const generateAiReferenceForLabel = async (
    label: string,
    kind: "furniture" | "decor" | "architecture",
    setter: React.Dispatch<React.SetStateAction<{ label: string; imageUrl?: string }[]>>,
  ) => {
    try {
      const descByKind: Record<typeof kind, string> = {
        furniture: `A single ${styleNames[0] || "modern"}-style "${label}" furniture piece as a hero product shot on a clean neutral background. ONE item only, no full room, no collage.`,
        decor: `A single ${styleNames[0] || "modern"}-style "${label}" decor/accessory item as a hero product shot on a clean neutral background. ONE item only, no full room, no collage.`,
        architecture: `A close-up architectural reference of "${label}" in a ${styleNames[0] || "modern"} interior style — wall treatment / moulding / ceiling / flooring / built-in detail. Clean photo, no furniture, no people.`,
      };
      const body = {
        type: "accentFurniture",
        style: styleSlug,
        room: roomType,
        furnitureName: label,
        furnitureDescription: descByKind[kind],
      };
      const { data, error } = await supabase.functions.invoke("generate-highlight-visuals", { body });
      if (!error && data?.imageUrl) {
        setter((prev) => prev.map((m) => (m.label === label ? { ...m, imageUrl: data.imageUrl } : m)));
      }
    } catch { /* ignore */ }
  };

  const handleReferenceDrop = async (
    e: React.DragEvent,
    kind: "furniture" | "decor" | "architecture",
    setter: React.Dispatch<React.SetStateAction<{ label: string; imageUrl?: string }[]>>,
    setUploading: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    e.preventDefault();
    if (kind === "furniture") setIsFurnitureDropActive(false);
    else if (kind === "decor") setIsDecorDropActive(false);
    else setIsArchitectureDropActive(false);

    // 1) Internal moodboard tag drag (from TagVisual / other moodboard items)
    const raw = e.dataTransfer.getData(MOODBOARD_DRAG_MIME);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as DraggedItem;
        const label = (parsed.label || "Reference").trim();
        if (!label) return;
        // If dragged FROM must-include, remove it there (move semantics)
        if (parsed.source === "must-include") {
          setMustInclude((prev) => prev.filter((m) => m.label.toLowerCase() !== label.toLowerCase()));
        }
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
        const folder =
          kind === "furniture" ? "furniture-ref" : kind === "decor" ? "decor-ref" : "architecture-ref";
        await uploadInspirationImages(files, folder, setter);
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

  const handleReferenceDragOver = (e: React.DragEvent, kind: "furniture" | "decor" | "architecture") => {
    if (
      e.dataTransfer.types.includes(MOODBOARD_DRAG_MIME) ||
      e.dataTransfer.types.includes("text/plain") ||
      e.dataTransfer.types.includes("Files")
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      if (kind === "furniture") setIsFurnitureDropActive(true);
      else if (kind === "decor") setIsDecorDropActive(true);
      else setIsArchitectureDropActive(true);
    }
  };

  // Auto-generate AI references for furniture & decor when style is known
  const generateAiReference = async (
    kind: "furniture" | "decor" | "architecture",
    setter: React.Dispatch<React.SetStateAction<{ label: string; imageUrl?: string }[]>>,
    setBusy: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    if (!styleNames[0]) return;
    setBusy(true);
    try {
      const furnitureExamples = ["sofa", "armchair", "dining table", "bed frame", "sideboard"];
      const decorExamples = ["floor lamp", "vase", "wall art", "cushion", "area rug", "pendant light"];
      const architectureExamples = [
        "wainscoting wall panel",
        "crown moulding",
        "coffered ceiling",
        "herringbone wood floor",
        "arched doorway",
        "exposed brick wall",
        "built-in shelving",
      ];
      const pool =
        kind === "furniture" ? furnitureExamples : kind === "decor" ? decorExamples : architectureExamples;
      const existingList =
        kind === "furniture" ? furnitureReferences : kind === "decor" ? decorReferences : architectureReferences;
      const existing = existingList.map((r) => r.label.toLowerCase());
      const available = pool.filter((p) => !existing.some((l) => l.includes(p.toLowerCase())));
      const candidates = available.length > 0 ? available : pool;
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      const label = `${styleNames[0]} ${pick}`;
      const descByKind = {
        furniture: `A single ${styleNames[0]}-style ${pick} as a hero product shot on a clean neutral background. ONE item only, no full room, no collage.`,
        decor: `A single ${styleNames[0]}-style ${pick} (decor/accessory) as a hero product shot on a clean neutral background. ONE item only, no full room, no collage.`,
        architecture: `A close-up architectural reference of ${pick} in a ${styleNames[0]} interior — wall treatment / moulding / ceiling / flooring / built-in detail. Clean photo, no furniture, no people.`,
      } as const;
      const body = {
        type: "accentFurniture",
        style: styleSlug,
        room: roomType,
        furnitureName: pick,
        furnitureDescription: descByKind[kind],
      };
      const { data, error } = await supabase.functions.invoke("generate-highlight-visuals", { body });
      if (!error && data?.imageUrl) {
        setter((prev) => [...prev, { label, imageUrl: data.imageUrl }]);
      }
    } catch { /* ignore */ } finally {
      setBusy(false);
    }
  };

  // Auto-seed THREE AI references of each kind once style is detected.
  // Fires onSeedReady once the initial batch has finished (success or fail).
  const seededRef = useRef(false);
  useEffect(() => {
    if (!styleNames[0]) return;
    if (seededRef.current) return;
    if (furnitureReferences.length > 0 || decorReferences.length > 0) return;
    seededRef.current = true;
    const TARGET = 3;
    const furniturePromises = Array.from({ length: TARGET }).map(() =>
      generateAiReference("furniture", setFurnitureReferences, setGeneratingFurnitureRef),
    );
    const decorPromises = Array.from({ length: TARGET }).map(() =>
      generateAiReference("decor", setDecorReferences, setGeneratingDecorRef),
    );
    Promise.allSettled([...furniturePromises, ...decorPromises]).finally(() => {
      onSeedReady?.();
    });
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
      architectureReferences,
      mustInclude,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materials, references, materialImages, referenceImages, mustInclude, furnitureReferences, decorReferences, architectureReferences]);

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
    <div
      className="relative rounded-xl border border-border/40 p-5 space-y-7 overflow-hidden shadow-inner"
      style={{
        backgroundColor: "hsl(var(--secondary) / 0.35)",
        backgroundImage: `radial-gradient(hsl(var(--foreground) / 0.07) 1px, transparent 1.5px),
                          radial-gradient(hsl(var(--foreground) / 0.05) 1px, transparent 1.5px)`,
        backgroundSize: "14px 14px, 22px 22px",
        backgroundPosition: "0 0, 7px 11px",
      }}
    >
      {/* Furniture References — AI-generated + uploads, inspiration, "use similar" */}
      <div>
        <div className="mb-3">
          <span className="inline-block px-3 py-1 text-[11px] uppercase tracking-wider font-semibold bg-secondary/80 text-foreground/80 rounded-[2px] rotate-1 shadow-sm border border-border/40">
            Furniture
          </span>
          <span className="ml-2 text-[11px] text-muted-foreground italic font-serif">— pinned items we'll keep + AI inspiration in your style</span>
        </div>
        <div
          onDragOver={(e) => {
            handleReferenceDragOver(e, "furniture");
            if (e.dataTransfer.types.includes(MOODBOARD_DRAG_MIME)) setIsMustIncludeDropActive(true);
          }}
          onDragLeave={() => { setIsFurnitureDropActive(false); setIsMustIncludeDropActive(false); }}
          onDrop={(e) => handleReferenceDrop(e, "furniture", setFurnitureReferences, setUploadingFurnitureRef)}
          className={cn(
            "flex flex-wrap gap-4 items-start rounded-lg p-2 -m-2 transition-colors pt-3",
            isFurnitureDropActive && "bg-primary/5 ring-2 ring-primary/40 ring-dashed",
          )}
        >
          {/* Pinned must-include items appear first, with a pin marker */}
          {mustInclude.map((item) => {
            let h = 0;
            for (let i = 0; i < item.label.length; i++) h = (h * 31 + item.label.charCodeAt(i)) >>> 0;
            const rot = ((h % 500) / 500) * 5 - 2.5;
            return item.imageUrl ? (
              <div
                key={`must-${item.label}`}
                className="group relative w-28 cursor-grab active:cursor-grabbing"
                style={{ transform: `rotate(${rot}deg)` }}
                draggable
                onDragStart={(e) => startItemDrag(e, item, "must-include")}
                title="Pinned — we'll design around this. Drag out to remove from must-keep."
              >
                <div className="bg-card p-1.5 pb-6 shadow-[0_6px_14px_-6px_hsl(var(--foreground)/0.35),0_2px_4px_-2px_hsl(var(--foreground)/0.2)] rounded-sm relative ring-2 ring-primary/40">
                  <div
                    aria-hidden
                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary shadow-[0_1px_2px_hsl(var(--foreground)/0.4),inset_-1px_-1px_2px_hsl(var(--foreground)/0.3),inset_1px_1px_2px_hsl(0_0%_100%/0.4)] z-10"
                  />
                  <span className="absolute top-1 left-1 z-10 px-1.5 py-0.5 rounded-sm bg-primary/90 text-primary-foreground text-[9px] uppercase tracking-wider font-semibold">Keep</span>
                  <div className="aspect-square overflow-hidden bg-muted/40 relative">
                    <img src={getThumbnailImageUrl(item.imageUrl)} alt={item.label} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    <button
                      type="button"
                      onClick={() => removeMustInclude(item.label)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="mt-1.5 px-1 text-[12px] leading-tight truncate font-serif italic text-foreground/80" title={item.label}>
                    {item.label}
                  </div>
                </div>
              </div>
            ) : (
              <VisualChip
                key={`must-${item.label}`}
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
            );
          })}
          {furnitureReferences.map((item) => {
            let h = 0;
            for (let i = 0; i < item.label.length; i++) h = (h * 31 + item.label.charCodeAt(i)) >>> 0;
            const rot = ((h % 500) / 500) * 5 - 2.5;
            return (
              <div
                key={item.label}
                className="group relative w-28 cursor-grab active:cursor-grabbing"
                style={{ transform: `rotate(${rot}deg)` }}
                draggable
                onDragStart={(e) => startItemDrag(e, item)}
                title="Drag to Must-Include to keep this piece"
              >
                <div className="bg-card p-1.5 pb-6 shadow-[0_6px_14px_-6px_hsl(var(--foreground)/0.35),0_2px_4px_-2px_hsl(var(--foreground)/0.2)] rounded-sm relative">
                  {/* Washi tape accent */}
                  <div
                    aria-hidden
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-12 h-3 -rotate-3 bg-secondary/80 border border-border/40 rounded-[2px] shadow-sm z-10"
                  />
                  <div className="aspect-square overflow-hidden bg-muted/40 relative">
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
                  </div>
                  <div className="mt-1.5 px-1 text-[12px] leading-tight truncate font-serif italic text-foreground/80" title={item.label}>{item.label}</div>
                </div>
              </div>
            );
          })}
          <label
            className={cn(
              "w-28 aspect-square flex flex-col items-center justify-center gap-1 rotate-[3deg] shadow-[0_4px_10px_-4px_hsl(var(--foreground)/0.3)] transition-transform hover:rotate-0",
              uploadingFurnitureRef ? "bg-accent/40 text-foreground/70 cursor-wait" : "bg-accent/60 hover:bg-accent text-foreground/80 cursor-pointer",
            )}
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 92%, 88% 100%, 0 100%)" }}
            title="Add a furniture inspiration reference"
          >
            {uploadingFurnitureRef ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-[10px] font-serif italic">Uploading…</span></>
            ) : (
              <><Plus className="w-5 h-5" /><span className="text-[11px] font-serif italic">Add inspiration</span></>
            )}
            <input
              type="file" accept="image/*" multiple className="hidden" disabled={uploadingFurnitureRef}
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
          <label
            className={cn(
              "relative w-28 aspect-square flex flex-col items-center justify-center gap-1 -rotate-[2deg] shadow-[0_4px_10px_-4px_hsl(var(--foreground)/0.3)] transition-transform hover:rotate-0 ring-2 ring-primary/40",
              uploadingMustInclude ? "bg-primary/20 text-foreground/70 cursor-wait" : "bg-primary/30 hover:bg-primary/40 text-foreground/80 cursor-pointer",
            )}
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 92%, 88% 100%, 0 100%)" }}
            title="Pin a piece you want to keep — we'll design around it"
          >
            <span aria-hidden className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary shadow-[0_1px_2px_hsl(var(--foreground)/0.4)] z-10" />
            {uploadingMustInclude ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-[10px] font-serif italic">Uploading…</span></>
            ) : (
              <><Plus className="w-5 h-5" /><span className="text-[11px] font-serif italic">Pin to keep</span></>
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
          <button
            type="button"
            onClick={() => generateAiReference("furniture", setFurnitureReferences, setGeneratingFurnitureRef)}
            disabled={generatingFurnitureRef || !styleNames[0]}
            className={cn(
              "w-28 aspect-square flex flex-col items-center justify-center gap-1 -rotate-[3deg] shadow-[0_4px_10px_-4px_hsl(var(--foreground)/0.3)] transition-transform hover:rotate-0",
              generatingFurnitureRef ? "bg-primary/20 text-foreground/70 cursor-wait" : "bg-primary/30 hover:bg-primary/40 text-foreground/80",
            )}
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 92%, 88% 100%, 0 100%)" }}
            title="Generate another AI furniture reference"
          >
            {generatingFurnitureRef ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-[10px] font-serif italic">Generating…</span></>
            ) : (
              <><Sparkles className="w-5 h-5" /><span className="text-[11px] font-serif italic">AI suggest</span></>
            )}
          </button>
        </div>
      </div>

      {/* Decor References — AI-generated + uploads, accessories, textiles, lighting */}
      <div>
        <div className="mb-3">
          <span className="inline-block px-3 py-1 text-[11px] uppercase tracking-wider font-semibold bg-accent/70 text-foreground/80 rounded-[2px] -rotate-1 shadow-sm border border-border/40">
            Decor
          </span>
          <span className="ml-2 text-[11px] text-muted-foreground italic font-serif">— lamps, vases, art, cushions, rugs · drag from must-keep here too</span>
        </div>
        <div
          onDragOver={(e) => handleReferenceDragOver(e, "decor")}
          onDragLeave={() => setIsDecorDropActive(false)}
          onDrop={(e) => handleReferenceDrop(e, "decor", setDecorReferences, setUploadingDecorRef)}
          className={cn(
            "flex flex-wrap gap-4 items-start rounded-lg p-2 -m-2 transition-colors pt-3",
            isDecorDropActive && "bg-primary/5 ring-2 ring-primary/40 ring-dashed",
          )}
        >
          {decorReferences.map((item) => {
            let h = 0;
            for (let i = 0; i < item.label.length; i++) h = (h * 31 + item.label.charCodeAt(i)) >>> 0;
            const rot = ((h % 500) / 500) * 5 - 2.5;
            return (
              <div
                key={item.label}
                className="group relative w-28 cursor-grab active:cursor-grabbing"
                style={{ transform: `rotate(${rot}deg)` }}
                draggable
                onDragStart={(e) => startItemDrag(e, item)}
                title="Drag to Must-Include to keep this piece"
              >
                <div className="bg-card p-1.5 pb-6 shadow-[0_6px_14px_-6px_hsl(var(--foreground)/0.35),0_2px_4px_-2px_hsl(var(--foreground)/0.2)] rounded-sm relative">
                  <div
                    aria-hidden
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-12 h-3 rotate-3 bg-accent/80 border border-border/40 rounded-[2px] shadow-sm z-10"
                  />
                  <div className="aspect-square overflow-hidden bg-muted/40 relative">
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
                  </div>
                  <div className="mt-1.5 px-1 text-[12px] leading-tight truncate font-serif italic text-foreground/80" title={item.label}>{item.label}</div>
                </div>
              </div>
            );
          })}
          <label
            className={cn(
              "w-28 aspect-square flex flex-col items-center justify-center gap-1 rotate-[3deg] shadow-[0_4px_10px_-4px_hsl(var(--foreground)/0.3)] transition-transform hover:rotate-0",
              uploadingDecorRef ? "bg-accent/40 text-foreground/70 cursor-wait" : "bg-accent/60 hover:bg-accent text-foreground/80 cursor-pointer",
            )}
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 92%, 88% 100%, 0 100%)" }}
          >
            {uploadingDecorRef ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-[10px] font-serif italic">Uploading…</span></>
            ) : (
              <><Plus className="w-5 h-5" /><span className="text-[11px] font-serif italic">Add decor</span></>
            )}
            <input
              type="file" accept="image/*" multiple className="hidden" disabled={uploadingDecorRef}
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
              "w-28 aspect-square flex flex-col items-center justify-center gap-1 -rotate-[3deg] shadow-[0_4px_10px_-4px_hsl(var(--foreground)/0.3)] transition-transform hover:rotate-0",
              generatingDecorRef ? "bg-primary/20 text-foreground/70 cursor-wait" : "bg-primary/30 hover:bg-primary/40 text-foreground/80",
            )}
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 92%, 88% 100%, 0 100%)" }}
            title="Generate another AI decor reference"
          >
            {generatingDecorRef ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-[10px] font-serif italic">Generating…</span></>
            ) : (
              <><Sparkles className="w-5 h-5" /><span className="text-[11px] font-serif italic">AI suggest</span></>
            )}
          </button>
        </div>
      </div>

      {/* Architecture References — wall treatments, mouldings, ceilings, flooring, built-ins */}
      <div>
        <div className="mb-3">
          <span className="inline-block px-3 py-1 text-[11px] uppercase tracking-wider font-semibold bg-muted text-foreground/80 rounded-[2px] rotate-[2deg] shadow-sm border border-border/40">
            Architecture Reference
          </span>
          <span className="ml-2 text-[11px] text-muted-foreground italic font-serif">— wall details, floor details, ceiling details, mouldings, built-ins</span>
        </div>
        <div
          onDragOver={(e) => handleReferenceDragOver(e, "architecture")}
          onDragLeave={() => setIsArchitectureDropActive(false)}
          onDrop={(e) => handleReferenceDrop(e, "architecture", setArchitectureReferences, setUploadingArchitectureRef)}
          className={cn(
            "flex flex-wrap gap-4 items-start rounded-lg p-2 -m-2 transition-colors pt-3",
            isArchitectureDropActive && "bg-primary/5 ring-2 ring-primary/40 ring-dashed",
          )}
        >
          {architectureReferences.map((item) => {
            let h = 0;
            for (let i = 0; i < item.label.length; i++) h = (h * 31 + item.label.charCodeAt(i)) >>> 0;
            const rot = ((h % 500) / 500) * 5 - 2.5;
            return (
              <div
                key={item.label}
                className="group relative w-28 cursor-grab active:cursor-grabbing"
                style={{ transform: `rotate(${rot}deg)` }}
                draggable
                onDragStart={(e) => startItemDrag(e, item)}
                title="Drag to Must-Include to keep this detail"
              >
                <div className="bg-card p-1.5 pb-6 shadow-[0_6px_14px_-6px_hsl(var(--foreground)/0.35),0_2px_4px_-2px_hsl(var(--foreground)/0.2)] rounded-sm relative">
                  <div
                    aria-hidden
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-12 h-3 -rotate-2 bg-muted border border-border/40 rounded-[2px] shadow-sm z-10"
                  />
                  <div className="aspect-square overflow-hidden bg-muted/40 relative">
                    {item.imageUrl && (
                      <img src={getThumbnailImageUrl(item.imageUrl)} alt={item.label} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    )}
                    <button
                      type="button"
                      onClick={() => setArchitectureReferences((prev) => prev.filter((m) => m.label !== item.label))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="mt-1.5 px-1 text-[12px] leading-tight truncate font-serif italic text-foreground/80" title={item.label}>{item.label}</div>
                </div>
              </div>
            );
          })}
          <label
            className={cn(
              "w-28 aspect-square flex flex-col items-center justify-center gap-1 rotate-[3deg] shadow-[0_4px_10px_-4px_hsl(var(--foreground)/0.3)] transition-transform hover:rotate-0",
              uploadingArchitectureRef ? "bg-accent/40 text-foreground/70 cursor-wait" : "bg-accent/60 hover:bg-accent text-foreground/80 cursor-pointer",
            )}
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 92%, 88% 100%, 0 100%)" }}
          >
            {uploadingArchitectureRef ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-[10px] font-serif italic">Uploading…</span></>
            ) : (
              <><Plus className="w-5 h-5" /><span className="text-[11px] font-serif italic">Add detail</span></>
            )}
            <input
              type="file" accept="image/*" multiple className="hidden" disabled={uploadingArchitectureRef}
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                e.target.value = "";
                if (!files.length) return;
                setUploadingArchitectureRef(true);
                try { await uploadInspirationImages(files, "architecture-ref", setArchitectureReferences); }
                finally { setUploadingArchitectureRef(false); }
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => generateAiReference("architecture", setArchitectureReferences, setGeneratingArchitectureRef)}
            disabled={generatingArchitectureRef || !styleNames[0]}
            className={cn(
              "w-28 aspect-square flex flex-col items-center justify-center gap-1 -rotate-[3deg] shadow-[0_4px_10px_-4px_hsl(var(--foreground)/0.3)] transition-transform hover:rotate-0",
              generatingArchitectureRef ? "bg-primary/20 text-foreground/70 cursor-wait" : "bg-primary/30 hover:bg-primary/40 text-foreground/80",
            )}
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 92%, 88% 100%, 0 100%)" }}
            title="Generate another AI architecture reference"
          >
            {generatingArchitectureRef ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-[10px] font-serif italic">Generating…</span></>
            ) : (
              <><Sparkles className="w-5 h-5" /><span className="text-[11px] font-serif italic">AI suggest</span></>
            )}
          </button>
        </div>
      </div>

      {/* Dominant Colors */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="inline-block px-3 py-1 text-[11px] uppercase tracking-wider font-semibold bg-secondary/80 text-foreground/80 rounded-[2px] -rotate-1 shadow-sm border border-border/40">
              Dominant Colors
            </span>
            <span className="ml-2 text-[11px] text-muted-foreground italic font-serif">— drag tags here to add their colors</span>
          </div>
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
        <div className="mb-3">
          <span className="inline-block px-3 py-1 text-[11px] uppercase tracking-wider font-semibold bg-muted/80 text-foreground/80 rounded-[2px] rotate-1 shadow-sm border border-border/40">
            Materials &amp; Textures
          </span>
          <span className="ml-2 text-[11px] text-muted-foreground italic font-serif">— drag tags here</span>
        </div>
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
            "flex flex-wrap gap-4 items-start rounded-lg p-2 -m-2 transition-colors pt-3",
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
            <div className="w-28 rotate-[3deg]">
              <div className="bg-card p-1.5 pb-6 shadow-[0_4px_10px_-4px_hsl(var(--foreground)/0.3)] rounded-sm">
                <div className="aspect-square bg-muted/40 flex items-center justify-center">
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
                  className="mt-1 h-6 text-[11px] px-1.5 py-0 font-serif italic"
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingMaterial(true)}
              className="w-28 aspect-square flex flex-col items-center justify-center gap-1 rotate-[3deg] shadow-[0_4px_10px_-4px_hsl(var(--foreground)/0.3)] bg-accent/60 hover:bg-accent text-foreground/80 transition-transform hover:rotate-0"
              style={{ clipPath: "polygon(0 0, 100% 0, 100% 92%, 88% 100%, 0 100%)" }}
            >
              <Plus className="w-5 h-5" />
              <span className="text-[11px] font-serif italic">Add material</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default ConclusionVisuals;
