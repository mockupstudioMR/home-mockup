import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Plus, Check, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface TagVisualProps {
  tag: string;
  styleName: string;
  roomType?: string;
  selected?: boolean;
  onToggle?: () => void;
  inMoodboard?: boolean;
  /** Called when the user pins the generated visual to the moodboard. */
  onPin?: (label: string, imageUrl: string) => void;
  /** Whether this visual is already pinned. */
  pinned?: boolean;
}

export const MOODBOARD_DRAG_MIME = "application/x-moodboard-item";

const TagVisual = ({ tag, styleName, roomType = "living room", selected, onToggle, inMoodboard, onPin, pinned }: TagVisualProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    setOpen(true);
    try {
      const styleSlug = styleName.toLowerCase().replace(/\s+/g, "-");
      const { data, error } = await invokeQueued<{ imageUrl?: string }>(
        "generate-highlight-visuals",
        {
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

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    const payload = JSON.stringify({ label: tag, imageUrl: imageUrl || null, source: "tag" });
    e.dataTransfer.setData(MOODBOARD_DRAG_MIME, payload);
    e.dataTransfer.setData("text/plain", tag);
    e.dataTransfer.effectAllowed = "copy";
    // eslint-disable-next-line no-console
    console.log("[TagVisual] dragstart", { tag, hasImage: !!imageUrl });
  };

  return (
    <div className="inline-flex flex-col">
      <div
        draggable
        onDragStart={handleDragStart}
        title="Drag to moodboard"
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-background border border-border overflow-hidden cursor-grab active:cursor-grabbing",
          inMoodboard && "ring-1 ring-primary/40",
        )}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!pinned && onPin) onPin(tag, imageUrl || "");
          }}
          title={pinned ? "Added to moodboard" : "Add to moodboard"}
          disabled={pinned}
          className={cn(
            "pl-1.5 pr-0.5 py-1 transition-colors",
            pinned ? "text-primary" : "text-muted-foreground hover:text-primary",
          )}
        >
          {pinned ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className={cn(
            "text-xs px-1.5 py-1 transition-colors",
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
          title={open ? "Collapse visual" : "Show visual"}
          className="px-1.5 py-1 border-l border-border text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
        >
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
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
          {imageUrl && onPin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!pinned) onPin(tag, imageUrl);
              }}
              title={pinned ? "Added to moodboard" : "Add to moodboard"}
              className={cn(
                "absolute top-1 left-1 h-6 px-1.5 rounded-full flex items-center gap-1 text-[10px] font-medium z-10 transition-colors",
                pinned
                  ? "bg-primary text-primary-foreground"
                  : "bg-black/50 text-white hover:bg-primary hover:text-primary-foreground",
              )}
            >
              {pinned ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              <span>{pinned ? "Added to moodboard" : "Add to moodboard"}</span>
            </button>
          )}
          <div
            className="aspect-square"
            draggable={!!imageUrl}
            onDragStart={imageUrl ? handleDragStart : undefined}
          >
            {loading ? (
              <Skeleton className="w-full h-full" />
            ) : imageUrl ? (
              <img src={imageUrl} alt={tag} className="w-full h-full object-cover cursor-grab active:cursor-grabbing" />
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
