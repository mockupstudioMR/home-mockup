import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/QuizContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, ArrowRight, Check } from "lucide-react";

// Style moodboard images
import classicHistorical from "@/assets/styles/classic-historical.png";
import modernMinimal from "@/assets/styles/modern-minimal.png";
import rusticNature from "@/assets/styles/rustic-nature.png";
import mediterranean from "@/assets/styles/mediterranean.png";
import bohemianEclectic from "@/assets/styles/bohemian-eclectic.png";
import glamLuxe from "@/assets/styles/glam-luxe.png";

interface StyleOption {
  id: string;
  title: string;
  description: string;
  image: string;
  keywords: string[];
}

const styles: StyleOption[] = [
  {
    id: "modern-minimal",
    title: "Modern & Minimal",
    description: "Clean lines, neutral palette, functional simplicity with Scandinavian influences",
    image: modernMinimal,
    keywords: ["minimalist", "contemporary", "Scandinavian", "clean", "functional"],
  },
  {
    id: "classic-historical",
    title: "Classic & Historical",
    description: "Timeless elegance with ornate details, rich woods, and traditional craftsmanship",
    image: classicHistorical,
    keywords: ["traditional", "elegant", "antique", "ornate", "timeless"],
  },
  {
    id: "rustic-nature",
    title: "Rustic & Nature-Inspired",
    description: "Warm natural materials, earthy tones, and cozy farmhouse charm",
    image: rusticNature,
    keywords: ["rustic", "farmhouse", "natural", "cozy", "earthy"],
  },
  {
    id: "mediterranean",
    title: "Mediterranean & Coastal",
    description: "Light and airy spaces with terracotta, woven textures, and seaside tranquility",
    image: mediterranean,
    keywords: ["mediterranean", "coastal", "relaxed", "warm", "textured"],
  },
  {
    id: "bohemian-eclectic",
    title: "Bohemian & Eclectic",
    description: "Global influences, rich patterns, artisanal crafts, and layered textures",
    image: bohemianEclectic,
    keywords: ["bohemian", "eclectic", "global", "artistic", "layered"],
  },
  {
    id: "glam-luxe",
    title: "Glam & Luxe",
    description: "Sophisticated glamour with metallic accents, plush fabrics, and statement pieces",
    image: glamLuxe,
    keywords: ["glamorous", "luxury", "sophisticated", "elegant", "opulent"],
  },
];

const StyleTree = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { updateQuizData } = useQuiz();
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source");
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyles((prev) =>
      prev.includes(styleId) ? prev.filter((s) => s !== styleId) : [...prev, styleId]
    );
  };

  const handleContinue = () => {
    if (selectedStyles.length > 0) {
      const firstStyle = styles.find((s) => s.id === selectedStyles[0]);
      updateQuizData({
        stylePreference: selectedStyles.join(","),
        colorPalette: getDefaultColorForStyle(selectedStyles[0]),
      });
      navigate("/generate", { state: { selectedStyle: firstStyle, selectedStyles, source } });
    }
  };

  const getDefaultColorForStyle = (styleId: string): string => {
    const colorMap: Record<string, string> = {
      "modern-minimal": "neutral",
      "classic-historical": "warm",
      "rustic-nature": "warm",
      "mediterranean": "neutral",
      "bohemian-eclectic": "warm",
      "glam-luxe": "neutral",
    };
    return colorMap[styleId] || "neutral";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-2xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-2xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <button
          onClick={() => navigate("/start")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Home className="w-5 h-5 text-primary-foreground" />
          </div>
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 pb-24">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-3 py-4">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Choose Your Style
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Select the interior style that resonates with you
            </p>
          </div>

          {/* Style Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {styles.map((style) => (
              <Card
                key={style.id}
                className={`group cursor-pointer overflow-hidden transition-all duration-300 ${
                  selectedStyles.includes(style.id)
                    ? "ring-2 ring-primary border-primary"
                    : "border-border/50 hover:border-primary/30"
                }`}
                onClick={() => handleStyleSelect(style.id)}
              >
                {/* Image */}
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={style.image}
                    alt={style.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Selection Indicator */}
                  {selectedStyle === style.id && (
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-6 h-6 text-primary-foreground" />
                    </div>
                  )}
                  {/* Gradient Overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
                  {/* Title Overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="text-xl font-bold text-white">{style.title}</h3>
                  </div>
                </div>

                {/* Description */}
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {style.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {style.keywords.slice(0, 3).map((keyword) => (
                      <span
                        key={keyword}
                        className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Fixed Bottom CTA */}
      {selectedStyle && (
        <div className="fixed bottom-0 inset-x-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border z-20">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <p className="font-medium">
                {styles.find(s => s.id === selectedStyle)?.title}
              </p>
              <p className="text-sm text-muted-foreground">Selected style</p>
            </div>
            <Button size="lg" onClick={handleContinue}>
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleTree;
