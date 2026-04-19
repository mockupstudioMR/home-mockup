import { useQuiz } from "@/contexts/QuizContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import QuizOption from "../QuizOption";
import { Skeleton } from "@/components/ui/skeleton";

// Import local style images
import modernMinimalImg from "@/assets/styles/modern-minimal.png";
import bohemianEclecticImg from "@/assets/styles/bohemian-eclectic.png";
import classicHistoricalImg from "@/assets/styles/classic-historical.png";
import glamLuxeImg from "@/assets/styles/glam-luxe.png";
import mediterraneanImg from "@/assets/styles/mediterranean.png";
import rusticNatureImg from "@/assets/styles/rustic-nature.png";

// Map local asset paths to imported images
const localAssetMap: Record<string, string> = {
  "/src/assets/styles/modern-minimal.png": modernMinimalImg,
  "/src/assets/styles/bohemian-eclectic.png": bohemianEclecticImg,
  "/src/assets/styles/classic-historical.png": classicHistoricalImg,
  "/src/assets/styles/glam-luxe.png": glamLuxeImg,
  "/src/assets/styles/mediterranean.png": mediterraneanImg,
  "/src/assets/styles/rustic-nature.png": rusticNatureImg,
};

interface CMSStyle {
  key: string;
  value: string;
  metadata: { label?: string; title?: string; description?: string } | null;
}

// Fallback styles if CMS is empty
const fallbackStyles = [
  { value: "modern_minimal", label: "Modern Minimal", description: "Clean lines, neutral tones, and minimalist furniture", imageUrl: modernMinimalImg },
  { value: "classic_historical", label: "Classic Historical", description: "Timeless elegance with rich textures and refined details", imageUrl: classicHistoricalImg },
  { value: "rustic_nature", label: "Rustic Nature", description: "Warm wood tones, natural materials, and cozy textures", imageUrl: rusticNatureImg },
  { value: "mediterranean", label: "Mediterranean", description: "Sun-kissed colors, terracotta, and coastal vibes", imageUrl: mediterraneanImg },
  { value: "bohemian_eclectic", label: "Bohemian Eclectic", description: "Eclectic patterns, vibrant colors, and global influences", imageUrl: bohemianEclecticImg },
  { value: "glam_luxe", label: "Glam Luxe", description: "Luxurious finishes, bold accents, and sophisticated glamour", imageUrl: glamLuxeImg },
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
        // Check if it's a local asset path and map it, otherwise use the URL directly
        const imageUrl = localAssetMap[item.value] || item.value;
        return {
          value: styleKey,
          label: item.metadata?.label || item.metadata?.title || styleKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          description: item.metadata?.description || "",
          imageUrl,
        };
      })
    : fallbackStyles;

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
        <p className="text-muted-foreground">Choose one or more aesthetics — we'll blend them</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {styles.map((style) => {
          const selected = (quizData.stylePreference || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          const isSelected = selected.includes(style.value);
          const toggle = () => {
            const next = isSelected
              ? selected.filter((s) => s !== style.value)
              : [...selected, style.value];
            updateQuizData({ stylePreference: next.join(",") });
          };
          return (
          <button
            key={style.value}
            onClick={toggle}
            className={`relative group overflow-hidden rounded-xl border-2 transition-all ${
              isSelected
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
            {isSelected && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
          );
        })}
      </div>
    </div>
  );
};

export default StyleStep;
