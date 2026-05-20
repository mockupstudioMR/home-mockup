import { useState } from "react";
import { Upload, Sparkles, Palette, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type VisionData =
  | { mode: "upload" }
  | { mode: "describe"; prompt: string }
  | { mode: "discover" };

interface Props {
  onBack: () => void;
  onComplete: (data: VisionData) => void;
}

const CaptureVision = ({ onBack, onComplete }: Props) => {
  const [mode, setMode] = useState<"choose" | "describe">("choose");
  const [prompt, setPrompt] = useState("");

  const options = [
    {
      id: "upload" as const,
      icon: <Upload className="w-5 h-5" />,
      title: "Upload inspiration",
      description: "Drop in photos of rooms you love — we'll detect the styles",
    },
    {
      id: "describe" as const,
      icon: <Sparkles className="w-5 h-5" />,
      title: "Describe your style",
      description: "Tell us in your own words — a few sentences is enough",
    },
    {
      id: "discover" as const,
      icon: <Palette className="w-5 h-5" />,
      title: "Discover styles",
      description: "Browse curated directions and pick what speaks to you",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-primary font-medium">Step 2 of 2</p>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Capture the vision</h2>
        <p className="text-muted-foreground text-sm">How would you like to share your style?</p>
      </div>

      {mode === "choose" ? (
        <div className="grid gap-3">
          {options.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                if (o.id === "describe") {
                  setMode("describe");
                } else {
                  onComplete({ mode: o.id });
                }
              }}
              className="group rounded-2xl border border-border/50 bg-card hover:border-primary/40 hover:shadow-md transition-all p-4 text-left flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {o.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold tracking-tight group-hover:text-primary transition-colors">
                  {o.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{o.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <label className="text-sm font-medium">Describe your style</label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Warm Mediterranean with arched openings, terracotta tones, woven textures, lots of natural light..."
            className="min-h-[140px]"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Mention colors, materials, mood, or any reference you have in mind.
          </p>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button
          variant="ghost"
          onClick={() => (mode === "describe" ? setMode("choose") : onBack())}
          className="text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        {mode === "describe" && (
          <Button onClick={() => onComplete({ mode: "describe", prompt: prompt.trim() })} disabled={prompt.trim().length < 5}>
            Continue
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default CaptureVision;