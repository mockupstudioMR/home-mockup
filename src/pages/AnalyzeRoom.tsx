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
  const [moodboard, setMoodboard] = useState<{
    materials: { label: string; imageUrl?: string }[];
    references: { label: string; imageUrl?: string }[];
    mustInclude: { label: string; imageUrl?: string }[];
  }>({ materials: [], references: [], mustInclude: [] });

  // No persistence — every visit to /analyze-room starts with a clean slate.
  useEffect(() => {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, [uploadedImages, analysisResult]);

  // Upload optimized image to storage and return public URL
  const uploadToStorage = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const optimizedFile = await optimizeImageFile(file, { maxDimension: 2048 });
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;

    const { error } = await supabase.storage
      .from('room-photos')
      .upload(fileName, optimizedFile, { contentType: optimizedFile.type });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('room-photos')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
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
      const newUrls = (await Promise.all(uploads)).filter(Boolean) as string[];

      if (newUrls.length > 0) {
        setUploadedImages(prev => [...prev, ...newUrls].slice(0, 6));
        setAnalysisResult(null);
        setSelectedStyleIndex(null);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: "Please try again",
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
      trackEvent("ai_call", "analyze-room", { fn: "analyze-style" });
      const { data, error } = await supabase.functions.invoke("analyze-style", {
        body: { images: uploadedImages, mode: "room" },
      });

      if (error) throw error;

      setAnalysisResult(data);
      setEditableColors(data.dominantColors || []);
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
          mustInclude: moodboard.mustInclude,
        },
      }
    });
  };

  const handleDetectAnotherStyle = async () => {
    if (!analysisResult || uploadedImages.length === 0) return;
    setIsDetectingMore(true);
    try {
      trackEvent("ai_call", "analyze-room", { fn: "analyze-style", action: "detect-another" });
      const { data, error } = await supabase.functions.invoke("analyze-style", {
        body: {
          images: uploadedImages,
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
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Upload Room Inspiration
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Share photos of rooms you love and we'll analyze the styles to create your personalized moodboard
            </p>
          </div>

          {/* Upload Area */}
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
                        <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
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

          {/* Analysis Result */}
          {analysisResult && (
            <Card className="border-primary/30 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6 space-y-6">
                {/* Per-image breakdown removed per request */}

                <div>
                  <h2 className="text-xl font-semibold mb-1">Overall Conclusion</h2>
                  {analysisResult.moodboardDescription && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {analysisResult.moodboardDescription}
                    </p>
                  )}

                  {/* Conclusion Moodboard — colors, materials, and style references */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-2">Conclusion Moodboard</h3>
                    <ConclusionVisuals
                      dominantColors={editableColors}
                      onDominantColorsChange={setEditableColors}
                      styleNames={analysisResult.styles.map((s) => s.styleName)}
                      seedElements={analysisResult.materials || []}
                      iconicItems={Object.fromEntries(
                        analysisResult.styles
                          .filter((s) => s.iconicItem)
                          .map((s) => [s.styleName, s.iconicItem as string]),
                      )}
                      extraMaterials={moodboardExtras}
                      onMoodboardChange={setMoodboard}
                    />
                  </div>



                  <h3 className="text-sm font-semibold mb-2">Style Matches</h3>
                  <div className="space-y-3">
                    {analysisResult.styles.map((style, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => setSelectedStyleIndex(index)}
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
                      </button>
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
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleContinue}
                >
                  Continue with your own unique moodboard
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default AnalyzeRoom;
