import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

const ESTIMATED_SECONDS = 45;

const steps = [
  { label: "Analyzing your preferences…", at: 0 },
  { label: "Building room layout…", at: 15 },
  { label: "Generating design image…", at: 30 },
  { label: "Finalizing details…", at: 40 },
];

const GenerationCountdown = () => {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(0, ESTIMATED_SECONDS - elapsed);
  const progress = Math.min(95, (elapsed / ESTIMATED_SECONDS) * 100);

  const currentStep =
    [...steps].reverse().find((s) => elapsed >= s.at) || steps[0];

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
  };

  return (
    <Card className="border-primary/30 bg-primary/5 max-w-lg mx-auto">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-sm">{currentStep.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {remaining > 0
                ? `~${formatTime(remaining)} remaining`
                : "Almost there…"}
            </p>
          </div>
          <span className="text-lg font-bold tabular-nums text-primary">
            {formatTime(elapsed)}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </CardContent>
    </Card>
  );
};

export default GenerationCountdown;
