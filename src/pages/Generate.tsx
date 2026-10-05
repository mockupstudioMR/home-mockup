import { getAiErrorMessage } from "@/lib/aiErrorMessage";
import { useState, useEffect, useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { invokeAi } from "@/lib/invokeAi";
import { requireUserId } from "@/lib/requireUserId";
import { uploadDesignImage } from "@/services/designImages";
import {
  GENERATE_KEYS,
  clearDesignView,
  hydrateAnalyzeRoomCacheFromMoodboard,
  fromRouteOrCache,
  readJson,
  readString,
  remove as removeSessionKeys,
  writeJson,
  writeString,
  type GenerateMoodboard,
} from "@/lib/generateSession";
import { useSessionCachedState, useSessionCachedString } from "@/hooks/useSessionCachedState";
import { invokeQueued } from "@/lib/aiQueue";
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
import { useQuiz } from "@/contexts/QuizContext";
import type { AngleImage, BoundingBox, DesignHighlightsData, DesignItem, GeneratedDesign, StyleMatch } from "./generate/types";
import { generateDesignTitle } from "./generate/designTitle";
import {
  buildStyleMatches,
  generateStyleProfile,
  getDefaultAccentFurniture,
  getDefaultColors,
  getMaterialsForStyle,
} from "./generate/styleDefaults";
import DesignImage from "@/components/generate/DesignImage";
import { trackEvent } from "@/lib/analytics";

import PersonalizedStyleProfile from "@/components/generate/PersonalizedStyleProfile";
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

// What earlier screens pass to /generate through navigation state.
type GenerateRouteState = {
  quizData?: QuizData & { existingRoomImages?: string[] };
  resumeDesignId?: string;
  existingRoomImages?: string[];
  keepElements?: string[];
  changeElements?: string[];
  source?: string;
  analysisResult?: AnalysisData;
  productAnalysis?: unknown;
  scenePreviewImage?: string;
  selectedInspirations?: string[];
  inspirationDetails?: InspirationDetail[];
  moodboard?: GenerateMoodboard;
};

// What the start-up effect reads from the current render.
type StartupState = {
  design: GeneratedDesign | null;
  designItems: DesignItem[];
  highlightsData: DesignHighlightsData | null;
  generateHighlights: (imageUrl: string) => Promise<void>;
  loadDesignById: (designId: string) => Promise<void>;
  loadExistingOrGenerate: () => Promise<void>;
};

type InspirationDetail = { label: string; description: string; type: string };
type AnalysisData = {
  styles?: Array<{ styleName: string; keywords: string[] }>;
  dominantColors?: string[];
  moodboardDescription?: string;
};


// Persistence rules for the session-cached state below.
const isPresent = <T,>(v: T | null | undefined) => v !== null && v !== undefined;
const isNonEmpty = (v: unknown[]) => v.length > 0;
// Visual URLs are large and can be regenerated; keep only the text.
const stripHighlightVisuals = (h: DesignHighlightsData | null) =>
  h && {
    colorScheme: { ...h.colorScheme, visual: undefined },
    accentFurniture: { ...h.accentFurniture, visual: undefined },
    moodboard: { ...h.moodboard, visual: undefined },
  };

const Generate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const { quizData: contextQuizData, updateQuizData } = useQuiz();

  // Hydrate from WhatsApp quiz session if ?wa_session=<id> is present.
  const waSessionId = new URLSearchParams(location.search).get("wa_session");
  const [waHydrating, setWaHydrating] = useState(!!waSessionId && !contextQuizData?.roomType);
  useEffect(() => {
    if (!waSessionId) return;
    if (contextQuizData?.roomType) { setWaHydrating(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("whatsapp-quiz-claim", { body: { sessionId: waSessionId } });
        if (error) throw error;
        const payload = data as { ok?: boolean; answers?: Record<string, unknown>; error?: string };
        if (payload?.error || !payload?.answers) throw new Error(payload?.error ?? "No answers");
        const a = payload.answers;
        if (cancelled) return;
        updateQuizData({
          intent: (a.intent as QuizData["intent"]) ?? undefined,
          roomType: (a.roomType as string) ?? "",
          stylePreference: (a.stylePreference as string) ?? "modern_minimal",
          colorPalette: (a.colorPalette as string) ?? "neutral",
          budgetFeel: (a.budgetFeel as string) ?? "mid-range",
          mustHaveElements: Array.isArray(a.mustHaveElements) ? (a.mustHaveElements as string[]) : [],
          furnitureSource: (a.furnitureSource as "shop_only" | "open") ?? "open",
          sourceImageUrl: (a.sourceImageUrl as string) || undefined,
        });
        writeString(GENERATE_KEYS.quizNonce, crypto.randomUUID());
        setWaHydrating(false);
      } catch (e) {
        console.error("[Generate] wa claim error", e);
        toast({ title: "Couldn't load WhatsApp quiz", description: (e as Error).message, variant: "destructive" });
        setWaHydrating(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waSessionId]);
  // Inputs from the previous screen. Each is cached in sessionStorage so a
  // reload or lost history state does not bounce the user back. They are
  // computed once per navigation (location.state), NOT on every render:
  // before, every render re-read and re-wrote these caches and produced new
  // objects, which re-ran the start-up effect on every render.
  const routeState = location.state as GenerateRouteState | null;
  const routeQuizData = routeState?.quizData as QuizData | undefined;
  const cachedQuizData = useMemo(
    () => fromRouteOrCache<QuizData>(GENERATE_KEYS.quizData, routeQuizData, (q) => !!q?.roomType),
    [routeQuizData],
  );
  // Fallback: if user arrived without route state but already has a chosen
  // roomType in the quiz context (e.g. from Start → moodboard flow), use that
  // instead of bouncing back to /quiz.
  const quizData: QuizData | undefined =
    routeQuizData || cachedQuizData || (contextQuizData?.roomType ? contextQuizData : undefined);

  const resumeDesignId = routeState?.resumeDesignId as string | undefined;
  const existingRoomImagesFromState = (routeState?.quizData?.existingRoomImages || routeState?.existingRoomImages) as string[] | undefined;
  const keepElementsFromState = routeState?.keepElements as string[] | undefined;
  const changeElementsFromState = routeState?.changeElements as string[] | undefined;
  const isExistingRoomFlow = routeState?.source === "existing-room" || !!existingRoomImagesFromState?.length;
  const shouldUseFloorPlanContext =
    !routeState?.analysisResult &&
    !existingRoomImagesFromState?.length &&
    !routeState?.productAnalysis &&
    !routeState?.scenePreviewImage &&
    routeState?.source !== "existing-room";

  const selectedInspirations = useMemo(
    () => fromRouteOrCache<string[]>(GENERATE_KEYS.inspirations, routeState?.selectedInspirations),
    [routeState?.selectedInspirations],
  );
  const inspirationDetails = useMemo(
    () => fromRouteOrCache<InspirationDetail[]>(GENERATE_KEYS.inspirationDetails, routeState?.inspirationDetails),
    [routeState?.inspirationDetails],
  );
  const analysisResult = useMemo(
    () => fromRouteOrCache<AnalysisData>(GENERATE_KEYS.analysis, routeState?.analysisResult),
    [routeState?.analysisResult],
  );

  // The moodboard is state: restoring a saved design replaces it, and the
  // page must re-render with the restored one.
  const routeMoodboard = routeState?.moodboard as GenerateMoodboard | undefined;
  const [currentMoodboard, setCurrentMoodboardState] = useState<GenerateMoodboard | undefined>(
    () => routeMoodboard ?? readJson<GenerateMoodboard | undefined>(GENERATE_KEYS.moodboard, undefined),
  );
  const setCurrentMoodboard = useCallback((mb: GenerateMoodboard | undefined) => {
    if (mb) writeJson(GENERATE_KEYS.moodboard, mb);
    else removeSessionKeys(GENERATE_KEYS.moodboard);
    setCurrentMoodboardState(mb);
  }, []);
  useEffect(() => {
    if (routeMoodboard) setCurrentMoodboard(routeMoodboard);
  }, [routeMoodboard, setCurrentMoodboard]);

  const [activeTab, setActiveTab] = useState("current");
  const [generating, setGenerating] = useState(false);
  const [design, setDesign] = useSessionCachedState<GeneratedDesign | null>(GENERATE_KEYS.design, null, { shouldPersist: isPresent });
  const [angleImages, setAngleImages] = useSessionCachedState<AngleImage[]>(GENERATE_KEYS.angles, [], { shouldPersist: isNonEmpty });
  const [modificationInput, setModificationInput] = useState("");
  const [extractedWalls, setExtractedWalls] = useState<ExtractedWall[]>([]);
  const [highlightsData, setHighlightsData] = useSessionCachedState<DesignHighlightsData | null>(
    GENERATE_KEYS.highlights,
    null,
    { shouldPersist: isPresent, serialize: stripHighlightVisuals },
  );
  const [generatingHighlights, setGeneratingHighlights] = useState(false);
  const [applyingHighlight, setApplyingHighlight] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [styleProfile, setStyleProfile] = useSessionCachedState<{
    matches: StyleMatch[];
    name: string;
    description: string;
  } | null>(GENERATE_KEYS.styleProfile, null, { shouldPersist: isPresent });
  const [designItems, setDesignItems] = useSessionCachedState<DesignItem[]>(GENERATE_KEYS.items, [], { shouldPersist: isNonEmpty });
  const [extractingItems, setExtractingItems] = useSessionCachedState<boolean>(GENERATE_KEYS.extracting, false);
  const [fullDescription, setFullDescription] = useSessionCachedString(GENERATE_KEYS.description);
  const [modificationHistory, setModificationHistory] = useSessionCachedState<string[]>(GENERATE_KEYS.history, [], { shouldPersist: isNonEmpty });
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [imageHistoryStack, setImageHistoryStack] = useSessionCachedState<string[]>(GENERATE_KEYS.imageHistory, [], { shouldPersist: isNonEmpty });
  const [isolatingPhotos, setIsolatingPhotos] = useState(false);
  const [existingRoomImages, setExistingRoomImages] = useState<string[]>([]);
  const [uploadingReference, setUploadingReference] = useState(false);
  const [debugSteps, setDebugSteps] = useSessionCachedState<Array<{ timestamp: string; step: string; detail: string; data?: unknown }>>(
    GENERATE_KEYS.debugSteps,
    [],
    { shouldPersist: isNonEmpty },
  );
  const [debugPrompt, setDebugPrompt] = useSessionCachedString(GENERATE_KEYS.debugPrompt);
  const designRef = useRef<HTMLDivElement>(null);
  

  // Track if initial load has been done
  const hasInitializedRef = useRef(false);

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


  // Persist the moodboard onto the design row so it can be restored when the
  // user re-opens the design later. Runs once per (designId, moodboard) pair.
  const persistedMoodboardKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const designId = design?.id;
    if (!designId || !currentMoodboard) return;
    const key = `${designId}:${JSON.stringify(currentMoodboard).length}`;
    if (persistedMoodboardKeyRef.current === key) return;
    persistedMoodboardKeyRef.current = key;
    supabase
      .from("generated_designs")
      .update({ moodboard: currentMoodboard } as any)
      .eq("id", designId)
      .then(({ error }) => {
        if (error) console.warn("[Generate] failed to persist moodboard", error);
      });
  }, [design?.id, currentMoodboard]);

  // Back-to-Moodboard handler: ensure a moodboard exists (in memory or DB).
  // If neither has one, synthesize a minimal moodboard from the current
  // analysis/design and persist it before navigating so /analyze-room always
  // opens something coherent instead of restarting the journey.
  const handleBackToMoodboard = async () => {
    try {
      // 1) In-memory moodboard is authoritative when present.
      if (currentMoodboard) {
        hydrateAnalyzeRoomCacheFromMoodboard(currentMoodboard);
        navigate("/analyze-room");
        return;
      }

      const designId = design?.id;

      // 2) Fall back to the DB copy for this design.
      if (designId) {
        const { data, error } = await supabase
          .from("generated_designs")
          .select("moodboard")
          .eq("id", designId)
          .maybeSingle();
        const savedMb = !error ? ((data as any)?.moodboard as GenerateMoodboard | null | undefined) : undefined;
        if (savedMb && Object.keys(savedMb).length > 0) {
          setCurrentMoodboard(savedMb);
          hydrateAnalyzeRoomCacheFromMoodboard(savedMb);
          navigate("/analyze-room");
          return;
        }
      }

      // 3) Nothing saved — synthesize a minimal moodboard from analysis + design.
      const synthesized: GenerateMoodboard = {
        colors: analysisResult?.dominantColors || [],
        materials: [],
        references: [],
        furnitureReferences: [],
        decorReferences: [],
        architectureReferences: [],
        mustInclude: [],
      };

      setCurrentMoodboard(synthesized);
      hydrateAnalyzeRoomCacheFromMoodboard(synthesized);

      if (designId) {
        supabase
          .from("generated_designs")
          .update({ moodboard: synthesized } as any)
          .eq("id", designId)
          .then(({ error }) => {
            if (error) console.warn("[Generate] failed to seed moodboard on back", error);
          });
      }

      navigate("/analyze-room");
    } catch (e) {
      console.warn("[Generate] handleBackToMoodboard failed, navigating anyway", e);
      navigate("/analyze-room");
    }
  };

  // Track the quiz data to detect new quizzes
  const lastQuizDataRef = useRef<string | null>(readString(GENERATE_KEYS.quizHash));

  // The start-up effect below must run when its INPUTS change (user, quiz,
  // route), not whenever the page re-renders. Page state and helper
  // functions are read through this ref so they are always current without
  // re-triggering the effect.
  // Filled by the layout effect placed after these functions are declared.
  const startupStateRef = useRef<StartupState | null>(null);

  useEffect(() => {
    if (!startupStateRef.current) return;
    const { design, designItems, highlightsData, generateHighlights, loadDesignById, loadExistingOrGenerate } =
      startupStateRef.current;
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
      if (waHydrating) return; // wait for WhatsApp session hydration
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
      source: routeState?.source,
      existingRoomImages: existingRoomImagesFromState,
      keepElements: keepElementsFromState,
      changeElements: changeElementsFromState,
    });

    // Also include the nonce to detect re-submissions with same preferences
    const quizNonce = readString(GENERATE_KEYS.quizNonce) || '';
    const fullHash = quizHash + '|' + quizNonce;

    // Get the last quiz hash from sessionStorage
    const storedHash = readString(GENERATE_KEYS.quizHash);
    
    // Check if this is a NEW quiz (different from stored one) or a scene preview flow.
    // Also: if the user arrived here with fresh quizData in navigation state (not just a tab
    // switch / refresh that re-reads from sessionStorage), always treat it as a new generation
    // request so we never silently reuse a stale cached design.
    const hasScenePreview = !!routeState?.scenePreviewImage;
    // Only treat as "fresh quiz arrival" the FIRST time this nonce is seen.
    // Without this, switching tabs/windows re-runs this effect with the same
    // location.state and would trigger a brand-new generation every focus.
    const consumedNonceKey = GENERATE_KEYS.consumedQuizNonce;
    const consumedNonce = readString(consumedNonceKey);
    const arrivedWithFreshQuiz =
      !!routeState?.quizData &&
      !resumeDesignId &&
      consumedNonce !== quizNonce;
    const isNewQuiz = (storedHash !== null && storedHash !== fullHash) || hasScenePreview || arrivedWithFreshQuiz;
    if (arrivedWithFreshQuiz) {
      writeString(consumedNonceKey, quizNonce);
    }
    
    if (isNewQuiz) {
      // Clear all caches for fresh start. clearDesignView() also drops the
      // camera-angle cache, which used to survive and reappear after a reload.
      clearDesignView();
      removeSessionKeys(GENERATE_KEYS.quizResponseId);
      setCurrentMoodboard(routeMoodboard);

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
    writeString(GENERATE_KEYS.quizHash, fullHash);
    lastQuizDataRef.current = fullHash;

    // Skip if we already have a cached design (tab switching)
    const cachedDesign = readJson<GeneratedDesign | null>(GENERATE_KEYS.design, null);
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
  }, [
    user,
    loading,
    navigate,
    quizData,
    resumeDesignId,
    waHydrating, // a failed WhatsApp hydration must still send the user on to /quiz
    routeState,
    routeMoodboard,
    existingRoomImagesFromState,
    keepElementsFromState,
    changeElementsFromState,
    setCurrentMoodboard,
    startupStateRef,
    // state setters (stable)
    setDesign, setAngleImages, setHighlightsData, setStyleProfile, setDesignItems, setFullDescription,
    setModificationHistory, setImageHistoryStack, setExtractingItems, setDebugSteps, setDebugPrompt,
  ]);

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

      // Restore saved moodboard so "Back to Moodboard" opens the exact
      // curated inspiration this design was generated from.
      const savedMoodboard = (existingDesign as any).moodboard as GenerateMoodboard | null | undefined;
      if (savedMoodboard && typeof savedMoodboard === "object") {
        try {
          setCurrentMoodboard(savedMoodboard);
          hydrateAnalyzeRoomCacheFromMoodboard(savedMoodboard);
        } catch { /* ignore quota */ }
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
      let currentQuizId = readString(GENERATE_KEYS.quizResponseId);

      const answers = {
        room_type: quizData.roomType || "living_room",
        style_preference: quizData.stylePreference || "modern-minimal",
        color_palette: quizData.colorPalette || "neutral",
        budget_feel: quizData.budgetFeel || "mid_range",
        must_have_elements: quizData.mustHaveElements || [],
        furniture_source: quizData.furnitureSource || "open",
      };

      // The session cache is lost on reload / in a new tab. Before creating a new
      // quiz row (which would look like "no design yet" and trigger a costly
      // re-generation), look the answers up in the database and reuse the row
      // that already has a stored design.
      if (!currentQuizId) {
        const { data: priorQuizzes } = await supabase
          .from("quiz_responses")
          .select("id, must_have_elements")
          .eq("user_id", user.id)
          .eq("room_type", answers.room_type)
          .eq("style_preference", answers.style_preference)
          .eq("color_palette", answers.color_palette)
          .eq("budget_feel", answers.budget_feel)
          .order("created_at", { ascending: false })
          .limit(20);

        const wanted = [...answers.must_have_elements].sort().join("|");
        const candidateIds = (priorQuizzes || [])
          .filter((q) => [...((q.must_have_elements as string[]) || [])].sort().join("|") === wanted)
          .map((q) => q.id);

        if (candidateIds.length > 0) {
          const { data: priorDesign } = await supabase
            .from("generated_designs")
            .select("quiz_response_id")
            .eq("user_id", user.id)
            .in("quiz_response_id", candidateIds)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (priorDesign?.quiz_response_id) {
            currentQuizId = priorDesign.quiz_response_id;
            writeString(GENERATE_KEYS.quizResponseId, currentQuizId);
          }
        }
      }

      if (!currentQuizId) {
        // Genuinely new answers - save the quiz response
        const { data: quizResponse } = await supabase
          .from("quiz_responses")
          .insert({ user_id: user.id, ...answers })
          .select()
          .single();

        currentQuizId = quizResponse?.id || null;
        if (currentQuizId) {
          writeString(GENERATE_KEYS.quizResponseId, currentQuizId);
        }
      }


      // Saving the answers failed: nothing to look up, generate a new design.
      if (!currentQuizId) {
        setGenerating(false);
        generateDesign(undefined);
        return;
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

      // Restore saved moodboard for this existing design so Back-to-Moodboard works.
      const savedMoodboard = (existingDesign as any).moodboard as GenerateMoodboard | null | undefined;
      if (savedMoodboard && typeof savedMoodboard === "object") {
        try {
          setCurrentMoodboard(savedMoodboard);
          hydrateAnalyzeRoomCacheFromMoodboard(savedMoodboard);
        } catch { /* ignore */ }
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
        removeSessionKeys(GENERATE_KEYS.extracting);
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
        // DB columns are nullable; the UI treats null and missing alike.
        })) as unknown as DesignItem[]);
      }
    } catch (error) {
      console.error("Error loading design items:", error);
    }
  };

  const handleGenerateAngle = async (anglePrompt: string): Promise<string | null> => {
    if (!design || !quizData) return null;
    try {
      const response = await invokeAi("generate-design", {
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

  const generateDesign = async (quizResponseId?: string, forceRecreate = false) => {
    if (generating && forceRecreate) return;
    if (!quizData || !user) {
      toast({ title: "Cannot recreate design", description: !user ? "Please sign in again." : "Please return to your moodboard to restore your room selections.", variant: "destructive" });
      return;
    }

    const { productAnalysis, sourceImages, includeProducts, scenePreviewImage } = location.state || {};
    const moodboard = currentMoodboard;
    const shouldIncludeProducts = !!includeProducts && !isExistingRoomFlow;

    setGenerating(true);
    if (!forceRecreate) setDesign(null);
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
      if (scenePreviewImage && !forceRecreate) {
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
      const generateBody = {
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
          architectureReferences: moodboard?.architectureReferences || [],
          mustIncludeItems: moodboard?.mustInclude || [],
          styleImageUrls: [
            ...((moodboard?.references?.map((r) => r.imageUrl).filter(Boolean) as string[]) || []),
            ...((moodboard?.materials?.map((m) => m.imageUrl).filter(Boolean) as string[]) || []),
            ...getStyleMoodboardUrls(quizData.stylePreference),
          ],
          floorPlanContext,
      };

      // The generator handles transient retries; do not replay terminal failures here.
      const response = await invokeAi("generate-design", { body: generateBody });

      if (response.error) {
        throw new Error(getAiErrorMessage(response.error));
      }
      if (!response.data?.imageUrl) {
        throw new Error(getAiErrorMessage(response.data, "The image model returned no image. Please try again."));
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
        imageUrl: storedImageUrl,
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

  // Plain click handlers: a memoized version kept outdated values (e.g. the
  // analysis inputs) because its dependency list was incomplete.
  const handleTryStyle = (newStyle: string) => {
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
        const response = await invokeAi("generate-design", {
          body: {
            ...overriddenQuiz,
            sourceImageUrl: overriddenQuiz.sourceImageUrl,
            existingRoomImages: existingRoomImagesFromState,
            keepElements: keepElementsFromState,
            changeElements: changeElementsFromState,
            selectedInspirations,
            inspirationDetails,
            detectedColors: currentMoodboard?.colors?.length ? currentMoodboard.colors : analysisResult?.dominantColors,
            detectedKeywords: analysisResult?.styles
              ?.filter(s => s.styleName.toLowerCase().replace(/[&\s]+/g, '-').replace(/-+/g, '-') === overriddenQuiz.stylePreference.replace(/_/g, '-'))
              ?.flatMap(s => s.keywords) || [],
            moodboardDescription: analysisResult?.moodboardDescription,
            moodboardMaterials: currentMoodboard?.materials || [],
            moodboardReferences: currentMoodboard?.references || [],
            architectureReferences: currentMoodboard?.architectureReferences || [],
            furnitureReferences: currentMoodboard?.furnitureReferences || [],
            decorReferences: currentMoodboard?.decorReferences || [],
            mustIncludeItems: currentMoodboard?.mustInclude || [],
            styleImageUrls: [
              ...((currentMoodboard?.references?.map(r => r.imageUrl).filter(Boolean) as string[]) || []),
              ...getStyleMoodboardUrls(overriddenQuiz.stylePreference),
            ],
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
  };

  const handleSurpriseStyle = () => {
    const styles = ["modern-minimal", "bohemian-eclectic", "classic-historical", "rustic-nature", "mediterranean", "glam-luxe"];
    const current = quizData?.stylePreference || "";
    const others = styles.filter((s) => s !== current);
    const random = others[Math.floor(Math.random() * others.length)];
    handleTryStyle(random);
  };

  // The start-up effect can re-run on many renders while highlights load;
  // never start a second paid analysis for the same image while one runs.
  const highlightsInFlightRef = useRef<string | null>(null);
  const generateHighlights = async (imageUrl: string) => {
    if (!quizData) return;
    if (highlightsInFlightRef.current === imageUrl) return;
    highlightsInFlightRef.current = imageUrl;

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
      if (highlightsInFlightRef.current === imageUrl) highlightsInFlightRef.current = null;
    }
  };

  // Keep the start-up effect's view of page state current. Layout effects run
  // before regular effects, so it always sees this render's values.
  useLayoutEffect(() => {
    startupStateRef.current = {
      design,
      designItems,
      highlightsData,
      generateHighlights,
      loadDesignById,
      loadExistingOrGenerate,
    };
  });

  const generateHighlightVisuals = async (highlights: DesignHighlightsData, quiz: QuizData) => {
    const style = quiz.stylePreference || "modern-minimal";
    const room = quiz.roomType || "living room";

    // Queued so the edge runtime never has to cold-boot all three at once
    const [colorResult, furnitureResult, moodboardResult] = await Promise.allSettled([
      invokeQueued<{ imageUrl?: string }>("generate-highlight-visuals", {
        type: "colorPalette",
        style,
        room,
        colors: highlights.colorScheme.colors,
        materials: highlights.colorScheme.materials,
      }),
      invokeQueued<{ imageUrl?: string }>("generate-highlight-visuals", {
        type: "accentFurniture",
        style,
        room,
        furnitureName: highlights.accentFurniture.name,
        furnitureDescription: highlights.accentFurniture.description,
      }),
      invokeQueued<{ imageUrl?: string }>("generate-highlight-visuals", {
        type: "moodboard",
        style,
        room,
        elements: highlights.moodboard.elements,
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


  const handleAngleImageGenerated = useCallback((label: string, imageUrl: string) => {
    setAngleImages(prev => {
      // Avoid duplicates
      if (prev.some(a => a.label === label)) {
        return prev.map(a => a.label === label ? { label, imageUrl } : a);
      }
      return [...prev, { label, imageUrl }];
    });
  }, [setAngleImages]);

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

  const handleModify = async (
    modificationType?: string,
    explicitPrompt?: string,
    explicitReferenceUrl?: string | null,
    layerInfo?: { layer: "architecture" | "furniture" | "decor"; lockedLayers: string[] },
  ) => {
    const promptToUse = (explicitPrompt ?? modificationInput).trim();
    if (!promptToUse || !quizData || !design) return;

    setGenerating(true);
    try {
      const response = await invokeAi("generate-design", {
        body: {
          ...quizData,
          modificationPrompt: promptToUse,
          modificationType: modificationType || "color_material",
          sourceImageUrl: design.imageUrl,
          referenceImageUrl: explicitReferenceUrl !== undefined ? explicitReferenceUrl : referenceImageUrl,
          existingRoomImages: existingRoomImages.length > 0 ? existingRoomImages : undefined,
          refinementLayer: layerInfo?.layer,
          lockedLayers: layerInfo?.lockedLayers,
        },
      });

      if (response.error) throw new Error(response.error.message);

      const { imageUrl: rawImageUrl, debugSteps: steps, prompt: usedPrompt } = response.data;
      if (steps) setDebugSteps(steps);
      if (usedPrompt) setDebugPrompt(usedPrompt);
      // The model returns base64; store it as a file so the row and the
      // undo stack hold a short URL instead of megabytes of image data.
      const imageUrl = user ? await uploadDesignImage(rawImageUrl, user.id) : rawImageUrl;

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
      const response = await invokeAi("generate-design", {
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

      const response = await invokeAi("generate-design", {
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
        .eq("user_id", requireUserId(user?.id))
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
      const response = await invokeAi("generate-design", {
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
    ...((currentMoodboard?.architectureReferences || []).map((item) => ({ ...item, kind: "material" as const }))),
    ...((currentMoodboard?.materials || []).map((item) => ({ ...item, kind: "material" as const }))),
  ];

  // Inject items from the generated design's "Complete Look Breakdown" so they
  // appear inline in the moodboard (replacing the old standalone breakdown card).
  {
    const FURNITURE_TYPES = new Set(["furniture", "lighting"]);
    const DECOR_TYPES = new Set(["decor", "textile"]);
    const MATERIAL_TYPES = new Set(["wall_color", "floor_material", "architectural"]);
    const seen = new Set(moodboardItems.map((m) => `${m.kind}|${m.label.toLowerCase()}`));
    for (const di of designItems) {
      let kind: MoodboardItem["kind"];
      if (FURNITURE_TYPES.has(di.item_type)) kind = "furniture";
      else if (DECOR_TYPES.has(di.item_type)) kind = "decor";
      else if (MATERIAL_TYPES.has(di.item_type)) kind = "material";
      else kind = "furniture";
      const isPureColor = kind === "material" && !!di.hex_code && !di.item_name;
      const label = isPureColor
        ? di.hex_code!.toUpperCase()
        : (di.item_name || di.color || di.hex_code || "Item");
      const key = `${kind}|${label.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const matched = (di as { matchedProduct?: { image_urls?: string[] } }).matchedProduct;
      const imageUrl = di.product_photo_url || matched?.image_urls?.[0];
      moodboardItems.push({ kind, label, imageUrl });
    }
  }


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
        <div className="sticky top-0 z-30 -mx-4 md:-mx-6 px-4 md:px-6 py-3 flex items-center justify-between bg-background/85 backdrop-blur-md border-b border-border/50">
          <button
            onClick={handleBackToMoodboard}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Moodboard</span>
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
              onRegenerate={() => generateDesign(undefined, true)}
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

        {design && (
          <div className="max-w-3xl mx-auto flex justify-end">
            <Button variant="outline" onClick={() => generateDesign(undefined, true)} disabled={generating}>
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {generating ? "Recreating design…" : "Recreate from moodboard"}
            </Button>
          </div>
        )}

        {/* Continue with the floor plan */}
        {design && !generating && (
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl border bg-card p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <div>
                <h3 className="font-semibold">Next: ground it in your floor plan</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your plan — we read a standard door as 1 m, measure every room, and you pick one room at a time.
                </p>
              </div>
              <Button
                onClick={() => {
                  // Carry the generated design forward so the shopping list can read it back
                  try {
                    if (design?.id && !design.id.startsWith("design-")) {
                      sessionStorage.setItem("floor_plan_design_id", design.id);
                    }
                  } catch { /* ignore quota */ }
                  navigate("/plan-rooms");
                }}
                className="shrink-0"
              >
                Continue with floor plan
              </Button>
            </div>
          </div>
        )}



        {/* Unified Moodboard + Refine — only visible after the user opts into refinement */}
        {design?.isLocked && (
        <div className="max-w-3xl mx-auto">
          <MoodboardRefinePanel
            items={moodboardItems}
            onAction={handleMoodboardAction}
            designDescription={[design?.description, fullDescription].filter(Boolean).join(" ")}
            roomType={quizData?.roomType}
            style={quizData?.stylePreference}
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
            onModify={(type, prefill, layerInfo) => handleModify(type, prefill, undefined, layerInfo)}
            onRegenerate={() => generateDesign(undefined, true)}
            onUndo={handleUndoDesign}
            canUndo={imageHistoryStack.length > 0}
            generating={generating}
            disabled={!design || generating}
            onBack={handleBackToMoodboard}
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
            {/* Other Angles Button - Hidden */}
            {/* <OtherAnglesButton
              key={design?.id}
              onGenerate={handleGenerateAngle}
              disabled={extractingItems || generating}
              onImageGenerated={handleAngleImageGenerated}
            /> */}
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

        {/* Wall Extraction Panel - shown in locked view only if walls were already extracted */}
        {design?.isLocked && extractedWalls.length > 0 && (
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
