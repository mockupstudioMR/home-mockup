import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, Paintbrush, Layers, Sofa, Lamp, Palette, Frame } from "lucide-react";
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
  matchedProduct?: {
    id: string;
    name: string;
    price?: number;
    currency?: string;
    image_urls?: string[];
    source_url?: string;
  };
}

interface DesignItemsListProps {
  items: DesignItem[];
  fullDescription: string;
  designImageUrl?: string;
  isLoading?: boolean;
}

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

const DesignItemsList = ({ items, fullDescription, designImageUrl, isLoading }: DesignItemsListProps) => {
  const [selectedItem, setSelectedItem] = useState<DesignItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleOrderCustomMade = (item: DesignItem) => {
    setSelectedItem(item);
    setSheetOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
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

  const groupedItems = items.reduce((acc, item) => {
    const type = item.item_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(item);
    return acc;
  }, {} as Record<string, DesignItem[]>);

  return (
    <>
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Complete Look Breakdown
          </CardTitle>
          {fullDescription && (
            <p className="text-sm text-muted-foreground mt-2">{fullDescription}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedItems).map(([type, typeItems]) => {
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

          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Frame className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No items extracted yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      <OrderCustomMadeSheet 
        item={selectedItem}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  );
};

export default DesignItemsList;
