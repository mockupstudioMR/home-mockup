import { useMemo, useState } from "react";
import {
  Pencil,
  Trash2,
  Plus,
  Upload,
  Loader2,
  X,
  Sofa,
  Lamp,
  Pin,
  Send,
  RefreshCw,
  Undo2,
  Palette,
  ArrowLeftRight,
  LayoutGrid,
  CheckCircle2,
  Lock,
  Sparkles,
  Building2,
  Armchair,
  Frame,
  Wand2,
  Check,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  getThumbnailImageUrl,
  optimizeImageFile,
} from "@/lib/imageOptimization";
import { cn } from "@/lib/utils";
import type {
  MoodboardItem,
  MoodboardItemKind,
  MoodboardAction,
} from "./MoodboardElementsPanel";
import type { ModificationType } from "./RefinementPanel";

export type DesignLayer = "architecture" | "furniture" | "decor";

const LAYERS: { id: DesignLayer; label: string; icon: typeof Building2; hint: string }[] = [
  {
    id: "architecture",
    label: "Architecture",
    icon: Building2,
    hint: "Walls, ceiling, floor, finishes & trim",
  },
  {
    id: "furniture",
    label: "Furniture",
    icon: Armchair,
    hint: "Sofa, bed, tables, storage — swap, recolor, remove",
  },
  {
    id: "decor",
    label: "Decor",
    icon: Frame,
    hint: "Lighting, rugs, art, plants & accessories",
  },
];

const LAYER_KINDS: Record<DesignLayer, MoodboardItemKind[]> = {
  architecture: ["material"],
  furniture: ["furniture", "must-include"],
  decor: ["decor"],
};

const DECOR_TYPE_RE_GLOBAL =
  /(lamp|light|rug|art|plant|pillow|cushion|throw|mirror|vase|accessor|decor|textile|curtain|drape|sconce|chandelier|pendant|candle|book|frame)/i;

// Label-based architectural detection — anything mentioning a wall, ceiling,
// floor, trim, molding, paint, wallpaper, panel, tile, etc. belongs to the
// Architecture layer regardless of how the source kind was tagged.
const ARCHITECTURE_LABEL_RE =
  /(wall|ceiling|floor|flooring|trim|molding|moulding|baseboard|skirting|wainscot|paneling|panelling|paint|wallpaper|tile|tiling|plaster|stucco|brick|concrete|hardwood|parquet|laminate|vinyl|carpet|cornice|crown|beam|rafter|cladding)/i;

const isArchitecturalItem = (item: MoodboardItem) =>
  item.kind === "material" || ARCHITECTURE_LABEL_RE.test(item.label);

interface MoodboardRefinePanelProps {
  items: MoodboardItem[];
  onAction: (action: MoodboardAction) => void;
  /** Free text describing the rendered design (used to detect "used" chips). */
  designDescription?: string;
  /** Room type (used for contextual AI suggestions). */
  roomType?: string;
  /** Design style (used for contextual AI suggestions). */
  style?: string;
  /** Names of items extracted from the rendered design. */
  extractedItemNames?: string[];
  /** Full extracted design items — shown as the "In your design" section. */
  extractedItems?: {
    item_name: string;
    item_type: string;
    item_description?: string;
    color?: string;
    hex_code?: string;
    material?: string;
    product_photo_url?: string;
  }[];
  /** Refine controls */
  modificationInput: string;
  onModificationInputChange: (value: string) => void;
  onModify: (
    type: ModificationType,
    prefill?: string,
    layerInfo?: { layer: DesignLayer; lockedLayers: DesignLayer[] },
  ) => void;
  onRegenerate: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  generating: boolean;
  disabled?: boolean;
}

const KIND_LABEL: Record<MoodboardItemKind, string> = {
  furniture: "Furniture",
  decor: "Decor",
  "must-include": "Must-include",
  material: "Material",
};

const KIND_ICON: Record<MoodboardItemKind, typeof Sofa> = {
  furniture: Sofa,
  decor: Lamp,
  "must-include": Pin,
  material: Pin,
};

const MODIFICATION_TYPES: {
  type: ModificationType;
  label: string;
  icon: typeof Palette;
  description: string;
  placeholder: string;
}[] = [
  {
    type: "color_material",
    label: "Color / Material",
    icon: Palette,
    description:
      "Change colors, fabrics or materials — everything else stays identical",
    placeholder: "Make sofa sage green velvet, walls warm beige...",
  },
  {
    type: "swap_item",
    label: "Swap",
    icon: ArrowLeftRight,
    description:
      "Replace one piece — layout and other items preserved",
    placeholder: "Replace coffee table with round travertine one...",
  },
  {
    type: "add_remove",
    label: "Add / Remove",
    icon: Plus,
    description: "Add or remove items — everything else stays in place",
    placeholder: "Add brass arc floor lamp in left corner...",
  },
  {
    type: "layout",
    label: "Layout",
    icon: LayoutGrid,
    description: "Rearrange furniture positions",
    placeholder: "Move sofa to face the window...",
  },
];

const isHex = (label: string) => /^#[0-9a-fA-F]{6}$/.test(label.trim());

const detectUsed = (
  item: MoodboardItem,
  designDescription: string,
  extractedItemNames: string[],
): boolean => {
  const haystack = (
    designDescription +
    " " +
    extractedItemNames.join(" ")
  ).toLowerCase();
  if (!haystack.trim()) return false;
  if (isHex(item.label)) {
    // Color usage is hard to verify visually — assume colors flow into the design.
    return true;
  }
  // Match on any meaningful word from the label (>=4 chars).
  const words = item.label
    .toLowerCase()
    .split(/[^a-zà-ÿ]+/i)
    .filter((w) => w.length >= 4);
  if (words.length === 0) return haystack.includes(item.label.toLowerCase());
  return words.some((w) => haystack.includes(w));
};

const SECTIONS: {
  kind: MoodboardItemKind;
  title: string;
  addLabel: string;
}[] = [
  { kind: "must-include", title: "Must include", addLabel: "Add must-have" },
  { kind: "furniture", title: "Furniture references", addLabel: "Add furniture" },
  { kind: "decor", title: "Decor references", addLabel: "Add decor" },
  { kind: "material", title: "Materials & colors", addLabel: "Add material" },
];

const MoodboardRefinePanel = ({
  items,
  onAction,
  designDescription = "",
  roomType = "",
  style = "",
  extractedItemNames = [],
  extractedItems = [],
  modificationInput,
  onModificationInputChange,
  onModify,
  onRegenerate,
  onUndo,
  canUndo = false,
  generating,
  disabled,
}: MoodboardRefinePanelProps) => {
  const [editing, setEditing] = useState<MoodboardItem | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editNewImage, setEditNewImage] = useState<string | null>(null);
  const [uploadingEdit, setUploadingEdit] = useState(false);

  const [adding, setAdding] = useState<MoodboardItemKind | null>(null);
  const [addLabel, setAddLabel] = useState("");
  const [addImage, setAddImage] = useState<string | null>(null);
  const [uploadingAdd, setUploadingAdd] = useState(false);

  const [activeMode, setActiveMode] = useState<ModificationType>("color_material");

  // User pin overrides: explicit true/false per item key. Items not in the
  // map fall back to their source state (must-include = pinned by default).
  // Persisted so pins survive reloads and regenerations.
  const PIN_STORAGE_KEY = "generate_pinned_moodboard_v2";
  const [pinOverrides, setPinOverrides] = useState<Record<string, boolean>>(
    () => {
      try {
        const raw = sessionStorage.getItem(PIN_STORAGE_KEY);
        if (!raw) return {};
        const obj = JSON.parse(raw);
        return obj && typeof obj === "object" ? obj : {};
      } catch {
        return {};
      }
    },
  );
  const persistPinOverrides = (next: Record<string, boolean>) => {
    try {
      sessionStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };
  const pinKey = (item: MoodboardItem) =>
    `${item.kind}|${item.label.toLowerCase()}`;
  const isPinned = (item: MoodboardItem) => {
    const k = pinKey(item);
    if (k in pinOverrides) return pinOverrides[k];
    return item.kind === "must-include";
  };
  const togglePin = (item: MoodboardItem) => {
    const k = pinKey(item);
    setPinOverrides((prev) => {
      const currently = k in prev ? prev[k] : item.kind === "must-include";
      const next = { ...prev, [k]: !currently };
      persistPinOverrides(next);
      return next;
    });
  };

  // Layered refinement: which layer the user is currently editing + lock toggle.
  const [activeLayer, setActiveLayer] = useState<DesignLayer>(() => {
    try {
      const v = sessionStorage.getItem("generate_active_layer");
      if (v === "architecture" || v === "furniture" || v === "decor") return v;
    } catch {
      /* ignore */
    }
    return "architecture";
  });
  const [lockPrevious, setLockPrevious] = useState<boolean>(() => {
    try {
      const v = sessionStorage.getItem("generate_lock_previous_layers");
      return v === null ? true : v === "true";
    } catch {
      return true;
    }
  });

  const updateActiveLayer = (l: DesignLayer) => {
    setActiveLayer(l);
    try {
      sessionStorage.setItem("generate_active_layer", l);
    } catch {
      /* ignore */
    }
  };

  const updateLockPrevious = (v: boolean) => {
    setLockPrevious(v);
    try {
      sessionStorage.setItem("generate_lock_previous_layers", v ? "true" : "false");
    } catch {
      /* ignore */
    }
  };

  const lockedLayers: DesignLayer[] = useMemo(() => {
    if (!lockPrevious) return [];
    if (activeLayer === "furniture") return ["architecture"];
    if (activeLayer === "decor") return ["architecture", "furniture"];
    return [];
  }, [lockPrevious, activeLayer]);

  const layerInfo = { layer: activeLayer, lockedLayers };

  const visibleKinds = LAYER_KINDS[activeLayer];

  // ---- Pending per-section changes (stage edits, then "Agree & generate") ----
  type PendingChanges = {
    additions: string[]; // labels to add
    removals: string[]; // labels to remove
  };
  const emptyPending = (): PendingChanges => ({ additions: [], removals: [] });
  const [pendingByKind, setPendingByKind] = useState<
    Record<MoodboardItemKind, PendingChanges>
  >({
    "must-include": emptyPending(),
    furniture: emptyPending(),
    decor: emptyPending(),
    material: emptyPending(),
  });
  const [aiLoadingKind, setAiLoadingKind] = useState<MoodboardItemKind | null>(null);

  const addPending = (kind: MoodboardItemKind, label: string) => {
    const clean = label.trim();
    if (!clean) return;
    setPendingByKind((prev) => {
      const cur = prev[kind];
      if (cur.additions.includes(clean)) return prev;
      return { ...prev, [kind]: { ...cur, additions: [...cur.additions, clean] } };
    });
  };
  const undoPendingAdd = (kind: MoodboardItemKind, label: string) =>
    setPendingByKind((prev) => ({
      ...prev,
      [kind]: { ...prev[kind], additions: prev[kind].additions.filter((l) => l !== label) },
    }));
  const togglePendingRemoval = (kind: MoodboardItemKind, label: string) =>
    setPendingByKind((prev) => {
      const cur = prev[kind];
      const exists = cur.removals.includes(label);
      return {
        ...prev,
        [kind]: {
          ...cur,
          removals: exists
            ? cur.removals.filter((l) => l !== label)
            : [...cur.removals, label],
        },
      };
    });
  const clearPending = (kind: MoodboardItemKind) =>
    setPendingByKind((prev) => ({ ...prev, [kind]: emptyPending() }));

  const buildPendingPrompt = (kind: MoodboardItemKind, p: PendingChanges) => {
    const parts: string[] = [];
    if (p.additions.length) parts.push(`Add: ${p.additions.join(", ")}`);
    if (p.removals.length) parts.push(`Remove: ${p.removals.join(", ")}`);
    if (!parts.length) return "";
    const scope =
      kind === "material"
        ? "Apply only to walls, ceiling, floor and architectural finishes."
        : kind === "decor"
          ? "Apply only to decor (lighting, rugs, art, plants, accessories)."
          : "Apply only to furniture pieces.";
    return `${parts.join(". ")}. ${scope} Keep everything else identical.`;
  };

  const agreeAndGenerate = (kind: MoodboardItemKind) => {
    const p = pendingByKind[kind];
    const prompt = buildPendingPrompt(kind, p);
    if (!prompt) return;
    onModify("add_remove", prompt, layerInfo);
    clearPending(kind);
  };

  const adjustInInput = (kind: MoodboardItemKind) => {
    const p = pendingByKind[kind];
    const prompt = buildPendingPrompt(kind, p);
    setActiveMode("add_remove");
    onModificationInputChange(prompt || "");
  };

  const requestAiSuggestion = async (kind: MoodboardItemKind) => {
    setAiLoadingKind(kind);
    try {
      const layer: DesignLayer =
        kind === "material" ? "architecture" : kind === "decor" ? "decor" : "furniture";
      const existingLabels = [
        ...items.map((i) => i.label),
        ...pendingByKind[kind].additions,
      ];
      const { data, error } = await supabase.functions.invoke("suggest-moodboard-item", {
        body: { layer, existingLabels, roomType, style, designDescription },
      });
      if (error) throw error;
      const suggestion = (data as { suggestion?: string })?.suggestion?.trim();
      if (suggestion) addPending(kind, suggestion);
    } catch (e) {
      console.error("AI suggest failed", e);
    } finally {
      setAiLoadingKind(null);
    }
  };

  const grouped = useMemo(() => {
    const g: Record<MoodboardItemKind, (MoodboardItem & { used: boolean })[]> = {
      "must-include": [],
      furniture: [],
      decor: [],
      material: [],
    };
    items.forEach((it) => {
      const enriched = {
        ...it,
        used: detectUsed(it, designDescription, extractedItemNames),
      };
      // 1) User-pinned items are promoted into Must-include regardless of
      //    their original kind.
      if (pinnedKeys.has(`${it.kind}|${it.label.toLowerCase()}`)) {
        g["must-include"].push(enriched);
        return;
      }
      // 2) Reclassify architectural items (walls, ceilings, floors, finishes…)
      //    into the "material" bucket so they show up in the Architecture layer
      //    even if the source tagged them as decor/furniture.
      if (isArchitecturalItem(it) && it.kind !== "must-include") {
        g.material.push(enriched);
      } else {
        g[it.kind].push(enriched);
      }
    });
    return g;
  }, [items, designDescription, extractedItemNames, pinnedKeys]);

  const usedCount = items.filter((it) =>
    detectUsed(it, designDescription, extractedItemNames),
  ).length;

  const DECOR_TYPE_RE = /(lamp|light|rug|art|plant|pillow|cushion|throw|mirror|vase|accessor|decor|textile|curtain|drape|sconce|chandelier|pendant|candle|book|frame)/i;
  const inDesign = useMemo(() => {
    const furniture: typeof extractedItems = [];
    const decor: typeof extractedItems = [];
    const architecture: typeof extractedItems = [];
    for (const it of extractedItems) {
      const blob = `${it.item_type || ""} ${it.item_name || ""}`;
      if (ARCHITECTURE_LABEL_RE.test(blob)) architecture.push(it);
      else if (DECOR_TYPE_RE.test(blob)) decor.push(it);
      else furniture.push(it);
    }
    return { furniture, decor, architecture };
  }, [extractedItems]);

  const uploadOne = async (
    file: File,
    folder: string,
  ): Promise<string | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const optimized = await optimizeImageFile(file, { maxDimension: 2048 });
    const path = `${user.id}/${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.webp`;
    const { error } = await supabase.storage
      .from("room-photos")
      .upload(path, optimized, { contentType: optimized.type });
    if (error) return null;
    return supabase.storage.from("room-photos").getPublicUrl(path).data
      .publicUrl;
  };

  const openEdit = (item: MoodboardItem) => {
    setEditing(item);
    setEditLabel(item.label);
    setEditDescription("");
    setEditNewImage(null);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditLabel("");
    setEditDescription("");
    setEditNewImage(null);
  };

  const applyEdit = () => {
    if (!editing) return;
    const labelChanged =
      editLabel.trim() && editLabel.trim() !== editing.label;
    const imageChanged = !!editNewImage;
    const hasDescription = editDescription.trim().length > 0;
    if (imageChanged || labelChanged) {
      onAction({
        type: "swap",
        item: editing,
        newLabel: editLabel.trim() || editing.label,
        newImageUrl: editNewImage,
      });
    } else if (hasDescription) {
      onAction({
        type: "color_material",
        item: editing,
        description: editDescription.trim(),
      });
    }
    closeEdit();
  };

  const closeAdd = () => {
    setAdding(null);
    setAddLabel("");
    setAddImage(null);
  };

  const applyAdd = () => {
    if (!adding) return;
    const label = addLabel.trim();
    if (!label) return;
    onAction({ type: "add", kind: adding, label, imageUrl: addImage });
    closeAdd();
  };

  const sendModificationFromChip = (
    item: MoodboardItem,
    type: ModificationType,
    text: string,
  ) => {
    setActiveMode(type);
    onModificationInputChange(text);
    onModify(type, text, layerInfo);
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">
            Moodboard &amp; refinement
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-[10px]">
            {usedCount}/{items.length} used
          </Badge>
          <span className="hidden sm:inline">
            Click a chip to act on it · type below for anything else
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Layer selector — Architecture → Furniture → Decor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
              Refine layer by layer
            </p>
            <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={lockPrevious}
                onChange={(e) => updateLockPrevious(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border accent-primary"
              />
              <Lock className="w-3 h-3" />
              Lock previous layers
            </label>
          </div>

          <div className="relative flex items-stretch gap-2">
            {LAYERS.map((l, idx) => {
              const Icon = l.icon;
              const isActive = activeLayer === l.id;
              const isLocked = lockedLayers.includes(l.id);
              return (
                <div key={l.id} className="flex items-stretch flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => updateActiveLayer(l.id)}
                    className={cn(
                      "flex-1 min-w-0 flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-all",
                      isActive
                        ? "bg-primary/10 border-primary text-foreground shadow-sm"
                        : "bg-card border-border hover:border-primary/40",
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {idx + 1}
                      </div>
                      <Icon
                        className={cn(
                          "w-3.5 h-3.5 shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span className="text-xs font-medium truncate">{l.label}</span>
                      {isLocked && (
                        <Lock className="w-3 h-3 ml-auto text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                      {l.hint}
                    </span>
                  </button>
                  {idx < LAYERS.length - 1 && (
                    <div
                      className={cn(
                        "w-2 self-center h-px mx-0.5",
                        activeLayer === l.id || activeLayer === LAYERS[idx + 1].id
                          ? "bg-primary/60"
                          : "bg-border",
                      )}
                      aria-hidden
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {(inDesign.furniture.length > 0 || inDesign.decor.length > 0 || inDesign.architecture.length > 0) && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wide text-primary font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                In your design
              </p>
              <span className="text-[10px] text-muted-foreground">
                {inDesign.furniture.length + inDesign.decor.length + inDesign.architecture.length} items detected
              </span>
            </div>

            {([
              { title: "Architecture", list: inDesign.architecture, fallbackIcon: Building2, layer: "architecture" as DesignLayer },
              { title: "Furniture", list: inDesign.furniture, fallbackIcon: Sofa, layer: "furniture" as DesignLayer },
              { title: "Decor", list: inDesign.decor, fallbackIcon: Lamp, layer: "decor" as DesignLayer },
            ] as const).filter(({ layer }) => activeLayer === layer).map(({ title, list, fallbackIcon: FallbackIcon }) =>
              list.length === 0 ? null : (
                <div key={title}>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-2">
                    {title} ({list.length})
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {list.map((it, idx) => (
                      <Popover key={`indesign-${title}-${idx}-${it.item_name}`}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            disabled={disabled}
                            className="group w-24 text-left rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <div className="aspect-square rounded-lg overflow-hidden border border-border bg-background relative">
                              {it.product_photo_url ? (
                                <img
                                  src={getThumbnailImageUrl(it.product_photo_url)}
                                  alt={it.item_name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : it.hex_code ? (
                                <div
                                  className="w-full h-full flex items-center justify-center"
                                  style={{ backgroundColor: it.hex_code }}
                                >
                                  <FallbackIcon className="w-5 h-5 text-white/70 mix-blend-difference" />
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                  <FallbackIcon className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div
                              className="mt-1 text-[11px] leading-tight truncate font-medium"
                              title={it.item_name}
                            >
                              {it.item_name}
                            </div>
                            {(it.color || it.material) && (
                              <div
                                className="text-[10px] text-muted-foreground truncate"
                                title={`${it.color || ""} ${it.material || ""}`.trim()}
                              >
                                {[it.color, it.material].filter(Boolean).join(" · ")}
                              </div>
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-56 p-2 space-y-1">
                          <p className="text-[11px] text-muted-foreground px-2 py-1 truncate">
                            {it.item_name}
                          </p>
                          <button
                            type="button"
                            onClick={() =>
                              sendModificationFromChip(
                                {
                                  label: it.item_name,
                                  kind: title === "Decor" ? "decor" : "furniture",
                                },
                                "color_material",
                                `Change the ${it.item_name} to a different color or material — keep everything else identical`,
                              )
                            }
                            disabled={disabled || generating}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors"
                          >
                            <Palette className="w-3.5 h-3.5" /> Recolor / re-material
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              sendModificationFromChip(
                                {
                                  label: it.item_name,
                                  kind: title === "Decor" ? "decor" : "furniture",
                                },
                                "swap_item",
                                `Replace the ${it.item_name} with a different ${title === "Decor" ? "decor piece" : "piece"} in the same spot`,
                              )
                            }
                            disabled={disabled || generating}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" /> Swap with another
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              sendModificationFromChip(
                                {
                                  label: it.item_name,
                                  kind: title === "Decor" ? "decor" : "furniture",
                                },
                                "add_remove",
                                `Remove the ${it.item_name} from the room — leave everything else unchanged`,
                              )
                            }
                            disabled={disabled || generating}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-destructive/10 text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove from design
                          </button>
                        </PopoverContent>
                      </Popover>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            Inspiration references
          </p>
          <span className="text-[10px] text-muted-foreground">What you provided</span>
        </div>

        {SECTIONS.filter((s) => visibleKinds.includes(s.kind)).map(({ kind, title, addLabel: addBtn }) => {
          const list = grouped[kind];
          const pending = pendingByKind[kind];
          const hasPending = pending.additions.length > 0 || pending.removals.length > 0;
          return (
            <div key={kind}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
                  {title}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {list.filter((i) => i.used).length}/{list.length} used
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                {list.map((item) => {
                  const Icon = KIND_ICON[item.kind];
                  const hex = isHex(item.label);
                  const markedForRemoval = pending.removals.includes(item.label);
                  const pinnedByUser = isPinned(item);
                  // Pin toggle is available on every item except those that
                  // were originally tagged "must-include" (they're inherent
                  // pins coming from the source data).
                  const canTogglePin = item.kind !== "must-include";
                  return (
                    <Popover key={`${kind}-${item.label}`}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          disabled={disabled}
                          className={cn(
                            "group relative w-24 text-left rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary",
                            !item.used && "opacity-60 hover:opacity-100",
                            markedForRemoval && "ring-2 ring-destructive opacity-70",
                          )}
                        >
                          <div
                            className={cn(
                              "aspect-square rounded-lg overflow-hidden border bg-secondary/30 relative",
                              kind === "must-include"
                                ? "border-primary/50 border-2"
                                : "border-border",
                            )}
                          >
                            {item.imageUrl ? (
                              <img
                                src={getThumbnailImageUrl(item.imageUrl)}
                                alt={item.label}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : hex ? (
                              <div
                                className="w-full h-full"
                                style={{ backgroundColor: item.label }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <Icon className="w-5 h-5" />
                              </div>
                            )}
                            {item.used && (
                              <div className="absolute top-1 left-1 bg-background/90 text-primary rounded-full px-1.5 py-0.5 flex items-center gap-1 text-[9px] font-medium shadow-sm">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Used
                              </div>
                            )}
                            {kind === "must-include" && (
                              <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 flex items-center gap-1 text-[9px] font-medium shadow-sm">
                                <Pin className="w-2.5 h-2.5" />
                                {pinnedByUser ? "Pinned" : "Lock"}
                              </div>
                            )}
                            {/* Quick-pin toggle, visible on hover for non-
                                must-include items. Stops the popover from
                                opening so it acts as a one-click pin. */}
                            {canTogglePin && (
                              <span
                                role="button"
                                tabIndex={0}
                                aria-label={pinnedByUser ? "Unpin from Must-include" : "Pin to Must-include"}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  togglePin(item);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    togglePin(item);
                                  }
                                }}
                                className={cn(
                                  "absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-sm transition-all cursor-pointer",
                                  pinnedByUser
                                    ? "bg-primary text-primary-foreground opacity-100"
                                    : "bg-background/90 text-foreground/70 opacity-0 group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground",
                                )}
                                title={pinnedByUser ? "Unpin from Must-include" : "Pin to Must-include"}
                              >
                                <Pin className="w-2.5 h-2.5" />
                              </span>
                            )}
                            {markedForRemoval && (
                              <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                                <span className="px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[9px] font-medium flex items-center gap-1 shadow">
                                  <Trash2 className="w-2.5 h-2.5" /> Will remove
                                </span>
                              </div>
                            )}
                          </div>
                          <div
                            className={cn(
                              "mt-1 text-[11px] leading-tight truncate",
                              markedForRemoval && "line-through text-muted-foreground",
                            )}
                            title={item.label}
                          >
                            {item.label}
                          </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        align="start"
                        className="w-56 p-2 space-y-1"
                      >
                        <p className="text-[11px] text-muted-foreground px-2 py-1 truncate">
                          {item.label}
                        </p>
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          disabled={disabled}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit / replace
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            sendModificationFromChip(
                              item,
                              "color_material",
                              `Make the ${item.label} a different color or material — keep everything else identical`,
                            )
                          }
                          disabled={disabled || generating}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors"
                        >
                          <Palette className="w-3.5 h-3.5" /> Recolor / re-material
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            sendModificationFromChip(
                              item,
                              "swap_item",
                              `Replace the ${item.label} with a different ${item.kind === "decor" ? "decor piece" : "piece"} in the same spot`,
                            )
                          }
                          disabled={disabled || generating}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" /> Swap with another
                        </button>
                        <button
                          type="button"
                          onClick={() => onAction({ type: "remove", item })}
                          disabled={disabled}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-destructive/10 text-destructive transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove from design
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePendingRemoval(kind, item.label)}
                          disabled={disabled}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors"
                        >
                          <ListChecks className="w-3.5 h-3.5" />
                          {markedForRemoval ? "Unmark removal" : "Mark for removal"}
                        </button>
                        {canTogglePin && (
                          <button
                            type="button"
                            onClick={() => togglePin(item)}
                            disabled={disabled}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors"
                          >
                            <Pin className="w-3.5 h-3.5" />
                            {pinnedByUser ? "Unpin from Must-include" : "Pin to Must-include"}
                          </button>
                        )}
                      </PopoverContent>
                    </Popover>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setAdding(kind)}
                  disabled={disabled}
                  className="w-24 aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[10px] text-center px-1 leading-tight">
                    {addBtn}
                  </span>
                </button>
              </div>

              {/* Per-section toolbar + pending changes tray */}
              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAdding(kind)}
                    disabled={disabled || generating}
                    className="h-7 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => requestAiSuggestion(kind)}
                    disabled={disabled || generating || aiLoadingKind === kind}
                    className="h-7 text-xs"
                  >
                    {aiLoadingKind === kind ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5 mr-1" />
                    )}
                    AI suggest
                  </Button>
                  {hasPending && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => agreeAndGenerate(kind)}
                        disabled={disabled || generating}
                        className="h-7 text-xs"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Agree &amp; generate
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => adjustInInput(kind)}
                        disabled={disabled || generating}
                        className="h-7 text-xs"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" /> Adjust
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => clearPending(kind)}
                        disabled={disabled || generating}
                        className="h-7 text-xs text-muted-foreground"
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Clear
                      </Button>
                    </>
                  )}
                </div>

                {hasPending && (
                  <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-2 space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wide text-primary/80 font-semibold">
                      Pending changes
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {pending.additions.map((label) => (
                        <Badge
                          key={`add-${label}`}
                          variant="secondary"
                          className="text-[10px] gap-1 pr-1"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          {label}
                          <button
                            type="button"
                            onClick={() => undoPendingAdd(kind, label)}
                            className="ml-1 rounded-full hover:bg-muted p-0.5"
                            aria-label={`Undo add ${label}`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </Badge>
                      ))}
                      {pending.removals.map((label) => (
                        <Badge
                          key={`rem-${label}`}
                          variant="destructive"
                          className="text-[10px] gap-1 pr-1"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          {label}
                          <button
                            type="button"
                            onClick={() => togglePendingRemoval(kind, label)}
                            className="ml-1 rounded-full hover:bg-background/30 p-0.5"
                            aria-label={`Cancel remove ${label}`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Refine input */}
        <div className="pt-4 border-t border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Refine the design</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={generating}
                title="Regenerate"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", generating && "animate-spin")} />
              </Button>
              {canUndo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUndo}
                  disabled={generating}
                  title="Undo last change"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {MODIFICATION_TYPES.map((mt) => {
              const Icon = mt.icon;
              return (
                <button
                  key={mt.type}
                  onClick={() => setActiveMode(mt.type)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                    activeMode === mt.type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {mt.label}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            {MODIFICATION_TYPES.find((m) => m.type === activeMode)?.description}
          </p>

          <div className="flex gap-2">
            <Input
              placeholder={
                MODIFICATION_TYPES.find((m) => m.type === activeMode)
                  ?.placeholder
              }
              value={modificationInput}
              onChange={(e) => onModificationInputChange(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" &&
                modificationInput.trim() &&
                onModify(activeMode, undefined, layerInfo)
              }
              disabled={generating}
            />
            <Button
              onClick={() => onModify(activeMode, undefined, layerInfo)}
              disabled={!modificationInput.trim() || generating}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit element</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-border bg-secondary/30 shrink-0">
                  {editNewImage || editing.imageUrl ? (
                    <img
                      src={getThumbnailImageUrl(
                        editNewImage || editing.imageUrl!,
                      )}
                      alt={editing.label}
                      className="w-full h-full object-cover"
                    />
                  ) : isHex(editing.label) ? (
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: editing.label }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground">
                      Label
                    </label>
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="e.g. Walnut sideboard"
                    />
                  </div>
                  <label
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors text-xs",
                      uploadingEdit && "opacity-50 cursor-wait",
                    )}
                  >
                    {uploadingEdit ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {editNewImage
                      ? "Replace image again"
                      : "Replace with new image"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingEdit}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        setUploadingEdit(true);
                        const url = await uploadOne(file, "moodboard-edit");
                        if (url) setEditNewImage(url);
                        setUploadingEdit(false);
                      }}
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground">
                  Or describe a change (color, material, finish)
                </label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder='e.g. "make it sage green velvet" or "swap to brushed brass finish"'
                  rows={2}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>
              Cancel
            </Button>
            <Button
              onClick={applyEdit}
              disabled={
                !editing ||
                uploadingEdit ||
                (!editNewImage &&
                  editLabel.trim() === editing.label &&
                  !editDescription.trim())
              }
            >
              Apply &amp; regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add dialog */}
      <Dialog open={!!adding} onOpenChange={(o) => !o && closeAdd()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add {adding ? KIND_LABEL[adding].toLowerCase() : ""} element
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-muted-foreground">
                Name / description
              </label>
              <Input
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder={
                  adding === "decor"
                    ? "e.g. brass arc floor lamp"
                    : "e.g. round travertine coffee table"
                }
                autoFocus
              />
            </div>
            <label
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors text-xs",
                uploadingAdd && "opacity-50 cursor-wait",
              )}
            >
              {uploadingAdd ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {addImage
                ? "Replace reference image"
                : "Optional reference image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingAdd}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  setUploadingAdd(true);
                  const url = await uploadOne(file, "moodboard-add");
                  if (url) setAddImage(url);
                  setUploadingAdd(false);
                }}
              />
            </label>
            {addImage && (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                <img
                  src={getThumbnailImageUrl(addImage)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setAddImage(null)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAdd}>
              Cancel
            </Button>
            <Button
              onClick={applyAdd}
              disabled={!addLabel.trim() || uploadingAdd}
            >
              Add &amp; regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MoodboardRefinePanel;