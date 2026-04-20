import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Plus, Check, Pencil, Sparkles, Image as ImageIcon, Blend } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
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
  roomType?: string;
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
  roomType = "living room",
}: ConclusionVisualsProps) => {
  const styleSlug = useMemo(
    () => styleNames[0]?.toLowerCase().replace(/\s+/g, "-") || "modern-minimal",
    [styleNames],
  );

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

  // Add new material/reference state
  const [newMaterial, setNewMaterial] = useState("");
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [newReference, setNewReference] = useState("");
  const [addingReference, setAddingReference] = useState(false);

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
      {/* Dominant Colors */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
            Dominant Colors
          </p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Blend className="w-3 h-3" />
            {mixSelection.length === 1 ? "Pick a 2nd color to mix" : "Click 2 colors to blend"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
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

      {/* Materials & Textures with visuals */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 font-medium">
          Materials &amp; Textures
        </p>
        <div className="flex flex-wrap gap-3 items-start">
          {materials.map((m) => (
            <VisualChip
              key={m}
              label={m}
              kind="material"
              styleSlug={styleSlug}
              roomType={roomType}
              imageUrl={materialImages[m]}
              autoGenerate
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

      {/* Style References with visuals */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 font-medium">
          Style References
        </p>
        <div className="flex flex-wrap gap-3 items-start">
          {references.map((r) => (
            <VisualChip
              key={r}
              label={r}
              kind="styleReference"
              styleSlug={r.toLowerCase().replace(/\s+/g, "-")}
              roomType={roomType}
              iconicItem={iconicItems?.[r]}
              imageUrl={referenceImages[r]}
              autoGenerate
              onImageReady={(url) => setReferenceImages((prev) => ({ ...prev, [r]: url }))}
              onRename={(next) => renameReference(r, next)}
              onRemove={() => removeReference(r)}
            />
          ))}

          {addingReference ? (
            <div className="w-24">
              <div className="aspect-square rounded-lg border-2 border-dashed border-primary/50 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              </div>
              <Input
                autoFocus
                value={newReference}
                onChange={(e) => setNewReference(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = newReference.trim();
                    if (v && !references.includes(v)) setReferences((prev) => [...prev, v]);
                    setNewReference("");
                    setAddingReference(false);
                  }
                  if (e.key === "Escape") { setNewReference(""); setAddingReference(false); }
                }}
                onBlur={() => {
                  const v = newReference.trim();
                  if (v && !references.includes(v)) setReferences((prev) => [...prev, v]);
                  setNewReference("");
                  setAddingReference(false);
                }}
                placeholder="Japandi…"
                className="mt-1 h-6 text-[11px] px-1.5 py-0"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingReference(true)}
              className="w-24 aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="text-[10px]">Add style</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConclusionVisuals;
