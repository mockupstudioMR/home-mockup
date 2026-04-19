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
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <div className="text-center space-y-3 py-8 md:py-12">
            <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Start your journey
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              How would you like to begin?
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
              Pick the path that matches what you have today
            </p>
          </div>

          {/* Hero option (first) */}
          {(() => {
            const hero = entryOptions[0];
            return (
              <button
                onClick={() => navigate(hero.path)}
                className="group relative block w-full mb-6 rounded-2xl overflow-hidden border border-border/50 bg-card shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500 text-left"
              >
                <div className="grid md:grid-cols-2 items-stretch min-h-[280px] md:min-h-[340px]">
                  <div className={`relative overflow-hidden bg-gradient-to-br ${hero.gradient} order-1 md:order-2`}>
                    {hero.visual && (
                      <img
                        src={hero.visual}
                        alt={hero.visualAlt}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-card/80 via-card/0 to-transparent md:block hidden" aria-hidden="true" />
                  </div>
                  <div className="relative p-6 md:p-10 flex flex-col justify-center order-2 md:order-1">
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${hero.iconBg} flex items-center justify-center shadow-md mb-4`}>
                      {hero.icon}
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-primary font-medium mb-2">
                      Most popular
                    </p>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 group-hover:text-primary transition-colors">
                      {hero.title}
                    </h2>
                    <p className="text-muted-foreground md:text-lg leading-relaxed mb-5 max-w-md">
                      {hero.description}
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      Get started
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })()}

          {/* Grid of remaining options */}
          <div className="grid md:grid-cols-2 gap-6">
            {entryOptions.slice(1).map((option) => (
              <button
                key={option.id}
                onClick={() => navigate(option.path)}
                className="group relative block rounded-2xl overflow-hidden border border-border/50 bg-card shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500 text-left"
              >
                {/* Visual */}
                <div className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${option.gradient}`}>
                  {option.visual ? (
                    <img
                      src={option.visual}
                      alt={option.visualAlt}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : option.preview ? (
                    <div className="absolute inset-0 grid grid-cols-3 gap-1 p-1">
                      {option.preview.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ))}
                    </div>
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/10 to-transparent" aria-hidden="true" />
                  <div className={`absolute top-4 left-4 w-11 h-11 rounded-xl ${option.iconBg} backdrop-blur-md flex items-center justify-center shadow-lg`}>
                    {option.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 md:p-6">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-lg md:text-xl font-semibold tracking-tight group-hover:text-primary transition-colors">
                      {option.title}
                    </h3>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Start;
