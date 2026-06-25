import { useQuiz } from "@/contexts/QuizContext";
import QuizOption from "../QuizOption";
import { Coins, CreditCard, Gem } from "lucide-react";

const budgets = [
  {
    value: "budget-friendly",
    label: "Budget-Friendly",
    description: "Smart, stylish choices that won't break the bank",
    icon: <Coins className="w-6 h-6" />,
  },
  {
    value: "mid-range",
    label: "Mid-Range",
    description: "Quality pieces with a balance of style and value",
    icon: <CreditCard className="w-6 h-6" />,
  },
  {
    value: "luxury",
    label: "Luxury",
    description: "Premium materials and designer pieces",
    icon: <Gem className="w-6 h-6" />,
  },
];

const BudgetStep = () => {
  const { quizData, updateQuizData } = useQuiz();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">What's your budget feel?</h2>
      </div>

      <div className="grid gap-3">
        {budgets.map((budget) => (
          <QuizOption
            key={budget.value}
            value={budget.value}
            label={budget.label}
            description={budget.description}
            icon={budget.icon}
            selected={quizData.budgetFeel === budget.value}
            onClick={() => updateQuizData({ budgetFeel: budget.value })}
            variant="large"
          />
        ))}
      </div>
    </div>
  );
};

export default BudgetStep;
