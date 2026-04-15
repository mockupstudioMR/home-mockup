import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/QuizContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import Logo from "@/components/Logo";
import { ArrowLeft, ArrowRight, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Room shape definitions
type ShapeId = "rectangle" | "l-shape" | "u-shape" | "open-plan";

interface RoomShape {
  id: ShapeId;
  label: string;
  description: string;
  defaultDimensions: Record<string, number>;
  dimensionLabels: Record<string, string>;
}

const ROOM_SHAPES: RoomShape[] = [
  {
    id: "rectangle",
    label: "Rectangle",
    description: "Standard rectangular room",
    defaultDimensions: { width: 5, height: 4 },
    dimensionLabels: { width: "Width (m)", height: "Length (m)" },
  },
  {
    id: "l-shape",
    label: "L-Shape",
    description: "L-shaped room with two sections",
    defaultDimensions: { mainW: 6, mainH: 4, wingW: 3, wingH: 3 },
    dimensionLabels: {
      mainW: "Main Width (m)",
      mainH: "Main Length (m)",
      wingW: "Wing Width (m)",
      wingH: "Wing Length (m)",
    },
  },
  {
    id: "u-shape",
    label: "U-Shape",
    description: "U-shaped room with three sections",
    defaultDimensions: { totalW: 7, totalH: 5, cutoutW: 3, cutoutH: 3 },
    dimensionLabels: {
      totalW: "Total Width (m)",
      totalH: "Total Length (m)",
      cutoutW: "Cutout Width (m)",
      cutoutH: "Cutout Length (m)",
    },
  },
  {
    id: "open-plan",
    label: "Open Plan",
    description: "Large open space with kitchen island area",
    defaultDimensions: { width: 8, height: 6 },
    dimensionLabels: { width: "Width (m)", height: "Length (m)" },
  },
];

// SVG shape renderers
function ShapeSVG({ shapeId, dims, scale = 1, className = "" }: { shapeId: ShapeId; dims: Record<string, number>; scale?: number; className?: string }) {
  const s = scale;
  const stroke = "hsl(var(--primary))";
  const fill = "hsl(var(--primary) / 0.08)";

  switch (shapeId) {
    case "rectangle": {
      const w = (dims.width || 5) * 30 * s;
      const h = (dims.height || 4) * 30 * s;
      return (
        <svg viewBox={`-20 -20 ${w + 40} ${h + 40}`} className={className}>
          <rect x={0} y={0} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={2} rx={2} />
          <text x={w / 2} y={h + 16} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))">{dims.width}m</text>
          <text x={-12} y={h / 2} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))" transform={`rotate(-90, -12, ${h / 2})`}>{dims.height}m</text>
        </svg>
      );
    }
    case "l-shape": {
      const mw = (dims.mainW || 6) * 25 * s;
      const mh = (dims.mainH || 4) * 25 * s;
      const ww = (dims.wingW || 3) * 25 * s;
      const wh = (dims.wingH || 3) * 25 * s;
      const path = `M0,0 H${mw} V${wh} H${ww} V${mh} H0 Z`;
      return (
        <svg viewBox={`-20 -20 ${mw + 40} ${mh + 40}`} className={className}>
          <path d={path} fill={fill} stroke={stroke} strokeWidth={2} />
          <text x={mw / 2} y={-6} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">{dims.mainW}m</text>
          <text x={-12} y={mh / 2} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))" transform={`rotate(-90, -12, ${mh / 2})`}>{dims.mainH}m</text>
        </svg>
      );
    }
    case "u-shape": {
      const tw = (dims.totalW || 7) * 22 * s;
      const th = (dims.totalH || 5) * 22 * s;
      const cw = (dims.cutoutW || 3) * 22 * s;
      const ch = (dims.cutoutH || 3) * 22 * s;
      const cx = (tw - cw) / 2;
      const path = `M0,0 H${tw} V${th} H${cx + cw} V${th - ch} H${cx} V${th} H0 Z`;
      return (
        <svg viewBox={`-20 -20 ${tw + 40} ${th + 40}`} className={className}>
          <path d={path} fill={fill} stroke={stroke} strokeWidth={2} />
          <text x={tw / 2} y={-6} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))">{dims.totalW}m</text>
          <text x={-12} y={th / 2} textAnchor="middle" fontSize={10} fill="hsl(var(--muted-foreground))" transform={`rotate(-90, -12, ${th / 2})`}>{dims.totalH}m</text>
        </svg>
      );
    }
    case "open-plan": {
      const w = (dims.width || 8) * 25 * s;
      const h = (dims.height || 6) * 25 * s;
      return (
        <svg viewBox={`-20 -20 ${w + 40} ${h + 40}`} className={className}>
          <rect x={0} y={0} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={2} rx={2} />
          {/* Kitchen island indicator */}
          <rect x={w * 0.6} y={h * 0.2} width={w * 0.25} height={h * 0.15} fill="hsl(var(--primary) / 0.15)" stroke={stroke} strokeWidth={1} strokeDasharray="4 2" rx={1} />
          <text x={w / 2} y={h + 16} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))">{dims.width}m</text>
          <text x={-12} y={h / 2} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))" transform={`rotate(-90, -12, ${h / 2})`}>{dims.height}m</text>
        </svg>
      );
    }
  }
}

// Furniture icon renderers for layouts
function FurnitureOverlay({ items, canvasW, canvasH }: { items: LayoutItem[]; canvasW: number; canvasH: number }) {
  return (
    <>
      {items.map((item, i) => {
        const x = (item.x / 100) * canvasW;
        const y = (item.y / 100) * canvasH;
        const w = (item.w / 100) * canvasW;
        const h = (item.h / 100) * canvasH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} fill="hsl(var(--accent) / 0.3)" stroke="hsl(var(--accent-foreground) / 0.5)" strokeWidth={1} rx={2} />
            <text x={x + w / 2} y={y + h / 2 + 3} textAnchor="middle" fontSize={Math.min(w, h) > 20 ? 8 : 6} fill="hsl(var(--foreground))">{item.label}</text>
          </g>
        );
      })}
    </>
  );
}

interface LayoutItem {
  label: string;
  x: number; y: number; w: number; h: number;
}

interface LayoutSuggestion {
  name: string;
  description: string;
  items: LayoutItem[];
}

const FloorPlan = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { updateQuizData } = useQuiz();

  const [step, setStep] = useState(0); // 0=shape, 1=dimensions, 2=layouts
  const [selectedShape, setSelectedShape] = useState<RoomShape | null>(null);
  const [dimensions, setDimensions] = useState<Record<string, number>>({});
  const [layouts, setLayouts] = useState<LayoutSuggestion[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const selectShape = useCallback((shape: RoomShape) => {
    setSelectedShape(shape);
    setDimensions({ ...shape.defaultDimensions });
    setStep(1);
  }, []);

  const updateDim = useCallback((key: string, val: string) => {
    const n = parseFloat(val);
    if (!isNaN(n) && n > 0 && n <= 30) {
      setDimensions(prev => ({ ...prev, [key]: n }));
    }
  }, []);

  const generateLayouts = useCallback(async () => {
    if (!selectedShape) return;
    setGenerating(true);
    setLayouts([]);
    setSelectedLayout(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-layout", {
        body: {
          shape: selectedShape.id,
          dimensions,
        },
      });

      if (error) throw error;

      if (data?.layouts && Array.isArray(data.layouts)) {
        setLayouts(data.layouts);
      } else {
        throw new Error("Invalid layout response");
      }
      setStep(2);
    } catch (e: any) {
      console.error("Layout generation error:", e);
      toast({ title: "Layout Generation Failed", description: e.message || "Please try again.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }, [selectedShape, dimensions]);

  const proceedToQuiz = useCallback(() => {
    if (selectedLayout === null || !selectedShape) return;
    // Store floor plan context in session for quiz/generate to use
    const floorPlanContext = {
      shape: selectedShape.id,
      dimensions,
      layout: layouts[selectedLayout],
    };
    sessionStorage.setItem("floor_plan_context", JSON.stringify(floorPlanContext));
    // Set room type based on shape
    updateQuizData({ roomType: selectedShape.id === "open-plan" ? "living_room" : "" });
    navigate("/quiz");
  }, [selectedLayout, selectedShape, dimensions, layouts, navigate, updateQuizData]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 md:p-6">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : navigate("/start")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <div className="flex items-center gap-3">
          <Logo size={28} />
          <span className="font-semibold text-foreground">HomeMockUp</span>
        </div>
        <div className="w-16" />
      </header>

      {/* Progress */}
      <div className="flex justify-center gap-2 px-4 pb-4">
        {["Shape", "Dimensions", "Layouts"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
              i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {i + 1}
            </div>
            <span className={`text-xs hidden sm:inline ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
            {i < 2 && <div className={`w-8 h-px ${i < step ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <main className="relative z-10 px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Step 0: Choose Shape */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold">Choose Your Room Shape</h1>
                <p className="text-muted-foreground">Select the shape that best matches your room</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ROOM_SHAPES.map((shape) => (
                  <Card
                    key={shape.id}
                    className="group cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => selectShape(shape)}
                  >
                    <CardContent className="p-4 flex flex-col items-center gap-3">
                      <div className="w-full aspect-square flex items-center justify-center">
                        <ShapeSVG shapeId={shape.id} dims={shape.defaultDimensions} scale={0.7} className="w-full h-full" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{shape.label}</h3>
                        <p className="text-xs text-muted-foreground">{shape.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Set Dimensions */}
          {step === 1 && selectedShape && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold">Set Room Dimensions</h1>
                <p className="text-muted-foreground">Enter measurements in meters</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* SVG Preview */}
                <div className="bg-card rounded-xl border p-6 flex items-center justify-center min-h-[300px]">
                  <ShapeSVG shapeId={selectedShape.id} dims={dimensions} scale={1} className="w-full h-full max-h-[280px]" />
                </div>

                {/* Dimension Inputs */}
                <div className="space-y-4">
                  {Object.entries(selectedShape.dimensionLabels).map(([key, label]) => (
                    <div key={key} className="space-y-1.5">
                      <Label htmlFor={key}>{label}</Label>
                      <Input
                        id={key}
                        type="number"
                        min={1}
                        max={30}
                        step={0.1}
                        value={dimensions[key] || ""}
                        onChange={(e) => updateDim(key, e.target.value)}
                      />
                    </div>
                  ))}

                  <div className="pt-4 flex gap-3">
                    <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                      <RotateCcw className="w-4 h-4 mr-2" /> Change Shape
                    </Button>
                    <Button onClick={generateLayouts} disabled={generating} className="flex-1">
                      {generating ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                      ) : (
                        <>Generate Layouts <ArrowRight className="w-4 h-4 ml-2" /></>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Layout Suggestions */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold">Choose Your Layout</h1>
                <p className="text-muted-foreground">AI-suggested furniture arrangements for your {selectedShape?.label} room</p>
              </div>

              {layouts.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-3 gap-4">
                    {layouts.map((layout, i) => {
                      const canvasW = 300;
                      const canvasH = 240;
                      return (
                        <Card
                          key={i}
                          className={`cursor-pointer transition-all ${
                            selectedLayout === i
                              ? "ring-2 ring-primary border-primary"
                              : "hover:border-primary/40"
                          }`}
                          onClick={() => setSelectedLayout(i)}
                        >
                          <CardContent className="p-4 space-y-3">
                            <div className="bg-muted/30 rounded-lg p-2 flex items-center justify-center">
                              <svg viewBox={`0 0 ${canvasW} ${canvasH}`} className="w-full h-auto">
                                {/* Room outline */}
                                <rect x={10} y={10} width={canvasW - 20} height={canvasH - 20} fill="hsl(var(--primary) / 0.05)" stroke="hsl(var(--border))" strokeWidth={1.5} rx={3} />
                                <FurnitureOverlay items={layout.items} canvasW={canvasW - 20} canvasH={canvasH - 20} />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">{layout.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1">{layout.description}</p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="flex justify-center gap-3 pt-4">
                    <Button variant="outline" onClick={() => { setStep(1); setLayouts([]); setSelectedLayout(null); }}>
                      <RotateCcw className="w-4 h-4 mr-2" /> Adjust Dimensions
                    </Button>
                    <Button variant="outline" onClick={generateLayouts} disabled={generating}>
                      {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Regenerate
                    </Button>
                    <Button onClick={proceedToQuiz} disabled={selectedLayout === null}>
                      Continue to Style <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FloorPlan;
