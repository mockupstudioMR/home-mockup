import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Sparkles, Sofa, Bed, UtensilsCrossed, Monitor, Bath, LayoutGrid, Utensils, Home as HomeIcon } from "lucide-react";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

const ROOMS = [
  { value: "living-room", label: "Living Room", icon: Sofa },
  { value: "bedroom", label: "Bedroom", icon: Bed },
  { value: "kitchen", label: "Kitchen", icon: UtensilsCrossed },
  { value: "office", label: "Home Office", icon: Monitor },
  { value: "bathroom", label: "Bathroom", icon: Bath },
  { value: "open-space-kitchen-dining-living", label: "Open Space", icon: LayoutGrid },
  { value: "dining-living", label: "Dining + Living", icon: Utensils },
  { value: "studio-apartment", label: "Studio", icon: HomeIcon },
];

const schema = z.object({
  name: z.string().trim().min(1, "Please tell us your name").max(60, "Name is too long"),
  roomType: z.string().min(1, "Pick a room"),
  vision: z.string().trim().max(500, "Keep it under 500 characters").optional(),
});

type Step = 0 | 1 | 2;

const STORAGE_KEY = "get_started_intro";

const GetStarted = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [roomType, setRoomType] = useState("");
  const [vision, setVision] = useState("");
  const [error, setError] = useState<string | null>(null);

  const total = 3;
  const progress = ((step + 1) / total) * 100;

  const next = () => {
    setError(null);
    if (step === 0) {
      const r = schema.shape.name.safeParse(name);
      if (!r.success) { setError(r.error.issues[0].message); return; }
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!roomType) { setError("Pick a room to continue"); return; }
      setStep(2);
      return;
    }
    // Final step
    const result = schema.safeParse({ name, roomType, vision });
    if (!result.success) { setError(result.error.issues[0].message); return; }
    const intro = { ...result.data, createdAt: new Date().toISOString() };
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intro)); } catch { /* ignore */ }
    trackEvent("intro_quiz_complete", "get-started", { roomType });
    navigate("/start", { state: { intro } });
  };

  const back = () => {
    setError(null);
    if (step === 0) { navigate("/"); return; }
    setStep((s) => (s - 1) as Step);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Logo size={32} />
          <span className="font-semibold text-lg tracking-tight text-foreground">HomeMockUp</span>
        </button>
      </header>

      <main className="relative z-10 px-4 pb-16">
        <div className="max-w-xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="uppercase tracking-[0.18em]">Step {step + 1} of {total}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-6 md:p-10 space-y-6">
            {step === 0 && (
              <div className="space-y-5">
                <div className="space-y-2 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    Welcome
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">What should we call you?</h1>
                  <p className="text-sm text-muted-foreground">A first name is enough — we'll personalize your experience.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") next(); }}
                    placeholder="e.g. Alex"
                    maxLength={60}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-2 text-center">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {name ? `Nice to meet you, ${name.split(/\s+/)[0]}.` : "Which room first?"}
                  </h1>
                  <p className="text-sm text-muted-foreground">Which room would you like to start with?</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {ROOMS.map((r) => {
                    const Icon = r.icon;
                    const selected = roomType === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRoomType(r.value)}
                        className={cn(
                          "relative aspect-square rounded-xl border p-3 flex flex-col items-center justify-center gap-2 text-center transition-all",
                          selected
                            ? "border-primary bg-primary/10 text-primary shadow-sm"
                            : "border-border/60 hover:border-primary/40 hover:bg-accent/30 text-foreground/80",
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[11px] leading-tight font-medium">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="space-y-2 text-center">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">What do you have in mind?</h1>
                  <p className="text-sm text-muted-foreground">
                    A mood, a color, a vibe, a Pinterest description — anything goes. Or skip and explore.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vision">Your vision (optional)</Label>
                  <Textarea
                    id="vision"
                    autoFocus
                    value={vision}
                    onChange={(e) => setVision(e.target.value)}
                    placeholder="e.g. warm minimalist with natural wood and soft greens"
                    rows={4}
                    maxLength={500}
                  />
                  <div className="text-right text-[10px] text-muted-foreground">{vision.length}/500</div>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={back}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={next} className="bg-primary hover:bg-primary/90">
                {step === 2 ? "Let's go" : "Continue"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GetStarted;