import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Store, X, CheckCircle2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
}

interface MatchedProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  style: string | null;
  price: number | null;
  currency: string | null;
  image_urls: string[] | null;
  source_url: string | null;
  ai_style_tags: string[] | null;
  ai_image_description: string | null;
  matchReasons: string[];
  matchScore: number;
}

interface ShopExistingProductsProps {
  item: DesignItem;
  onClose: () => void;
}

const computeMatchReasons = (
  product: any,
  item: DesignItem
): { reasons: string[]; score: number } => {
  const reasons: string[] = [];
  let score = 0;

  // Category match
  const itemType = item.item_type.toLowerCase();
  const prodCat = (product.category || "").toLowerCase();
  if (
    prodCat.includes(itemType) ||
    itemType.includes(prodCat) ||
    (itemType === "furniture" && ["furniture", "sofa", "bed", "storage"].includes(prodCat)) ||
    (itemType === "lighting" && prodCat === "lighting") ||
    (itemType === "textile" && prodCat === "textile") ||
    (itemType === "decor" && ["decor", "other"].includes(prodCat))
  ) {
    reasons.push(`Category match: ${product.category}`);
    score += 30;
  }

  // Style match
  const itemStyle = (item.style || "").toLowerCase();
  const prodStyle = (product.style || "").toLowerCase();
  const prodTags = (product.ai_style_tags || []).map((t: string) => t.toLowerCase());

  if (itemStyle && prodStyle && (prodStyle.includes(itemStyle) || itemStyle.includes(prodStyle))) {
    reasons.push(`Style match: ${product.style}`);
    score += 25;
  } else if (itemStyle && prodTags.some((t: string) => t.includes(itemStyle) || itemStyle.includes(t))) {
    reasons.push(`Style tag match: ${prodTags.find((t: string) => t.includes(itemStyle) || itemStyle.includes(t))}`);
    score += 20;
  }

  // Color match
  const itemColor = (item.color || "").toLowerCase();
  const prodDesc = (product.description || "").toLowerCase();
  const prodName = (product.name || "").toLowerCase();
  const prodAiDesc = (product.ai_image_description || "").toLowerCase();

  if (itemColor) {
    if (prodName.includes(itemColor) || prodDesc.includes(itemColor) || prodAiDesc.includes(itemColor)) {
      reasons.push(`Color match: ${item.color}`);
      score += 20;
    }
  }

  // Material match
  const itemMaterial = (item.material || "").toLowerCase();
  if (itemMaterial) {
    if (prodName.includes(itemMaterial) || prodDesc.includes(itemMaterial) || prodAiDesc.includes(itemMaterial)) {
      reasons.push(`Material match: ${item.material}`);
      score += 15;
    }
  }

  // Name/keyword overlap
  const itemWords = item.item_name.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const nameMatches = itemWords.filter(w => prodName.includes(w) || prodDesc.includes(w));
  if (nameMatches.length > 0) {
    reasons.push(`Keyword match: ${nameMatches.join(", ")}`);
    score += 10 * nameMatches.length;
  }

  // Minimum relevance - if no specific matches, note general availability
  if (reasons.length === 0) {
    reasons.push("Available in catalog");
    score += 5;
  }

  return { reasons, score };
};

const ShopExistingProducts = ({ item, onClose }: ShopExistingProductsProps) => {
  const [products, setProducts] = useState<MatchedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchingProducts = async () => {
      setLoading(true);
      try {
        // Build a broad query and filter/rank client-side
        const { data, error } = await supabase
          .from("shop_products")
          .select("*")
          .eq("is_active", true)
          .limit(50);

        if (error) throw error;

        // Compute match scores and reasons
        const scored = (data || [])
          .map((p) => {
            const { reasons, score } = computeMatchReasons(p, item);
            return { ...p, matchReasons: reasons, matchScore: score } as MatchedProduct;
          })
          .filter((p) => p.matchScore >= 10) // Filter out very low matches
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 8);

        setProducts(scored);
      } catch (err) {
        console.error("Error fetching matching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchingProducts();
  }, [item]);

  return (
    <div className="mt-2 p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Matching Products from Catalog</span>
          {!loading && (
            <Badge variant="secondary" className="text-xs">
              {products.length} found
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          No matching products found in the catalog for this item.
        </p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex gap-3 p-2 rounded-md bg-background border border-border/50 hover:border-primary/30 transition-colors"
            >
              {/* Product image */}
              <div className="flex-shrink-0 w-14 h-14 rounded overflow-hidden bg-muted">
                {product.image_urls?.[0] ? (
                  <img
                    src={product.image_urls[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium truncate">{product.name}</span>
                  {product.price && (
                    <span className="text-xs font-semibold text-primary flex-shrink-0">
                      {product.currency === "EUR" ? "€" : product.currency}
                      {product.price}
                    </span>
                  )}
                </div>

                {/* Match reasons */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {product.matchReasons.map((reason, idx) => {
                    const reasonLower = reason.toLowerCase();
                    const colorClass = reasonLower.includes("category")
                      ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                      : reasonLower.includes("style")
                      ? "bg-purple-500/10 text-purple-700 border-purple-500/20"
                      : reasonLower.includes("color")
                      ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                      : reasonLower.includes("material")
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                      : reasonLower.includes("keyword")
                      ? "bg-rose-500/10 text-rose-700 border-rose-500/20"
                      : "bg-muted text-muted-foreground border-border";

                    return (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full border ${colorClass}`}
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {reason}
                      </span>
                    );
                  })}
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    Score: {product.matchScore}%
                  </span>
                </div>

                {/* AI style tags */}
                {product.ai_style_tags && product.ai_style_tags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {product.ai_style_tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-[9px] px-1 py-0 h-4">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* View button */}
              {product.source_url && product.source_url !== "#" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs flex-shrink-0 self-center"
                  onClick={() => window.open(product.source_url!, "_blank")}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopExistingProducts;
