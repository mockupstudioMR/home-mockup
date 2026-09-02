import { useState, useCallback } from "react";
import { useQuiz } from "@/contexts/QuizContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Upload, Image, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getThumbnailImageUrl, optimizeImageFileSafe } from "@/lib/imageOptimization";

const inspirationImages = [
  {
    url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400",
    label: "Cozy Living",
  },
  {
    url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400",
    label: "Modern Minimal",
  },
  {
    url: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400",
    label: "Scandinavian",
  },
  {
    url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
    label: "Bohemian",
  },
  {
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400",
    label: "Traditional",
  },
  {
    url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",
    label: "Industrial Loft",
  },
];

const ImageStep = () => {
  const { quizData, updateQuizData } = useQuiz();
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);
      try {
        const optimizedFile = await optimizeImageFileSafe(file, { maxDimension: 2048 });
        const fileName = `${user.id}/${Date.now()}.webp`;

        const { error: uploadError } = await supabase.storage
          .from("room-photos")
          .upload(fileName, optimizedFile, { contentType: optimizedFile.type });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("room-photos")
          .getPublicUrl(fileName);

        updateQuizData({ sourceImageUrl: urlData.publicUrl });
        toast({
          title: "Photo uploaded!",
          description: "Your room photo is ready",
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Please try again",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    },
    [user, updateQuizData, toast]
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Add an inspiration image</h2>
      </div>

      {/* Upload Area */}
      <label
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed cursor-pointer transition-all",
          "hover:border-primary/50 hover:bg-accent/50",
          quizData.sourceImageUrl &&
            !inspirationImages.find((i) => i.url === quizData.sourceImageUrl)
            ? "border-primary bg-primary/10"
            : "border-border"
        )}
      >
        {uploading ? (
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        ) : quizData.sourceImageUrl &&
          !inspirationImages.find((i) => i.url === quizData.sourceImageUrl) ? (
          <div className="relative w-full h-full">
            <img
              src={getThumbnailImageUrl(quizData.sourceImageUrl)}
              alt="Uploaded"
              className="w-full h-full object-cover rounded-xl"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-4 h-4 text-primary-foreground" />
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              Click to upload your room photo
            </span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          disabled={uploading}
        />
      </label>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or choose inspiration
          </span>
        </div>
      </div>

      {/* Gallery */}
      <div className="grid grid-cols-3 gap-3">
        {inspirationImages.map((img) => (
          <button
            key={img.url}
            type="button"
            onClick={() => updateQuizData({ sourceImageUrl: img.url })}
            className={cn(
              "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
              quizData.sourceImageUrl === img.url
                ? "border-primary ring-2 ring-primary/20"
                : "border-transparent hover:border-primary/30"
            )}
          >
            <img
              src={img.url}
              alt={img.label}
              className="w-full h-full object-cover"
            />
            {quizData.sourceImageUrl === img.url && (
              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <span className="text-xs text-white font-medium">{img.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ImageStep;
