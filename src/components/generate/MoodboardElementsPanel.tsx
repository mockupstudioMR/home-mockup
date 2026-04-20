import { useState } from "react";
import { Pencil, Trash2, Plus, Upload, Loader2, X, Sofa, Lamp, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getThumbnailImageUrl, optimizeImageFile } from "@/lib/imageOptimization";
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
    const optimized = await optimizeImageFile(file, { maxDimension: 2048 });
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
    <div className="rounded-xl border border-border/50 bg-card p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Moodboard elements</h3>
        <span className="text-[10px] text-muted-foreground">
          Edit replaces in place — scene preserved
        </span>
      </div>

      {sections.map(({ kind, title, addLabel: addBtn }) => (
        <div key={kind}>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 font-medium">
            {title}
          </p>
          <div className="flex flex-wrap gap-3">
            {grouped[kind].map((item) => {
              const Icon = KIND_ICON[item.kind];
              return (
                <div key={`${kind}-${item.label}`} className="group relative w-24">
                  <div
                    className={cn(
                      "aspect-square rounded-lg overflow-hidden border bg-secondary/30 relative",
                      kind === "must-include" ? "border-primary/40 border-2" : "border-border",
                    )}
                  >
                    {item.imageUrl ? (
                      <img
                        src={getThumbnailImageUrl(item.imageUrl)}
                        alt={item.label}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : /^#[0-9a-fA-F]{6}$/.test(item.label) ? (
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: item.label }}
                        title={item.label}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Icon className="w-5 h-5" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        disabled={disabled}
                        className="w-7 h-7 rounded-full bg-background text-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
                        title="Edit / replace"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onAction({ type: "remove", item })}
                        disabled={disabled}
                        className="w-7 h-7 rounded-full bg-background text-destructive flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
                        title="Remove from design"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] leading-tight truncate" title={item.label}>
                    {item.label}
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={() => setAdding(kind)}
              disabled={disabled}
              className="w-24 aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[10px] text-center px-1 leading-tight">{addBtn}</span>
            </button>
          </div>
        </div>
      ))}

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
