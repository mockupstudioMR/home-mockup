import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Palette, Upload, Package, ArrowRight, Ruler } from "lucide-react";
import Logo from "@/components/Logo";

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

const Start = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const entryOptions = [
    {
      id: "existing-room",
      icon: <Home className="w-8 h-8" />,
      title: "Start with Your Room",
      description: "Upload a photo of your existing room and we'll redesign it while keeping your space's layout",
      preview: null,
      path: "/existing-room",
      gradient: "from-primary via-primary/70 to-accent/60",
      iconBg: "bg-primary/15 text-primary",
    },
    {
      id: "floor-plan",
      icon: <Ruler className="w-8 h-8" />,
      title: "Start from a Floor Plan",
      description: "Draw your room shape, set dimensions, and get AI-generated furniture layouts tailored to your space",
      preview: null,
      path: "/floor-plan",
      gradient: "from-accent via-accent/70 to-secondary/80",
      iconBg: "bg-accent/25 text-accent-foreground",
    },
    {
      id: "style-tree",
      icon: <Palette className="w-8 h-8" />,
      title: "Explore Design Styles",
      description: "Discover curated interior styles and find the perfect look for your space",
      preview: [modernMinimal, rusticNature, glamLuxe],
      path: "/style-tree",
      gradient: "from-secondary via-primary/50 to-accent/60",
      iconBg: "bg-secondary/40 text-secondary-foreground",
    },
    {
      id: "upload-room",
      icon: <Upload className="w-8 h-8" />,
      title: "Upload Room Images",
      description: "Upload photos of rooms you love and we'll detect the styles to create your moodboard",
      preview: null,
      path: "/analyze-room",
      gradient: "from-primary/60 via-secondary/70 to-accent/50",
      iconBg: "bg-primary/10 text-primary",
    },
    {
      id: "upload-products",
      icon: <Package className="w-8 h-8" />,
      title: "Start with Products",
      description: "Upload furniture or decor items and we'll design a room around them",
      preview: null,
      path: "/analyze-products",
      gradient: "from-accent/70 via-primary/40 to-secondary/60",
      iconBg: "bg-accent/20 text-accent-foreground",
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
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-3 py-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              How would you like to start?
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose your creative journey to design your perfect space
            </p>
          </div>

          {/* Entry Options */}
          <div className="grid gap-6">
            {entryOptions.map((option) => (
              <Card
                key={option.id}
                className="group cursor-pointer border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card hover:border-primary/30 transition-all duration-300"
                onClick={() => navigate(option.path)}
              >
                <CardContent className="p-0 overflow-hidden">
                  <div className="flex items-stretch gap-0">
                    {/* Colored visual rail */}
                    <div
                      className={`relative w-24 md:w-32 shrink-0 bg-gradient-to-br ${option.gradient} flex items-center justify-center`}
                      aria-hidden="true"
                    >
                      <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
                      <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-2xl ${option.iconBg} backdrop-blur-sm flex items-center justify-center shadow-md`}>
                        {option.icon}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 p-6">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors">
                            {option.title}
                          </h3>
                          <p className="text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                        <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                      </div>

                      {/* Style Preview (only for style-tree) */}
                      {option.preview && (
                        <div className="flex gap-3 mt-4 overflow-hidden">
                          {option.preview.map((img, idx) => (
                            <div
                              key={idx}
                              className="w-20 h-20 rounded-lg overflow-hidden border border-border/50 shrink-0"
                            >
                              <img
                                src={img}
                                alt="Style preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          <div className="w-20 h-20 rounded-lg border border-dashed border-border/50 flex items-center justify-center text-muted-foreground text-sm shrink-0">
                            +3 more
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Start;
