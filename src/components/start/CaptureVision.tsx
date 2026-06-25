import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, PenLine, Palette, ArrowRight, ArrowLeft, Check, Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type VisionData =
  | { mode: "upload" }
  | { mode: "describe"; prompt: string }
  | { mode: "discover" };

interface Props {
  onBack: () => void;
  onComplete: (data: VisionData) => void;
}

const VISION_GRADIENTS = [
  "from-primary/50 to-secondary/40",
  "from-secondary/50 to-accent/40",
  "from-accent/50 to-primary/40",
];

const VisionCard = ({
  active,
  onClick,
  icon,
  label,
  gradient,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  gradient?: string;
}) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative block rounded-2xl overflow-hidden border shadow-sm transition-all duration-500 text-left p-8 md:p-10 min-h-[280px] flex flex-col justify-between bg-gradient-to-br",
        gradient ?? "from-primary/50 to-secondary/40",
        active
          ? "border-primary shadow-lg shadow-primary/20"
          : "border-border/50 hover:shadow-xl hover:border-primary/40"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="w-16 h-16 rounded-2xl bg-background/90 text-primary flex items-center justify-center shadow-md">
          {icon}
        </div>
        {active && (
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-sm">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>
      <div>
        <h3 className="text-xl md:text-2xl font-bold tracking-tight group-hover:text-primary transition-colors break-words">
          {label}
        </h3>
      </div>
    </button>
);

const CaptureVision = ({ onBack, onComplete }: Props) => {
  const [mode, setMode] = useState<"choose" | "describe">("choose");
  const [prompt, setPrompt] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        }
      }
      if (finalTranscript) {
        setPrompt((prev) => (prev ? prev + " " + finalTranscript.trim() : finalTranscript.trim()));
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const options = [
    {
      id: "upload" as const,
      icon: <Upload className="w-8 h-8" />,
      label: "Upload inspiration",
    },
    {
      id: "describe" as const,
      icon: <PenLine className="w-8 h-8" />,
      label: "Describe your style",
    },
    {
      id: "discover" as const,
      icon: <Palette className="w-8 h-8" />,
      label: "Discover styles",
    },
  ];

  return (
    <div className="space-y-6">
      {mode === "choose" ? (
        <div className="grid grid-cols-3 gap-4">
          {options.map((o, i) => (
            <VisionCard
              key={o.id}
              active={false}
              onClick={() => {
                if (o.id === "describe") {
                  setMode("describe");
                } else {
                  onComplete({ mode: o.id });
                }
              }}
              icon={o.icon}
              label={o.label}
              gradient={VISION_GRADIENTS[i % VISION_GRADIENTS.length]}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-w-xl mx-auto">
          <label className="text-sm font-medium">Describe your style</label>
          <div className="relative">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Warm Mediterranean with arched openings, terracotta tones, woven textures, lots of natural light..."
              className="min-h-[140px] pr-12"
              autoFocus
            />
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={cn(
                "absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all",
                isListening
                  ? "bg-destructive text-white shadow-md animate-pulse"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              )}
              title={isListening ? "Stop listening" : "Speak your style"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Mention colors, materials, mood, or any reference you have in mind.
          </p>
        </div>
      )}

      <div className="flex justify-between pt-2 max-w-xl mx-auto">
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