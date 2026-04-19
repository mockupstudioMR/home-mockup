import { useQuiz } from "@/contexts/QuizContext";
import QuizOption from "../QuizOption";
import { Sofa, Bed, UtensilsCrossed, Monitor, Bath, LayoutGrid, Utensils, Home } from "lucide-react";

const rooms = [
  {
    value: "living-room",
    label: "Living Room",
    description: "The heart of your home for relaxing and entertaining",
    icon: <Sofa className="w-6 h-6" />,
  },
  {
    value: "bedroom",
    label: "Bedroom",
    description: "Your personal retreat for rest and rejuvenation",
    icon: <Bed className="w-6 h-6" />,
  },
  {
    value: "kitchen",
    label: "Kitchen",
    description: "Where culinary creativity comes to life",
    icon: <UtensilsCrossed className="w-6 h-6" />,
  },
  {
    value: "office",
    label: "Home Office",
    description: "A productive space for work and focus",
    icon: <Monitor className="w-6 h-6" />,
  },
  {
    value: "bathroom",
    label: "Bathroom",
    description: "A spa-like sanctuary for self-care",
    icon: <Bath className="w-6 h-6" />,
  },
  {
    value: "open-space-kitchen-dining-living",
    label: "Open Space (Kitchen + Dining + Living)",
    description: "An open-plan area combining cooking, dining, and lounging",
    icon: <LayoutGrid className="w-6 h-6" />,
  },
  {
    value: "dining-living",
    label: "Dining + Living",
    description: "A combined space for meals and relaxation",
    icon: <Utensils className="w-6 h-6" />,
  },
  {
    value: "studio-apartment",
    label: "Studio Apartment",
    description: "A single open space combining living, sleeping, and cooking",
    icon: <Home className="w-6 h-6" />,
  },
];

const RoomStep = () => {
  const { quizData, updateQuizData } = useQuiz();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Which room are we designing?</h2>
        <p className="text-muted-foreground">Select the space you want to transform</p>
      </div>

      <div className="grid gap-3">
        {rooms.map((room) => (
          <QuizOption
            key={room.value}
            value={room.value}
            label={room.label}
            description={room.description}
            icon={room.icon}
            selected={quizData.roomType === room.value}
            onClick={() => updateQuizData({ roomType: room.value })}
          />
        ))}
      </div>
    </div>
  );
};

export default RoomStep;
