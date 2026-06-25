import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Sparkles, Home, Building2, Hotel, Wand2, PackageOpen, Sofa, Bed, UtensilsCrossed, Monitor, Bath, LayoutGrid, Utensils, Check, Construction } from "lucide-react";
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
  onStepChange?: (step: Step) => void;
}

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
  { id: "core-shell", label: "Core & shell", icon: <Construction className="w-5 h-5" /> },
  { id: "empty", label: "Empty", icon: <PackageOpen className="w-5 h-5" /> },
  { id: "partial", label: "Partially furnished", icon: <Sofa className="w-5 h-5" /> },
  { id: "redoing", label: "Redoing it all", icon: <Wand2 className="w-5 h-5" /> },
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

type Step = "property" | "rooms" | "state" | "start-room";

const BigCard = ({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "group relative block rounded-2xl overflow-hidden border shadow-sm transition-all duration-500 text-left p-4 md:p-5 min-h-[120px] flex flex-col justify-between bg-gradient-to-br from-primary/20 to-secondary/20",
      active
        ? "border-primary shadow-lg shadow-primary/10"
        : "border-border/50 hover:shadow-xl hover:border-primary/30"
    )}
  >
    <div className="flex items-start justify-between">
      <div className="w-10 h-10 rounded-xl bg-background/90 text-primary flex items-center justify-center shadow-md">
        {icon}
      </div>
      {active && (
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-sm">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      )}
    </div>
    <div>
      <h3 className="text-sm md:text-base font-bold tracking-tight group-hover:text-primary transition-colors">
        {label}
      </h3>
    </div>
  </button>
);

const GroundYourSpace = ({ onBack, onComplete, onStepChange }: Props) => {
  const [step, setStep] = useState<Step>("property");
  const [data, setData] = useState<GroundData>({
    useCase: "",
    propertyType: "",
    rooms: [],
    houseState: "",
    startRoom: "",
  });

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  const steps: Step[] = ["property", "rooms", "state", "start-room"];
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

  const stepQuestions: Record<Step, { question: string; subtitle: string }> = {
    property: { question: "What kind of place?", subtitle: "Choose the type of property you're working with." },
    rooms: { question: "Which rooms are on your list?", subtitle: "Select all the spaces you want to design." },
    state: { question: "What's the state of the place?", subtitle: "Tell us where you're starting from." },
    "start-room": { question: "Where do you want to start?", subtitle: "Pick one room to begin with — you can do the rest later." },
  };

  const { question, subtitle } = stepQuestions[step];

  return (
    <div className="space-y-6">
      {step === "property" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {PROPERTY_TYPES.map((p) => (
            <BigCard
              key={p.id}
              active={data.propertyType === p.id}
              onClick={() => { setData((d) => ({ ...d, propertyType: p.id })); setTimeout(goNext, 150); }}
              icon={p.icon}
              label={p.label}
            />
          ))}
        </div>
      )}

      {step === "rooms" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {ROOMS.map((r) => (
              <BigCard
                key={r.id}
                active={data.rooms.includes(r.id)}
                onClick={() => toggleRoom(r.id)}
                icon={r.icon}
                label={r.label}
              />
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {HOUSE_STATES.map((s) => (
            <BigCard
              key={s.id}
              active={data.houseState === s.id}
              onClick={() => { setData((d) => ({ ...d, houseState: s.id })); setTimeout(goNext, 150); }}
              icon={s.icon}
              label={s.label}
            />
          ))}
        </div>
      )}

      {step === "start-room" && (
        <div className="space-y-4">
          {selectedRoomMeta.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">No rooms selected — go back and pick a few.</p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {selectedRoomMeta.map((r) => (
              <BigCard
                key={r.id}
                active={data.startRoom === r.id}
                onClick={() => setData((d) => ({ ...d, startRoom: r.id }))}
                icon={r.icon}
                label={r.label}
              />
            ))}
          </div>
          {selectedRoomMeta.length > 0 && data.startRoom && ROOM_CAPTIONS[data.startRoom] && (
            <p className="text-center text-sm text-muted-foreground inline-flex items-start gap-1.5 w-full justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span>{ROOM_CAPTIONS[data.startRoom]}</span>
            </p>
          )}
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