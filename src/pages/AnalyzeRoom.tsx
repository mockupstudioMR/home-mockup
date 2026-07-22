import { useNavigate, useLocation } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/QuizContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Upload, X, Loader2, Sparkles, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ConclusionVisuals from "@/components/analyze/ConclusionVisuals";
import type { ConclusionSection } from "@/components/analyze/ConclusionVisuals";
import MoodboardCollage from "@/components/analyze/MoodboardCollage";
import TagVisual from "@/components/analyze/TagVisual";
import { RefreshCw as RefreshIcon } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { getAiOptimizedImageUrl, getThumbnailImageUrl, optimizeImageFile } from "@/lib/imageOptimization";
import { getAiErrorMessage } from "@/lib/aiErrorMessage";

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

// Persist across navigation so users can go Back to Moodboard without losing work.
interface PersistedState {
  images: string[];
  result: AnalysisResult | null;
  selectedStyleIndex: number | null;
  selectedInspirations: string[];
  inspirationDetailsMap: Record<string, { label: string; description: string; type: string }>;
  editableColors: string[];
  moodboardExtras: string[];
  moodboardReady: boolean;
  moodboardStep: number;
  pinnedVisuals: { label: string; imageUrl: string }[];
  moodboard: {
    materials: { label: string; imageUrl?: string }[];
    references: { label: string; imageUrl?: string }[];
    furnitureReferences: { label: string; imageUrl?: string }[];
    decorReferences: { label: string; imageUrl?: string }[];
    architectureReferences: { label: string; imageUrl?: string }[];
    mustInclude: { label: string; imageUrl?: string }[];
  };
}

const loadPersisted = (): Partial<PersistedState> => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<PersistedState>;
  } catch {
    return {};
  }
};

const persisted = loadPersisted();

const AnalyzeRoom = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isExistingRoom = location.pathname.startsWith("/existing-room");
  const { user, loading } = useAuth();
  const { quizData, updateQuizData } = useQuiz();
  const { toast } = useToast();
  
  const [uploadedImages, setUploadedImages] = useState<string[]>(() => persisted.images || []);
  const stylePrompt: string | undefined = (() => {
    const fromState = (location.state as { prompt?: string } | null)?.prompt;
    if (fromState && fromState.trim().length > 0) return fromState;
    try {
      const cached = sessionStorage.getItem("capture_vision");
      if (cached) {
        const parsed = JSON.parse(cached) as { mode?: string; prompt?: string };
        if (parsed?.mode === "describe" && parsed.prompt && parsed.prompt.trim().length > 0) {
          return parsed.prompt;
        }
      }
    } catch { /* ignore */ }
    return undefined;
  })();
  const isPromptMode = Boolean(stylePrompt && stylePrompt.trim().length > 0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(() => persisted.result || null);
  const [selectedStyleIndex, setSelectedStyleIndex] = useState<number | null>(persisted.selectedStyleIndex ?? null);
  const [selectedInspirations, setSelectedInspirations] = useState<string[]>(persisted.selectedInspirations || []);
  const [inspirationDetailsMap, setInspirationDetailsMap] = useState<Record<string, { label: string; description: string; type: string }>>(persisted.inspirationDetailsMap || {});
  const [editableColors, setEditableColors] = useState<string[]>(persisted.editableColors || persisted.result?.dominantColors || []);
  const [refreshKeys, setRefreshKeys] = useState<Record<number, number>>({});
  // (conclusion moodboard manages its own regeneration internally)
  const [isDetectingMore, setIsDetectingMore] = useState(false);
  const [moodboardExtras, setMoodboardExtras] = useState<string[]>(persisted.moodboardExtras || []);
  // Two-step flow: after analysis the user picks/confirms a style first,
  // then explicitly triggers moodboard creation (which seeds 3 furniture +
  // 3 decor references behind a loading screen).
  const [isCreatingMoodboard, setIsCreatingMoodboard] = useState(false);
  const [moodboardReady, setMoodboardReady] = useState<boolean>(persisted.moodboardReady || false);
  const [moodboardStep, setMoodboardStep] = useState<number>(persisted.moodboardStep ?? 0);
  const [pinnedVisuals, setPinnedVisuals] = useState<{ label: string; imageUrl: string }[]>(persisted.pinnedVisuals || []);
  const [moodboard, setMoodboard] = useState<{
    materials: { label: string; imageUrl?: string }[];
    references: { label: string; imageUrl?: string }[];
    furnitureReferences: { label: string; imageUrl?: string }[];
    decorReferences: { label: string; imageUrl?: string }[];
    architectureReferences: { label: string; imageUrl?: string }[];
    mustInclude: { label: string; imageUrl?: string }[];
  }>(persisted.moodboard || { materials: [], references: [], furnitureReferences: [], decorReferences: [], architectureReferences: [], mustInclude: [] });

  // Persist state so users can navigate away (e.g. to /generate) and return via
  // "Back to Moodboard" without losing their design, analysis, or moodboard.
  useEffect(() => {
    try {
      const snapshot: PersistedState = {
        images: uploadedImages,
        result: analysisResult,
        selectedStyleIndex,
        selectedInspirations,
        inspirationDetailsMap,
        editableColors,
        moodboardExtras,
        moodboardReady,
        moodboardStep,
        pinnedVisuals,
        moodboard,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch { /* ignore quota */ }
  }, [uploadedImages, analysisResult, selectedStyleIndex, selectedInspirations, inspirationDetailsMap, editableColors, moodboardExtras, moodboardReady, moodboardStep, pinnedVisuals, moodboard]);

  // Prompt-driven path: skip upload, run analysis immediately on mount.
  useEffect(() => {
    if (isPromptMode && !analysisResult && !isAnalyzing) {
      analyzeImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPromptMode]);

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
    if (uploadedImages.length === 0 && !isPromptMode) return;

    setIsAnalyzing(true);
    try {
      const aiImages = uploadedImages.map(getAiOptimizedImageUrl);
      trackEvent("ai_call", "analyze-room", { fn: "analyze-style" });
      const { data, error } = await supabase.functions.invoke("analyze-style", {
        body: { images: aiImages, mode: "room", prompt: isPromptMode ? stylePrompt : undefined },
      });

      if (error) throw error;

      setAnalysisResult(data);
      setEditableColors(data.dominantColors || []);
      // Auto-select first style + jump straight to moodboard creation for prompt mode
      if (isPromptMode) {
        setSelectedStyleIndex(0);
        setIsCreatingMoodboard(true);
        setMoodboardReady(false);
      } else {
        // New analysis → reset moodboard step
        setIsCreatingMoodboard(false);
        setMoodboardReady(false);
      }
      toast({
        title: "Analysis complete!",
        description: `Detected ${data.styles.length} interior styles`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: getAiErrorMessage(error),
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

    const stylePref = selectedStyle.styleName.toLowerCase().replace(/\s+/g, "-");
    const roomType = quizData?.roomType || "living_room";
    const mergedQuizData = {
      ...quizData,
      stylePreference: stylePref,
      colorPalette: "neutral",
      roomType,
    };
    updateQuizData({
      stylePreference: stylePref,
      colorPalette: "neutral",
      roomType,
    });
    // Treat must-include items the same way the "Start with products" flow does:
    // pass them as `selectedProducts` + `productImageUrls` (with `includeProducts: true`)
    // so they get the highest visual weight in generate-design.
    const mustIncludeProducts = (moodboard.mustInclude || [])
      .filter((m) => m.imageUrl)
      .map((m) => ({
        productName: m.label || "Must-include item",
        category: "must-include",
        suggestedStyle: selectedStyle.styleName,
        description: `User pinned must-include: ${m.label || "item"}`,
      }));
    const mustIncludeImages = (moodboard.mustInclude || [])
      .map((m) => m.imageUrl)
      .filter(Boolean) as string[];

    navigate("/generate", {
      state: {
        quizData: mergedQuizData,
        selectedStyle: {
          id: selectedStyle.styleName.toLowerCase().replace(/\s+/g, "-"),
          title: selectedStyle.styleName,
          description: selectedStyle.description,
        },
        analysisResult: { ...analysisResult, dominantColors: editableColors },
        sourceImages: mustIncludeImages.length > 0 ? mustIncludeImages : uploadedImages,
        productAnalysis:
          mustIncludeProducts.length > 0
            ? { products: mustIncludeProducts, recommendedStyle: selectedStyle.styleName, styleDescription: selectedStyle.description, moodboardSuggestion: "" }
            : undefined,
        includeProducts: mustIncludeProducts.length > 0,
        selectedInspirations: allInspirations,
        inspirationDetails: allInspirations.map(id => aggregatedDetailsMap[id]).filter(Boolean),
        moodboard: {
          colors: editableColors,
          materials: moodboard.materials,
          references: moodboard.references,
          furnitureReferences: moodboard.furnitureReferences,
          decorReferences: moodboard.decorReferences,
          architectureReferences: moodboard.architectureReferences,
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
      toast({ title: "Couldn't detect another style", description: getAiErrorMessage(err), variant: "destructive" });
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

  // Do not force auth here — the moodboard state is cached in sessionStorage
  // so users returning via "Back to Moodboard" can always see their work.

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-2xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-2xl" />
      </div>

      {/* Creative inspiration shapes — subtle, themed */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <svg className="absolute top-32 right-[8%] w-24 h-24 text-primary/20 animate-[spin_60s_linear_infinite]" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 6" />
          <circle cx="30" cy="40" r="6" fill="currentColor" opacity="0.5" />
          <circle cx="65" cy="35" r="5" fill="hsl(var(--accent))" opacity="0.4" />
          <circle cx="60" cy="65" r="7" fill="hsl(var(--secondary))" opacity="0.6" />
          <circle cx="35" cy="65" r="4" fill="currentColor" opacity="0.4" />
        </svg>
        <svg className="absolute top-[55%] left-[5%] w-20 h-20 text-accent/25" viewBox="0 0 100 100" fill="none">
          <polygon points="50,15 90,85 10,85" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <svg className="absolute top-[20%] left-[10%] w-40 h-12 text-primary/20" viewBox="0 0 200 40" fill="none">
          <path d="M0 20 Q 25 0, 50 20 T 100 20 T 150 20 T 200 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <svg className="absolute bottom-[15%] left-[20%] w-32 h-10 text-secondary/40" viewBox="0 0 200 40" fill="none">
          <path d="M0 20 Q 25 5, 50 20 T 100 20 T 150 20 T 200 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <svg className="absolute bottom-32 right-[15%] w-16 h-16 text-primary/25" viewBox="0 0 60 60" fill="none">
          <rect x="5" y="5" width="50" height="50" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 4" rx="4" />
          <circle cx="30" cy="30" r="3" fill="currentColor" opacity="0.6" />
        </svg>
        <svg className="absolute top-[40%] right-[20%] w-28 h-6 text-accent/30 -rotate-12" viewBox="0 0 200 20" fill="none">
          <path d="M5 10 Q 100 2, 195 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <svg className="absolute top-[15%] right-[35%] w-10 h-10 text-primary/30" viewBox="0 0 40 40" fill="none">
          <path d="M20 5 V35 M5 20 H35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <svg className="absolute bottom-[28%] right-[5%] w-20 h-20 opacity-40 rotate-12" viewBox="0 0 80 80" fill="none">
          <rect x="10" y="10" width="40" height="40" rx="4" fill="hsl(var(--primary))" opacity="0.3" />
          <rect x="22" y="22" width="40" height="40" rx="4" fill="hsl(var(--accent))" opacity="0.35" />
          <rect x="34" y="34" width="40" height="40" rx="4" fill="hsl(var(--secondary))" opacity="0.5" />
        </svg>
        <svg className="absolute top-[70%] right-[40%] w-16 h-8 text-primary/30" viewBox="0 0 80 40" fill="currentColor">
          <circle cx="8" cy="20" r="2" />
          <circle cx="24" cy="12" r="2.5" />
          <circle cx="40" cy="22" r="2" />
          <circle cx="56" cy="14" r="2.5" />
          <circle cx="72" cy="20" r="2" />
        </svg>

        {/* Additional creative shapes */}
        {/* Hexagon */}
        <svg className="absolute top-[8%] left-[30%] w-16 h-16 text-accent/25" viewBox="0 0 100 100" fill="none">
          <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        {/* Crosshatch lines */}
        <svg className="absolute top-[28%] right-[5%] w-20 h-20 text-primary/20 rotate-12" viewBox="0 0 80 80" fill="none">
          <path d="M10 20 H70 M10 35 H70 M10 50 H70 M10 65 H70" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
        {/* Diamond outline */}
        <svg className="absolute top-[78%] left-[8%] w-14 h-14 text-secondary/45" viewBox="0 0 60 60" fill="none">
          <polygon points="30,5 55,30 30,55 5,30" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        {/* Concentric circles — ripple */}
        <svg className="absolute top-[48%] left-[42%] w-20 h-20 text-primary/15" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="50" r="28" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1" />
        </svg>
        {/* Spiral / swirl */}
        <svg className="absolute bottom-[8%] right-[30%] w-16 h-16 text-accent/30" viewBox="0 0 100 100" fill="none">
          <path d="M50 50 m -30 0 a 30 30 0 1 1 60 0 a 22 22 0 1 1 -44 0 a 14 14 0 1 1 28 0 a 6 6 0 1 1 -12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {/* Star spark */}
        <svg className="absolute top-[35%] left-[25%] w-8 h-8 text-primary/35" viewBox="0 0 40 40" fill="currentColor">
          <path d="M20 4 L23 17 L36 20 L23 23 L20 36 L17 23 L4 20 L17 17 Z" />
        </svg>
        {/* Small star */}
        <svg className="absolute top-[62%] right-[12%] w-6 h-6 text-secondary/50" viewBox="0 0 40 40" fill="currentColor">
          <path d="M20 4 L23 17 L36 20 L23 23 L20 36 L17 23 L4 20 L17 17 Z" />
        </svg>
        {/* Arc / brushstroke */}
        <svg className="absolute top-[65%] left-[35%] w-32 h-16 text-primary/20 rotate-6" viewBox="0 0 200 80" fill="none">
          <path d="M10 60 Q 100 -10, 190 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {/* Filled blob */}
        <svg className="absolute top-[88%] right-[22%] w-20 h-16 opacity-30" viewBox="0 0 100 80" fill="hsl(var(--accent))">
          <path d="M20 40 Q 10 10, 50 15 Q 95 5, 85 45 Q 90 75, 50 70 Q 5 80, 20 40 Z" />
        </svg>
        {/* Circle outline */}
        <svg className="absolute top-[5%] left-[55%] w-12 h-12 text-primary/25" viewBox="0 0 50 50" fill="none">
          <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        {/* Vertical wavy line */}
        <svg className="absolute top-[10%] right-[10%] w-8 h-32 text-secondary/35" viewBox="0 0 40 200" fill="none">
          <path d="M20 0 Q 0 25, 20 50 T 20 100 T 20 150 T 20 200" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {/* Tick marks / ruler */}
        <svg className="absolute bottom-[40%] left-[3%] w-6 h-32 text-primary/25" viewBox="0 0 30 200" fill="none">
          <path d="M5 10 H25 M5 30 H20 M5 50 H25 M5 70 H20 M5 90 H25 M5 110 H20 M5 130 H25 M5 150 H20 M5 170 H25 M5 190 H20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
        {/* Plus mark */}
        <svg className="absolute bottom-[50%] right-[45%] w-6 h-6 text-accent/40" viewBox="0 0 40 40" fill="none">
          <path d="M20 8 V32 M8 20 H32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {/* Tiny dots scatter */}
        <svg className="absolute top-[45%] left-[50%] w-10 h-10 text-primary/30" viewBox="0 0 50 50" fill="currentColor">
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="30" cy="15" r="1.5" />
          <circle cx="20" cy="30" r="1.5" />
          <circle cx="40" cy="35" r="1.5" />
        </svg>
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
              {isCreatingMoodboard
                ? "Your Moodboard"
                : analysisResult
                ? (isExistingRoom ? "We detected these styles" : "Style Matches")
                : isPromptMode
                ? "Matching your style…"
                : (isExistingRoom ? "Upload photos of your room" : "Upload Room Inspiration")}
            </h1>
            {!analysisResult && (
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {isPromptMode
                  ? "We're translating your description into a personalized moodboard"
                  : isExistingRoom
                  ? "Show us how it looks now — we'll detect everything in it"
                  : "Share photos of rooms you love and we'll analyze the styles to create your personalized moodboard"}
              </p>
            )}
          </div>

          {/* Upload Area — hidden once analysis exists */}
          {!analysisResult && !isPromptMode && (
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

          {/* Prompt mode loader — shown while analyzing from a text description */}
          {!analysisResult && isPromptMode && (
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                <div className="relative mb-5">
                  <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                  <Loader2 className="w-16 h-16 text-primary/40 animate-spin absolute -top-2 -left-2" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Reading your description…</h3>
                {stylePrompt && (
                  <p className="text-sm text-muted-foreground italic max-w-md">
                    "{stylePrompt}"
                  </p>
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
                      {(() => {
                         // Single-page moodboard: show every section at once so it
                         // reads like a real moodboard collage — colors, materials,
                         // architecture, furniture, decor — with Must-include kept.
                         const STEP_SECTIONS: ConclusionSection[][] = [
                           ["must-include", "colors", "materials", "architecture", "furniture", "decor"],
                         ];
                         const STEP_META = [
                           {
                             title: "Your moodboard",
                             subtitle: analysisResult.moodboardDescription || "Colors, materials, architecture, furniture and decor — pinned together like a real moodboard. Your Must-include pieces stay up top.",
                           },
                         ];
                         const meta = STEP_META[0];
                         const sections = STEP_SECTIONS[0];
                        return (
                          <>
                            {/* Quiz-style question header */}
                            <div className="mb-6 text-center">
                              <div
                                className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2"
                                style={{ fontFamily: "'Caveat', cursive", letterSpacing: "0.15em", fontSize: "0.95rem", textTransform: "none" }}
                              >
                                a moodboard, curated for you
                              </div>
                              <h2 className="text-3xl md:text-4xl font-semibold leading-tight mb-2">
                                {meta.title}
                              </h2>
                              {meta.subtitle && (
                                <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
                                  {meta.subtitle}
                                </p>
                              )}
                            </div>

                            {/* Collage view — real moodboard aesthetic */}
                            <div className="mb-8">
                              <MoodboardCollage
                                inspiration={uploadedImages}
                                colors={editableColors}
                                materials={moodboard.materials}
                                architecture={moodboard.architectureReferences}
                                furniture={moodboard.furnitureReferences}
                                decor={moodboard.decorReferences}
                                mustInclude={moodboard.mustInclude}
                                headline="a moodboard, curated for you"
                              />
                            </div>

                            {/* Editable moodboard sections — pin, add, refine */}
                            <details className="group rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
                              <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between text-sm font-medium text-foreground/80 hover:text-foreground">
                                <span>Edit your moodboard — pin, add, refine</span>
                                <span className="text-xs text-muted-foreground group-open:hidden">Open</span>
                                <span className="text-xs text-muted-foreground hidden group-open:inline">Close</span>
                              </summary>
                              <div className="p-4 pt-0">
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
                        roomDescription={analysisResult.moodboardDescription}
                        mustIncludeItems={pinnedVisuals}
                        extraMaterials={moodboardExtras}
                        onMoodboardChange={setMoodboard}
                        onSeedReady={() => setMoodboardReady(true)}
                                visibleSections={sections}
                              />
                              </div>
                            </details>
                          </>
                        );
                      })()}
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
                  <Button size="lg" className="w-full" onClick={handleContinue}>
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
