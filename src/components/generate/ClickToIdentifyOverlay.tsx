import { useState, useRef, useCallback } from "react";
import { X, Loader2, ShoppingBag, Image, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IdentifiedItem {
  item_name: string;
  item_type: string;
  description: string;
  color?: string;
  material?: string;
  style?: string;
  search_query?: string;
  shopping_url?: string;
  images_url?: string;
}

interface ClickToIdentifyOverlayProps {
  imageUrl: string;
  enabled: boolean;
}

const ClickToIdentifyOverlay = ({ imageUrl, enabled }: ClickToIdentifyOverlayProps) => {
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const [identifying, setIdentifying] = useState(false);
  const [item, setItem] = useState<IdentifiedItem | null>(null);
  const [clickPos, setClickPos] = useState<{ x: number; y: number } | null>(null);

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled || identifying) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setClickPos({ x, y });
      setItem(null);
      setIdentifying(true);

      try {
        const response = await supabase.functions.invoke("identify-item", {
          body: { imageUrl, clickX: Math.round(x), clickY: Math.round(y) },
        });

        if (response.error) throw new Error(response.error.message);
        if (response.data?.item) {
          setItem(response.data.item);
        }
      } catch (error) {
        toast({
          title: "Couldn't identify item",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
        setClickPos(null);
      } finally {
        setIdentifying(false);
      }
    },
    [enabled, identifying, imageUrl, toast]
  );

  const handleDismiss = () => {
    setItem(null);
    setClickPos(null);
  };

  if (!enabled) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-crosshair z-10"
      onClick={handleClick}
    >
      {/* Hint */}
      {!clickPos && !identifying && (
        <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs font-medium text-foreground shadow-md animate-fade-in flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5 text-primary" />
          Click any item to identify
        </div>
      )}

      {/* Click marker */}
      {clickPos && (
        <div
          className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${clickPos.x}%`, top: `${clickPos.y}%` }}
        >
          <div className="w-full h-full rounded-full border-2 border-primary bg-primary/20 animate-scale-in" />
          {identifying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          )}
        </div>
      )}

      {/* Item info popup */}
      {item && clickPos && (
        <div
          className="absolute z-20 pointer-events-auto animate-fade-in"
          style={{
            left: `${Math.min(Math.max(clickPos.x, 20), 80)}%`,
            top: clickPos.y > 50 ? `${clickPos.y - 5}%` : `${clickPos.y + 5}%`,
            transform: `translate(-50%, ${clickPos.y > 50 ? "-100%" : "0"})`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-background/95 backdrop-blur-md rounded-xl shadow-xl border border-border/50 p-4 w-64 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm leading-tight">{item.item_name}</h4>
                <Badge variant="secondary" className="text-[10px] mt-1">
                  {item.item_type}
                </Badge>
              </div>
              <button
                onClick={handleDismiss}
                className="shrink-0 w-6 h-6 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {item.description}
            </p>

            {/* Details */}
            <div className="flex flex-wrap gap-1.5">
              {item.color && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: item.color.toLowerCase() }}
                  />
                  {item.color}
                </Badge>
              )}
              {item.material && (
                <Badge variant="outline" className="text-[10px]">
                  {item.material}
                </Badge>
              )}
              {item.style && (
                <Badge variant="outline" className="text-[10px]">
                  {item.style}
                </Badge>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              {item.shopping_url && (
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs gap-1.5"
                  onClick={() => window.open(item.shopping_url, "_blank")}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Shop Similar
                </Button>
              )}
              {item.images_url && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 text-xs gap-1.5"
                  onClick={() => window.open(item.images_url, "_blank")}
                >
                  <Image className="w-3.5 h-3.5" />
                  Find Images
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClickToIdentifyOverlay;
