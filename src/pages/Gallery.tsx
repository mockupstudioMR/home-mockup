import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Trash2,
  Heart,
  Home,
  Plus,
  Loader2,
  Play,
} from "lucide-react";

interface Design {
  id: string;
  image_url: string;
  prompt: string;
  is_favorite: boolean;
  created_at: string;
  quiz_response_id: string | null;
}

const Gallery = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [designs, setDesigns] = useState<Design[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(true);
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [resumingId, setResumingId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchDesigns();
    }
  }, [user, loading, navigate]);

  const fetchDesigns = async () => {
    try {
      const { data, error } = await supabase
        .from("generated_designs")
        .select("id, image_url, prompt, is_favorite, is_locked, created_at, quiz_response_id")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setDesigns(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load designs",
        variant: "destructive",
      });
    } finally {
      setLoadingDesigns(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("generated_designs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setDesigns((prev) => prev.filter((d) => d.id !== id));
      toast({
        title: "Deleted",
        description: "Design removed from gallery",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete design",
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorite = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("generated_designs")
        .update({ is_favorite: !currentValue })
        .eq("id", id);

      if (error) throw error;

      setDesigns((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, is_favorite: !currentValue } : d
        )
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `room-design-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleContinueDesign = async (design: Design) => {
    setResumingId(design.id);
    try {
      // Clear existing generate caches so the page loads from DB
      const generateKeys = [
        'generate_design_cache',
        'generate_products_cache',
        'generate_highlights_cache',
        'generate_styleprofile_cache',
        'generate_items_cache',
        'generate_description_cache',
        'generate_history_cache',
        'generate_extracting_cache',
        'generate_debug_steps_cache',
        'generate_debug_prompt_cache',
        'generate_quiz_hash',
        'generate_quiz_nonce',
        'generate_image_history_stack',
      ];
      generateKeys.forEach((key) => sessionStorage.removeItem(key));

      if (design.quiz_response_id) {
        // Fetch the quiz response to restore context
        const { data: quizResponse } = await supabase
          .from("quiz_responses")
          .select("*")
          .eq("id", design.quiz_response_id)
          .single();

        if (quizResponse) {
          const quizData = {
            stylePreference: quizResponse.style_preference,
            colorPalette: quizResponse.color_palette,
            roomType: quizResponse.room_type,
            budgetFeel: quizResponse.budget_feel,
            mustHaveElements: quizResponse.must_have_elements || [],
            furnitureSource: (quizResponse.furniture_source as "shop_only" | "open") || "open",
          };

          sessionStorage.setItem('generate_quiz_response_id', design.quiz_response_id);
          sessionStorage.setItem('quiz_data_cache', JSON.stringify(quizData));

          const quizHash = JSON.stringify({
            stylePreference: quizData.stylePreference,
            colorPalette: quizData.colorPalette,
            roomType: quizData.roomType,
            budgetFeel: quizData.budgetFeel,
            mustHaveElements: quizData.mustHaveElements,
            furnitureSource: quizData.furnitureSource,
          });
          sessionStorage.setItem('generate_quiz_hash', quizHash + '|');

          navigate("/generate", { state: { quizData } });
          return;
        }
      }

      // No quiz data — navigate with resumeDesignId so Generate loads the design directly
      navigate("/generate", { state: { resumeDesignId: design.id } });
    } catch (err) {
      console.error("Error resuming design:", err);
      toast({
        title: "Error",
        description: "Failed to resume design",
        variant: "destructive",
      });
    } finally {
      setResumingId(null);
    }
  };

  const filteredDesigns =
    filter === "favorites"
      ? designs.filter((d) => d.is_favorite)
      : designs;

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

      <div className="max-w-6xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-bold">My HomeMockUps</h1>
          </div>
          <Button onClick={() => navigate("/quiz")}>
            <Plus className="w-4 h-4 mr-2" />
            New Design
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({designs.length})
          </Button>
          <Button
            variant={filter === "favorites" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("favorites")}
          >
            <Heart className="w-4 h-4 mr-2" />
            Favorites ({designs.filter((d) => d.is_favorite).length})
          </Button>
        </div>

        {/* Gallery Grid */}
        {loadingDesigns ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredDesigns.length === 0 ? (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-20 text-center">
              <p className="text-muted-foreground mb-4">
                {filter === "favorites"
                  ? "No favorite designs yet"
                  : "No designs yet"}
              </p>
              <Button onClick={() => navigate("/quiz")}>
                Create Your First Design
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDesigns.map((design) => (
              <Card
                key={design.id}
                className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden group"
              >
                <div className="relative aspect-video">
                  <img
                    src={design.image_url}
                    alt="Room design"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleContinueDesign(design)}
                      disabled={resumingId === design.id}
                      title="Continue working on this design"
                    >
                      {resumingId === design.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleDownload(design.image_url)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() =>
                        handleToggleFavorite(design.id, design.is_favorite)
                      }
                      className={design.is_favorite ? "text-red-500" : ""}
                    >
                      <Heart
                        className="w-4 h-4"
                        fill={design.is_favorite ? "currentColor" : "none"}
                      />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleDelete(design.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {design.prompt}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      {new Date(design.created_at).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => handleContinueDesign(design)}
                      disabled={resumingId === design.id}
                      className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    >
                      {resumingId === design.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                      Continue
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
