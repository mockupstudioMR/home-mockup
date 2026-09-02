import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getAiErrorMessage } from "@/lib/aiErrorMessage";

interface PlanOpening {
  type: "door" | "window" | "balcony";
  wall_index: number;
  position_pct: number;
  width_m?: number;
  /** centre of the opening in % of the image, when the AI provided it */
  x?: number;
  y?: number;
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

const OPENING_COLORS: Record<PlanOpening["type"], string> = {
  door: "hsl(25 70% 45%)",
  window: "hsl(205 85% 50%)",
  balcony: "hsl(150 55% 40%)",
};

/** Distinct colour per room — used instead of labels drawn on the plan. */
const ROOM_COLORS = [
  "hsl(265 60% 58%)",
  "hsl(15 80% 60%)",
  "hsl(150 50% 42%)",
  "hsl(205 80% 52%)",
  "hsl(45 85% 52%)",
  "hsl(330 65% 58%)",
  "hsl(185 60% 42%)",
  "hsl(95 45% 45%)",
  "hsl(240 55% 62%)",
  "hsl(0 65% 55%)",
];
const roomColor = (i: number) => ROOM_COLORS[i % ROOM_COLORS.length];


/** Resolve an opening's position on the plan: use AI coords, else interpolate along the polygon edge. */
const openingPoint = (room: PlanRoom, o: PlanOpening) => {
  if (typeof o.x === "number" && typeof o.y === "number") return { x: o.x, y: o.y };
  const poly = room.polygon;
  if (poly.length < 2) return centroid(poly);
  const i = Math.min(Math.max(0, Math.round(o.wall_index || 0)), poly.length - 1);
  const a = poly[i];
  const b = poly[(i + 1) % poly.length];
  const t = Math.min(1, Math.max(0, (o.position_pct ?? 50) / 100));
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
};

const countByType = (openings: PlanOpening[] = []) =>
  openings.reduce<Record<string, number>>((acc, o) => {
    acc[o.type] = (acc[o.type] || 0) + 1;
    return acc;
  }, {});

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

  const [restoring, setRestoring] = useState(true);

  const selectedRoom = useMemo(
    () => plan?.rooms.find((r) => r.id === selectedId) ?? null,
    [plan, selectedId],
  );

  const normalize = (raw: PlanResult): PlanResult => ({
    ...raw,
    rooms: (raw.rooms || []).map((r, i) => ({ ...r, name: `Room ${i + 1}` })),
  });

  const hashFile = async (file: File) => {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  // Restore the last analysed plan from the database so returning to this page
  // never re-runs the AI on a plan we already read.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("floor_plan_analyses")
          .select("image_url, plan")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const stored = data?.plan as unknown as PlanResult | undefined;
        if (!cancelled && stored?.rooms?.length && data?.image_url) {
          setImageUrl(data.image_url);
          setPlan(normalize(stored));
        }
      } catch (e) {
        console.warn("[plan-rooms] restore failed", e);
      } finally {
        if (!cancelled) setRestoring(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;
      setUploading(true);
      setPlan(null);
      setSelectedId(null);
      try {
        const hash = await hashFile(file);

        // Already analysed this exact plan? Reuse the stored result.
        const { data: cached } = await supabase
          .from("floor_plan_analyses")
          .select("image_url, plan")
          .eq("user_id", user.id)
          .eq("image_hash", hash)
          .maybeSingle();
        const cachedPlan = cached?.plan as unknown as PlanResult | undefined;
        if (cachedPlan?.rooms?.length && cached?.image_url) {
          setImageUrl(cached.image_url);
          setPlan(normalize(cachedPlan));
          setUploading(false);
          toast({
            title: "Loaded your saved plan",
            description: "We already measured this floor plan, so nothing was regenerated.",
          });
          return;
        }

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

        const normalized = normalize(data.plan as PlanResult);
        setPlan(normalized);

        // Persist so this plan is never generated from scratch again.
        const { error: saveErr } = await supabase.from("floor_plan_analyses").upsert(
          {
            user_id: user.id,
            image_hash: hash,
            image_url: urlData.publicUrl,
            storage_path: path,
            plan: normalized as any,
            metadata: { file_name: file.name, size: file.size } as any,
          },
          { onConflict: "user_id,image_hash" },
        );
        if (saveErr) console.warn("[plan-rooms] save failed", saveErr);

        toast({
          title: `${normalized.rooms.length} rooms detected`,
          description: "Sizes were scaled using a 1 m door reference — saved for next time.",
        });
      } catch (err: any) {
        toast({ title: "Analysis failed", description: getAiErrorMessage(err), variant: "destructive" });
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
      designId: (() => {
        try { return sessionStorage.getItem("floor_plan_design_id") || null; } catch { return null; }
      })(),
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
                  {plan.rooms.map((room, ri) => {
                    const isSelected = room.id === selectedId;
                    const dimmed = selectedId !== null && !isSelected;
                    const pts = room.polygon.map((p) => `${p.x},${p.y}`).join(" ");
                    const color = roomColor(ri);
                    return (
                      <g
                        key={room.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedId(isSelected ? null : room.id)}
                        opacity={dimmed ? 0.25 : 1}
                      >
                        <polygon
                          points={pts}
                          fill={color}
                          fillOpacity={isSelected ? 0.55 : 0.3}
                          stroke={color}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />


                        {/* Detected openings — doors, windows, balconies */}
                        {(selectedId === null || isSelected) &&
                          room.openings?.map((o, oi) => {
                            const p = openingPoint(room, o);
                            const color = OPENING_COLORS[o.type] ?? OPENING_COLORS.door;
                            return (
                              <g key={`${room.id}-op-${oi}`}>
                                <circle cx={p.x} cy={p.y} r={1.5} fill="hsl(var(--card))" stroke={color} strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
                                {o.type === "window" ? (
                                  <line
                                    x1={p.x - 1}
                                    y1={p.y}
                                    x2={p.x + 1}
                                    y2={p.y}
                                    stroke={color}
                                    strokeWidth={0.6}
                                    vectorEffect="non-scaling-stroke"
                                  />
                                ) : (
                                  <circle cx={p.x} cy={p.y} r={0.55} fill={color} />
                                )}
                              </g>
                            );
                          })}
                      </g>
                    );
                  })}
                </svg>
              </CardContent>
            </Card>

            {/* Room colour key — colours replace labels on the plan */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {plan.rooms.map((room, ri) => {
                const isSelected = room.id === selectedId;
                return (
                  <button
                    key={`key-${room.id}`}
                    type="button"
                    onClick={() => setSelectedId(isSelected ? null : room.id)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                      isSelected ? "border-primary bg-primary/10 font-medium" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{ backgroundColor: roomColor(ri) }}
                    />
                    {room.name}
                    <span className="text-muted-foreground">
                      {room.width_m.toFixed(1)}×{room.length_m.toFixed(1)} m
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              {(["door", "window", "balcony"] as const).map((t) => (
                <span key={t} className="flex items-center gap-1.5 capitalize">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: OPENING_COLORS[t] }}
                  />
                  {t}
                </span>
              ))}
              <span>Tap a room on the plan or a colour chip to isolate it</span>
            </div>


            {selectedRoom && (
              <Card>
                <CardContent className="p-4 flex flex-wrap items-center gap-3">
                  <span className="font-semibold">{selectedRoom.name} openings:</span>
                  {selectedRoom.openings?.length ? (
                    Object.entries(countByType(selectedRoom.openings)).map(([type, n]) => (
                      <Badge key={type} variant="outline" className="capitalize gap-1">
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: OPENING_COLORS[type as PlanOpening["type"]] }}
                        />
                        {n} {type}
                        {n > 1 ? "s" : ""}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">none detected</span>
                  )}
                  {selectedRoom.openings?.some((o) => o.width_m) && (
                    <span className="text-xs text-muted-foreground">
                      widths:{" "}
                      {selectedRoom.openings
                        .filter((o) => o.width_m)
                        .map((o) => `${o.type} ${o.width_m!.toFixed(2)} m`)
                        .join(" · ")}
                    </span>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Room list — single select */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {plan.rooms.map((room, ri) => {
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
                      <span className="font-semibold flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-sm"
                          style={{ backgroundColor: roomColor(ri) }}
                        />
                        {room.name}
                      </span>
                      {isSelected && <Badge>Selected</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {room.width_m.toFixed(2)} × {room.length_m.toFixed(2)} m · {room.area_sqm.toFixed(2)} m²
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {room.room_type.replace(/[-_]/g, " ")}
                      {room.openings?.length
                        ? ` · ${Object.entries(countByType(room.openings))
                            .map(([t, n]) => `${n} ${t}${n > 1 ? "s" : ""}`)
                            .join(", ")}`
                        : ""}
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
