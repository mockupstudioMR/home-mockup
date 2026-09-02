import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Trash2,
  Heart,
  Home,
  Plus,
  Loader2,
  Play,
  FileJson,
  Box,
  Ruler,
} from "lucide-react";
import { exportRoomSpec, fromLegacySession } from "@/services/roomSpec";
import { exportRoomObj, exportRoomDxf } from "@/services/roomCadExport";
import type { RoomSpec } from "@/types/roomSpec";
import { trackEvent } from "@/lib/analytics";
import { getThumbnailImageUrl } from "@/lib/imageOptimization";

interface Design {
  id: string;
  image_url: string;
  prompt: string;
  is_favorite: boolean;
  created_at: string;
  quiz_response_id: string | null;
  room_id: string | null;
}

type DiagEntry = {
  ts: string;
  level: "info" | "warn" | "error";
  message: string;
  detail?: string;
};

const Gallery = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [designs, setDesigns] = useState<Design[]>([]);
  const [loadingDesigns, setLoadingDesigns] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [diag, setDiag] = useState<DiagEntry[]>([]);
  const [showDiag, setShowDiag] = useState(false);

  const log = (level: DiagEntry["level"], message: string, detail?: string) => {
    const entry: DiagEntry = { ts: new Date().toISOString(), level, message, detail };
    // eslint-disable-next-line no-console
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
      `[Gallery] ${message}`,
      detail ?? ""
    );
    setDiag((prev) => [...prev, entry].slice(-100));
  };

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const fetchDesigns = async () => {
      setLoadingDesigns(true);
      setLoadError(null);
      setDiag([]);
      const url = (import.meta.env.VITE_SUPABASE_URL as string) || "(unset)";
      log("info", "Starting fetch", `user=${user.id}  online=${navigator.onLine}  supabase=${url}`);
      const maxAttempts = 3;
      let delayMs = 600;
      let lastError: unknown = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const controller = new AbortController();
        const timeoutMs = 20000;
        const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
        const t0 = performance.now();
        log("info", `Attempt ${attempt}/${maxAttempts}`, `timeout=${timeoutMs}ms`);

        try {
          const { data, error } = await supabase
            .from("generated_designs")
            .select("id, image_url, prompt, is_favorite, created_at, quiz_response_id, room_id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(120)
            .abortSignal(controller.signal);

          window.clearTimeout(timeoutId);
          const ms = Math.round(performance.now() - t0);
          if (cancelled) return;
          if (error) {
            log("error", `Query error (${ms}ms)`, JSON.stringify(error));
            throw error;
          }
          log("info", `Success (${ms}ms)`, `rows=${data?.length ?? 0}`);
          setDesigns(data || []);
          if (!cancelled) setLoadingDesigns(false);
          return;
        } catch (err) {
          window.clearTimeout(timeoutId);
          const ms = Math.round(performance.now() - t0);
          lastError = err;
          const isAbort = err instanceof DOMException && err.name === "AbortError";
          log(
            "warn",
            `Attempt ${attempt} failed (${ms}ms)${isAbort ? " — timeout/abort" : ""}`,
            err instanceof Error ? `${err.name}: ${err.message}` : JSON.stringify(err)
          );
          if (cancelled) return;
          if (attempt < maxAttempts) {
            log("info", `Retrying in ${delayMs}ms`);
            await new Promise((r) => setTimeout(r, delayMs));
            delayMs *= 2;
          }
        }
      }

      if (cancelled) return;
      const isTimeout = lastError instanceof DOMException && lastError.name === "AbortError";
      log(
        "error",
        "All attempts failed",
        lastError instanceof Error
          ? `${lastError.name}: ${lastError.message}`
          : JSON.stringify(lastError)
      );
      setLoadError(
        isTimeout
          ? "The gallery request is timing out before the backend responds."
          : "The gallery could not load your saved designs."
      );
      setShowDiag(true);
      setLoadingDesigns(false);
    };

    fetchDesigns();

    return () => { cancelled = true; };
  }, [user?.id, retryTick]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("generated_designs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setDesigns((prev) => prev.filter((d) => d.id !== id));
      toast({
        title: "Deleted",
        description: "Design removed from gallery",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete design",
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorite = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("generated_designs")
        .update({ is_favorite: !currentValue })
        .eq("id", id);

      if (error) throw error;

      if (!currentValue) {
        trackEvent("satisfied", "gallery", { design_id: id });
      }

      setDesigns((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, is_favorite: !currentValue } : d
        )
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `room-design-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadDesignSpec = async (design: Design): Promise<RoomSpec | null> => {
    let spec: RoomSpec | null = null;
      if (design.room_id) {
        const { data } = await supabase
          .from("rooms" as any)
          .select("*")
          .eq("id", design.room_id)
          .maybeSingle();
        if (data) {
          const d: any = data;
          spec = {
            id: d.id,
            user_id: d.user_id,
            name: d.name,
            room_type: d.room_type,
            shape: d.shape,
            dimensions: d.dimensions ?? {},
            custom_walls: d.custom_walls ?? undefined,
            walls: d.walls ?? [],
            style: d.style ?? { preference: "", colorPalette: "neutral", budgetFeel: "mid-range", mustHaveElements: [] },
            furniture: d.furniture ?? { selectedItems: [] },
            layout: d.layout ?? undefined,
            schema_version: d.schema_version ?? 1,
            created_at: d.created_at,
            updated_at: d.updated_at,
          };
        }
      }
      if (!spec) spec = fromLegacySession();
    return spec;
  };

  const handleExportRoom = async (design: Design) => {
    try {
      const spec = await loadDesignSpec(design);
      if (!spec) {
        toast({
          title: "No room data",
          description: "This design has no saved Room Spec to export.",
          variant: "destructive",
        });
        return;
      }
      exportRoomSpec(spec);
      toast({ title: "Room exported", description: `${spec.name}.room.json downloaded` });
    } catch (e) {
      console.error(e);
      toast({ title: "Export failed", description: "Could not export room", variant: "destructive" });
    }
  };

  const handleExportObj = async (design: Design) => {
    try {
      const spec = await loadDesignSpec(design);
      if (!spec) {
        toast({ title: "No room data", description: "No saved Room Spec to export.", variant: "destructive" });
        return;
      }
      exportRoomObj(spec);
      toast({ title: "3D model exported", description: "Open the .obj in Blender or SketchUp" });
    } catch (e) {
      console.error(e);
      toast({ title: "Export failed", description: "Could not export 3D model", variant: "destructive" });
    }
  };

  const handleExportDxf = async (design: Design) => {
    try {
      const spec = await loadDesignSpec(design);
      if (!spec) {
        toast({ title: "No room data", description: "No saved Room Spec to export.", variant: "destructive" });
        return;
      }
      exportRoomDxf(spec);
      toast({ title: "Floor plan exported", description: "Open the .dxf in SketchUp or AutoCAD" });
    } catch (e) {
      console.error(e);
      toast({ title: "Export failed", description: "Could not export floor plan", variant: "destructive" });
    }
  };

  const handleContinueDesign = async (design: Design) => {
    setResumingId(design.id);
    try {
      // Clear existing generate caches so the page loads from DB
      const generateKeys = [
        'generate_design_cache',
        'generate_products_cache',
        'generate_highlights_cache',
        'generate_styleprofile_cache',
        'generate_items_cache',
        'generate_description_cache',
        'generate_history_cache',
        'generate_extracting_cache',
        'generate_debug_steps_cache',
        'generate_debug_prompt_cache',
        'generate_quiz_hash',
        'generate_quiz_nonce',
        'generate_image_history_stack',
      ];
      generateKeys.forEach((key) => sessionStorage.removeItem(key));

      // Restore the moodboard for this design so "Back to Moodboard" opens
      // its curated inspiration instead of a blank / restarted moodboard.
      try {
        const { data: designRow } = await supabase
          .from("generated_designs")
          .select("moodboard")
          .eq("id", design.id)
          .maybeSingle();
        const mb = (designRow as any)?.moodboard;
        if (mb && typeof mb === "object") {
          sessionStorage.setItem("generate_moodboard_cache", JSON.stringify(mb));
          const existing = (() => {
            try {
              const raw = sessionStorage.getItem("analyze_room_cache");
              return raw ? JSON.parse(raw) : {};
            } catch { return {}; }
          })();
          const moodboard = {
            materials: mb.materials || [],
            references: mb.references || [],
            furnitureReferences: mb.furnitureReferences || [],
            decorReferences: mb.decorReferences || [],
            architectureReferences: mb.architectureReferences || [],
            mustInclude: mb.mustInclude || [],
          };
          sessionStorage.setItem("analyze_room_cache", JSON.stringify({
            ...existing,
            moodboard,
            moodboardReady: true,
            moodboardStep: 5,
            editableColors: mb.colors || existing.editableColors || [],
          }));
        } else {
          sessionStorage.removeItem("generate_moodboard_cache");
        }
      } catch (e) {
        console.warn("[Gallery] moodboard restore failed", e);
      }

      if (design.quiz_response_id) {
        // Fetch the quiz response to restore context
        const { data: quizResponse } = await supabase
          .from("quiz_responses")
          .select("*")
          .eq("id", design.quiz_response_id)
          .single();

        if (quizResponse) {
          const quizData = {
            stylePreference: quizResponse.style_preference,
            colorPalette: quizResponse.color_palette,
            roomType: quizResponse.room_type,
            budgetFeel: quizResponse.budget_feel,
            mustHaveElements: quizResponse.must_have_elements || [],
            furnitureSource: (quizResponse.furniture_source as "shop_only" | "open") || "open",
          };

          sessionStorage.setItem('generate_quiz_response_id', design.quiz_response_id);
          sessionStorage.setItem('quiz_data_cache', JSON.stringify(quizData));

          const quizHash = JSON.stringify({
            stylePreference: quizData.stylePreference,
            colorPalette: quizData.colorPalette,
            roomType: quizData.roomType,
            budgetFeel: quizData.budgetFeel,
            mustHaveElements: quizData.mustHaveElements,
            furnitureSource: quizData.furnitureSource,
          });
          sessionStorage.setItem('generate_quiz_hash', quizHash + '|');

          navigate("/generate", { state: { quizData } });
          return;
        }
      }

      // No quiz data — navigate with resumeDesignId so Generate loads the design directly
      navigate("/generate", { state: { resumeDesignId: design.id } });
    } catch (err) {
      console.error("Error resuming design:", err);
      toast({
        title: "Error",
        description: "Failed to resume design",
        variant: "destructive",
      });
    } finally {
      setResumingId(null);
    }
  };

  const filteredDesigns =
    filter === "favorites"
      ? designs.filter((d) => d.is_favorite)
      : designs;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-2xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-2xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="w-4 h-4" />
            </button>
            <h1 className="text-2xl font-bold">My HomeMockUps</h1>
          </div>
          <Button onClick={() => navigate("/quiz")}>
            <Plus className="w-4 h-4 mr-2" />
            New Design
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({designs.length})
          </Button>
          <Button
            variant={filter === "favorites" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("favorites")}
          >
            <Heart className="w-4 h-4 mr-2" />
            Favorites ({designs.filter((d) => d.is_favorite).length})
          </Button>
        </div>

        {/* Gallery Grid */}
        {loadingDesigns ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : loadError ? (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-20 text-center space-y-4">
              <div className="space-y-2">
                <p className="font-medium">Couldn't load your designs</p>
                <p className="text-muted-foreground">{loadError}</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button onClick={() => setRetryTick((t) => t + 1)}>Retry</Button>
                <Button variant="outline" onClick={() => setShowDiag((s) => !s)}>
                  {showDiag ? "Hide" : "Show"} diagnostics
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    const text = diag
                      .map((d) => `[${d.ts}] ${d.level.toUpperCase()} ${d.message}${d.detail ? " — " + d.detail : ""}`)
                      .join("\n");
                    navigator.clipboard.writeText(text);
                    toast({ title: "Log copied" });
                  }}
                >
                  Copy log
                </Button>
              </div>
              {showDiag && (
                <div className="text-left mx-auto max-w-2xl bg-muted/40 border border-border/50 rounded-md p-3 max-h-80 overflow-auto font-mono text-xs space-y-1">
                  <div className="text-muted-foreground">
                    online={String(navigator.onLine)} · url={String(import.meta.env.VITE_SUPABASE_URL || "(unset)")}
                  </div>
                  {diag.map((d, i) => (
                    <div
                      key={i}
                      className={
                        d.level === "error"
                          ? "text-destructive"
                          : d.level === "warn"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-foreground/80"
                      }
                    >
                      <span className="text-muted-foreground">{d.ts.slice(11, 23)}</span>{" "}
                      <span className="uppercase">[{d.level}]</span> {d.message}
                      {d.detail && <div className="pl-6 text-muted-foreground whitespace-pre-wrap break-all">{d.detail}</div>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : filteredDesigns.length === 0 ? (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="py-20 text-center">
              <p className="text-muted-foreground mb-4">
                {filter === "favorites"
                  ? "No favorite designs yet"
                  : "No designs yet"}
              </p>
              <Button onClick={() => navigate("/quiz")}>
                Create Your First Design
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDesigns.map((design) => (
              <Card
                key={design.id}
                className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden group"
              >
                <div className="relative aspect-video">
                  <img
                    src={getThumbnailImageUrl(design.image_url)}
                    alt="Room design"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleContinueDesign(design)}
                      disabled={resumingId === design.id}
                      title="Continue working on this design"
                    >
                      {resumingId === design.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleDownload(design.image_url)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() =>
                        handleToggleFavorite(design.id, design.is_favorite)
                      }
                      className={design.is_favorite ? "text-red-500" : ""}
                    >
                      <Heart
                        className="w-4 h-4"
                        fill={design.is_favorite ? "currentColor" : "none"}
                      />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleExportRoom(design)}
                      title="Export Room Spec as JSON"
                    >
                      <FileJson className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleExportDxf(design)}
                      title="Export 2D floor plan (.dxf) for SketchUp / AutoCAD"
                    >
                      <Ruler className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleExportObj(design)}
                      title="Export 3D model (.obj) for Blender / SketchUp"
                    >
                      <Box className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleDelete(design.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {design.prompt}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      {new Date(design.created_at).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => handleContinueDesign(design)}
                      disabled={resumingId === design.id}
                      className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    >
                      {resumingId === design.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                      Continue
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
