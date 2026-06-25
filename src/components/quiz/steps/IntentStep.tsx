import { useQuiz } from "@/contexts/QuizContext";
import QuizOption from "../QuizOption";

const intents = [
  {
    value: "starting-fresh" as const,
    label: "🏠 Setting up a new space",
  },
  {
    value: "updating-current" as const,
    label: "✨ Redesigning what I have",
  },
  {
    value: "gathering-inspiration" as const,
    label: "💭 Just exploring for now",
  },
];

const IntentStep = () => {
  const { quizData, updateQuizData } = useQuiz();

  return (
    <div className="grid gap-3">
      {intents.map((intent) => (
        <QuizOption
          key={intent.value}
          value={intent.value}
          label={intent.label}
          selected={quizData.intent === intent.value}
          onClick={() => updateQuizData({ intent: intent.value })}
        />
      ))}
    </div>
  );
};

export default IntentStep;