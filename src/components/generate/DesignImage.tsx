import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Download, Send, RefreshCw, Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  onModify?: () => void;
  onRegenerate?: () => void;
  generating?: boolean;
  referenceImageUrl?: string | null;
  onReferenceUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveReference?: () => void;
  uploadingReference?: boolean;
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
}: DesignImageProps) => {
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
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>

        {/* Refine your design section */}
        {showRefine && (
          <div className="space-y-4 pt-3 border-t border-border/50">
            <p className="text-sm font-medium">Refine your design</p>
            
            {/* Reference Image Upload */}
            <div className="flex items-center gap-3">
              {referenceImageUrl ? (
                <div className="relative">
                  <img 
                    src={referenceImageUrl} 
                    alt="Reference" 
                    className="w-16 h-16 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={onRemoveReference}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors">
                  {uploadingReference ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">Add reference</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onReferenceUpload}
                    className="hidden"
                    disabled={uploadingReference}
                  />
                </label>
              )}
              {referenceImageUrl && (
                <span className="text-xs text-muted-foreground">Reference image added</span>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Add plants, change wall color to blue, add more lighting..."
                value={modificationInput}
                onChange={(e) => onModificationInputChange?.(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onModify?.()}
              />
              <Button onClick={onModify} disabled={!modificationInput.trim() || generating}>
                <Send className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={onRegenerate} disabled={generating}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DesignImage;
