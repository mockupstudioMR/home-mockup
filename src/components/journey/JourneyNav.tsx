import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Bookmark, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JourneyNavProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
  onSave?: () => void;
}

const JourneyNav = ({ current, total, onPrev, onNext, onExit, onSave }: JourneyNavProps) => {
  return (
    <>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="max-w-7xl mx-auto flex items-center gap-4 px-6 py-3">
          <Button variant="ghost" size="icon" onClick={onExit} aria-label="Exit journey">
            <X className="w-5 h-5" />
          </Button>
          <div className="flex-1 flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full bg-muted overflow-hidden"
              >
                <motion.div
                  className="h-full bg-primary"
                  initial={false}
                  animate={{ width: i < current ? "100%" : i === current ? "100%" : "0%" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground tabular-nums w-12 text-right">
            {String(current + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>
          {onSave && (
            <Button variant="ghost" size="icon" onClick={onSave} aria-label="Save">
              <Bookmark className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Prev / Next floating pills */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={onPrev}
          disabled={current === 0}
          className="rounded-full h-12 w-12 backdrop-blur-xl bg-background/70 shadow-lg"
          aria-label="Previous"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button
          onClick={onNext}
          disabled={current === total - 1}
          className={cn(
            "rounded-full h-12 px-6 gap-2 shadow-lg",
            "bg-foreground text-background hover:bg-foreground/90"
          )}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </>
  );
};

export default JourneyNav;