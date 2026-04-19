import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Armchair, LayoutGrid } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface InspirationItem {
  id: string;
  type: "accentFurniture" | "moodboard";
  label: string;
  description: string;
  imageUrl?: string;
  loading: boolean;
}

export interface InspirationDetail {
  id: string;
  label: string;
  description: string;
  type: "accentFurniture" | "moodboard";
}

interface StyleInspirationCardsProps {
  styleIndex: number;
  styleName: string;
  keywords: string[];
  roomType?: string;
  selectedItems: string[];
  onToggle: (id: string) => void;
  onItemsReady?: (items: InspirationDetail[]) => void;
  refreshKey?: number;
}

const styleSlugMap: Record<string, string> = {
  "Modern & Minimal": "modern-minimal",
  "Bohemian Eclectic": "bohemian-eclectic",
  "Classic Historical": "classic-historical",
  "Rustic Nature": "rustic-nature",
  "Mediterranean": "mediterranean",
  "Glam & Luxe": "glam-luxe",
};

const furnitureForStyle: Record<string, { name: string; description: string }[]> = {
  "modern-minimal": [
    { name: "Sculptural Lounge Chair", description: "A sleek, sculptural accent chair with clean lines and minimal form" },
    { name: "Floating Console Table", description: "A wall-mounted minimalist console with hidden storage" },
    { name: "Architectural Floor Lamp", description: "A geometric, slim-profile floor lamp with diffused light" },
  ],
  "classic-historical": [
    { name: "Antique Armoire", description: "An ornate period armoire with rich wood tones and carved details" },
    { name: "Chesterfield Sofa", description: "A tufted leather Chesterfield with rolled arms and nailhead trim" },
    { name: "Crystal Chandelier", description: "A multi-tiered crystal chandelier with brass accents" },
  ],
  "bohemian-eclectic": [
    { name: "Rattan Peacock Chair", description: "A statement rattan peacock chair with bohemian flair" },
    { name: "Macramé Wall Hanging", description: "A large fringed macramé tapestry with layered textures" },
    { name: "Vintage Persian Rug", description: "A worn-in Persian rug with rich jewel tones and patterns" },
  ],
  "rustic-nature": [
    { name: "Live Edge Wood Table", description: "A raw live-edge wood table showcasing natural grain patterns" },
    { name: "Reclaimed Barn Door", description: "A sliding reclaimed wood barn door with iron hardware" },
    { name: "Stone Fireplace Mantel", description: "A rough-hewn stone mantel with rustic character" },
  ],
  "mediterranean": [
    { name: "Wrought Iron Daybed", description: "A Mediterranean wrought iron daybed with flowing fabric drapes" },
    { name: "Terracotta Urn Planter", description: "A large hand-thrown terracotta urn with olive branches" },
    { name: "Carved Wood Console", description: "A Spanish-style carved wood console with turned legs" },
  ],
  "glam-luxe": [
    { name: "Velvet Statement Sofa", description: "A luxurious tufted velvet sofa with gold accents" },
    { name: "Mirrored Cocktail Table", description: "A faceted mirrored cocktail table with brass trim" },
    { name: "Crystal Pendant Light", description: "A cascading crystal pendant with polished gold frame" },
  ],
};

const StyleInspirationCards = ({
  styleIndex,
  styleName,
  keywords,
  roomType = "living room",
  selectedItems,
  onToggle,
  onItemsReady,
}: StyleInspirationCardsProps) => {
  const [items, setItems] = useState<InspirationItem[]>([]);

  useEffect(() => {
    const slug = styleSlugMap[styleName] || styleName.toLowerCase().replace(/\s+/g, "-");
    const furniture = furnitureForStyle[slug] || { name: "Designer Accent Piece", description: "A statement furniture piece" };

    const newItems: InspirationItem[] = [
      {
        id: `furniture-${styleIndex}`,
        type: "accentFurniture",
        label: furniture.name,
        description: furniture.description,
        loading: true,
      },
      {
        id: `moodboard-${styleIndex}`,
        type: "moodboard",
        label: `${styleName} Moodboard`,
        description: `Design inspiration featuring ${keywords.slice(0, 3).join(", ")}`,
        loading: true,
      },
    ];
    setItems(newItems);
    
    // Notify parent of item details so they can be passed downstream
    onItemsReady?.(newItems.map(i => ({ id: i.id, label: i.label, description: i.description, type: i.type })));

    // Generate visuals
    newItems.forEach((item) => {
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
              elements: keywords.slice(0, 5),
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
  }, [styleIndex, styleName, keywords, roomType]);

  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {items.map((item) => {
        const selected = selectedItems.includes(item.id);
        const Icon = item.type === "accentFurniture" ? Armchair : LayoutGrid;

        return (
          <button
            key={item.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(item.id);
            }}
            className={cn(
              "relative text-left rounded-lg border-2 overflow-hidden transition-all duration-200",
              "hover:border-primary/50 hover:shadow-md",
              selected
                ? "border-primary ring-2 ring-primary/20 shadow-lg"
                : "border-border/50"
            )}
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-secondary/50 to-muted/50 overflow-hidden">
              {item.loading ? (
                <Skeleton className="w-full h-full" />
              ) : item.imageUrl ? (
                <img src={item.imageUrl} alt={item.label} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon className="w-8 h-8 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div className="p-2 space-y-0.5">
              <p className="text-[11px] font-medium leading-tight truncate">{item.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                {item.description}
              </p>
            </div>
            {selected && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StyleInspirationCards;
