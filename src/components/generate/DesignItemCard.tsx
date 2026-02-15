import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Store, Search, Image, Clipboard } from "lucide-react";

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

interface DesignItemCardProps {
  item: DesignItem;
  designImageUrl?: string;
  onOrderCustomMade: (item: DesignItem) => void;
}

const priorityColors: Record<string, string> = {
  essential: "bg-destructive/10 text-destructive border-destructive/30",
  recommended: "bg-primary/10 text-primary border-primary/30",
  optional: "bg-muted text-muted-foreground border-border",
};

// Check if string is a valid hex color
const isHexColor = (str: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(str);
};

// Check if item is a wall-related type
const isWallItem = (itemType: string): boolean => {
  return itemType === "wall_color" || itemType === "wall_elements" || itemType.includes("wall");
};

const DesignItemCard = ({ item, designImageUrl, onOrderCustomMade }: DesignItemCardProps) => {
  const [imageError, setImageError] = useState(false);
  
  const hasMatchedProduct = !!item.matchedProduct;
  const matchedImage = item.matchedProduct?.image_urls?.[0];
  const displayName = hasMatchedProduct ? item.matchedProduct!.name : item.item_name;
  
  // Build visual search query
  const visualTraits = [item.item_name];
  if (item.color) visualTraits.push(item.color);
  if (item.material) visualTraits.push(item.material);
  if (item.style) visualTraits.push(item.style);
  const imageQuery = encodeURIComponent(visualTraits.join(" ").trim());
  const bingThumbnailUrl = `https://www.bing.com/th?q=${imageQuery}&w=80&h=80&c=7&o=5&pid=1.7&mkt=en-US&cc=US&setlang=en&adlt=moderate`;
  const imagesUrl = `https://www.bing.com/images/search?q=${imageQuery}`;

  // Check if we have bounding box for cropping
  const hasBoundingBox = designImageUrl && item.bounding_box && !imageError;
  
  // For wall items with hex color, show a color swatch
  const hexColor = item.hex_code || (isHexColor(item.color || "") ? item.color : null);
  const showColorSwatch = isWallItem(item.item_type) && hexColor;

  // Calculate background styles to show the entire bounding box region
  const getCropBackgroundStyles = (): React.CSSProperties => {
    if (!item.bounding_box || !designImageUrl) return {};
    const { x, y, width, height } = item.bounding_box;
    
    // Scale so the bounding box fits within the container (contain behavior)
    const scaleX = 100 / width;
    const scaleY = 100 / height;
    const scale = Math.min(scaleX, scaleY, 4); // Cap at 4x zoom
    
    // Center of the bounding box - this point should be centered in container
    const bboxCenterX = x + width / 2;
    const bboxCenterY = y + height / 2;
    
    return {
      backgroundImage: `url(${designImageUrl})`,
      backgroundSize: `${scale * 100}%`,
      backgroundPosition: `${bboxCenterX}% ${bboxCenterY}%`,
      backgroundRepeat: 'no-repeat',
    };
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-background/80 border border-border/50 hover:border-primary/30 transition-colors">
      {/* Item thumbnail - prefer matched product image */}
      <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted border border-border/50 relative group/thumb cursor-pointer">
        {showColorSwatch ? (
          <div 
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: hexColor }}
          >
            <span className="text-[10px] font-mono text-white drop-shadow-md bg-black/30 px-1 rounded">
              {hexColor?.toUpperCase()}
            </span>
          </div>
        ) : item.product_photo_url && !imageError ? (
          <img 
            src={item.product_photo_url} 
            alt={displayName}
            className="w-full h-full object-contain bg-white"
            onError={() => setImageError(true)}
          />
        ) : matchedImage && !imageError ? (
          <img 
            src={matchedImage} 
            alt={displayName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : hasBoundingBox ? (
          <div 
            className="w-full h-full"
            style={getCropBackgroundStyles()}
          />
        ) : (
          <img 
            src={bingThumbnailUrl} 
            alt={item.item_name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
        
        {/* Expanded preview on hover */}
        {(item.product_photo_url || matchedImage || hasBoundingBox || !showColorSwatch) && (
          <div className="fixed left-1/2 top-4 -translate-x-1/2 w-80 h-80 md:w-96 md:h-96 rounded-xl overflow-hidden bg-background border-2 border-primary/30 shadow-2xl z-[100] opacity-0 scale-90 pointer-events-none group-hover/thumb:opacity-100 group-hover/thumb:scale-100 group-hover/thumb:pointer-events-auto transition-all duration-300">
            {item.product_photo_url && !imageError ? (
              <img 
                src={item.product_photo_url} 
                alt={displayName}
                className="w-full h-full object-contain bg-white p-4"
              />
            ) : matchedImage && !imageError ? (
              <img 
                src={matchedImage} 
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : hasBoundingBox ? (
              <div 
                className="w-full h-full"
                style={getCropBackgroundStyles()}
              />
            ) : (
              <img 
                src={bingThumbnailUrl} 
                alt={item.item_name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <p className="text-white text-sm font-medium truncate">{displayName}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{displayName}</span>
          {hasMatchedProduct && (
            <Badge variant="outline" className="text-xs border-green-500/30 text-green-600">
              <MapPin className="w-2.5 h-2.5 mr-0.5" />
              Local shop
            </Badge>
          )}
          {/* Show hex color for wall items */}
          {isWallItem(item.item_type) && (item.hex_code || item.color) && (
            <Badge 
              variant="secondary" 
              className="text-xs"
            >
              {hexColor ? (
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full border border-border/50"
                    style={{ backgroundColor: hexColor }}
                  />
                  <span className="font-mono">{hexColor.toUpperCase()}</span>
                </div>
              ) : (
                <span>🎨 {item.color}</span>
              )}
            </Badge>
          )}
          <Badge 
            variant="outline" 
            className={`text-xs ${priorityColors[item.priority]}`}
          >
            {item.priority}
          </Badge>
        </div>
        {/* Show matched product's style tags */}
        {item.matchedProduct?.ai_style_tags && item.matchedProduct.ai_style_tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {item.matchedProduct.ai_style_tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {item.item_description}
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {item.color && !isWallItem(item.item_type) && (
            <div className="flex items-center gap-1">
              {isHexColor(item.color) && (
                <div 
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-xs text-muted-foreground">{item.color}</span>
            </div>
          )}
          {item.material && (
            <span className="text-xs text-muted-foreground">
              {item.material}
            </span>
          )}
          {item.style && !hasMatchedProduct && (
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
