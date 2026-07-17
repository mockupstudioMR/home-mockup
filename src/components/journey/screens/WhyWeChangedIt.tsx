import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";

interface Hotspot { x: number; y: number; title: string; description: string }
interface Props { image: string; hotspots: Hotspot[] }

const WhyWeChangedIt = ({ image, hotspots }: Props) => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-10">
      <div className="text-center space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Chapter 04</p>
        <h2 className="text-5xl md:text-6xl font-semibold tracking-tight">Why we changed it</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">Every decision has a purpose. Tap the numbers to explore.</p>
      </div>

      <div className="relative aspect-[16/10] rounded-3xl overflow-hidden shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.35)]">
        <motion.img src={image} alt="" animate={{ filter: open !== null ? "blur(10px)" : "blur(0px)" }} transition={{ duration: 0.4 }} className="absolute inset-0 w-full h-full object-cover" />
        {hotspots.map((h, i) => (
          <motion.button key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 + i * 0.15, type: "spring" }} onClick={() => setOpen(i)} className="absolute w-10 h-10 rounded-full bg-white text-foreground font-semibold shadow-xl flex items-center justify-center hover:scale-110 transition-transform" style={{ left: `${h.x}%`, top: `${h.y}%`, transform: "translate(-50%, -50%)" }}>
            <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-30" />
            <span className="relative">{i + 1}</span>
          </motion.button>
        ))}
        <AnimatePresence>
          {open !== null && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-[90%] rounded-3xl p-8 bg-background/90 backdrop-blur-2xl border border-border/50 shadow-2xl">
              <button onClick={() => setOpen(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
              <p className="text-xs uppercase tracking-widest text-primary">Insight {open + 1}</p>
              <h3 className="text-2xl font-semibold mt-2">{hotspots[open].title}</h3>
              <p className="text-muted-foreground mt-3">{hotspots[open].description}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WhyWeChangedIt;