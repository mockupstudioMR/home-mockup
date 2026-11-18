/**
 * One wall's layered photograph, like the showroom: a hotspot on every item; tapping it opens the item's
 * options (its main option and two alternatives) and swaps the layer on the spot. The person's choices are
 * kept with the journey. Reads the wall's manifest (background, and per item its aligned variation layers).
 */
import { useEffect, useMemo, useState } from "react";
import { useJourney, type Wall } from "../state";
import type { WallScene } from "./runner";

type Layer = {
  title: string; group: string; order: number;
  variations: string[]; thumbnails?: string[]; variationNames?: string[];
  /** Shown for an item that can't be swapped (yet): it is still clickable. */
  note?: string;
  hotspot?: { position: { x: number; y: number } };
};
type Manifest = { background: string; imageSize: { width: number; height: number }; layers: Record<string, Layer>; hotspots?: Record<string, Layer> };

const cache = new Map<string, Promise<Manifest>>();
function loadManifest(url: string) {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url).then((r) => { if (!r.ok) throw new Error("This wall's picture could not be loaded."); return r.json() as Promise<Manifest>; });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}

export function LayeredWall({ wall, scene }: { wall: Wall; scene: WallScene }) {
  const { s, set } = useJourney();
  const [m, setM] = useState<Manifest | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [hide, setHide] = useState(false);
  useEffect(() => {
    let live = true;
    setM(null); setErr("");
    // items with nothing to swap come as plain hotspots: shown with the layers, so every item is clickable
    if (scene.manifestUrl) loadManifest(scene.manifestUrl).then((x) => live && setM({ ...x, layers: { ...(x.hotspots ?? {}), ...x.layers } }), (e: Error) => live && setErr(e.message));
    return () => { live = false; };
  }, [scene.manifestUrl]);

  const picks = s.showroom?.picks?.[wall] ?? {};
  const pick = (name: string, i: number) => set((p) => ({
    showroom: { ...(p.showroom ?? { edits: {} }), edits: p.showroom?.edits ?? {}, picks: { ...(p.showroom?.picks ?? {}), [wall]: { ...(p.showroom?.picks?.[wall] ?? {}), [name]: i } } },
  }));
  const layers = useMemo(() => (m ? Object.entries(m.layers).sort((a, b) => a[1].order - b[1].order) : []), [m]);

  // Fetch every variation once, so a swap shows at once.
  useEffect(() => { for (const [, l] of layers) for (const v of l.variations) { const img = new Image(); img.src = v; } }, [layers]);

  if (err) return <div className="lw-msg" role="alert"><p className="p">{err}</p></div>;
  if (!m) return <div className="lw-msg" role="status"><p className="p">Loading your wall…</p></div>;
  const { width: W, height: H } = m.imageSize;
  const cur = open ? m.layers[open] : null;
  const changed = layers.filter(([n]) => (picks[n] ?? 0) > 0).length;

  return (
    <div className="lw">
      <div className="lw-stage" style={{ aspectRatio: `${W} / ${H}` }}>
        <img className="lw-img" src={m.background} alt={`Wall ${wall}, as a photograph`} />
        {layers.filter(([, l]) => l.variations.length > 0).map(([name, l]) => (
          <img key={name} className="lw-img" src={l.variations[Math.min(picks[name] ?? 0, l.variations.length - 1)]} alt="" aria-hidden="true" />
        ))}
        {!hide && layers.map(([name, l]) => l.hotspot && (
          <button key={name} type="button" className={`lw-hs${open === name ? " on" : ""}${(picks[name] ?? 0) > 0 ? " chg" : ""}`}
            style={{ left: `${(l.hotspot.position.x / W) * 100}%`, top: `${(l.hotspot.position.y / H) * 100}%` }}
            aria-label={`${l.title}: change`} aria-pressed={open === name} onClick={() => setOpen(open === name ? null : name)}>
            <span />
          </button>
        ))}
        {open && cur?.hotspot && !hide && (
          <span className="lw-label" style={{ left: `${(cur.hotspot.position.x / W) * 100}%`, top: `${(cur.hotspot.position.y / H) * 100}%` }}>{cur.title}</span>
        )}
      </div>
      <div className="lw-bar">
        <div className="lw-tabs" role="group" aria-label="Pieces on this wall">
          {layers.map(([name, l]) => (
            <button key={name} type="button" className={`lw-tab${open === name ? " on" : ""}`} aria-pressed={open === name} onClick={() => setOpen(open === name ? null : name)}>
              {l.title}{(picks[name] ?? 0) > 0 ? " ·" : ""}
            </button>
          ))}
        </div>
        <div className="lw-tools">
          <button type="button" className="lw-tab" aria-pressed={hide} onClick={() => setHide(!hide)}>{hide ? "Show dots" : "Hide dots"}</button>
          {changed > 0 && <button type="button" className="lw-tab" onClick={() => set((p) => ({ showroom: { ...(p.showroom ?? { edits: {} }), edits: p.showroom?.edits ?? {}, picks: { ...(p.showroom?.picks ?? {}), [wall]: {} } } }))}>Back to my preview</button>}
        </div>
      </div>
      {open && cur && !cur.variations.length && (
        <div className="lw-opts" role="note" aria-label={cur.title}>
          <p className="p"><b>{cur.title}</b>{cur.variationNames?.[0] ? ` · ${cur.variationNames[0]}` : ""}. {cur.note}</p>
        </div>
      )}
      {open && cur && cur.variations.length > 0 && (
        <div className="lw-opts" role="group" aria-label={`${cur.title}: options`}>
          {cur.variations.map((_, i) => (
            <button key={i} type="button" className={`lw-opt${(picks[open] ?? 0) === i ? " on" : ""}`} aria-pressed={(picks[open] ?? 0) === i} onClick={() => pick(open, i)}>
              {cur.thumbnails?.[i] ? <img src={cur.thumbnails[i]} alt="" /> : <i />}
              <span><small>{i === 0 ? "Main option" : `Alternative ${i}`}</small><b>{cur.variationNames?.[i] ?? `Option ${i + 1}`}</b></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
