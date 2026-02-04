import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, Check, ExternalLink, Image } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DesignItem {
  id: string;
  item_type: string;
  item_name: string;
  item_description: string;
  color?: string;
  material?: string;
  style?: string;
  priority: "essential" | "recommended" | "optional";
}

interface OrderCustomMadeSheetProps {
  item: DesignItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const itemTypeLabels: Record<string, string> = {
  wall_color: "Wall Color",
  floor_material: "Flooring",
  furniture: "Furniture",
  lighting: "Lighting",
  textile: "Textile",
  decor: "Decor",
  architectural: "Architectural Element",
};

const OrderCustomMadeSheet = ({ item, open, onOpenChange }: OrderCustomMadeSheetProps) => {
  const [copied, setCopied] = useState(false);

  if (!item) return null;

  // Build search queries
  const visualTraits = [item.item_name];
  if (item.color) visualTraits.push(item.color);
  if (item.material) visualTraits.push(item.material);
  if (item.style) visualTraits.push(item.style);
  const searchQuery = visualTraits.join(" ").trim();
  const encodedQuery = encodeURIComponent(searchQuery);
  const thumbnailUrl = `https://www.bing.com/th?q=${encodedQuery}&w=200&h=200&c=7&o=5&pid=1.7&mkt=en-US&cc=US&setlang=en&adlt=moderate`;
  const imagesUrl = `https://www.bing.com/images/search?q=${encodedQuery}`;

  // Build specification text for copying
  const specText = `
ITEM SPECIFICATIONS
==================
Type: ${itemTypeLabels[item.item_type] || item.item_type}
Name: ${item.item_name}
${item.color ? `Color: ${item.color}` : ""}
${item.material ? `Material: ${item.material}` : ""}
${item.style ? `Style: ${item.style}` : ""}
Priority: ${item.priority}

Description:
${item.item_description}

Search terms: ${searchQuery}
  `.trim();

  const handleCopySpecs = async () => {
    await navigator.clipboard.writeText(specText);
    setCopied(true);
    toast.success("Specifications copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Order Custom Made</SheetTitle>
          <SheetDescription>
            Use these specifications to order a custom piece from your preferred craftsman or manufacturer.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Visual reference */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Visual Reference</h4>
            <div className="aspect-square w-full max-w-[200px] rounded-lg overflow-hidden bg-muted border border-border">
              <img 
                src={thumbnailUrl} 
                alt={item.item_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full max-w-[200px]"
              onClick={() => window.open(imagesUrl, "_blank")}
            >
              <Image className="w-4 h-4 mr-2" />
              View More References
              <ExternalLink className="w-3 h-3 ml-2" />
            </Button>
          </div>

          <Separator />

          {/* Item details */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Item Type</h4>
              <Badge variant="secondary">{itemTypeLabels[item.item_type] || item.item_type}</Badge>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Name</h4>
              <p className="font-semibold">{item.item_name}</p>
            </div>

            {item.color && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Color</h4>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-md border border-border"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-mono text-sm">{item.color.toUpperCase()}</span>
                </div>
              </div>
            )}

            {item.material && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Material</h4>
                <p>{item.material}</p>
              </div>
            )}

            {item.style && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Style</h4>
                <Badge variant="outline">{item.style}</Badge>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Priority</h4>
              <Badge 
                variant="outline"
                className={
                  item.priority === "essential" 
                    ? "bg-destructive/10 text-destructive border-destructive/30"
                    : item.priority === "recommended"
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-muted text-muted-foreground border-border"
                }
              >
                {item.priority}
              </Badge>
            </div>

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
              <p className="text-sm leading-relaxed">{item.item_description}</p>
            </div>
          </div>

          <Separator />

          {/* Search terms */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Search Terms</h4>
            <p className="text-sm bg-muted p-3 rounded-md font-mono">{searchQuery}</p>
          </div>

          {/* Copy button */}
          <Button 
            className="w-full" 
            onClick={handleCopySpecs}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy All Specifications
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default OrderCustomMadeSheet;
