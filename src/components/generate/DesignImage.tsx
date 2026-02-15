import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Download, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DesignImageProps {
  imageUrl: string;
  title: string;
  description: string;
  index: number;
  isFavorite?: boolean;
  onFavorite?: () => void;
  onDownload?: () => void;
  onRefine?: (instruction: string) => void;
}

const DesignImage = ({
  imageUrl,
  title,
  description,
  index,
  isFavorite = false,
  onFavorite,
  onDownload,
  onRefine,
}: DesignImageProps) => {
  const [showRefine, setShowRefine] = useState(false);
  const [refineText, setRefineText] = useState("");

  const handleRefine = () => {
    if (!refineText.trim()) return;
    onRefine?.(refineText);
    setRefineText("");
    setShowRefine(false);
  };

  return (
    <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm group">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Quick actions overlay */}
        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="icon"
            className="w-8 h-8 bg-background/80 backdrop-blur-sm"
            onClick={onDownload}
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "w-8 h-8 bg-background/80 backdrop-blur-sm",
              isFavorite && "text-red-500"
            )}
            onClick={onFavorite}
          >
            <Heart className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} />
          </Button>
        </div>

        {/* Design number badge */}
        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground font-semibold text-sm">
          {index + 1}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Title and description */}
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>

        {/* Refine action */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => setShowRefine(!showRefine)}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Refine Your Design
          </Button>
        </div>

        {/* Refine section */}
        {showRefine && (
          <div className="space-y-3 pt-3 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              Describe what you'd like to change about this design
            </p>
            <div className="flex gap-2">
              <Textarea
                placeholder="e.g. Make the sofa darker, add more plants, change the rug..."
                value={refineText}
                onChange={(e) => setRefineText(e.target.value)}
                className="min-h-[60px] resize-none"
              />
              <Button
                size="sm"
                onClick={handleRefine}
                disabled={!refineText.trim()}
              >
                Refine
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DesignImage;
