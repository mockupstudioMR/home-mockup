import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Palette, Upload, Package, ArrowRight, Ruler } from "lucide-react";
import Logo from "@/components/Logo";
import { trackEvent } from "@/lib/analytics";
import IntentStep from "@/components/quiz/steps/IntentStep";
import { Card, CardContent } from "@/components/ui/card";

// Style moodboard images
import classicHistorical from "@/assets/styles/classic-historical.png";
import modernMinimal from "@/assets/styles/modern-minimal.png";
import rusticNature from "@/assets/styles/rustic-nature.png";
import mediterranean from "@/assets/styles/mediterranean.png";
import bohemianEclectic from "@/assets/styles/bohemian-eclectic.png";
import glamLuxe from "@/assets/styles/glam-luxe.png";

// Starting-point visuals
import existingRoomVisual from "@/assets/start/existing-room.jpg";
import floorPlanVisual from "@/assets/start/floor-plan.jpg";
import uploadRoomVisual from "@/assets/start/upload-room.jpg";
import uploadProductsVisual from "@/assets/start/upload-products.jpg";
import exploreStylesVisual from "@/assets/start/explore-styles.jpg";


const Start = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  const intro = useMemo(() => {
    const fromState = (location.state as { intro?: { name?: string; roomType?: string; vision?: string } } | null)?.intro;
    if (fromState) return fromState;
    try {
      const raw = sessionStorage.getItem("get_started_intro");
      return raw ? JSON.parse(raw) as { name?: string; roomType?: string; vision?: string } : null;
    } catch { return null; }
  }, [location.state]);
  const firstName = intro?.name?.split(/\s+/)[0];

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const entryOptions = [
    {
      id: "existing-room",
      icon: <Home className="w-7 h-7" />,
      title: "Start with Your Room",
      description: "Upload a photo of your existing room and we'll redesign it while keeping your space's layout",
      visual: existingRoomVisual,
      visualAlt: "Photo of an existing living room ready to be redesigned",
      preview: null,
      path: "/existing-room",
      gradient: "from-primary/40 to-accent/30",
      iconBg: "bg-background/90 text-primary",
    },
    {
      id: "floor-plan",
      icon: <Ruler className="w-7 h-7" />,
      title: "Start from a Floor Plan",
      description: "Draw your room shape, set dimensions, and get AI-generated furniture layouts tailored to your space",
      visual: floorPlanVisual,
      visualAlt: "Top-down floor plan illustration",
      preview: null,
      path: "/floor-plan",
      gradient: "from-accent/40 to-secondary/40",
      iconBg: "bg-background/90 text-accent-foreground",
    },
    {
      id: "style-tree",
      icon: <Palette className="w-7 h-7" />,
      title: "Explore Design Styles",
      description: "Discover curated interior styles and find the perfect look for your space",
      visual: exploreStylesVisual,
      visualAlt: "Editorial collage of multiple interior design styles",
      preview: null,
      path: "/style-tree",
      gradient: "from-secondary/40 to-primary/30",
      iconBg: "bg-background/90 text-secondary-foreground",
    },
    {
      id: "upload-room",
      icon: <Upload className="w-7 h-7" />,
      title: "Show Us Your Inspiration",
      description: "Upload photos of rooms you love and we'll detect the styles to build your personal moodboard",
      visual: uploadRoomVisual,
      visualAlt: "Moodboard collage of inspiration room photos",
      preview: null,
      path: "/analyze-room",
      gradient: "from-primary/30 to-secondary/40",
      iconBg: "bg-background/90 text-primary",
    },
    {
      id: "upload-products",
      icon: <Package className="w-7 h-7" />,
      title: "Start with Products",
      description: "Upload furniture or decor items and we'll design a room around them",
      visual: uploadProductsVisual,
      visualAlt: "Flat-lay of furniture and decor products",
      preview: null,
      path: "/analyze-products",
      gradient: "from-accent/30 to-primary/30",
      iconBg: "bg-background/90 text-accent-foreground",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

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
          onClick={() => navigate("/")}
          className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Logo size={32} />
          <span className="font-semibold text-lg tracking-tight text-foreground">HomeMockUp</span>
        </button>
        <button
          onClick={() => navigate("/my-stats")}
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          My Stats
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center space-y-3 py-8 md:py-12">
            <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-muted-foreground">
              {firstName ? `Welcome, ${firstName}` : "Start your journey"}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              How would you like to begin?
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
              {intro?.vision
                ? `We've got your vision in mind — pick the path that matches what you have today.`
                : `Pick the path that matches what you have today`}
            </p>
          </div>

          {/* Intent question — only for the "designing my home" path */}
          <div className="max-w-2xl mx-auto mb-10">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <IntentStep />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Start;
