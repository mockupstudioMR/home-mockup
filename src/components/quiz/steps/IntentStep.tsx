import { useQuiz } from "@/contexts/QuizContext";
import { Home, Sparkles, Compass, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const intents = [
  {
    value: "starting-fresh" as const,
    label: "🏠 Setting up a new space",
    icon: <Home className="w-8 h-8" />,
    gradient: "from-primary/30 to-secondary/30",
  },
  {
    value: "updating-current" as const,
    label: "✨ Redesigning what I have",
    icon: <Sparkles className="w-8 h-8" />,
    gradient: "from-accent/30 to-primary/20",
  },
  {
    value: "gathering-inspiration" as const,
    label: "💭 Just exploring for now",
    icon: <Compass className="w-8 h-8" />,
    gradient: "from-secondary/30 to-accent/30",
  },
];

const IntentStep = () => {
  const { quizData, updateQuizData } = useQuiz();

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {intents.map((intent) => {
        const selected = quizData.intent === intent.value;
        return (
          <button
            key={intent.value}
            type="button"
            onClick={() => updateQuizData({ intent: intent.value })}
            className={cn(
              "group relative block rounded-2xl overflow-hidden border shadow-sm transition-all duration-500 text-left p-8 md:p-10 min-h-[280px] flex flex-col justify-between bg-gradient-to-br",
              selected
                ? "border-primary shadow-lg shadow-primary/10"
                : "border-border/50 hover:shadow-xl hover:border-primary/30"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="w-16 h-16 rounded-2xl bg-background/90 text-primary flex items-center justify-center shadow-md">
                {intent.icon}
              </div>
              {selected && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
                  <Check className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-3 group-hover:text-primary transition-colors">
                {intent.label}
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              Continue
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default IntentStep;