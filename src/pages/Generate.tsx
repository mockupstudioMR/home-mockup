import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Download,
  Share2,
  Heart,
  RefreshCw,
  Send,
  Home,
  ArrowLeft,
} from "lucide-react";
import type { QuizData } from "@/contexts/QuizContext";

const Generate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const quizData = location.state?.quizData as QuizData | undefined;

  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [modificationInput, setModificationInput] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [designId, setDesignId] = useState<string | null>(null);

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

  const generateDesign = async (modificationPrompt?: string) => {
    if (!quizData || !user) return;

    setGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-design", {
        body: {
          ...quizData,
          modificationPrompt,
          sourceImageUrl: modificationPrompt ? generatedImage : quizData.sourceImageUrl,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Generation failed");
      }

      const { imageUrl, prompt: usedPrompt } = response.data;
      setGeneratedImage(imageUrl);
      setPrompt(usedPrompt);

      // Save to database
      const { data: design, error: saveError } = await supabase
        .from("generated_designs")
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          prompt: usedPrompt,
          source_image_url: quizData.sourceImageUrl,
          parent_design_id: designId,
        })
        .select()
        .single();

      if (saveError) {
        console.error("Failed to save design:", saveError);
      } else {
        setDesignId(design.id);
      }

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

  const handleModify = () => {
    if (!modificationInput.trim()) return;
    generateDesign(modificationInput);
    setModificationInput("");
  };

  const handleDownload = async () => {
    if (!generatedImage) return;

    try {
      const link = document.createElement("a");
      link.href = generatedImage;
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

  const handleShare = async () => {
    if (!generatedImage) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "My AI Room Design",
          text: "Check out this room design I created!",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied!",
          description: "Share link copied to clipboard",
        });
      }
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleFavorite = async () => {
    if (!designId || !user) return;

    const newFavorite = !isFavorite;
    setIsFavorite(newFavorite);

    const { error } = await supabase
      .from("generated_designs")
      .update({ is_favorite: newFavorite })
      .eq("id", designId);

    if (error) {
      setIsFavorite(!newFavorite);
      toast({
        title: "Error",
        description: "Failed to update favorite",
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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/quiz")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Quiz</span>
          </button>
          <div className="flex items-center gap-2">
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

        {/* Main Content */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            {/* Image Display */}
            <div className="relative aspect-video bg-secondary/30 flex items-center justify-center">
              {generating ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Creating your dream room...</p>
                </div>
              ) : generatedImage ? (
                <img
                  src={generatedImage}
                  alt="Generated room design"
                  className="w-full h-full object-cover"
                />
              ) : (
                <p className="text-muted-foreground">No design yet</p>
              )}
            </div>

            {/* Actions */}
            {generatedImage && !generating && (
              <div className="p-4 border-t border-border/50">
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFavorite}
                    className={isFavorite ? "text-red-500" : ""}
                  >
                    <Heart
                      className="w-4 h-4 mr-2"
                      fill={isFavorite ? "currentColor" : "none"}
                    />
                    {isFavorite ? "Saved" : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateDesign()}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modification Input */}
        {generatedImage && !generating && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
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
                  <Button onClick={handleModify} disabled={!modificationInput.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Generate;
