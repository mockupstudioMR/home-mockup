/**
 * 3D walking tour: the person walks through their own room (sizes, floor plan, chosen layout and pieces from
 * the journey) at eye height. Each of the four walls is a stop that shows that wall's picture beside the 3D view.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useJourney, type Wall } from "../state";
import { buildModel, type Edits } from "./model";
import { createShowroom, type Showroom } from "./scene";
import "./showroom3d.css";

const WALLS: Wall[] = ["A", "B", "C", "D"];
const NO_EDITS: Edits = {};
const SPEED = 1.4; // metres per second
const TURN = 1.6; // radians per second

/** The best picture we have for each wall: confirmed options, then the made picture, then the person's own photo. */
export function wallPictures(s: ReturnType<typeof useJourney>["s"]): Record<Wall, string | undefined> {
  return Object.fromEntries(WALLS.map((w, i) => {
    const f = s.showroom?.final?.[w], sc = s.showroom?.scenes?.[w];
    const final = f?.url && (!f.scene || f.scene === sc?.manifestUrl) ? f.url : undefined;
    return [w, final ?? sc?.background ?? s.room.wallPhotos?.[i]];
  })) as Record<Wall, string | undefined>;
}

export default function WalkTour({ onClose }: { onClose: () => void }) {
  const { s } = useJourney();
  const model = useMemo(() => buildModel(s, s.showroom?.edits ?? NO_EDITS), [s]);
  const pics = useMemo(() => wallPictures(s), [s]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const room = useRef<Showroom | null>(null);
  const keys = useRef(new Set<string>());
  const [failed, setFailed] = useState("");
  const [stop, setStop] = useState<Wall | null>(null);

  useEffect(() => {
    if (!canvas.current) return;
    try {
      room.current = createShowroom(canvas.current, model, () => undefined);
      room.current.setView("walk", true);
    } catch (e) { setFailed(e instanceof Error ? e.message : "The 3D view could not start."); }
    return () => { room.current?.dispose(); room.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One stepper: keys and held on-screen buttons move the eye every frame.
  useEffect(() => {
    let raf = 0, last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05); last = t;
      const k = keys.current;
      const f = (k.has("w") || k.has("arrowup") ? 1 : 0) - (k.has("s") || k.has("arrowdown") ? 1 : 0);
      const st = (k.has("d") ? 1 : 0) - (k.has("a") ? 1 : 0);
      const tn = (k.has("arrowleft") || k.has("q") ? 1 : 0) - (k.has("arrowright") || k.has("e") ? 1 : 0);
      if (f || st || tn) { room.current?.walk(f * SPEED * dt, st * SPEED * dt, tn * TURN * dt); setStop(null); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "q", "e", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) { e.preventDefault(); keys.current.add(k); }
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [onClose]);

  const hold = (k: string) => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); keys.current.add(k); },
    onPointerUp: () => keys.current.delete(k), onPointerLeave: () => keys.current.delete(k), onPointerCancel: () => keys.current.delete(k),
  });
  const goTo = (w: Wall) => { setStop(w); room.current?.setView(w); };
  const startOver = () => { setStop(null); room.current?.setView("walk"); };
  const size = `${Math.round(model.room.w * 100)} × ${Math.round(model.room.l * 100)} cm`;

  return (
    <div className="wt" role="dialog" aria-modal="true" aria-label="3D walking tour of your room">
      <div className="wt-top">
        <div><b>Walk through your room</b><span className="small"> · {size} · from your floor plan and layout</span></div>
        <button type="button" className="btn auto" onClick={onClose}>Close tour</button>
      </div>
      <div className="wt-stage">
        <canvas ref={canvas} role="img" aria-label={`Your room in 3D, ${size}`} />
        {failed && <div className="sr3-msg" role="alert"><b>The 3D tour can't open here</b><span className="small">{failed}</span></div>}
        {stop && (
          <figure className="wt-pic">
            {pics[stop] ? <img src={pics[stop]} alt={`Wall ${stop} picture`} /> : <span className="small">No picture of wall {stop} yet. Make your room's pictures to see it here.</span>}
            <figcaption className="small">Wall {stop}</figcaption>
          </figure>
        )}
        <div className="wt-pad" role="group" aria-label="Walk">
          <span />
          <button type="button" aria-label="Walk forward" {...hold("w")}>▲</button>
          <span />
          <button type="button" aria-label="Turn left" {...hold("q")}>⟲</button>
          <button type="button" aria-label="Walk back" {...hold("s")}>▼</button>
          <button type="button" aria-label="Turn right" {...hold("e")}>⟳</button>
        </div>
        <span className="sr3-hint">W A S D or arrows to walk · drag to look around</span>
      </div>
      <div className="wt-stops" role="group" aria-label="Stops on the tour">
        <button type="button" className="sr3-v" aria-pressed={!stop} onClick={startOver}>Entrance</button>
        {WALLS.map((w) => (
          <button key={w} type="button" className="wt-stop" aria-pressed={stop === w} onClick={() => goTo(w)}>
            {pics[w] ? <img src={pics[w]} alt="" /> : <i>{w}</i>}
            <span>Wall {w}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
