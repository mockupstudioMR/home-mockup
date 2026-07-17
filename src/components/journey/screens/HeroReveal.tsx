import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import BeforeAfterSlider from "../BeforeAfterSlider";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Props {
  before: string;
  after: string;
  onContinue: () => void;
}

const HeroReveal = ({ before, after, onContinue }: Props) => {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="text-center space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="space-y-4"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Your design journey</p>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
          Your room has been<br />
          <span className="italic font-light">transformed.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Powered by AI and professional interior design principles.
        </p>
      </motion.div>

      <motion.div
        initial={{ scale: 1.05, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {revealed ? (
          <BeforeAfterSlider before={before} after={after} />
        ) : (
          <img src={after} alt="Redesigned room" className="w-full aspect-[16/10] object-cover rounded-3xl shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.35)]" />
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
      >
        <Button onClick={onContinue} size="lg" className="rounded-full h-14 px-8 text-base gap-2 bg-foreground text-background hover:bg-foreground/90">
          Explore My Design
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </div>
  );
};

export default HeroReveal;