import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExternalLink, Store, X, CheckCircle2, Sparkles, Plus, Bug, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DEFAULT_WEIGHTS, type MatchingWeights } from "@/components/admin/ProductMatchingWeights";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  type: string;
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

const typeFromItemType = (itemType: string): string => {
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

// Valid item type keywords for type matching – derived from prompt templates & room furniture config
// IMPORTANT: Multi-word phrases MUST come before their single-word parts so they match first.
// Item types: wall_color, floor_material, furniture, lighting, textile, decor, architectural
// Product categories: sofa, chair, table, bed, storage, lighting, decor, rug, outdoor, other

// Multi-word keywords that must be checked BEFORE splitting into single words
const MULTI_WORD_KEYWORDS = [
  // Table subtypes
  "coffee table", "dining table", "side table", "console table", "end table",
  "bedside table", "accent table", "cocktail table", "nesting table",
  "couchtisch", "esstisch", "beistelltisch", "konsolentisch",
  // Seating subtypes
  "bar stool", "dining chair", "office chair", "lounge chair", "rocking chair",
  // Lighting subtypes
  "floor lamp", "desk lamp", "table lamp", "bedside lamp", "wall light",
  "pendant light", "ceiling light",
  "stehlampe", "tischlampe", "schreibtischlampe",
  // Furniture subtypes
  "tv stand", "media console", "display cabinet",
];

const SINGLE_WORD_KEYWORDS = new Set([
  // Furniture
  "sofa", "couch", "settee", "armchair", "chair", "stool", "bench", "ottoman",
  "table", "desk", "nightstand", "sideboard", "dresser", "wardrobe", "closet",
  "bookshelf", "shelf", "shelving", "cabinet", "credenza", "buffet", "vitrine",
  "bed", "mattress", "headboard", "footboard",
  // Lighting
  "lamp", "chandelier", "sconce", "pendant", "lantern", "spotlight",
  // Textiles
  "rug", "carpet", "curtain", "curtains", "drape", "cushion", "pillow", "throw", "blanket",
  // Decor
  "mirror", "vase", "planter", "artwork", "painting", "sculpture", "candle",
  "clock", "plant", "plants", "basket", "tray", "bowl", "frame",
  // Bathroom
  "toilet", "sink", "vanity", "bathtub", "shower",
  // Architectural
  "fireplace", "molding", "door", "window",
  // Surfaces
  "backsplash", "countertop",
  // German equivalents
  "kommode", "stuhl", "sessel", "tisch", "schreibtisch", "lampe", "leuchte",
  "regal", "bücherregal", "bett", "spiegel", "teppich", "vorhang", "gardine",
  "kissen", "kleiderschrank", "schrank", "hocker", "bank", "sitzbank",
  "übertopf", "blumentopf", "modulsofa", "sofaserie", "fauteuil",
]);

// Combined set for backward-compat checks (includes both multi and single)
const VALID_TYPE_KEYWORDS = new Set([...MULTI_WORD_KEYWORDS, ...SINGLE_WORD_KEYWORDS]);

/** Extract type keywords from text, preferring multi-word phrases over single words */
const extractTypeKeywords = (text: string): string[] => {
  const normalized = text.toLowerCase().trim();
  const found: string[] = [];
  let remaining = normalized;

  // First pass: extract multi-word phrases (longest first)
  const sortedMulti = [...MULTI_WORD_KEYWORDS].sort((a, b) => b.length - a.length);
  for (const phrase of sortedMulti) {
    if (includesWholeWord(remaining, phrase)) {
      found.push(phrase);
      // Remove the matched phrase so its individual words don't match again
      remaining = remaining.replace(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ');
    }
  }

  // Second pass: extract remaining single-word keywords
  const words = remaining.split(/\s+/).filter(w => w.length > 2);
  for (const w of words) {
    if (SINGLE_WORD_KEYWORDS.has(w) && !found.some(f => f.includes(w))) {
      found.push(w);
    }
  }

  return found;
};

// Synonym groups for cross-language and variant matching
// Each group contains words that should match each other
const SYNONYM_GROUPS: string[][] = [
  ["sideboard", "kommode", "chest", "dresser", "credenza", "buffet", "cabinet"],
  ["vitrine", "display cabinet", "showcase", "glass cabinet"],
  ["sofa", "couch", "settee", "modulsofa", "sofaserie"],
  ["chair", "stuhl", "sessel", "armchair", "fauteuil", "lounge chair"],
  ["coffee table", "couchtisch", "cocktail table"],
  ["dining table", "esstisch"],
  ["side table", "end table", "beistelltisch", "accent table"],
  ["console table", "konsolentisch"],
  ["desk", "schreibtisch"],
  ["lamp", "lampe", "leuchte", "light fixture", "floor lamp", "stehlampe"],
  ["shelf", "regal", "shelving", "bookshelf", "bücherregal"],
  ["bed", "bett"],
  ["mirror", "spiegel"],
  ["rug", "teppich", "carpet"],
  ["curtain", "vorhang", "drape", "gardine"],
  ["cushion", "kissen", "pillow"],
  ["wardrobe", "kleiderschrank", "closet", "schrank"],
  ["stool", "hocker"],
  ["bench", "bank", "sitzbank"],
  ["fluted", "geriffelt", "gerillt", "ribbed"],
  ["vase", "planter", "übertopf", "blumentopf"],
];

// Build a lookup: word → set of synonyms
const SYNONYM_MAP = new Map<string, Set<string>>();
for (const group of SYNONYM_GROUPS) {
  const groupSet = new Set(group);
  for (const word of group) {
    const existing = SYNONYM_MAP.get(word);
    if (existing) {
      for (const w of groupSet) existing.add(w);
    } else {
      SYNONYM_MAP.set(word, new Set(groupSet));
    }
  }
}

const getExpandedKeywords = (keywords: string[]): string[] => {
  const expanded = new Set(keywords);
  for (const kw of keywords) {
    const synonyms = SYNONYM_MAP.get(kw);
    if (synonyms) {
      for (const syn of synonyms) expanded.add(syn);
    }
  }
  return Array.from(expanded);
};

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

/** Check if a keyword appears as a whole word (not a substring) in text */
const includesWholeWord = (text: string, keyword: string): boolean => {
  const regex = new RegExp(`(?:^|\\s|[^a-z])${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|\\s|[^a-z])`, "i");
  return regex.test(` ${text} `);
};

const normalizeUrl = (value: string): string =>
  value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "")
    .trim();

const STRICT_TYPE_KEYWORDS: Record<string, string[]> = {
  sofa: ["sofa", "couch", "settee", "modulsofa", "sofaserie"],
  bed: ["bed", "bett", "mattress", "headboard", "footboard"],
  table: ["table", "tisch", "desk", "schreibtisch", "nightstand"],
  chair: ["chair", "stuhl", "sessel", "armchair", "fauteuil", "stool", "bench"],
  storage: ["wardrobe", "closet", "schrank", "cabinet", "sideboard", "kommode", "dresser", "bookshelf", "shelf", "regal"],
  lighting: ["lamp", "lampe", "leuchte", "chandelier", "sconce", "pendant", "light"],
  rug: ["rug", "teppich", "carpet"],
  textile: ["curtain", "vorhang", "drape", "cushion", "pillow", "blanket", "throw"],
  decor: ["mirror", "spiegel", "vase", "planter", "artwork", "painting", "sculpture", "clock", "tray", "bowl", "frame"],
};

const getStrictExpectedProductTypes = (item: DesignItem): string[] => {
  const text = normalizeText(`${item.item_name} ${item.item_description || ""}`);
  const expected = new Set<string>();

  for (const [type, keywords] of Object.entries(STRICT_TYPE_KEYWORDS)) {
    if (keywords.some((kw) => includesWholeWord(text, kw))) {
      expected.add(type);
    }
  }

  if (expected.size > 0) return Array.from(expected);

  // Fallback by broad extracted item type when no strict clue is present
  const broadFallback: Record<string, string[]> = {
    furniture: ["sofa", "chair", "table", "bed", "storage", "outdoor"],
    lighting: ["lighting"],
    textile: ["textile", "rug"],
    decor: ["decor", "other"],
  };

  return broadFallback[item.item_type?.toLowerCase()] || [];
};

const getProductDedupKey = (product: Pick<MatchedProduct, "name" | "source_url">): string => {
  const normalizedName = normalizeText(product.name || "");
  const normalizedSource = product.source_url ? normalizeUrl(product.source_url) : "no-source";
  return `${normalizedName}|${normalizedSource}`;
};

const dedupeProducts = (items: MatchedProduct[]): MatchedProduct[] => {
  const seen = new Set<string>();
  const deduped: MatchedProduct[] = [];

  for (const item of items) {
    const key = getProductDedupKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
};

const computeMatchReasons = (
  product: any,
  item: DesignItem,
  w: MatchingWeights = DEFAULT_WEIGHTS
): { reasons: string[]; score: number } => {
  const reasons: string[] = [];
  let score = 0;

  const itemName = item.item_name.toLowerCase();
  const itemType = (item.item_type || "").toLowerCase();
  const prodType = ((product as any).type || "").toLowerCase();
  const prodName = (product.name || "").toLowerCase();
  const prodDesc = (product.description || "").toLowerCase();
  const prodAiDesc = (product.ai_image_description || "").toLowerCase();
  const allProdText = `${prodName} ${prodType} ${prodDesc} ${prodAiDesc}`;

  // 1. Primary: match the core product type using only known item type keywords
  const typeKeywords = itemName
    .split(/\s+/)
    .filter(w => w.length > 2 && VALID_TYPE_KEYWORDS.has(w));

  // Expand keywords with synonyms for cross-language matching
  const expandedKeywords = getExpandedKeywords(typeKeywords);

  // Check for full item name match first (strongest signal)
  if (includesWholeWord(allProdText, itemName)) {
    reasons.push(`Type match: ${item.item_name}`);
    score += w.fullNameMatch;
    if (includesWholeWord(prodName, itemName)) {
      score += w.nameFieldBonus;
    }
  } else {
    // Check for meaningful keyword matches (including synonyms)
    const matchedKeywords = expandedKeywords.filter(kw => includesWholeWord(allProdText, kw));
    // Also track which original keywords led to matches
    const matchedOriginals = typeKeywords.filter(kw => {
      if (includesWholeWord(allProdText, kw)) return true;
      const syns = SYNONYM_MAP.get(kw);
      return syns && Array.from(syns).some(s => includesWholeWord(allProdText, s));
    });
    if (matchedKeywords.length > 0) {
      const displayTerms = matchedOriginals.length > 0 ? matchedOriginals : matchedKeywords.slice(0, 3);
      reasons.push(`Type match: ${displayTerms.join(", ")}`);
      score += w.keywordBase + (matchedKeywords.length * w.keywordPerMatch);
      const nameMatchCount = expandedKeywords.filter(kw => includesWholeWord(prodName, kw)).length;
      if (nameMatchCount > 0) {
        score += w.keywordInNameBase + (nameMatchCount * w.keywordInNamePer);
      }
    }
  }

  // 2. Also check item_type against product type (strict whole-word only)
  const BROAD_CATEGORIES = new Set(["furniture", "other", "decor"]);
  if (itemType && !BROAD_CATEGORIES.has(itemType) && !BROAD_CATEGORIES.has(prodType)) {
    if (includesWholeWord(prodType, itemType) || includesWholeWord(itemType, prodType)) {
      if (!reasons.some(r => r.startsWith("Type match"))) {
        reasons.push(`Type match: ${itemType}`);
        score += w.typeMatch;
      }
    }
  }

  // 3. Style matching
  const itemStyle = (item.style || "").toLowerCase();
  const prodStyle = (product.style || "").toLowerCase();
  const prodTags = (product.ai_style_tags || []).map((t: string) => t.toLowerCase());

  if (itemStyle && prodStyle && (prodStyle.includes(itemStyle) || itemStyle.includes(prodStyle))) {
    reasons.push(`Style match: ${product.style}`);
    score += w.styleMatchDirect;
  } else if (itemStyle && prodTags.some((t: string) => t.includes(itemStyle) || itemStyle.includes(t))) {
    reasons.push(`Style tag match: ${prodTags.find((t: string) => t.includes(itemStyle) || itemStyle.includes(t))}`);
    score += w.styleMatchTag;
  }

  // 4. Color matching (text fields + extracted color names from metadata)
  const itemColor = (item.color || "").toLowerCase();
  if (itemColor && itemColor.length > 2) {
    let colorMatched = false;
    // Check product text fields
    if (includesWholeWord(allProdText, itemColor)) {
      colorMatched = true;
    }
    // Also check AI-extracted color names from product metadata
    if (!colorMatched) {
      const extractedColors = (product.metadata as any)?.extracted_colors as Array<{ name: string }> | undefined;
      if (extractedColors?.length) {
        const extractedColorNames = extractedColors.map(c => c.name.toLowerCase());
        if (extractedColorNames.some(cn => cn.includes(itemColor) || itemColor.includes(cn))) {
          colorMatched = true;
        }
      }
    }
    if (colorMatched) {
      reasons.push(`Color match: ${item.color}`);
      score += w.colorMatch;
    }
  }

  // 5. Material matching
  const itemMaterial = (item.material || "").toLowerCase();
  if (itemMaterial && itemMaterial.length > 2) {
    if (includesWholeWord(allProdText, itemMaterial)) {
      reasons.push(`Material match: ${item.material}`);
      score += w.materialMatch;
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
    type: typeFromItemType(item.item_type),
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
        type: form.type,
        style: form.style || null,
        price: form.price ? parseFloat(form.price) : null,
        currency: form.currency,
        source_url: form.source_url || null,
        image_urls: form.image_url ? [form.image_url] : [],
        shop_id: user.id,
        is_active: true,
      } as any);

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
              <Label className="text-xs">Type</Label>
              <Input
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
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

interface DebugInfo {
  extractedKeywords: string[];
  expandedKeywords: string[];
  strictExpectedTypes: string[];
  dbResultsCount: number;
  afterStrictFilterCount: number;
  afterScoringCount: number;
  afterDedupCount: number;
  weights: MatchingWeights;
  rejectedProducts: { name: string; type: string; reason: string }[];
  scoredProducts: { name: string; type: string; score: number; reasons: string[] }[];
}

const ShopExistingProducts = ({ item, onClose }: ShopExistingProductsProps) => {
  const [products, setProducts] = useState<MatchedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  useEffect(() => {
    const fetchMatchingProducts = async () => {
      setLoading(true);
      const debug: DebugInfo = {
        extractedKeywords: [],
        expandedKeywords: [],
        strictExpectedTypes: [],
        dbResultsCount: 0,
        afterStrictFilterCount: 0,
        afterScoringCount: 0,
        afterDedupCount: 0,
        weights: DEFAULT_WEIGHTS,
        rejectedProducts: [],
        scoredProducts: [],
      };

      try {
        // Fetch dynamic weights from cms_content
        let weights = DEFAULT_WEIGHTS;
        try {
          const { data: weightsData } = await supabase
            .from("cms_content")
            .select("value")
            .eq("key", "product_matching_weights")
            .eq("content_type", "config")
            .maybeSingle();
          if (weightsData?.value) {
            weights = { ...DEFAULT_WEIGHTS, ...JSON.parse(weightsData.value) };
          }
        } catch (e) {
          console.warn("Could not load matching weights, using defaults");
        }
        debug.weights = weights;

        // Build a targeted query using item name keywords + synonyms for server-side filtering
        const itemNameLower = item.item_name.toLowerCase();
        const searchKeywords = itemNameLower
          .split(/\s+/)
          .filter(w => w.length > 2 && VALID_TYPE_KEYWORDS.has(w));
        debug.extractedKeywords = [...searchKeywords];

        // Expand with synonyms for cross-language matching
        const expandedSearchKeywords = getExpandedKeywords(searchKeywords);
        debug.expandedKeywords = [...expandedSearchKeywords];

        // First try: search by keywords (including synonyms) in name/type/description
        let data: any[] = [];
        let error: any = null;

        if (expandedSearchKeywords.length > 0) {
          const orFilter = expandedSearchKeywords
            .map(kw => `name.ilike.%${kw}%,type.ilike.%${kw}%,description.ilike.%${kw}%,ai_image_description.ilike.%${kw}%`)
            .join(",");

          const result = await supabase
            .from("shop_products")
            .select("*")
            .eq("is_active", true)
            .or(orFilter)
            .limit(50);

          data = result.data || [];
          error = result.error;
        }

        // Fallback: if no targeted results, fetch by type
        if (data.length === 0) {
          const expectedType = typeFromItemType(item.item_type);
          const result = await (supabase
            .from("shop_products")
            .select("*")
            .eq("is_active", true) as any)
            .eq("type", expectedType)
            .limit(50);

          data = result.data || [];
          error = result.error;
        }

        if (error) throw error;
        debug.dbResultsCount = data.length;

        const strictExpectedTypes = getStrictExpectedProductTypes(item);
        debug.strictExpectedTypes = [...strictExpectedTypes];

        const strictFilteredData = strictExpectedTypes.length > 0
          ? (data || []).filter((p) => {
              const pType = (p.type || "").toLowerCase();
              const pass = strictExpectedTypes.includes(pType);
              if (!pass) {
                debug.rejectedProducts.push({ name: p.name, type: pType, reason: `type "${pType}" not in [${strictExpectedTypes.join(", ")}]` });
              }
              return pass;
            })
          : (data || []);
        debug.afterStrictFilterCount = strictFilteredData.length;

        const scored = strictFilteredData
          .map((p) => {
            const { reasons, score } = computeMatchReasons(p, item, weights);
            debug.scoredProducts.push({ name: p.name, type: (p.type || ""), score, reasons: [...reasons] });
            return { ...p, matchReasons: reasons, matchScore: score } as MatchedProduct;
          })
          .filter((p) => {
            const hasTypeMatch = p.matchReasons.some(r => r.toLowerCase().startsWith("type match"));
            const meetsMin = p.matchScore >= weights.minimumScore;
            if (!hasTypeMatch || !meetsMin) {
              debug.rejectedProducts.push({
                name: p.name,
                type: p.type,
                reason: !hasTypeMatch ? `no "Type match" reason` : `score ${p.matchScore} < min ${weights.minimumScore}`
              });
            }
            return hasTypeMatch && meetsMin;
          })
          .sort((a, b) => b.matchScore - a.matchScore);

        const deduped = dedupeProducts(scored);
        debug.afterScoringCount = scored.length;
        debug.afterDedupCount = deduped.length;
        setProducts(deduped.slice(0, 8));
      } catch (err) {
        console.error("Error fetching matching products:", err);
      } finally {
        setDebugInfo(debug);
        setLoading(false);
      }
    };

    fetchMatchingProducts();
  }, [item, refreshKey]);

  // Defensive dedupe at render time too (protects against transient duplicate states)
  const visibleProducts = dedupeProducts(products);

  return (
    <div className="mt-2 p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Matching Products from Catalog</span>
          {!loading && (
            <Badge variant="secondary" className="text-xs">
              {visibleProducts.length} found
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
      ) : visibleProducts.length === 0 ? (
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
          {visibleProducts.map((product) => (
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

      {/* Debug Panel */}
      {debugInfo && !loading && (
        <MatchDebugPanel debug={debugInfo} item={item} />
      )}
    </div>
  );
};

const MatchDebugPanel = ({ debug, item }: { debug: DebugInfo; item: DesignItem }) => {
  const [open, setOpen] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const [showScored, setShowScored] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center gap-2 p-2 rounded-md border border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/40 transition-colors text-xs text-muted-foreground">
          <Bug className="w-3.5 h-3.5" />
          <span className="font-medium">Match Debug</span>
          <span className="ml-auto">{open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 p-3 rounded-md border border-dashed border-muted-foreground/20 bg-muted/10 space-y-3 text-xs font-mono">
          {/* Step 1: Input */}
          <div>
            <p className="font-semibold text-muted-foreground mb-1">① Input</p>
            <p>item_name: <span className="text-foreground">"{item.item_name}"</span></p>
            <p>item_type: <span className="text-foreground">"{item.item_type}"</span></p>
            <p>style: <span className="text-foreground">"{item.style || "—"}"</span> | color: <span className="text-foreground">"{item.color || "—"}"</span> | material: <span className="text-foreground">"{item.material || "—"}"</span></p>
          </div>

          {/* Step 2: Keyword extraction */}
          <div>
            <p className="font-semibold text-muted-foreground mb-1">② Extracted Keywords (from VALID_TYPE_KEYWORDS)</p>
            {debug.extractedKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {debug.extractedKeywords.map((kw, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 border border-blue-500/20">{kw}</span>
                ))}
              </div>
            ) : (
              <p className="text-amber-600">⚠ No keywords matched VALID_TYPE_KEYWORDS — fallback query will be used</p>
            )}
          </div>

          {/* Step 3: Synonym expansion */}
          <div>
            <p className="font-semibold text-muted-foreground mb-1">③ Expanded Keywords (with synonyms)</p>
            <div className="flex flex-wrap gap-1">
              {debug.expandedKeywords.map((kw, i) => (
                <span key={i} className={`px-1.5 py-0.5 rounded border ${debug.extractedKeywords.includes(kw) ? "bg-blue-500/10 text-blue-700 border-blue-500/20" : "bg-green-500/10 text-green-700 border-green-500/20"}`}>{kw}</span>
              ))}
            </div>
            <p className="text-muted-foreground mt-1">Blue = original, Green = synonym</p>
          </div>

          {/* Step 4: DB results */}
          <div>
            <p className="font-semibold text-muted-foreground mb-1">④ DB Query Results: <span className="text-foreground">{debug.dbResultsCount}</span> products</p>
          </div>

          {/* Step 5: Strict type filter */}
          <div>
            <p className="font-semibold text-muted-foreground mb-1">⑤ Strict Type Filter</p>
            <p>Expected types: <span className="text-foreground">[{debug.strictExpectedTypes.join(", ") || "none (no filter)"}]</span></p>
            <p>After filter: <span className="text-foreground">{debug.afterStrictFilterCount}</span> products (removed {debug.dbResultsCount - debug.afterStrictFilterCount})</p>
          </div>

          {/* Step 6: Scoring */}
          <div>
            <p className="font-semibold text-muted-foreground mb-1">⑥ Scoring (min: {debug.weights.minimumScore})</p>
            <p>Passed: <span className="text-foreground">{debug.afterScoringCount}</span> | After dedup: <span className="text-foreground">{debug.afterDedupCount}</span></p>
          </div>

          {/* Scored products detail */}
          {debug.scoredProducts.length > 0 && (
            <Collapsible open={showScored} onOpenChange={setShowScored}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  {showScored ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  Show scored products ({debug.scoredProducts.length})
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
                  {debug.scoredProducts.sort((a, b) => b.score - a.score).map((p, i) => (
                    <div key={i} className="p-1.5 rounded bg-background/50 border border-border/30">
                      <span className="font-medium text-foreground">{p.name}</span>
                      <span className="text-muted-foreground"> (type: {p.type}) → score: </span>
                      <span className={p.score >= debug.weights.minimumScore ? "text-green-600" : "text-red-500"}>{p.score}</span>
                      {p.reasons.length > 0 && <span className="text-muted-foreground"> [{p.reasons.join(" | ")}]</span>}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Rejected products */}
          {debug.rejectedProducts.length > 0 && (
            <Collapsible open={showRejected} onOpenChange={setShowRejected}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  {showRejected ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  Show rejected products ({debug.rejectedProducts.length})
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
                  {debug.rejectedProducts.map((p, i) => (
                    <div key={i} className="p-1.5 rounded bg-red-500/5 border border-red-500/10">
                      <span className="text-foreground">{p.name}</span>
                      <span className="text-muted-foreground"> (type: {p.type}) → </span>
                      <span className="text-red-500">{p.reason}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Weights */}
          <div>
            <p className="font-semibold text-muted-foreground mb-1">Weights</p>
            <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap">{JSON.stringify(debug.weights, null, 2)}</pre>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ShopExistingProducts;
