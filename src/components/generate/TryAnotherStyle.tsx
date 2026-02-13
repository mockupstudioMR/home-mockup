import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shuffle, ArrowRight } from "lucide-react";

const STYLE_OPTIONS = [
  { key: "modern-minimal", label: "Modern Minimal", emoji: "🏢" },
  { key: "bohemian-eclectic", label: "Bohemian Eclectic", emoji: "🌿" },
  { key: "classic-historical", label: "Classic & Historical", emoji: "🏛️" },
  { key: "rustic-nature", label: "Rustic & Natural", emoji: "🪵" },
  { key: "mediterranean", label: "Mediterranean", emoji: "☀️" },
  { key: "glam-luxe", label: "Glam & Luxe", emoji: "✨" },
];

interface TryAnotherStyleProps {
  currentStyle: string;
  onSelectStyle: (style: string) => void;
  onSurpriseMe: () => void;
  disabled?: boolean;
}

const TryAnotherStyle = ({
  currentStyle,
  onSelectStyle,
  onSurpriseMe,
  disabled,
}: TryAnotherStyleProps) => {
  const alternatives = STYLE_OPTIONS.filter((s) => s.key !== currentStyle);

  return (
    <Card className="border-dashed border-muted-foreground/30 bg-muted/30">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <Shuffle className="w-5 h-5 text-secondary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Not loving it?</h3>
            <p className="text-xs text-muted-foreground">
              Try a completely different style direction
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {alternatives.map((style) => (
            <Button
              key={style.key}
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onSelectStyle(style.key)}
              className="text-xs gap-1.5"
            >
              <span>{style.emoji}</span>
              {style.label}
              <ArrowRight className="w-3 h-3 ml-0.5 opacity-50" />
            </Button>
          ))}
        </div>

        <Button
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={onSurpriseMe}
          className="w-full gap-2"
        >
          <Shuffle className="w-4 h-4" />
          Surprise me — pick a random style
        </Button>
      </CardContent>
    </Card>
  );
};

export default TryAnotherStyle;
