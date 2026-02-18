import { useState, useCallback } from "react";
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
  ChevronLeft,
  ChevronRight,
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
  resultImageUrl?: string;
}

interface WallExtractionPanelProps {
  designImageUrl: string;
  designId: string;
  onDesignUpdated: (newImageUrl: string) => void;
  disabled?: boolean;
  externalWalls?: ExtractedWall[];
  onWallsExtracted?: (walls: ExtractedWall[]) => void;
  readOnly?: boolean;
  roomType?: string;
  mustHaveElements?: string[];
}

const WALL_TYPE_LABELS: Record<string, string> = {
  pleine_wall: "Plain Wall",
  window_wall: "Window Wall",
  balcony_wall: "Balcony Wall",
  door_wall_left: "Door Wall (Left)",
  door_wall_right: "Door Wall (Right)",
  ceiling: "Ceiling",
};

const WALL_TYPE_EMOJI: Record<string, string> = {
  pleine_wall: "🧱",
  window_wall: "🪟",
  balcony_wall: "🏖️",
  door_wall_left: "🚪",
  door_wall_right: "🚪",
  ceiling: "💡",
};

export type { ExtractedWall };

const WallExtractionPanel = ({
  designImageUrl,
  designId,
  onDesignUpdated,
  disabled = false,
  externalWalls,
  onWallsExtracted,
  readOnly = false,
  roomType,
  mustHaveElements,
}: WallExtractionPanelProps) => {
  const { toast } = useToast();
  const [walls, setWalls] = useState<ExtractedWall[]>(externalWalls || []);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(!!(externalWalls && externalWalls.length > 0));
  const [uploadingWallId, setUploadingWallId] = useState<string | null>(null);
  const [replacingWallId, setReplacingWallId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const goToWall = (index: number) => {
    setActiveIndex(index);
  };

  const handleExtractWalls = useCallback(async () => {
    setExtracting(true);
    try {
      const response = await supabase.functions.invoke("extract-walls", {
        body: { designImageUrl, designId, roomType, mustHaveElements },
      });

      if (response.error) throw new Error(response.error.message);

      if (response.data?.walls) {
        setWalls(response.data.walls);
        setExtracted(true);
        onWallsExtracted?.(response.data.walls);
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
    if (!file) {
      console.log("[WallUpload] No file selected");
      return;
    }

    console.log("[WallUpload] Starting upload for wall:", wallId, "file:", file.name, file.size);
    setUploadingWallId(wallId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${user.id}/real-wall-${wallId}-${Date.now()}.${ext}`;
      console.log("[WallUpload] Uploading to:", fileName);
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("room-photos")
        .upload(fileName, file, { contentType: file.type, upsert: true });

      if (uploadError) {
        console.error("[WallUpload] Upload error:", uploadError);
        throw uploadError;
      }

      console.log("[WallUpload] Upload success:", uploadData);
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
      console.error("[WallUpload] Error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Could not upload wall photo",
        variant: "destructive",
      });
    } finally {
      setUploadingWallId(null);
      e.target.value = "";
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
        setWalls((prev) =>
          prev.map((w) =>
            w.id === wall.id
              ? { ...w, resultImageUrl: response.data.imageUrl }
              : w
          )
        );
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
    if (readOnly) return null;
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
          Extract Walls & Ceiling
        </Button>
      </div>
    );
  }

  if (extracting) {
    return (
      <div className="pt-4 border-t border-border/50 space-y-4">
        <p className="text-sm font-medium flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyzing walls & ceiling...
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const activeWall = walls[activeIndex];
  const isCeiling = activeWall?.wall_type === "ceiling";

  return (
    <div className="pt-4 border-t border-border/50 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium flex items-center gap-2">
          <DoorOpen className="w-4 h-4 text-primary" />
          Wall & Ceiling Extraction
        </p>
        <Badge variant="outline" className="text-xs">
          {walls.length} surfaces
        </Badge>
      </div>

      {walls.length > 0 && activeWall ? (
        <>
          {/* Navigation arrows + wall card */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToWall((activeIndex - 1 + walls.length) % walls.length)}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 rounded-lg border border-border/50 bg-background/50 overflow-hidden">
              {/* Wall header */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30">
                <span className="text-lg">
                  {WALL_TYPE_EMOJI[activeWall.wall_type] || "🧱"}
                </span>
                <span className="text-sm font-semibold flex-1">{activeWall.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {WALL_TYPE_LABELS[activeWall.wall_type] || activeWall.wall_type}
                </Badge>
              </div>

              {/* Wall images row */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  {/* Design wall */}
                  <div className="space-y-1.5">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Design
                    </span>
                    {activeWall.imageUrl ? (
                      <div className={`${isCeiling ? "aspect-square" : "aspect-[4/3]"} rounded-lg overflow-hidden border border-border/50`}>
                        <img
                          src={activeWall.imageUrl}
                          alt={activeWall.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`${isCeiling ? "aspect-square" : "aspect-[4/3]"} rounded-lg bg-muted flex items-center justify-center border border-border/50`}>
                        <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>

                  {/* Real wall */}
                  <div className="space-y-1.5">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      {isCeiling ? "Your Ceiling" : "Your Wall"}
                    </span>
                    {activeWall.realWallImageUrl ? (
                      <div className={`relative ${isCeiling ? "aspect-square" : "aspect-[4/3]"} rounded-lg overflow-hidden border border-border/50`}>
                        <img
                          src={activeWall.realWallImageUrl}
                          alt={isCeiling ? "Your ceiling" : "Your wall"}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemoveRealWall(activeWall.id)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className={`${isCeiling ? "aspect-square" : "aspect-[4/3]"} rounded-lg border border-dashed border-border cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors flex flex-col items-center justify-center gap-1.5`}>
                        {uploadingWallId === activeWall.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              Upload
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleUploadRealWall(activeWall.id, e)}
                          className="hidden"
                          disabled={uploadingWallId === activeWall.id || disabled}
                        />
                      </label>
                    )}
                  </div>

                  {/* Result */}
                  <div className="space-y-1.5">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                      Result
                    </span>
                    {replacingWallId === activeWall.id ? (
                      <div className={`${isCeiling ? "aspect-square" : "aspect-[4/3]"} rounded-lg bg-muted flex items-center justify-center border border-border/50`}>
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : activeWall.resultImageUrl ? (
                      <div className={`${isCeiling ? "aspect-square" : "aspect-[4/3]"} rounded-lg overflow-hidden border-2 border-primary/50`}>
                        <img
                          src={activeWall.resultImageUrl}
                          alt="Result"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`${isCeiling ? "aspect-square" : "aspect-[4/3]"} rounded-lg bg-muted/50 flex items-center justify-center border border-dashed border-border/50`}>
                        <span className="text-xs text-muted-foreground/50">Pending</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {activeWall.description}
                </p>

                {/* User instructions */}
                <div className="space-y-1.5">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    Instructions
                  </span>
                  <Textarea
                    placeholder={isCeiling
                      ? "e.g. Keep the chandelier, change the ceiling color to white..."
                      : "e.g. Keep the shelf and plants, replace only the wall paint and texture..."
                    }
                    value={activeWall.userInstructions || ""}
                    onChange={(e) => handleInstructionsChange(activeWall.id, e.target.value)}
                    className="min-h-[72px] text-sm resize-none"
                    disabled={replacingWallId === activeWall.id || disabled}
                  />
                </div>

                {/* Replace button */}
                {activeWall.realWallImageUrl && (
                  <Button
                    size="sm"
                    onClick={() => handleReplaceWall(activeWall)}
                    disabled={replacingWallId === activeWall.id || disabled}
                    className="w-full gap-2 h-9 text-sm"
                  >
                    {replacingWallId === activeWall.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Replacing...
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        {isCeiling ? "Replace with my ceiling" : "Replace with my wall"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <button
              onClick={() => goToWall((activeIndex + 1) % walls.length)}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-2">
            {walls.map((wall, i) => (
              <button
                key={wall.id}
                onClick={() => goToWall(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === activeIndex
                    ? "bg-primary scale-125"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                title={wall.label}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">
          No walls detected in this design
        </p>
      )}
    </div>
  );
};

export default WallExtractionPanel;
