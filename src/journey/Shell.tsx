/** The frame every journey screen shares: top bar with the 10-step progress, the soft background, and links between screens. */
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { I } from "./icons";
import { STEP_TITLES } from "./data";
import { hrefOf, type ScreenId } from "./routes";
import "./mu.css";
import "./boards.css";

/** A link to another journey screen, styled by the caller (".back", ".btn", ".link-btn"…). */
export function Go({
  to, extra, className, style, children, onClick, ariaLabel,
}: { to: ScreenId; extra?: string; className?: string; style?: CSSProperties; children: ReactNode; onClick?: (e: MouseEvent) => void | boolean; ariaLabel?: string }) {
  const navigate = useNavigate();
  const href = hrefOf(to, extra);
  return (
    <Link
      to={href}
      className={className}
      style={style}
      aria-label={ariaLabel}
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
      {label}
    </Go>
  );
}

/** Screen frame. step 0 = before the journey (no progress bar, "Log in"). */
export function Screen({
  board, step, right, children, wrapClass = "wrap", wrapStyle, blob2 = false, signedIn = true,
}: { board: string; step: number; right?: ReactNode; children: ReactNode; wrapClass?: string; wrapStyle?: CSSProperties; blob2?: boolean; signedIn?: boolean }) {
  return (
    <div className={`mu app b-${board}`} data-board={board}>
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
            <div className="segs">
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className={`seg${i + 1 < step ? " done" : i + 1 === step ? " now" : ""}`} />
              ))}
            </div>
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
      <main className={wrapClass} style={wrapStyle}>
        {children}
      </main>
    </div>
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
