/**
 * One wall's layered photograph, like the showroom: a hotspot on every item; tapping it opens the item's
 * options (its main option and two alternatives) and swaps the layer on the spot. The person's choices are
 * kept with the journey. Reads the wall's manifest (background, and per item its aligned variation layers).
 *
 * A "pro" manifest is built the Generator PRO way: the background is the empty room and every piece is drawn
 * over it as a shadow image (multiply) and the piece on black (lighten), so a piece brings its own contact
 * shadow and none of the wall behind it. Like PRO's renderer, everything is drawn on one canvas once all its
 * pictures are loaded (no half-drawn wall while they come in), and a picture that fails to load is left out
 * instead of breaking the wall. "Confirm options" flattens the same drawing into one final picture, which
 * then shows instead of the outline.
 *
 * Some items are one choice for the whole room: the floor (the same on every wall) and the dining chairs (all
 * alike). Choosing one on any picture changes it on every picture, walls made later included, and the options
 * say so (`linked` in the journey, matched by option name).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useJourney, type JourneyState } from "../state";
import { LINK_NOTE, diningChairs, linkOf, setLinked, type Link } from "./linkedChoices";
import { storeDesignImage } from "../services";
import { saveConfirmed } from "./composition";
import type { Pic, WallScene } from "./runner";

type Layer = {
  title: string; group: string; order: number;
  variations: string[]; thumbnails?: string[]; variationNames?: string[];
  /** Shown for an item that can't be swapped (yet): it is still clickable. */
  note?: string;
  hotspot?: { position: { x: number; y: number } };
  /** One shadow image per variation, multiplied under the piece. "pro": the piece is on black and drawn with
   *  lighten, as Generator PRO does; "shadow" (pictures of version 13–14): the piece is laid on normally. */
  blend?: "pro" | "shadow"; shadows?: string[];
};
type Manifest = { mode?: "pro"; background: string; imageSize: { width: number; height: number }; layers: Record<string, Layer>; hotspots?: Record<string, Layer> };

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

export function LayeredWall({ wall, scene }: { wall: Pic; scene: WallScene }) {
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

  const chairs = useMemo(() => diningChairs(s), [s]);
  const linked = s.showroom?.linked ?? {};
  // this picture's choices, with the room-wide ones (floor, dining chairs) applied, walls made later included
  const picks: Record<string, number> = { ...(s.showroom?.picks?.[wall] ?? {}) };
  if (m) for (const [n, l] of Object.entries(m.layers)) {
    const k = linkOf(n, chairs), c = k ? linked[k] : undefined;
    if (!c || !l.variations.length) continue;
    // by name; a picture without names (older ones) by position; an option this picture lacks: its main one
    picks[n] = c.index === 0 ? 0 : l.variationNames ? Math.max(0, l.variationNames.indexOf(c.name)) : Math.min(c.index, l.variations.length - 1);
  }
  const pick = (name: string, i: number) => {
    const k = linkOf(name, chairs);
    if (k) return set((p) => setLinked(p, k, chairs, { name: m?.layers[name]?.variationNames?.[i] ?? "", index: i, from: wall }));
    set((p) => ({
      showroom: { ...(p.showroom ?? { edits: {} }), edits: p.showroom?.edits ?? {}, picks: { ...(p.showroom?.picks ?? {}), [wall]: { ...(p.showroom?.picks?.[wall] ?? {}), [name]: i } } },
    }));
  };
  const backToPreview = () => set((p) => {
    // the room-wide choices on this picture go back for the whole room too
    let next: JourneyState = p;
    for (const k of new Set(layers.map(([n]) => linkOf(n, chairs)).filter((x): x is Link => !!x))) next = { ...next, ...setLinked(next, k, chairs, null) } as JourneyState;
    return { showroom: { ...(next.showroom ?? { edits: {} }), edits: next.showroom?.edits ?? {}, picks: { ...(next.showroom?.picks ?? {}), [wall]: {} } } };
  });
  const layers = useMemo(() => (m ? Object.entries(m.layers).sort((a, b) => a[1].order - b[1].order) : []), [m]);

  // Fetch every variation once, so a swap shows at once.
  useEffect(() => { for (const [, l] of layers) { for (const v of l.variations) void picture(v); for (const v of l.shadows ?? []) void picture(v); } }, [layers]);

  if (err) return <div className="lw-msg" role="alert"><p className="p">{err}</p></div>;
  if (!m) return <div className="lw-msg" role="status"><p className="p">Loading your wall…</p></div>;
  const { width: W, height: H } = m.imageSize;
  const cur = open ? m.layers[open] : null;
  const changed = layers.filter(([n]) => (picks[n] ?? 0) > 0).length;
  const pro = m.mode === "pro";
  // pro: the room is empty, so every layer is drawn with its chosen option; otherwise only the swapped ones
  const shown = layers.filter(([n, l]) => l.variations.length > 0 && (pro || ((picks[n] ?? 0) > 0 && l.variations.length > 1)));
  const at = (n: string, l: Layer) => Math.min(picks[n] ?? 0, l.variations.length - 1);
  const final = s.showroom?.final?.[wall];
  const same = !!final && final.scene === scene.manifestUrl && JSON.stringify(final.picks) === JSON.stringify(picks);

  return (
    <div className="lw">
      <div className="lw-stage" style={{ aspectRatio: `${W} / ${H}`, isolation: "isolate" }}>
        <WallCanvas m={m} layers={shown} at={at} label={wall === "room" ? "Your whole room, as a photograph" : `Wall ${wall}, as a photograph`} />
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
              {l.title}{(picks[name] ?? 0) > 0 ? " ·" : ""}{linkOf(name, chairs) ? <small className="lw-link" title={LINK_NOTE[linkOf(name, chairs)!]}> · all walls</small> : null}
            </button>
          ))}
        </div>
        <div className="lw-tools">
          <button type="button" className="lw-tab" aria-pressed={hide} onClick={() => setHide(!hide)}>{hide ? "Show dots" : "Hide dots"}</button>
          <ConfirmButton wall={wall} sceneUrl={scene.manifestUrl ?? ""} m={m} layers={shown} at={at} picks={picks} done={same} />
          {changed > 0 && <button type="button" className="lw-tab" onClick={backToPreview}>Back to my preview</button>}
        </div>
      </div>
      {open && cur && !cur.variations.length && (
        <div className="lw-opts" role="note" aria-label={cur.title}>
          <p className="p"><b>{cur.title}</b>{cur.variationNames?.[0] ? ` · ${cur.variationNames[0]}` : ""}. {cur.note}</p>
        </div>
      )}
      {open && cur && cur.variations.length > 0 && linkOf(open, chairs) && (
        <p className="lw-linknote small" role="note">
          {LINK_NOTE[linkOf(open, chairs)!]}
          {(() => { const c = linked[linkOf(open, chairs)!]; return c && c.from !== wall ? ` Chosen on ${c.from === "room" ? "the whole-room picture" : `wall ${c.from}`}.` : ""; })()}
        </p>
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

/** Flattens the chosen options into one picture (as the showroom draws them) and keeps it with the journey. */
function ConfirmButton({ wall, sceneUrl, m, layers, at, picks, done }: { wall: Pic; sceneUrl: string; m: Manifest; layers: [string, Layer][]; at: (n: string, l: Layer) => number; picks: Record<string, number>; done: boolean }) {
  const { s, set } = useJourney();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const confirm = async () => {
    setBusy(true); setErr("");
    try {
      const url = await flatten(m, layers, at);
      set((p) => ({
        showroom: { ...(p.showroom ?? { edits: {} }), edits: p.showroom?.edits ?? {}, final: { ...(p.showroom?.final ?? {}), [wall]: { url, scene: sceneUrl, picks: { ...picks }, at: new Date().toISOString() } } },
      }));
      if (wall !== "room") void saveConfirmed(s, wall, picks, url);
    } catch {
      setErr("The final picture could not be made. Try again.");
    } finally { setBusy(false); }
  };
  return (
    <>
      <button type="button" className={`lw-tab lw-confirm${done ? " on" : ""}`} disabled={busy || done} onClick={confirm} aria-live="polite">
        {busy ? "Saving…" : done ? "✓ Options confirmed" : "Confirm options"}
      </button>
      {err && <span className="small" role="alert">{err}</span>}
    </>
  );
}

function img(src: string) {
  return new Promise<HTMLImageElement>((ok, no) => {
    const i = new Image(); i.crossOrigin = "anonymous";
    i.onload = () => ok(i); i.onerror = () => no(new Error("image")); i.src = src;
  });
}

const pictures = new Map<string, Promise<HTMLImageElement | null>>();
/** A picture, loaded once; null if it can't be loaded (that layer is then left out, never the whole wall). */
function picture(src: string) {
  let p = pictures.get(src);
  if (!p) {
    p = img(src).catch(() => { pictures.delete(src); return null; });
    pictures.set(src, p);
  }
  return p;
}

/** In which order the layers are drawn. A wall colour made by the older pictures (order 1000, over everything)
 *  goes right over the background, so it never paints over a swapped piece. */
const drawOrder = (name: string, l: Layer) => (name === "walls" && !l.shadows?.length && l.order >= 1000 ? 0.5 : l.order);

/**
 * Draw the wall the way Generator PRO's renderer does: the background, then every layer in order — its shadow
 * with multiply (optional: drawn only if it loads), then the piece (lighten when it is on black, else normally).
 * Every picture is loaded first, so the canvas is drawn in one go.
 */
async function drawWall(g: CanvasRenderingContext2D, m: Manifest, layers: [string, Layer][], at: (n: string, l: Layer) => number) {
  const { width: W, height: H } = m.imageSize;
  const sorted = [...layers].sort((a, b) => drawOrder(...a) - drawOrder(...b));
  const [bg, ...loaded] = await Promise.all([
    picture(m.background),
    ...sorted.map(async ([n, l]) => {
      const i = at(n, l);
      const [shadow, colour] = await Promise.all([l.shadows?.length ? picture(l.shadows[Math.min(i, l.shadows.length - 1)]) : null, picture(l.variations[i])]);
      return { l, shadow, colour };
    }),
  ]);
  if (!bg) throw new Error("This wall's picture could not be loaded.");
  g.globalCompositeOperation = "source-over";
  g.clearRect(0, 0, W, H);
  g.drawImage(bg, 0, 0, W, H);
  for (const { l, shadow, colour } of loaded) {
    if (!colour) continue;
    if (shadow) {
      g.globalCompositeOperation = "multiply";
      g.drawImage(shadow, 0, 0, W, H);
    }
    // a piece on black is always lightened (drawn normally its black surround would cover the room)
    g.globalCompositeOperation = l.blend === "pro" ? "lighten" : "source-over";
    g.drawImage(colour, 0, 0, W, H);
    g.globalCompositeOperation = "source-over";
  }
}

/** The wall on one canvas. The last finished drawing stays up until the next one is ready, so a swap never flickers. */
function WallCanvas({ m, layers, at, label }: { m: Manifest; layers: [string, Layer][]; at: (n: string, l: Layer) => number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [err, setErr] = useState("");
  const { width: W, height: H } = m.imageSize;
  const key = JSON.stringify(layers.map(([n, l]) => [n, at(n, l)]));
  useEffect(() => {
    let live = true;
    const off = document.createElement("canvas"); off.width = W; off.height = H;
    drawWall(off.getContext("2d")!, m, layers, at).then(() => {
      const c = ref.current;
      if (!live || !c) return;
      c.width = W; c.height = H;
      c.getContext("2d")!.drawImage(off, 0, 0);
      setErr("");
    }, (e: Error) => live && setErr(e.message));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` stands for the layers and the picks
  }, [m, key, W, H]);
  return (
    <>
      <canvas ref={ref} className="lw-img" width={W} height={H} role="img" aria-label={label} />
      {err && <p className="lw-err small" role="alert">{err}</p>}
    </>
  );
}

async function flatten(m: Manifest, layers: [string, Layer][], at: (n: string, l: Layer) => number) {
  const { width: W, height: H } = m.imageSize;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  await drawWall(c.getContext("2d")!, m, layers, at);
  const url = await storeDesignImage(c.toDataURL("image/jpeg", 0.9));
  if (!/^https:/.test(url)) throw new Error("upload");
  return url;
}
