import { useQuiz } from "@/contexts/QuizContext";
import QuizOption from "../QuizOption";

const palettes = [
  {
    value: "neutral",
    label: "Neutral & Earthy",
    description: "Warm beiges, soft grays, and natural wood tones",
    colors: ["#D4C4B0", "#8B7355", "#E8E0D5", "#6B5B4F"],
  },
  {
    value: "cool",
    label: "Cool & Serene",
    description: "Calming blues, soft greens, and misty grays",
    colors: ["#A8C5DA", "#6B8E9B", "#D1E3E8", "#4A7C8C"],
  },
  {
    value: "warm",
    label: "Warm & Cozy",
    description: "Rich terracotta, golden yellows, and burnt orange",
    colors: ["#D4A574", "#C67B54", "#E8D5C4", "#A0522D"],
  },
  {
    value: "bold",
    label: "Bold & Vibrant",
    description: "Deep jewel tones with dramatic contrasts",
    colors: ["#1E3A5F", "#8B2942", "#2D4A3E", "#D4AF37"],
  },
  {
    value: "monochrome",
    label: "Monochrome",
    description: "Sophisticated black, white, and gray palette",
    colors: ["#2C2C2C", "#6B6B6B", "#A8A8A8", "#E5E5E5"],
  },
];

const ColorStep = () => {
  const { quizData, updateQuizData } = useQuiz();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Pick your color palette</h2>
        <p className="text-muted-foreground">What colors make you feel at home?</p>
      </div>

      <div className="grid gap-3">
        {palettes.map((palette) => (
          <button
            key={palette.value}
            type="button"
            onClick={() => updateQuizData({ colorPalette: palette.value })}
            className={`relative w-full text-left rounded-xl border-2 p-4 transition-all duration-200 hover:border-primary/50 hover:bg-accent/50 ${
              quizData.colorPalette === palette.value
                ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                {palette.colors.map((color, idx) => (
                  <div
                    key={idx}
                    className="w-8 h-8 rounded-lg first:rounded-l-xl last:rounded-r-xl"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{palette.label}</p>
                <p className="text-sm text-muted-foreground">{palette.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ColorStep;
