import { useQuiz } from "@/contexts/QuizContext";
import QuizOption from "../QuizOption";
import { Store, Globe } from "lucide-react";

const FurnitureSourceStep = () => {
  const { quizData, updateQuizData } = useQuiz();

  const options: Array<{
    value: "shop_only" | "open";
    label: string;
    description: string;
    icon: React.ReactNode;
  }> = [
    {
      value: "shop_only",
      label: "Shop Products Only",
      description: "Use exclusively furniture from our partner shops exactly as they are",
      icon: <Store className="w-5 h-5" />,
    },
    {
      value: "open",
      label: "Open to All",
      description: "Generate design with any furniture that fits the style",
      icon: <Globe className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Furniture Source</h2>
      </div>

      <div className="grid gap-3">
        {options.map((option) => (
          <QuizOption
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            icon={option.icon}
            selected={quizData.furnitureSource === option.value}
            onClick={() => updateQuizData({ furnitureSource: option.value })}
          />
        ))}
      </div>
    </div>
  );
};

export default FurnitureSourceStep;
