import { useQuiz } from "@/contexts/QuizContext";
import { cn } from "@/lib/utils";
import { Check, Flower2, Frame, Lamp, BookOpen, Armchair, Waves, Sun, Music } from "lucide-react";

const elements = [
  { value: "plants", label: "Indoor Plants", icon: <Flower2 className="w-8 h-8" /> },
  { value: "artwork", label: "Wall Art", icon: <Frame className="w-8 h-8" /> },
  { value: "lighting", label: "Statement Lighting", icon: <Lamp className="w-8 h-8" /> },
  { value: "books", label: "Bookshelves", icon: <BookOpen className="w-8 h-8" /> },
  { value: "seating", label: "Cozy Seating", icon: <Armchair className="w-8 h-8" /> },
  { value: "textures", label: "Rich Textures", icon: <Waves className="w-8 h-8" /> },
  { value: "natural-light", label: "Natural Light", icon: <Sun className="w-8 h-8" /> },
  { value: "entertainment", label: "Entertainment", icon: <Music className="w-8 h-8" /> },
];

const ElementsStep = () => {
  const { quizData, updateQuizData } = useQuiz();

  const toggleElement = (value: string) => {
    const current = quizData.mustHaveElements || [];
    const updated = current.includes(value)
      ? current.filter((e) => e !== value)
      : [...current, value];
    updateQuizData({ mustHaveElements: updated });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Must-have elements?</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {elements.map((element) => {
          const selected = quizData.mustHaveElements?.includes(element.value);
          return (
            <button
              key={element.value}
              type="button"
              onClick={() => toggleElement(element.value)}
              className={cn(
                "relative flex flex-col items-center justify-between gap-4 p-8 md:p-10 rounded-xl border-2 transition-all duration-200 min-h-[280px]",
                "hover:border-primary/50 hover:bg-accent/50",
                selected
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                  : "border-border bg-card"
              )}
            >
              <div
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center",
                  selected ? "bg-primary text-primary-foreground" : "bg-secondary"
                )}
              >
                {element.icon}
              </div>
              <span className="text-xl md:text-2xl font-bold text-center break-words">{element.label}</span>
              {selected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ElementsStep;
