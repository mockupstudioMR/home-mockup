import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/QuizContext";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Logo from "@/components/Logo";
import { ArrowLeft, ArrowRight, Loader2, RotateCcw, X, Sofa, Bed, UtensilsCrossed, Monitor, Bath } from "lucide-react";
import { ArchFurniture, ArchLegend } from "@/components/floorplan/ArchFurniture";
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

// Opening types
type OpeningType = "door" | "window" | "balcony";
type WallSide = "top" | "right" | "bottom" | "left";

interface RoomOpening {
  id: string;
  type: OpeningType;
  wall: WallSide;
  position: number; // 0-100 percentage along the wall
}

const OPENING_TYPES: { type: OpeningType; label: string; icon: string; color: string }[] = [
  { type: "door", label: "Door", icon: "🚪", color: "hsl(var(--primary))" },
  { type: "window", label: "Window", icon: "🪟", color: "hsl(25 80% 55%)" },
  { type: "balcony", label: "Balcony", icon: "🏠", color: "hsl(150 50% 45%)" },
];

const WALL_LABELS: Record<WallSide, string> = {
  top: "Top Wall",
  right: "Right Wall",
  bottom: "Bottom Wall",
  left: "Left Wall",
};

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
          <rect x={w * 0.6} y={h * 0.2} width={w * 0.25} height={h * 0.15} fill="hsl(var(--primary) / 0.15)" stroke={stroke} strokeWidth={1} strokeDasharray="4 2" rx={1} />
          <text x={w / 2} y={h + 16} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))">{dims.width}m</text>
          <text x={-12} y={h / 2} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))" transform={`rotate(-90, -12, ${h / 2})`}>{dims.height}m</text>
        </svg>
      );
    }
  }
}

// Interactive room SVG with openings - click on walls to add
function RoomWithOpenings({
  shapeId,
  dims,
  openings,
  activeType,
  onWallClick,
  onRemoveOpening,
}: {
  shapeId: ShapeId;
  dims: Record<string, number>;
  openings: RoomOpening[];
  activeType: OpeningType;
  onWallClick: (wall: WallSide, position: number) => void;
  onRemoveOpening: (id: string) => void;
}) {
  const padding = 40;
  // Use a consistent scale for the interactive view
  const w = (dims.width || dims.mainW || dims.totalW || 5) * 30;
  const h = (dims.height || dims.mainH || dims.totalH || 4) * 30;
  const svgW = w + padding * 2;
  const svgH = h + padding * 2;

  const stroke = "hsl(var(--primary))";
  const fill = "hsl(var(--primary) / 0.06)";

  const handleWallClick = (wall: WallSide, e: React.MouseEvent<SVGLineElement>) => {
    const svg = e.currentTarget.closest("svg");
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    let position = 0;
    if (wall === "top" || wall === "bottom") {
      position = ((svgPt.x - padding) / w) * 100;
    } else {
      position = ((svgPt.y - padding) / h) * 100;
    }
    position = Math.max(10, Math.min(90, position));
    onWallClick(wall, position);
  };

  const getOpeningPos = (opening: RoomOpening) => {
    const pos = opening.position / 100;
    const size = opening.type === "door" ? 18 : opening.type === "balcony" ? 24 : 20;

    switch (opening.wall) {
      case "top":
        return { x: padding + pos * w, y: padding, horizontal: true, size };
      case "bottom":
        return { x: padding + pos * w, y: padding + h, horizontal: true, size };
      case "left":
        return { x: padding, y: padding + pos * h, horizontal: false, size };
      case "right":
        return { x: padding + w, y: padding + pos * h, horizontal: false, size };
    }
  };

  const openingColor = (type: OpeningType) => {
    return OPENING_TYPES.find((t) => t.type === type)?.color || stroke;
  };

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full max-h-[350px]">
      {/* Room fill */}
      <rect x={padding} y={padding} width={w} height={h} fill={fill} stroke="none" />

      {/* Clickable wall zones (invisible, wide hit area) */}
      {(["top", "bottom", "left", "right"] as WallSide[]).map((wall) => {
        const props =
          wall === "top"
            ? { x1: padding, y1: padding, x2: padding + w, y2: padding }
            : wall === "bottom"
            ? { x1: padding, y1: padding + h, x2: padding + w, y2: padding + h }
            : wall === "left"
            ? { x1: padding, y1: padding, x2: padding, y2: padding + h }
            : { x1: padding + w, y1: padding, x2: padding + w, y2: padding + h };
        return (
          <line
            key={wall}
            {...props}
            stroke="transparent"
            strokeWidth={16}
            className="cursor-crosshair"
            onClick={(e) => handleWallClick(wall, e)}
          />
        );
      })}

      {/* Visible walls */}
      <rect x={padding} y={padding} width={w} height={h} fill="none" stroke={stroke} strokeWidth={2.5} rx={2} />

      {/* Wall labels */}
      {(["top", "bottom", "left", "right"] as WallSide[]).map((wall) => {
        const labelProps =
          wall === "top"
            ? { x: padding + w / 2, y: padding - 8, anchor: "middle" }
            : wall === "bottom"
            ? { x: padding + w / 2, y: padding + h + 18, anchor: "middle" }
            : wall === "left"
            ? { x: padding - 8, y: padding + h / 2, anchor: "middle", rotate: true }
            : { x: padding + w + 8, y: padding + h / 2, anchor: "middle", rotate: true };
        return (
          <text
            key={wall}
            x={labelProps.x}
            y={labelProps.y}
            textAnchor="middle"
            fontSize={9}
            fill="hsl(var(--muted-foreground))"
            className="pointer-events-none select-none"
            transform={
              (labelProps as any).rotate
                ? `rotate(-90, ${labelProps.x}, ${labelProps.y})`
                : undefined
            }
          >
            Click to add {activeType}
          </text>
        );
      })}

      {/* Openings */}
      {openings.map((opening) => {
        const pos = getOpeningPos(opening);
        const color = openingColor(opening.type);
        const icon = OPENING_TYPES.find((t) => t.type === opening.type)?.icon || "?";

        return (
          <g key={opening.id} className="cursor-pointer" onClick={() => onRemoveOpening(opening.id)}>
            {pos.horizontal ? (
              <>
                <line
                  x1={pos.x - pos.size / 2}
                  y1={pos.y}
                  x2={pos.x + pos.size / 2}
                  y2={pos.y}
                  stroke={color}
                  strokeWidth={4}
                  strokeLinecap="round"
                />
                {opening.type === "door" && (
                  <path
                    d={`M${pos.x - pos.size / 2},${pos.y} A${pos.size / 2},${pos.size / 2} 0 0,${pos.y === padding ? 1 : 0} ${pos.x + pos.size / 2},${pos.y}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="3 2"
                    opacity={0.5}
                  />
                )}
                {opening.type === "balcony" && (
                  <rect
                    x={pos.x - pos.size / 2}
                    y={pos.y === padding ? pos.y - 10 : pos.y}
                    width={pos.size}
                    height={10}
                    fill={color}
                    opacity={0.15}
                    stroke={color}
                    strokeWidth={1}
                    rx={1}
                  />
                )}
              </>
            ) : (
              <>
                <line
                  x1={pos.x}
                  y1={pos.y - pos.size / 2}
                  x2={pos.x}
                  y2={pos.y + pos.size / 2}
                  stroke={color}
                  strokeWidth={4}
                  strokeLinecap="round"
                />
                {opening.type === "door" && (
                  <path
                    d={`M${pos.x},${pos.y - pos.size / 2} A${pos.size / 2},${pos.size / 2} 0 0,${pos.x === padding ? 0 : 1} ${pos.x},${pos.y + pos.size / 2}`}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="3 2"
                    opacity={0.5}
                  />
                )}
                {opening.type === "balcony" && (
                  <rect
                    x={pos.x === padding ? pos.x - 10 : pos.x}
                    y={pos.y - pos.size / 2}
                    width={10}
                    height={pos.size}
                    fill={color}
                    opacity={0.15}
                    stroke={color}
                    strokeWidth={1}
                    rx={1}
                  />
                )}
              </>
            )}
            <text
              x={pos.horizontal ? pos.x : pos.x + (pos.x === padding ? -14 : 14)}
              y={pos.horizontal ? pos.y + (pos.y === padding ? -10 : 16) : pos.y + 3}
              textAnchor="middle"
              fontSize={12}
              className="pointer-events-none"
            >
              {icon}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Architectural furniture overlay using top-view symbols
function ArchFurnitureOverlay({ items, canvasW, canvasH }: { items: LayoutItem[]; canvasW: number; canvasH: number }) {
  return (
    <>
      {items.map((item, i) => {
        const x = (item.x / 100) * canvasW + 10;
        const y = (item.y / 100) * canvasH + 10;
        const w = (item.w / 100) * canvasW;
        const h = (item.h / 100) * canvasH;
        return <ArchFurniture key={i} x={x} y={y} w={w} h={h} label={item.label} />;
      })}
    </>
  );
}

interface LayoutItem {
  label: string;
  x: number; y: number; w: number; h: number;
  reason?: string;
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

  const [step, setStep] = useState(0); // 0=shape, 1=dimensions, 2=room type & furniture, 3=openings, 4=layouts
  const [selectedShape, setSelectedShape] = useState<RoomShape | null>(null);
  const [dimensions, setDimensions] = useState<Record<string, number>>({});
  const [selectedRoomType, setSelectedRoomType] = useState<string>("");
  const [selectedFurniture, setSelectedFurniture] = useState<string[]>([]);
  const [openings, setOpenings] = useState<RoomOpening[]>([]);
  const [activeOpeningType, setActiveOpeningType] = useState<OpeningType>("door");
  const [layouts, setLayouts] = useState<LayoutSuggestion[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  // Fetch room furniture configs from DB
  const { data: roomConfigs } = useQuery({
    queryKey: ["room-furniture-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_furniture_config")
        .select("*")
        .order("room_label");
      if (error) throw error;
      return data as { id: string; room_type: string; room_label: string; furniture_items: string[]; description: string | null }[];
    },
  });

  const ROOM_ICONS: Record<string, React.ReactNode> = {
    "living-room": <Sofa className="w-6 h-6" />,
    "bedroom": <Bed className="w-6 h-6" />,
    "kitchen": <UtensilsCrossed className="w-6 h-6" />,
    "office": <Monitor className="w-6 h-6" />,
    "bathroom": <Bath className="w-6 h-6" />,
  };

  const activeRoomConfig = roomConfigs?.find(r => r.room_type === selectedRoomType);

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

  const addOpening = useCallback((wall: WallSide, position: number) => {
    setOpenings(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: activeOpeningType,
        wall,
        position: Math.round(position),
      },
    ]);
  }, [activeOpeningType]);

  const removeOpening = useCallback((id: string) => {
    setOpenings(prev => prev.filter(o => o.id !== id));
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
          roomType: selectedRoomType,
          furnitureItems: selectedFurniture,
          openings: openings.map(o => ({ type: o.type, wall: o.wall, position: o.position })),
        },
      });

      if (error) throw error;

      if (data?.layouts && Array.isArray(data.layouts)) {
        setLayouts(data.layouts);
      } else {
        throw new Error("Invalid layout response");
      }
      setStep(4);
    } catch (e: any) {
      console.error("Layout generation error:", e);
      toast({ title: "Layout Generation Failed", description: e.message || "Please try again.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }, [selectedShape, dimensions, selectedRoomType, selectedFurniture, openings]);

  const proceedToQuiz = useCallback(async () => {
    if (selectedLayout === null || !selectedShape) return;
    const floorPlanContext = {
      shape: selectedShape.id,
      dimensions,
      roomType: selectedRoomType,
      furnitureItems: selectedFurniture,
      openings: openings.map(o => ({ type: o.type, wall: o.wall, position: o.position })),
      layout: layouts[selectedLayout],
    };
    sessionStorage.setItem("floor_plan_context", JSON.stringify(floorPlanContext));
    const roomType = selectedRoomType || (selectedShape.id === "open-plan" ? "living_room" : "living_room");
    updateQuizData({ roomType });

    // Save quiz response directly and skip quiz page
    try {
      await supabase.from("quiz_responses").insert({
        user_id: user!.id,
        style_preference: "modern-minimal",
        color_palette: "neutral",
        room_type: roomType,
        budget_feel: "mid-range",
        must_have_elements: selectedFurniture,
        furniture_source: null,
      });
    } catch (_) { /* non-critical */ }

    sessionStorage.setItem('generate_quiz_nonce', crypto.randomUUID());
    navigate("/generate", { state: { quizData: { roomType, stylePreference: "modern-minimal", colorPalette: "neutral", budgetFeel: "mid-range", mustHaveElements: selectedFurniture } } });
  }, [selectedLayout, selectedShape, dimensions, selectedRoomType, selectedFurniture, openings, layouts, navigate, updateQuizData]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const STEP_LABELS = ["Shape", "Dimensions", "Room & Furniture", "Openings", "Layouts"];

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
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
              i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {i + 1}
            </div>
            <span className={`text-xs hidden sm:inline ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
            {i < STEP_LABELS.length - 1 && <div className={`w-8 h-px ${i < step ? "bg-primary" : "bg-border"}`} />}
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
                <div className="bg-card rounded-xl border p-6 flex items-center justify-center min-h-[300px]">
                  <ShapeSVG shapeId={selectedShape.id} dims={dimensions} scale={1} className="w-full h-full max-h-[280px]" />
                </div>

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
                    <Button onClick={() => setStep(2)} className="flex-1">
                      Next: Room Type <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Room Type & Furniture Selection */}
          {step === 2 && selectedShape && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold">Select Room Type & Furniture</h1>
                <p className="text-muted-foreground">Choose what type of room this is, then pick the furniture you want</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* Room Type Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Room Type</Label>
                  <div className="grid gap-2">
                    {(roomConfigs || []).map((rc) => (
                      <button
                        key={rc.room_type}
                        onClick={() => {
                          setSelectedRoomType(rc.room_type);
                          setSelectedFurniture([...rc.furniture_items]); // Pre-select all
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                          selectedRoomType === rc.room_type
                            ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                            : "border-border hover:border-primary/30 bg-card"
                        }`}
                      >
                        <div className="text-primary">
                          {ROOM_ICONS[rc.room_type] || <Sofa className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{rc.room_label}</div>
                          {rc.description && (
                            <div className="text-xs text-muted-foreground">{rc.description}</div>
                          )}
                        </div>
                      </button>
                    ))}
                    {(!roomConfigs || roomConfigs.length === 0) && (
                      <div className="text-sm text-muted-foreground py-4 text-center">Loading room types...</div>
                    )}
                  </div>
                </div>

                {/* Furniture Items Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Furniture Items {selectedFurniture.length > 0 && `(${selectedFurniture.length} selected)`}
                    </Label>
                    {activeRoomConfig && (
                      <button
                        onClick={() => {
                          if (selectedFurniture.length === activeRoomConfig.furniture_items.length) {
                            setSelectedFurniture([]);
                          } else {
                            setSelectedFurniture([...activeRoomConfig.furniture_items]);
                          }
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        {selectedFurniture.length === activeRoomConfig.furniture_items.length ? "Deselect all" : "Select all"}
                      </button>
                    )}
                  </div>

                  {activeRoomConfig ? (
                    <div className="space-y-1.5 max-h-[400px] overflow-y-auto rounded-xl border bg-card p-3">
                      {activeRoomConfig.furniture_items.map((item) => (
                        <label
                          key={item}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                            selectedFurniture.includes(item) ? "bg-primary/8" : "hover:bg-muted/50"
                          }`}
                        >
                          <Checkbox
                            checked={selectedFurniture.includes(item)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedFurniture(prev => [...prev, item]);
                              } else {
                                setSelectedFurniture(prev => prev.filter(f => f !== item));
                              }
                            }}
                          />
                          <span className="text-sm">{item}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                      ← Select a room type first to see available furniture
                    </div>
                  )}

                  {selectedFurniture.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedFurniture.map((item) => (
                        <Badge key={item} variant="secondary" className="text-xs gap-1">
                          {item}
                          <button onClick={() => setSelectedFurniture(prev => prev.filter(f => f !== item))}>
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dimensions
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!selectedRoomType || selectedFurniture.length === 0}
                >
                  Next: Openings <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Openings (doors, windows, balconies) */}
          {step === 3 && selectedShape && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold">Add Doors, Windows & Balconies</h1>
                <p className="text-muted-foreground">Select a type below, then click on any wall to place it. Click an opening to remove it.</p>
              </div>

              <div className="grid md:grid-cols-[1fr_280px] gap-6 items-start">
                {/* Interactive room */}
                <div className="bg-card rounded-xl border p-4 min-h-[400px] flex items-center justify-center">
                  <RoomWithOpenings
                    shapeId={selectedShape.id}
                    dims={dimensions}
                    openings={openings}
                    activeType={activeOpeningType}
                    onWallClick={addOpening}
                    onRemoveOpening={removeOpening}
                  />
                </div>

                {/* Controls */}
                <div className="space-y-5">
                  {/* Opening type selector */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Placing:</Label>
                    <div className="flex flex-col gap-2">
                      {OPENING_TYPES.map((ot) => (
                        <button
                          key={ot.type}
                          onClick={() => setActiveOpeningType(ot.type)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left text-sm transition-all ${
                            activeOpeningType === ot.type
                              ? "border-primary bg-primary/10 font-medium"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <span className="text-lg">{ot.icon}</span>
                          <span>{ot.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Placed openings list */}
                  {openings.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Placed ({openings.length}):</Label>
                      <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                        {openings.map((o) => {
                          const typeInfo = OPENING_TYPES.find(t => t.type === o.type);
                          return (
                            <div
                              key={o.id}
                              className="flex items-center justify-between px-3 py-2 rounded-md bg-muted/50 text-sm"
                            >
                              <span>
                                {typeInfo?.icon} {typeInfo?.label} — {WALL_LABELS[o.wall]}
                              </span>
                              <button
                                onClick={() => removeOpening(o.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    <Button onClick={generateLayouts} disabled={generating}>
                      {generating ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                      ) : (
                        <>Generate Layouts <ArrowRight className="w-4 h-4 ml-2" /></>
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => generateLayouts()} className="text-xs text-muted-foreground">
                      Skip — no openings to add
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Layout Suggestions */}
          {step === 4 && (
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
                          <CardContent className="p-4 space-y-2">
                            <div className="bg-[hsl(var(--background))] rounded-lg p-3 flex items-center justify-center border border-border/30">
                              <svg viewBox={`0 0 ${canvasW} ${canvasH}`} className="w-full h-auto">
                                <defs>
                                  <pattern id={`grid-${i}`} width="15" height="15" patternUnits="userSpaceOnUse">
                                    <path d="M 15 0 L 0 0 0 15" fill="none" stroke="hsl(var(--border) / 0.3)" strokeWidth="0.3" />
                                  </pattern>
                                </defs>
                                <rect x={10} y={10} width={canvasW - 20} height={canvasH - 20} fill={`url(#grid-${i})`} stroke="hsl(var(--foreground) / 0.4)" strokeWidth={2} rx={1} />
                                <rect x={8} y={8} width={canvasW - 16} height={canvasH - 16} fill="none" stroke="hsl(var(--foreground) / 0.15)" strokeWidth={5} rx={2} />
                                <ArchFurnitureOverlay items={layout.items} canvasW={canvasW - 20} canvasH={canvasH - 20} />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">{layout.name}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{layout.description}</p>
                              <ArchLegend items={layout.items.map(it => it.label)} />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="flex justify-center gap-3 pt-4">
                    <Button variant="outline" onClick={() => { setStep(3); setLayouts([]); setSelectedLayout(null); }}>
                      <RotateCcw className="w-4 h-4 mr-2" /> Edit Openings
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
