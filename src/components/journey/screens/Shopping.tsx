import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

export interface JourneyProduct {
  id: string;
  name: string;
  price: number;
  image?: string;
  reason?: string;
  match?: number;
  store?: string;
  tier?: "essential" | "recommended" | "premium" | "budget";
  url?: string;
}

interface Props { products: JourneyProduct[] }

const FILTERS = ["essential", "recommended", "premium", "budget"] as const;

const Shopping = ({ products }: Props) => {
  const [filter, setFilter] = useState<typeof FILTERS[number]>("recommended");
  const filtered = useMemo(() => products.filter((p) => !p.tier || p.tier === filter), [products, filter]);

  return (
    <div className="space-y-10">
      <div className="text-center space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Chapter 06</p>
        <h2 className="text-5xl md:text-6xl font-semibold tracking-tight">Curated for your space</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">Every piece chosen for a reason.</p>
      </div>

      <div className="flex justify-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-all ${filter === f ? "bg-foreground text-background" : "bg-muted hover:bg-muted/70"}`}>{f}</button>
        ))}
      </div>

      <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filtered.map((p) => (
            <motion.div key={p.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} whileHover={{ y: -6 }} className="rounded-3xl bg-card border border-border/50 overflow-hidden shadow-[0_10px_30px_-15px_hsl(var(--primary)/0.25)] hover:shadow-[0_20px_50px_-20px_hsl(var(--primary)/0.35)] transition-shadow">
              <div className="aspect-[4/3] bg-muted overflow-hidden">
                {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-accent/20" />}
              </div>
              <div className="p-5 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold leading-snug">{p.name}</h3>
                  {p.match !== undefined && <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5 shrink-0">{p.match}%</span>}
                </div>
                {p.reason && <p className="text-xs text-muted-foreground line-clamp-2">{p.reason}</p>}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-lg font-semibold">€{p.price.toFixed(0)}</span>
                  {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">{p.store || "View"} <ExternalLink className="w-3 h-3" /></a>}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Shopping;