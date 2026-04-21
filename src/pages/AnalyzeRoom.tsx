import { useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/QuizContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Upload, X, Loader2, Sparkles, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ConclusionVisuals from "@/components/analyze/ConclusionVisuals";
import TagVisual from "@/components/analyze/TagVisual";
import { RefreshCw as RefreshIcon } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { getAiOptimizedImageUrl, getThumbnailImageUrl, optimizeImageFile } from "@/lib/imageOptimization";

interface AnalyzedStyle {
  styleName: string;
  confidence: number;
  description: string;
  keywords: string[];
  iconicItem?: string;
}

interface AnalysisResult {
  styles: AnalyzedStyle[];
  moodboardDescription: string;
  dominantColors: string[];
  materials?: string[];
}

const STORAGE_KEY = "analyze_room_cache";

// Always start fresh — clear any cached images/results from previous journeys.
const getInitialState = (): { images: string[]; result: AnalysisResult | null } => {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return { images: [], result: null };
};

const AnalyzeRoom = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { updateQuizData } = useQuiz();
  const { toast } = useToast();
  
  const [uploadedImages, setUploadedImages] = useState<string[]>(() => getInitialState().images);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(() => getInitialState().result);
  const [selectedStyleIndex, setSelectedStyleIndex] = useState<number | null>(null);
  const [selectedInspirations, setSelectedInspirations] = useState<string[]>([]);
  const [inspirationDetailsMap, setInspirationDetailsMap] = useState<Record<string, { label: string; description: string; type: string }>>({});
  const [editableColors, setEditableColors] = useState<string[]>(() => getInitialState().result?.dominantColors || []);
  const [refreshKeys, setRefreshKeys] = useState<Record<number, number>>({});
  // (conclusion moodboard manages its own regeneration internally)
  const [isDetectingMore, setIsDetectingMore] = useState(false);
  const [moodboardExtras, setMoodboardExtras] = useState<string[]>([]);
  // Two-step flow: after analysis the user picks/confirms a style first,
  // then explicitly triggers moodboard creation (which seeds 3 furniture +
  // 3 decor references behind a loading screen).
  const [isCreatingMoodboard, setIsCreatingMoodboard] = useState(false);
  const [moodboardReady, setMoodboardReady] = useState(false);
  const [pinnedVisuals, setPinnedVisuals] = useState<{ label: string; imageUrl: string }[]>([]);
  const [moodboard, setMoodboard] = useState<{
    materials: { label: string; imageUrl?: string }[];
    references: { label: string; imageUrl?: string }[];
    furnitureReferences: { label: string; imageUrl?: string }[];
    decorReferences: { label: string; imageUrl?: string }[];
    mustInclude: { label: string; imageUrl?: string }[];
  }>({ materials: [], references: [], furnitureReferences: [], decorReferences: [], mustInclude: [] });

  // No persistence — every visit to /analyze-room starts with a clean slate.
  useEffect(() => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, [uploadedImages, analysisResult]);

  // Upload optimized image to storage and return public URL (with retry on transient errors)
  const uploadToStorage = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const optimizedFile = await optimizeImageFile(file, { maxDimension: 2048 });
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

    let lastError: unknown = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const { error } = await supabase.storage
        .from('room-photos')
        .upload(fileName, optimizedFile, { contentType: optimizedFile.type });

      if (!error) {
        const { data: urlData } = supabase.storage.from('room-photos').getPublicUrl(fileName);
        return urlData.publicUrl;
      }

      lastError = error;
      const status = (error as { statusCode?: string | number; status?: number }).statusCode;
      const code = String(status ?? '');
      const isTransient = code.startsWith('5') || code === '408' || code === '429';
      if (!isTransient || attempt === 3) break;
      await new Promise((r) => setTimeout(r, 600 * attempt));
    }

    console.error('Upload error after retries:', lastError);
    return null;
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length || !user) return;

    setIsUploading(true);

    try {
      const remainingSlots = Math.max(0, 6 - uploadedImages.length);
      const uploads = files
        .filter((file) => file.type.startsWith("image/"))
        .slice(0, remainingSlots)
        .map((file) => uploadToStorage(file));
      const results = await Promise.all(uploads);
      const newUrls = results.filter(Boolean) as string[];
      const failedCount = results.length - newUrls.length;

      if (newUrls.length > 0) {
        setUploadedImages(prev => [...prev, ...newUrls].slice(0, 6));
        setAnalysisResult(null);
        setSelectedStyleIndex(null);
      }

      if (failedCount > 0) {
        toast({
          title: newUrls.length > 0 ? "Some uploads failed" : "Upload failed",
          description: "Server was busy. Please try the failed photo(s) again in a moment.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: "Please try again in a moment",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [user, uploadedImages.length, toast]);

  const removeImage = async (index: number) => {
    const imageUrl = uploadedImages[index];
    
    // Extract path from URL and delete from storage
    if (imageUrl && user) {
      try {
        const urlParts = imageUrl.split('/room-photos/');
        if (urlParts[1]) {
          await supabase.storage.from('room-photos').remove([urlParts[1]]);
        }
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
    
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setAnalysisResult(null);
    setSelectedStyleIndex(null);
  };

  const analyzeImages = async () => {
    if (uploadedImages.length === 0) return;

    setIsAnalyzing(true);
    try {
      const aiImages = uploadedImages.map(getAiOptimizedImageUrl);
      trackEvent("ai_call", "analyze-room", { fn: "analyze-style" });
      const { data, error } = await supabase.functions.invoke("analyze-style", {
        body: { images: aiImages, mode: "room" },
      });

      if (error) throw error;

      setAnalysisResult(data);
      setEditableColors(data.dominantColors || []);
      // New analysis → reset moodboard step
      setIsCreatingMoodboard(false);
      setMoodboardReady(false);
      toast({
        title: "Analysis complete!",
        description: `Detected ${data.styles.length} interior styles`,
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

  const handleContinue = () => {
    if (!analysisResult) return;
    const styleIdx = selectedStyleIndex ?? 0;
    const selectedStyle = analysisResult.styles[styleIdx];
    if (!selectedStyle) return;

    // Aggregate all moodboard items: user-toggled inspirations + every suggested
    // keyword across all detected styles + iconic items (deduped).
    const aggregatedDetailsMap: Record<string, { label: string; description: string; type: string }> = {
      ...inspirationDetailsMap,
    };
    const aggregatedIds = new Set<string>(selectedInspirations);

    analysisResult.styles.forEach((style, sIdx) => {
      (style.keywords || []).forEach((keyword: string, kIdx: number) => {
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

    const allInspirations = Array.from(aggregatedIds);

    updateQuizData({
      stylePreference: selectedStyle.styleName.toLowerCase().replace(/\s+/g, "-"),
      colorPalette: "neutral",
    });
    navigate("/generate", {
      state: {
        selectedStyle: {
          id: selectedStyle.styleName.toLowerCase().replace(/\s+/g, "-"),
          title: selectedStyle.styleName,
          description: selectedStyle.description,
        },
        analysisResult: { ...analysisResult, dominantColors: editableColors },
        sourceImages: uploadedImages,
        selectedInspirations: allInspirations,
        inspirationDetails: allInspirations.map(id => aggregatedDetailsMap[id]).filter(Boolean),
        moodboard: {
          colors: editableColors,
          materials: moodboard.materials,
          references: moodboard.references,
          furnitureReferences: moodboard.furnitureReferences,
          decorReferences: moodboard.decorReferences,
          mustInclude: moodboard.mustInclude,
        },
      }
    });
  };

  const handleDetectAnotherStyle = async () => {
    if (!analysisResult || uploadedImages.length === 0) return;
    setIsDetectingMore(true);
    try {
      const aiImages = uploadedImages.map(getAiOptimizedImageUrl);
      trackEvent("ai_call", "analyze-room", { fn: "analyze-style", action: "detect-another" });
      const { data, error } = await supabase.functions.invoke("analyze-style", {
        body: {
          images: aiImages,
          mode: "room",
          excludeStyles: analysisResult.styles.map((s) => s.styleName),
          onlyOneStyle: true,
        },
      });
      if (error) throw error;
      const newStyle = data?.styles?.[0];
      if (!newStyle) {
        toast({ title: "No new styles found", description: "We couldn't detect another distinct style." });
        return;
      }
      setAnalysisResult((prev) => prev ? { ...prev, styles: [...prev.styles, newStyle] } : prev);
      toast({ title: "New style detected!", description: newStyle.styleName });
    } catch (err) {
      console.error("Detect another style error:", err);
      toast({ title: "Couldn't detect another style", description: "Please try again", variant: "destructive" });
    } finally {
      setIsDetectingMore(false);
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
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-2xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-2xl" />
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
            <h1 className="font-serif italic text-4xl md:text-5xl tracking-tight text-foreground/90">
              Your Moodboard
            </h1>
            {!analysisResult && (
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-serif italic">
                Share photos of rooms you love and we'll analyze the styles to create your personalized moodboard
              </p>
            )}
          </div>

          {/* Upload Area — hidden once analysis exists */}
          {!analysisResult && (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                {uploadedImages.length === 0 && !isUploading ? (
                  <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">Drop images here or click to upload</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload up to 6 room photos
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                ) : uploadedImages.length === 0 && isUploading ? (
                  <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-primary/50 rounded-xl bg-primary/5">
                    <Loader2 className="w-12 h-12 text-primary mb-4 animate-spin" />
                    <p className="text-lg font-medium">Uploading images...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {uploadedImages.map((img, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                          <img src={getThumbnailImageUrl(img)} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      ))}
                      {uploadedImages.length < 6 && !isUploading && (
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
                      {isUploading && (
                        <div className="aspect-square rounded-xl border-2 border-dashed border-primary/50 flex items-center justify-center bg-primary/5">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                      )}
                    </div>

                    {!analysisResult && (
                      <Button
                        size="lg"
                        className="w-full"
                        onClick={analyzeImages}
                        disabled={isAnalyzing || isUploading}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Analyzing styles...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Analyze Styles
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Analysis Result */}
          {analysisResult && (
            <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-6">
                {/* Per-image breakdown removed per request */}

                <div>
                  {/* Intro headline removed per request */}


                  {/* Conclusion Moodboard — colors, materials, and style references */}
                  {/* The ConclusionVisuals component is mounted as soon as the user
                      kicks off moodboard creation so it can auto-seed 3 furniture
                      + 3 decor references in the background. We keep it hidden
                      during the loading phase and reveal it once seeding is done. */}
                  {isCreatingMoodboard && (
                    <div className={moodboardReady ? "mb-6" : "hidden"}>
                      <h3 className="font-serif italic text-2xl mb-2 text-foreground/85">Your Moodboard</h3>
                      {analysisResult.moodboardDescription && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {analysisResult.moodboardDescription}
                        </p>
                      )}
                      <ConclusionVisuals
                        dominantColors={editableColors}
                        onDominantColorsChange={setEditableColors}
                        styleNames={
                          selectedStyleIndex !== null
                            ? [analysisResult.styles[selectedStyleIndex].styleName]
                            : analysisResult.styles.map((s) => s.styleName)
                        }
                        seedElements={analysisResult.materials || []}
                        iconicItems={Object.fromEntries(
                          analysisResult.styles
                            .filter((s) => s.iconicItem)
                            .map((s) => [s.styleName, s.iconicItem as string]),
                        )}
                        mustIncludeItems={pinnedVisuals}
                        extraMaterials={moodboardExtras}
                        onMoodboardChange={setMoodboard}
                        onSeedReady={() => setMoodboardReady(true)}
                      />
                    </div>
                  )}

                  {/* Loading screen between Step 1 (style matches) and Step 2 (moodboard) */}
                  {isCreatingMoodboard && !moodboardReady && (
                    <div className="flex flex-col items-center justify-center py-16 px-6 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 mb-6">
                      <div className="relative mb-6">
                        <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                        <Loader2 className="w-16 h-16 text-primary/40 animate-spin absolute -top-2 -left-2" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Creating your moodboard…</h3>
                      <p className="text-sm text-muted-foreground text-center max-w-sm">
                        We're curating 3 furniture and 3 decor references that match your style. This usually takes a few seconds.
                      </p>
                    </div>
                  )}

                  {/* Step 1: Style Matches — only visible before moodboard creation starts */}
                  {!isCreatingMoodboard && (
                    <>
                  <h3 className="text-sm font-semibold mb-2">Style Matches</h3>
                  <div className="space-y-3">
                    {analysisResult.styles.map((style, index) => (
                      <div
                        role="button"
                        tabIndex={0}
                        key={index}
                        onClick={() => setSelectedStyleIndex(index)}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedStyleIndex(index); } }}
                        className={`w-full text-left p-4 rounded-xl transition-all cursor-pointer ${selectedStyleIndex === index ? "bg-primary/10 border-2 border-primary ring-2 ring-primary/20" : "bg-secondary/50 border-2 border-transparent hover:border-primary/30"}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{style.styleName}</h3>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(style.confidence * 100)}% match
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
                                selected={selectedInspirations.includes(id)}
                                inMoodboard={moodboardExtras.includes(keyword)}
                                pinned={pinnedVisuals.some((p) => p.label === keyword)}
                                onPin={(label, imageUrl) => {
                                  setPinnedVisuals((prev) =>
                                    prev.some((p) => p.label.toLowerCase() === label.toLowerCase())
                                      ? prev
                                      : [...prev, { label, imageUrl }],
                                  );
                                  toast({ title: "Pinned to moodboard", description: label });
                                }}
                                onToggle={() => {
                                  setSelectedStyleIndex(index);
                                  setSelectedInspirations((prev) =>
                                    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
                                  );
                                  setInspirationDetailsMap((prev) => ({
                                    ...prev,
                                    [id]: { label: keyword, description: `${style.styleName}: ${keyword}`, type: "tag" },
                                  }));
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Detect another style */}
                  <div className="mt-4 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDetectAnotherStyle}
                      disabled={isDetectingMore}
                    >
                      {isDetectingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Detecting...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Detect another style
                        </>
                      )}
                    </Button>
                  </div>
                    </>
                  )}
                </div>

                {/* Step 1 CTA: kick off moodboard creation */}
                {!isCreatingMoodboard && (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      setMoodboardReady(false);
                      setIsCreatingMoodboard(true);
                    }}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create my moodboard
                  </Button>
                )}

                {/* Step 2 CTA: continue once moodboard is ready */}
                {isCreatingMoodboard && moodboardReady && (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleContinue}
                  >
                    Continue with your own unique moodboard
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalyzeRoom;
