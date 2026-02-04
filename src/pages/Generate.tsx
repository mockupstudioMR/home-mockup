import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Send,
  Home,
  ArrowLeft,
  ShoppingBag,
  RefreshCw,
  Upload,
  X,
  Clock,
  Heart,
  Sparkles,
} from "lucide-react";
import type { QuizData } from "@/contexts/QuizContext";
import DesignImage from "@/components/generate/DesignImage";
import ProductCard from "@/components/generate/ProductCard";
import DesignHighlights from "@/components/generate/DesignHighlights";
import PersonalizedStyleProfile from "@/components/generate/PersonalizedStyleProfile";
import DesignItemsList from "@/components/generate/DesignItemsList";
import LoveThisButton from "@/components/generate/LoveThisButton";
import VisualSearchLinks from "@/components/generate/VisualSearchLinks";
import DesignHistoryTab from "@/components/generate/DesignHistoryTab";
import DesignLikesTab from "@/components/generate/DesignLikesTab";

interface GeneratedDesign {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  isFavorite: boolean;
  isLocked?: boolean;
}

interface Product {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  category?: string;
  style?: string;
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
  matchedProduct?: {
    id: string;
    name: string;
    price?: number;
    currency?: string;
    image_urls?: string[];
    source_url?: string;
  };
}

const Generate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const quizData = location.state?.quizData as QuizData | undefined;

  // Initialize state from sessionStorage to persist across tab switches
  const getInitialDesign = (): GeneratedDesign | null => {
    try {
      const cached = sessionStorage.getItem('generate_design_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const getInitialProducts = (): Product[] => {
    try {
      const cached = sessionStorage.getItem('generate_products_cache');
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

  const [generating, setGenerating] = useState(false);
  const [design, setDesign] = useState<GeneratedDesign | null>(getInitialDesign);
  const [products, setProducts] = useState<Product[]>(getInitialProducts);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [modificationInput, setModificationInput] = useState("");
  const [highlightsData, setHighlightsData] = useState<DesignHighlightsData | null>(getInitialHighlights);
  const [generatingHighlights, setGeneratingHighlights] = useState(false);
  const [applyingHighlight, setApplyingHighlight] = useState<string | null>(null);
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
  const [uploadingReference, setUploadingReference] = useState(false);
  
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

  // Cache state changes to sessionStorage (skip large data like highlights visuals)
  useEffect(() => {
    if (design) {
      safeSessionStorage('generate_design_cache', JSON.stringify(design));
    }
  }, [design, safeSessionStorage]);

  useEffect(() => {
    if (products.length > 0) {
      // Only cache first 10 products to save space
      const limitedProducts = products.slice(0, 10);
      safeSessionStorage('generate_products_cache', JSON.stringify(limitedProducts));
    }
  }, [products, safeSessionStorage]);

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

  // Cache extracting state to persist across tab switches
  useEffect(() => {
    safeSessionStorage('generate_extracting_cache', extractingItems ? 'true' : 'false');
  }, [extractingItems, safeSessionStorage]);

  // Track the quiz data to detect new quizzes
  const lastQuizDataRef = useRef<string | null>(sessionStorage.getItem('generate_quiz_hash'));

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
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
    });

    // Get the last quiz hash from sessionStorage
    const storedHash = sessionStorage.getItem('generate_quiz_hash');
    
    // Check if this is a NEW quiz (different from stored one)
    const isNewQuiz = storedHash !== null && storedHash !== quizHash;
    
    if (isNewQuiz) {
      // Clear all caches for fresh start
      sessionStorage.removeItem('generate_design_cache');
      sessionStorage.removeItem('generate_products_cache');
      sessionStorage.removeItem('generate_highlights_cache');
      sessionStorage.removeItem('generate_styleprofile_cache');
      sessionStorage.removeItem('generate_items_cache');
      sessionStorage.removeItem('generate_description_cache');
      sessionStorage.removeItem('generate_history_cache');
      sessionStorage.removeItem('generate_extracting_cache');
      sessionStorage.removeItem('generate_quiz_response_id');
      
      // Reset state
      setDesign(null);
      setProducts([]);
      setHighlightsData(null);
      setStyleProfile(null);
      setDesignItems([]);
      setFullDescription("");
      setModificationHistory([]);
      setExtractingItems(false);
      hasInitializedRef.current = false;
    }

    // Store current quiz hash
    sessionStorage.setItem('generate_quiz_hash', quizHash);
    lastQuizDataRef.current = quizHash;

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
      if (products.length === 0 && cachedDesign.imageUrl) {
        searchProducts(cachedDesign.imageUrl);
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
  }, [user, loading, navigate, quizData]);

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
      setDesign({
        id: existingDesign.id,
        imageUrl: existingDesign.image_url,
        title: "Your Personalized Design",
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
      if (products.length === 0) {
        searchProducts(existingDesign.image_url);
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
          matchedProduct:matched_product_id(id, name, price, currency, image_urls, source_url)
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

  const generateDesign = async (quizResponseId?: string) => {
    if (!quizData || !user) return;

    const { productAnalysis, sourceImages, includeProducts } = location.state || {};

    setGenerating(true);
    setDesign(null);
    setHighlightsData(null);
    setProducts([]);
    setDesignItems([]);
    setModificationHistory([]);
    setFullDescription("");

    try {
      const response = await supabase.functions.invoke("generate-design", {
        body: {
          ...quizData,
          sourceImageUrl: quizData.sourceImageUrl,
          selectedProducts: includeProducts ? productAnalysis?.products : undefined,
          productImageUrls: includeProducts ? sourceImages : undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { imageUrl, prompt: usedPrompt } = response.data;

      // Save to database with quiz_response_id link
      const { data: savedDesign } = await supabase
        .from("generated_designs")
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          prompt: usedPrompt,
          source_image_url: quizData.sourceImageUrl,
          quiz_response_id: quizResponseId,
        })
        .select()
        .single();

      const newDesign: GeneratedDesign = {
        id: savedDesign?.id || `design-${Date.now()}`,
        imageUrl,
        title: "Your Personalized Design",
        description: "Custom room design based on your style preferences",
        isFavorite: false,
      };

      setDesign(newDesign);

      // Search for products and generate highlights
      searchProducts(imageUrl);
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
      const furnitureName = analysis?.styles?.[0]?.styleName || getDefaultAccentFurniture(quizData.stylePreference);
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

  const searchProducts = async (imageUrl?: string) => {
    if (!quizData) return;

    setLoadingProducts(true);
    try {
      const response = await supabase.functions.invoke("search-products", {
        body: {
          imageUrl: imageUrl,
          style: quizData.stylePreference,
          room: quizData.roomType,
          query: quizData.mustHaveElements?.join(" "),
        },
      });

      if (response.error) {
        console.error("Product search failed:", response.error);
        return;
      }

      if (response.data?.success && response.data?.products) {
        setProducts(response.data.products);
      }
    } catch (error) {
      console.error("Product search error:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

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

  const handleModify = async () => {
    if (!modificationInput.trim() || !quizData || !design) return;
    if (design.isLocked) {
      toast({
        title: "Design is locked",
        description: "This design has been finalized and cannot be modified",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-design", {
        body: {
          ...quizData,
          modificationPrompt: modificationInput,
          sourceImageUrl: design.imageUrl,
          referenceImageUrl: referenceImageUrl,
        },
      });

      if (response.error) throw new Error(response.error.message);

      const { imageUrl } = response.data;

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
              .select("id, name, price, currency, image_urls, source_url")
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
        description: `Extracted ${items?.length || 0} items from your design`,
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

    setDesign({ ...design, isFavorite: !design.isFavorite });

    // Update in database if it's a real ID
    if (!design.id.startsWith("design-")) {
      await supabase
        .from("generated_designs")
        .update({ is_favorite: !design.isFavorite })
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

      // Save new image URL to database
      if (!design.id.startsWith("design-")) {
        await supabase
          .from("generated_designs")
          .update({ image_url: imageUrl })
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
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
              My Gallery
            </button>
          </div>
        </div>

        {/* Tabs for Current Design, History, and Likes */}
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-6">
            <TabsTrigger value="current" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Current</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="likes" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Likes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-8">
            {/* Page Title */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold">Your Design Results</h1>
              <p className="text-muted-foreground">
                Your personalized room design with key highlights
              </p>
            </div>

        {/* Generation Progress */}
        {generating && !design && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <div className="text-center">
                  <p className="font-medium">Creating your personalized design...</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This may take a moment
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personalized Style Profile */}
        {styleProfile && (
          <PersonalizedStyleProfile
            styleMatches={styleProfile.matches}
            profileName={styleProfile.name}
            profileDescription={styleProfile.description}
          />
        )}

        {/* Main Design */}
        {design && (
          <div className="max-w-3xl mx-auto">
            <DesignImage
              imageUrl={design.imageUrl}
              title={design.title}
              description={design.description}
              index={0}
              isFavorite={design.isFavorite}
              onFavorite={handleFavorite}
              onDownload={handleDownload}
            />
          </div>
        )}

        {/* Love This Button - Under Main Design */}
        {design && !generating && !design.isLocked && (
          <div className="flex justify-center">
            <LoveThisButton
              isLocked={design.isLocked || false}
              isLoading={extractingItems}
              onLock={handleLockDesign}
            />
          </div>
        )}

        {/* Design Items List - Show when items exist or extracting */}
        {design && (designItems.length > 0 || extractingItems) && (
          <DesignItemsList
            items={designItems}
            fullDescription={fullDescription}
            designImageUrl={design.imageUrl}
            isLoading={extractingItems}
          />
        )}

        {/* Modification Input - Only show if not locked */}
        {design && !generating && !design.isLocked && (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm max-w-3xl mx-auto">
            <CardContent className="p-4">
              <div className="space-y-4">
                <p className="text-sm font-medium">Refine your design</p>
                
                {/* Reference Image Upload */}
                <div className="flex items-center gap-3">
                  {referenceImageUrl ? (
                    <div className="relative">
                      <img 
                        src={referenceImageUrl} 
                        alt="Reference" 
                        className="w-16 h-16 object-cover rounded-lg border border-border"
                      />
                      <button
                        onClick={() => setReferenceImageUrl(null)}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors">
                      {uploadingReference ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Upload className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">Add reference</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReferenceUpload}
                        className="hidden"
                        disabled={uploadingReference}
                      />
                    </label>
                  )}
                  {referenceImageUrl && (
                    <span className="text-xs text-muted-foreground">Reference image added</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add plants, change wall color to blue, add more lighting..."
                    value={modificationInput}
                    onChange={(e) => setModificationInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleModify()}
                  />
                  <Button onClick={handleModify} disabled={!modificationInput.trim() || generating}>
                    <Send className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" onClick={() => generateDesign()} disabled={generating}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Design Highlights */}
        {highlightsData && (
          <DesignHighlights
            colorScheme={highlightsData.colorScheme}
            accentFurniture={highlightsData.accentFurniture}
            moodboard={highlightsData.moodboard}
            onApplyNote={handleApplyHighlightNote}
            isApplying={applyingHighlight}
          />
        )}

        {/* Visual Search Links - Show on first screen */}
        {design && quizData && !design.isLocked && (
          <VisualSearchLinks
            stylePreference={quizData.stylePreference}
            roomType={quizData.roomType}
            colorPalette={quizData.colorPalette}
            mustHaveElements={quizData.mustHaveElements}
            accentFurniture={highlightsData?.accentFurniture?.name}
            materials={highlightsData?.colorScheme?.materials}
          />
        )}

        {/* Loading Highlights */}
        {generatingHighlights && !highlightsData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Products Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Shop the Look</h2>
              <p className="text-sm text-muted-foreground">
                AI-detected products from your design
              </p>
            </div>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No matching products found. Try generating a design first.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold">Design History</h1>
              <p className="text-muted-foreground">
                All your past designs and modifications
              </p>
            </div>
            <DesignHistoryTab />
          </TabsContent>

          <TabsContent value="likes" className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold">Favorites</h1>
              <p className="text-muted-foreground">
                Designs you've marked as favorites
              </p>
            </div>
            <DesignLikesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Generate;
