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
import DesignHighlights from "@/components/generate/DesignHighlights";

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
  price?: number;
  currency?: string;
  imageUrl?: string;
  category?: string;
  style?: string;
}

interface DesignHighlightsData {
  colorScheme: {
    colors: string[];
    description: string;
    visual?: string;
  };
  accentFurniture: {
    name: string;
    description: string;
    visual?: string;
  };
  moodboard: {
    elements: string[];
    description: string;
    visual?: string;
  };
}

const Generate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const quizData = location.state?.quizData as QuizData | undefined;

  const [generating, setGenerating] = useState(false);
  const [design, setDesign] = useState<GeneratedDesign | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [modificationInput, setModificationInput] = useState("");
  const [highlightsData, setHighlightsData] = useState<DesignHighlightsData | null>(null);
  const [generatingHighlights, setGeneratingHighlights] = useState(false);
  const [applyingHighlight, setApplyingHighlight] = useState<string | null>(null);

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
    generateDesign();
  }, [user, loading, navigate, quizData]);

  const generateDesign = async () => {
    if (!quizData || !user) return;

    const { productAnalysis, sourceImages, includeProducts } = location.state || {};

    setGenerating(true);
    setDesign(null);
    setHighlightsData(null);

    try {
      const response = await supabase.functions.invoke("generate-design", {
        body: {
          ...quizData,
          sourceImageUrl: quizData.sourceImageUrl,
          selectedProducts: includeProducts ? productAnalysis?.products : undefined,
          productImageUrls: includeProducts ? sourceImages : undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { imageUrl, prompt: usedPrompt } = response.data;

      // Save to database
      const { data: savedDesign } = await supabase
        .from("generated_designs")
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          prompt: usedPrompt,
          source_image_url: quizData.sourceImageUrl,
        })
        .select()
        .single();

      const newDesign: GeneratedDesign = {
        id: savedDesign?.id || `design-${Date.now()}`,
        imageUrl,
        title: "Your Personalized Design",
        description: "Custom room design based on your style preferences",
        isFavorite: false,
      };

      setDesign(newDesign);

      // Search for products and generate highlights
      searchProducts(imageUrl);
      generateHighlights(imageUrl);

      toast({
        title: "Design generated!",
        description: "Your personalized room design is ready",
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
    }
  };

  const generateHighlights = async (imageUrl: string) => {
    if (!quizData) return;

    setGeneratingHighlights(true);
    try {
      // Use AI to analyze the generated design and extract highlights
      const response = await supabase.functions.invoke("analyze-style", {
        body: {
          images: [imageUrl],
          mode: "room",
        },
      });

      if (response.data && !response.data.error) {
        const analysis = response.data;
        
        // Map the analysis to highlights format
        setHighlightsData({
          colorScheme: {
            colors: analysis.dominantColors || getDefaultColors(quizData.colorPalette),
            description: analysis.moodboardDescription || 
                        `A harmonious ${quizData.colorPalette || "neutral"} palette that creates the perfect atmosphere for your ${quizData.roomType || "space"}.`,
          },
          accentFurniture: {
            name: analysis.styles?.[0]?.styleName || getDefaultAccentFurniture(quizData.stylePreference),
            description: analysis.styles?.[0]?.description || 
                        `A statement piece that embodies the ${quizData.stylePreference || "modern"} aesthetic and serves as the focal point of the room.`,
          },
          moodboard: {
            elements: analysis.styles?.[0]?.keywords || 
                     quizData.mustHaveElements || 
                     ["Texture", "Lighting", "Plants", "Art"],
            description: `Key design elements that bring together the ${quizData.stylePreference || "modern"} style with your personal preferences.`,
          },
        });
      } else {
        // Fallback to default highlights based on quiz data
        setHighlightsData({
          colorScheme: {
            colors: getDefaultColors(quizData.colorPalette),
            description: `A curated ${quizData.colorPalette || "neutral"} palette that creates warmth and sophistication in your ${quizData.roomType || "space"}.`,
          },
          accentFurniture: {
            name: getDefaultAccentFurniture(quizData.stylePreference),
            description: `The perfect accent piece to complement your ${quizData.stylePreference || "modern"} design vision.`,
          },
          moodboard: {
            elements: quizData.mustHaveElements?.length 
              ? quizData.mustHaveElements 
              : ["Natural textures", "Ambient lighting", "Organic shapes", "Personal touches"],
            description: `A collection of elements that define your unique style and create a cohesive, inviting space.`,
          },
        });
      }
    } catch (error) {
      console.error("Highlights generation error:", error);
      // Set default highlights on error
      setHighlightsData({
        colorScheme: {
          colors: getDefaultColors(quizData.colorPalette),
          description: `A balanced color scheme reflecting your ${quizData.colorPalette || "neutral"} preferences.`,
        },
        accentFurniture: {
          name: getDefaultAccentFurniture(quizData.stylePreference),
          description: "A signature piece that anchors your room's design.",
        },
        moodboard: {
          elements: quizData.mustHaveElements || ["Style", "Comfort", "Function", "Beauty"],
          description: "The essential elements that make your space uniquely yours.",
        },
      });
    } finally {
      setGeneratingHighlights(false);
    }
  };

  const getDefaultColors = (palette?: string): string[] => {
    const colorMaps: Record<string, string[]> = {
      neutral: ["#F5F5DC", "#D4C4A8", "#8B7355", "#5D4E37", "#2F2F2F"],
      cool: ["#E3F2FD", "#90CAF9", "#42A5F5", "#1976D2", "#0D47A1"],
      warm: ["#FFF3E0", "#FFCC80", "#FF9800", "#E65100", "#BF360C"],
      bold: ["#F3E5F5", "#BA68C8", "#7B1FA2", "#4A148C", "#1A237E"],
      monochrome: ["#FAFAFA", "#BDBDBD", "#757575", "#424242", "#212121"],
    };
    return colorMaps[palette || "neutral"] || colorMaps.neutral;
  };

  const getDefaultAccentFurniture = (style?: string): string => {
    const furnitureMap: Record<string, string> = {
      "modern-minimal": "Sculptural Lounge Chair",
      "classic-historical": "Antique Armoire",
      "bohemian-eclectic": "Rattan Peacock Chair",
      "rustic-nature": "Live Edge Wood Table",
      "mediterranean": "Wrought Iron Daybed",
      "glam-luxe": "Velvet Statement Sofa",
    };
    return furnitureMap[style || "modern-minimal"] || "Designer Accent Chair";
  };

  const searchProducts = async (imageUrl?: string) => {
    if (!quizData) return;

    setLoadingProducts(true);
    try {
      const response = await supabase.functions.invoke("search-products", {
        body: {
          imageUrl: imageUrl,
          style: quizData.stylePreference,
          room: quizData.roomType,
          query: quizData.mustHaveElements?.join(" "),
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
    if (!modificationInput.trim() || !quizData || !design) return;

    setGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-design", {
        body: {
          ...quizData,
          modificationPrompt: modificationInput,
          sourceImageUrl: design.imageUrl,
        },
      });

      if (response.error) throw new Error(response.error.message);

      const { imageUrl } = response.data;

      // Update design
      setDesign({
        ...design,
        imageUrl,
        description: modificationInput,
      });

      setModificationInput("");

      // Regenerate highlights for the new design
      generateHighlights(imageUrl);

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

  const handleFavorite = async () => {
    if (!design) return;

    setDesign({ ...design, isFavorite: !design.isFavorite });

    // Update in database if it's a real ID
    if (!design.id.startsWith("design-")) {
      await supabase
        .from("generated_designs")
        .update({ is_favorite: !design.isFavorite })
        .eq("id", design.id);
    }
  };

  const handleDownload = async () => {
    if (!design) return;
    
    try {
      const link = document.createElement("a");
      link.href = design.imageUrl;
      link.download = `room-design-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Downloaded!",
        description: "Image saved to your device",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleApplyHighlightNote = async (highlightId: string, note: string) => {
    if (!design || !quizData) return;

    setApplyingHighlight(highlightId);
    
    // Build context-specific prompt based on the highlight type
    const highlightPrompts: Record<string, string> = {
      colorScheme: `Adjust the color scheme of this room design: ${note}. Keep the overall style but update the colors as requested.`,
      accentFurniture: `Modify the furniture in this room design: ${note}. Maintain the room's style but update the accent furniture as specified.`,
      moodboard: `Update the design elements and mood of this room: ${note}. Keep the core aesthetic but adjust the elements as requested.`,
    };

    const modificationPrompt = highlightPrompts[highlightId] || note;

    try {
      const response = await supabase.functions.invoke("generate-design", {
        body: {
          ...quizData,
          modificationPrompt,
          sourceImageUrl: design.imageUrl,
        },
      });

      if (response.error) throw new Error(response.error.message);

      const { imageUrl } = response.data;

      // Update design with the new image
      setDesign({
        ...design,
        imageUrl,
        description: `Updated ${highlightId}: ${note}`,
      });

      // Regenerate highlights for the updated design
      generateHighlights(imageUrl);

      toast({
        title: "Design updated!",
        description: `${highlightId === "colorScheme" ? "Color scheme" : highlightId === "accentFurniture" ? "Furniture" : "Moodboard elements"} adjusted based on your note`,
      });
    } catch (error) {
      console.error("Highlight modification error:", error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setApplyingHighlight(null);
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

      <div className="max-w-5xl mx-auto relative z-10 p-4 md:p-6 space-y-8">
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
            Your personalized room design with key highlights
          </p>
        </div>

        {/* Generation Progress */}
        {generating && !design && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <div className="text-center">
                  <p className="font-medium">Creating your personalized design...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This may take a moment
                  </p>
                </div>
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

        {/* Main Design */}
        {design && (
          <div className="max-w-3xl mx-auto">
            <DesignImage
              imageUrl={design.imageUrl}
              title={design.title}
              description={design.description}
              index={0}
              isFavorite={design.isFavorite}
              onFavorite={handleFavorite}
              onDownload={handleDownload}
            />
          </div>
        )}

        {/* Modification Input */}
        {design && !generating && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm max-w-3xl mx-auto">
            <CardContent className="p-4">
              <div className="space-y-3">
                <p className="text-sm font-medium">Refine your design</p>
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
                  <Button variant="outline" onClick={generateDesign} disabled={generating}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Design Highlights */}
        {highlightsData && (
          <DesignHighlights
            colorScheme={highlightsData.colorScheme}
            accentFurniture={highlightsData.accentFurniture}
            moodboard={highlightsData.moodboard}
            onApplyNote={handleApplyHighlightNote}
            isApplying={applyingHighlight}
          />
        )}

        {/* Loading Highlights */}
        {generatingHighlights && !highlightsData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Products Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Shop the Look</h2>
              <p className="text-sm text-muted-foreground">
                AI-detected products from your design
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
                  No matching products found. Try generating a design first.
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
