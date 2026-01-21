import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface QuizOptionProps {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  variant?: "default" | "large";
}

const QuizOption = ({
  value,
  label,
  description,
  icon,
  selected,
  onClick,
  variant = "default",
}: QuizOptionProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-full text-left rounded-xl border-2 transition-all duration-200",
        "hover:border-primary/50 hover:bg-accent/50",
        variant === "large" ? "p-6" : "p-4",
        selected
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
          : "border-border bg-card"
      )}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div
            className={cn(
              "shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
              selected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
            )}
          >
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={cn("font-semibold", variant === "large" ? "text-lg" : "text-base")}>
            {label}
          </p>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {selected && (
          <div className="shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
      </div>
    </button>
  );
};

export default QuizOption;
