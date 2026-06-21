import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import modernMinimalImg from "@/assets/styles/modern-minimal.png";
import bohemianEclecticImg from "@/assets/styles/bohemian-eclectic.png";
import classicHistoricalImg from "@/assets/styles/classic-historical.png";
import glamLuxeImg from "@/assets/styles/glam-luxe.png";
import mediterraneanImg from "@/assets/styles/mediterranean.png";
import rusticNatureImg from "@/assets/styles/rustic-nature.png";

const STYLES = [
  { value: "modern_minimal", label: "Modern Minimal", img: modernMinimalImg },
  { value: "classic_historical", label: "Classic Historical", img: classicHistoricalImg },
  { value: "rustic_nature", label: "Rustic Nature", img: rusticNatureImg },
  { value: "mediterranean", label: "Mediterranean", img: mediterraneanImg },
  { value: "bohemian_eclectic", label: "Bohemian Eclectic", img: bohemianEclecticImg },
  { value: "glam_luxe", label: "Glam Luxe", img: glamLuxeImg },
];

const PALETTES = [
  { value: "neutral", label: "Neutral & Earthy", colors: ["#D4C4B0", "#8B7355", "#E8E0D5", "#6B5B4F"] },
  { value: "cool", label: "Cool & Serene", colors: ["#A8C5DA", "#6B8E9B", "#D1E3E8", "#4A7C8C"] },
  { value: "warm", label: "Warm & Cozy", colors: ["#D4A574", "#C67B54", "#E8D5C4", "#A0522D"] },
  { value: "bold", label: "Bold & Vibrant", colors: ["#1E3A5F", "#8B2942", "#2D4A3E", "#D4AF37"] },
  { value: "monochrome", label: "Monochrome", colors: ["#2C2C2C", "#6B6B6B", "#A8A8A8", "#E5E5E5"] },
];

const WhatsAppPicker = () => {
  const { sessionId, visualKind } = useParams<{ sessionId: string; visualKind: string }>();
  const [params] = useSearchParams();
  const token = params.get("t") ?? "";
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [styleRefUrl, setStyleRefUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  const submit = async (value: unknown) => {
    if (!sessionId || !visualKind || !token) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-quiz-step", {
        body: { sessionId, visualKind, token, value },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setDone(true);
    } catch (e) {
      toast({ title: "Couldn't save", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const [imageUrl, setImageUrl] = useState("");
  const uploadAndSubmit = async (file: File) => {
    setSubmitting(true);
    try {
      const path = `wa/${sessionId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("room-photos").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("room-photos").getPublicUrl(path);
      await submit(data.publicUrl);
    } catch (e) {
      toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" });
      setSubmitting(false);
    }
  };

  const uploadStyleRef = async (file: File) => {
    setSubmitting(true);
    try {
      const path = `wa/${sessionId}/style-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("room-photos").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("room-photos").getPublicUrl(path);
      setStyleRefUrl(data.publicUrl);
      toast({ title: "Reference image added" });
    } catch (e) {
      toast({ title: "Upload failed", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const submitStyle = () => {
    if (!selectedStyle && !styleRefUrl) {
      toast({ title: "Pick a style or upload an image", variant: "destructive" });
      return;
    }
    submit({ style: selectedStyle ?? undefined, referenceImageUrl: styleRefUrl ?? undefined });
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-secondary/20 to-primary/10">
        <Card className="max-w-md w-full"><CardContent className="p-8 text-center space-y-3">
          <div className="text-4xl">💬</div>
          <h1 className="text-xl font-bold">Got it!</h1>
          <p className="text-muted-foreground">Check WhatsApp for the next question.</p>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="text-center pt-4">
          <h1 className="text-2xl font-bold">
            {visualKind === "style" && "Pick your design style"}
            {visualKind === "color" && "Pick your color palette"}
            {visualKind === "image" && "Inspiration image (optional)"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">We'll send the next question to WhatsApp.</p>
        </div>

        {visualKind === "style" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {STYLES.map((s) => {
                const isSel = selectedStyle === s.value;
                return (
                  <button
                    key={s.value}
                    disabled={submitting}
                    onClick={() => setSelectedStyle(isSel ? null : s.value)}
                    className={`group rounded-xl overflow-hidden border-2 transition disabled:opacity-50 ${isSel ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary"}`}
                  >
                    <img src={s.img} alt={s.label} className="w-full aspect-square object-cover" />
                    <div className="p-2 text-sm font-medium text-center">{s.label}</div>
                  </button>
                );
              })}
            </div>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="text-sm font-medium">Add a reference image (optional)</div>
                <p className="text-xs text-muted-foreground">Upload a photo or moodboard that inspires you — we'll blend it with your style pick.</p>
                <Input type="file" accept="image/*" disabled={submitting} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadStyleRef(f); }} />
                {styleRefUrl && (
                  <div className="flex items-center gap-3">
                    <img src={styleRefUrl} alt="reference" className="w-16 h-16 object-cover rounded-lg border" />
                    <button className="text-xs text-muted-foreground underline" onClick={() => setStyleRefUrl(null)}>Remove</button>
                  </div>
                )}
              </CardContent>
            </Card>
            <Button className="w-full" size="lg" disabled={submitting || (!selectedStyle && !styleRefUrl)} onClick={submitStyle}>
              Continue
            </Button>
          </div>
        )}

        {visualKind === "color" && (
          <div className="grid gap-3">
            {PALETTES.map((p) => (
              <button key={p.value} disabled={submitting} onClick={() => submit(p.value)} className="rounded-xl border-2 border-border hover:border-primary p-4 flex items-center gap-4 bg-card text-left disabled:opacity-50">
                <div className="flex gap-1">
                  {p.colors.map((c, i) => <div key={i} className="w-8 h-8 rounded-lg" style={{ backgroundColor: c }} />)}
                </div>
                <span className="font-semibold">{p.label}</span>
              </button>
            ))}
          </div>
        )}

        {visualKind === "image" && (
          <Card><CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Paste an image URL</label>
              <div className="flex gap-2">
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                <Button disabled={submitting || !imageUrl} onClick={() => submit(imageUrl)}>Use</Button>
              </div>
            </div>
            <div className="text-center text-xs text-muted-foreground">or</div>
            <div>
              <label className="text-sm font-medium block mb-2">Upload from your phone</label>
              <Input type="file" accept="image/*" disabled={submitting} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAndSubmit(f); }} />
            </div>
            <Button variant="outline" disabled={submitting} onClick={() => submit(null)} className="w-full">Skip</Button>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
};

export default WhatsAppPicker;