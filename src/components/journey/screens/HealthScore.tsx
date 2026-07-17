import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import CountUp from "../primitives/CountUp";

interface Category { name: string; score: number }
interface Props { overall: number; categories: Category[] }

const HealthScore = ({ overall, categories }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const C = 2 * Math.PI * 90;

  return (
    <div ref={ref} className="space-y-12">
      <div className="text-center space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Chapter 05</p>
        <h2 className="text-5xl md:text-6xl font-semibold tracking-tight">Room Health Score</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">A holistic read of how your new space performs.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="flex items-center justify-center">
          <div className="relative w-72 h-72">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
              <motion.circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--primary))" strokeWidth="10" strokeLinecap="round" initial={{ strokeDasharray: `0 ${C}` }} animate={inView ? { strokeDasharray: `${(overall / 100) * C} ${C}` } : {}} transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-6xl font-semibold tabular-nums">
                <CountUp to={overall} duration={1800} start={inView} />
              </div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Overall</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {categories.map((c, i) => (
            <div key={c.name} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{c.name}</span>
                <span className="tabular-nums text-muted-foreground">{c.score}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-primary to-accent rounded-full" initial={{ width: 0 }} animate={inView ? { width: `${c.score}%` } : {}} transition={{ duration: 1.2, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HealthScore;