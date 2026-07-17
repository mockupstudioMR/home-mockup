import { motion } from "framer-motion";
import { useState } from "react";
import CountUp from "../primitives/CountUp";

const TIERS = {
  essential: { total: 2400, breakdown: [{ label: "Furniture", pct: 55, color: "hsl(var(--primary))" }, { label: "Lighting", pct: 15, color: "hsl(var(--accent))" }, { label: "Textiles", pct: 20, color: "hsl(var(--secondary))" }, { label: "Decor", pct: 10, color: "hsl(var(--muted-foreground))" }] },
  recommended: { total: 5800, breakdown: [{ label: "Furniture", pct: 50, color: "hsl(var(--primary))" }, { label: "Lighting", pct: 18, color: "hsl(var(--accent))" }, { label: "Textiles", pct: 20, color: "hsl(var(--secondary))" }, { label: "Decor", pct: 12, color: "hsl(var(--muted-foreground))" }] },
  luxury: { total: 14200, breakdown: [{ label: "Furniture", pct: 48, color: "hsl(var(--primary))" }, { label: "Lighting", pct: 20, color: "hsl(var(--accent))" }, { label: "Textiles", pct: 18, color: "hsl(var(--secondary))" }, { label: "Decor", pct: 14, color: "hsl(var(--muted-foreground))" }] },
};

type Tier = keyof typeof TIERS;

const Budget = () => {
  const [tier, setTier] = useState<Tier>("recommended");
  const data = TIERS[tier];
  const C = 2 * Math.PI * 80;
  let offset = 0;

  return (
    <div className="space-y-10">
      <div className="text-center space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Chapter 07</p>
        <h2 className="text-5xl md:text-6xl font-semibold tracking-tight">Choose your investment</h2>
      </div>

      <div className="flex justify-center gap-2">
        {(Object.keys(TIERS) as Tier[]).map((t) => (
          <button key={t} onClick={() => setTier(t)} className={`px-6 py-2.5 rounded-full text-sm font-medium capitalize transition-all ${tier === t ? "bg-foreground text-background shadow-lg" : "bg-muted hover:bg-muted/70"}`}>{t}</button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="flex justify-center">
          <div className="relative w-72 h-72">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="80" fill="none" stroke="hsl(var(--muted))" strokeWidth="24" />
              {data.breakdown.map((b, i) => {
                const length = (b.pct / 100) * C;
                const el = (
                  <motion.circle key={`${tier}-${i}`} cx="100" cy="100" r="80" fill="none" stroke={b.color} strokeWidth="24" initial={{ strokeDasharray: `0 ${C}` }} animate={{ strokeDasharray: `${length} ${C}`, strokeDashoffset: -offset }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
                );
                offset += length;
                return el;
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Total</p>
              <div className="text-4xl font-semibold tabular-nums">€<CountUp to={data.total} duration={900} /></div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {data.breakdown.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
              <span className="flex-1 font-medium">{b.label}</span>
              <span className="text-muted-foreground tabular-nums">€{Math.round((b.pct / 100) * data.total)}</span>
              <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{b.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Budget;