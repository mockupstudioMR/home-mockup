import { useMemo, useState } from "react";
import { ArrowRight, ArrowLeft, Sparkles, Home, Building2, Building, Hotel, KeyRound, Hammer, Wand2, PackageOpen, Sofa, Bed, UtensilsCrossed, Monitor, Bath, LayoutGrid, Utensils, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GroundData {
  useCase: string;
  propertyType: string;
  rooms: string[];
  houseState: string;
  startRoom: string;
}

interface Props {
  onBack: () => void;
  onComplete: (data: GroundData) => void;
}

const USE_CASES = [
  { id: "moving-in", label: "Just moved in", icon: <KeyRound className="w-5 h-5" /> },
  { id: "renovating", label: "Renovating", icon: <Hammer className="w-5 h-5" /> },
  { id: "new-build", label: "New build", icon: <Building className="w-5 h-5" /> },
  { id: "refresh", label: "Full refresh", icon: <Wand2 className="w-5 h-5" /> },
];

const PROPERTY_TYPES = [
  { id: "apartment", label: "Apartment", icon: <Building2 className="w-5 h-5" /> },
  { id: "house", label: "House", icon: <Home className="w-5 h-5" /> },
  { id: "studio", label: "Studio", icon: <Hotel className="w-5 h-5" /> },
  { id: "loft", label: "Loft", icon: <LayoutGrid className="w-5 h-5" /> },
];

const ROOMS = [
  { id: "living-room", label: "Living Room", icon: <Sofa className="w-5 h-5" /> },
  { id: "bedroom", label: "Bedroom", icon: <Bed className="w-5 h-5" /> },
  { id: "kitchen", label: "Kitchen", icon: <UtensilsCrossed className="w-5 h-5" /> },
  { id: "dining-living", label: "Dining + Living", icon: <Utensils className="w-5 h-5" /> },
  { id: "office", label: "Home Office", icon: <Monitor className="w-5 h-5" /> },
  { id: "bathroom", label: "Bathroom", icon: <Bath className="w-5 h-5" /> },
  { id: "open-space-kitchen-dining-living", label: "Open Space", icon: <LayoutGrid className="w-5 h-5" /> },
  { id: "studio-apartment", label: "Studio Layout", icon: <Home className="w-5 h-5" /> },
];

const HOUSE_STATES = [
  { id: "empty", label: "Empty", description: "Blank canvas, nothing in yet", icon: <PackageOpen className="w-5 h-5" /> },
  { id: "partial", label: "Partially furnished", description: "A few pieces, need the rest", icon: <Sofa className="w-5 h-5" /> },
  { id: "redoing", label: "Redoing it all", description: "Furnished but starting over", icon: <Wand2 className="w-5 h-5" /> },
];

const ROOM_CAPTIONS: Record<string, string> = {
  "living-room": "Most people start here — it sets the tone for the whole home.",
  "bedroom": "A quick win. Small space, big daily impact.",
  "kitchen": "High-impact, but plan it carefully — lots of moving parts.",
  "dining-living": "Great for entertaining-first homes.",
  "office": "Easy to nail and you'll feel it every workday.",
  "bathroom": "Compact, satisfying, often the fastest transformation.",
  "open-space-kitchen-dining-living": "Anchor of the home — designing it unlocks adjacent spaces.",
  "studio-apartment": "One room, one cohesive vibe — perfect first project.",
};

type Step = "use-case" | "property" | "rooms" | "state" | "start-room";

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all text-left",
      active
        ? "border-primary bg-primary/10 text-foreground shadow-sm"
        : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
    )}
  >
    {children}
    {active && <Check className="w-4 h-4 ml-auto text-primary" />}
  </button>
);

const GroundYourSpace = ({ onBack, onComplete }: Props) => {
  const [step, setStep] = useState<Step>("use-case");
  const [data, setData] = useState<GroundData>({
    useCase: "",
    propertyType: "",
    rooms: [],
    houseState: "",
    startRoom: "",
  });

  const steps: Step[] = ["use-case", "property", "rooms", "state", "start-room"];
  const stepIndex = steps.indexOf(step);

  const goPrev = () => {
    if (stepIndex === 0) onBack();
    else setStep(steps[stepIndex - 1]);
  };

  const goNext = () => {
    if (step === "start-room") {
      onComplete(data);
      return;
    }
    setStep(steps[stepIndex + 1]);
  };

  const canContinue = useMemo(() => {
    switch (step) {
      case "use-case": return !!data.useCase;
      case "property": return !!data.propertyType;
      case "rooms": return data.rooms.length > 0;
      case "state": return !!data.houseState;
      case "start-room": return !!data.startRoom;
    }
  }, [step, data]);

  const toggleRoom = (id: string) => {
    setData((d) => ({
      ...d,
      rooms: d.rooms.includes(id) ? d.rooms.filter((r) => r !== id) : [...d.rooms, id],
    }));
  };

  const selectedRoomMeta = ROOMS.filter((r) => data.rooms.includes(r.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={goPrev}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-1.5">
          {steps.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i <= stepIndex ? "bg-primary w-6" : "bg-border w-3"
              )}
            />
          ))}
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-primary font-medium inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Ground your space
        </p>
        {step === "use-case" && (
          <>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">What's the occasion?</h2>
            <p className="text-muted-foreground">A quick tap so we tailor everything to you</p>
          </>
        )}
        {step === "property" && (
          <>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">What kind of place?</h2>
            <p className="text-muted-foreground">Pick the closest match</p>
          </>
        )}
        {step === "rooms" && (
          <>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Which rooms are on your list?</h2>
            <p className="text-muted-foreground">Tap all that apply — you can change this later</p>
          </>
        )}
        {step === "state" && (
          <>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">What's the state of the place?</h2>
            <p className="text-muted-foreground">So we know where to begin</p>
          </>
        )}
        {step === "start-room" && (
          <>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Where do you want to start?</h2>
            <p className="text-muted-foreground">Pick one room to focus on first</p>
          </>
        )}
      </div>

      {step === "use-case" && (
        <div className="grid grid-cols-2 gap-3">
          {USE_CASES.map((u) => (
            <Chip key={u.id} active={data.useCase === u.id} onClick={() => { setData((d) => ({ ...d, useCase: u.id })); setTimeout(goNext, 150); }}>
              <span className="text-primary">{u.icon}</span>
              <span>{u.label}</span>
            </Chip>
          ))}
        </div>
      )}

      {step === "property" && (
        <div className="grid grid-cols-2 gap-3">
          {PROPERTY_TYPES.map((p) => (
            <Chip key={p.id} active={data.propertyType === p.id} onClick={() => { setData((d) => ({ ...d, propertyType: p.id })); setTimeout(goNext, 150); }}>
              <span className="text-primary">{p.icon}</span>
              <span>{p.label}</span>
            </Chip>
          ))}
        </div>
      )}

      {step === "rooms" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {ROOMS.map((r) => (
              <Chip key={r.id} active={data.rooms.includes(r.id)} onClick={() => toggleRoom(r.id)}>
                <span className="text-primary">{r.icon}</span>
                <span>{r.label}</span>
              </Chip>
            ))}
          </div>
          <button
            onClick={goNext}
            disabled={!canContinue}
            className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {step === "state" && (
        <div className="grid gap-3">
          {HOUSE_STATES.map((s) => (
            <button
              key={s.id}
              onClick={() => { setData((d) => ({ ...d, houseState: s.id })); setTimeout(goNext, 150); }}
              className={cn(
                "flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                data.houseState === s.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
              )}
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                {s.icon}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{s.label}</p>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {step === "start-room" && (
        <div className="space-y-3">
          {selectedRoomMeta.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">No rooms selected — go back and pick a few.</p>
          )}
          {selectedRoomMeta.map((r) => {
            const active = data.startRoom === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setData((d) => ({ ...d, startRoom: r.id }))}
                className={cn(
                  "w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all",
                  active
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
                )}
              >
                <div className="shrink-0 w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  {r.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{r.label}</p>
                    {active && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 inline-flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{ROOM_CAPTIONS[r.id] ?? "A solid place to start."}</span>
                  </p>
                </div>
              </button>
            );
          })}
          <button
            onClick={goNext}
            disabled={!canContinue}
            className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default GroundYourSpace;