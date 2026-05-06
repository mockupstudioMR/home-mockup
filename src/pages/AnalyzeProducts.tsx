import { useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/QuizContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Home, ArrowLeft, Upload, X, Loader2, Sparkles, Package,
  Check, ShoppingBag, ExternalLink, Link2, Plus, Sofa, Bed,
  UtensilsCrossed, Monitor, Bath,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import QuizOption from "@/components/quiz/QuizOption";
import ConclusionVisuals from "@/components/analyze/ConclusionVisuals";
import TagVisual from "@/components/analyze/TagVisual";
import { trackEvent } from "@/lib/analytics";
import { optimizeImageSourceToDataUrl } from "@/lib/imageOptimization";
import { getAiErrorMessage } from "@/lib/aiErrorMessage";

// ── Types ──────────────────────────────────────────────
interface AnalyzedProduct {
  productName: string;
  category: string;
  suggestedStyle: string;
  description: string;
}

interface AnalyzedStyle {
  styleName: string;
  confidence: number;
  description: string;
  keywords: string[];
  iconicItem?: string;
}

interface MissingProduct {
  productName: string;
  category: string;
  reason: string;
  searchKeywords: string[];
  priceRange: "budget" | "mid-range" | "premium";
  priority: "essential" | "recommended" | "optional";
}

interface ProductAnalysisResult {
  products: AnalyzedProduct[];
  styles?: AnalyzedStyle[];
  dominantColors?: string[];
  missingProducts?: MissingProduct[];
  recommendedStyle: string;
  styleDescription: string;
  moodboardSuggestion: string;
}

interface RoomConfig {
  room_type: string;
  room_label: string;
  furniture_items: string[];
  description: string | null;
}

const ROOM_ICONS: Record<string, React.ReactNode> = {
  "living-room": <Sofa className="w-6 h-6" />,
  bedroom: <Bed className="w-6 h-6" />,
  kitchen: <UtensilsCrossed className="w-6 h-6" />,
  office: <Monitor className="w-6 h-6" />,
  bathroom: <Bath className="w-6 h-6" />,
};

// ── Component ──────────────────────────────────────────
const AnalyzeProducts = () => {
  const navigate = useNavigate();
  const { user, loading, role } = useAuth();
  const { quizData, updateQuizData } = useQuiz();
  const { toast } = useToast();

  // Upload state
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [productLink, setProductLink] = useState("");
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [savedLinks, setSavedLinks] = useState<string[]>([]);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ProductAnalysisResult | null>(null);
  const [editableColors, setEditableColors] = useState<string[]>([]);

  // Room selection state
  const [roomConfigs, setRoomConfigs] = useState<RoomConfig[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string>("");

  // Moodboard editing state (mirrors AnalyzeRoom)
  const [selectedStyleIndex, setSelectedStyleIndex] = useState<number | null>(null);
  const [selectedInspirations, setSelectedInspirations] = useState<string[]>([]);
  const [inspirationDetailsMap, setInspirationDetailsMap] = useState<
    Record<string, { label: string; description: string; type: string }>
  >({});
  const [moodboardExtras, setMoodboardExtras] = useState<string[]>([]);
  const [moodboard, setMoodboard] = useState<{
    materials: { label: string; imageUrl?: string }[];
    references: { label: string; imageUrl?: string }[];
    furnitureReferences: { label: string; imageUrl?: string }[];
    decorReferences: { label: string; imageUrl?: string }[];
    architectureReferences: { label: string; imageUrl?: string }[];
    mustInclude: { label: string; imageUrl?: string }[];
  }>({ materials: [], references: [], furnitureReferences: [], decorReferences: [], architectureReferences: [], mustInclude: [] });

  // Two-step flow: 'detect' (products + room) → 'moodboard' (editor)
  const [step, setStep] = useState<"detect" | "moodboard">("detect");

  // Which detected products the user wants to keep (defaults to all)
  const [selectedProductIndices, setSelectedProductIndices] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (analysisResult?.products) {
      setSelectedProductIndices(new Set(analysisResult.products.map((_, i) => i)));
    }
  }, [analysisResult]);
  const toggleProduct = (i: number) =>
    setSelectedProductIndices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  // Auto-seed material/texture suggestions from matching style keywords
  useEffect(() => {
    if (!analysisResult?.styles) return;
    const idx = selectedStyleIndex ?? 0;
    const top = analysisResult.styles[idx];
    if (!top) return;
    const suggestions = (top.keywords || [])
      .filter((k) => k && k.length < 30)
      .slice(0, 6);
    setMoodboardExtras(suggestions);
  }, [analysisResult, selectedStyleIndex]);

  // Fetch room configs on mount
  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase
        .from("room_furniture_config")
        .select("room_type, room_label, furniture_items, description")
        .order("room_type");
      if (data) setRoomConfigs(data);
    };
    fetchRooms();
  }, []);

  // ── Upload handlers ──────────────────────────────────
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newImages = await Promise.all(
        Array.from(files)
          .filter((file) => file.type.startsWith("image/"))
          .map((file) => optimizeImageSourceToDataUrl(file, { maxDimension: 1024 })),
      );

      const updated = [...uploadedImages, ...newImages].slice(0, 8);
      setUploadedImages(updated);
      setAnalysisResult(null);
      if (updated.length > 0) setTimeout(() => autoAnalyze(updated), 100);
    },
    [uploadedImages],
  );

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setAnalysisResult(null);
  };

  const handleAddProductLink = async () => {
    if (!productLink.trim() || !user) return;
    try {
      new URL(productLink.trim());
    } catch {
      toast({ title: "Invalid URL", description: "Please enter a valid product link", variant: "destructive" });
      return;
    }

    const trimmedLink = productLink.trim();
    setIsSavingLink(true);
    setProductLink("");
    setSavedLinks((prev) => [...prev, trimmedLink]);

    if (role === "admin") {
      try {
        await supabase.from("shop_products").insert({
          shop_id: user.id,
          name: "Product from link",
          type: "uncategorized",
          source_url: trimmedLink,
          is_active: true,
        } as any);
      } catch (error: any) {
        console.error("Save link error:", error);
      }
    }

    try {
      toast({ title: "Scraping product page…", description: "Capturing product image from the link" });
      const { data, error } = await supabase.functions.invoke("scrape-product-image", {
        body: { url: trimmedLink },
      });
      if (error || !data?.success) throw new Error(data?.error || error?.message || "Scrape failed");

      const imageUrl = data.imageUrl;
      setUploadedImages((prev) => {
        const updated = [...prev, imageUrl].slice(0, 8);
        setTimeout(() => autoAnalyze(updated), 100);
        return updated;
      });
      toast({ title: "Product captured!", description: `"${data.title}" — running style analysis…` });
    } catch (error: any) {
      console.error("Scrape error:", error);
      toast({ title: "Couldn't scrape product", description: error.message || "Try uploading an image manually instead", variant: "destructive" });
    } finally {
      setIsSavingLink(false);
    }
  };

  // ── Analysis ─────────────────────────────────────────
  const autoAnalyze = async (images: string[]) => {
    if (images.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      trackEvent("ai_call", "analyze-products", { fn: "analyze-style" });
      const { data, error } = await supabase.functions.invoke("analyze-style", {
        body: { images, mode: "products" },
      });
      if (error) throw error;

      setAnalysisResult(data);
      setEditableColors(data.dominantColors || []);
      toast({
        title: "Analysis complete!",
        description: `Analyzed ${data.products.length} products${data.styles?.length ? ` · ${data.styles.length} styles detected` : ""}`,
      });
    } catch (error) {
      console.error("Auto-analysis error:", error);
      toast({ title: "Analysis failed", description: getAiErrorMessage(error), variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeProducts = async () => {
    if (uploadedImages.length === 0) return;
    autoAnalyze(uploadedImages);
  };

  // ── Continue to generate ─────────────────────────────
  const STYLE_LABELS: Record<string, string> = {
    "modern-minimal": "Modern & Minimal",
    "bohemian-eclectic": "Bohemian Eclectic",
    "glam-luxe": "Glam & Luxe",
    "rustic-nature": "Rustic Nature",
    "mediterranean": "Mediterranean",
    "classic-historical": "Classic Historical",
  };

  const handleContinue = () => {
    if (!analysisResult || !selectedRoom) return;
    if (selectedProductIndices.size === 0) return;

    // Only the products the user kept selected
    const keptProducts = analysisResult.products.filter((_, i) => selectedProductIndices.has(i));
    const keptImages = uploadedImages.filter((_, i) => selectedProductIndices.has(i));

    const styleIdx = selectedStyleIndex ?? 0;
    const selectedStyle = analysisResult.styles?.[styleIdx];
    const detectedStyleName = selectedStyle?.styleName || "modern minimal";
    const styleId = detectedStyleName.toLowerCase().replace(/[\s&]+/g, "-");
    const styleTitle = STYLE_LABELS[styleId] || detectedStyleName;
    const styleDescription = selectedStyle?.description || "";

    const aggregatedDetailsMap: Record<string, { label: string; description: string; type: string }> = {
      ...inspirationDetailsMap,
    };
    const aggregatedIds = new Set<string>(selectedInspirations);

    (analysisResult.styles || []).forEach((style, sIdx) => {
      (style.keywords || []).forEach((keyword, kIdx) => {
        const id = `${sIdx}-${kIdx}-${keyword}`;
        aggregatedIds.add(id);
        if (!aggregatedDetailsMap[id]) {
          aggregatedDetailsMap[id] = {
            label: keyword,
            description: `${style.styleName}: ${keyword}`,
            type: "tag",
          };
        }
      });
      if (style.iconicItem) {
        const id = `iconic-${sIdx}-${style.iconicItem}`;
        aggregatedIds.add(id);
        if (!aggregatedDetailsMap[id]) {
          aggregatedDetailsMap[id] = {
            label: style.iconicItem,
            description: `${style.styleName}: ${style.iconicItem}`,
            type: "iconic",
          };
        }
      }
    });

    // Add ONLY the selected products as iconic moodboard references
    keptProducts.forEach((p, pIdx) => {
      const id = `product-${pIdx}-${p.productName}`;
      aggregatedIds.add(id);
      aggregatedDetailsMap[id] = {
        label: p.productName,
        description: p.description || `${p.category} — must include`,
        type: "iconic",
      };
    });

    const allInspirations = Array.from(aggregatedIds);

    const productReferences = keptImages.map((url, idx) => ({
      label: keptProducts[idx]?.productName || `Product ${idx + 1}`,
      imageUrl: url,
    }));
    const mergedReferences = [
      ...productReferences,
      ...moodboard.references.filter(
        (r) => !productReferences.some((pr) => pr.label === r.label),
      ),
    ];

    const updatedQuizData = {
      ...quizData,
      stylePreference: styleId,
      colorPalette: "neutral",
      roomType: selectedRoom,
      budgetFeel: quizData.budgetFeel || "mid-range",
      mustHaveElements: quizData.mustHaveElements || [],
      furnitureSource: quizData.furnitureSource || "open",
    };

    updateQuizData(updatedQuizData);

    navigate("/generate", {
      state: {
        quizData: updatedQuizData,
        selectedStyle: { id: styleId, title: styleTitle, description: styleDescription },
        analysisResult: analysisResult.styles
          ? {
              styles: analysisResult.styles,
              dominantColors: editableColors,
              moodboardDescription: analysisResult.moodboardSuggestion,
            }
          : undefined,
        productAnalysis: { ...analysisResult, products: keptProducts },
        sourceImages: keptImages,
        includeProducts: true,
        selectedInspirations: allInspirations,
        inspirationDetails: allInspirations.map((id) => aggregatedDetailsMap[id]).filter(Boolean),
        moodboard: {
          colors: editableColors,
          materials: moodboard.materials,
          references: mergedReferences,
          furnitureReferences: moodboard.furnitureReferences,
          decorReferences: moodboard.decorReferences,
          architectureReferences: moodboard.architectureReferences,
          mustInclude: moodboard.mustInclude,
        },
      },
    });
  };

  // ── Render ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-2xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-2xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <button onClick={() => navigate("/start")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Home className="w-5 h-5 text-primary-foreground" />
          </div>
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 pb-32">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-3 py-4">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Start with Your Products</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Upload photos of furniture or decor items you want to include, and we'll design a room around them
            </p>

            {/* Product Link Input */}
            <div className="max-w-lg mx-auto pt-2">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Or paste a product link</span>
              </div>
              <div className="flex gap-2">
                <Input placeholder="https://example.com/product..." value={productLink} onChange={(e) => setProductLink(e.target.value)} className="flex-1" />
                <Button size="sm" onClick={handleAddProductLink} disabled={!productLink.trim() || isSavingLink}>
                  {isSavingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" />Add</>}
                </Button>
              </div>
              {savedLinks.length > 0 && (
                <div className="mt-3 space-y-1">
                  {savedLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-primary">
                      <Check className="w-3 h-3 shrink-0" />
                      <a href={link} target="_blank" rel="noopener noreferrer" className="truncate hover:underline">{link}</a>
                    </div>
                  ))}
                </div>
              )}
              {isSavingLink && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scraping product page &amp; analyzing…</span>
                </div>
              )}
            </div>
          </div>

          {/* Upload Area */}
          {step === "detect" && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              {uploadedImages.length === 0 ? (
                <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                  <Package className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Drop product images here or click to upload</p>
                  <p className="text-sm text-muted-foreground mt-1">Upload up to 8 product photos</p>
                  <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedImages.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                        <img src={img} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(index)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ))}
                    {uploadedImages.length < 8 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                          <span className="text-sm text-muted-foreground mt-2">Add more</span>
                        </div>
                        <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                  {!analysisResult && !isAnalyzing && (
                    <Button size="lg" className="w-full" onClick={analyzeProducts}>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Analyze Products
                    </Button>
                  )}
                  {isAnalyzing && (
                    <div className="flex items-center justify-center gap-3 py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Analyzing your products…</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* ── STEP 1: Detected Products ─────────────────── */}
          {analysisResult && (
            <div className="space-y-8">
              {/* "We detected" — selectable */}
              {step === "detect" && (
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <h2 className="text-2xl font-bold">We detected</h2>
                    <p className="text-xs text-muted-foreground">
                      Tap to keep only the items you want to design around
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {analysisResult.products.map((product, index) => {
                      const isSelected = selectedProductIndices.has(index);
                      return (
                        <button
                          type="button"
                          key={index}
                          onClick={() => toggleProduct(index)}
                          aria-pressed={isSelected}
                          className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                            isSelected
                              ? "bg-primary/10 border-primary ring-2 ring-primary/30"
                              : "bg-secondary/40 border-border/50 opacity-60 hover:opacity-90"
                          }`}
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                            <img src={uploadedImages[index]} alt={product.productName} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{product.productName}</p>
                            <p className="text-xs text-muted-foreground">{product.category}</p>
                          </div>
                          {isSelected && (
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {selectedProductIndices.size === 0 && (
                    <p className="text-xs text-destructive">Select at least one item to continue.</p>
                  )}
                </CardContent>
              </Card>
              )}

              {/* ── STEP 2: Matching Room Types ──────────────── */}
              {step === "detect" && (() => {
                // Synonym map: detected word → room config terms it should match
                const SYNONYMS: Record<string, string[]> = {
                  sectional: ["sofa"],
                  couch: ["sofa"],
                  loveseat: ["sofa"],
                  recliner: ["sofa", "armchair"],
                  reclining: ["sofa", "armchair"],
                  ottoman: ["sofa", "armchair"],
                  futon: ["sofa", "bed frame"],
                  nightstand: ["nightstand", "side table"],
                  "side table": ["nightstand", "side table"],
                  stool: ["bar stools"],
                  "bar stool": ["bar stools"],
                  chandelier: ["pendant lights"],
                  pendant: ["pendant lights"],
                  lamp: ["floor lamp", "desk lamp", "bedside lamp", "table lamps"],
                  table: ["coffee table", "dining table", "desk", "side table"],
                  chair: ["armchair", "office chair", "dining chairs", "desk chair"],
                  shelving: ["bookshelf", "storage shelves"],
                  shelf: ["bookshelf", "storage shelves"],
                  cabinet: ["storage cabinet", "filing cabinet", "wardrobe"],
                  dresser: ["dresser", "wardrobe"],
                  vanity: ["vanity", "dresser"],
                };

                // Tokenize product names into individual words + full names
                // (only for products the user kept selected)
                const keptProducts = analysisResult.products.filter((_, i) => selectedProductIndices.has(i));
                const allTokens = new Set<string>();
                keptProducts.forEach((p) => {
                  const name = p.productName.toLowerCase();
                  const cat = p.category.toLowerCase();
                  allTokens.add(name);
                  allTokens.add(cat);
                  name.split(/[\s,.\-/]+/).forEach((w) => {
                    if (w.length > 2) allTokens.add(w);
                  });
                  cat.split(/[\s,.\-/]+/).forEach((w) => {
                    if (w.length > 2) allTokens.add(w);
                  });
                });

                // Expand tokens with synonyms
                const expandedTokens = new Set(allTokens);
                allTokens.forEach((token) => {
                  const syns = SYNONYMS[token];
                  if (syns) syns.forEach((s) => expandedTokens.add(s.toLowerCase()));
                });

                const matchingRooms = roomConfigs.filter((room) =>
                  room.furniture_items.some((item) => {
                    const itemLower = item.toLowerCase();
                    return Array.from(expandedTokens).some(
                      (term) => term.includes(itemLower) || itemLower.includes(term)
                    );
                  })
                );

                const roomsToShow = matchingRooms.length > 0 ? matchingRooms : roomConfigs;

                return (
                  <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                    <CardContent className="p-6 space-y-4">
                      <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold">
                          {matchingRooms.length > 0
                            ? "These rooms need your products"
                            : "Which room are we designing?"}
                        </h2>
                        <p className="text-muted-foreground">
                          {matchingRooms.length > 0
                            ? "Based on what we detected, these rooms are a perfect match"
                            : "Select the space for your products"}
                        </p>
                      </div>
                      <div className="grid gap-3">
                        {roomsToShow.map((room) => {
                          // Show which detected products match this room
                          const matchedProducts = keptProducts.filter((p) => {
                            const pTokens = new Set<string>();
                            const pName = p.productName.toLowerCase();
                            const pCat = p.category.toLowerCase();
                            pTokens.add(pName);
                            pTokens.add(pCat);
                            pName.split(/[\s,.\-/]+/).forEach((w) => { if (w.length > 2) pTokens.add(w); });
                            pCat.split(/[\s,.\-/]+/).forEach((w) => { if (w.length > 2) pTokens.add(w); });
                            // Expand with synonyms
                            const expanded = new Set(pTokens);
                            pTokens.forEach((t) => { const s = SYNONYMS[t]; if (s) s.forEach((v) => expanded.add(v.toLowerCase())); });
                            return room.furniture_items.some((item) => {
                              const il = item.toLowerCase();
                              return Array.from(expanded).some((t) => t.includes(il) || il.includes(t));
                            });
                          });

                          return (
                            <QuizOption
                              key={room.room_type}
                              value={room.room_type}
                              label={room.room_label}
                              description={
                                matchedProducts.length > 0
                                  ? `Your ${matchedProducts.map((p) => p.productName).join(", ")} ${matchedProducts.length === 1 ? "is" : "are"} essential here`
                                  : room.description || `Includes: ${room.furniture_items.slice(0, 4).join(", ")}…`
                              }
                              icon={ROOM_ICONS[room.room_type] || <Sofa className="w-6 h-6" />}
                              selected={selectedRoom === room.room_type}
                              onClick={() => setSelectedRoom(room.room_type)}
                            />
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* ── STEP 3: Moodboard editor (built around the products) ── */}
              {step === "moodboard" && selectedRoom && (
                <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6 space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold">Build your moodboard</h2>
                      <p className="text-muted-foreground">
                        We've started a moodboard around your products — edit colors, materials and style references before we generate
                      </p>
                    </div>

                    {/* Conclusion Moodboard — colors, materials, references (incl. uploaded products) */}
                    <ConclusionVisuals
                      dominantColors={editableColors}
                      onDominantColorsChange={setEditableColors}
                      styleNames={(analysisResult.styles && analysisResult.styles.length > 0
                        ? analysisResult.styles.map((s) => s.styleName)
                        : [analysisResult.recommendedStyle || "modern minimal"])}
                      seedElements={analysisResult.products
                        .filter((_, i) => selectedProductIndices.has(i))
                        .map((p) => p.productName)}
                      iconicItems={Object.fromEntries(
                        (analysisResult.styles || [])
                          .filter((s) => s.iconicItem)
                          .map((s) => [s.styleName, s.iconicItem as string]),
                      )}
                      mustIncludeItems={analysisResult.products
                        .map((p, i) => ({ label: p.productName, imageUrl: uploadedImages[i] }))
                        .filter((_, i) => selectedProductIndices.has(i))}
                      extraMaterials={moodboardExtras}
                      roomType={selectedRoom}
                      onMoodboardChange={setMoodboard}
                    />

                    {/* Style Matches with editable tags */}
                    {analysisResult.styles && analysisResult.styles.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Style Matches</h3>
                      <div className="space-y-3">
                        {analysisResult.styles.map((style, index) => (
                          <button
                            type="button"
                            key={index}
                            onClick={() => setSelectedStyleIndex(index)}
                            className={`w-full text-left p-4 rounded-xl transition-all cursor-pointer ${
                              (selectedStyleIndex ?? 0) === index
                                ? "bg-primary/10 border-2 border-primary ring-2 ring-primary/20"
                                : "bg-secondary/50 border-2 border-transparent hover:border-primary/30"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold">{style.styleName}</h3>
                              <span className="text-sm text-muted-foreground">
                                {Math.round((style.confidence || 0) * 100)}% match
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {style.keywords.map((keyword) => {
                                const id = `tag-${index}-${keyword}`;
                                return (
                                  <TagVisual
                                    key={id}
                                    tag={keyword}
                                    styleName={style.styleName}
                                    roomType={selectedRoom}
                                    selected={selectedInspirations.includes(id)}
                                    onToggle={() => {
                                      setSelectedStyleIndex(index);
                                      setSelectedInspirations((prev) =>
                                        prev.includes(id)
                                          ? prev.filter((i) => i !== id)
                                          : [...prev, id],
                                      );
                                      setInspirationDetailsMap((prev) => ({
                                        ...prev,
                                        [id]: {
                                          label: keyword,
                                          description: `${style.styleName}: ${keyword}`,
                                          type: "tag",
                                        },
                                      }));
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ── STEP 1.5: Style Matches with editable tags (visible during detect) ── */}
              {step === "detect" && analysisResult.styles && analysisResult.styles.length > 0 && (
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-6 space-y-3">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold">Style Matches</h2>
                      <p className="text-muted-foreground">
                        Tap tags to highlight what you love — they'll guide your moodboard
                      </p>
                    </div>
                    <div className="space-y-3">
                      {analysisResult.styles.map((style, index) => (
                        <button
                          type="button"
                          key={index}
                          onClick={() => setSelectedStyleIndex(index)}
                          className={`w-full text-left p-4 rounded-xl transition-all cursor-pointer ${
                            (selectedStyleIndex ?? 0) === index
                              ? "bg-primary/10 border-2 border-primary ring-2 ring-primary/20"
                              : "bg-secondary/50 border-2 border-transparent hover:border-primary/30"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">{style.styleName}</h3>
                            <span className="text-sm text-muted-foreground">
                              {Math.round((style.confidence || 0) * 100)}% match
                            </span>
                          </div>
                          {style.description && (
                            <p className="text-xs text-muted-foreground mb-3">{style.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {style.keywords.map((keyword) => {
                              const id = `tag-${index}-${keyword}`;
                              return (
                                <TagVisual
                                  key={id}
                                  tag={keyword}
                                  styleName={style.styleName}
                                  roomType={selectedRoom || "living room"}
                                  selected={selectedInspirations.includes(id)}
                                  inMoodboard={moodboardExtras.includes(keyword)}
                                  onToggle={() => {
                                    setSelectedStyleIndex(index);
                                    setSelectedInspirations((prev) =>
                                      prev.includes(id)
                                        ? prev.filter((i) => i !== id)
                                        : [...prev, id],
                                    );
                                    setInspirationDetailsMap((prev) => ({
                                      ...prev,
                                      [id]: {
                                        label: keyword,
                                        description: `${style.styleName}: ${keyword}`,
                                        type: "tag",
                                      },
                                    }));
                                  }}
                                />
                              );
                            })}
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Missing products */}
              {step === "detect" && analysisResult.missingProducts && analysisResult.missingProducts.length > 0 && (
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">Complete Your Room</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Items that would complete your space:</p>
                    <div className="grid gap-2">
                      {analysisResult.missingProducts.map((product, index) => (
                        <div key={index} className="p-3 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-medium text-sm">{product.productName}</h4>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{product.category}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${product.priority === "essential" ? "bg-destructive/10 text-destructive" : product.priority === "recommended" ? "bg-accent/10 text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                                  {product.priority}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1.5">{product.reason}</p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {product.searchKeywords.slice(0, 3).map((keyword, ki) => (
                                  <a key={ki} href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(keyword)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                    {keyword}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{product.priceRange}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Sticky bottom CTA - active as soon as a room is picked */}
      {analysisResult && selectedRoom && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-md border-t border-border p-4">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            {step === "moodboard" && (
              <Button size="lg" variant="outline" onClick={() => setStep("detect")}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              size="lg"
              className="flex-1"
              onClick={() => {
                if (step === "detect") {
                  setStep("moodboard");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  handleContinue();
                }
              }}
              disabled={selectedProductIndices.size === 0}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {step === "detect" ? "Complete your moodboard" : "Generate my design"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {step === "detect"
              ? "We'll build the moodboard around your products — edit suggested styles on the next step"
              : "Edit colors, materials and style references, then generate your design"}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalyzeProducts;
