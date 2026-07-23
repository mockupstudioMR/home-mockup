import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Section from "@/components/journey/Section";
import JourneyNav from "@/components/journey/JourneyNav";
import HeroReveal from "@/components/journey/screens/HeroReveal";
import StyleDNA from "@/components/journey/screens/StyleDNA";
import DesignEvolution from "@/components/journey/screens/DesignEvolution";
import WhyWeChangedIt from "@/components/journey/screens/WhyWeChangedIt";
import HealthScore from "@/components/journey/screens/HealthScore";
import Shopping, { JourneyProduct } from "@/components/journey/screens/Shopping";
import Budget from "@/components/journey/screens/Budget";
import Roadmap from "@/components/journey/screens/Roadmap";
import BeforeAfter from "@/components/journey/screens/BeforeAfter";
import ShareNextSteps from "@/components/journey/screens/ShareNextSteps";
import { useJourneyData } from "@/components/journey/hooks/useJourneyData";
import { toast } from "@/hooks/use-toast";
import { saveDesignJourneyMetadata } from "@/lib/journeyPersistence";

const TOTAL = 10;

const DesignJourney = () => {
  const { designId } = useParams();
  const navigate = useNavigate();
  const { loading, error, design, history } = useJourneyData(designId);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setStep((s) => Math.min(TOTAL - 1, s + 1));
      else if (e.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
      else if (e.key === "Escape") navigate(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Persist the journey snapshot for this design so it can be recalled instead of recomputed.
  useEffect(() => {
    if (!designId || !design) return;
    void saveDesignJourneyMetadata({
      designId,
      healthScore: 92,
      styleDna: { style: "Modern Minimal" },
      budget: { total: 5800, currency: "EUR" },
      roadmap: {
        weeks: [
          { week: "Week 1", title: "Prep the shell" },
          { week: "Week 2", title: "Light the room" },
          { week: "Week 3", title: "Bring in the anchors" },
          { week: "Week 4", title: "Style the details" },
        ],
      },
      shopping: { productCount: 9 },
    });
  }, [designId, design]);

  const before = design?.sourceImageUrl || design?.imageUrl || "";
  const after = design?.imageUrl || "";

  const hotspots = useMemo(() => {
    const items = Array.isArray(design?.extractedItems) ? (design!.extractedItems as any[]) : [];
    const defaults = [
      { x: 30, y: 55, title: "Grounded proportion", description: "A larger rug anchors the seating and unifies the space." },
      { x: 55, y: 40, title: "Better flow", description: "The sofa was repositioned to open sightlines through the room." },
      { x: 75, y: 30, title: "Layered lighting", description: "Warm ambient light adds depth and softens hard edges." },
      { x: 45, y: 20, title: "Focal moment", description: "Artwork creates a natural centerpiece for the wall." },
    ];
    return items.length > 0
      ? items.slice(0, 4).map((it: any, i: number) => ({
          x: typeof it.x === "number" ? it.x : defaults[i].x,
          y: typeof it.y === "number" ? it.y : defaults[i].y,
          title: it.label || it.name || defaults[i].title,
          description: it.reason || it.description || defaults[i].description,
        }))
      : defaults;
  }, [design]);

  const products: JourneyProduct[] = [
    { id: "1", name: "Bouclé Lounge Chair", price: 890, reason: "Adds soft texture and a warm silhouette.", match: 96, store: "Studio Verta", tier: "recommended" },
    { id: "2", name: "Linen Sectional Sofa", price: 2400, reason: "Grounds the space with generous proportions.", match: 94, store: "Northline", tier: "recommended" },
    { id: "3", name: "Handwoven Wool Rug", price: 620, reason: "Anchors the seating and softens acoustics.", match: 92, store: "Fjord Home", tier: "essential" },
    { id: "4", name: "Sculptural Floor Lamp", price: 480, reason: "Layered lighting for calmer evenings.", match: 90, store: "Lumen", tier: "recommended" },
    { id: "5", name: "Oak Coffee Table", price: 720, reason: "Warm wood balances the neutral palette.", match: 88, store: "Studio Verta", tier: "essential" },
    { id: "6", name: "Ceramic Vase Set", price: 145, reason: "Small moments of craft, quietly displayed.", match: 85, store: "Kiln", tier: "budget" },
    { id: "7", name: "Alpaca Throw", price: 320, reason: "Tactile invitation to slow down.", match: 87, store: "Northline", tier: "premium" },
    { id: "8", name: "Marble Side Table", price: 890, reason: "A refined accent, veined and cool.", match: 89, store: "Atelier Ma", tier: "premium" },
    { id: "9", name: "Framed Print", price: 180, reason: "A focal point above the sofa.", match: 84, store: "Print Society", tier: "budget" },
  ];

  const evolutionVersions = history.length >= 2
    ? history
    : [
        ...(before ? [{ id: "orig", label: "Original", image: before }] : []),
        { id: "final", label: "Final Design", image: after },
      ];

  const beforeAfterVersions = evolutionVersions
    .filter((v) => v.id !== "original" && v.id !== "orig")
    .map((v) => ({ key: v.id, label: v.label, image: v.image }));

  const screens = [
    <HeroReveal before={before} after={after} onContinue={() => setStep(1)} />,
    <StyleDNA />,
    <DesignEvolution versions={evolutionVersions.map((v) => ({ label: v.label, image: v.image }))} />,
    <WhyWeChangedIt image={after} hotspots={hotspots} />,
    <HealthScore
      overall={92}
      categories={[
        { name: "Style", score: 94 },
        { name: "Comfort", score: 88 },
        { name: "Lighting", score: 91 },
        { name: "Flow", score: 90 },
        { name: "Storage", score: 82 },
        { name: "Luxury", score: 86 },
        { name: "Personality", score: 95 },
      ]}
    />,
    <Shopping products={products} />,
    <Budget />,
    <Roadmap
      steps={[
        { week: "Week 1", title: "Prep the shell", tasks: ["Paint walls in warm neutral", "Deep clean floors", "Declutter surfaces"] },
        { week: "Week 2", title: "Light the room", tasks: ["Install floor lamp", "Add dimmable bulbs", "Layer ambient lighting"] },
        { week: "Week 3", title: "Bring in the anchors", tasks: ["Deliver sofa & coffee table", "Place the rug", "Position seating"] },
        { week: "Week 4", title: "Style the details", tasks: ["Hang artwork", "Style shelves", "Add textiles & greenery"] },
      ]}
    />,
    <BeforeAfter before={before} versions={beforeAfterVersions.length ? beforeAfterVersions : [{ key: "final", label: "AI Design", image: after }]} />,
    <ShareNextSteps score={92} style="Modern Minimal" budget={5800} productCount={products.length} />,
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Preparing your journey…</div>
      </div>
    );
  }
  if (error || !design) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">We couldn't load this design.</p>
          <button className="text-primary underline" onClick={() => navigate("/gallery")}>Back to gallery</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 pointer-events-none opacity-60 -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <JourneyNav
        current={step}
        total={TOTAL}
        onPrev={() => setStep((s) => Math.max(0, s - 1))}
        onNext={() => setStep((s) => Math.min(TOTAL - 1, s + 1))}
        onExit={() => navigate(-1)}
        onSave={() => toast({ title: "Saved to My HomeMockUps" })}
      />

      <AnimatePresence mode="wait">
        <Section key={step}>{screens[step]}</Section>
      </AnimatePresence>
    </div>
  );
};

export default DesignJourney;