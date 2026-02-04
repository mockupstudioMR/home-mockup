import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Store, Search, Image, Clipboard } from "lucide-react";

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

interface DesignItemCardProps {
  item: DesignItem;
  onOrderCustomMade: (item: DesignItem) => void;
}

const priorityColors: Record<string, string> = {
  essential: "bg-destructive/10 text-destructive border-destructive/30",
  recommended: "bg-primary/10 text-primary border-primary/30",
  optional: "bg-muted text-muted-foreground border-border",
};

// Helper to get color tone name from hex
const getColorTone = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  const saturation = Math.max(r, g, b) - Math.min(r, g, b);
  
  // Determine warmth
  const warmth = r > b ? "Warm" : r < b ? "Cool" : "Neutral";
  
  // Determine lightness
  let lightness = "";
  if (brightness > 200) lightness = "Light";
  else if (brightness > 150) lightness = "Soft";
  else if (brightness > 100) lightness = "Medium";
  else if (brightness > 50) lightness = "Deep";
  else lightness = "Dark";
  
  // Determine hue name
  let hueName = "";
  if (saturation < 30) {
    hueName = brightness > 200 ? "White" : brightness > 100 ? "Gray" : "Charcoal";
  } else if (r > g && r > b) {
    hueName = g > b ? "Beige" : "Rose";
  } else if (g > r && g > b) {
    hueName = r > b ? "Olive" : "Sage";
  } else if (b > r && b > g) {
    hueName = g > r ? "Teal" : "Blue";
  } else {
    hueName = "Taupe";
  }
  
  return `${warmth} ${lightness} ${hueName}`;
};

const DesignItemCard = ({ item, onOrderCustomMade }: DesignItemCardProps) => {
  // Build visual search query
  const visualTraits = [item.item_name];
  if (item.color) visualTraits.push(item.color);
  if (item.material) visualTraits.push(item.material);
  if (item.style) visualTraits.push(item.style);
  const imageQuery = encodeURIComponent(visualTraits.join(" ").trim());
  const thumbnailUrl = `https://www.bing.com/th?q=${imageQuery}&w=80&h=80&c=7&o=5&pid=1.7&mkt=en-US&cc=US&setlang=en&adlt=moderate`;
  const imagesUrl = `https://www.bing.com/images/search?q=${imageQuery}`;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-background/80 border border-border/50 hover:border-primary/30 transition-colors">
      {/* Item thumbnail */}
      <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted border border-border/50">
        <img 
          src={thumbnailUrl} 
          alt={item.item_name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>`;
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{item.item_name}</span>
          {/* Show color tone for wall items */}
          {item.item_type === "wall_color" && item.color && (
            <>
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
              <Badge 
                variant="secondary" 
                className="text-xs"
              >
                {getColorTone(item.color)}
              </Badge>
            </>
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
          {item.color && item.item_type !== "wall_color" && (
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

      {/* Actions */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        {/* Find Similar button */}
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

        {/* Order Custom Made button */}
        <Button
          size="sm"
          variant="secondary"
          className="h-7 text-xs"
          onClick={() => onOrderCustomMade(item)}
        >
          <Clipboard className="w-3 h-3 mr-1" />
          Order Custom Made
        </Button>

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
  );
};

export default DesignItemCard;
