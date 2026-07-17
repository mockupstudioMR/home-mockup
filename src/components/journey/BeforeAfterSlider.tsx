import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface BeforeAfterSliderProps {
  before: string;
  after: string;
  className?: string;
  labelBefore?: string;
  labelAfter?: string;
}

const BeforeAfterSlider = ({ before, after, className, labelBefore = "Before", labelAfter = "After" }: BeforeAfterSliderProps) => {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef(false);

  const setFromEvent = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  };

  return (
    <div
      ref={ref}
      className={cn("relative w-full aspect-[16/10] rounded-3xl overflow-hidden select-none shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.35)]", className)}
      onMouseDown={(e) => { drag.current = true; setFromEvent(e.clientX); }}
      onMouseMove={(e) => drag.current && setFromEvent(e.clientX)}
      onMouseUp={() => { drag.current = false; }}
      onMouseLeave={() => { drag.current = false; }}
      onTouchStart={(e) => { drag.current = true; setFromEvent(e.touches[0].clientX); }}
      onTouchMove={(e) => drag.current && setFromEvent(e.touches[0].clientX)}
      onTouchEnd={() => { drag.current = false; }}
    >
      <img src={after} alt={labelAfter} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={before} alt={labelBefore} className="absolute inset-0 h-full object-cover" style={{ width: `${ref.current?.clientWidth || 0}px` }} />
      </div>
      <div className="absolute top-0 bottom-0 flex items-center" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
        <div className="w-0.5 h-full bg-white/90 shadow-lg" />
        <div className="absolute w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center left-1/2 -translate-x-1/2">
          <div className="flex gap-0.5">
            <div className="w-1 h-4 bg-foreground/50 rounded" />
            <div className="w-1 h-4 bg-foreground/50 rounded" />
          </div>
        </div>
      </div>
      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur">{labelBefore}</div>
      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur">{labelAfter}</div>
    </div>
  );
};

export default BeforeAfterSlider;