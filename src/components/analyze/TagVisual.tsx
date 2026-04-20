import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface TagVisualProps {
  tag: string;
  styleName: string;
  roomType?: string;
  selected?: boolean;
  onToggle?: () => void;
}

const TagVisual = ({ tag, styleName, roomType = "living room", selected, onToggle }: TagVisualProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    setOpen(true);
    try {
      const styleSlug = styleName.toLowerCase().replace(/\s+/g, "-");
      const { data, error } = await supabase.functions.invoke(
        "generate-highlight-visuals",
        {
          body: {
            type: "accentFurniture",
            style: styleSlug,
            room: roomType,
            furnitureName: tag,
            furnitureDescription: `A ${styleName} interpretation of "${tag}" — captured as a clear, photographic detail shot showing the material, texture and color story.`,
          },
        },
      );
      if (!error && data?.imageUrl) setImageUrl(data.imageUrl);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col">
      <div className="inline-flex items-center gap-1 rounded-full bg-background border border-border overflow-hidden">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className={cn(
            "text-xs pl-2.5 pr-1.5 py-1 transition-colors",
            selected ? "bg-primary/15 text-primary font-medium" : "hover:bg-secondary",
          )}
        >
          {tag}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (imageUrl) {
              setOpen((o) => !o);
            } else {
              generate();
            }
          }}
          title="Generate visual for this tag"
          className="px-1.5 py-1 border-l border-border text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
        >
          <Sparkles className="w-3 h-3" />
        </button>
      </div>

      {open && (
        <div className="mt-2 w-40 rounded-lg overflow-hidden border border-border/50 bg-secondary/30 relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center z-10"
          >
            <X className="w-3 h-3" />
          </button>
          <div className="aspect-square">
            {loading ? (
              <Skeleton className="w-full h-full" />
            ) : imageUrl ? (
              <img src={imageUrl} alt={tag} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                Failed
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagVisual;
