import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check } from "lucide-react";

interface Step { week: string; title: string; tasks: string[] }
interface Props { steps: Step[] }

const Roadmap = ({ steps }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div ref={ref} className="space-y-12">
      <div className="text-center space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Chapter 08</p>
        <h2 className="text-5xl md:text-6xl font-semibold tracking-tight">Your roadmap</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">A calm, week-by-week path forward.</p>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <div className="absolute left-6 top-2 bottom-2 w-px bg-border" />
        <div className="space-y-8">
          {steps.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: i * 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="relative pl-16">
              <motion.div initial={{ scale: 0 }} animate={inView ? { scale: 1 } : {}} transition={{ delay: 0.2 + i * 0.15, type: "spring", stiffness: 200 }} className="absolute left-0 top-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                <Check className="w-5 h-5" />
              </motion.div>
              <p className="text-xs uppercase tracking-widest text-primary">{s.week}</p>
              <h3 className="text-2xl font-semibold mt-1">{s.title}</h3>
              <ul className="mt-3 space-y-1.5">
                {s.tasks.map((t) => (
                  <li key={t} className="text-muted-foreground flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2.5" />
                    {t}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Roadmap;