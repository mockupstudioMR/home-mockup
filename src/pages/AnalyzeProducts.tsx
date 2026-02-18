import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/QuizContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, ArrowLeft, Upload, X, Loader2, Sparkles, Package, Check, ShoppingBag, ExternalLink, Link2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StyleInspirationCards, { type InspirationDetail } from "@/components/analyze/StyleInspirationCards";

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

const AnalyzeProducts = () => {
  const navigate = useNavigate();
  const { user, loading, role } = useAuth();
  const { updateQuizData } = useQuiz();
  const { toast } = useToast();
  
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ProductAnalysisResult | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [productLink, setProductLink] = useState("");
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [savedLinks, setSavedLinks] = useState<string[]>([]);
  const [selectedStyleIndex, setSelectedStyleIndex] = useState<number | null>(null);
  const [selectedInspirations, setSelectedInspirations] = useState<string[]>([]);
  const [inspirationDetailsMap, setInspirationDetailsMap] = useState<Record<string, { label: string; description: string; type: string }>>({});
  const [editableColors, setEditableColors] = useState<string[]>([]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    
    for (const file of Array.from(files)) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        await new Promise<void>((resolve) => {
          reader.onload = (event) => {
            if (event.target?.result) {
              newImages.push(event.target.result as string);
            }
            resolve();
          };
          reader.readAsDataURL(file);
        });
      }
    }

    const updated = [...uploadedImages, ...newImages].slice(0, 8);
    setUploadedImages(updated);
    setAnalysisResult(null);
    // Auto-trigger analysis
    if (updated.length > 0) {
      setTimeout(() => autoAnalyze(updated), 100);
    }
  }, [uploadedImages]);

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setAnalysisResult(null);
  };

  const analyzeProducts = async () => {
    if (uploadedImages.length === 0) return;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-style", {
        body: { images: uploadedImages, mode: "products" },
      });

      if (error) throw error;

      setAnalysisResult(data);
      setEditableColors(data.dominantColors || []);
      // Select all products by default
      setSelectedProducts(new Set(data.products.map((_: AnalyzedProduct, i: number) => i)));
      // Auto-select first style if available
      if (data.styles && data.styles.length > 0) {
        setSelectedStyleIndex(0);
      }
      toast({
        title: "Analysis complete!",
        description: `Analyzed ${data.products.length} products${data.styles?.length ? ` · ${data.styles.length} styles detected` : ""}`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleProductSelection = (index: number) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleAddProductLink = async () => {
    if (!productLink.trim() || !user) return;

    // Basic URL validation
    try {
      new URL(productLink.trim());
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid product link",
        variant: "destructive",
      });
      return;
    }

    const trimmedLink = productLink.trim();
    setIsSavingLink(true);
    setProductLink("");
    setSavedLinks((prev) => [...prev, trimmedLink]);

    // Only admins save to the database
    if (role === "admin") {
      try {
        await supabase.from("shop_products").insert({
          shop_id: user.id,
          name: "Product from link",
          category: "uncategorized",
          source_url: trimmedLink,
          is_active: true,
        });
      } catch (error: any) {
        console.error("Save link error:", error);
      }
    }

    // Scrape the product page for a screenshot image
    try {
      toast({
        title: "Scraping product page…",
        description: "Capturing product image from the link",
      });

      const { data, error } = await supabase.functions.invoke("scrape-product-image", {
        body: { url: trimmedLink },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || "Scrape failed");
      }

      // Add the scraped image and auto-trigger analysis
      const imageUrl = data.imageUrl;
      setUploadedImages((prev) => {
        const updated = [...prev, imageUrl].slice(0, 8);
        // Auto-analyze after state update
        setTimeout(() => autoAnalyze(updated), 100);
        return updated;
      });

      toast({
        title: "Product captured!",
        description: `"${data.title}" — running style analysis…`,
      });
    } catch (error: any) {
      console.error("Scrape error:", error);
      toast({
        title: "Couldn't scrape product",
        description: error.message || "Try uploading an image manually instead",
        variant: "destructive",
      });
    } finally {
      setIsSavingLink(false);
    }
  };

  const autoAnalyze = async (images: string[]) => {
    if (images.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-style", {
        body: { images, mode: "products" },
      });
      if (error) throw error;

      setAnalysisResult(data);
      setEditableColors(data.dominantColors || []);
      setSelectedProducts(new Set(data.products.map((_: AnalyzedProduct, i: number) => i)));
      if (data.styles && data.styles.length > 0) {
        setSelectedStyleIndex(0);
      }
      toast({
        title: "Analysis complete!",
        description: `Analyzed ${data.products.length} products${data.styles?.length ? ` · ${data.styles.length} styles detected` : ""}`,
      });
    } catch (error) {
      console.error("Auto-analysis error:", error);
      toast({
        title: "Analysis failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleContinue = () => {
    if (analysisResult && selectedProducts.size > 0) {
      const selectedProductData = analysisResult.products.filter((_, i) => selectedProducts.has(i));
      const selectedImageData = uploadedImages.filter((_, i) => selectedProducts.has(i));
      
      // Use the selected style if available, otherwise fall back to recommendedStyle
      const styleSource = analysisResult.styles && selectedStyleIndex !== null
        ? analysisResult.styles[selectedStyleIndex]
        : null;
      const styleId = styleSource
        ? styleSource.styleName.toLowerCase().replace(/\s+/g, "-")
        : analysisResult.recommendedStyle.toLowerCase().replace(/\s+/g, "-");
      const styleTitle = styleSource ? styleSource.styleName : analysisResult.recommendedStyle;
      const styleDesc = styleSource ? styleSource.description : analysisResult.styleDescription;

      updateQuizData({
        stylePreference: styleId,
        colorPalette: "neutral",
      });
      navigate("/generate", { 
        state: { 
          selectedStyle: {
            id: styleId,
            title: styleTitle,
            description: styleDesc,
          },
          analysisResult: analysisResult.styles ? { 
            styles: analysisResult.styles, 
            dominantColors: editableColors, 
            moodboardDescription: analysisResult.moodboardSuggestion 
          } : undefined,
          productAnalysis: {
            ...analysisResult,
            products: selectedProductData,
          },
          sourceImages: selectedImageData,
          selectedInspirations,
          inspirationDetails: selectedInspirations.map(id => inspirationDetailsMap[id]).filter(Boolean),
          includeProducts: true,
        } 
      });
    }
  };

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
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <button
          onClick={() => navigate("/start")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
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
      <main className="relative z-10 px-4 pb-24">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center space-y-3 py-4">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Start with Your Products
            </h1>
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
                <Input
                  placeholder="https://example.com/product..."
                  value={productLink}
                  onChange={(e) => setProductLink(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleAddProductLink}
                  disabled={!productLink.trim() || isSavingLink}
                >
                  {isSavingLink ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              </div>
              {savedLinks.length > 0 && (
                <div className="mt-3 space-y-1">
                  {savedLinks.map((link, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-primary">
                      <Check className="w-3 h-3 shrink-0" />
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:underline"
                      >
                        {link}
                      </a>
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
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              {uploadedImages.length === 0 ? (
                <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                  <Package className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Drop product images here or click to upload</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload up to 8 product photos
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedImages.map((img, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                        <img src={img} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
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
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {!analysisResult && !isAnalyzing && (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={analyzeProducts}
                      disabled={isAnalyzing}
                    >
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



          {analysisResult && (
            <div className="space-y-6">
              {/* Product Style Wall — each product shown with its style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {analysisResult.products.map((product, index) => {
                  const productSelected = selectedProducts.has(index);
                  const detectedStyle = analysisResult.styles?.find(
                    (s) => s.styleName === product.suggestedStyle
                  );

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleProductSelection(index)}
                      className={`relative text-left rounded-2xl overflow-hidden transition-all ${
                        productSelected
                          ? "ring-2 ring-primary shadow-lg shadow-primary/20"
                          : "ring-1 ring-border/50 hover:ring-primary/40"
                      }`}
                    >
                      {/* Product image */}
                      <div className="aspect-[4/3] bg-secondary">
                        <img
                          src={uploadedImages[index]}
                          alt={product.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Style title banner */}
                      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 via-black/40 to-transparent p-4 pt-3">
                        <p className="text-lg font-bold text-white tracking-tight leading-tight">
                          {product.suggestedStyle}
                        </p>
                        {detectedStyle && (
                          <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white/90 backdrop-blur-sm">
                            {Math.round(detectedStyle.confidence * 100)}% match
                          </span>
                        )}
                      </div>

                      {/* Product info at bottom */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 pt-8">
                        <p className="text-sm font-medium text-white truncate">
                          {product.productName}
                        </p>
                        <p className="text-xs text-white/70">{product.category}</p>
                      </div>

                      {/* Selection indicator */}
                      {productSelected && (
                        <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Style Summary Chips */}
              {analysisResult.styles && analysisResult.styles.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Detected Styles
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.styles.map((style, idx) => {
                      const isActive = selectedStyleIndex === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedStyleIndex(isActive ? null : idx)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                          }`}
                        >
                          {style.styleName}
                          <span className="ml-1.5 opacity-70">
                            {Math.round(style.confidence * 100)}%
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Expanded style detail */}
                  {selectedStyleIndex !== null && analysisResult.styles[selectedStyleIndex] && (
                    <div className="p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {analysisResult.styles[selectedStyleIndex].description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.styles[selectedStyleIndex].keywords.map((kw) => (
                          <span
                            key={kw}
                            className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                      <StyleInspirationCards
                        styleIndex={selectedStyleIndex}
                        styleName={analysisResult.styles[selectedStyleIndex].styleName}
                        keywords={analysisResult.styles[selectedStyleIndex].keywords}
                        selectedItems={selectedInspirations}
                        onToggle={(id) => {
                          setSelectedInspirations((prev) =>
                            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                          );
                        }}
                        onItemsReady={(details) => {
                          setInspirationDetailsMap((prev) => {
                            const next = { ...prev };
                            for (const d of details) {
                              next[d.id] = { label: d.label, description: d.description, type: d.type };
                            }
                            return next;
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Colors + Missing Products */}
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      {selectedProducts.size} of {analysisResult.products.length} products selected
                    </h3>
                  </div>

                  {editableColors.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Dominant Colors</h3>
                      <div className="flex flex-wrap gap-3 items-center">
                        {editableColors.map((color, index) => (
                          <div key={index} className="relative group">
                            <label className="block cursor-pointer">
                              <div
                                className="w-12 h-12 rounded-lg border-2 border-border hover:border-primary/50 transition-colors"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                              <input
                                type="color"
                                value={color}
                                onChange={(e) => {
                                  setEditableColors((prev) =>
                                    prev.map((c, i) => (i === index ? e.target.value : c))
                                  );
                                }}
                                className="sr-only"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setEditableColors((prev) => prev.filter((_, i) => i !== index))
                              }
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setEditableColors((prev) => [...prev, "#808080"])}
                          className="w-12 h-12 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  )}

                  {analysisResult.missingProducts && analysisResult.missingProducts.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Complete Your Room</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Items that would complete your space:
                      </p>
                      <div className="grid gap-2">
                        {analysisResult.missingProducts.map((product, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h4 className="font-medium text-sm">{product.productName}</h4>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                    {product.category}
                                  </span>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      product.priority === "essential"
                                        ? "bg-destructive/10 text-destructive"
                                        : product.priority === "recommended"
                                        ? "bg-accent/10 text-accent-foreground"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {product.priority}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-1.5">{product.reason}</p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {product.searchKeywords.slice(0, 3).map((keyword, ki) => (
                                    <a
                                      key={ki}
                                      href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(keyword)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                    >
                                      {keyword}
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {product.priceRange}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Sticky bottom CTA */}
      {analysisResult && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-md border-t border-border p-4">
          <div className="max-w-3xl mx-auto">
            <Button 
              size="lg" 
              className="w-full" 
              onClick={handleContinue}
              disabled={selectedProducts.size === 0}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Design Room with {selectedProducts.size} Product{selectedProducts.size !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzeProducts;
