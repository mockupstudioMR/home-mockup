import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Send,
  Home,
  ArrowLeft,
  RefreshCw,
  Upload,
  X,
  Clock,
  Heart,
  Sparkles,
} from "lucide-react";
import type { QuizData } from "@/contexts/QuizContext";
import DesignImage from "@/components/generate/DesignImage";
import { trackEvent } from "@/lib/analytics";

import PersonalizedStyleProfile from "@/components/generate/PersonalizedStyleProfile";
import DesignItemsList from "@/components/generate/DesignItemsList";
import LoveThisButton from "@/components/generate/LoveThisButton";
import VisualSearchLinks from "@/components/generate/VisualSearchLinks";
import DesignHistoryTab from "@/components/generate/DesignHistoryTab";
import DesignLikesTab from "@/components/generate/DesignLikesTab";
import DebugPanel from "@/components/generate/DebugPanel";
import OtherAnglesButton from "@/components/generate/OtherAnglesButton";
import ExistingRoomUpload from "@/components/generate/ExistingRoomUpload";
import GenerationCountdown from "@/components/generate/GenerationCountdown";
import TryAnotherStyle from "@/components/generate/TryAnotherStyle";
import WallExtractionPanel from "@/components/generate/WallExtractionPanel";
import type { ExtractedWall } from "@/components/generate/WallExtractionPanel";
import FloorPlanComparison from "@/components/generate/FloorPlanComparison";
import { getStyleMoodboardUrls } from "@/lib/styleMoodboards";
import MoodboardElementsPanel, { type MoodboardItem, type MoodboardAction } from "@/components/generate/MoodboardElementsPanel";
import MoodboardRefinePanel from "@/components/generate/MoodboardRefinePanel";

interface GeneratedDesign {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  isFavorite: boolean;
  isLocked?: boolean;
}

interface AngleImage {
  label: string;
  imageUrl: string;
}

interface DesignHighlightsData {
  colorScheme: {
    colors: string[];
    description: string;
    visual?: string;
    materials?: string[];
  };
  accentFurniture: {
    name: string;
    description: string;
    visual?: string;
  };
  moodboard: {
    elements: string[];
    description: string;
    visual?: string;
  };
}

interface StyleMatch {
  style: string;
  percentage: number;
  color: string;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
  matched_product_id?: string;
  google_shopping_url?: string;
  google_images_url?: string;
  bounding_box?: BoundingBox;
  product_photo_url?: string;
  wall_type?: string;
  matchedProduct?: {
    id: string;
    name: string;
    price?: number;
    currency?: string;
    image_urls?: string[];
    source_url?: string;
    ai_style_tags?: string[];
  };
}

type GenerateMoodboard = {
  colors?: string[];
  materials?: { label: string; imageUrl?: string }[];
  references?: { label: string; imageUrl?: string }[];
  furnitureReferences?: { label: string; imageUrl?: string }[];
  decorReferences?: { label: string; imageUrl?: string }[];
  mustInclude?: { label: string; imageUrl?: string }[];
};

// Generate a suggested design name from style & room type
const generateDesignTitle = (style?: string, roomType?: string): string => {
  const styleTitles: Record<string, string[]> = {
    "modern-minimal": ["Clean Lines Retreat", "Minimal Serenity", "Modern Calm"],
    "bohemian-eclectic": ["Bohemian Dream", "Eclectic Oasis", "Free Spirit Haven"],
    "glam-luxe": ["Luxe Elegance", "Golden Hour Suite", "Glamorous Escape"],
    "rustic-nature": ["Nature's Embrace", "Rustic Warmth", "Woodland Comfort"],
    "mediterranean": ["Mediterranean Breeze", "Coastal Warmth", "Sun-Kissed Villa"],
    "classic-historical": ["Timeless Grandeur", "Heritage Charm", "Classic Revival"],
  };
  const roomLabels: Record<string, string> = {
    "living-room": "Living Room",
    bedroom: "Bedroom",
    kitchen: "Kitchen",
    bathroom: "Bathroom",
    office: "Home Office",
  };
  const styleKey = style?.replace(/_/g, "-") || "";
  const options = styleTitles[styleKey] || ["Inspired Design"];
  const pick = options[Math.floor(Math.random() * options.length)];
  const room = roomLabels[roomType || ""] || "Room";
  return `${pick} – ${room}`;
};

const Generate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const quizData = location.state?.quizData as QuizData | undefined;
  const resumeDesignId = location.state?.resumeDesignId as string | undefined;
  const existingRoomImagesFromState = (location.state?.quizData?.existingRoomImages || location.state?.existingRoomImages) as string[] | undefined;
  const keepElementsFromState = location.state?.keepElements as string[] | undefined;
  const changeElementsFromState = location.state?.changeElements as string[] | undefined;
  const isExistingRoomFlow = location.state?.source === "existing-room" || !!existingRoomImagesFromState?.length;
  const shouldUseFloorPlanContext =
    !location.state?.analysisResult &&
    !existingRoomImagesFromState?.length &&
    !location.state?.productAnalysis &&
    !location.state?.scenePreviewImage &&
    location.state?.source !== "existing-room";
  
  // Persist analysisResult and selectedInspirations to sessionStorage so they survive re-renders/HMR
  const selectedInspirations = (() => {
    const fromState = location.state?.selectedInspirations as string[] | undefined;
    if (fromState) {
      sessionStorage.setItem('generate_inspirations_cache', JSON.stringify(fromState));
      return fromState;
    }
    try {
      const cached = sessionStorage.getItem('generate_inspirations_cache');
      return cached ? JSON.parse(cached) as string[] : undefined;
    } catch { return undefined; }
  })();

  const inspirationDetails = (() => {
    type Detail = { label: string; description: string; type: string };
    const fromState = location.state?.inspirationDetails as Detail[] | undefined;
    if (fromState) {
      sessionStorage.setItem('generate_inspiration_details_cache', JSON.stringify(fromState));
      return fromState;
    }
    try {
      const cached = sessionStorage.getItem('generate_inspiration_details_cache');
      return cached ? JSON.parse(cached) as Detail[] : undefined;
    } catch { return undefined; }
  })();

  const analysisResult = (() => {
    type AnalysisData = { styles?: Array<{ styleName: string; keywords: string[] }>; dominantColors?: string[]; moodboardDescription?: string };
    const fromState = location.state?.analysisResult as AnalysisData | undefined;
    if (fromState) {
      sessionStorage.setItem('generate_analysis_cache', JSON.stringify(fromState));
      return fromState;
    }
    try {
      const cached = sessionStorage.getItem('generate_analysis_cache');
      return cached ? JSON.parse(cached) as AnalysisData : undefined;
    } catch { return undefined; }
  })();

  const routeMoodboard = location.state?.moodboard as GenerateMoodboard | undefined;
  const currentMoodboard = (() => {
    if (routeMoodboard) return routeMoodboard;
    try {
      const cached = sessionStorage.getItem("generate_moodboard_cache");
      return cached ? (JSON.parse(cached) as GenerateMoodboard) : undefined;
    } catch {
      return undefined;
    }
  })();

  console.log('[Generate] analysisResult colors:', analysisResult?.dominantColors, 'keywords:', analysisResult?.styles?.flatMap(s => s.keywords));

  // Initialize state from sessionStorage to persist across tab switches
  const getInitialDesign = (): GeneratedDesign | null => {
    try {
      const cached = sessionStorage.getItem('generate_design_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const getInitialAngleImages = (): AngleImage[] => {
    try {
      const cached = sessionStorage.getItem('generate_angles_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  };

  const getInitialHighlights = (): DesignHighlightsData | null => {
    try {
      const cached = sessionStorage.getItem('generate_highlights_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const [activeTab, setActiveTab] = useState("current");
  const [generating, setGenerating] = useState(false);
  const [design, setDesign] = useState<GeneratedDesign | null>(getInitialDesign);
  const [angleImages, setAngleImages] = useState<AngleImage[]>(getInitialAngleImages);
  const [modificationInput, setModificationInput] = useState("");
  const [extractedWalls, setExtractedWalls] = useState<ExtractedWall[]>([]);
  const [highlightsData, setHighlightsData] = useState<DesignHighlightsData | null>(getInitialHighlights);
  const [generatingHighlights, setGeneratingHighlights] = useState(false);
  const [applyingHighlight, setApplyingHighlight] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [styleProfile, setStyleProfile] = useState<{
    matches: StyleMatch[];
    name: string;
    description: string;
  } | null>(() => {
    try {
      const cached = sessionStorage.getItem('generate_styleprofile_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [designItems, setDesignItems] = useState<DesignItem[]>(() => {
    try {
      const cached = sessionStorage.getItem('generate_items_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [extractingItems, setExtractingItems] = useState(() => {
    return sessionStorage.getItem('generate_extracting_cache') === 'true';
  });
  const [fullDescription, setFullDescription] = useState(() => {
    return sessionStorage.getItem('generate_description_cache') || "";
  });
  const [modificationHistory, setModificationHistory] = useState<string[]>(() => {
    try {
      const cached = sessionStorage.getItem('generate_history_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [imageHistoryStack, setImageHistoryStack] = useState<string[]>(() => {
    try {
      const cached = sessionStorage.getItem('generate_image_history_stack');
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [isolatingPhotos, setIsolatingPhotos] = useState(false);
  const [existingRoomImages, setExistingRoomImages] = useState<string[]>([]);
  const [uploadingReference, setUploadingReference] = useState(false);
  const [debugSteps, setDebugSteps] = useState<Array<{ timestamp: string; step: string; detail: string; data?: unknown }>>(() => {
    try {
      const cached = sessionStorage.getItem('generate_debug_steps_cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [debugPrompt, setDebugPrompt] = useState<string>(() => {
    return sessionStorage.getItem('generate_debug_prompt_cache') || "";
  });
  const designRef = useRef<HTMLDivElement>(null);
  
  // Upload a base64 data URI to storage and return the public URL
  const uploadDesignImage = useCallback(async (base64DataUri: string, userId: string): Promise<string> => {
    if (!base64DataUri.startsWith('data:')) return base64DataUri;
    try {
      const mimeMatch = base64DataUri.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch?.[1] || 'image/png';
      const ext = mimeType === 'image/jpeg' ? 'jpg' : 'png';
      const base64 = base64DataUri.replace(/^data:image\/\w+;base64,/, '');
      const byteString = atob(base64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeType });
      const fileName = `${userId}/design-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('design-images')
        .upload(fileName, blob, { contentType: mimeType });
      if (uploadError) {
        console.error('Failed to upload design image:', uploadError);
        return base64DataUri;
      }
      const { data: urlData } = supabase.storage
        .from('design-images')
        .getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (err) {
      console.error('Error uploading design image:', err);
      return base64DataUri;
    }
  }, []);

  // Track if initial load has been done
  const hasInitializedRef = useRef(false);

  // Safe sessionStorage setter that handles quota errors
  const safeSessionStorage = useCallback((key: string, value: string) => {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      // Quota exceeded - clear old caches and try again
      console.warn('SessionStorage quota exceeded, clearing caches');
      sessionStorage.removeItem('generate_highlights_cache');
      sessionStorage.removeItem('generate_products_cache');
      sessionStorage.removeItem('generate_styleprofile_cache');
      try {
        sessionStorage.setItem(key, value);
      } catch {
        // Still failing, just skip caching
        console.warn('Unable to cache:', key);
      }
    }
  }, []);

  const resolveActiveRoomContext = useCallback(async () => {
    if (!shouldUseFloorPlanContext) {
      try { sessionStorage.removeItem("floor_plan_context"); } catch { /* ignore */ }
      return { floorPlanContext: null, activeRoomId: null };
    }

    let floorPlanContext: any = null;
    let activeRoomId: string | null = null;

    try {
      const { loadActiveRoomSpec, toLegacyFloorPlanContext, getActiveRoomId } = await import("@/services/roomSpec");
      const spec = await loadActiveRoomSpec();
      if (spec) {
        toLegacyFloorPlanContext(spec);
        activeRoomId = getActiveRoomId();
        const raw = sessionStorage.getItem("floor_plan_context");
        if (raw) floorPlanContext = JSON.parse(raw);
      } else {
        try { sessionStorage.removeItem("floor_plan_context"); } catch { /* ignore */ }
      }
    } catch {
      /* ignore */
    }

    return { floorPlanContext, activeRoomId };
  }, [shouldUseFloorPlanContext]);

  // Cache state changes to sessionStorage (skip large data like highlights visuals)
  useEffect(() => {
    if (design) {
      safeSessionStorage('generate_design_cache', JSON.stringify(design));
    }
  }, [design, safeSessionStorage]);

  useEffect(() => {
    if (angleImages.length > 0) {
      safeSessionStorage('generate_angles_cache', JSON.stringify(angleImages));
    }
  }, [angleImages, safeSessionStorage]);

  useEffect(() => {
    if (highlightsData) {
      // Strip visual URLs to save space - they can be regenerated
      const lightHighlights = {
        colorScheme: { ...highlightsData.colorScheme, visual: undefined },
        accentFurniture: { ...highlightsData.accentFurniture, visual: undefined },
        moodboard: { ...highlightsData.moodboard, visual: undefined },
      };
      safeSessionStorage('generate_highlights_cache', JSON.stringify(lightHighlights));
    }
  }, [highlightsData, safeSessionStorage]);

  useEffect(() => {
    if (styleProfile) {
      safeSessionStorage('generate_styleprofile_cache', JSON.stringify(styleProfile));
    }
  }, [styleProfile, safeSessionStorage]);

  useEffect(() => {
    if (designItems.length > 0) {
      safeSessionStorage('generate_items_cache', JSON.stringify(designItems));
    }
  }, [designItems, safeSessionStorage]);

  useEffect(() => {
    if (fullDescription) {
      safeSessionStorage('generate_description_cache', fullDescription);
    }
  }, [fullDescription, safeSessionStorage]);

  useEffect(() => {
    if (modificationHistory.length > 0) {
      safeSessionStorage('generate_history_cache', JSON.stringify(modificationHistory));
    }
  }, [modificationHistory, safeSessionStorage]);

  useEffect(() => {
    if (imageHistoryStack.length > 0) {
      safeSessionStorage('generate_image_history_stack', JSON.stringify(imageHistoryStack));
    }
  }, [imageHistoryStack, safeSessionStorage]);

  // Cache extracting state to persist across tab switches
  useEffect(() => {
    safeSessionStorage('generate_extracting_cache', extractingItems ? 'true' : 'false');
  }, [extractingItems, safeSessionStorage]);

  // Cache debug data
  useEffect(() => {
    if (debugSteps.length > 0) {
      safeSessionStorage('generate_debug_steps_cache', JSON.stringify(debugSteps));
    }
  }, [debugSteps, safeSessionStorage]);

  useEffect(() => {
    if (debugPrompt) {
      safeSessionStorage('generate_debug_prompt_cache', debugPrompt);
    }
  }, [debugPrompt, safeSessionStorage]);

  useEffect(() => {
    if (!routeMoodboard) return;
    safeSessionStorage("generate_moodboard_cache", JSON.stringify(routeMoodboard));
  }, [routeMoodboard, safeSessionStorage]);

  // Track the quiz data to detect new quizzes
  const lastQuizDataRef = useRef<string | null>(sessionStorage.getItem('generate_quiz_hash'));

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    // If resuming a design by ID (no quiz data needed)
    if (resumeDesignId && !quizData) {
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;
      loadDesignById(resumeDesignId);
      return;
    }

    if (!quizData) {
      navigate("/quiz");
      return;
    }

    // Create a hash of quiz data to detect changes
    const quizHash = JSON.stringify({
      stylePreference: quizData.stylePreference,
      colorPalette: quizData.colorPalette,
      roomType: quizData.roomType,
      budgetFeel: quizData.budgetFeel,
      mustHaveElements: quizData.mustHaveElements,
      furnitureSource: quizData.furnitureSource,
      source: location.state?.source,
      existingRoomImages: existingRoomImagesFromState,
      keepElements: keepElementsFromState,
      changeElements: changeElementsFromState,
    });

    // Also include the nonce to detect re-submissions with same preferences
    const quizNonce = sessionStorage.getItem('generate_quiz_nonce') || '';
    const fullHash = quizHash + '|' + quizNonce;

    // Get the last quiz hash from sessionStorage
    const storedHash = sessionStorage.getItem('generate_quiz_hash');
    
    // Check if this is a NEW quiz (different from stored one) or a scene preview flow.
    // Also: if the user arrived here with fresh quizData in navigation state (not just a tab
    // switch / refresh that re-reads from sessionStorage), always treat it as a new generation
    // request so we never silently reuse a stale cached design.
    const hasScenePreview = !!location.state?.scenePreviewImage;
    // Only treat as "fresh quiz arrival" the FIRST time this nonce is seen.
    // Without this, switching tabs/windows re-runs this effect with the same
    // location.state and would trigger a brand-new generation every focus.
    const consumedNonceKey = 'generate_consumed_quiz_nonce';
    const consumedNonce = sessionStorage.getItem(consumedNonceKey);
    const arrivedWithFreshQuiz =
      !!location.state?.quizData &&
      !resumeDesignId &&
      consumedNonce !== quizNonce;
    const isNewQuiz = (storedHash !== null && storedHash !== fullHash) || hasScenePreview || arrivedWithFreshQuiz;
    if (arrivedWithFreshQuiz) {
      sessionStorage.setItem(consumedNonceKey, quizNonce);
    }
    
    if (isNewQuiz) {
      // Clear all caches for fresh start
      sessionStorage.removeItem('generate_design_cache');
      sessionStorage.removeItem('generate_products_cache');
      sessionStorage.removeItem('generate_highlights_cache');
      sessionStorage.removeItem('generate_styleprofile_cache');
      sessionStorage.removeItem('generate_items_cache');
      sessionStorage.removeItem('generate_description_cache');
      sessionStorage.removeItem('generate_history_cache');
      sessionStorage.removeItem('generate_image_history_stack');
      sessionStorage.removeItem('generate_extracting_cache');
      sessionStorage.removeItem('generate_quiz_response_id');
      sessionStorage.removeItem('generate_debug_steps_cache');
      sessionStorage.removeItem('generate_debug_prompt_cache');
      sessionStorage.removeItem('generate_moodboard_cache');
      
      // Reset state
      setDesign(null);
      setAngleImages([]);
      setHighlightsData(null);
      setStyleProfile(null);
      setDesignItems([]);
      setFullDescription("");
      setModificationHistory([]);
      setImageHistoryStack([]);
      setExtractingItems(false);
      setDebugSteps([]);
      setDebugPrompt("");
      hasInitializedRef.current = false;
    }

    // Store current quiz hash (includes nonce)
    sessionStorage.setItem('generate_quiz_hash', fullHash);
    lastQuizDataRef.current = fullHash;

    // Skip if we already have a cached design (tab switching)
    const cachedDesign = getInitialDesign();
    if (cachedDesign && !isNewQuiz) {
      // Already have design from sessionStorage, just make sure state is set
      if (!design) {
        setDesign(cachedDesign);
      }
      // If design is locked and we have items cached, we're done
      if (cachedDesign.isLocked && designItems.length > 0) {
        return;
      }
      // If design exists but highlights missing, load them
      if (!highlightsData && cachedDesign.imageUrl) {
        generateHighlights(cachedDesign.imageUrl);
      }
      return;
    }

    // Skip if we already initialized this session
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    // Check for existing design first, only generate if none exists
    loadExistingOrGenerate();
  }, [user, loading, navigate, quizData, resumeDesignId]);

  const loadDesignById = async (designId: string) => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data: existingDesign, error } = await supabase
        .from("generated_designs")
        .select("*, quiz_responses(style_preference, room_type)")
        .eq("id", designId)
        .eq("user_id", user.id)
        .single();

      if (error || !existingDesign) {
        toast({ title: "Error", description: "Design not found", variant: "destructive" });
        navigate("/gallery");
        return;
      }

      // Generate and persist a title if missing
      const quizResp = existingDesign.quiz_responses as any;
      let designTitle = (existingDesign as any).title as string | null;
      if (!designTitle) {
        designTitle = generateDesignTitle(
          quizResp?.style_preference || quizData?.stylePreference,
          quizResp?.room_type || quizData?.roomType
        );
        // Save it so it persists
        await supabase.from("generated_designs").update({ title: designTitle } as any).eq("id", designId);
      }

      setDesign({
        id: existingDesign.id,
        imageUrl: existingDesign.image_url,
        title: designTitle,
        description: existingDesign.full_description || "Custom room design based on your style preferences",
        isFavorite: existingDesign.is_favorite || false,
        isLocked: existingDesign.is_locked || false,
      });

      if (existingDesign.modification_history) {
        setModificationHistory(existingDesign.modification_history as string[]);
      }
      if (existingDesign.full_description) {
        setFullDescription(existingDesign.full_description);
      }
      if (existingDesign.prompt && !debugPrompt) {
        setDebugPrompt(existingDesign.prompt);
      }
      if (existingDesign.is_locked) {
        loadDesignItems(existingDesign.id);
        setExtractingItems(false);
      }
      if (!highlightsData) {
        generateHighlights(existingDesign.image_url);
      }
    } catch (err) {
      console.error("Error loading design by ID:", err);
      toast({ title: "Error", description: "Failed to load design", variant: "destructive" });
      navigate("/gallery");
    } finally {
      setGenerating(false);
    }
  };

  const loadExistingOrGenerate = async () => {
    if (!user || !quizData) return;

    setGenerating(true);
    try {
      // Check if we have a cached quiz response ID from this session
      let currentQuizId = sessionStorage.getItem('generate_quiz_response_id');
      
      if (!currentQuizId) {
        // First time in this session - save the quiz response
        const { data: quizResponse } = await supabase
          .from("quiz_responses")
          .insert({
            user_id: user.id,
            room_type: quizData.roomType || "living_room",
            style_preference: quizData.stylePreference || "modern-minimal",
            color_palette: quizData.colorPalette || "neutral",
            budget_feel: quizData.budgetFeel || "mid_range",
            must_have_elements: quizData.mustHaveElements || [],
            furniture_source: quizData.furnitureSource || "open",
          })
          .select()
          .single();

        currentQuizId = quizResponse?.id || null;
        if (currentQuizId) {
          sessionStorage.setItem('generate_quiz_response_id', currentQuizId);
        }
      }

      // Check if there's an existing design for THIS quiz response
      const { data: existingDesign, error } = await supabase
        .from("generated_designs")
        .select("*")
        .eq("user_id", user.id)
        .eq("quiz_response_id", currentQuizId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // If there's no existing design for this quiz, generate a new one
      if (!existingDesign || error) {
        setGenerating(false);
        generateDesign(currentQuizId || undefined);
        return;
      }

      // Load existing design (same quiz session, returning user)
      let designTitle = (existingDesign as any).title as string | null;
      if (!designTitle) {
        designTitle = generateDesignTitle(quizData?.stylePreference, quizData?.roomType);
        await supabase.from("generated_designs").update({ title: designTitle } as any).eq("id", existingDesign.id);
      }
      setDesign({
        id: existingDesign.id,
        imageUrl: existingDesign.image_url,
        title: designTitle,
        description: existingDesign.full_description || "Custom room design based on your style preferences",
        isFavorite: existingDesign.is_favorite || false,
        isLocked: existingDesign.is_locked || false,
      });

      // Restore modification history
      if (existingDesign.modification_history) {
        const history = existingDesign.modification_history as string[];
        setModificationHistory(history);
      }

      // Restore full description
      if (existingDesign.full_description) {
        setFullDescription(existingDesign.full_description);
      }

      // Restore debug prompt from saved design (prompt is saved on generation)
      if (existingDesign.prompt && !debugPrompt) {
        setDebugPrompt(existingDesign.prompt);
        // Add a reconstructed debug step so the panel is visible
        if (debugSteps.length === 0) {
          setDebugSteps([
            {
              timestamp: existingDesign.created_at,
              step: "Design loaded",
              detail: "Restored from previously generated design",
              data: {
                designId: existingDesign.id,
                hasSourceImage: !!existingDesign.source_image_url,
                quizResponseId: existingDesign.quiz_response_id,
                isLocked: existingDesign.is_locked,
                isFavorite: existingDesign.is_favorite,
              },
            },
          ]);
        }
      }

      // Load design items if locked - also clear extracting state
      if (existingDesign.is_locked) {
        loadDesignItems(existingDesign.id);
        // Clear any stale extracting state since design is already locked
        setExtractingItems(false);
        sessionStorage.removeItem('generate_extracting_cache');
      }

      // Only regenerate highlights/products if they weren't cached
      if (!highlightsData) {
        generateHighlights(existingDesign.image_url);
      }
      
      setGenerating(false);
    } catch (error) {
      console.error("Error loading existing design:", error);
      setGenerating(false);
      generateDesign();
    }
  };

  const loadDesignItems = async (designId: string) => {
    try {
      const { data: items } = await supabase
        .from("design_items")
        .select(`
          *,
          matchedProduct:matched_product_id(id, name, price, currency, image_urls, source_url, ai_style_tags)
        `)
        .eq("design_id", designId);

      if (items) {
        setDesignItems(items.map(item => ({
          ...item,
          priority: item.priority as "essential" | "recommended" | "optional",
          bounding_box: item.bounding_box as unknown as BoundingBox | undefined,
        })));
      }
    } catch (error) {
      console.error("Error loading design items:", error);
    }
  };

  const handleGenerateAngle = async (anglePrompt: string): Promise<string | null> => {
    if (!design || !quizData) return null;
    try {
      const response = await supabase.functions.invoke("generate-design", {
        body: {
          ...quizData,
          sourceImageUrl: design.imageUrl,
          modificationPrompt: anglePrompt,
        },
      });
      if (response.error) throw new Error(response.error.message);
      const { imageUrl } = response.data;
      if (!imageUrl) return null;
      // Upload to storage
      if (user) {
        const storedUrl = await uploadDesignImage(imageUrl, user.id);
        return storedUrl;
      }
      return imageUrl;
    } catch (error) {
      console.error("Angle generation error:", error);
      toast({
        title: "Angle generation failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
      return null;
    }
  };

  const generateDesign = async (quizResponseId?: string) => {
    if (!quizData || !user) return;

    const { productAnalysis, sourceImages, includeProducts, scenePreviewImage } = location.state || {};
    const moodboard = currentMoodboard;
    const shouldIncludeProducts = !!includeProducts && !isExistingRoomFlow;

    setGenerating(true);
    setDesign(null);
    setHighlightsData(null);
    setAngleImages([]);
    setDesignItems([]);
    setModificationHistory([]);
    setFullDescription("");
    setDebugSteps([]);
    setDebugPrompt("");

    try {
      const { floorPlanContext, activeRoomId } = await resolveActiveRoomContext();

      // If we have a scene preview image from the product flow, use it directly
      // as the final design — no re-generation needed.
      if (scenePreviewImage) {
        const storedImageUrl = await uploadDesignImage(scenePreviewImage, user.id);

        const designTitle = generateDesignTitle(quizData.stylePreference, quizData.roomType);
        const { data: savedDesign } = await supabase
          .from("generated_designs")
          .insert({
            user_id: user.id,
            image_url: storedImageUrl,
            prompt: "Scene preview selected from product analysis",
            source_image_url: quizData.sourceImageUrl,
            quiz_response_id: quizResponseId,
            title: designTitle,
            room_id: activeRoomId,
          } as any)
          .select()
          .single();

        trackEvent("output_generated", "generate", { source: "scene_preview", design_id: savedDesign?.id });

        const newDesign: GeneratedDesign = {
          id: savedDesign?.id || `design-${Date.now()}`,
          imageUrl: storedImageUrl,
          title: designTitle,
          description: "Design based on your selected scene preview",
          isFavorite: false,
        };

        setDesign(newDesign);
        generateHighlights(storedImageUrl);

        toast({
          title: "Design ready!",
          description: "Your selected scene is ready for refinement",
        });
        return;
      }

      const existingRoomRef = existingRoomImagesFromState;

      trackEvent("ai_call", "generate", { fn: "generate-design" });
      const response = await supabase.functions.invoke("generate-design", {
        body: {
          ...quizData,
          sourceImageUrl: quizData.sourceImageUrl,
          selectedProducts: shouldIncludeProducts ? productAnalysis?.products : undefined,
          productImageUrls: shouldIncludeProducts ? sourceImages : undefined,
          existingRoomImages: existingRoomRef,
          keepElements: keepElementsFromState,
          changeElements: changeElementsFromState,
          selectedInspirations,
          inspirationDetails,
          detectedColors: moodboard?.colors?.length ? moodboard.colors : analysisResult?.dominantColors,
          detectedKeywords: analysisResult?.styles
            ?.filter(s => s.styleName.toLowerCase().replace(/[&\s]+/g, '-').replace(/-+/g, '-') === quizData.stylePreference.replace(/_/g, '-'))
            ?.flatMap(s => s.keywords) || [],
          moodboardDescription: analysisResult?.moodboardDescription,
          moodboardMaterials: moodboard?.materials || [],
          moodboardReferences: moodboard?.references || [],
          furnitureReferences: moodboard?.furnitureReferences || [],
          decorReferences: moodboard?.decorReferences || [],
          mustIncludeItems: moodboard?.mustInclude || [],
          styleImageUrls: [
            ...((moodboard?.references?.map((r) => r.imageUrl).filter(Boolean) as string[]) || []),
            ...((moodboard?.materials?.map((m) => m.imageUrl).filter(Boolean) as string[]) || []),
            ...getStyleMoodboardUrls(quizData.stylePreference),
          ],
          floorPlanContext,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { imageUrl, prompt: usedPrompt, debugSteps: steps } = response.data;
      if (steps) setDebugSteps(steps);
      if (usedPrompt) setDebugPrompt(usedPrompt);

      // Upload image to storage before saving to DB
      const storedImageUrl = await uploadDesignImage(imageUrl, user.id);

      // Save to database with quiz_response_id link
      const designTitle = generateDesignTitle(quizData.stylePreference, quizData.roomType);
      const { data: savedDesign } = await supabase
        .from("generated_designs")
        .insert({
          user_id: user.id,
          image_url: storedImageUrl,
          prompt: usedPrompt,
          source_image_url: quizData.sourceImageUrl,
          quiz_response_id: quizResponseId,
          title: designTitle,
          room_id: activeRoomId,
        } as any)
        .select()
        .single();

      trackEvent("output_generated", "generate", { source: "ai_generate", design_id: savedDesign?.id, style: quizData.stylePreference });

      const newDesign: GeneratedDesign = {
        id: savedDesign?.id || `design-${Date.now()}`,
        imageUrl,
        title: designTitle,
        description: "Custom room design based on your style preferences",
        isFavorite: false,
      };

      setDesign(newDesign);

      // Generate highlights
      generateHighlights(imageUrl);

      toast({
        title: "Design generated!",
        description: "Your personalized room design is ready",
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleTryStyle = useCallback((newStyle: string) => {
    if (!quizData || !user) return;
    // Override the style preference and regenerate
    const overriddenQuiz = { ...quizData, stylePreference: newStyle };
    // Update location state so regeneration uses the new style
    window.history.replaceState(
      { ...location.state, quizData: overriddenQuiz },
      ""
    );
    // Regenerate with new style by invoking the edge function directly
    setGenerating(true);
    setDesign(null);
    setHighlightsData(null);
    setAngleImages([]);
    setDesignItems([]);
    setModificationHistory([]);
    setFullDescription("");
    setDebugSteps([]);
    setDebugPrompt("");

    const run = async () => {
      try {
        const { floorPlanContext, activeRoomId } = await resolveActiveRoomContext();
        const response = await supabase.functions.invoke("generate-design", {
          body: {
            ...overriddenQuiz,
            sourceImageUrl: overriddenQuiz.sourceImageUrl,
            existingRoomImages: existingRoomImagesFromState,
            keepElements: keepElementsFromState,
            changeElements: changeElementsFromState,
            selectedInspirations,
            inspirationDetails,
            detectedColors: analysisResult?.dominantColors,
            detectedKeywords: analysisResult?.styles
              ?.filter(s => s.styleName.toLowerCase().replace(/[&\s]+/g, '-').replace(/-+/g, '-') === overriddenQuiz.stylePreference.replace(/_/g, '-'))
              ?.flatMap(s => s.keywords) || [],
            moodboardDescription: analysisResult?.moodboardDescription,
            styleImageUrls: getStyleMoodboardUrls(overriddenQuiz.stylePreference),
            floorPlanContext,
          },
        });
        if (response.error) throw new Error(response.error.message);
        const { imageUrl, prompt: usedPrompt, debugSteps: steps } = response.data;
        if (steps) setDebugSteps(steps);
        if (usedPrompt) setDebugPrompt(usedPrompt);

        const storedImageUrl = await uploadDesignImage(imageUrl, user.id);

        const styleTitle = generateDesignTitle(newStyle, quizData.roomType);
        const { data: savedDesign } = await supabase
          .from("generated_designs")
          .insert({
            user_id: user.id,
            image_url: storedImageUrl,
            prompt: usedPrompt,
            source_image_url: overriddenQuiz.sourceImageUrl,
            title: styleTitle,
            room_id: activeRoomId,
          } as any)
          .select()
          .single();

        trackEvent("output_generated", "generate", { source: "try_another_style", design_id: savedDesign?.id, style: newStyle });

        const newDesign: GeneratedDesign = {
          id: savedDesign?.id || `design-${Date.now()}`,
          imageUrl,
          title: styleTitle,
          description: "Custom room design based on your style preferences",
          isFavorite: false,
        };

        setDesign(newDesign);
        
        generateHighlights(imageUrl);

        toast({
          title: "New style generated!",
          description: `Switched to ${newStyle.replace(/-/g, " ")} style`,
        });
      } catch (error) {
        console.error("Style switch error:", error);
        toast({
          title: "Generation failed",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
      } finally {
        setGenerating(false);
      }
    };
    run();
  }, [quizData, user, location.state, uploadDesignImage, toast, resolveActiveRoomContext]);

  const handleSurpriseStyle = useCallback(() => {
    const styles = ["modern-minimal", "bohemian-eclectic", "classic-historical", "rustic-nature", "mediterranean", "glam-luxe"];
    const current = quizData?.stylePreference || "";
    const others = styles.filter((s) => s !== current);
    const random = others[Math.floor(Math.random() * others.length)];
    handleTryStyle(random);
  }, [quizData, handleTryStyle]);

  const generateHighlights = async (imageUrl: string) => {
    if (!quizData) return;

    setGeneratingHighlights(true);
    try {
      // Use AI to analyze the generated design and extract highlights
      const response = await supabase.functions.invoke("analyze-style", {
        body: {
          images: [imageUrl],
          mode: "room",
        },
      });

      const analysis = response.data && !response.data.error ? response.data : null;
      
      // Build style matches for the profile
      const styleMatches = buildStyleMatches(quizData.stylePreference, analysis);
      const profileData = generateStyleProfile(styleMatches, quizData);
      setStyleProfile(profileData);

      // Base highlights data
      const colors = analysis?.dominantColors || getDefaultColors(quizData.colorPalette);
      const materials = analysis?.materials || getMaterialsForStyle(quizData.stylePreference);
      const furnitureName = getDefaultAccentFurniture(quizData.stylePreference);
      const elements = analysis?.styles?.[0]?.keywords || quizData.mustHaveElements || ["Texture", "Lighting", "Plants", "Art"];

      const baseHighlights: DesignHighlightsData = {
        colorScheme: {
          colors,
          materials,
          description: analysis?.moodboardDescription || 
            `A harmonious ${quizData.colorPalette || "neutral"} palette expressed through ${materials.slice(0, 3).join(", ")} for your ${quizData.roomType || "space"}.`,
        },
        accentFurniture: {
          name: furnitureName,
          description: analysis?.styles?.[0]?.description || 
            `A statement piece that embodies the ${quizData.stylePreference || "modern"} aesthetic and serves as the focal point of the room.`,
        },
        moodboard: {
          elements,
          description: `Key design elements that bring together the ${quizData.stylePreference || "modern"} style with your personal preferences.`,
        },
      };

      setHighlightsData(baseHighlights);

      // Generate AI visuals for each highlight in parallel
      generateHighlightVisuals(baseHighlights, quizData);
    } catch (error) {
      console.error("Highlights generation error:", error);
      // Set default highlights on error
      const materials = getMaterialsForStyle(quizData.stylePreference);
      setHighlightsData({
        colorScheme: {
          colors: getDefaultColors(quizData.colorPalette),
          materials,
          description: `A balanced color scheme reflecting your ${quizData.colorPalette || "neutral"} preferences through ${materials.slice(0, 2).join(" and ")}.`,
        },
        accentFurniture: {
          name: getDefaultAccentFurniture(quizData.stylePreference),
          description: "A signature piece that anchors your room's design.",
        },
        moodboard: {
          elements: quizData.mustHaveElements || ["Style", "Comfort", "Function", "Beauty"],
          description: "The essential elements that make your space uniquely yours.",
        },
      });
      
      // Set default style profile
      const defaultMatches = buildStyleMatches(quizData.stylePreference, null);
      setStyleProfile(generateStyleProfile(defaultMatches, quizData));
    } finally {
      setGeneratingHighlights(false);
    }
  };

  const generateHighlightVisuals = async (highlights: DesignHighlightsData, quiz: QuizData) => {
    const style = quiz.stylePreference || "modern-minimal";
    const room = quiz.roomType || "living room";

    // Generate all three visuals in parallel
    const [colorResult, furnitureResult, moodboardResult] = await Promise.allSettled([
      supabase.functions.invoke("generate-highlight-visuals", {
        body: {
          type: "colorPalette",
          style,
          room,
          colors: highlights.colorScheme.colors,
          materials: highlights.colorScheme.materials,
        },
      }),
      supabase.functions.invoke("generate-highlight-visuals", {
        body: {
          type: "accentFurniture",
          style,
          room,
          furnitureName: highlights.accentFurniture.name,
          furnitureDescription: highlights.accentFurniture.description,
        },
      }),
      supabase.functions.invoke("generate-highlight-visuals", {
        body: {
          type: "moodboard",
          style,
          room,
          elements: highlights.moodboard.elements,
        },
      }),
    ]);

    // Update highlights with generated visuals as they complete
    setHighlightsData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        colorScheme: {
          ...prev.colorScheme,
          visual: colorResult.status === "fulfilled" ? colorResult.value.data?.imageUrl : undefined,
        },
        accentFurniture: {
          ...prev.accentFurniture,
          visual: furnitureResult.status === "fulfilled" ? furnitureResult.value.data?.imageUrl : undefined,
        },
        moodboard: {
          ...prev.moodboard,
          visual: moodboardResult.status === "fulfilled" ? moodboardResult.value.data?.imageUrl : undefined,
        },
      };
    });
  };

  const buildStyleMatches = (primaryStyle?: string, analysis?: Record<string, unknown> | null): StyleMatch[] => {
    const styleColors: Record<string, string> = {
      "modern-minimal": "#64748B",
      "classic-historical": "#92400E",
      "bohemian-eclectic": "#7C3AED",
      "rustic-nature": "#059669",
      "mediterranean": "#0891B2",
      "glam-luxe": "#BE185D",
    };

    const primary = primaryStyle || "modern-minimal";
    
    // Calculate percentages based on primary style
    const matches: StyleMatch[] = [];
    
    // Primary style gets highest percentage
    matches.push({
      style: primary,
      percentage: 45,
      color: styleColors[primary] || "#64748B",
    });

    // Add complementary styles based on the primary
    const complementaryMap: Record<string, string[]> = {
      "modern-minimal": ["rustic-nature", "mediterranean"],
      "classic-historical": ["glam-luxe", "mediterranean"],
      "bohemian-eclectic": ["rustic-nature", "glam-luxe"],
      "rustic-nature": ["bohemian-eclectic", "mediterranean"],
      "mediterranean": ["rustic-nature", "modern-minimal"],
      "glam-luxe": ["classic-historical", "modern-minimal"],
    };

    const complementary = complementaryMap[primary] || ["rustic-nature", "modern-minimal"];
    matches.push({
      style: complementary[0],
      percentage: 30,
      color: styleColors[complementary[0]] || "#059669",
    });
    matches.push({
      style: complementary[1],
      percentage: 25,
      color: styleColors[complementary[1]] || "#0891B2",
    });

    return matches;
  };

  const generateStyleProfile = (matches: StyleMatch[], quiz: QuizData): { matches: StyleMatch[]; name: string; description: string } => {
    const primary = matches[0]?.style || "modern-minimal";
    const secondary = matches[1]?.style;
    
    const profileNames: Record<string, string> = {
      "modern-minimal": "Contemporary Zen",
      "classic-historical": "Timeless Elegance",
      "bohemian-eclectic": "Creative Spirit",
      "rustic-nature": "Organic Harmony",
      "mediterranean": "Coastal Serenity",
      "glam-luxe": "Modern Luxe",
    };

    const blendDescriptions: Record<string, string> = {
      "modern-minimal+rustic-nature": "Your style blends clean contemporary lines with organic natural textures, creating spaces that feel both refined and grounded in nature.",
      "modern-minimal+mediterranean": "You gravitate toward crisp minimalism softened by coastal warmth—airy spaces with natural light and calming blue accents.",
      "classic-historical+glam-luxe": "Your aesthetic marries traditional elegance with glamorous touches—rich materials, ornate details, and luxurious finishes.",
      "bohemian-eclectic+rustic-nature": "You embrace a collected, personal style where global artisan pieces meet earthy organic elements in a warm, layered space.",
      "rustic-nature+mediterranean": "Your spaces feel like a countryside retreat—natural materials, earthy tones, and a relaxed Mediterranean ease.",
    };

    const blendKey = `${primary}+${secondary}`;
    const description = blendDescriptions[blendKey] || 
      `Your unique style combines ${matches.map(m => m.style.replace(/-/g, " ")).join(", ")} influences, creating a personalized aesthetic for your ${quiz.roomType || "space"}.`;

    return {
      matches,
      name: profileNames[primary] || "Personalized Style",
      description,
    };
  };

  const getMaterialsForStyle = (style?: string): string[] => {
    const materialsMap: Record<string, string[]> = {
      "modern-minimal": ["oak wood", "linen", "concrete", "brushed steel"],
      "classic-historical": ["mahogany", "velvet", "marble", "brass"],
      "bohemian-eclectic": ["rattan", "woven textiles", "terracotta", "macramé"],
      "rustic-nature": ["reclaimed wood", "jute", "natural stone", "raw linen"],
      "mediterranean": ["whitewashed wood", "terracotta", "wrought iron", "cotton"],
      "glam-luxe": ["lacquer", "velvet", "mirror", "gold leaf"],
    };
    return materialsMap[style || "modern-minimal"] || materialsMap["modern-minimal"];
  };

  const getDefaultColors = (palette?: string): string[] => {
    const colorMaps: Record<string, string[]> = {
      neutral: ["#F5F5DC", "#D4C4A8", "#8B7355", "#5D4E37", "#2F2F2F"],
      cool: ["#E3F2FD", "#90CAF9", "#42A5F5", "#1976D2", "#0D47A1"],
      warm: ["#FFF3E0", "#FFCC80", "#FF9800", "#E65100", "#BF360C"],
      bold: ["#F3E5F5", "#BA68C8", "#7B1FA2", "#4A148C", "#1A237E"],
      monochrome: ["#FAFAFA", "#BDBDBD", "#757575", "#424242", "#212121"],
    };
    return colorMaps[palette || "neutral"] || colorMaps.neutral;
  };

  const getDefaultAccentFurniture = (style?: string): string => {
    const furnitureMap: Record<string, string> = {
      "modern-minimal": "Sculptural Lounge Chair",
      "classic-historical": "Antique Armoire",
      "bohemian-eclectic": "Rattan Peacock Chair",
      "rustic-nature": "Live Edge Wood Table",
      "mediterranean": "Wrought Iron Daybed",
      "glam-luxe": "Velvet Statement Sofa",
    };
    return furnitureMap[style || "modern-minimal"] || "Designer Accent Chair";
  };

  const handleAngleImageGenerated = useCallback((label: string, imageUrl: string) => {
    setAngleImages(prev => {
      // Avoid duplicates
      if (prev.some(a => a.label === label)) {
        return prev.map(a => a.label === label ? { label, imageUrl } : a);
      }
      return [...prev, { label, imageUrl }];
    });
  }, []);

  const handleReferenceUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      setUploadingReference(true);
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/ref-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("room-photos")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("room-photos")
          .getPublicUrl(fileName);

        setReferenceImageUrl(urlData.publicUrl);
        toast({
          title: "Reference uploaded!",
          description: "Your reference image is ready",
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Please try again",
          variant: "destructive",
        });
      } finally {
        setUploadingReference(false);
      }
    },
    [user, toast]
  );

  const handleModify = async (modificationType?: string, explicitPrompt?: string, explicitReferenceUrl?: string | null) => {
    const promptToUse = (explicitPrompt ?? modificationInput).trim();
    if (!promptToUse || !quizData || !design) return;

    setGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-design", {
        body: {
          ...quizData,
          modificationPrompt: promptToUse,
          modificationType: modificationType || "color_material",
          sourceImageUrl: design.imageUrl,
          referenceImageUrl: explicitReferenceUrl !== undefined ? explicitReferenceUrl : referenceImageUrl,
          existingRoomImages: existingRoomImages.length > 0 ? existingRoomImages : undefined,
        },
      });

      if (response.error) throw new Error(response.error.message);

      const { imageUrl, debugSteps: steps, prompt: usedPrompt } = response.data;
      if (steps) setDebugSteps(steps);
      if (usedPrompt) setDebugPrompt(usedPrompt);

      // Push current image to undo stack before replacing
      setImageHistoryStack((prev) => [...prev, design.imageUrl]);

      // Track modification in history
      const newHistory = [...modificationHistory, modificationInput];
      setModificationHistory(newHistory);

      // Save modification history AND new image URL to database
      if (!design.id.startsWith("design-")) {
        await supabase
          .from("generated_designs")
          .update({ 
            modification_history: newHistory,
            image_url: imageUrl,
          })
          .eq("id", design.id);
      }

      // Update design
      setDesign({
        ...design,
        imageUrl,
        description: modificationInput,
      });

      setModificationInput("");

      // Regenerate highlights for the new design
      generateHighlights(imageUrl);

      toast({
        title: "Design updated!",
        description: "Your modification has been applied",
      });
    } catch (error) {
      toast({
        title: "Modification failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };
  const handleUndoDesign = async () => {
    if (!design || imageHistoryStack.length === 0) return;

    const previousImageUrl = imageHistoryStack[imageHistoryStack.length - 1];
    const newStack = imageHistoryStack.slice(0, -1);
    setImageHistoryStack(newStack);

    // Pop last modification from history
    const newHistory = modificationHistory.slice(0, -1);
    setModificationHistory(newHistory);

    // Update DB
    if (!design.id.startsWith("design-")) {
      await supabase
        .from("generated_designs")
        .update({
          modification_history: newHistory,
          image_url: previousImageUrl,
        })
        .eq("id", design.id);
    }

    setDesign({ ...design, imageUrl: previousImageUrl });
    generateHighlights(previousImageUrl);

    toast({
      title: "Reverted",
      description: "Went back to previous design version",
    });
  };

  const handleAdjustToRoom = async () => {
    if (!quizData || !design || !user || existingRoomImages.length === 0) {
      toast({
        title: "No room photos",
        description: "Please upload photos of your existing room first",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-design", {
        body: {
          ...quizData,
          sourceImageUrl: design.imageUrl,
          existingRoomImages,
        },
      });

      if (response.error) throw new Error(response.error.message);

      const { imageUrl, debugSteps: steps, prompt: usedPrompt } = response.data;
      if (steps) setDebugSteps(steps);
      if (usedPrompt) setDebugPrompt(usedPrompt);

      const storedImageUrl = await uploadDesignImage(imageUrl, user.id);

      if (!design.id.startsWith("design-")) {
        await supabase
          .from("generated_designs")
          .update({ image_url: storedImageUrl })
          .eq("id", design.id);
      }

      setDesign({ ...design, imageUrl });
      generateHighlights(imageUrl);

      toast({
        title: "Design adjusted!",
        description: "Your design has been adapted to match your room's layout",
      });
    } catch (error) {
      toast({
        title: "Adjustment failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleRealignToPlan = async ({
    plannedItems,
    shape,
    dimensions,
  }: {
    plannedItems: { label: string; x: number; y: number; w: number; h: number }[];
    shape: string;
    dimensions: Record<string, number>;
  }) => {
    if (!quizData || !design || !user) return;
    setGenerating(true);
    try {
      const dimsLabel = Object.entries(dimensions).map(([k, v]) => `${k}=${v}m`).join(", ");
      const layoutLines = plannedItems
        .map((it) => `- ${it.label} at ${Math.round(it.x)}%,${Math.round(it.y)}% size ${Math.round(it.w)}%×${Math.round(it.h)}%`)
        .join("\n");
      const modPrompt = `RE-RENDER THIS EXACT ROOM with a STRICT 1:1 mapping to the floor plan. This is a hard constraint, not a suggestion.

ROOM SHELL (must match exactly):
- Shape: ${shape}
- Dimensions: ${dimsLabel}
- The room's wall lengths, corners, and proportions in the new image must precisely match these dimensions. Aspect ratio of the visible floor area must equal the floor-plan aspect ratio.

FURNITURE LAYOUT (top-down percentages relative to the room bounding box, 0,0 = back-left wall corner, 100,100 = front-right wall corner):
${layoutLines}

RULES:
- Place every listed item at the specified position and footprint size. Do NOT move, rotate, omit, duplicate, or add furniture.
- Keep the SAME style, colors, materials, lighting, and finishes as the current image. Only camera angle, room geometry and furniture placement are adjusted.
- Choose a camera angle (eye-level perspective) that clearly shows the room matching the planned layout 1:1.
- The result must look like the top-down floor plan extruded into a real photographic 3D room.`;

      const response = await supabase.functions.invoke("generate-design", {
        body: {
          ...quizData,
          modificationPrompt: modPrompt,
          modificationType: "layout_adjust",
          sourceImageUrl: design.imageUrl,
        },
      });
      if (response.error) throw new Error(response.error.message);
      const { imageUrl, prompt: usedPrompt, debugSteps: steps } = response.data;
      if (steps) setDebugSteps(steps);
      if (usedPrompt) setDebugPrompt(usedPrompt);

      const storedImageUrl = await uploadDesignImage(imageUrl, user.id);
      setImageHistoryStack((prev) => [...prev, design.imageUrl]);
      if (!design.id.startsWith("design-")) {
        await supabase.from("generated_designs").update({ image_url: storedImageUrl }).eq("id", design.id);
      }
      setDesign({ ...design, imageUrl: storedImageUrl });
      generateHighlights(storedImageUrl);
      toast({ title: "Design re-aligned to your floor plan" });
    } catch (e) {
      toast({
        title: "Re-align failed",
        description: e instanceof Error ? e.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleLockDesign = async () => {
    if (!design || design.isLocked || design.id.startsWith("design-")) {
      toast({
        title: "Cannot lock design",
        description: "Please ensure your design is saved first",
        variant: "destructive",
      });
      return;
    }

    setExtractingItems(true);

    try {
      // Get user's city from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("city")
        .eq("user_id", user?.id)
        .single();

      // Call extract-room-items edge function
      const response = await supabase.functions.invoke("extract-room-items", {
        body: {
          imageUrl: design.imageUrl,
          designId: design.id,
          userCity: profile?.city,
        },
      });

      if (response.error) throw new Error(response.error.message);

      const { items, fullDescription: desc } = response.data;

      // Fetch matched products for items
      const itemsWithProducts = await Promise.all(
        (items || []).map(async (item: DesignItem) => {
          if (item.matched_product_id) {
            const { data: product } = await supabase
              .from("shop_products")
              .select("id, name, price, currency, image_urls, source_url, ai_style_tags")
              .eq("id", item.matched_product_id)
              .single();
            return { ...item, matchedProduct: product };
          }
          return item;
        })
      );

      setDesignItems(itemsWithProducts);
      setFullDescription(desc || "");
      setDesign({ ...design, isLocked: true });

      toast({
        title: "Design locked!",
        description: `Extracted ${items?.length || 0} items. Generating product photos...`,
      });

      // Trigger product photo isolation in the background
      setIsolatingPhotos(true);
      supabase.functions
        .invoke("isolate-product-photos", {
          body: {
            designId: design.id,
            designImageUrl: design.imageUrl,
            items: (items || []).map((item: DesignItem) => ({
              id: item.id,
              item_name: item.item_name,
              item_description: item.item_description,
              item_type: item.item_type,
              color: item.color,
              material: item.material,
              bounding_box: item.bounding_box,
            })),
          },
        })
        .then(async (response) => {
          if (response.data?.results) {
            // Update items with product photo URLs
            setDesignItems((prev) =>
              prev.map((item) => {
                const match = response.data.results.find(
                  (r: { itemId: string; photoUrl: string | null }) => r.itemId === item.id
                );
                return match?.photoUrl
                  ? { ...item, product_photo_url: match.photoUrl }
                  : item;
              })
            );
            toast({
              title: "Product photos ready!",
              description: `Generated ${response.data.generated} isolated product photos`,
            });
          }
        })
        .catch((err) => {
          console.error("Product photo isolation error:", err);
        })
        .finally(() => {
          setIsolatingPhotos(false);
        });
    } catch (error) {
      console.error("Lock design error:", error);
      toast({
        title: "Failed to lock design",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setExtractingItems(false);
    }
  };

  const handleFavorite = async () => {
    if (!design) return;

    const newValue = !design.isFavorite;
    setDesign({ ...design, isFavorite: newValue });

    if (newValue) {
      trackEvent("satisfied", "generate", { design_id: design.id });
    }

    // Update in database if it's a real ID
    if (!design.id.startsWith("design-")) {
      await supabase
        .from("generated_designs")
        .update({ is_favorite: newValue })
        .eq("id", design.id);
    }
  };

  const handleDownload = async () => {
    if (!design) return;
    
    try {
      const link = document.createElement("a");
      link.href = design.imageUrl;
      link.download = `room-design-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Downloaded!",
        description: "Image saved to your device",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleApplyHighlightNote = async (highlightId: string, note: string) => {
    if (!design || !quizData) return;

    setApplyingHighlight(highlightId);
    
    // Build context-specific prompt based on the highlight type
    const highlightPrompts: Record<string, string> = {
      colorScheme: `Adjust the color scheme of this room design: ${note}. Keep the overall style but update the colors as requested.`,
      accentFurniture: `Modify the furniture in this room design: ${note}. Maintain the room's style but update the accent furniture as specified.`,
      moodboard: `Update the design elements and mood of this room: ${note}. Keep the core aesthetic but adjust the elements as requested.`,
    };

    const modificationPrompt = highlightPrompts[highlightId] || note;

    try {
      const response = await supabase.functions.invoke("generate-design", {
        body: {
          ...quizData,
          modificationPrompt,
          sourceImageUrl: design.imageUrl,
        },
      });

      if (response.error) throw new Error(response.error.message);

      const { imageUrl } = response.data;

      // Upload to storage and save URL to database
      const storedUrl = user ? await uploadDesignImage(imageUrl, user.id) : imageUrl;
      if (!design.id.startsWith("design-")) {
        await supabase
          .from("generated_designs")
          .update({ image_url: storedUrl })
          .eq("id", design.id);
      }

      // Update design with the new image
      setDesign({
        ...design,
        imageUrl,
        description: `Updated ${highlightId}: ${note}`,
      });

      // Regenerate highlights for the updated design
      generateHighlights(imageUrl);

      toast({
        title: "Design updated!",
        description: `${highlightId === "colorScheme" ? "Color scheme" : highlightId === "accentFurniture" ? "Furniture" : "Moodboard elements"} adjusted based on your note`,
      });
    } catch (error) {
      console.error("Highlight modification error:", error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setApplyingHighlight(null);
    }
  };

  const moodboardItems: MoodboardItem[] = [
    ...((currentMoodboard?.mustInclude || []).map((item) => ({ ...item, kind: "must-include" as const }))),
    ...((currentMoodboard?.furnitureReferences || []).map((item) => ({ ...item, kind: "furniture" as const }))),
    ...((currentMoodboard?.decorReferences || []).map((item) => ({ ...item, kind: "decor" as const }))),
    ...((currentMoodboard?.materials || []).map((item) => ({ ...item, kind: "material" as const }))),
  ];

  // Fallback: derive material/color chips from the style analysis so the moodboard
  // always reflects something meaningful, even when no explicit references were passed.
  const MATERIAL_KEYWORDS = ["wood", "walnut", "oak", "linen", "velvet", "brass", "marble", "travertine", "rattan", "leather", "stone", "concrete", "ceramic", "terracotta", "boucle", "bouclé", "glass", "metal"];
  if (!currentMoodboard?.materials?.length) {
    const colors = (analysisResult?.dominantColors || []).slice(0, 5);
    colors.forEach((hex) => {
      moodboardItems.push({ kind: "material", label: hex.toUpperCase() });
    });
    const keywordPool = (analysisResult?.styles || []).flatMap((s) => s.keywords || []);
    const materialKws = Array.from(new Set(keywordPool.filter((k) =>
      MATERIAL_KEYWORDS.some((m) => k.toLowerCase().includes(m))
    ))).slice(0, 4);
    materialKws.forEach((label) => moodboardItems.push({ kind: "material", label }));
  }

  const handleMoodboardAction = async (action: MoodboardAction) => {
    if (!design) return;

    let modType: "swap_item" | "color_material" | "add_remove" = "color_material";
    let prompt = "";
    let refUrl: string | null | undefined = undefined;

    if (action.type === "swap") {
      modType = "swap_item";
      prompt = action.newImageUrl
        ? `Replace the existing "${action.item.label}" in the design with the new item shown in the attached reference image (labeled "${action.newLabel}"). Keep the SAME placement, scale and orientation. Preserve every other furniture piece, wall, floor, lighting, decor and color exactly as in the source image.`
        : `Replace the existing "${action.item.label}" with "${action.newLabel}". Match the same placement, scale and orientation. Preserve every other element of the room exactly as in the source image.`;
      refUrl = action.newImageUrl || null;
    } else if (action.type === "color_material") {
      modType = "color_material";
      prompt = `Modify the "${action.item.label}" only: ${action.description}. Apply this change exactly where this element appears in the room. Do NOT change anything else — same furniture, same placement, same lighting, same other colors and materials.`;
    } else if (action.type === "remove") {
      modType = "add_remove";
      prompt = `Remove the "${action.item.label}" from the room entirely. Keep every other element exactly where it is — do not rearrange or restyle anything else.`;
    } else if (action.type === "add") {
      modType = "add_remove";
      const placement = action.kind === "decor"
        ? "Place it as a decor accent in a natural empty spot (a side table, shelf, wall or floor area)."
        : action.kind === "furniture"
          ? "Place it in a logical empty area of the room without moving existing furniture."
          : "Place it naturally in the room without disturbing existing items.";
      prompt = action.imageUrl
        ? `Add a new ${action.kind === "must-include" ? "must-include item" : action.kind} to the design: "${action.label}" — match the style/material/color of the attached reference image exactly. ${placement} Keep every existing element unchanged.`
        : `Add a new ${action.kind === "must-include" ? "must-include item" : action.kind} to the design: "${action.label}". ${placement} Keep every existing element unchanged.`;
      if (action.imageUrl) refUrl = action.imageUrl;
    }

    await handleModify(modType, prompt, refUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-2xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-2xl" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10 p-4 md:p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/quiz")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Quiz</span>
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button
              onClick={() => navigate("/gallery")}
              className="text-sm text-primary hover:underline"
            >
              My HomeMockUps
            </button>
          </div>
        </div>

        {/* Tabs for Current Design, History, and Likes */}
        <div className="w-full">
          <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground grid w-full max-w-md mx-auto grid-cols-3 mb-6">
            <button
              onClick={() => setActiveTab("current")}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all gap-2 ${activeTab === "current" ? "bg-background text-foreground shadow-sm" : ""}`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Current</span>
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all gap-2 ${activeTab === "history" ? "bg-background text-foreground shadow-sm" : ""}`}
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>
            <button
              onClick={() => setActiveTab("likes")}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all gap-2 ${activeTab === "likes" ? "bg-background text-foreground shadow-sm" : ""}`}
            >
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Likes</span>
            </button>
          </div>

          <div className={activeTab === "current" ? "space-y-8" : "hidden"}>
            {/* Page Title – editable design name */}
            <div className="text-center space-y-2">
              {design && !editingTitle ? (
                <button
                  onClick={() => { setTitleDraft(design.title); setEditingTitle(true); }}
                  className="inline-flex items-center gap-2 group"
                >
                  <h1 className="text-3xl md:text-4xl font-bold">{design.title}</h1>
                  <Pencil className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ) : design && editingTitle ? (
                <div className="inline-flex items-center gap-2 max-w-md mx-auto">
                  <Input
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    className="text-center text-2xl font-bold h-12"
                    autoFocus
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        const newTitle = titleDraft.trim() || design.title;
                        setDesign({ ...design, title: newTitle });
                        setEditingTitle(false);
                        if (!design.id.startsWith("design-")) {
                          await supabase.from("generated_designs").update({ title: newTitle } as any).eq("id", design.id);
                        }
                      } else if (e.key === "Escape") {
                        setEditingTitle(false);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={async () => {
                      const newTitle = titleDraft.trim() || design.title;
                      setDesign({ ...design, title: newTitle });
                      setEditingTitle(false);
                      if (!design.id.startsWith("design-")) {
                        await supabase.from("generated_designs").update({ title: newTitle } as any).eq("id", design.id);
                      }
                    }}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <h1 className="text-3xl md:text-4xl font-bold">Your Design Results</h1>
              )}
              <p className="text-muted-foreground">
                Your personalized room design with key highlights
              </p>
            </div>

        {/* Generation Progress */}
        {generating && <GenerationCountdown />}

        {/* Personalized Style Profile - Hidden */}
        {/* {styleProfile && (
          <PersonalizedStyleProfile
            styleMatches={styleProfile.matches}
            profileName={styleProfile.name}
            profileDescription={styleProfile.description}
          />
        )} */}

        {/* Floor Plan vs Design comparison */}
        <FloorPlanComparison
          designImageUrl={design?.imageUrl ?? null}
          designId={design?.id ?? null}
          isRealigning={generating}
          onRealign={handleRealignToPlan}
        />

        {/* Main Design */}
        {design && (
          <div className="max-w-3xl mx-auto" ref={designRef}>
            <DesignImage
              imageUrl={design.imageUrl}
              title={design.title}
              description={design.description}
              index={0}
              isFavorite={design.isFavorite}
              onFavorite={handleFavorite}
              onDownload={handleDownload}
              showRefine={false}
              modificationInput={modificationInput}
              onModificationInputChange={setModificationInput}
              onModify={handleModify}
              onRegenerate={() => generateDesign()}
              onUndo={handleUndoDesign}
              canUndo={imageHistoryStack.length > 0}
              generating={generating}
              referenceImageUrl={referenceImageUrl}
              onReferenceUpload={handleReferenceUpload}
              onRemoveReference={() => setReferenceImageUrl(null)}
              uploadingReference={uploadingReference}
              designId={design.id}
              onDesignUpdated={(newUrl) => setDesign({ ...design, imageUrl: newUrl })}
              extractedWalls={extractedWalls}
              onWallsExtracted={setExtractedWalls}
              roomType={quizData?.roomType}
              mustHaveElements={quizData?.mustHaveElements}
            />
          </div>
        )}

        {/* Unified Moodboard + Refine — only visible after the user opts into refinement */}
        {design?.isLocked && (
        <div className="max-w-3xl mx-auto">
          <MoodboardRefinePanel
            items={moodboardItems}
            onAction={handleMoodboardAction}
            designDescription={[design?.description, fullDescription].filter(Boolean).join(" ")}
            extractedItemNames={designItems.map((i) => i.item_name)}
            extractedItems={designItems.map((i) => ({
              item_name: i.item_name,
              item_type: i.item_type,
              item_description: i.item_description,
              color: i.color,
              hex_code: i.hex_code,
              material: i.material,
              product_photo_url: i.product_photo_url,
            }))}
            modificationInput={modificationInput}
            onModificationInputChange={setModificationInput}
            onModify={(type, prefill) => handleModify(type, prefill)}
            onRegenerate={() => generateDesign()}
            onUndo={handleUndoDesign}
            canUndo={imageHistoryStack.length > 0}
            generating={generating}
            disabled={!design || generating}
          />
        </div>
        )}

        {/* Debug Panel - Hidden */}
        {/* {design && (debugSteps.length > 0 || debugPrompt) && (
          <DebugPanel steps={debugSteps} prompt={debugPrompt} />
        )} */}

        {/* Existing Room Photos Upload - Hidden */}
        {/* {design && !generating && !design.isLocked && (
          <ExistingRoomUpload
            images={existingRoomImages}
            onImagesChange={setExistingRoomImages}
            disabled={generating || extractingItems}
            onAdjustToRoom={handleAdjustToRoom}
            adjusting={generating}
          />
        )} */}

        {/* Love This Button - Under Main Design */}
        {design && !generating && !design.isLocked && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <LoveThisButton
              isLocked={design.isLocked || false}
              isLoading={extractingItems}
              onLock={handleLockDesign}
              designId={design.id}
            />
            <OtherAnglesButton
              key={design?.id}
              onGenerate={handleGenerateAngle}
              disabled={extractingItems || generating}
              onImageGenerated={handleAngleImageGenerated}
            />
          </div>
        )}

        {/* Try Another Style - hidden for now */}
        {/* {design && !generating && !design.isLocked && quizData && (
          <div className="max-w-3xl mx-auto">
            <TryAnotherStyle
              currentStyle={quizData.stylePreference}
              onSelectStyle={handleTryStyle}
              onSurpriseMe={handleSurpriseStyle}
              disabled={generating || extractingItems}
            />
          </div>
        )} */}

        {/* Design Items List - Show when items exist or extracting */}
        {design && (designItems.length > 0 || extractingItems) && (
          <>
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDesign(prev => prev ? { ...prev, isLocked: false } : prev);
                setDesignItems([]);
                setFullDescription("");
                setExtractingItems(false);
                setIsolatingPhotos(false);
                sessionStorage.removeItem('generate_items_cache');
                sessionStorage.removeItem('generate_description_cache');
                sessionStorage.removeItem('generate_extracting_cache');
              }}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Design
            </Button>
          </div>
          <DesignItemsList
            items={designItems}
            fullDescription={fullDescription}
            designImageUrl={design.imageUrl}
            isLoading={extractingItems}
            isolatingPhotos={isolatingPhotos}
          />
          {/* Wall Extraction Panel - shown in locked view only if walls were already extracted */}
          {design.isLocked && extractedWalls.length > 0 && (
            <div className="max-w-3xl mx-auto">
              <WallExtractionPanel
                designImageUrl={design.imageUrl}
                designId={design.id}
                onDesignUpdated={(newUrl) => setDesign(prev => prev ? { ...prev, imageUrl: newUrl } : prev)}
                disabled={generating}
                externalWalls={extractedWalls}
                readOnly={false}
                roomType={quizData?.roomType}
                mustHaveElements={quizData?.mustHaveElements}
              />
            </div>
          )}
          </>
        )}




          </div>

          <div className={activeTab === "history" ? "space-y-6" : "hidden"}>
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold">Design History</h1>
              <p className="text-muted-foreground">
                All your past designs and modifications
              </p>
            </div>
            <DesignHistoryTab />
          </div>

          <div className={activeTab === "likes" ? "space-y-6" : "hidden"}>
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold">Favorites</h1>
              <p className="text-muted-foreground">
                Designs you've marked as favorites
              </p>
            </div>
            <DesignLikesTab />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Generate;
