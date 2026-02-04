import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Package } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  category?: string;
  style?: string;
}

interface ProductCardProps {
  product: Product;
}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({ product }, ref) => {
    return (
      <Card ref={ref} className="group hover:shadow-lg transition-all duration-300 hover:border-primary/30 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-3">
            {product.imageUrl ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-primary/60" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
                {product.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {product.description}
              </p>
              {product.price && (
                <p className="text-sm font-semibold text-primary mt-1">
                  {product.currency === "EUR" ? "€" : product.currency} {product.price.toFixed(2)}
                </p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{product.source}</span>
                {product.url && product.url !== "#" && (
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);
ProductCard.displayName = "ProductCard";

export default ProductCard;
