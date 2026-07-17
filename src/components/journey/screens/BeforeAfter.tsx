import { useState } from "react";
import BeforeAfterSlider from "../BeforeAfterSlider";

interface Version { key: string; label: string; image: string }
interface Props { before: string; versions: Version[] }

const BeforeAfter = ({ before, versions }: Props) => {
  const [active, setActive] = useState(0);
  const current = versions[active];
  if (!current) return null;

  return (
    <div className="space-y-10">
      <div className="text-center space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Chapter 09</p>
        <h2 className="text-5xl md:text-6xl font-semibold tracking-tight">See the transformation</h2>
      </div>

      <BeforeAfterSlider before={before} after={current.image} labelAfter={current.label} />

      <div className="flex justify-center gap-2 flex-wrap">
        {versions.map((v, i) => (
          <button key={v.key} onClick={() => setActive(i)} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${active === i ? "bg-foreground text-background" : "bg-muted hover:bg-muted/70"}`}>{v.label}</button>
        ))}
      </div>
    </div>
  );
};

export default BeforeAfter;