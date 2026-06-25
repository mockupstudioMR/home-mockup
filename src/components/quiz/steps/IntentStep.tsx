import { useQuiz } from "@/contexts/QuizContext";
import { Home, Sparkles, Compass, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const INTENT_GRADIENTS = [
  "from-primary/50 to-secondary/40",
  "from-secondary/50 to-accent/40",
  "from-accent/50 to-primary/40",
];

const intents = [
  {
    value: "starting-fresh" as const,
    label: "Setting up a new space",
    icon: <Home className="w-8 h-8" />,
  },
  {
    value: "updating-current" as const,
    label: "Redesigning what I have",
    icon: <Sparkles className="w-8 h-8" />,
  },
  {
    value: "gathering-inspiration" as const,
    label: "Just exploring for now",
    icon: <Compass className="w-8 h-8" />,
  },
];

const IntentStep = () => {
  const { quizData, updateQuizData } = useQuiz();

  return (
    <div className="grid grid-cols-3 gap-4">
      {intents.map((intent, i) => {
        const selected = quizData.intent === intent.value;
        return (
          <button
            key={intent.value}
            type="button"
            onClick={() => updateQuizData({ intent: intent.value })}
            className={cn(
              "group relative block rounded-2xl overflow-hidden border shadow-sm transition-all duration-500 text-left p-8 md:p-10 min-h-[280px] flex flex-col justify-between bg-gradient-to-br",
              INTENT_GRADIENTS[i % INTENT_GRADIENTS.length],
              selected
                ? "border-primary shadow-lg shadow-primary/20"
                : "border-border/50 hover:shadow-xl hover:border-primary/40"
            )}
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-background/90 text-primary flex items-center justify-center shadow-md">
                {intent.icon}
              </div>
              {selected && (
                <div className="absolute top-6 right-6 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-sm">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight group-hover:text-primary transition-colors break-words">
                {intent.label}
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
              Continue
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default IntentStep;
