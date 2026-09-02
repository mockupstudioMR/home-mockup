import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/QuizContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/Logo";
import { ArrowLeft, ArrowRight, DoorOpen, Loader2, Ruler, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { aiErrorMessage } from "@/lib/aiErrorMessage";

interface PlanOpening {
  type: "door" | "window" | "balcony";
  wall_index: number;
  position_pct: number;
}

interface PlanRoom {
  id: string;
  name: string;
  room_type: string;
  width_m: number;
  length_m: number;
  area_sqm: number;
  confidence?: number;
  polygon: { x: number; y: number }[];
  openings: PlanOpening[];
}

interface PlanResult {
  rooms: PlanRoom[];
  door_width_px?: number;
  metres_per_pixel?: number;
  total_area_sqm?: number;
  notes?: string;
}

const centroid = (poly: { x: number; y: number }[]) => {
  if (!poly.length) return { x: 50, y: 50 };
  const x = poly.reduce((s, p) => s + p.x, 0) / poly.length;
  const y = poly.reduce((s, p) => s + p.y, 0) / poly.length;
  return { x, y };
};

const PlanRooms = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateQuizData } = useQuiz();
  const fileRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedRoom = useMemo(
    () => plan?.rooms.find((r) => r.id === selectedId) ?? null,
    [plan, selectedId],
  );

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;
      setUploading(true);
      setPlan(null);
      setSelectedId(null);
      try {
        const ext = file.name.split(".").pop() || "png";
        const path = `${user.id}/multiroom_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("room-uploads").upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("room-uploads").getPublicUrl(path);
        setImageUrl(urlData.publicUrl);
        setUploading(false);
        setAnalyzing(true);

        trackEvent("ai_call", "plan-rooms", { fn: "analyze-multiroom-plan" });
        const { data, error } = await supabase.functions.invoke("analyze-multiroom-plan", {
          body: { imageUrl: urlData.publicUrl },
        });
        if (error) throw error;
        if (!data?.plan?.rooms?.length) throw new Error("No rooms could be detected in this plan");

        setPlan(data.plan as PlanResult);
        toast({
          title: `${data.plan.rooms.length} rooms detected`,
          description: "Sizes were scaled using a 1 m door reference.",
        });
      } catch (err: any) {
        toast({ title: "Analysis failed", description: aiErrorMessage(err), variant: "destructive" });
      } finally {
        setUploading(false);
        setAnalyzing(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [user],
  );

  const continueWithRoom = useCallback(() => {
    if (!selectedRoom) return;
    const prefill = {
      shape: "rectangle",
      dimensions: {
        width: Math.max(1, Math.round(selectedRoom.width_m * 100) / 100),
        height: Math.max(1, Math.round(selectedRoom.length_m * 100) / 100),
      },
      roomName: selectedRoom.name,
      roomType: selectedRoom.room_type,
      openings: selectedRoom.openings,
      planImageUrl: imageUrl,
      scale: { door_m: 1, metres_per_pixel: plan?.metres_per_pixel ?? null },
    };
    sessionStorage.setItem("floor_plan_prefill", JSON.stringify(prefill));
    updateQuizData({ roomType: selectedRoom.room_type });
    navigate("/floor-plan");
  }, [selectedRoom, imageUrl, plan, updateQuizData, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/60 backdrop-blur sticky top-0 z-20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-5xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Now let's ground it in your floor plan</h1>
          <p className="text-muted-foreground">
            Upload your plan — we read a standard door as 1&nbsp;m to measure every room, then you pick one room to work on.
          </p>
        </div>

        {/* Upload */}
        {!plan && (
          <Card className="border-dashed">
            <CardContent className="p-10">
              <label className="flex flex-col items-center gap-4 cursor-pointer text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  {uploading || analyzing ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">
                    {analyzing ? "Reading your plan…" : uploading ? "Uploading…" : "Upload your floor plan"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Photo, scan or sketch (PNG/JPG). Doors are used as the 1&nbsp;m scale reference.
                  </p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading || analyzing}
                />
              </label>
            </CardContent>
          </Card>
        )}

        {/* Detected plan */}
        {plan && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 justify-center">
              <Badge variant="secondary" className="gap-1">
                <DoorOpen className="w-3 h-3" /> Door = 1.00 m
              </Badge>
              {plan.metres_per_pixel ? (
                <Badge variant="outline" className="gap-1">
                  <Ruler className="w-3 h-3" /> {plan.metres_per_pixel.toFixed(4)} m / px
                </Badge>
              ) : null}
              {plan.total_area_sqm ? (
                <Badge variant="outline">Total ≈ {plan.total_area_sqm} m²</Badge>
              ) : null}
              <Badge variant="outline">{plan.rooms.length} rooms</Badge>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0 relative">
                {imageUrl && (
                  <img src={imageUrl} alt="Uploaded floor plan" className="w-full h-auto select-none" />
                )}
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="absolute inset-0 w-full h-full"
                >
                  {plan.rooms.map((room) => {
                    const isSelected = room.id === selectedId;
                    const pts = room.polygon.map((p) => `${p.x},${p.y}`).join(" ");
                    const c = centroid(room.polygon);
                    return (
                      <g
                        key={room.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedId(isSelected ? null : room.id)}
                      >
                        <polygon
                          points={pts}
                          fill={isSelected ? "hsl(var(--primary) / 0.35)" : "hsl(var(--primary) / 0.08)"}
                          stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.5)"}
                          strokeWidth={isSelected ? 0.9 : 0.4}
                          vectorEffect="non-scaling-stroke"
                        />
                        <text
                          x={c.x}
                          y={c.y}
                          textAnchor="middle"
                          style={{ fontSize: 2.6, fontWeight: 600 }}
                          fill="hsl(var(--foreground))"
                        >
                          {room.name}
                        </text>
                        <text
                          x={c.x}
                          y={c.y + 3}
                          textAnchor="middle"
                          style={{ fontSize: 2.2 }}
                          fill="hsl(var(--muted-foreground))"
                        >
                          {room.width_m.toFixed(2)} × {room.length_m.toFixed(2)} m
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </CardContent>
            </Card>

            {/* Room list — single select */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {plan.rooms.map((room) => {
                const isSelected = room.id === selectedId;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedId(isSelected ? null : room.id)}
                    className={`text-left rounded-xl border p-4 transition ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/40"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{room.name}</span>
                      {isSelected && <Badge>Selected</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {room.width_m.toFixed(2)} × {room.length_m.toFixed(2)} m · {room.area_sqm.toFixed(2)} m²
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {room.room_type.replace(/[-_]/g, " ")}
                      {room.openings?.length ? ` · ${room.openings.length} openings` : ""}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" onClick={() => { setPlan(null); setSelectedId(null); }}>
                Upload a different plan
              </Button>
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {selectedRoom ? `Working on ${selectedRoom.name}` : "Pick one room to continue"}
                </p>
                <Button disabled={!selectedRoom} onClick={continueWithRoom}>
                  Continue with this room <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PlanRooms;
