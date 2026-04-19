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
      visual: null,
      visualAlt: "",
      preview: [modernMinimal, rusticNature, glamLuxe],
      path: "/style-tree",
      gradient: "from-secondary/40 to-primary/30",
      iconBg: "bg-background/90 text-secondary-foreground",
    },
    {
      id: "upload-room",
      icon: <Upload className="w-7 h-7" />,
      title: "Upload Room Images",
      description: "Upload photos of rooms you love and we'll detect the styles to create your moodboard",
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
                    {/* Visual rail — photo or style collage */}
                    <div
                      className={`relative w-28 md:w-44 shrink-0 bg-gradient-to-br ${option.gradient} overflow-hidden flex items-center justify-center`}
                    >
                      {option.visual ? (
                        <img
                          src={option.visual}
                          alt={option.visualAlt}
                          loading="lazy"
                          width={512}
                          height={512}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : option.preview ? (
                        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5 p-0.5">
                          {option.preview.slice(0, 3).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt=""
                              loading="lazy"
                              className={`w-full h-full object-cover ${idx === 0 ? "row-span-2" : ""}`}
                            />
                          ))}
                          <div className="w-full h-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-[10px] md:text-xs font-medium text-muted-foreground">
                            +more
                          </div>
                        </div>
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-tr from-background/30 via-transparent to-transparent" aria-hidden="true" />
                      <div className={`relative z-10 w-12 h-12 md:w-14 md:h-14 rounded-2xl ${option.iconBg} backdrop-blur-md flex items-center justify-center shadow-lg`}>
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
