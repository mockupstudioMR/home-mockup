import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ConclusionVisualsProps {
  moodboardDescription: string;
  dominantColors: string[];
  styleNames: string[];
  roomType?: string;
  /** Bumping this re-runs generation. */
  refreshKey?: number;
}

const VARIANTS = 3;

const ConclusionVisuals = ({
  moodboardDescription,
  dominantColors,
  styleNames,
  roomType = "living room",
  refreshKey = 0,
}: ConclusionVisualsProps) => {
  const [visuals, setVisuals] = useState<(string | null)[]>([null, null, null]);
  const [loading, setLoading] = useState<boolean[]>([true, true, true]);

  useEffect(() => {
    if (!moodboardDescription) return;
    setVisuals([null, null, null]);
    setLoading([true, true, true]);

    const styleSlug =
      styleNames[0]?.toLowerCase().replace(/\s+/g, "-") || "modern-minimal";

    for (let i = 0; i < VARIANTS; i++) {
      const elements = [
        moodboardDescription,
        styleNames.length > 1 ? `Blend of ${styleNames.join(" + ")}` : styleNames[0],
        dominantColors.slice(0, 5).join(", "),
      ].filter(Boolean);

      supabase.functions
        .invoke("generate-highlight-visuals", {
          body: {
            type: "moodboard",
            style: styleSlug,
            room: roomType,
            elements,
            // small differentiator per variant + global refresh
            seed: `${refreshKey}-${i}`,
          },
        })
        .then(({ data, error }) => {
          setVisuals((prev) => {
            const next = [...prev];
            next[i] = !error && data?.imageUrl ? data.imageUrl : null;
            return next;
          });
          setLoading((prev) => {
            const next = [...prev];
            next[i] = false;
            return next;
          });
        })
        .catch(() => {
          setLoading((prev) => {
            const next = [...prev];
            next[i] = false;
            return next;
          });
        });
    }
  }, [moodboardDescription, refreshKey]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {visuals.map((url, i) => (
        <div
          key={i}
          className="aspect-square rounded-xl overflow-hidden border border-border/50 bg-secondary/30"
        >
          {loading[i] ? (
            <Skeleton className="w-full h-full" />
          ) : url ? (
            <img
              src={url}
              alt={`Conclusion moodboard ${i + 1}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ImageIcon className="w-8 h-8 opacity-40" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConclusionVisuals;
