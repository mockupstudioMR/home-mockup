import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExternalLink, Store, X, CheckCircle2, Sparkles, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const categoryFromItemType = (itemType: string): string => {
  const map: Record<string, string> = {
    furniture: "furniture",
    lighting: "lighting",
    textile: "textile",
    decor: "decor",
    wall_color: "decor",
    floor_material: "furniture",
    architectural: "other",
  };
  return map[itemType] || "other";
};

// Common filler words to exclude from matching
const FILLER_WORDS = new Set([
  "a", "an", "the", "and", "or", "of", "in", "on", "for", "to", "with",
  "light", "dark", "small", "large", "big", "new", "old", "set",
  "white", "black", "brown", "grey", "gray", "beige", "cream", "blue",
  "green", "red", "yellow", "pink", "orange", "gold", "silver",
]);

const computeMatchReasons = (
  product: any,
  item: DesignItem
): { reasons: string[]; score: number } => {
  const reasons: string[] = [];
  let score = 0;

  const itemName = item.item_name.toLowerCase();
  const itemType = (item.item_type || "").toLowerCase();
  const prodCat = (product.category || "").toLowerCase();
  const prodName = (product.name || "").toLowerCase();
  const prodDesc = (product.description || "").toLowerCase();
  const prodAiDesc = (product.ai_image_description || "").toLowerCase();
  const allProdText = `${prodName} ${prodCat} ${prodDesc} ${prodAiDesc}`;

  // 1. Primary: match the core product type (e.g., "sideboard", "chair", "lamp")
  //    Extract meaningful type keywords (>3 chars, not filler/color words)
  const typeKeywords = itemName
    .split(/\s+/)
    .filter(w => w.length > 3 && !FILLER_WORDS.has(w));

  // Check for full item name match first (strongest signal)
  if (allProdText.includes(itemName)) {
    reasons.push(`Type match: ${item.item_name}`);
    score += 50;
  } else {
    // Check for meaningful keyword matches — require the most specific word
    const matchedKeywords = typeKeywords.filter(kw => allProdText.includes(kw));
    if (matchedKeywords.length > 0) {
      reasons.push(`Type match: ${matchedKeywords.join(", ")}`);
      score += 20 + (matchedKeywords.length * 10);
    }
  }

  // 2. Also check item_type against product category
  if (itemType && (prodCat.includes(itemType) || itemType.includes(prodCat))) {
    if (!reasons.some(r => r.startsWith("Type match"))) {
      reasons.push(`Type match: ${itemType}`);
      score += 15;
    }
  }

  // 3. Style matching
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

  // 4. Color matching
  const itemColor = (item.color || "").toLowerCase();
  if (itemColor && itemColor.length > 2) {
    if (allProdText.includes(itemColor)) {
      reasons.push(`Color match: ${item.color}`);
      score += 15;
    }
  }

  // 5. Material matching
  const itemMaterial = (item.material || "").toLowerCase();
  if (itemMaterial && itemMaterial.length > 2) {
    if (allProdText.includes(itemMaterial)) {
      reasons.push(`Material match: ${item.material}`);
      score += 15;
    }
  }

  return { reasons, score };
};

const AddProductDialog = ({ item, onProductAdded }: { item: DesignItem; onProductAdded: () => void }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: item.item_name,
    description: item.item_description,
    category: categoryFromItemType(item.item_type),
    style: item.style || "",
    price: "",
    currency: "EUR",
    source_url: "",
    image_url: "",
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { error } = await supabase.from("shop_products").insert({
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        style: form.style || null,
        price: form.price ? parseFloat(form.price) : null,
        currency: form.currency,
        source_url: form.source_url || null,
        image_urls: form.image_url ? [form.image_url] : [],
        shop_id: user.id,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Product added to catalog!");
      setOpen(false);
      onProductAdded();
    } catch (err: any) {
      console.error("Error adding product:", err);
      toast.error(err.message || "Failed to add product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
          <Plus className="w-3 h-3" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Product to Catalog
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="text-sm min-h-[60px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Style</Label>
              <Input
                value={form.style}
                onChange={(e) => setForm({ ...form, style: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Price</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Currency</Label>
              <Input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Product URL</Label>
            <Input
              value={form.source_url}
              onChange={(e) => setForm({ ...form, source_url: e.target.value })}
              placeholder="https://..."
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Image URL</Label>
            <Input
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
              className="h-8 text-sm"
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Add to Catalog"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ShopExistingProducts = ({ item, onClose }: ShopExistingProductsProps) => {
  const [products, setProducts] = useState<MatchedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchMatchingProducts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("shop_products")
          .select("*")
          .eq("is_active", true)
          .limit(50);

        if (error) throw error;

        const scored = (data || [])
          .map((p) => {
            const { reasons, score } = computeMatchReasons(p, item);
            return { ...p, matchReasons: reasons, matchScore: score } as MatchedProduct;
          })
          .filter((p) => p.matchReasons.some(r => r.toLowerCase().startsWith("type match")))
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
  }, [item, refreshKey]);

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
        <div className="flex items-center gap-1">
          <AddProductDialog item={item} onProductAdded={() => setRefreshKey(k => k + 1)} />
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            No matching products found in the catalog for this item.
          </p>
          <p className="text-[10px] text-muted-foreground">
            Use the "Add Product" button above to add one.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex gap-3 p-2 rounded-md bg-background border border-border/50 hover:border-primary/30 transition-colors"
            >
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

                <div className="flex flex-wrap gap-1 mt-1">
                  {product.matchReasons.filter(r => r.toLowerCase().startsWith("type match")).map((reason, idx) => {
                    const reasonLower = reason.toLowerCase();
                    const colorClass = reasonLower.includes("type")
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
