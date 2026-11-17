/**
 * The 3D showroom: the person's own room, drawn from their moodboard colours, the pieces of their chosen
 * layout and their room's size, doors and windows. Every piece can be recoloured and reshaped on the spot;
 * the result is saved as the room's style record.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { saveStyleRecord } from "../sync";
import { useJourney } from "../state";
import type { Wall } from "../state";
import { buildModel, mixHex, shapesFor, validHex, type Edits, type ShowroomModel } from "./model";
import { buildRecord, sameRecord, wallOrder } from "./record";
import { createShowroom, type Showroom, type View } from "./scene";
import "./showroom3d.css";

const WALLS: Wall[] = ["A", "B", "C", "D"];
const NO_EDITS: Edits = {};
const isWall = (v: View): v is Wall => (WALLS as string[]).includes(v);

type Item = { id: string; name: string; note: string; color: string; colorFrom: string; edited: boolean; where?: string; shapes?: { id: string; name: string; note: string }[]; shape?: string; matched?: string; kept?: boolean };

function itemsOf(m: ShowroomModel): Item[] {
  const size = (cm: number) => `${cm} cm`;
  return [
    ...m.surfaceList.map((s) => ({ id: s.id, name: s.name, note: s.colorFrom, color: s.color, colorFrom: s.colorFrom, edited: s.edited })),
    ...m.pieces.map((p) => ({
      id: p.id, name: p.name, note: p.kept ? "Yours · kept" : p.shapeName, color: p.color, colorFrom: p.colorFrom, edited: p.edited, kept: p.kept,
      where: !p.onWall || p.category === "rug" ? `In the room · ${size(Math.round(p.w * 100))} × ${size(Math.round(p.d * 100))}` : `Wall ${p.wall} · ${p.fromCm} – ${p.toCm} cm · ${size(Math.round(p.w * 100))} wide, ${size(Math.round(p.d * 100))} deep`,
      shapes: p.kept ? undefined : shapesFor(p.category), shape: p.shape, matched: p.matched ? p.described : undefined,
    })),
    ...m.extras.map((e) => ({ id: e.id, name: e.name, note: `Wall ${e.wall}`, color: e.color, colorFrom: e.colorFrom, edited: e.edited, where: e.kind === "pendant" ? "From the ceiling" : `Wall ${e.wall}` })),
  ];
}

export default function Showroom3D({ view: wanted }: { view: View }) {
  const { s, set } = useJourney();
  const edits: Edits = s.showroom?.edits ?? NO_EDITS;
  const model = useMemo(() => buildModel(s, edits), [s, edits]);
  const modelKey = useMemo(() => JSON.stringify(model), [model]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const room = useRef<Showroom | null>(null);
  const [failed, setFailed] = useState("");
  const [evening, setEvening] = useState(false);
  const [view, setView] = useState<View>(wanted);
  const [sel, setSel] = useState<string>("");
  const [saved, setSaved] = useState<"" | "browser" | "account">("");
  const latest = useRef({ model, evening });
  latest.current = { model, evening };

  useEffect(() => setView(wanted), [wanted]);

  // The room is made once per canvas, then redrawn whenever the person's data or edits change.
  useEffect(() => {
    if (!canvas.current) return;
    try {
      room.current = createShowroom(canvas.current, latest.current.model, (id) => setSel(id));
    } catch (e) {
      setFailed(e instanceof Error ? e.message : "The 3D view could not start.");
    }
    return () => { room.current?.dispose(); room.current = null; };
  }, []);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; if (!evening) return; }
    const t = window.setTimeout(() => { try { room.current?.update(latest.current.model, latest.current.evening); } catch (e) { setFailed(e instanceof Error ? e.message : "The 3D view could not be drawn."); } }, 60);
    return () => window.clearTimeout(t);
  }, [modelKey, evening]);
  useEffect(() => { room.current?.setView(view); }, [view]);

  // Save the room's style whenever it changes: with the journey in this browser, and to the account when it can.
  const layoutId = s.layouts[s.chosenLayout ?? 0]?.id;
  useEffect(() => {
    const t = window.setTimeout(() => {
      const record = buildRecord(latest.current.model, edits, layoutId);
      if (sameRecord(record, s.showroom?.record)) return;
      set((p) => ({ showroom: { edits: p.showroom?.edits ?? {}, record } }));
      setSaved("browser");
      void saveStyleRecord(s, record).then((ok) => { if (ok) setSaved("account"); });
    }, 700);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelKey, layoutId]);

  const items = useMemo(() => itemsOf(model), [model]);
  const cur = items.find((i) => i.id === sel) ?? items.find((i) => i.shapes) ?? items[0];
  const edit = (id: string, patch: { color?: string; shape?: string }) =>
    set((p) => ({ showroom: { ...(p.showroom ?? { edits: {} }), edits: { ...(p.showroom?.edits ?? {}), [id]: { ...(p.showroom?.edits?.[id] ?? {}), ...patch } } } }));
  const reset = () => set((p) => ({ showroom: { ...(p.showroom ?? { edits: {} }), edits: {} } }));
  const changed = Object.keys(edits).length;

  const swatches = useMemo(() => {
    const base = model.palette.map((p) => p.hex);
    const extra = cur && validHex(cur.color) ? [mixHex(cur.color, "#FFFFFF", 0.22), mixHex(cur.color, "#000000", 0.16)] : [];
    return Array.from(new Set([...base, ...extra, "#F4EFE7", "#2A2523"]));
  }, [model.palette, cur]);

  const order = isWall(view) ? wallOrder(model)[view] : [];
  const wallLen = isWall(view) ? Math.round((view === "A" || view === "C" ? model.room.w : model.room.l) * 100) : 0;
  const rec = s.showroom?.record;

  return (
    <div className="sr3">
      <section className="sr3-stage" aria-label="Your room in 3D">
        <canvas ref={canvas} role="img" aria-label={`Your ${model.style} room in 3D, ${Math.round(model.room.w * 100)} by ${Math.round(model.room.l * 100)} centimetres`} />
        <div className="sr3-over tr" role="group" aria-label="More views">
          <button type="button" className="sr3-v" aria-pressed={view === "doll"} onClick={() => setView(view === "doll" ? wanted : "doll")}>Dollhouse</button>
          <button type="button" className="sr3-v" aria-pressed={view === "plan"} onClick={() => setView(view === "plan" ? wanted : "plan")}>From above</button>
        </div>
        <div className="sr3-over br" role="group" aria-label="Time of day">
          <button type="button" className="sr3-v" aria-pressed={!evening} onClick={() => setEvening(false)}>Day</button>
          <button type="button" className="sr3-v" aria-pressed={evening} onClick={() => setEvening(true)}>Evening</button>
        </div>
        {isWall(view) ? (
          <div className="sr3-wall">
            <p><b>Wall {view} · {wallLen} cm</b>{order.length ? "Pieces in order, left to right as you face the wall" : "No furniture stands against this wall"}</p>
            {order.length > 0 && (
              <div className="sr3-wp">
                {order.map((p, i) => (
                  <button key={p.id} type="button" className="sr3-wb" onClick={() => setSel(p.id)}>
                    <i style={{ background: p.color }}>{i + 1}</i>
                    <span><b>{p.name} · {p.kept ? "Yours · kept" : p.shapeName}</b><small>{p.fromCm} – {p.toCm} cm · {Math.round(p.w * 100)} cm wide · {Math.round(p.h * 100)} cm high</small></span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <span className="sr3-hint">Drag to look around · tap a piece to change it</span>
        )}
        {failed && (
          <div className="sr3-msg" role="alert">
            <b>The 3D room could not start here</b>
            <span className="small">{failed}</span>
            <span className="small">It needs a browser with 3D graphics switched on. Your layout plan below still shows the room.</span>
          </div>
        )}
      </section>

      <aside className="sr3-panel" aria-label="Change your room">
        <p className="sr3-cap">Your room · from your own moodboard</p>
        <div>
          <b style={{ fontSize: 20 }}>{model.style}</b>
          <p className="small" style={{ margin: "4px 0 0" }}>
            {model.noPalette ? "Your moodboard has no colours yet, so the room is shown in neutral tones." : "Colours from your moodboard, pieces and positions from your chosen layout."}
            {model.room.example ? " The room size is an example until you confirm your measurements." : ""}
          </p>
        </div>
        {!model.noPalette && <div className="sr3-pal" aria-hidden="true">{model.palette.map((p) => <i key={p.hex + p.name} style={{ background: p.hex }} />)}</div>}

        {cur && (
          <div className="sr3-sel">
            <h3>{cur.name}</h3>
            {cur.where && <p>{cur.where}</p>}
            <p>{cur.colorFrom}{cur.matched ? ` · shape matched from “${cur.matched}”` : ""}</p>
            {!cur.kept && (
              <>
                <p className="sr3-cap">Colour · changes live</p>
                <div className="sr3-cols">
                  {swatches.map((c) => (
                    <button key={c} type="button" className="sr3-c" aria-label={`Use colour ${c}`} aria-pressed={cur.color.toUpperCase() === c.toUpperCase()} style={{ background: c }} onClick={() => edit(cur.id, { color: c })} />
                  ))}
                  <label className="sr3-any">
                    <input type="color" value={validHex(cur.color) ? cur.color : "#888888"} onChange={(e) => edit(cur.id, { color: e.target.value })} />
                    <span>Any colour</span>
                  </label>
                </div>
              </>
            )}
            {cur.shapes && cur.shapes.length > 1 && (
              <>
                <p className="sr3-cap">Shape · {cur.shapes.length} in the library</p>
                <div className="sr3-grid">
                  {cur.shapes.map((sh) => (
                    <button key={sh.id} type="button" className="sr3-b" aria-pressed={cur.shape === sh.id} onClick={() => edit(cur.id, { shape: sh.id })}>
                      <span><b>{sh.name}</b><small>{sh.note}</small></span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {cur.kept && <p>This piece is yours and stays as it is. Everything else is arranged around it.</p>}
          </div>
        )}

        <p className="sr3-cap">Everything in your room</p>
        <div className="sr3-grid">
          {items.map((it) => (
            <button key={it.id} type="button" className="sr3-b" aria-pressed={cur?.id === it.id} onClick={() => setSel(it.id)}>
              <i style={{ background: it.color }} />
              <span><b>{it.name}</b><small>{it.edited ? "Changed by you" : it.note}</small></span>
            </button>
          ))}
        </div>

        <div className="sr3-save" role="status">
          <span>{saved === "account" ? "Style saved to your project" : saved === "browser" || rec ? "Style saved on this device" : "Saving your style…"}{changed ? ` · ${changed} changed by you` : ""}</span>
          {changed > 0 && <button type="button" className="sr3-link" onClick={reset}>Reset to my moodboard</button>}
        </div>

        {rec && (
          <details>
            <summary className="sr3-cap" style={{ cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>Saved style · exact values</summary>
            {rec.palette.map((p) => (
              <div key={p.hex + p.name} className="sr3-rec"><i style={{ background: p.hex }} /><div><b>{p.name}</b> <code>{p.hex}</code><span>{[p.role, p.use].filter(Boolean).join(" · ")}</span></div></div>
            ))}
            {[...rec.surfaces, ...rec.extras].map((e) => (
              <div key={e.id} className="sr3-rec"><i style={{ background: e.color }} /><div><b>{e.name}</b> <code>{e.color}</code><span>{e.colorFrom}</span></div></div>
            ))}
            {rec.elements.map((e) => (
              <div key={e.id} className="sr3-rec">
                <i style={{ background: e.color }} />
                <div>
                  <b>{e.name}</b> <code>{e.color}</code>
                  <span>{e.colorFrom}</span>
                  <span>{e.shapeName}{e.material ? ` · ${e.material}` : ""} · {e.onWall ? `Wall ${e.wall}, ${e.fromCm} – ${e.toCm} cm` : "In the room"} · {e.widthCm} × {e.depthCm} × {e.heightCm} cm</span>
                </div>
              </div>
            ))}
          </details>
        )}
      </aside>
    </div>
  );
}
