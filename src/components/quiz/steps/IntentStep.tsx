import { useQuiz } from "@/contexts/QuizContext";
import QuizOption from "../QuizOption";

const intents = [
  {
    value: "starting-fresh" as const,
    label: "🏠 Setting up a new space",
    description: "Moving in, renovating, or starting from scratch",
  },
  {
    value: "updating-current" as const,
    label: "✨ Redesigning what I have",
    description: "New sofa, fresh styling, or a full room glow-up",
  },
  {
    value: "gathering-inspiration" as const,
    label: "💭 Just exploring for now",
    description: "No rush, just looking around",
  },
];

const IntentStep = () => {
  const { quizData, updateQuizData } = useQuiz();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">What's brought you here?</h2>
      </div>

      <div className="grid gap-3">
        {intents.map((intent) => (
          <QuizOption
            key={intent.value}
            value={intent.value}
            label={intent.label}
            description={intent.description}
            selected={quizData.intent === intent.value}
            onClick={() => updateQuizData({ intent: intent.value })}
          />
        ))}
      </div>
    </div>
  );
};

export default IntentStep;