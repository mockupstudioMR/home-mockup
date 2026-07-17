import { useEffect, useState } from "react";

interface CountUpProps {
  to: number;
  duration?: number;
  suffix?: string;
  className?: string;
  start?: boolean;
}

const CountUp = ({ to, duration = 1500, suffix = "", className, start = true }: CountUpProps) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, start]);

  return <span className={className}>{value}{suffix}</span>;
};

export default CountUp;