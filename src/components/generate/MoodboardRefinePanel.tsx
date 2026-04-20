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

interface MoodboardRefinePanelProps {
  items: MoodboardItem[];
  onAction: (action: MoodboardAction) => void;
  /** Free text describing the rendered design (used to detect "used" chips). */
  designDescription?: string;
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
  onModify: (type: ModificationType, prefill?: string) => void;
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

  const grouped = useMemo(() => {
    const g: Record<MoodboardItemKind, (MoodboardItem & { used: boolean })[]> = {
      "must-include": [],
      furniture: [],
      decor: [],
      material: [],
    };
    items.forEach((it) => {
      g[it.kind].push({
        ...it,
        used: detectUsed(it, designDescription, extractedItemNames),
      });
    });
    return g;
  }, [items, designDescription, extractedItemNames]);

  const usedCount = items.filter((it) =>
    detectUsed(it, designDescription, extractedItemNames),
  ).length;

  const DECOR_TYPE_RE = /(lamp|light|rug|art|plant|pillow|cushion|throw|mirror|vase|accessor|decor|textile|curtain|drape|sconce|chandelier|pendant|candle|book|frame)/i;
  const inDesign = useMemo(() => {
    const furniture: typeof extractedItems = [];
    const decor: typeof extractedItems = [];
    for (const it of extractedItems) {
      const blob = `${it.item_type || ""} ${it.item_name || ""}`;
      if (DECOR_TYPE_RE.test(blob)) decor.push(it);
      else furniture.push(it);
    }
    return { furniture, decor };
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
    onModify(type, text);
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
        {SECTIONS.map(({ kind, title, addLabel: addBtn }) => {
          const list = grouped[kind];
          if (list.length === 0 && kind === "material") {
            // material section can be sparse — still show add button
          }
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
                  return (
                    <Popover key={`${kind}-${item.label}`}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          disabled={disabled}
                          className={cn(
                            "group relative w-24 text-left rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary",
                            !item.used && "opacity-60 hover:opacity-100",
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
                                <Lock className="w-2.5 h-2.5" />
                                Lock
                              </div>
                            )}
                          </div>
                          <div
                            className="mt-1 text-[11px] leading-tight truncate"
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
                onModify(activeMode)
              }
              disabled={generating}
            />
            <Button
              onClick={() => onModify(activeMode)}
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