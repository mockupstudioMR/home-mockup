import { useQuiz } from "@/contexts/QuizContext";
import QuizOption from "../QuizOption";
import { Sofa, Leaf, Sparkles, Building2, Palette } from "lucide-react";

const styles = [
  {
    value: "modern",
    label: "Modern",
    description: "Clean lines, neutral tones, and minimalist furniture",
    icon: <Sofa className="w-6 h-6" />,
  },
  {
    value: "minimalist",
    label: "Minimalist",
    description: "Less is more. Simple, functional, clutter-free",
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    value: "bohemian",
    label: "Bohemian",
    description: "Eclectic, colorful, with global influences",
    icon: <Palette className="w-6 h-6" />,
  },
  {
    value: "traditional",
    label: "Traditional",
    description: "Classic elegance with rich colors and textures",
    icon: <Building2 className="w-6 h-6" />,
  },
  {
    value: "industrial",
    label: "Industrial",
    description: "Raw materials, exposed elements, urban edge",
    icon: <Leaf className="w-6 h-6" />,
  },
];

const StyleStep = () => {
  const { quizData, updateQuizData } = useQuiz();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">What's your design style?</h2>
        <p className="text-muted-foreground">Choose the aesthetic that speaks to you</p>
      </div>

      <div className="grid gap-3">
        {styles.map((style) => (
          <QuizOption
            key={style.value}
            value={style.value}
            label={style.label}
            description={style.description}
            icon={style.icon}
            selected={quizData.stylePreference === style.value}
            onClick={() => updateQuizData({ stylePreference: style.value })}
          />
        ))}
      </div>
    </div>
  );
};

export default StyleStep;
