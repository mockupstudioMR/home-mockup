import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { X, Plus, Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConclusionVisualsProps {
  moodboardDescription: string;
  dominantColors: string[];
  onDominantColorsChange: (colors: string[]) => void;
  styleNames: string[];
  /** Optional seed materials/textures extracted from analysis. */
  seedElements?: string[];
}

type EditableListProps = {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
};

const EditableChips = ({ items, onChange, placeholder = "add" }: EditableListProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState("");

  const startEdit = (i: number) => {
    setEditingIndex(i);
    setEditValue(items[i]);
  };
  const commitEdit = () => {
    if (editingIndex === null) return;
    const v = editValue.trim();
    onChange(v ? items.map((el, idx) => (idx === editingIndex ? v : el)) : items.filter((_, idx) => idx !== editingIndex));
    setEditingIndex(null);
    setEditValue("");
  };
  const removeAt = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const addNew = () => {
    const v = newValue.trim();
    if (v) onChange([...items, v]);
    setNewValue("");
    setAdding(false);
  };

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {items.map((el, i) =>
        editingIndex === i ? (
          <span key={i} className="inline-flex items-center gap-1 rounded-full border border-primary bg-background pl-1 pr-0.5 py-0.5">
            <Input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
                if (e.key === "Escape") { setEditingIndex(null); setEditValue(""); }
              }}
              onBlur={commitEdit}
              className="h-6 text-xs px-2 py-0 w-32 border-0 focus-visible:ring-0"
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={commitEdit}
              className="w-5 h-5 rounded-full text-primary hover:bg-primary/10 flex items-center justify-center"
            >
              <Check className="w-3 h-3" />
            </button>
          </span>
        ) : (
          <span
            key={i}
            className="group inline-flex items-center gap-1 rounded-full border border-border bg-background pl-2.5 pr-1 py-0.5 text-xs hover:border-primary/50 transition-colors"
          >
            <button
              type="button"
              onClick={() => startEdit(i)}
              className="inline-flex items-center gap-1"
              title="Edit"
            >
              <span>{el}</span>
              <Pencil className="w-2.5 h-2.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
            </button>
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="w-4 h-4 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center"
              title="Remove"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ),
      )}

      {adding ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-primary bg-background pl-1 pr-0.5 py-0.5">
          <Input
            autoFocus
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addNew(); }
              if (e.key === "Escape") { setAdding(false); setNewValue(""); }
            }}
            onBlur={addNew}
            placeholder={placeholder}
            className="h-6 text-xs px-2 py-0 w-32 border-0 focus-visible:ring-0"
          />
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      )}
    </div>
  );
};

const ConclusionVisuals = ({
  moodboardDescription,
  dominantColors,
  onDominantColorsChange,
  styleNames,
  seedElements,
}: ConclusionVisualsProps) => {
  // Materials & Textures (editable, seeded from analysis)
  const initialMaterials = useMemo(
    () => Array.from(new Set((seedElements || []).filter(Boolean))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [(seedElements || []).join("|")],
  );
  const [materials, setMaterials] = useState<string[]>(initialMaterials);
  useEffect(() => setMaterials(initialMaterials), [initialMaterials]);

  // Style References (editable, seeded from detected styles)
  const initialReferences = useMemo(() => {
    const refs: string[] = [];
    if (styleNames.length > 1) refs.push(`Blend: ${styleNames.join(" + ")}`);
    refs.push(...styleNames);
    return Array.from(new Set(refs));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleNames.join("|")]);
  const [references, setReferences] = useState<string[]>(initialReferences);
  useEffect(() => setReferences(initialReferences), [initialReferences]);

  return (
    <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 space-y-5">
      {moodboardDescription && (
        <p className="text-sm text-muted-foreground leading-relaxed">{moodboardDescription}</p>
      )}

      {/* Dominant Colors */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 font-medium">
          Dominant Colors
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          {dominantColors.map((color, index) => (
            <div key={index} className="relative group">
              <label className="block cursor-pointer">
                <div
                  className="w-10 h-10 rounded-lg border-2 border-border hover:border-primary/50 transition-colors"
                  style={{ backgroundColor: color }}
                  title={color}
                />
                <input
                  type="color"
                  value={color}
                  onChange={(e) =>
                    onDominantColorsChange(
                      dominantColors.map((c, i) => (i === index ? e.target.value : c)),
                    )
                  }
                  className="sr-only"
                />
              </label>
              <button
                type="button"
                onClick={() => onDominantColorsChange(dominantColors.filter((_, i) => i !== index))}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove color"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
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

      {/* Materials & Textures */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 font-medium">
          Materials &amp; Textures
        </p>
        <EditableChips items={materials} onChange={setMaterials} placeholder="boucle, oak…" />
      </div>

      {/* Style References */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 font-medium">
          Style References
        </p>
        <EditableChips items={references} onChange={setReferences} placeholder="Japandi, Art Deco…" />
      </div>
    </div>
  );
};

export default ConclusionVisuals;
