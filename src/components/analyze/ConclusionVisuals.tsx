import { useEffect, useMemo, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, X, Plus, RefreshCw, Check, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ConclusionVisualsProps {
  moodboardDescription: string;
  dominantColors: string[];
  styleNames: string[];
  roomType?: string;
  /** Optional seed elements (e.g. textures, keywords) extracted from analysis. */
  seedElements?: string[];
}

const ConclusionVisuals = ({
  moodboardDescription,
  dominantColors,
  styleNames,
  roomType = "living room",
  seedElements,
}: ConclusionVisualsProps) => {
  const styleSlug = useMemo(
    () => styleNames[0]?.toLowerCase().replace(/\s+/g, "-") || "modern-minimal",
    [styleNames],
  );

  // Build initial editable elements from style names + colors + seed
  const initialElements = useMemo(() => {
    const fromStyles =
      styleNames.length > 1 ? [`Blend of ${styleNames.join(" + ")}`] : styleNames.slice(0, 1);
    const fromColors = dominantColors.slice(0, 4);
    const seed = (seedElements || []).slice(0, 6);
    return Array.from(new Set([...fromStyles, ...seed, ...fromColors].filter(Boolean)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleNames.join("|"), dominantColors.join("|"), (seedElements || []).join("|")]);

  const [elements, setElements] = useState<string[]>(initialElements);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState("");
  const generationToken = useRef(0);

  // Sync editable elements when props meaningfully change (initial load / new analysis)
  useEffect(() => {
    setElements(initialElements);
  }, [initialElements]);

  const generate = async () => {
    if (!moodboardDescription) return;
    const token = ++generationToken.current;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-highlight-visuals",
        {
          body: {
            type: "moodboard",
            style: styleSlug,
            room: roomType,
            elements: [moodboardDescription, ...elements].filter(Boolean),
          },
        },
      );
      if (token !== generationToken.current) return;
      setImageUrl(!error && data?.imageUrl ? data.imageUrl : null);
    } catch {
      if (token === generationToken.current) setImageUrl(null);
    } finally {
      if (token === generationToken.current) setLoading(false);
    }
  };

  // Auto-generate once on mount / when description appears
  useEffect(() => {
    if (moodboardDescription) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moodboardDescription]);

  const startEdit = (i: number) => {
    setEditingIndex(i);
    setEditValue(elements[i]);
  };
  const commitEdit = () => {
    if (editingIndex === null) return;
    const v = editValue.trim();
    setElements((prev) =>
      v ? prev.map((el, idx) => (idx === editingIndex ? v : el)) : prev.filter((_, idx) => idx !== editingIndex),
    );
    setEditingIndex(null);
    setEditValue("");
  };
  const removeAt = (i: number) => setElements((prev) => prev.filter((_, idx) => idx !== i));
  const addNew = () => {
    const v = newValue.trim();
    if (v) setElements((prev) => [...prev, v]);
    setNewValue("");
    setAdding(false);
  };

  return (
    <div className="space-y-3">
      <div className="aspect-[16/10] rounded-xl overflow-hidden border border-border/50 bg-secondary/30 relative">
        {loading ? (
          <Skeleton className="w-full h-full" />
        ) : imageUrl ? (
          <img src={imageUrl} alt="Conclusion moodboard" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageIcon className="w-10 h-10 opacity-40" />
          </div>
        )}
      </div>

      {/* Editable elements */}
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
          Moodboard elements — click to edit
        </p>
        <div className="flex flex-wrap gap-1.5 items-center">
          {elements.map((el, i) =>
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
                className={cn(
                  "group inline-flex items-center gap-1 rounded-full border border-border bg-background pl-2.5 pr-1 py-0.5 text-xs hover:border-primary/50 transition-colors",
                )}
              >
                <button
                  type="button"
                  onClick={() => startEdit(i)}
                  className="inline-flex items-center gap-1"
                  title="Edit element"
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
                placeholder="add element"
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
              Add element
            </button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs"
            onClick={generate}
            disabled={loading}
          >
            <RefreshCw className={cn("w-3 h-3 mr-1.5", loading && "animate-spin")} />
            Regenerate
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConclusionVisuals;
