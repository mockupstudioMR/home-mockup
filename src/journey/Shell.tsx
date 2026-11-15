/** The frame every journey screen shares: top bar with the 10-step progress, the soft background, and links between screens. */
import { useLayoutEffect, useRef, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { I } from "./icons";
import { STEP_NAMES, STEP_TITLES } from "./data";
import { hrefOf, type ScreenId } from "./routes";
import { useJourney } from "./state";
import { STEP_FIRST, stepState } from "./stepNav";
import "./mu.css";
import "./boards.css";

/** A link to another journey screen, styled by the caller (".back", ".btn", ".link-btn"…). */
export function Go({
  to, extra, className, style, children, onClick, ariaLabel, title,
}: { to: ScreenId; extra?: string; className?: string; style?: CSSProperties; children: ReactNode; onClick?: (e: MouseEvent) => void | boolean; ariaLabel?: string; title?: string }) {
  const navigate = useNavigate();
  const href = hrefOf(to, extra);
  return (
    <Link
      to={href}
      className={className}
      style={style}
      aria-label={ariaLabel}
      title={title}
      onClick={(e) => {
        if (onClick) {
          const r = onClick(e);
          if (r === false) {
            e.preventDefault();
            return;
          }
        }
        if (e.defaultPrevented) return;
        e.preventDefault();
        navigate(href);
        window.scrollTo({ top: 0 });
      }}
    >
      {children}
    </Link>
  );
}

export function useGo() {
  const navigate = useNavigate();
  return (to: ScreenId, extra = "") => {
    navigate(hrefOf(to, extra));
    window.scrollTo({ top: 0 });
  };
}

export function Back({ to, label = "Back", style }: { to: ScreenId; label?: string; style?: CSSProperties }) {
  return (
    <Go to={to} className="back" style={style}>
      <I.back />
      <span className="back-l">{label}</span>
    </Go>
  );
}

/** Steps whose screens must fit in one window on desktop/laptop (no scrolling). Phones still scroll up and down. */
const FIT_STEPS = new Set([1, 2, 3, 4]);
const FIT_MIN = 0.5;

/** Shrinks `inner` (CSS zoom) just enough that `outer` doesn't need to scroll. Re-fits when the window or the
 *  content changes size. Off on phones (≤ 600 px wide), where the middle may scroll up and down. */
function useFitToWindow(on: boolean) {
  const outer = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const o = outer.current, el = inner.current;
    if (!on || !o || !el) return;
    let frame = 0;
    const fit = () => {
      frame = 0;
      const reset = () => {
        el.style.zoom = "";
        el.style.width = "";
        el.style.marginLeft = "";
      };
      reset();
      if (window.innerWidth <= 600) return;
      const cs = getComputedStyle(o);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const avail = o.clientHeight - padY;
      const need0 = o.scrollHeight - padY;
      if (need0 <= avail + 1) return;
      const w0 = el.offsetWidth;
      const apply = (z: number, width: number) => {
        el.style.width = `${width}px`;
        el.style.zoom = String(z);
        // centre the shrunk block in the window (margin is in zoomed units)
        el.style.marginLeft = `${Math.max(0, (o.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - width * z) / 2 / z)}px`;
        return o.scrollHeight - padY;
      };
      // A: shrink and let the content use the freed width (text stays bigger when the layout can spread out)
      let zA = Math.max(FIT_MIN, avail / need0);
      let okA = false;
      for (let i = 0; i < 6; i++) {
        const need = apply(zA, Math.min(w0 / zA, w0 * 1.6));
        if (need <= avail + 1) { okA = true; break; }
        zA = Math.max(FIT_MIN, zA * (avail / need) * 0.995);
        if (zA === FIT_MIN) break;
      }
      // B: shrink everything evenly at the original width (pictures shrink with the rest)
      const zB = Math.max(FIT_MIN, (avail / need0) * 0.995);
      if (okA && zA >= zB) {
        apply(zA, Math.min(w0 / zA, w0 * 1.6));
      } else {
        apply(zB, w0);
      }
    };
    const later = () => { if (!frame) frame = requestAnimationFrame(fit); };
    fit();
    const ro = new ResizeObserver(later);
    ro.observe(o);
    ro.observe(el);
    // images that finish loading change the height without resizing the observed boxes' widths
    el.addEventListener("load", later, true);
    return () => {
      ro.disconnect();
      el.removeEventListener("load", later, true);
      if (frame) cancelAnimationFrame(frame);
      el.style.zoom = "";
    };
  }, [on]);
  return { outer, inner };
}

/** Screen frame. step 0 = before the journey (no progress bar, "Log in").
 *  `dock` = the screen's Back / Continue row, pinned to the bottom of the window so the main button
 *  sits at the same height on every screen and never needs scrolling to. */
export function Screen({
  board, step, right, children, wrapClass = "wrap", wrapStyle, blob2 = false, signedIn = true, dock,
}: { board: string; step: number; right?: ReactNode; children: ReactNode; wrapClass?: string; wrapStyle?: CSSProperties; blob2?: boolean; signedIn?: boolean; dock?: ReactNode }) {
  const fitOn = !!dock && FIT_STEPS.has(step);
  const { outer, inner } = useFitToWindow(fitOn);
  return (
    <div className={`mu app b-${board}${dock ? " has-dock" : ""}${fitOn ? " fit" : ""}`} data-board={board}>
      <div className="blob" />
      {blob2 && <div className="blob2" />}
      <header className="top">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <I.home />
          </span>
          Home Mockup
        </Link>
        {step > 0 ? (
          <div className="prog">
            <div className="prog-label">
              <span>
                <b>Step {step} of 10</b> · {STEP_TITLES[step]}
              </span>
              {right != null && <span>{right}</span>}
            </div>
            <StepBar step={step} />
          </div>
        ) : (
          <div style={{ flex: "1 1 auto" }} />
        )}
        <div className="top-actions">
          {signedIn ? (
            <>
              <Link className="link-btn" to="/project">
                Save &amp; exit
              </Link>
              <Link className="avatar" to="/my-stats" aria-label="Account">
                <I.user />
              </Link>
            </>
          ) : (
            <Link className="link-btn" to="/auth">
              Log in
            </Link>
          )}
        </div>
      </header>
      <main className={wrapClass} style={wrapStyle} ref={outer}>
        {fitOn ? (
          <div className="fit-in" ref={inner}>
            {children}
          </div>
        ) : (
          children
        )}
      </main>
      {dock && (
        <nav className="dock" aria-label="Continue or go back">
          <div className="dock-in" style={wrapStyle?.maxWidth ? { maxWidth: wrapStyle.maxWidth } : undefined}>
            {dock}
          </div>
        </nav>
      )}
    </div>
  );
}

/** The 10 steps as the thin bar in the top bar: every step can be clicked to go to its first screen. */
function StepBar({ step }: { step: number }) {
  const { s } = useJourney();
  return (
    <nav className="segs" aria-label="Steps">
      {Array.from({ length: 10 }, (_, i) => {
        const n = i + 1;
        const st = stepState(s.done, n, step);
        return (
          <Go
            key={n}
            to={STEP_FIRST[n]}
            className={`seg st-${st}`}
            ariaLabel={`Step ${n}: ${STEP_TITLES[n]}${st === "done" ? " (done)" : st === "now" ? " (you are here)" : ""}`}
            title={`${n} · ${STEP_NAMES[n]}`}
          >
            <span className="seg-tip" aria-hidden="true">
              {n} · {STEP_NAMES[n]}
            </span>
          </Go>
        );
      })}
    </nav>
  );
}

/** The 10 steps as labelled pills (summaries): the same states and links as the top bar. */
export function StepStrip({ step }: { step: number }) {
  const { s } = useJourney();
  return (
    <nav className="sm-strip" aria-label="Your journey">
      {STEP_NAMES.slice(1).map((name, i) => {
        const n = i + 1;
        const st = stepState(s.done, n, step);
        return (
          <Go key={n} to={STEP_FIRST[n]} className={`st-${st}`} ariaLabel={`Step ${n}: ${STEP_TITLES[n]}${st === "done" ? " (done)" : st === "now" ? " (you are here)" : ""}`}>
            <i>{st === "done" ? "✓" : n}</i>
            {name}
          </Go>
        );
      })}
    </nav>
  );
}

/** A selectable option card with the round check in the corner. */
export function Opt({
  sel, tint, className = "", onClick, children, style, ariaLabel,
}: { sel?: boolean; tint: "a" | "b" | "c" | "d"; className?: string; onClick: () => void; children: ReactNode; style?: CSSProperties; ariaLabel?: string }) {
  return (
    <button type="button" className={`opt ${tint} ${className}${sel ? " sel" : ""}`} aria-pressed={!!sel} onClick={onClick} style={style} aria-label={ariaLabel}>
      {sel && (
        <span className="check">
          <I.check />
        </span>
      )}
      {children}
    </button>
  );
}

/** Two-line option titles from the designs ("Setting up a" / "new space"). */
export const Lines = ({ t }: { t: [string, string] | string }) =>
  typeof t === "string" ? <>{t}</> : t[1] ? <>{t[0]}<br />{t[1]}</> : <>{t[0]}</>;
