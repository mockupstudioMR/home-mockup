import { Go } from "../Shell";
import { useJourney } from "../state";
import { PARTS, type PartKey } from "../finishes";

/**
 * The five refinement parts, in order. Main furniture is step 5; the other four are the parts of step 6
 * (6/palette?part=…). Every part can be clicked; finished ones are ticked.
 */
export function RefineCrumbs({ on }: { on: PartKey }) {
  const { s } = useJourney();
  const done = (k: PartKey) => (k === "main" ? s.done.includes(5) || !!s.anchor : !!s.refined?.includes(k) || s.done.includes(6));
  return (
    <nav className="crumbs" aria-label="Refinement order">
      {PARTS.map((x, i) => {
        const cls = x.key === on ? "on" : done(x.key) ? "done" : "";
        const label = `${cls === "done" ? "✓" : `${i + 1} ·`} ${x.label}`;
        return x.key === "main" ? (
          <Go key={x.key} className={cls} to="S5-Anchor">
            {label}
          </Go>
        ) : (
          <Go key={x.key} className={cls} to="S6-Palette" extra={`?part=${x.key}`}>
            {label}
          </Go>
        );
      })}
    </nav>
  );
}
