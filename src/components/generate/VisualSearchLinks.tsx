import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Search, Sofa, Lamp, Palette, Frame, Layers } from "lucide-react";

interface VisualSearchLinksProps {
  stylePreference?: string;
  roomType?: string;
  colorPalette?: string;
  mustHaveElements?: string[];
  accentFurniture?: string;
  materials?: string[];
}

interface SearchItem {
  name: string;
  query: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

const VisualSearchLinks = ({
  stylePreference,
  roomType,
  colorPalette,
  mustHaveElements,
  accentFurniture,
  materials,
}: VisualSearchLinksProps) => {
  const style = stylePreference?.replace(/-/g, " ") || "modern";
  const room = roomType || "living room";

  // Build search items based on available data
  const searchItems: SearchItem[] = [];

  // Add accent furniture search
  if (accentFurniture) {
    searchItems.push({
      name: accentFurniture,
      query: `${accentFurniture} ${style} ${room}`,
      icon: Sofa,
      category: "Furniture",
    });
  }

  // Add style-based furniture searches
  const styleFurniture: Record<string, string[]> = {
    "modern minimal": ["minimalist sofa", "scandinavian armchair", "floating shelf"],
    "classic historical": ["chesterfield sofa", "antique armoire", "tufted ottoman"],
    "bohemian eclectic": ["rattan peacock chair", "moroccan pouf", "macrame wall hanging"],
    "rustic nature": ["live edge wood table", "leather armchair", "woven basket"],
    "mediterranean": ["wrought iron daybed", "terracotta planter", "arched mirror"],
    "glam luxe": ["velvet sofa", "mirrored console", "crystal chandelier"],
  };

  const furnitureForStyle = styleFurniture[style] || styleFurniture["modern minimal"];
  furnitureForStyle.forEach((item) => {
    if (!accentFurniture?.toLowerCase().includes(item.toLowerCase())) {
      searchItems.push({
        name: item.charAt(0).toUpperCase() + item.slice(1),
        query: `${item} ${style} interior design`,
        icon: Sofa,
        category: "Furniture",
      });
    }
  });

  // Add lighting based on style
  const styleLighting: Record<string, string> = {
    "modern minimal": "minimalist pendant lamp",
    "classic historical": "crystal chandelier",
    "bohemian eclectic": "moroccan lantern",
    "rustic nature": "industrial floor lamp",
    "mediterranean": "wrought iron sconce",
    "glam luxe": "art deco chandelier",
  };

  const lighting = styleLighting[style] || "pendant lamp";
  searchItems.push({
    name: lighting.charAt(0).toUpperCase() + lighting.slice(1),
    query: `${lighting} ${room}`,
    icon: Lamp,
    category: "Lighting",
  });

  // Add color-based textile search
  if (colorPalette) {
    const textileQueries: Record<string, string> = {
      neutral: "beige linen curtains",
      cool: "blue velvet cushions",
      warm: "terracotta throw blanket",
      bold: "colorful patterned rug",
      monochrome: "black white geometric rug",
    };
    const textile = textileQueries[colorPalette] || "decorative cushions";
    searchItems.push({
      name: textile.charAt(0).toUpperCase() + textile.slice(1),
      query: `${textile} ${style} ${room}`,
      icon: Palette,
      category: "Textiles",
    });
  }

  // Add material-based searches
  if (materials && materials.length > 0) {
    const primaryMaterial = materials[0];
    searchItems.push({
      name: `${primaryMaterial.charAt(0).toUpperCase() + primaryMaterial.slice(1)} Decor`,
      query: `${primaryMaterial} home decor ${style}`,
      icon: Layers,
      category: "Materials",
    });
  }

  // Add must-have elements
  if (mustHaveElements && mustHaveElements.length > 0) {
    mustHaveElements.slice(0, 2).forEach((element) => {
      searchItems.push({
        name: element,
        query: `${element} ${style} ${room} interior`,
        icon: Frame,
        category: "Decor",
      });
    });
  }

  const buildBingImagesUrl = (query: string): string => {
    return `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
  };

  const handleSearch = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Limit to 8 items max for cleaner UI
  const displayItems = searchItems.slice(0, 8);

  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="w-4 h-4 text-primary" />
          Find Similar Items
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Search for furniture and decor matching your style
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {displayItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="h-auto py-2 px-3 justify-start text-left hover:bg-primary/5 hover:border-primary/30 transition-colors"
                onClick={() => handleSearch(buildBingImagesUrl(item.query))}
              >
                <IconComponent className="w-3.5 h-3.5 mr-2 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{item.name}</div>
                  <div className="text-[10px] text-muted-foreground">{item.category}</div>
                </div>
                <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0 opacity-50" />
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default VisualSearchLinks;
