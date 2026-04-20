import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Upload, X, Loader2, Camera, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getThumbnailImageUrl, optimizeImageFile } from "@/lib/imageOptimization";

interface ExistingRoomUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  disabled?: boolean;
  onAdjustToRoom?: () => void;
  adjusting?: boolean;
}

const ExistingRoomUpload = ({ images, onImagesChange, disabled, onAdjustToRoom, adjusting }: ExistingRoomUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      e.target.value = "";
      if (!files.length || !user) return;

      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (!imageFiles.length) {
        toast({ title: "Invalid files", description: "Please upload image files", variant: "destructive" });
        return;
      }

      setUploading(true);
      try {
        const uploads = imageFiles.slice(0, 4 - images.length).map(async (file) => {
          const optimizedFile = await optimizeImageFile(file, { maxDimension: 2048 });
          const fileName = `${user.id}/existing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.webp`;
          const { error } = await supabase.storage
            .from("room-photos")
            .upload(fileName, optimizedFile, { contentType: optimizedFile.type });
          if (error) throw error;
          const { data } = supabase.storage.from("room-photos").getPublicUrl(fileName);
          return data.publicUrl;
        });
        const urls = await Promise.all(uploads);
        onImagesChange([...images, ...urls]);
        toast({ title: "Photos uploaded!", description: `${urls.length} photo(s) added` });
      } catch {
        toast({ title: "Upload failed", description: "Please try again", variant: "destructive" });
      } finally {
        setUploading(false);
      }
    },
    [user, images, onImagesChange, toast]
  );

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm max-w-3xl mx-auto">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Camera className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Your existing room</p>
            <p className="text-xs text-muted-foreground">
              Upload photos of how the room looks now (up to 4)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {images.map((url, idx) => (
            <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
              <img src={getThumbnailImageUrl(url)} alt={`Room ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
              <button
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {images.length < 4 && (
            <label
              className={cn(
                "w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer transition-colors",
                "hover:border-primary/50 hover:bg-accent/50",
                disabled && "opacity-50 pointer-events-none"
              )}
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-1">Add</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                className="hidden"
                disabled={uploading || disabled}
              />
            </label>
          )}
        </div>

        {images.length > 0 && onAdjustToRoom && (
          <Button
            onClick={onAdjustToRoom}
            disabled={disabled || adjusting}
            className="w-full"
            size="sm"
          >
            {adjusting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adjusting to your room…
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Adjust design to my room
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ExistingRoomUpload;
