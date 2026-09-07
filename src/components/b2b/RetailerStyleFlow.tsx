import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, ArrowRight, Upload, Link2, X, Loader2, Sparkles, Layers, Palette, Globe,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { optimizeImageSourceToDataUrl } from "@/lib/imageOptimization";
import { getAiErrorMessage } from "@/lib/aiErrorMessage";
import { trackEvent } from "@/lib/analytics";

export interface RetailerProduct {
  imageIndex: number;
  name: string;
  category: string;
  styleTags: string[];
  colors: string[];
  materials?: string[];
  description?: string;
}

export interface RetailerAnalysis {
  overall: {
    styleName: string;
    confidence?: number;
    description?: string;
    keywords?: string[];
    palette?: string[];
    coherence?: number;
    coherenceNote?: string;
  };
  products: RetailerProduct[];
}

export interface RetailerBrand {
  url: string;
  brandName: string;
  styleName: string;
  description?: string;
  keywords?: string[];
  palette?: string[];
  materials?: string[];
  tone?: string;
  audience?: string;
  fonts?: string[];
  logo?: string | null;
  screenshot?: string | null;
  title?: string | null;
}

export interface RetailerScene {
  room: string;
  style?: string;
  isCombination: boolean;
  productNames: string[];
  productIndices?: number[];
  imageUrl: string | null;
  error?: string;
}

const RANGE_OPTIONS = [
  { id: "specialist", label: "Specialist", description: "One focused category (e.g. only sofas or only lighting)" },
  { id: "multi-category", label: "Multi-category", description: "Several categories across a few rooms" },
  { id: "full-home", label: "Full home", description: "Everything for the whole home" },
];

const TYPE_OPTIONS = [
  "Sofas", "Armchairs & Chairs", "Tables", "Beds", "Storage & Shelving",
  "Lighting", "Rugs & Textiles", "Mirrors & Decor", "Outdoor",
];

const CHANNEL_OPTIONS = [
  { id: "online", label: "Online only", description: "Webshop or marketplaces" },
  { id: "offline", label: "In store only", description: "Physical showroom" },
  { id: "both", label: "Both", description: "Showroom and webshop" },
];

const MAX_ITEMS = 5;

const prettyCategory = (c: string) =>
  c.replace(/[-_]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

const Swatches = ({ colors, size = 28 }: { colors: string[]; size?: number }) => (
  <div className="flex flex-wrap gap-1.5">
    {colors.filter(Boolean).slice(0, 6).map((c, i) => (
      <span
        key={`${c}-${i}`}
        title={c}
        className="rounded-full border-2 border-background shadow-sm"
        style={{ backgroundColor: c, width: size, height: size }}
      />
    ))}
  </div>
);

interface Props {
  onBack: () => void;
}

const RetailerStyleFlow = ({ onBack }: Props) => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState<"range" | "types" | "channel" | "upload" | "result">("range");
  const [productRange, setProductRange] = useState<string>("");
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [salesChannel, setSalesChannel] = useState<string>("");

  const [images, setImages] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<RetailerAnalysis | null>(null);
  const [scenes, setScenes] = useState<RetailerScene[]>([]);
  const [isRendering, setIsRendering] = useState(false);

  const [siteInput, setSiteInput] = useState("");
  const [brand, setBrand] = useState<RetailerBrand | null>(null);
  const [isReadingSite, setIsReadingSite] = useState(false);

  const readWebsite = async () => {
    const raw = siteInput.trim();
    if (!raw) return;
    setIsReadingSite(true);
    try {
      trackEvent("ai_call", "retailer-style", { fn: "analyze-brand-website" });
      const { data, error } = await supabase.functions.invoke("analyze-brand-website", {
        body: { url: raw },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.brand) throw new Error("Nothing could be read from that website");
      setBrand(data.brand as RetailerBrand);
      toast({ title: "Brand style captured", description: (data.brand as RetailerBrand).styleName });

    } catch (err) {
      console.error("Brand website error", err);
      toast({ title: "Couldn't read that website", description: getAiErrorMessage(err), variant: "destructive" });
    } finally {
      setIsReadingSite(false);
    }
  };

  const generateScenes = async () => {
    if (!analysis?.products?.length) return;
    setIsRendering(true);
    try {
      trackEvent("ai_call", "retailer-style", { fn: "generate-retailer-scenes" });
      const { data, error } = await supabase.functions.invoke("generate-retailer-scenes", {
        body: {
          images,
          products: analysis.products,
          overallStyle: analysis.overall?.styleName,
          palette: analysis.overall?.palette || [],
          brand,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const next = (data?.scenes || []) as RetailerScene[];
      if (!next.some((s) => s.imageUrl)) throw new Error("No scenes could be created");
      setScenes(next);
    } catch (err) {
      console.error("Retailer scene error", err);
      toast({ title: "Couldn't create the scenes", description: getAiErrorMessage(err), variant: "destructive" });
    } finally {
      setIsRendering(false);
    }
  };


  const toggleType = (t: string) =>
    setProductTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const next = await Promise.all(
      Array.from(files)
        .filter((f) => f.type.startsWith("image/"))
        .map((f) => optimizeImageSourceToDataUrl(f, { maxDimension: 1024 })),
    );
    setImages((prev) => [...prev, ...next].slice(0, MAX_ITEMS));
    e.target.value = "";
  };

  const addLink = async () => {
    const url = linkInput.trim();
    if (!url) return;
    try { new URL(url); } catch {
      toast({ title: "Invalid link", description: "Please paste a full product page address", variant: "destructive" });
      return;
    }
    if (images.length >= MAX_ITEMS) return;
    setIsScraping(true);
    setLinkInput("");
    try {
      const { data, error } = await supabase.functions.invoke("scrape-product-image", { body: { url } });
      if (error || !data?.success || !data?.imageUrl) {
        throw new Error(data?.error || error?.message || "Could not read that page");
      }
      setImages((prev) => [...prev, data.imageUrl as string].slice(0, MAX_ITEMS));
      setLinks((prev) => [...prev, url]);
      toast({ title: "Product added", description: data.title || url });
    } catch (err: any) {
      toast({
        title: "Couldn't read that link",
        description: err?.message || "Upload the product photo instead",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
  };

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const runAnalysis = async () => {
    if (images.length === 0) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    setScenes([]);
    setStep("result");
    try {
      trackEvent("ai_call", "retailer-style", { fn: "analyze-retailer-products" });
      const { data, error } = await supabase.functions.invoke("analyze-retailer-products", {
        body: { images, productRange, productTypes, salesChannel },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const result = data as RetailerAnalysis;
      setAnalysis(result);

      if (user) {
        await supabase.from("retailer_style_profiles").insert({
          user_id: user.id,
          product_range: productRange || null,
          product_types: productTypes,
          sales_channel: salesChannel || null,
          product_links: links,
          product_images: images,
          analysis: { ...result, brand } as any,
        } as any);
      }
    } catch (err) {
      console.error("Retailer analysis error", err);
      toast({ title: "Analysis failed", description: getAiErrorMessage(err), variant: "destructive" });
      setStep("upload");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const grouped = useMemo(() => {
    if (!analysis?.products) return [] as { category: string; items: RetailerProduct[] }[];
    const map = new Map<string, RetailerProduct[]>();
    for (const p of analysis.products) {
      const key = (p.category || "other").toLowerCase();
      map.set(key, [...(map.get(key) || []), p]);
    }
    return Array.from(map.entries())
      .map(([category, items]) => ({ category, items }))
      .filter((g) => g.items.length > 1);
  }, [analysis]);

  const isFullHome = productRange === "Full home";

  const stepBack = () => {
    if (step === "range") onBack();
    else if (step === "types") setStep("range");
    else if (step === "channel") setStep(isFullHome ? "range" : "types");
    else if (step === "upload") setStep("channel");
    else setStep("upload");

  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={stepBack}
        className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {step === "range" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-center">How wide is your product range?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {RANGE_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setProductRange(o.label);
                  setStep(o.id === "full-home" ? "channel" : "types");
                }}
                className={`rounded-2xl border p-5 text-left transition-all hover:shadow-lg hover:border-primary/40 ${
                  productRange === o.label ? "border-primary bg-primary/5" : "border-border/50 bg-card"
                }`}
              >
                <h3 className="font-semibold mb-1">{o.label}</h3>
                <p className="text-sm text-muted-foreground">{o.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "types" && (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold tracking-tight text-center">Which product types do you sell?</h2>
          <div className="flex flex-wrap gap-2 justify-center">
            {TYPE_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                  productTypes.includes(t)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 bg-card text-muted-foreground hover:border-primary/40"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <Button onClick={() => setStep("channel")} disabled={productTypes.length === 0}>
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {step === "channel" && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-center">Where do you sell?</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {CHANNEL_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => { setSalesChannel(o.label); setStep("upload"); }}
                className={`rounded-2xl border p-5 text-left transition-all hover:shadow-lg hover:border-primary/40 ${
                  salesChannel === o.label ? "border-primary bg-primary/5" : "border-border/50 bg-card"
                }`}
              >
                <h3 className="font-semibold mb-1">{o.label}</h3>
                <p className="text-sm text-muted-foreground">{o.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "upload" && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Add up to 5 product photos</h2>
            <p className="text-muted-foreground">
              Mix it up — stand-alone product shots, styled room scenes, and close-ups all help us read your style.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div className="rounded-xl border border-border/50 bg-card p-3">
              <p className="font-semibold text-foreground mb-0.5">Stand-alone</p>
              Clean product on a plain background
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-3">
              <p className="font-semibold text-foreground mb-0.5">Styled scene</p>
              The product placed in a full room shot
            </div>
            <div className="rounded-xl border border-border/50 bg-card p-3">
              <p className="font-semibold text-foreground mb-0.5">Close-up</p>
              Detail of material, texture or finish
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-dashed">
              <CardContent className="p-6">
                <label className="flex flex-col items-center justify-center gap-3 cursor-pointer py-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="font-medium">Upload photos</span>
                  <span className="text-sm text-muted-foreground">Pick several at once — JPG or PNG</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={images.length >= MAX_ITEMS} />
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Link2 className="w-4 h-4 text-primary" /> Paste a product link
                </div>
                <div className="flex gap-2">
                  <Input
                    value={linkInput}
                    placeholder="https://…"
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void addLink(); } }}
                    disabled={isScraping || images.length >= MAX_ITEMS}
                  />
                  <Button onClick={addLink} disabled={isScraping || !linkInput.trim() || images.length >= MAX_ITEMS}>
                    {isScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {images.length}/{MAX_ITEMS} photos added
                </p>
              </CardContent>
            </Card>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {images.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-secondary">
                  <img src={src} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-background/90 flex items-center justify-center shadow"
                    aria-label="Remove product"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center">
            <Button size="lg" onClick={runAnalysis} disabled={images.length === 0 || isAnalyzing}>
              <Sparkles className="w-4 h-4 mr-2" /> Analyze my assortment
            </Button>
          </div>
        </div>
      )}


      {step === "result" && (
        <div className="space-y-8">
          {isAnalyzing || !analysis ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" /> Reading your products…
              </div>
              <Skeleton className="h-40 w-full rounded-2xl" />
              <div className="grid md:grid-cols-3 gap-4">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
              </div>
            </div>
          ) : (
            <>
              {/* Overall matching style */}
              <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-card to-accent/5 overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your assortment style</p>
                      <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{analysis.overall?.styleName}</h2>
                    </div>
                  </div>
                  {analysis.overall?.description && (
                    <p className="text-muted-foreground leading-relaxed">{analysis.overall.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {(analysis.overall?.keywords || []).map((k) => (
                      <Badge key={k} variant="secondary">{k}</Badge>
                    ))}
                  </div>
                  {analysis.overall?.palette?.length ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Palette className="w-4 h-4 text-primary" /> Matching colour palette
                      </p>
                      <Swatches colors={analysis.overall.palette} size={40} />
                    </div>
                  ) : null}
                  {typeof analysis.overall?.coherence === "number" && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Style consistency</span>
                        <span className="font-medium">{Math.round(analysis.overall.coherence * 100)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-700"
                          style={{ width: `${Math.round((analysis.overall.coherence || 0) * 100)}%` }}
                        />
                      </div>
                      {analysis.overall.coherenceNote && (
                        <p className="text-xs text-muted-foreground">{analysis.overall.coherenceNote}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Per product */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold tracking-tight">Each product in detail</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {analysis.products?.map((p, i) => (
                    <Card key={i} className="overflow-hidden">
                      <div className="aspect-square bg-secondary">
                        {images[p.imageIndex ?? i] && (
                          <img
                            src={images[p.imageIndex ?? i]}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h4 className="font-semibold leading-tight">{p.name}</h4>
                          <p className="text-xs text-muted-foreground">{prettyCategory(p.category || "")}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(p.styleTags || []).map((t) => (
                            <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                        <Swatches colors={p.colors || []} size={22} />
                        {p.materials?.length ? (
                          <p className="text-xs text-muted-foreground">{p.materials.join(" · ")}</p>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Scene collage */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight">Your products in real rooms</h3>
                    <p className="text-sm text-muted-foreground">
                      {brand
                        ? `Interior scenes built around your exact products, styled to match ${brand.brandName}.`
                        : "Interior scenes built around your exact products, in different styles."}
                    </p>
                  </div>
                  {scenes.length === 0 && (
                    <Button onClick={generateScenes} disabled={isRendering}>
                      {isRendering ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Styling rooms…</>
                      ) : (
                        <><Sparkles className="w-4 h-4 mr-2" /> Create scene collage</>
                      )}
                    </Button>
                  )}
                </div>

                {isRendering && scenes.length === 0 ? (
                  <div className="grid md:grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />)}
                  </div>
                ) : scenes.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-3 md:auto-rows-fr">
                    {scenes.filter((s) => s.imageUrl).map((s, i) => (
                      <div
                        key={i}
                        className={`relative rounded-2xl overflow-hidden border ${
                          s.isCombination
                            ? "md:col-span-2 border-primary ring-2 ring-primary/30 shadow-lg"
                            : "border-border/50"
                        }`}
                      >
                        <img
                          src={s.imageUrl as string}
                          alt={`${s.room} with ${s.productNames.join(", ")}`}
                          className={`w-full object-cover ${s.isCombination ? "aspect-[16/9]" : "aspect-[4/3]"}`}
                          loading="lazy"
                        />
                        {s.isCombination && (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider shadow-md">
                            <Layers className="w-3 h-3" /> Works as a set
                          </span>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background via-background/80 to-transparent">
                          <p className="text-sm font-medium capitalize">{s.room}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {s.productNames.join(" + ")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {analysis.products?.map((p, i) => {
                      const src = images[p.imageIndex ?? i];
                      return (
                        <div
                          key={i}
                          className="relative rounded-2xl overflow-hidden border border-border/50 bg-secondary"
                        >
                          <div className="aspect-square">
                            {src && <img src={src} alt={p.name} className="w-full h-full object-cover" />}
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-background/95 to-transparent">
                            <p className="text-xs font-medium truncate">{p.name}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Brand website — after the scene collage, restyles the created scenes */}
              {scenes.length > 0 && (
                <Card className="border-border/50 bg-gradient-to-br from-accent/5 via-card to-primary/5">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Globe className="w-4 h-4 text-primary" /> Have a website?
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Paste your shop address and we read your brand look — colours, materials and mood — then
                        restyle these rooms around it, keeping your exact products.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={siteInput}
                        placeholder="yourshop.com"
                        onChange={(e) => setSiteInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void readWebsite(); } }}
                        disabled={isReadingSite}
                      />
                      <Button variant="secondary" onClick={readWebsite} disabled={isReadingSite || !siteInput.trim()}>
                        {isReadingSite ? <Loader2 className="w-4 h-4 animate-spin" /> : "Read my brand"}
                      </Button>
                    </div>

                    {isReadingSite && <Skeleton className="h-24 w-full rounded-xl" />}

                    {brand && !isReadingSite && (
                      <div className="rounded-2xl border border-primary/30 bg-background/70 p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          {brand.logo ? (
                            <img src={brand.logo} alt={`${brand.brandName} logo`} className="w-10 h-10 rounded-lg object-contain bg-card" />
                          ) : null}
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Your brand look</p>
                            <p className="font-semibold leading-tight">{brand.brandName} · {brand.styleName}</p>
                          </div>
                        </div>
                        {brand.description && <p className="text-sm text-muted-foreground">{brand.description}</p>}
                        <div className="flex flex-wrap gap-1.5">
                          {(brand.keywords || []).map((k) => (
                            <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>
                          ))}
                        </div>
                        {brand.palette?.length ? <Swatches colors={brand.palette} size={26} /> : null}
                        {brand.materials?.length ? (
                          <p className="text-xs text-muted-foreground">{brand.materials.join(" · ")}</p>
                        ) : null}
                        <Button onClick={generateScenes} disabled={isRendering}>
                          {isRendering ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Restyling rooms…</>
                          ) : (
                            <><Sparkles className="w-4 h-4 mr-2" /> Restyle rooms to my brand</>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}


              {/* Combined categories */}
              {grouped.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-semibold tracking-tight">Products that belong together</h3>
                  </div>
                  {grouped.map((g) => (
                    <Card key={g.category}>
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{prettyCategory(g.category)}</h4>
                          <Badge variant="secondary">{g.items.length} products</Badge>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-1">
                          {g.items.map((p, i) => (
                            <div key={i} className="w-32 shrink-0">
                              <div className="aspect-square rounded-xl overflow-hidden border border-border/50 bg-secondary">
                                {images[p.imageIndex ?? i] && (
                                  <img src={images[p.imageIndex ?? i]} alt={p.name} className="w-full h-full object-cover" />
                                )}
                              </div>
                              <p className="text-xs mt-1.5 truncate">{p.name}</p>
                            </div>
                          ))}
                        </div>
                        <Swatches colors={g.items.flatMap((p) => p.colors || [])} size={20} />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => setStep("upload")}>Change products</Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default RetailerStyleFlow;
