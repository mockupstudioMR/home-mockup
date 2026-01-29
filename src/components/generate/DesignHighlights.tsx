import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Palette, Armchair, LayoutGrid, MessageSquare } from "lucide-react";

interface HighlightData {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  visual: string; // URL or base64 image
  details: string[];
}

interface DesignHighlightsProps {
  colorScheme: {
    colors: string[];
    description: string;
    visual?: string;
  };
  accentFurniture: {
    name: string;
    description: string;
    visual?: string;
  };
  moodboard: {
    elements: string[];
    description: string;
    visual?: string;
  };
  onCommentChange?: (highlightId: string, comment: string) => void;
}

const DesignHighlights = ({
  colorScheme,
  accentFurniture,
  moodboard,
  onCommentChange,
}: DesignHighlightsProps) => {
  const [comments, setComments] = useState<Record<string, string>>({
    colorScheme: "",
    accentFurniture: "",
    moodboard: "",
  });

  const handleCommentChange = (id: string, value: string) => {
    setComments((prev) => ({ ...prev, [id]: value }));
    onCommentChange?.(id, value);
  };

  const highlights = [
    {
      id: "colorScheme",
      title: "Color Scheme",
      description: colorScheme.description,
      icon: <Palette className="w-5 h-5" />,
      visual: colorScheme.visual,
      details: colorScheme.colors,
    },
    {
      id: "accentFurniture",
      title: "Accent Furniture",
      description: accentFurniture.description,
      icon: <Armchair className="w-5 h-5" />,
      visual: accentFurniture.visual,
      details: [accentFurniture.name],
    },
    {
      id: "moodboard",
      title: "Moodboard",
      description: moodboard.description,
      icon: <LayoutGrid className="w-5 h-5" />,
      visual: moodboard.visual,
      details: moodboard.elements,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Design Highlights</h2>
        <p className="text-muted-foreground">
          Key elements that define your personalized design
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {highlights.map((highlight) => (
          <Card
            key={highlight.id}
            className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  {highlight.icon}
                </div>
                <CardTitle className="text-lg">{highlight.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Visual Preview */}
              <div className="aspect-square rounded-xl bg-gradient-to-br from-secondary/50 to-muted/50 overflow-hidden relative">
                {highlight.visual ? (
                  <img
                    src={highlight.visual}
                    alt={highlight.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {highlight.id === "colorScheme" && (
                      <div className="flex gap-2">
                        {highlight.details.slice(0, 5).map((color, i) => (
                          <div
                            key={i}
                            className="w-10 h-10 rounded-full shadow-md border-2 border-white/50"
                            style={{
                              backgroundColor: color.startsWith("#")
                                ? color
                                : `var(--${color})`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                    {highlight.id === "accentFurniture" && (
                      <Armchair className="w-16 h-16 text-muted-foreground/50" />
                    )}
                    {highlight.id === "moodboard" && (
                      <LayoutGrid className="w-16 h-16 text-muted-foreground/50" />
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground">
                {highlight.description}
              </p>

              {/* Tags/Details */}
              <div className="flex flex-wrap gap-1.5">
                {highlight.details.slice(0, 4).map((detail, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-xs bg-primary/10 hover:bg-primary/20"
                  >
                    {detail}
                  </Badge>
                ))}
              </div>

              {/* Comment Section */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                  <span>Your notes</span>
                </div>
                <Textarea
                  placeholder={`Add your thoughts about the ${highlight.title.toLowerCase()}...`}
                  value={comments[highlight.id]}
                  onChange={(e) =>
                    handleCommentChange(highlight.id, e.target.value)
                  }
                  className="min-h-[80px] resize-none text-sm bg-background/50"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DesignHighlights;
