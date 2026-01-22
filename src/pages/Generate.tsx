import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Send,
  Home,
  ArrowLeft,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import type { QuizData } from "@/contexts/QuizContext";
import DesignImage from "@/components/generate/DesignImage";
import ProductCard from "@/components/generate/ProductCard";
import StyleExplanation from "@/components/generate/StyleExplanation";

interface GeneratedDesign {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  isFavorite: boolean;
}

interface Product {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
}

const designVariations = [
  { title: "Main Design", description: "Your personalized room based on quiz preferences" },
  { title: "Alternative Layout", description: "Different furniture arrangement for the same style" },
  { title: "Color Variation", description: "Exploring different shades within your palette" },
  { title: "Minimalist Take", description: "Simplified version with essential elements" },
  { title: "Bold Statement", description: "More dramatic interpretation of your style" },
  { title: "Cozy Corner", description: "Focus on comfort and intimate spaces" },
  { title: "Daylight View", description: "Natural lighting emphasis for the space" },
];

const Generate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const quizData = location.state?.quizData as QuizData | undefined;

  const [generating, setGenerating] = useState(false);
  const [designs, setDesigns] = useState<GeneratedDesign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [modificationInput, setModificationInput] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (!quizData) {
      navigate("/quiz");
      return;
    }

    // Auto-generate on load
    generateAllDesigns();
    searchProducts();
  }, [user, loading, navigate, quizData]);

  const generateAllDesigns = async () => {
    if (!quizData || !user) return;

    const { productAnalysis, sourceImages, includeProducts } = location.state || {};

    setGenerating(true);
    setGenerationProgress(0);
    const newDesigns: GeneratedDesign[] = [];

    try {
      // Generate 7 variations
      for (let i = 0; i < 7; i++) {
        setGenerationProgress(Math.round(((i + 1) / 7) * 100));

        // Add variation prompts for different designs
        const variationPrompts = [
          "", // Main design
          "alternative furniture arrangement",
          "slightly different color tones",
          "more minimalist approach",
          "bolder accent pieces",
          "cozy and intimate atmosphere",
          "bright natural daylight emphasis",
        ];

        const response = await supabase.functions.invoke("generate-design", {
          body: {
            ...quizData,
            modificationPrompt: variationPrompts[i],
            sourceImageUrl: quizData.sourceImageUrl,
            selectedProducts: includeProducts ? productAnalysis?.products : undefined,
            productImageUrls: includeProducts ? sourceImages : undefined,
          },
        });

        if (response.error) {
          console.error(`Design ${i + 1} failed:`, response.error);
          continue;
        }

        const { imageUrl, prompt: usedPrompt } = response.data;

        // Save to database
        const { data: design } = await supabase
          .from("generated_designs")
          .insert({
            user_id: user.id,
            image_url: imageUrl,
            prompt: usedPrompt,
            source_image_url: quizData.sourceImageUrl,
          })
          .select()
          .single();

        newDesigns.push({
          id: design?.id || `design-${i}`,
          imageUrl,
          title: designVariations[i].title,
          description: designVariations[i].description,
          isFavorite: false,
        });

        // Update state progressively
        setDesigns([...newDesigns]);
      }

      toast({
        title: "Designs generated!",
        description: `Created ${newDesigns.length} personalized room designs`,
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
      setGenerationProgress(100);
    }
  };

  const searchProducts = async () => {
    if (!quizData) return;

    setLoadingProducts(true);
    try {
      // Build search query from quiz data
      const searchTerms = [
        quizData.stylePreference,
        quizData.roomType,
        ...(quizData.mustHaveElements || []),
      ].filter(Boolean).join(" ");

      const response = await supabase.functions.invoke("search-products", {
        body: {
          query: searchTerms,
          style: quizData.stylePreference,
          room: quizData.roomType,
        },
      });

      if (response.error) {
        console.error("Product search failed:", response.error);
        return;
      }

      if (response.data?.success && response.data?.products) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error("Product search error:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleModify = async () => {
    if (!modificationInput.trim() || !quizData || designs.length === 0) return;

    setGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-design", {
        body: {
          ...quizData,
          modificationPrompt: modificationInput,
          sourceImageUrl: designs[0].imageUrl,
        },
      });

      if (response.error) throw new Error(response.error.message);

      const { imageUrl } = response.data;

      // Add as new design at the beginning
      const newDesign: GeneratedDesign = {
        id: `modified-${Date.now()}`,
        imageUrl,
        title: "Modified Design",
        description: modificationInput,
        isFavorite: false,
      };

      setDesigns([newDesign, ...designs]);
      setModificationInput("");

      toast({
        title: "Design updated!",
        description: "Your modification has been applied",
      });
    } catch (error) {
      toast({
        title: "Modification failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleFavorite = async (designId: string) => {
    setDesigns(designs.map(d => 
      d.id === designId ? { ...d, isFavorite: !d.isFavorite } : d
    ));

    // Update in database if it's a real ID
    if (!designId.startsWith("design-") && !designId.startsWith("modified-")) {
      await supabase
        .from("generated_designs")
        .update({ is_favorite: true })
        .eq("id", designId);
    }
  };

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `room-design-${index + 1}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Downloaded!",
        description: "Image saved to your device",
      });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 p-4 md:p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/quiz")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Quiz</span>
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button
              onClick={() => navigate("/gallery")}
              className="text-sm text-primary hover:underline"
            >
              My Gallery
            </button>
          </div>
        </div>

        {/* Page Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Your Design Results</h1>
          <p className="text-muted-foreground">
            Explore {designs.length > 0 ? designs.length : 7} personalized room designs based on your preferences
          </p>
        </div>

        {/* Generation Progress */}
        {generating && designs.length < 7 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <div className="flex-1">
                  <p className="font-medium">Generating your designs...</p>
                  <div className="h-2 rounded-full bg-secondary mt-2 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium">{designs.length}/7</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Style Explanation */}
        {quizData && (
          <StyleExplanation
            style={quizData.stylePreference || "modern_minimal"}
            room={quizData.roomType || "living room"}
            colors={quizData.colorPalette}
            elements={quizData.mustHaveElements}
          />
        )}

        {/* Modification Input */}
        {designs.length > 0 && !generating && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="space-y-3">
                <p className="text-sm font-medium">Refine your designs</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add plants, change wall color to blue, add more lighting..."
                    value={modificationInput}
                    onChange={(e) => setModificationInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleModify()}
                  />
                  <Button onClick={handleModify} disabled={!modificationInput.trim() || generating}>
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" onClick={generateAllDesigns} disabled={generating}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Design Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((design, index) => (
            <DesignImage
              key={design.id}
              imageUrl={design.imageUrl}
              title={design.title}
              description={design.description}
              index={index}
              isFavorite={design.isFavorite}
              onFavorite={() => handleFavorite(design.id)}
              onDownload={() => handleDownload(design.imageUrl, index)}
            />
          ))}

          {/* Loading skeletons */}
          {generating && designs.length < 7 && (
            [...Array(7 - designs.length)].map((_, i) => (
              <Card key={`skeleton-${i}`} className="overflow-hidden">
                <Skeleton className="aspect-[4/3]" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Products Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Shop the Look</h2>
              <p className="text-sm text-muted-foreground">
                Matching products from WestwingNow
              </p>
            </div>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No matching products found. Try generating designs first.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Generate;
