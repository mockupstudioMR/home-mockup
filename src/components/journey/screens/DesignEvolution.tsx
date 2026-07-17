import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Version { label: string; image: string; description?: string }
interface Props { versions: Version[] }

const DesignEvolution = ({ versions }: Props) => {
  const [i, setI] = useState(0);
  const v = versions[i];
  if (!v) return null;

  return (
    <div className="space-y-10">
      <div className="text-center space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Chapter 03</p>
        <h2 className="text-5xl md:text-6xl font-semibold tracking-tight">Design Evolution</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">Every great room is a series of decisions. Here are yours.</p>
      </div>

      <div className="relative aspect-[16/10] rounded-3xl overflow-hidden shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.35)]">
        <AnimatePresence mode="wait">
          <motion.img
            key={i}
            src={v.image}
            alt={v.label}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/70 to-transparent">
          <p className="text-white/70 text-xs uppercase tracking-widest">Version {i + 1}</p>
          <p className="text-white text-3xl font-semibold">{v.label}</p>
          {v.description && <p className="text-white/80 text-sm mt-1 max-w-lg">{v.description}</p>}
        </div>
        <Button size="icon" variant="secondary" onClick={() => setI((p) => Math.max(0, p - 1))} disabled={i === 0} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full h-11 w-11 bg-white/80 backdrop-blur-md">
          <ChevronLeft />
        </Button>
        <Button size="icon" variant="secondary" onClick={() => setI((p) => Math.min(versions.length - 1, p + 1))} disabled={i === versions.length - 1} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full h-11 w-11 bg-white/80 backdrop-blur-md">
          <ChevronRight />
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2">
        {versions.map((ver, idx) => (
          <button key={idx} onClick={() => setI(idx)} className={`h-2 rounded-full transition-all ${idx === i ? "w-10 bg-foreground" : "w-2 bg-muted-foreground/30"}`} aria-label={ver.label} />
        ))}
      </div>
    </div>
  );
};

export default DesignEvolution;