import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Armchair, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AnalyzedStyle {
  styleName: string;
  confidence: number;
  description: string;
  keywords: string[];
}

interface InspirationItem {
  id: string;
  styleIndex: number;
  styleName: string;
  type: "accentFurniture" | "moodboard";
  label: string;
  description: string;
  imageUrl?: string;
  loading: boolean;
}

interface StyleInspirationGridProps {
  styles: AnalyzedStyle[];
  roomType?: string;
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

const styleSlugMap: Record<string, string> = {
  "Modern & Minimal": "modern-minimal",
  "Bohemian Eclectic": "bohemian-eclectic",
  "Classic Historical": "classic-historical",
  "Rustic Nature": "rustic-nature",
  "Mediterranean": "mediterranean",
  "Glam & Luxe": "glam-luxe",
};

const furnitureForStyle: Record<string, { name: string; description: string }> = {
  "modern-minimal": { name: "Sculptural Lounge Chair", description: "A sleek, sculptural accent chair with clean lines and minimal form" },
  "classic-historical": { name: "Antique Armoire", description: "An ornate period armoire with rich wood tones and carved details" },
  "bohemian-eclectic": { name: "Rattan Peacock Chair", description: "A statement rattan peacock chair with bohemian flair" },
  "rustic-nature": { name: "Live Edge Wood Table", description: "A raw live-edge wood table showcasing natural grain patterns" },
  "mediterranean": { name: "Wrought Iron Daybed", description: "A Mediterranean wrought iron daybed with flowing fabric drapes" },
  "glam-luxe": { name: "Velvet Statement Sofa", description: "A luxurious tufted velvet sofa with gold accents" },
};

const StyleInspirationGrid = ({
  styles,
  roomType = "living room",
  selectedItems,
  onSelectionChange,
}: StyleInspirationGridProps) => {
  const [items, setItems] = useState<InspirationItem[]>([]);

  // Build inspiration items for each style
  useEffect(() => {
    const newItems: InspirationItem[] = [];
    styles.forEach((style, index) => {
      const slug = styleSlugMap[style.styleName] || style.styleName.toLowerCase().replace(/\s+/g, "-");
      const furniture = furnitureForStyle[slug] || { name: "Designer Accent Piece", description: "A statement furniture piece" };

      newItems.push({
        id: `furniture-${index}`,
        styleIndex: index,
        styleName: style.styleName,
        type: "accentFurniture",
        label: furniture.name,
        description: furniture.description,
        loading: true,
      });
      newItems.push({
        id: `moodboard-${index}`,
        styleIndex: index,
        styleName: style.styleName,
        type: "moodboard",
        label: `${style.styleName} Moodboard`,
        description: `Design inspiration board featuring ${style.keywords.slice(0, 3).join(", ")}`,
        loading: true,
      });
    });
    setItems(newItems);

    // Generate visuals for each item
    newItems.forEach((item) => {
      const slug = styleSlugMap[styles[item.styleIndex].styleName] || styles[item.styleIndex].styleName.toLowerCase().replace(/\s+/g, "-");
      const style = styles[item.styleIndex];

      const body =
        item.type === "accentFurniture"
          ? {
              type: "accentFurniture",
              style: slug,
              room: roomType,
              furnitureName: item.label,
              furnitureDescription: item.description,
            }
          : {
              type: "moodboard",
              style: slug,
              room: roomType,
              elements: style.keywords.slice(0, 5),
            };

      supabase.functions
        .invoke("generate-highlight-visuals", { body })
        .then(({ data, error }) => {
          if (!error && data?.imageUrl) {
            setItems((prev) =>
              prev.map((i) => (i.id === item.id ? { ...i, imageUrl: data.imageUrl, loading: false } : i))
            );
          } else {
            setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, loading: false } : i)));
          }
        })
        .catch(() => {
          setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, loading: false } : i)));
        });
    });
  }, [styles, roomType]);

  const toggleItem = (id: string) => {
    onSelectionChange(
      selectedItems.includes(id) ? selectedItems.filter((i) => i !== id) : [...selectedItems, id]
    );
  };

  // Group items by style
  const groupedByStyle = styles.map((style, index) => ({
    style,
    items: items.filter((i) => i.styleIndex === index),
  }));

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Style Inspirations</h2>
        <p className="text-sm text-muted-foreground">
          Select the furniture and moodboard elements you love — they'll influence your final design
        </p>
      </div>

      {groupedByStyle.map(({ style, items: styleItems }) => (
        <div key={style.styleName} className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {Math.round(style.confidence * 100)}%
            </Badge>
            <h3 className="font-semibold text-sm">{style.styleName}</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {styleItems.map((item) => {
              const selected = selectedItems.includes(item.id);
              const Icon = item.type === "accentFurniture" ? Armchair : LayoutGrid;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={cn(
                    "relative text-left rounded-xl border-2 overflow-hidden transition-all duration-200",
                    "hover:border-primary/50 hover:shadow-md",
                    selected
                      ? "border-primary ring-2 ring-primary/20 shadow-lg"
                      : "border-border"
                  )}
                >
                  {/* Image */}
                  <div className="aspect-square bg-gradient-to-br from-secondary/50 to-muted/50 overflow-hidden">
                    {item.loading ? (
                      <Skeleton className="w-full h-full" />
                    ) : item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.label} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className="w-10 h-10 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5 space-y-1">
                    <p className="text-xs font-medium leading-tight truncate">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  {/* Selection indicator */}
                  {selected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StyleInspirationGrid;
