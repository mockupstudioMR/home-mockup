import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, Paintbrush, Layers, Sofa, Lamp, Palette, Frame, DoorOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DesignItemCard from "./DesignItemCard";
import OrderCustomMadeSheet from "./OrderCustomMadeSheet";

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DesignItem {
  id: string;
  item_type: string;
  item_name: string;
  item_description: string;
  color?: string;
  hex_code?: string;
  material?: string;
  style?: string;
  priority: "essential" | "recommended" | "optional";
  matched_product_id?: string;
  google_shopping_url?: string;
  google_images_url?: string;
  bounding_box?: BoundingBox;
  product_photo_url?: string;
  wall_type?: string;
  matchedProduct?: {
    id: string;
    name: string;
    price?: number;
    currency?: string;
    image_urls?: string[];
    source_url?: string;
    ai_style_tags?: string[];
  };
}

interface DesignItemsListProps {
  items: DesignItem[];
  fullDescription: string;
  designImageUrl?: string;
  isLoading?: boolean;
  isolatingPhotos?: boolean;
}

const WALL_TYPES = [
  { value: "pleine_wall", label: "Pleine Wall" },
  { value: "door_wall", label: "Door Wall" },
  { value: "window_wall", label: "Window Wall" },
  { value: "balcony_wall", label: "Balcony Wall" },
];

const itemTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  wall_color: Paintbrush,
  floor_material: Layers,
  furniture: Sofa,
  lighting: Lamp,
  textile: Palette,
  decor: Frame,
  architectural: Layers,
};

const itemTypeLabels: Record<string, string> = {
  wall_color: "Walls",
  floor_material: "Flooring",
  furniture: "Furniture",
  lighting: "Lighting",
  textile: "Textiles",
  decor: "Decor",
  architectural: "Architectural",
};

// Check if item is a wall type
const isWallItem = (itemType: string): boolean => {
  return itemType === "wall_color" || itemType === "wall_elements" || itemType.includes("wall");
};

const DesignItemsList = React.forwardRef<HTMLDivElement, DesignItemsListProps>(
  ({ items, fullDescription, designImageUrl, isLoading, isolatingPhotos }, ref) => {
    const [selectedItem, setSelectedItem] = useState<DesignItem | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    const handleOrderCustomMade = (item: DesignItem) => {
      setSelectedItem(item);
      setSheetOpen(true);
    };

    const handleWallTypeChange = async (itemId: string, wallType: string) => {
      try {
        await supabase
          .from("design_items")
          .update({ wall_type: wallType })
          .eq("id", itemId);
      } catch (error) {
        console.error("Error updating wall type:", error);
      }
    };

    if (isLoading) {
      return (
        <Card ref={ref} className="border-border/50">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full" />
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </CardContent>
        </Card>
      );
    }

    // Separate wall items from product items
    const wallItems = items.filter((item) => isWallItem(item.item_type));
    const productItems = items.filter((item) => !isWallItem(item.item_type));

    // Group product items by type
    const groupedProducts = productItems.reduce((acc, item) => {
      const type = item.item_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    }, {} as Record<string, DesignItem[]>);

    return (
      <>
        {/* Product Items Section */}
        <Card ref={ref} className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Complete Look Breakdown
              {isolatingPhotos && (
                <Badge variant="secondary" className="text-xs animate-pulse">
                  Extracting product photos...
                </Badge>
              )}
            </CardTitle>
            {fullDescription && (
              <p className="text-sm text-muted-foreground mt-2">{fullDescription}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(groupedProducts).map(([type, typeItems]) => {
              const IconComponent = itemTypeIcons[type] || Frame;
              
              return (
                <div key={type} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      {itemTypeLabels[type] || type.replace("_", " ")}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {typeItems.length}
                    </Badge>
                  </div>
                  
                  <div className="grid gap-2">
                    {typeItems.map((item) => (
                      <DesignItemCard 
                        key={item.id} 
                        item={item} 
                        designImageUrl={designImageUrl}
                        onOrderCustomMade={handleOrderCustomMade}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {productItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Frame className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>No items extracted yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wall Extraction Section */}
        {wallItems.length > 0 && (
          <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-orange-600" />
                Wall Extraction
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Specify the wall type for each extracted wall element
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {wallItems.map((wall) => {
                const hexColor = wall.hex_code || wall.color;
                const isHex = hexColor && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hexColor);

                return (
                  <div
                    key={wall.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-background/80 border border-border/50"
                  >
                    {/* Color swatch */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border border-border/50">
                      {isHex ? (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: hexColor }}
                        >
                          <span className="text-[9px] font-mono text-white drop-shadow-md bg-black/30 px-1 rounded">
                            {hexColor?.toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Paintbrush className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    {/* Wall info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{wall.item_name}</span>
                        {wall.color && (
                          <Badge variant="secondary" className="text-xs">
                            🎨 {wall.color}
                          </Badge>
                        )}
                        {wall.material && (
                          <Badge variant="outline" className="text-xs">
                            {wall.material}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {wall.item_description}
                      </p>
                    </div>

                    {/* Wall type selector */}
                    <div className="flex-shrink-0 w-44">
                      <Select
                        defaultValue={wall.wall_type || undefined}
                        onValueChange={(value) => handleWallTypeChange(wall.id, value)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select wall type" />
                        </SelectTrigger>
                        <SelectContent>
                          {WALL_TYPES.map((wt) => (
                            <SelectItem key={wt.value} value={wt.value} className="text-xs">
                              {wt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <OrderCustomMadeSheet 
          item={selectedItem}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      </>
    );
  }
);
DesignItemsList.displayName = "DesignItemsList";

export default DesignItemsList;
