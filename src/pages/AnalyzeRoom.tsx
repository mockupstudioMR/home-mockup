import { useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/QuizContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Upload, X, Loader2, Sparkles, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StyleInspirationCards, { type InspirationDetail } from "@/components/analyze/StyleInspirationCards";
import { trackEvent } from "@/lib/analytics";

interface AnalyzedStyle {
  styleName: string;
  confidence: number;
  description: string;
  keywords: string[];
}

interface AnalysisResult {
  styles: AnalyzedStyle[];
  moodboardDescription: string;
  dominantColors: string[];
}

const STORAGE_KEY = "analyze_room_cache";

// Store only metadata (URLs), not base64 data
const getInitialState = (): { images: string[]; result: AnalysisResult | null } => {
  try {
    const cached = sessionStorage.getItem(STORAGE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {
    // Ignore parse errors
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
  const [isDetectingMore, setIsDetectingMore] = useState(false);

  // Persist state to sessionStorage - URLs are small so they fit
  useEffect(() => {
    try {
      // Only store URLs (not base64) - they're small enough for sessionStorage
      const urlImages = uploadedImages.filter(img => !img.startsWith('data:'));
      const data = { images: urlImages, result: analysisResult };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [uploadedImages, analysisResult]);

  // Upload file to Supabase storage and return public URL
  const uploadToStorage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('room-photos')
      .upload(fileName, file);
    
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
    const files = e.target.files;
    if (!files || !user) return;

    setIsUploading(true);
    const newUrls: string[] = [];
    
    try {
      for (const file of Array.from(files)) {
        if (file.type.startsWith("image/")) {
          const url = await uploadToStorage(file);
          if (url) {
            newUrls.push(url);
          }
        }
      }

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
  }, [user, toast]);

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
    if (analysisResult && selectedStyleIndex !== null) {
      const selectedStyle = analysisResult.styles[selectedStyleIndex];
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
          selectedInspirations,
          inspirationDetails: selectedInspirations.map(id => inspirationDetailsMap[id]).filter(Boolean),
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
                <div>
                  <h2 className="text-xl font-semibold mb-4">Detected Styles</h2>
                  <div className="space-y-4">
                    {analysisResult.styles.map((style, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => setSelectedStyleIndex(index)}
                        className={`w-full text-left p-4 rounded-xl transition-all cursor-pointer ${selectedStyleIndex === index ? "bg-primary/10 border-2 border-primary ring-2 ring-primary/20" : "bg-secondary/50 border-2 border-transparent hover:border-primary/30"}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{style.styleName}</h3>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(style.confidence * 100)}% match
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{style.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {style.keywords.map((keyword) => (
                            <span
                              key={keyword}
                              className="text-xs px-2 py-1 rounded-full bg-background text-foreground"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>

                        {/* Inline moodboard & accent furniture */}
                        <StyleInspirationCards
                          styleIndex={index}
                          styleName={style.styleName}
                          keywords={style.keywords}
                          selectedItems={selectedInspirations}
                          onToggle={(id) => {
                            // Auto-select this style when toggling its inspiration
                            setSelectedStyleIndex(index);
                            setSelectedInspirations((prev) =>
                              prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
                            );
                          }}
                          onItemsReady={(details) => {
                            setInspirationDetailsMap(prev => {
                              const next = { ...prev };
                              for (const d of details) {
                                next[d.id] = { label: d.label, description: d.description, type: d.type };
                              }
                              return next;
                            });
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editable Color Palette */}
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
                    {/* Add color button */}
                    <label className="w-12 h-12 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer transition-colors">
                      <Plus className="w-5 h-5 text-muted-foreground" />
                      <input
                        type="color"
                        defaultValue="#808080"
                        onChange={(e) => {
                          setEditableColors((prev) => [...prev, e.target.value]);
                        }}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                {/* Moodboard Description */}
                <div>
                  <h3 className="font-semibold mb-2">Style Summary</h3>
                  <p className="text-muted-foreground">{analysisResult.moodboardDescription}</p>
                </div>

                <Button size="lg" className="w-full" onClick={handleContinue} disabled={selectedStyleIndex === null || selectedInspirations.length < 1}>
                  {selectedInspirations.length > 0 && selectedStyleIndex !== null
                    ? `Select elements and colors to continue with ${analysisResult.styles[selectedStyleIndex]?.styleName}`
                    : "Select at least one element to continue"}
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
