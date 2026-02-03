import { Button } from "@/components/ui/button";
import { Heart, Loader2, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoveThisButtonProps {
  isLocked: boolean;
  isLoading: boolean;
  onLock: () => void;
}

const LoveThisButton = ({ isLocked, isLoading, onLock }: LoveThisButtonProps) => {
  if (isLocked) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-primary/10 text-primary border border-primary/30">
        <Lock className="w-4 h-4" />
        <span className="font-medium">Design Locked & Saved</span>
      </div>
    );
  }

  return (
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
  );
};

export default LoveThisButton;
