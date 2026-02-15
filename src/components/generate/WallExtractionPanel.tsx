import { useState, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DoorOpen,
  Upload,
  X,
  Loader2,
  ArrowRightLeft,
  ImageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExtractedWall {
  id: string;
  wall_type: string;
  label: string;
  description: string;
  imageUrl?: string;
  realWallImageUrl?: string;
  userInstructions?: string;
}

interface WallExtractionPanelProps {
  designImageUrl: string;
  designId: string;
  onDesignUpdated: (newImageUrl: string) => void;
  disabled?: boolean;
}

const WALL_TYPE_LABELS: Record<string, string> = {
  pleine_wall: "Plain Wall",
  window_wall: "Window Wall",
  balcony_wall: "Balcony Wall",
  door_wall_left: "Door Wall (Left)",
  door_wall_right: "Door Wall (Right)",
};

const WALL_TYPE_EMOJI: Record<string, string> = {
  pleine_wall: "🧱",
  window_wall: "🪟",
  balcony_wall: "🏖️",
  door_wall_left: "🚪",
  door_wall_right: "🚪",
};

const WallExtractionPanel = ({
  designImageUrl,
  designId,
  onDesignUpdated,
  disabled = false,
}: WallExtractionPanelProps) => {
  const { toast } = useToast();
  const [walls, setWalls] = useState<ExtractedWall[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [uploadingWallId, setUploadingWallId] = useState<string | null>(null);
  const [replacingWallId, setReplacingWallId] = useState<string | null>(null);

  const handleExtractWalls = useCallback(async () => {
    setExtracting(true);
    try {
      const response = await supabase.functions.invoke("extract-walls", {
        body: { designImageUrl, designId },
      });

      if (response.error) throw new Error(response.error.message);

      if (response.data?.walls) {
        setWalls(response.data.walls);
        setExtracted(true);
      }
    } catch (error) {
      toast({
        title: "Wall extraction failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setExtracting(false);
    }
  }, [designImageUrl, designId, toast]);

  const handleUploadRealWall = async (
    wallId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingWallId(wallId);
    try {
      const fileName = `${designId}/real-wall-${wallId}-${Date.now()}.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("room-photos")
        .upload(fileName, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("room-photos")
        .getPublicUrl(fileName);

      setWalls((prev) =>
        prev.map((w) =>
          w.id === wallId
            ? { ...w, realWallImageUrl: urlData.publicUrl }
            : w
        )
      );
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Could not upload wall photo",
        variant: "destructive",
      });
    } finally {
      setUploadingWallId(null);
    }
  };

  const handleRemoveRealWall = (wallId: string) => {
    setWalls((prev) =>
      prev.map((w) =>
        w.id === wallId ? { ...w, realWallImageUrl: undefined } : w
      )
    );
  };

  const handleInstructionsChange = (wallId: string, value: string) => {
    setWalls((prev) =>
      prev.map((w) =>
        w.id === wallId ? { ...w, userInstructions: value } : w
      )
    );
  };

  const handleReplaceWall = async (wall: ExtractedWall) => {
    if (!wall.realWallImageUrl) return;

    setReplacingWallId(wall.id);
    try {
      const response = await supabase.functions.invoke("replace-wall", {
        body: {
          designImageUrl,
          designId,
          wallLabel: wall.label,
          wallDescription: wall.description,
          wallType: wall.wall_type,
          realWallImageUrl: wall.realWallImageUrl,
          userInstructions: wall.userInstructions || "",
        },
      });

      if (response.error) throw new Error(response.error.message);

      if (response.data?.imageUrl) {
        onDesignUpdated(response.data.imageUrl);
        toast({
          title: "Wall replaced!",
          description: `${wall.label} has been replaced with your real wall`,
        });
      }
    } catch (error) {
      toast({
        title: "Wall replacement failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setReplacingWallId(null);
    }
  };

  if (!extracted && !extracting) {
    return (
      <div className="pt-3 border-t border-border/50">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExtractWalls}
          disabled={disabled}
          className="w-full gap-2"
        >
          <DoorOpen className="w-4 h-4" />
          Extract Walls
        </Button>
      </div>
    );
  }

  if (extracting) {
    return (
      <div className="pt-3 border-t border-border/50 space-y-3">
        <p className="text-sm font-medium flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyzing walls...
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-3 border-t border-border/50 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium flex items-center gap-2">
          <DoorOpen className="w-4 h-4 text-primary" />
          Wall Extraction
        </p>
        <Badge variant="outline" className="text-xs">
          {walls.length} walls
        </Badge>
      </div>

      <div className="space-y-3">
        {walls.map((wall) => (
          <div
            key={wall.id}
            className="rounded-lg border border-border/50 bg-background/50 overflow-hidden"
          >
            {/* Wall header */}
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
              <span className="text-base">
                {WALL_TYPE_EMOJI[wall.wall_type] || "🧱"}
              </span>
              <span className="text-sm font-medium flex-1">{wall.label}</span>
              <Badge variant="secondary" className="text-[10px]">
                {WALL_TYPE_LABELS[wall.wall_type] || wall.wall_type}
              </Badge>
            </div>

            {/* Wall images row */}
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                {/* Design wall */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Design
                  </span>
                  {wall.imageUrl ? (
                    <div className="aspect-[3/2] rounded-md overflow-hidden border border-border/50">
                      <img
                        src={wall.imageUrl}
                        alt={wall.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[3/2] rounded-md bg-muted flex items-center justify-center border border-border/50">
                      <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                {/* Real wall */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Your Wall
                  </span>
                  {wall.realWallImageUrl ? (
                    <div className="relative aspect-[3/2] rounded-md overflow-hidden border border-border/50">
                      <img
                        src={wall.realWallImageUrl}
                        alt="Your wall"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveRealWall(wall.id)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="aspect-[3/2] rounded-md border border-dashed border-border cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors flex flex-col items-center justify-center gap-1">
                      {uploadingWallId === wall.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">
                            Upload photo
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadRealWall(wall.id, e)}
                        className="hidden"
                        disabled={
                          uploadingWallId === wall.id || disabled
                        }
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {wall.description}
              </p>

              {/* User instructions */}
              {wall.realWallImageUrl && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Instructions
                  </span>
                  <Textarea
                    placeholder="e.g. Keep the shelf and plants, replace only the wall paint and texture..."
                    value={wall.userInstructions || ""}
                    onChange={(e) => handleInstructionsChange(wall.id, e.target.value)}
                    className="min-h-[60px] text-xs resize-none"
                    disabled={replacingWallId === wall.id || disabled}
                  />
                </div>
              )}

              {/* Replace button */}
              {wall.realWallImageUrl && (
                <Button
                  size="sm"
                  onClick={() => handleReplaceWall(wall)}
                  disabled={
                    replacingWallId === wall.id ||
                    disabled
                  }
                  className="w-full gap-2 h-8 text-xs"
                >
                  {replacingWallId === wall.id ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Replacing...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-3 h-3" />
                      Replace with my wall
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {walls.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No walls detected in this design
        </p>
      )}
    </div>
  );
};

export default WallExtractionPanel;
