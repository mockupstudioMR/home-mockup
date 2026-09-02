import { useState } from "react";
import { Pencil, Trash2, Plus, Upload, Loader2, X, Sofa, Lamp, Pin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getThumbnailImageUrl, optimizeImageFileSafe } from "@/lib/imageOptimization";
import { cn } from "@/lib/utils";

export type MoodboardItemKind = "furniture" | "decor" | "must-include" | "material";

export interface MoodboardItem {
  label: string;
  imageUrl?: string;
  kind: MoodboardItemKind;
}

export type MoodboardAction =
  | { type: "swap"; item: MoodboardItem; newLabel: string; newImageUrl?: string | null }
  | { type: "color_material"; item: MoodboardItem; description: string }
  | { type: "remove"; item: MoodboardItem }
  | { type: "add"; kind: MoodboardItemKind; label: string; imageUrl?: string | null };

interface MoodboardElementsPanelProps {
  items: MoodboardItem[];
  onAction: (action: MoodboardAction) => void;
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

// Deterministic “handmade” jitter so every tile feels uniquely placed
// but stays stable across renders.
const hashString = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};
const jitter = (seed: string, range: number, offset = 0) => {
  const h = hashString(seed + offset);
  return ((h % 1000) / 1000) * range * 2 - range;
};

// Section-specific visual treatment so each strip reads like a different
// area of a real moodboard.
const SECTION_STYLE: Record<
  MoodboardItemKind,
  {
    tape: string; // tailwind bg for the washi-tape strip
    accent: string; // tailwind text/border accent
    label: string; // chip label color
    paper: string; // card "paper" tone
  }
> = {
  "must-include": {
    tape: "bg-primary/70",
    accent: "text-primary",
    label: "bg-primary text-primary-foreground",
    paper: "bg-[hsl(var(--card))]",
  },
  furniture: {
    tape: "bg-secondary/80",
    accent: "text-secondary-foreground",
    label: "bg-secondary text-secondary-foreground",
    paper: "bg-[hsl(var(--card))]",
  },
  decor: {
    tape: "bg-accent/70",
    accent: "text-accent-foreground",
    label: "bg-accent text-accent-foreground",
    paper: "bg-[hsl(var(--card))]",
  },
  material: {
    tape: "bg-muted",
    accent: "text-muted-foreground",
    label: "bg-muted text-foreground",
    paper: "bg-[hsl(var(--card))]",
  },
};

const MoodboardElementsPanel = ({ items, onAction, disabled }: MoodboardElementsPanelProps) => {
  const [editing, setEditing] = useState<MoodboardItem | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editNewImage, setEditNewImage] = useState<string | null>(null);
  const [uploadingEdit, setUploadingEdit] = useState(false);

  const [adding, setAdding] = useState<MoodboardItemKind | null>(null);
  const [addLabel, setAddLabel] = useState("");
  const [addImage, setAddImage] = useState<string | null>(null);
  const [uploadingAdd, setUploadingAdd] = useState(false);

  const uploadOne = async (file: File, folder: string): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const optimized = await optimizeImageFileSafe(file, { maxDimension: 2048 });
    const path = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
    const { error } = await supabase.storage.from("room-photos").upload(path, optimized, { contentType: optimized.type });
    if (error) return null;
    return supabase.storage.from("room-photos").getPublicUrl(path).data.publicUrl;
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
    const labelChanged = editLabel.trim() && editLabel.trim() !== editing.label;
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

  const grouped: Record<MoodboardItemKind, MoodboardItem[]> = {
    "must-include": items.filter((i) => i.kind === "must-include"),
    furniture: items.filter((i) => i.kind === "furniture"),
    decor: items.filter((i) => i.kind === "decor"),
    material: items.filter((i) => i.kind === "material"),
  };

  const sections: { kind: MoodboardItemKind; title: string; addLabel: string }[] = [
    { kind: "must-include", title: "Must include", addLabel: "Add must-have" },
    { kind: "furniture", title: "Furniture references", addLabel: "Add furniture" },
    { kind: "decor", title: "Decor references", addLabel: "Add decor" },
    { kind: "material", title: "Materials & textures", addLabel: "Add material" },
  ];

  return (
    <div
      className="relative rounded-2xl border border-border/60 p-5 space-y-7 overflow-hidden shadow-inner"
      style={{
        backgroundColor: "hsl(var(--muted))",
        backgroundImage:
          "radial-gradient(hsl(var(--foreground) / 0.06) 1px, transparent 1px), radial-gradient(hsl(var(--foreground) / 0.04) 1px, transparent 1px)",
        backgroundSize: "14px 14px, 22px 22px",
        backgroundPosition: "0 0, 7px 11px",
      }}
    >
      {/* Header strip — like a label taped to the top of a corkboard */}
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="absolute -top-7 left-6 h-4 w-16 rotate-[-4deg] bg-primary/60 shadow-sm"
            aria-hidden
          />
          <Sparkles className={cn("w-4 h-4", "text-primary")} />
          <h3 className="text-sm font-semibold tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
            Moodboard
          </h3>
        </div>
        <span className="text-[10px] italic text-muted-foreground">
          edits replace in place — scene preserved
        </span>
      </div>

      {sections.map(({ kind, title, addLabel: addBtn }) => {
        const sec = SECTION_STYLE[kind];
        return (
          <div key={kind} className="relative">
            {/* Section label — washi-tape chip */}
            <div className="relative inline-flex items-center mb-4">
              <span
                className={cn(
                  "absolute -top-1 -left-2 h-3 w-10 rotate-[-6deg] opacity-80 shadow-sm",
                  sec.tape,
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "px-2.5 py-1 rounded-sm text-[10px] uppercase tracking-[0.18em] font-semibold shadow-sm",
                  sec.label,
                )}
                style={{ fontFamily: "Georgia, serif" }}
              >
                {title}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-6 pl-1">
              {grouped[kind].map((item, idx) => {
                const Icon = KIND_ICON[item.kind];
                const seed = `${kind}-${item.label}-${idx}`;
                const rotate = jitter(seed, 3.5);
                const ty = jitter(seed, 4, 1);
                const isMust = kind === "must-include";
                const isMaterial = kind === "material";
                const isSwatch = /^#[0-9a-fA-F]{6}$/.test(item.label);

                return (
                  <div
                    key={`${kind}-${item.label}-${idx}`}
                    className="group relative"
                    style={{
                      transform: `rotate(${rotate}deg) translateY(${ty}px)`,
                    }}
                  >
                    {/* Pin (must-include) or tape (others) */}
                    {isMust ? (
                      <span
                        className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 w-3 h-3 rounded-full bg-primary shadow-md ring-2 ring-primary/30"
                        aria-hidden
                      />
                    ) : (
                      <span
                        className={cn(
                          "absolute -top-2 left-1/2 -translate-x-1/2 z-20 h-3 w-10 rotate-[-3deg] opacity-80 shadow-sm",
                          sec.tape,
                        )}
                        aria-hidden
                      />
                    )}

                    {/* Polaroid / swatch card */}
                    <div
                      className={cn(
                        "w-28 p-2 pb-3 shadow-[0_6px_14px_-6px_rgba(0,0,0,0.35)] transition-transform group-hover:-translate-y-0.5 group-hover:rotate-0",
                        isMaterial ? "rounded-md" : "rounded-sm",
                        sec.paper,
                      )}
                      style={{
                        boxShadow:
                          "0 1px 0 hsl(var(--border)), 0 8px 18px -10px hsl(var(--foreground) / 0.35)",
                      }}
                    >
                      <div
                        className={cn(
                          "aspect-square overflow-hidden relative",
                          isMaterial ? "rounded-md" : "rounded-[2px]",
                          "bg-secondary/40",
                        )}
                      >
                        {item.imageUrl ? (
                          <img
                            src={getThumbnailImageUrl(item.imageUrl)}
                            alt={item.label}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : isSwatch ? (
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: item.label }}
                            title={item.label}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Icon className="w-6 h-6" />
                          </div>
                        )}

                        {/* subtle paper grain overlay */}
                        <div
                          className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-[0.06]"
                          style={{
                            backgroundImage:
                              "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)",
                            backgroundSize: "3px 3px",
                          }}
                          aria-hidden
                        />

                        {/* Hover actions */}
                        <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            disabled={disabled}
                            className="w-7 h-7 rounded-full bg-background text-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 shadow"
                            title="Edit / replace"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onAction({ type: "remove", item })}
                            disabled={disabled}
                            className="w-7 h-7 rounded-full bg-background text-destructive flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50 shadow"
                            title="Remove from design"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Handwritten-style caption */}
                      <div
                        className="mt-2 text-[11px] leading-tight text-center text-foreground/80 truncate px-0.5"
                        title={item.label}
                        style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
                      >
                        {isSwatch ? item.label.toUpperCase() : item.label}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add tile — sticky note */}
              <button
                type="button"
                onClick={() => setAdding(kind)}
                disabled={disabled}
                className={cn(
                  "relative w-28 h-[8.5rem] flex flex-col items-center justify-center gap-1.5 transition-transform hover:-translate-y-0.5 hover:rotate-0 disabled:opacity-50",
                  "rounded-sm shadow-[0_6px_14px_-6px_rgba(0,0,0,0.3)]",
                )}
                style={{
                  transform: `rotate(${jitter(`add-${kind}`, 2.5)}deg)`,
                  backgroundColor: "hsl(var(--accent) / 0.55)",
                  backgroundImage:
                    "linear-gradient(180deg, hsl(var(--accent) / 0.65), hsl(var(--accent) / 0.4))",
                }}
              >
                <span
                  className="absolute -top-2 left-1/2 -translate-x-1/2 h-3 w-8 rotate-[2deg] bg-primary/70 opacity-80 shadow-sm"
                  aria-hidden
                />
                <Plus className="w-5 h-5 text-foreground/70" />
                <span
                  className="text-[10px] text-center px-2 leading-tight text-foreground/70"
                  style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
                >
                  {addBtn}
                </span>
              </button>
            </div>
          </div>
        );
      })}

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
                  {(editNewImage || editing.imageUrl) ? (
                    <img
                      src={getThumbnailImageUrl(editNewImage || editing.imageUrl!)}
                      alt={editing.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground">Label</label>
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
                    {editNewImage ? "Replace image again" : "Replace with new image"}
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
                <p className="text-[10px] text-muted-foreground mt-1">
                  Replacing the label or image swaps the item in place. A description tweaks color/material only — everything else stays identical.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit}>Cancel</Button>
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
            <DialogTitle>Add {adding ? KIND_LABEL[adding].toLowerCase() : ""} element</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-muted-foreground">Name / description</label>
              <Input
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder={adding === "decor" ? "e.g. brass arc floor lamp" : "e.g. round travertine coffee table"}
                autoFocus
              />
            </div>
            <label
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors text-xs",
                uploadingAdd && "opacity-50 cursor-wait",
              )}
            >
              {uploadingAdd ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {addImage ? "Replace reference image" : "Optional reference image"}
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
                <img src={getThumbnailImageUrl(addImage)} alt="" className="w-full h-full object-cover" />
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
            <Button variant="outline" onClick={closeAdd}>Cancel</Button>
            <Button onClick={applyAdd} disabled={!addLabel.trim() || uploadingAdd}>
              Add &amp; regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MoodboardElementsPanel;
