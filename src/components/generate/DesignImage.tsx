import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Download, Send, RefreshCw, Upload, X, Loader2, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import WallExtractionPanel from "./WallExtractionPanel";
import type { ExtractedWall } from "./WallExtractionPanel";
import ClickToIdentifyOverlay from "./ClickToIdentifyOverlay";
import RefinementPanel from "./RefinementPanel";
import type { ModificationType } from "./RefinementPanel";

interface DesignImageProps {
  imageUrl: string;
  title: string;
  description: string;
  index: number;
  isFavorite?: boolean;
  onFavorite?: () => void;
  onDownload?: () => void;
  // Refine props
  showRefine?: boolean;
  modificationInput?: string;
  onModificationInputChange?: (value: string) => void;
  onModify?: (type: ModificationType) => void;
  onRegenerate?: () => void;
  generating?: boolean;
  referenceImageUrl?: string | null;
  onReferenceUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveReference?: () => void;
  uploadingReference?: boolean;
  // Wall extraction props
  designId?: string;
  onDesignUpdated?: (newImageUrl: string) => void;
  extractedWalls?: ExtractedWall[];
  onWallsExtracted?: (walls: ExtractedWall[]) => void;
  roomType?: string;
  mustHaveElements?: string[];
}

const DesignImage = ({
  imageUrl,
  title,
  description,
  index,
  isFavorite = false,
  onFavorite,
  onDownload,
  showRefine = false,
  modificationInput = "",
  onModificationInputChange,
  onModify,
  onRegenerate,
  generating = false,
  referenceImageUrl,
  onReferenceUpload,
  onRemoveReference,
  uploadingReference = false,
  designId,
  onDesignUpdated,
  extractedWalls,
  onWallsExtracted,
  roomType,
  mustHaveElements,
}: DesignImageProps) => {
  const [identifyMode, setIdentifyMode] = useState(false);

  return (
    <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm group">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className={cn(
            "w-full h-full object-cover transition-transform duration-500",
            !identifyMode && "group-hover:scale-105"
          )}
        />
        {!identifyMode && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        )}

        {/* Click to identify overlay */}
        <ClickToIdentifyOverlay imageUrl={imageUrl} enabled={identifyMode} />
        
        {/* Quick actions overlay */}
        <div className={cn(
          "absolute bottom-3 right-3 flex gap-2 transition-opacity z-20",
          identifyMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <Button
            variant="secondary"
            size="icon"
            className={cn(
              "w-8 h-8 bg-background/80 backdrop-blur-sm",
              identifyMode && "ring-2 ring-primary text-primary"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIdentifyMode(!identifyMode);
            }}
            title={identifyMode ? "Exit identify mode" : "Click to identify items"}
          >
            <MousePointerClick className="w-4 h-4" />
          </Button>
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
        <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground font-semibold text-sm z-20">
          {index + 1}
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>

        {/* Refine your design section */}
        {showRefine && (
          <RefinementPanel
            modificationInput={modificationInput}
            onModificationInputChange={(v) => onModificationInputChange?.(v)}
            onModify={(type) => onModify?.(type)}
            onRegenerate={() => onRegenerate?.()}
            generating={generating}
            referenceImageUrl={referenceImageUrl}
            onReferenceUpload={onReferenceUpload}
            onRemoveReference={onRemoveReference}
            uploadingReference={uploadingReference}
          />
        )}

        {/* Wall Extraction Panel */}
        {showRefine && designId && onDesignUpdated && (
           <WallExtractionPanel
            designImageUrl={imageUrl}
            designId={designId}
            onDesignUpdated={onDesignUpdated}
            disabled={generating}
            externalWalls={extractedWalls}
            onWallsExtracted={onWallsExtracted}
            roomType={roomType}
            mustHaveElements={mustHaveElements}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default DesignImage;
