import { useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/QuizContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home, ArrowLeft, ArrowRight, Upload, X, Loader2, Sparkles, Check,
  Sofa, Bed, UtensilsCrossed, Monitor, Bath, Camera, Eye, Lock, Paintbrush,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Style images
import classicHistorical from "@/assets/styles/classic-historical.png";
import modernMinimal from "@/assets/styles/modern-minimal.png";
import rusticNature from "@/assets/styles/rustic-nature.png";
import mediterranean from "@/assets/styles/mediterranean.png";
import bohemianEclectic from "@/assets/styles/bohemian-eclectic.png";
import glamLuxe from "@/assets/styles/glam-luxe.png";

const rooms = [
  { value: "living-room", label: "Living Room", icon: <Sofa className="w-6 h-6" /> },
  { value: "bedroom", label: "Bedroom", icon: <Bed className="w-6 h-6" /> },
  { value: "kitchen", label: "Kitchen", icon: <UtensilsCrossed className="w-6 h-6" /> },
  { value: "office", label: "Home Office", icon: <Monitor className="w-6 h-6" /> },
  { value: "bathroom", label: "Bathroom", icon: <Bath className="w-6 h-6" /> },
];

const styleImages: Record<string, string> = {
  modern: modernMinimal, minimal: modernMinimal, scandinavian: modernMinimal,
  classic: classicHistorical, historical: classicHistorical, traditional: classicHistorical,
  rustic: rusticNature, nature: rusticNature, farmhouse: rusticNature,
  mediterranean: mediterranean, coastal: mediterranean,
  bohemian: bohemianEclectic, eclectic: bohemianEclectic,
  glam: glamLuxe, luxe: glamLuxe, luxury: glamLuxe,
};

function getStyleImage(styleName: string): string {
  const lower = styleName.toLowerCase();
  for (const [key, img] of Object.entries(styleImages)) {
    if (lower.includes(key)) return img;
  }
  return modernMinimal;
}

const categoryIcons: Record<string, typeof Sofa> = {
  furniture: Sofa,
  wall: Paintbrush,
  flooring: Paintbrush,
  lighting: Sparkles,
  window: Eye,
  rug: Paintbrush,
  decor: Sparkles,
  architectural: Home,
};

interface DetectedStyle {
  styleName: string;
  confidence: number;
  description: string;
  keywords: string[];
}

interface RoomElement {
  label: string;
  category: string;
  description: string;
}

interface AnalysisResult {
  styles: DetectedStyle[];
  dominantColors: string[];
  moodboardDescription: string;
  roomElements?: RoomElement[];
}

type Step = "room-type" | "upload" | "analyzing" | "results" | "customize";

const ExistingRoomFlow = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { updateQuizData } = useQuiz();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("room-type");
  const [roomType, setRoomType] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedStyleIndex, setSelectedStyleIndex] = useState<number | null>(null);
  // Keep/change state: maps element label to "keep" | "change"
  const [elementChoices, setElementChoices] = useState<Record<string, "keep" | "change">>({});

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    if (!imageFiles.length) return;

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of imageFiles.slice(0, 4 - images.length)) {
        const ext = file.name.split(".").pop();
        const fileName = `${user.id}/existing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const { error } = await supabase.storage.from("room-photos").upload(fileName, file);
        if (error) throw error;
        const { data } = supabase.storage.from("room-photos").getPublicUrl(fileName);
        urls.push(data.publicUrl);
      }
      setImages(prev => [...prev, ...urls]);
      toast({ title: "Photos uploaded!", description: `${urls.length} photo(s) added` });
    } catch {
      toast({ title: "Upload failed", description: "Please try again", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [user, images, toast]);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const analyzeRoom = async () => {
    if (!images.length) return;
    setStep("analyzing");
    try {
      const { data, error } = await supabase.functions.invoke("analyze-style", {
        body: { images, mode: "room" },
      });
      if (error) throw error;
      setAnalysisResult(data);
      // Initialize all elements as "change" by default
      if (data.roomElements) {
        const initial: Record<string, "keep" | "change"> = {};
        data.roomElements.forEach((el: RoomElement) => {
          initial[el.label] = "change";
        });
        setElementChoices(initial);
      }
      setStep("results");
      toast({ title: "Analysis complete!", description: `Detected ${data.styles?.length || 0} styles` });
    } catch {
      toast({ title: "Analysis failed", description: "Please try again", variant: "destructive" });
      setStep("upload");
    }
  };

  const toggleElement = (label: string) => {
    setElementChoices(prev => ({
      ...prev,
      [label]: prev[label] === "keep" ? "change" : "keep",
    }));
  };

  const setAllElements = (choice: "keep" | "change") => {
    setElementChoices(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(k => (updated[k] = choice));
      return updated;
    });
  };

  const handleContinue = () => {
    if (!analysisResult || selectedStyleIndex === null) return;
    const style = analysisResult.styles[selectedStyleIndex];
    const styleId = style.styleName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const keepElements = Object.entries(elementChoices)
      .filter(([, v]) => v === "keep")
      .map(([k]) => k);
    const changeElements = Object.entries(elementChoices)
      .filter(([, v]) => v === "change")
      .map(([k]) => k);

    updateQuizData({
      stylePreference: styleId,
      roomType: roomType || "living-room",
      colorPalette: "neutral",
    });

    navigate("/generate", {
      state: {
        selectedStyle: {
          id: styleId,
          title: style.styleName,
          description: style.description,
        },
        analysisResult,
        sourceImages: images,
        source: "existing-room",
        keepElements,
        changeElements,
      },
    });
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

  const stepNumber =
    step === "room-type" ? 1
    : step === "upload" ? 2
    : step === "analyzing" ? 3
    : step === "results" ? 3
    : 4;
  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-2xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-2xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <button
          onClick={() => {
            if (step === "upload") setStep("room-type");
            else if (step === "results") setStep("upload");
            else if (step === "customize") setStep("results");
            else navigate("/start");
          }}
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

      <main className="relative z-10 px-4 pb-24">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  s < stepNumber ? "bg-primary text-primary-foreground" :
                  s === stepNumber ? "bg-primary text-primary-foreground" :
                  "bg-muted text-muted-foreground"
                )}>
                  {s < stepNumber ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < totalSteps && (
                  <div className={cn("w-8 md:w-12 h-0.5", s < stepNumber ? "bg-primary" : "bg-muted")} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Room Type */}
          {step === "room-type" && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  What room are we redesigning?
                </h1>
                <p className="text-muted-foreground text-lg">
                  Select the type of room you want to transform
                </p>
              </div>
              <div className="grid gap-3">
                {rooms.map(room => (
                  <Card
                    key={room.value}
                    className={cn(
                      "cursor-pointer transition-all duration-200",
                      roomType === room.value
                        ? "ring-2 ring-primary border-primary bg-primary/5"
                        : "border-border/50 hover:border-primary/30"
                    )}
                    onClick={() => setRoomType(room.value)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                        roomType === room.value ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                      )}>
                        {room.icon}
                      </div>
                      <span className="text-lg font-medium">{room.label}</span>
                      {roomType === room.value && <Check className="w-5 h-5 text-primary ml-auto" />}
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Button size="lg" className="w-full" disabled={!roomType} onClick={() => setStep("upload")}>
                Continue <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Upload */}
          {step === "upload" && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Upload photos of your {rooms.find(r => r.value === roomType)?.label.toLowerCase() || "room"}
                </h1>
                <p className="text-muted-foreground text-lg">
                  Show us how it looks now — we'll detect everything in it
                </p>
              </div>
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  {images.length === 0 && !uploading ? (
                    <label className="flex flex-col items-center justify-center h-56 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                      <Camera className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">Upload room photos</p>
                      <p className="text-sm text-muted-foreground mt-1">Up to 4 photos • JPG, PNG</p>
                      <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
                    </label>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {images.map((url, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                            <img src={url} alt={`Room ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                            <button
                              onClick={() => removeImage(idx)}
                              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ))}
                        {images.length < 4 && (
                          <label className={cn(
                            "aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors",
                            uploading && "pointer-events-none opacity-50"
                          )}>
                            {uploading ? (
                              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            ) : (
                              <>
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground mt-2">Add more</span>
                              </>
                            )}
                            <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
                          </label>
                        )}
                      </div>
                      <Button size="lg" className="w-full" onClick={analyzeRoom} disabled={uploading}>
                        <Sparkles className="w-5 h-5 mr-2" /> Detect Style & Elements
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2.5: Analyzing */}
          {step === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <Eye className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <Loader2 className="absolute -top-2 -right-2 w-8 h-8 text-primary animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Analyzing your room...</h2>
                <p className="text-muted-foreground">Detecting styles, colors, and every element</p>
              </div>
            </div>
          )}

          {/* Step 3: Style Results */}
          {step === "results" && analysisResult && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  We detected these styles
                </h1>
                <p className="text-muted-foreground text-lg">
                  Select a target style for your redesign
                </p>
              </div>

              {/* Detected Colors */}
              {analysisResult.dominantColors?.length > 0 && (
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-3">Detected Colors</p>
                    <div className="flex gap-3">
                      {analysisResult.dominantColors.map((color, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div className="w-10 h-10 rounded-lg border border-border" style={{ backgroundColor: color }} />
                          <span className="text-[10px] text-muted-foreground">{color}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Style Cards */}
              <div className="space-y-4">
                {analysisResult.styles.map((style, index) => (
                  <Card
                    key={index}
                    className={cn(
                      "cursor-pointer overflow-hidden transition-all duration-300",
                      selectedStyleIndex === index
                        ? "ring-2 ring-primary border-primary"
                        : "border-border/50 hover:border-primary/30"
                    )}
                    onClick={() => setSelectedStyleIndex(index)}
                  >
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className="w-28 md:w-36 shrink-0">
                          <img src={getStyleImage(style.styleName)} alt={style.styleName} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                        <div className="flex-1 p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">{style.styleName}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(style.confidence * 100)}% match
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{style.description}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {style.keywords?.slice(0, 4).map(kw => (
                              <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{kw}</span>
                            ))}
                          </div>
                          {selectedStyleIndex === index && (
                            <div className="flex items-center gap-2 text-primary text-sm font-medium pt-1">
                              <Check className="w-4 h-4" /> Selected
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Continue to customize */}
              {selectedStyleIndex !== null && (
                <Button size="lg" className="w-full" onClick={() => setStep("customize")}>
                  Next: Choose What to Change <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          )}

          {/* Step 4: Customize — Keep / Change */}
          {step === "customize" && analysisResult && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  What do you want to change?
                </h1>
                <p className="text-muted-foreground text-lg">
                  We found {analysisResult.roomElements?.length || 0} elements — tap to keep or restyle each one
                </p>
              </div>

              {/* Quick actions */}
              <div className="flex gap-3 justify-center">
                <Button variant="outline" size="sm" onClick={() => setAllElements("keep")}>
                  <Lock className="w-4 h-4 mr-1.5" /> Keep All
                </Button>
                <Button variant="outline" size="sm" onClick={() => setAllElements("change")}>
                  <Paintbrush className="w-4 h-4 mr-1.5" /> Change All
                </Button>
              </div>

              {/* Room preview thumbnail */}
              {images[0] && (
                <div className="mx-auto max-w-sm rounded-xl overflow-hidden border border-border">
                  <img src={images[0]} alt="Your room" className="w-full aspect-video object-cover" loading="lazy" />
                </div>
              )}

              {/* Element list */}
              <div className="space-y-2">
                {(analysisResult.roomElements || []).map((el) => {
                  const choice = elementChoices[el.label] || "change";
                  const isKeep = choice === "keep";
                  const IconComponent = categoryIcons[el.category] || Sparkles;

                  return (
                    <Card
                      key={el.label}
                      className={cn(
                        "cursor-pointer transition-all duration-200",
                        isKeep
                          ? "border-primary/40 bg-primary/5"
                          : "border-accent/40 bg-accent/5"
                      )}
                      onClick={() => toggleElement(el.label)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          isKeep ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent-foreground"
                        )}>
                          <IconComponent className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{el.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{el.description}</p>
                        </div>

                        <Badge
                          variant={isKeep ? "default" : "secondary"}
                          className={cn(
                            "shrink-0 text-xs",
                            isKeep
                              ? "bg-primary text-primary-foreground"
                              : "bg-accent text-accent-foreground"
                          )}
                        >
                          {isKeep ? (
                            <><Lock className="w-3 h-3 mr-1" /> Keep</>
                          ) : (
                            <><Paintbrush className="w-3 h-3 mr-1" /> Change</>
                          )}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Summary */}
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      <Lock className="w-3.5 h-3.5 inline mr-1" />
                      Keeping {Object.values(elementChoices).filter(v => v === "keep").length} elements
                    </span>
                    <span className="text-muted-foreground">
                      <Paintbrush className="w-3.5 h-3.5 inline mr-1" />
                      Changing {Object.values(elementChoices).filter(v => v === "change").length} elements
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom CTA */}
      {step === "customize" && (
        <div className="fixed bottom-0 inset-x-0 p-4 bg-background/80 backdrop-blur-lg border-t border-border z-20">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <p className="font-medium">
                {analysisResult?.styles[selectedStyleIndex!]?.styleName}
              </p>
              <p className="text-sm text-muted-foreground">
                {Object.values(elementChoices).filter(v => v === "change").length} elements to restyle
              </p>
            </div>
            <Button size="lg" onClick={handleContinue}>
              Generate Design <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExistingRoomFlow;
