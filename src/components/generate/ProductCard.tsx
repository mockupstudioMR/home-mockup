import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ShoppingBag } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-1">{product.title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {product.description || "View on WestwingNow for details"}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">{product.source}</span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-primary"
                asChild
              >
                <a href={product.url} target="_blank" rel="noopener noreferrer">
                  View <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
