import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, MapPin, Store, Search, Paintbrush, Layers, Sofa, Lamp, Palette, Frame, Image } from "lucide-react";

interface DesignItem {
  id: string;
  item_type: string;
  item_name: string;
  item_description: string;
  color?: string;
  material?: string;
  style?: string;
  priority: "essential" | "recommended" | "optional";
  matched_product_id?: string;
  google_shopping_url?: string;
  google_images_url?: string;
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

const priorityColors: Record<string, string> = {
  essential: "bg-destructive/10 text-destructive border-destructive/30",
  recommended: "bg-primary/10 text-primary border-primary/30",
  optional: "bg-muted text-muted-foreground border-border",
};

const DesignItemsList = ({ items, fullDescription, isLoading }: DesignItemsListProps) => {
  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
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

  const itemTypeLabels: Record<string, string> = {
    wall_color: "Walls",
    floor_material: "Flooring",
    furniture: "Furniture",
    lighting: "Lighting",
    textile: "Textiles",
    decor: "Decor",
    architectural: "Architectural",
  };

  return (
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
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg bg-background/80 border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{item.item_name}</span>
                        {/* Show color code badge for wall items */}
                        {item.item_type === "wall_color" && item.color && (
                          <Badge 
                            variant="outline" 
                            className="text-xs font-mono bg-background"
                          >
                            <div 
                              className="w-2.5 h-2.5 rounded-full mr-1.5 border border-border/50"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.color.toUpperCase()}
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${priorityColors[item.priority]}`}
                        >
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.item_description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {item.color && (
                          <div className="flex items-center gap-1">
                            <div 
                              className="w-3 h-3 rounded-full border border-border"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-xs text-muted-foreground">{item.color}</span>
                          </div>
                        )}
                        {item.material && (
                          <span className="text-xs text-muted-foreground">
                            {item.material}
                          </span>
                        )}
                        {item.style && (
                          <Badge variant="secondary" className="text-xs">
                            {item.style}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Shop action */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-1">
                      {/* Bing Images link - always available */}
                      {(() => {
                        const visualTraits = [item.item_name];
                        if (item.color) visualTraits.push(item.color);
                        if (item.material) visualTraits.push(item.material);
                        if (item.style) visualTraits.push(item.style);
                        const imageQuery = encodeURIComponent(visualTraits.join(" ").trim());
                        const imagesUrl = `https://www.bing.com/images/search?q=${imageQuery}`;
                        
                        return (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => window.open(imagesUrl, "_blank")}
                          >
                            <Image className="w-3 h-3 mr-1" />
                            Find Similar
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        );
                      })()}

                      {item.matchedProduct ? (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <MapPin className="w-3 h-3" />
                            <span>Local shop</span>
                          </div>
                          {item.matchedProduct.price && (
                            <span className="text-sm font-semibold">
                              {item.matchedProduct.currency || "€"}{item.matchedProduct.price}
                            </span>
                          )}
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            onClick={() => window.open(item.matchedProduct?.source_url || "#", "_blank")}
                          >
                            <Store className="w-3 h-3 mr-1" />
                            View Product
                          </Button>
                        </div>
                      ) : item.google_shopping_url ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-muted-foreground"
                          onClick={() => window.open(item.google_shopping_url, "_blank")}
                        >
                          <Search className="w-3 h-3 mr-1" />
                          Shop
                        </Button>
                      ) : null}
                    </div>
                  </div>
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
  );
};

export default DesignItemsList;
