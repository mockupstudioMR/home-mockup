import { useQuiz } from "@/contexts/QuizContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import QuizOption from "../QuizOption";
import { Skeleton } from "@/components/ui/skeleton";

interface CMSStyle {
  key: string;
  value: string;
  metadata: { title?: string; description?: string } | null;
}

// Fallback styles if CMS is empty
const fallbackStyles = [
  { value: "modern", label: "Modern Minimal", description: "Clean lines, neutral tones, and minimalist furniture" },
  { value: "classic", label: "Classic Historical", description: "Timeless elegance with rich textures and refined details" },
  { value: "rustic", label: "Rustic Nature", description: "Warm wood tones, natural materials, and cozy textures" },
  { value: "mediterranean", label: "Mediterranean", description: "Sun-kissed colors, terracotta, and coastal vibes" },
  { value: "bohemian", label: "Bohemian Eclectic", description: "Eclectic patterns, vibrant colors, and global influences" },
  { value: "glam", label: "Glam Luxe", description: "Luxurious finishes, bold accents, and sophisticated glamour" },
];

const StyleStep = () => {
  const { quizData, updateQuizData } = useQuiz();

  const { data: cmsStyles, isLoading } = useQuery({
    queryKey: ["cms-quiz-styles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cms_content")
        .select("key, value, metadata")
        .like("key", "quiz_style_%")
        .eq("content_type", "image_url");

      if (error) throw error;
      return data as CMSStyle[];
    },
  });

  // Map CMS data to style options
  const styles = cmsStyles?.length
    ? cmsStyles.map((item) => {
        const styleKey = item.key.replace("quiz_style_", "");
        return {
          value: styleKey,
          label: item.metadata?.title || styleKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          description: item.metadata?.description || "",
          imageUrl: item.value,
        };
      })
    : fallbackStyles.map((s) => ({ ...s, imageUrl: undefined }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">What's your design style?</h2>
          <p className="text-muted-foreground">Choose the aesthetic that speaks to you</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">What's your design style?</h2>
        <p className="text-muted-foreground">Choose the aesthetic that speaks to you</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {styles.map((style) => (
          <button
            key={style.value}
            onClick={() => updateQuizData({ stylePreference: style.value })}
            className={`relative group overflow-hidden rounded-xl border-2 transition-all ${
              quizData.stylePreference === style.value
                ? "border-primary ring-2 ring-primary/20"
                : "border-border hover:border-primary/50"
            }`}
          >
            {style.imageUrl ? (
              <img
                src={style.imageUrl}
                alt={style.label}
                className="w-full aspect-[4/3] object-cover"
              />
            ) : (
              <div className="w-full aspect-[4/3] bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">{style.label}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
              <p className="text-white font-semibold text-sm">{style.label}</p>
              {style.description && (
                <p className="text-white/70 text-xs line-clamp-2">{style.description}</p>
              )}
            </div>
            {quizData.stylePreference === style.value && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StyleStep;
