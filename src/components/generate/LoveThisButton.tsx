import { Button } from "@/components/ui/button";
import { Heart, Loader2, Lock, Sparkles, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { useToast } from "@/hooks/use-toast";

interface LoveThisButtonProps {
  isLocked: boolean;
  isLoading: boolean;
  onLock: () => void;
  designId?: string;
}

const LoveThisButton = ({ isLocked, isLoading, onLock, designId }: LoveThisButtonProps) => {
  const [disliked, setDisliked] = useState(false);
  const { toast } = useToast();

  if (isLocked) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-primary/10 text-primary border border-primary/30">
        <Lock className="w-4 h-4" />
        <span className="font-medium">Design Locked & Saved</span>
      </div>
    );
  }

  const handleDislike = () => {
    if (disliked) return;
    setDisliked(true);
    trackEvent("unsatisfied" as any, "generate", { design_id: designId });
    toast({
      title: "Thanks for the feedback",
      description: "We'll use this to improve future designs.",
    });
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        size="lg"
        className={cn(
          "rounded-full px-8 py-6 text-lg font-semibold",
          "bg-gradient-to-r from-primary to-accent",
          "hover:shadow-lg hover:shadow-primary/25 transition-all duration-300",
          "group"
        )}
        onClick={onLock}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Analyzing your design...
          </>
        ) : (
          <>
            <Heart className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Love this enough — let's dig deeper
            <Sparkles className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
          </>
        )}
      </Button>
      <Button
        size="lg"
        variant="outline"
        className={cn(
          "rounded-full p-6",
          disliked && "bg-destructive/10 border-destructive/30 text-destructive"
        )}
        onClick={handleDislike}
        disabled={isLoading || disliked}
        title="Not what I wanted"
      >
        <ThumbsDown className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default LoveThisButton;
