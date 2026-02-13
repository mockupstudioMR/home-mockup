import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RotateCcw, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface OtherAnglesButtonProps {
  onGenerate: (anglePrompt: string) => Promise<string | null>;
  disabled?: boolean;
}

const ANGLE_PROMPTS = [
  "Show this exact same room from the opposite wall, looking back at the original camera position. Keep all furniture, materials, colors, and decor identical.",
  "Show this exact same room from a corner perspective at a 45-degree angle. Keep all furniture, materials, colors, and decor identical.",
  "Show a close-up detail view of the main focal area of this exact same room. Keep all furniture, materials, colors, and decor identical.",
];

const ANGLE_LABELS = [
  "Opposite Wall View",
  "Corner Perspective",
  "Detail Close-up",
];

const OtherAnglesButton = ({ onGenerate, disabled }: OtherAnglesButtonProps) => {
  const [open, setOpen] = useState(false);
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const [angleImages, setAngleImages] = useState<(string | null)[]>([null, null, null]);
  const [activeSlide, setActiveSlide] = useState(0);

  const handleGenerate = async (index: number) => {
    setGeneratingIndex(index);
    try {
      const imageUrl = await onGenerate(ANGLE_PROMPTS[index]);
      if (imageUrl) {
        setAngleImages(prev => {
          const next = [...prev];
          next[index] = imageUrl;
          return next;
        });
        setActiveSlide(index);
      }
    } finally {
      setGeneratingIndex(null);
    }
  };

  const generatedImages = angleImages.filter(Boolean) as string[];
  const currentImage = generatedImages[activeSlide] || null;

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className="rounded-full px-6 py-6 text-base font-medium border-primary/30 hover:bg-primary/5 group"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <RotateCcw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
        Show other angles
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Other Angles of Your Room</DialogTitle>
          </DialogHeader>

          {/* Angle selection buttons */}
          <div className="flex gap-2 flex-wrap">
            {ANGLE_LABELS.map((label, i) => (
              <Button
                key={i}
                variant={angleImages[i] ? "default" : "outline"}
                size="sm"
                disabled={generatingIndex !== null}
                onClick={() => angleImages[i] ? setActiveSlide(generatedImages.indexOf(angleImages[i]!)) : handleGenerate(i)}
                className="text-sm"
              >
                {generatingIndex === i ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Generating...
                  </>
                ) : (
                  label
                )}
              </Button>
            ))}
          </div>

          {/* Image display */}
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
            {generatedImages.length > 0 && currentImage ? (
              <>
                <img
                  src={currentImage}
                  alt={`Room angle ${activeSlide + 1}`}
                  className="w-full h-full object-cover"
                />
                {generatedImages.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm"
                      onClick={() => setActiveSlide(s => (s - 1 + generatedImages.length) % generatedImages.length)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm"
                      onClick={() => setActiveSlide(s => (s + 1) % generatedImages.length)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </>
            ) : generatingIndex !== null ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating {ANGLE_LABELS[generatingIndex]}...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                <RotateCcw className="w-8 h-8" />
                <p className="text-sm">Select an angle above to generate</p>
              </div>
            )}
          </div>

          {/* Dot indicators */}
          {generatedImages.length > 1 && (
            <div className="flex justify-center gap-2">
              {generatedImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    i === activeSlide ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OtherAnglesButton;
