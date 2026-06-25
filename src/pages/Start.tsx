import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Palette, Upload, Package, ArrowRight, Ruler, Sparkles, Briefcase } from "lucide-react";
import Logo from "@/components/Logo";

import { useQuiz } from "@/contexts/QuizContext";
import { Card, CardContent } from "@/components/ui/card";
import { trackEvent } from "@/lib/analytics";
import GroundYourSpace, { type GroundData } from "@/components/start/GroundYourSpace";
import CaptureVision, { type VisionData } from "@/components/start/CaptureVision";
import IntentStep from "@/components/quiz/steps/IntentStep";

import existingRoomVisual from "@/assets/start/existing-room.jpg";
import floorPlanVisual from "@/assets/start/floor-plan.jpg";
import uploadRoomVisual from "@/assets/start/upload-room.jpg";
import uploadProductsVisual from "@/assets/start/upload-products.jpg";
import exploreStylesVisual from "@/assets/start/explore-styles.jpg";

const Start = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { quizData, updateQuizData } = useQuiz();
  const isPro = new URLSearchParams(location.search).get("as") === "pro";
  const [freshStage, setFreshStage] = useState<"path" | "intent" | "ground" | "vision" | "paths">("path");
  const [groundStep, setGroundStep] = useState<string>("property");

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

  useEffect(() => {
    if (quizData.intent && freshStage === "intent") {
      setFreshStage("ground");
    }
  }, [quizData.intent, freshStage]);

  const entryOptions = [
    {
      id: "existing-room",
      icon: <Home className="w-7 h-7" />,
      title: "Start with Your Room",
      description: "Upload a photo of your existing room and we'll redesign it while keeping your space's layout",
      visual: existingRoomVisual,
      visualAlt: "Photo of an existing living room ready to be redesigned",
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
              {freshStage === "path"
                ? "Who are you?"
                : freshStage === "intent"
                ? "What's brought you here?"
                : freshStage === "ground"
                ? groundStep === "property"
                  ? "What kind of place?"
                  : groundStep === "rooms"
                  ? "Which rooms are on your list?"
                  : groundStep === "state"
                  ? "What's the state of the place?"
                  : "Where do you want to start?"
                : freshStage === "vision"
                ? "Capture the vision"
                : "Let's get started"}
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
              {freshStage === "path"
                ? `Choose the experience that fits you best.`
                : freshStage === "intent"
                ? `Select what matches your situation.`
                : freshStage === "ground"
                ? groundStep === "property"
                  ? "Choose the type of property you're working with."
                  : groundStep === "rooms"
                  ? "Select all the spaces you want to design."
                  : groundStep === "state"
                  ? "Tell us where you're starting from."
                  : "Pick one room to begin with — you can do the rest later."
                : freshStage === "vision"
                ? "How would you like to share your style?"
                : `A few quick questions so we can tailor everything to you.`}
            </p>
          </div>

          {!isPro ? (
            <div className="max-w-3xl mx-auto">
              {freshStage === "path" ? (
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto -mx-4 md:-mx-16">
                   <button
                     onClick={() => {
                       updateQuizData({ intent: undefined });
                       setFreshStage("intent");
                     }}
                    className="group relative block rounded-2xl overflow-hidden border border-border/50 bg-card shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500 text-left p-8 md:p-10 min-h-[280px] flex flex-col justify-between bg-gradient-to-br from-primary/30 to-secondary/30"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-background/90 text-primary flex items-center justify-center shadow-md mb-6">
                      <Home className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 group-hover:text-primary transition-colors">
                        I'm designing my home
                      </h2>
                      <p className="text-muted-foreground leading-relaxed mb-5">
                        Redesign your space, explore styles, and bring your vision to life.
                      </p>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        Continue
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate("/start?as=pro", { replace: true })}
                    className="group relative block rounded-2xl overflow-hidden border border-border/50 bg-card shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500 text-left p-8 md:p-10 min-h-[280px] flex flex-col justify-between bg-gradient-to-br from-accent/30 to-primary/20"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-background/90 text-primary flex items-center justify-center shadow-md mb-6">
                      <Briefcase className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 group-hover:text-primary transition-colors">
                        I'm a professional
                      </h2>
                      <p className="text-muted-foreground leading-relaxed mb-5">
                        Furniture shops, designers & real estate — grow your business with AI tools.
                      </p>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        Continue
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </button>
                </div>
              ) : freshStage === "intent" ? (
                <IntentStep />
              ) : freshStage === "ground" ? (
                <GroundYourSpace
                  onBack={() => setFreshStage("intent")}
                  onComplete={(data: GroundData) => {
                    updateQuizData({ roomType: data.startRoom });
                    try {
                      sessionStorage.setItem("ground_your_space", JSON.stringify(data));
                    } catch { /* ignore */ }
                    setFreshStage("vision");
                  }}
                  onStepChange={setGroundStep}
                />
              ) : freshStage === "vision" ? (
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm max-w-2xl mx-auto">
                  <CardContent className="p-6">
                    <CaptureVision
                      onBack={() => setFreshStage("ground")}
                      onComplete={(data: VisionData) => {
                        try {
                          sessionStorage.setItem("capture_vision", JSON.stringify(data));
                        } catch { /* ignore */ }
                        trackEvent("journey_start", `vision-${data.mode}`, { from: "start-fresh" });
                        if (data.mode === "upload") {
                          navigate("/analyze-room");
                        } else if (data.mode === "discover") {
                          navigate("/style-tree");
                        } else if (data.mode === "floor-plan") {
                          navigate("/floor-plan");
                        } else {
                          navigate("/analyze-room", { state: { prompt: data.prompt } });
                        }
                      }}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div>
                  <button
                    onClick={() => setFreshStage("vision")}
                    className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1"
                  >
                    ← Back
                  </button>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Where would you like to start?</h2>
                    <p className="text-muted-foreground mt-2">Pick what you have in mind</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                  {[
                    {
                      id: "floor-plan",
                      icon: <Ruler className="w-6 h-6" />,
                      title: "Floor Plan",
                      description: "Draw your room shape and get AI-generated layouts",
                      path: "/floor-plan",
                    },
                    {
                      id: "inspiration",
                      icon: <Sparkles className="w-6 h-6" />,
                      title: "Inspiration",
                      description: "Explore styles and build a vision for your space",
                      path: "/analyze-room",
                    },
                    {
                      id: "include-products",
                      icon: <Package className="w-6 h-6" />,
                      title: "Stuff I want to include",
                      description: "Upload furniture or decor and design a room around it",
                      path: "/analyze-products",
                    },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        trackEvent("journey_start", option.id, { from: "start-fresh", path: option.path });
                        navigate(option.path);
                      }}
                      className="group rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300 p-5 text-left flex flex-col gap-3"
                    >
                      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        {option.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold tracking-tight group-hover:text-primary transition-colors mb-1">
                          {option.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {option.description}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground/80 group-hover:text-primary transition-colors mt-auto">
                        Continue
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Hero option (first) */}
              {(() => {
                const hero = entryOptions[0];
                return (
                  <button
                    onClick={() => {
                      trackEvent("journey_start", hero.id, { from: "start", path: hero.path });
                      navigate(hero.path);
                    }}
                    className="group relative block w-full mb-6 rounded-2xl overflow-hidden border border-border/50 bg-card shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500 text-left"
                  >
                    <div className="grid md:grid-cols-2 items-stretch min-h-[280px] md:min-h-[340px]">
                      <div className={`relative overflow-hidden bg-gradient-to-br ${hero.gradient} order-1 md:order-2`}>
                        <img
                          src={hero.visual}
                          alt={hero.visualAlt}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
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

              <div className="grid md:grid-cols-2 gap-6">
                {entryOptions.slice(1).map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      trackEvent("journey_start", option.id, { from: "start", path: option.path });
                      navigate(option.path);
                    }}
                    className="group relative block rounded-2xl overflow-hidden border border-border/50 bg-card shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-500 text-left"
                  >
                    <div className={`relative aspect-[16/10] overflow-hidden bg-gradient-to-br ${option.gradient}`}>
                      <img
                        src={option.visual}
                        alt={option.visualAlt}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/10 to-transparent" aria-hidden="true" />
                      <div className={`absolute top-4 left-4 w-11 h-11 rounded-xl ${option.iconBg} backdrop-blur-md flex items-center justify-center shadow-lg`}>
                        {option.icon}
                      </div>
                    </div>
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
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Start;
