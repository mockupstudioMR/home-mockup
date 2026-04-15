import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Upload, Link2, Sparkles, ShoppingBag, MessageSquare,
  ArrowRight, Star, TrendingUp, Globe, Users, Check,
  Image as ImageIcon, ExternalLink, Play, RotateCcw,
  DollarSign, Eye, Heart
} from "lucide-react";
import { cn } from "@/lib/utils";

import styleModern from "@/assets/b2b/style-modern-minimal.jpg";
import styleScandi from "@/assets/b2b/style-scandinavian.jpg";
import styleContemporary from "@/assets/b2b/style-contemporary.jpg";
import styleBoho from "@/assets/b2b/style-boho.jpg";
import styleLuxury from "@/assets/b2b/style-luxury.jpg";


const TOTAL_STEPS = 9;

const styleOptions = [
  { value: "modern_minimal", label: "Modern Minimal", image: styleModern },
  { value: "scandinavian", label: "Scandinavian", image: styleScandi },
  { value: "contemporary", label: "Contemporary Comfort", image: styleContemporary },
  { value: "boho", label: "Boho Natural", image: styleBoho },
  { value: "luxury", label: "Luxury Modern", image: styleLuxury },
];

const goalOptions = [
  { value: "sales", label: "More sales", icon: <TrendingUp className="w-5 h-5" /> },
  { value: "presence", label: "Better online presence", icon: <Globe className="w-5 h-5" /> },
  { value: "engagement", label: "More engagement", icon: <Users className="w-5 h-5" /> },
];

const goalResults: Record<string, {
  headline: string;
  subtitle: string;
  chatMessage: string;
  shoppingList: { name: string; price: string; tagPos: { top: string; left: string } }[];
  metrics: { icon: React.ReactNode; label: string; value: string }[];
  tip: string;
}> = {
  sales: {
    headline: "Turn browsers into buyers",
    subtitle: "Customers who visualize products in their space are 3× more likely to purchase",
    chatMessage: "Love how that sofa looks here! I found matching throw pillows and a coffee table from your store — want me to add them to your cart?",
    shoppingList: [
      { name: "Modern Sofa", price: "$1,299", tagPos: { top: "68%", left: "22%" } },
      { name: "Accent Pillows (×2)", price: "$189", tagPos: { top: "62%", left: "32%" } },
      { name: "Wooden Coffee Table", price: "$449", tagPos: { top: "74%", left: "42%" } },
    ],
    metrics: [
      { icon: <DollarSign className="w-4 h-4" />, label: "Avg. order value", value: "+40%" },
      { icon: <ShoppingBag className="w-4 h-4" />, label: "Conversion rate", value: "3.2×" },
      { icon: <TrendingUp className="w-4 h-4" />, label: "Return rate drop", value: "-25%" },
    ],
    tip: "AI-driven product placement increases add-to-cart rates by showing items in context, not isolation.",
  },
  presence: {
    headline: "Stand out from every competitor",
    subtitle: "An AI showroom makes your brand feel premium, modern, and unforgettable",
    chatMessage: "Welcome to your personalized showroom! I've curated this living room around your best-selling sofa and accent chair.",
    shoppingList: [
      { name: "Lounge Chair", price: "$899", tagPos: { top: "60%", left: "72%" } },
      { name: "Area Rug", price: "$596", tagPos: { top: "82%", left: "45%" } },
      { name: "TV Console", price: "$349", tagPos: { top: "55%", left: "82%" } },
    ],
    metrics: [
      { icon: <Eye className="w-4 h-4" />, label: "Time on site", value: "+65%" },
      { icon: <Globe className="w-4 h-4" />, label: "SEO boost", value: "+30%" },
      { icon: <Star className="w-4 h-4" />, label: "Brand recall", value: "2.4×" },
    ],
    tip: "Interactive experiences generate shareable moments — customers talk about brands that feel innovative.",
  },
  engagement: {
    headline: "Keep customers coming back",
    subtitle: "Interactive design tools create sticky experiences that build loyalty",
    chatMessage: "You've saved 3 rooms so far! Your coffee table pairs beautifully with this accent chair — try it out?",
    shoppingList: [
      { name: "Coffee Table", price: "$899", tagPos: { top: "74%", left: "42%" } },
      { name: "Accent Chair", price: "$579", tagPos: { top: "60%", left: "72%" } },
      { name: "Decorative Vase", price: "$129", tagPos: { top: "70%", left: "50%" } },
    ],
    metrics: [
      { icon: <Heart className="w-4 h-4" />, label: "Return visits", value: "+80%" },
      { icon: <Users className="w-4 h-4" />, label: "Session duration", value: "4.5 min" },
      { icon: <MessageSquare className="w-4 h-4" />, label: "Interactions/visit", value: "12+" },
    ],
    tip: "Gamified room design keeps users engaged — each saved room is a reason to return.",
  },
};

const loadingMessages = [
  "Designing your showroom…",
  "Matching your products…",
  "Preparing shopping experience…",
];

const B2BOnboardingFlow = () => {
  const [step, setStep] = useState(0);
  const [startMode, setStartMode] = useState<"upload" | "demo" | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);

  useEffect(() => {
    if (step !== 5) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => {
        if (prev < loadingMessages.length - 1) return prev + 1;
        setTimeout(() => setStep(6), 800);
        clearInterval(interval);
        return prev;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (selectedStyle && step === 3) {
      const timer = setTimeout(() => setStep(4), 600);
      return () => clearTimeout(timer);
    }
  }, [selectedStyle, step]);

  useEffect(() => {
    if (selectedGoal && step === 4) {
      const timer = setTimeout(() => {
        setStep(5);
        setLoadingMsgIndex(0);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [selectedGoal, step]);

  const reset = () => {
    setStep(0);
    setStartMode(null);
    setSelectedStyle(null);
    setSelectedGoal(null);
    setLoadingMsgIndex(0);
    setUploadedCount(0);
  };

  const goalData = selectedGoal ? goalResults[selectedGoal] : goalResults.sales;
  const selectedStyleData = styleOptions.find(s => s.value === selectedStyle);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {step >= 2 && step <= 4 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Step {step - 1} of 4</span>
            <span>{Math.round(((step - 1) / 4) * 100)}%</span>
          </div>
          <Progress value={((step - 1) / 4) * 100} className="h-1.5" />
        </div>
      )}

      {/* SCREEN 1 — Hook */}
      {step === 0 && (
        <div className="text-center space-y-6 animate-in fade-in duration-500">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            60-second setup
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            Your store, redesigned.<br />Ready in seconds.
          </h2>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Let your customers design their home using your products
          </p>
          {/* Preview grid of styles */}
          <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
            {styleOptions.map((s) => (
              <div key={s.value} className="aspect-square rounded-lg overflow-hidden">
                <img src={s.image} alt={s.label} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
          <Button size="lg" onClick={() => setStep(1)} className="text-lg px-8 gap-2">
            <Play className="w-5 h-5" />
            Start Free Demo
          </Button>
        </div>
      )}

      {/* SCREEN 2 — Start Mode */}
      {step === 1 && (
        <div className="text-center space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            How do you want to start?
          </h2>
          <div className="grid gap-4 max-w-md mx-auto">
            <button
              onClick={() => { setStartMode("upload"); setStep(2); }}
              className="relative flex items-center gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-primary/50 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Upload className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  Upload products
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/30 text-secondary-foreground">recommended ⭐</span>
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">Use your own product images</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
            <button
              onClick={() => { setStartMode("demo"); setStep(3); }}
              className="flex items-center gap-4 p-5 rounded-xl border-2 border-border bg-card hover:border-primary/50 transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center text-accent-foreground shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Quick demo</p>
                <p className="text-sm text-muted-foreground mt-0.5">No upload needed — see it in action</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 3 — Product Input */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-400">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Add your products</h2>
            <p className="text-muted-foreground">We'll place your products inside a styled room</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4 max-w-xl mx-auto">
            <button
              onClick={() => setUploadedCount(Math.min(uploadedCount + 1, 5))}
              className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <ImageIcon className="w-10 h-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-foreground">Upload images</p>
                <p className="text-xs text-muted-foreground mt-1">Up to 5 product photos</p>
              </div>
              {uploadedCount > 0 && (
                <span className="text-sm text-primary font-medium">{uploadedCount}/5 uploaded</span>
              )}
            </button>
            <button
              onClick={() => setUploadedCount(Math.min(uploadedCount + 2, 5))}
              className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <Link2 className="w-10 h-10 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-foreground">Paste product links</p>
                <p className="text-xs text-muted-foreground mt-1">We'll grab the images for you</p>
              </div>
            </button>
          </div>
          <div className="text-center">
            <Button onClick={() => setStep(3)} disabled={uploadedCount === 0 && startMode === "upload"} className="gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
            {startMode === "upload" && uploadedCount === 0 && (
              <p className="text-xs text-muted-foreground mt-2">Click an area above to simulate adding products</p>
            )}
          </div>
        </div>
      )}

      {/* SCREEN 4 — Style Pick with real images */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-400">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Pick a style</h2>
            <p className="text-muted-foreground">Your products will be placed in a room that matches this aesthetic — so customers see them in context, not in isolation</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 max-w-lg mx-auto">
            <p className="text-xs text-muted-foreground text-center">
              <span className="font-semibold text-primary">💡 Why this matters:</span> Styled product placement increases purchase intent by up to 3× — buyers need to imagine it in their space.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-xl mx-auto">
            {styleOptions.map((style) => (
              <button
                key={style.value}
                onClick={() => setSelectedStyle(style.value)}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-xl border-2 transition-all overflow-hidden",
                  selectedStyle === style.value
                    ? "border-primary scale-[1.02] shadow-md"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <div className="w-full aspect-[4/3] overflow-hidden">
                  <img
                    src={style.image}
                    alt={style.label}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <span className="font-medium text-sm text-foreground pb-3">{style.label}</span>
                {selectedStyle === style.value && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SCREEN 5 — One Smart Question */}
      {step === 4 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-400">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">What do you want more of?</h2>
            <p className="text-muted-foreground">Just one question — almost done!</p>
          </div>
          <div className="grid gap-3 max-w-sm mx-auto">
            {goalOptions.map((goal) => (
              <button
                key={goal.value}
                onClick={() => setSelectedGoal(goal.value)}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                  selectedGoal === goal.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  selectedGoal === goal.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {goal.icon}
                </div>
                <span className="font-medium text-foreground">{goal.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SCREEN 6 — Magic Loading */}
      {step === 5 && (
        <div className="text-center space-y-8 py-8 animate-in fade-in duration-500">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary" />
          </div>
          <div className="space-y-3">
            {loadingMessages.map((msg, i) => (
              <p
                key={i}
                className={cn(
                  "text-lg transition-all duration-500",
                  i <= loadingMsgIndex
                    ? "text-foreground opacity-100 translate-y-0"
                    : "text-muted-foreground/30 opacity-0 translate-y-2"
                )}
              >
                {i < loadingMsgIndex && <Check className="w-4 h-4 inline mr-2 text-accent" />}
                {i === loadingMsgIndex && <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse mr-2 align-middle" />}
                {msg}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* SCREEN 7 — Result (goal-personalized) */}
      {step === 6 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              This is how customers could shop your store
            </h2>
            <p className="text-muted-foreground text-lg">{goalData.subtitle}</p>
          </div>

          <Card className="overflow-hidden border-border/50">
            <div className="grid md:grid-cols-2">
              {/* Room preview with real image */}
              <div className="relative group">
                <img
                  src={selectedStyleData?.image || styleModern}
                  alt="AI Generated Room Preview"
                  className="w-full h-full object-cover min-h-[240px]"
                />
                {/* Product tags on image */}
                {goalData.shoppingList.map((item, i) => (
                  <div
                    key={i}
                    className="absolute flex items-center gap-1 animate-in fade-in zoom-in duration-500"
                    style={{ top: item.tagPos.top, left: item.tagPos.left, animationDelay: `${i * 200}ms`, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="relative">
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-lg cursor-pointer ring-2 ring-white/80">
                        {i + 1}
                      </div>
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-1 rounded-md bg-card/95 backdrop-blur shadow-lg border border-border/50 text-[11px] font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {item.name} <span className="text-primary font-bold">{item.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-card/80 backdrop-blur text-xs font-medium text-foreground">
                  Live Preview
                </div>
                <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-lg bg-card/90 backdrop-blur-sm">
                  <p className="text-xs font-medium text-primary">{goalData.headline}</p>
                </div>
              </div>

              {/* Interactive elements */}
              <div className="p-5 space-y-4">
                {/* Chat preview — personalized by goal */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <MessageSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">AI Shopping Assistant</p>
                    <p className="text-muted-foreground text-xs mt-1">"{goalData.chatMessage}"</p>
                  </div>
                </div>

                {/* Goal-specific metrics */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expected Impact</p>
                  {goalData.metrics.map((metric, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-md bg-card border border-border/50 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-primary">{metric.icon}</span>
                        <span className="text-muted-foreground">{metric.label}</span>
                      </div>
                      <span className="font-bold text-primary">{metric.value}</span>
                    </div>
                  ))}
                </div>

                {/* Shopping list */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Shopping List</p>
                  {goalData.shoppingList.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-card border border-border/50 text-sm">
                      <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-foreground flex-1">{item.name}</span>
                      <span className="text-primary font-semibold">{item.price}</span>
                    </div>
                  ))}
                </div>

                {/* Pro tip */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-primary">💡 Pro tip:</span> {goalData.tip}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="gap-2 text-base" onClick={() => setStep(7)}>
              <ExternalLink className="w-5 h-5" />
              Get this on my website
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-base" onClick={reset}>
              <RotateCcw className="w-5 h-5" />
              Create another demo
            </Button>
          </div>
        </div>
      )}

      {/* UPGRADE SCREEN */}
      {step === 7 && (
        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Star className="w-4 h-4" />
            Unlock the full experience
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Turn this into a real shopping experience
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Give your customers the future of furniture shopping
          </p>
          <div className="grid gap-3 max-w-sm mx-auto text-left">
            {["Remove watermark", "Add your full catalog", "Embed on your website", "AI-powered customer chat", "Analytics dashboard"].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground font-medium text-sm">{feature}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button size="lg" className="gap-2 text-base">
              Upgrade Now <ArrowRight className="w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-base">Book a Demo</Button>
          </div>
          <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Start over</button>
        </div>
      )}
    </div>
  );
};

export default B2BOnboardingFlow;
