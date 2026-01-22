import { Card, CardContent } from "@/components/ui/card";
import { Palette, Sparkles, Lightbulb } from "lucide-react";

interface StyleExplanationProps {
  style: string;
  room: string;
  colors?: string;
  elements?: string[];
}

const styleDescriptions: Record<string, { title: string; description: string; tips: string[] }> = {
  "modern_minimal": {
    title: "Modern Minimal",
    description: "Clean lines, functional simplicity, and a neutral palette define this style. Scandinavian influences bring warmth to the minimalist aesthetic through natural textures and thoughtful design.",
    tips: [
      "Use furniture with simple geometric forms",
      "Stick to a monochromatic or neutral color scheme",
      "Incorporate natural materials like wood and linen",
      "Embrace negative space and decluttered surfaces",
    ],
  },
  "classic_historical": {
    title: "Classic & Historical",
    description: "Timeless elegance characterized by ornate details, rich woods, and traditional craftsmanship. This style celebrates heritage and refined sophistication.",
    tips: [
      "Choose furniture with carved details and classic silhouettes",
      "Use rich fabrics like velvet, silk, and brocade",
      "Incorporate antique or vintage pieces",
      "Add crown molding and architectural details",
    ],
  },
  "rustic_nature": {
    title: "Rustic & Nature-Inspired",
    description: "Warm natural materials, earthy tones, and cozy farmhouse charm create an inviting atmosphere. This style celebrates organic textures and handcrafted elements.",
    tips: [
      "Use reclaimed wood and natural stone",
      "Incorporate woven baskets and textiles",
      "Choose earthy colors: browns, greens, and cream",
      "Add plants and natural greenery",
    ],
  },
  "mediterranean": {
    title: "Mediterranean & Coastal",
    description: "Light and airy spaces with terracotta, woven textures, and seaside tranquility. This style evokes the relaxed elegance of coastal living.",
    tips: [
      "Use terracotta tiles and whitewashed walls",
      "Incorporate blue accents reminiscent of the sea",
      "Choose natural woven furniture like rattan",
      "Add iron accents and ceramic details",
    ],
  },
  "bohemian_eclectic": {
    title: "Bohemian & Eclectic",
    description: "Global influences, rich patterns, artisanal crafts, and layered textures create a collected, personal space. This style celebrates individuality and cultural diversity.",
    tips: [
      "Mix patterns and textures fearlessly",
      "Incorporate global textiles and artifacts",
      "Use rich, saturated colors",
      "Layer rugs, pillows, and throws",
    ],
  },
  "glam_luxe": {
    title: "Glam & Luxe",
    description: "Sophisticated glamour with metallic accents, plush fabrics, and statement pieces. This style brings drama and opulence to any space.",
    tips: [
      "Use metallic finishes: gold, brass, chrome",
      "Choose velvet and silk upholstery",
      "Add mirrored surfaces and crystal accents",
      "Incorporate bold statement furniture",
    ],
  },
};

const StyleExplanation = ({ style, room, colors, elements }: StyleExplanationProps) => {
  // Normalize the style key
  const normalizedStyle = style?.toLowerCase().replace(/-/g, "_") || "modern_minimal";
  const styleInfo = styleDescriptions[normalizedStyle] || styleDescriptions["modern_minimal"];

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Palette className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{styleInfo.title}</h3>
            <p className="text-sm text-muted-foreground">
              Designed for your {room || "space"}
            </p>
          </div>
        </div>

        <p className="text-muted-foreground">{styleInfo.description}</p>

        {colors && (
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>
              Color palette: <span className="font-medium">{colors}</span>
            </span>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span>Design Tips</span>
          </div>
          <ul className="space-y-1 pl-6">
            {styleInfo.tips.map((tip, index) => (
              <li key={index} className="text-sm text-muted-foreground list-disc">
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {elements && elements.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {elements.map((element, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
              >
                {element}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StyleExplanation;
