/** Step 4 — Your layout: how we get the room, its shape and scale, two layouts, summary. */
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { Back, Go, Opt, Screen, useGo } from "../Shell";
import { I, Ic } from "../icons";
import { roomName } from "../data";
import { curRoom, uid, useJourney, type FixedKind, type JourneyState, type Layout, type Placement, type Wall } from "../state";
import { StepSummary } from "../Summary";
import { analyzePlan, makeLayout, uploadPhoto } from "../services";
import { list, soFar } from "../story";
import { saveStepDone } from "../sync";
import { placementLabel } from "./Step3";

const p = (d: string) => <path d={d} />;
const EX_W = 3.75;
const EX_L = 4.9;
export const roomSize = (s: JourneyState) => ({ w: s.room.widthM ?? EX_W, l: s.room.lengthM ?? EX_L, example: !s.room.confirmed });
const m = (n: number) => n.toFixed(2);

/** 4.1 · Show us the room */
export function RoomInput() {
  const { s, set } = useJourney();
  const go = useGo();
  const { toast } = useToast();
  const planIn = useRef<HTMLInputElement>(null);
  const photosIn = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const plan = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    setBusy("Reading your plan…");
    try {
      const url = await uploadPhoto(f);
      const read = await analyzePlan(url).catch(() => null);
      set((x) => ({ room: { ...x.room, input: "plan", planImage: url, ...(read ? { widthM: read.widthM, lengthM: read.lengthM } : {}), confirmed: false }, layouts: [], chosenLayout: undefined }));
      go("S4-Measure");
    } catch (e) {
      toast({ title: "The plan didn't upload", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };
  const photos = async (files: FileList | null) => {
    const list = Array.from(files ?? []).slice(0, 6);
    if (!list.length) return;
    setBusy("Uploading your photos…");
    try {
      const urls: string[] = [];
      for (const f of list) urls.push(await uploadPhoto(f));
      set((x) => ({ room: { ...x.room, input: "photos", wallPhotos: [...x.room.wallPhotos, ...urls] }, layouts: [], chosenLayout: undefined }));
      go("S4-Measure");
    } catch (e) {
      toast({ title: "A photo didn't upload", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };
  const tick = (t: string) => (
    <li>
      <I.check />
      {t}
    </li>
  );
  return (
    <Screen board="S4-Input" step={4} right={roomName(curRoom(s))} wrapStyle={{ maxWidth: "1120px" }}>
      <p className="eyebrow">Choose where life happens</p>
      <h1 className="h1">Show us the room</h1>
      <p className="sub">{busy ?? "Now we fit your direction to the real space. Pick whichever is easiest."}</p>
      <div className="g2" style={{ marginTop: "52px" }}>
        <Opt tint="a" className="left-al ri" sel={(s.room.input ?? "plan") === "plan"} onClick={() => planIn.current?.click()}>
          <span className="tile">
            <Ic>{p("M3 3h18v18H3zM3 12h7v9M14 3v6h7")}</Ic>
          </span>
          <span className="stack" style={{ gap: "18px" }}>
            <span className="opt-t">Upload a floorplan</span>
            <ul>
              {tick("PDF, photo or screenshot from your agent")}
              {tick("Tell us one real measurement to set the scale")}
            </ul>
          </span>
          <span className="tag" style={{ background: "#F5F1EC" }}>
            Quickest · about 2 min
          </span>
        </Opt>
        <Opt tint="b" className="left-al ri" sel={s.room.input === "photos"} onClick={() => photosIn.current?.click()}>
          <span className="tile">
            <I.camera />
          </span>
          <span className="stack" style={{ gap: "18px" }}>
            <span className="opt-t">Photos + measurements</span>
            <ul>
              {tick("One photo of each wall, from the opposite corner")}
              {tick("Length and width with a tape measure")}
            </ul>
          </span>
          <span className="tag" style={{ background: "#F5F1EC" }}>
            No plan needed · about 5 min
          </span>
        </Opt>
      </div>
      <input ref={planIn} type="file" accept="image/*,application/pdf" hidden onChange={(e) => void plan(e.target.files)} />
      <input ref={photosIn} type="file" accept="image/*" multiple hidden onChange={(e) => void photos(e.target.files)} />
      <Go className="draw" to="S4-Measure" onClick={() => void set((x) => ({ room: { ...x.room, input: "draw" } }))}>
        <span className="tile sm" style={{ width: "56px", height: "56px" }}>
          <I.ruler />
        </span>
        <span className="stack" style={{ gap: "2px" }}>
          <b style={{ fontSize: "18px" }}>No plan or photos right now?</b>
          <span className="small">Draw the room shape and type in rough sizes — you can refine it later.</span>
        </span>
        <Ic style={{ marginLeft: "auto" }}>{p("M5 12h14M13 6l6 6-6 6")}</Ic>
      </Go>
      <div className="actions">
        <Back to="S3-Fixed" />
      </div>
    </Screen>
  );
}

const TOOLS: { kind: FixedKind; label: string; icon: () => JSX.Element }[] = [
  { kind: "windows", label: "Window", icon: () => <Ic><rect x="4" y="3" width="16" height="18" rx="1" />{p("M12 3v18M4 12h16")}</Ic> },
  { kind: "doors", label: "Door", icon: () => <Ic>{p("M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18M14 12h.01")}</Ic> },
  { kind: "radiators", label: "Radiator", icon: () => <Ic>{p("M4 6h16v12H4zM8 6v12M12 6v12M16 6v12")}</Ic> },
  { kind: "columns", label: "Column", icon: () => <Ic>{p("M7 3h10M7 21h10M9 3v18M15 3v18")}</Ic> },
];

/** Where an opening or feature sits on the big plan, in px inside a room of size W×H with border t. */
function featureStyle(pl: Placement, W: number, H: number, t: number): CSSProperties[] {
  const pos = (pl.pos ?? 50) / 100;
  const along = (len: number, total: number) => Math.round((total - len) * pos);
  const wall = pl.wall!;
  if (pl.kind === "windows") {
    const len = Math.min(180, (wall === "A" || wall === "C" ? W : H) * 0.4);
    const base: CSSProperties = { position: "absolute", background: "#9FC3D6", borderLeft: "3px solid #3B3350", borderRight: "3px solid #3B3350" };
    if (wall === "C") return [{ ...base, bottom: -t, left: along(len, W), width: len, height: t }];
    if (wall === "A") return [{ ...base, top: -t, left: along(len, W), width: len, height: t }];
    if (wall === "B") return [{ ...base, right: -t, top: along(len, H), width: t, height: len, borderLeft: 0, borderRight: 0, borderTop: "3px solid #3B3350", borderBottom: "3px solid #3B3350" }];
    return [{ ...base, left: -t, top: along(len, H), width: t, height: len, borderLeft: 0, borderRight: 0, borderTop: "3px solid #3B3350", borderBottom: "3px solid #3B3350" }];
  }
  if (pl.kind === "doors") {
    const len = 90;
    const gap: CSSProperties = { position: "absolute", background: "#F6F0EB" };
    const sw: CSSProperties = { position: "absolute", width: len, height: len, borderTop: "2px solid #665A85", borderRight: "2px dashed #B4A9C4" };
    if (wall === "D") return [{ ...gap, left: -t, top: along(len, H), width: t, height: len }, { ...sw, left: 0, top: along(len, H), borderRadius: "0 90px 0 0" }];
    if (wall === "B") return [{ ...gap, right: -t, top: along(len, H), width: t, height: len }, { ...sw, right: 0, top: along(len, H), borderTop: "2px solid #665A85", borderRight: 0, borderLeft: "2px dashed #B4A9C4", borderRadius: "90px 0 0 0" }];
    if (wall === "A") return [{ ...gap, top: -t, left: along(len, W), width: len, height: t }, { ...sw, top: 0, left: along(len, W), borderTop: 0, borderLeft: "2px solid #665A85", borderBottom: "2px dashed #B4A9C4", borderRight: 0, borderRadius: "0 0 0 90px" }];
    return [{ ...gap, bottom: -t, left: along(len, W), width: len, height: t }, { ...sw, bottom: 0, left: along(len, W), borderTop: 0, borderRight: 0, borderLeft: "2px solid #665A85", borderBottom: "2px dashed #B4A9C4", borderRadius: "0 90px 0 0" }];
  }
  const big = pl.kind === "radiators" ? { l: 120, t: 14 } : { l: 26, t: 26 };
  const color = pl.kind === "radiators" ? { background: "#C9BBA9", border: "1px solid #9E8E7A" } : { background: "#3B3350" };
  const s: CSSProperties = { position: "absolute", borderRadius: 4, ...color };
  if (wall === "C") return [{ ...s, bottom: 6, left: along(big.l, W), width: big.l, height: big.t }];
  if (wall === "A") return [{ ...s, top: 6, left: along(big.l, W), width: big.l, height: big.t }];
  if (wall === "B") return [{ ...s, right: 6, top: along(big.l, H), width: big.t, height: big.l }];
  return [{ ...s, left: 6, top: along(big.l, H), width: big.t, height: big.l }];
}

/** 4.2 · Room shape & scale */
export function Measure() {
  const { s, set } = useJourney();
  const { toast } = useToast();
  const { w, l, example } = roomSize(s);
  const [zoom, setZoom] = useState(1);
  const [active, setActive] = useState<string | null>(null);
  const roomRef = useRef<HTMLDivElement>(null);
  const ref = s.room.scaleRef ?? "Wall A length";
  const pl = s.placements;
  const current = pl.find((x) => x.id === active) ?? pl.find((x) => !x.wall);
  // fit the room (inside its 10 px walls) in 420 × 555, as on the design board
  const k = Math.min(420 / w, 555 / l);
  const W = Math.round(w * k), H = Math.round(l * k);

  const setRoom = (patch: Partial<JourneyState["room"]>) => set((x) => ({ room: { ...x.room, ...patch }, layouts: [], chosenLayout: undefined }));
  const known = ref === "Wall A length" ? s.room.widthM ?? EX_W : ref === "Wall B length" ? s.room.lengthM ?? EX_L : 0.9;
  const setKnown = (v: number) => {
    if (!v || v <= 0) return;
    if (ref === "Wall A length") setRoom({ lengthM: +(v * (l / w)).toFixed(2), widthM: v, confirmed: true });
    else if (ref === "Wall B length") setRoom({ widthM: +(v * (w / l)).toFixed(2), lengthM: v, confirmed: true });
    else setRoom({ widthM: +((w * v) / 0.9).toFixed(2), lengthM: +((l * v) / 0.9).toFixed(2), confirmed: true });
  };
  const addTool = (kind: FixedKind) =>
    set((x) => {
      const n = x.placements.filter((y) => y.kind === kind).length + 1;
      const id = uid();
      setActive(id);
      return { placements: [...x.placements, { id, kind, n }], fixedCounts: { ...x.fixedCounts, [kind]: n } };
    });
  const place = (e: MouseEvent<HTMLDivElement>) => {
    if (!current) return;
    const r = roomRef.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const d = { A: y, C: 1 - y, D: x, B: 1 - x };
    const wall = (Object.entries(d) as [Wall, number][]).sort((a, b) => a[1] - b[1])[0][0];
    const pos = Math.round(Math.min(1, Math.max(0, wall === "A" || wall === "C" ? x : y)) * 100);
    set((xx) => ({ placements: xx.placements.map((q) => (q.id === current.id ? { ...q, wall, pos } : q)), layouts: [], chosenLayout: undefined }));
    setActive(null);
  };
  const line = (x: Placement) => {
    const lab = placementLabel(x, pl);
    if (!x.wall) return `${lab} · drag onto a wall`;
    if (x.kind === "radiators" && pl.some((y) => y.kind === "windows" && y.wall === x.wall)) return `${lab} · under window`;
    return `${lab} · wall ${x.wall}`;
  };
  const ORDER: FixedKind[] = ["windows", "radiators", "doors", "columns"];
  const shown = pl.filter((x) => ORDER.includes(x.kind)).sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind) || a.n - b.n);
  return (
    <Screen board="S4-Measure" step={4} right={roomName(curRoom(s))} wrapClass="wrap wide">
      <div className="left">
        <p className="eyebrow">Choose where life happens</p>
        <h1 className="h1" style={{ fontSize: "clamp(36px,4vw,56px)" }}>
          Check the shape, place what's fixed
        </h1>
        <p className="sub" style={{ fontSize: "19px" }}>
          {s.room.input === "plan" ? "We traced your plan. Drag the features you counted onto the right walls." : "Here's your room's shape. Type its sizes and drag the features you counted onto the right walls."}
        </p>
      </div>
      <div className="split" style={{ marginTop: "32px" }}>
        <div className="main">
          <div className="board" role="img" aria-label={`Floor plan of the ${roomName(curRoom(s)).toLowerCase()} with walls A to D`}>
            <div style={{ position: "absolute", inset: 0, transform: `scale(${zoom})`, transformOrigin: "50% 50%" }}>
              <div className="room" ref={roomRef} style={{ width: W + 20, height: H + 20, boxSizing: "border-box", cursor: current ? "crosshair" : undefined }} onClick={place}>
                {shown.filter((x) => x.wall).flatMap((x) => featureStyle(x, W, H, 10).map((st, i) => <div key={x.id + i} style={st} />))}
                <span className="wl" style={{ left: "50%", top: "-48px", transform: "translateX(-50%)" }}>A</span>
                <span className="wl" style={{ right: "-54px", top: "45%" }}>B</span>
                <span className="wl" style={{ left: "50%", bottom: "-54px", transform: "translateX(-50%)" }}>C</span>
                <span className="wl" style={{ left: "-54px", top: "45%" }}>D</span>
              </div>
              <span className="dim" style={{ left: "50%", top: `${Math.max(8, 330 - (H + 20) / 2 - 41)}px`, transform: "translateX(-50%)" }}>
                {m(w)} m{example ? " · example" : ""}
              </span>
              <span className="dim" style={{ right: `calc(50% - ${(W + 20) / 2 + 110}px)`, top: "50%", transform: "translateY(-50%) rotate(90deg)" }}>
                {m(l)} m{example ? " · example" : ""}
              </span>
            </div>
            {current && <span className="pin">Place {placementLabel(current, pl).toLowerCase()}</span>}
            <div className="tools">
              {TOOLS.map((t) => (
                <button type="button" key={t.kind} onClick={() => addTool(t.kind)}>
                  <t.icon />
                  {t.label}
                </button>
              ))}
            </div>
            <div className="zoom">
              <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}>
                −
              </button>
              <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}>
                +
              </button>
            </div>
          </div>
        </div>
        <aside className="rail">
          <div className="rail-card">
            <h2 className="h3">Scale</h2>
            <div className="field">
              <label htmlFor="ref">A measurement you know</label>
              <select id="ref" className="select" value={ref} onChange={(e) => set((x) => ({ room: { ...x.room, scaleRef: e.target.value } }))}>
                <option>Wall A length</option>
                <option>Wall B length</option>
                <option>Door width</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="len">Length</label>
              <div className="unit">
                <input id="len" className="input" inputMode="decimal" defaultValue={m(known)} key={ref + known} onBlur={(e) => setKnown(parseFloat(e.target.value.replace(",", ".")))} />
                <span>m</span>
              </div>
            </div>
            {s.room.input !== "plan" && (
              <div className="field">
                <label htmlFor="wid">Width · wall {ref === "Wall B length" ? "A" : "B"}</label>
                <div className="unit">
                  <input
                    id="wid"
                    className="input"
                    inputMode="decimal"
                    defaultValue={m(ref === "Wall B length" ? w : l)}
                    key={`w${w}${l}`}
                    onBlur={(e) => {
                      const v = parseFloat(e.target.value.replace(",", "."));
                      if (v > 0) setRoom(ref === "Wall B length" ? { widthM: v, confirmed: true } : { lengthM: v, confirmed: true });
                    }}
                  />
                  <span>m</span>
                </div>
              </div>
            )}
            <div className="field">
              <label htmlFor="ceil">Ceiling height</label>
              <div className="unit">
                <input id="ceil" className="input" placeholder="e.g. 2.70" inputMode="decimal" defaultValue={s.room.ceilingM ? m(s.room.ceilingM) : ""} onBlur={(e) => set((x) => ({ room: { ...x.room, ceilingM: parseFloat(e.target.value.replace(",", ".")) || undefined } }))} />
                <span>m</span>
              </div>
            </div>
            <p className="small" style={{ margin: "0" }}>
              {example ? "Sizes shown are examples until you confirm them." : "Sizes confirmed — layouts use them."}
            </p>
            <hr className="divider" />
            <h2 className="h3">Fixed features</h2>
            <div>
              {shown.length ? (
                shown.map((x) => (
                  <div className="ck" key={x.id} onClick={() => !x.wall && setActive(x.id)} style={{ cursor: x.wall ? undefined : "pointer" }}>
                    <i className={x.wall ? "y" : "n"}>{x.wall ? "✓" : "!"}</i>
                    {line(x)}
                  </div>
                ))
              ) : (
                <div className="ck">
                  <i className="n">!</i>No windows or doors yet — add them with the tools
                </div>
              )}
            </div>
            <Go
              className="btn"
              to="S4-Layouts"
              style={{ minHeight: "64px", fontSize: "19px" }}
              onClick={() => {
                if (!shown.some((x) => x.kind === "doors" && x.wall)) toast({ title: "Tip: place at least one door", description: "Layouts keep a clear route from the door." });
              }}
            >
              Show me layouts
              <I.next />
            </Go>
            <Go className="link-btn" to="S4-Input" style={{ justifyContent: "center" }}>
              {s.room.input === "plan" ? "Upload a different plan" : "Upload a plan instead"}
            </Go>
          </div>
        </aside>
      </div>
      {s.room.input === "photos" && s.room.wallPhotos.length > 0 && (
        <div className="row" style={{ marginTop: "20px", gap: "10px" }}>
          {s.room.wallPhotos.map((src) => (
            <img key={src} src={src} alt="Wall photo" style={{ width: 96, height: 72, objectFit: "cover", borderRadius: 12 }} />
          ))}
        </div>
      )}
    </Screen>
  );
}

const KIND_COLOR: Record<string, string> = { sofa: "#6E3550", chair: "#2F5B4A", keep: "#4A3022", table: "#8A6A4A", storage: "#7A6656", bed: "#6E3550", desk: "#8A6A4A", other: "#9E8E7A" };
const KIND_CLASS: Record<string, string> = { sofa: "sofa", chair: "chair", keep: "piano", table: "ctbl", rug: "rug", bench: "bench" };

/** A layout drawn on the room, in a box of the given size. */
export function PlanDrawing({ layout, s, box = { w: 300, h: 392 }, t = 8, mini = false }: { layout: Layout; s: JourneyState; box?: { w: number; h: number }; t?: number; mini?: boolean }) {
  const { w, l } = roomSize(s);
  const W = box.w, H = Math.min(box.h, Math.round((box.w * l) / w));
  const iw = W - 2 * t, ih = H - 2 * t;
  const px = (v: number, of: number) => Math.round((v / 100) * of);
  const win = s.placements.find((x) => x.kind === "windows" && x.wall);
  const door = s.placements.find((x) => x.kind === "doors" && x.wall);
  if (mini)
    return (
      <div className="r" style={{ width: W, height: H }}>
        {layout.items
          .filter((i) => i.kind !== "rug")
          .slice(0, 6)
          .map((i, n) => (
            <i key={n} style={{ left: px(i.x, iw), top: px(i.y, ih), width: Math.max(8, px(i.w, iw)), height: Math.max(8, px(i.h, ih)), background: KIND_COLOR[i.kind] ?? KIND_COLOR.other }} />
          ))}
        {win && <div className="win" style={win.wall === "C" ? undefined : { display: "none" }} />}
      </div>
    );
  return (
    <div className="rm" style={{ width: W, height: H }}>
      {layout.zones.map((z, n) => (
        <div key={n} className={`zone ${z.tone === "green" ? "z2" : "z1"}`} style={{ left: px(z.x, iw), top: px(z.y, ih), width: px(z.w, iw), height: px(z.h, ih) }}>
          {z.label}
        </div>
      ))}
      {layout.items.map((i, n) => (
        <div key={n} className={`f ${KIND_CLASS[i.kind] ?? ""}`} style={{ left: px(i.x, iw), top: px(i.y, ih), width: Math.max(10, px(i.w, iw)), height: Math.max(10, px(i.h, ih)), ...(KIND_CLASS[i.kind] ? {} : { background: KIND_COLOR[i.kind] ?? KIND_COLOR.other, borderRadius: 8 }) }}>
          {i.kind === "rug" || px(i.w, iw) < 34 ? "" : i.label}
        </div>
      ))}
      {win && <div className="win" style={win.wall !== "C" ? { display: "none" } : undefined} />}
      {door && <div className="dr" style={door.wall !== "D" ? { display: "none" } : undefined} />}
      {layout.route && (
        <div
          className="path"
          style={{
            left: px(Math.min(layout.route.x1, layout.route.x2), iw),
            top: px(layout.route.y1, ih),
            width: Math.max(20, px(Math.abs(layout.route.x2 - layout.route.x1), iw)),
          }}
        />
      )}
    </div>
  );
}

/** 4.3 · Choose a layout */
export function Layouts() {
  const { s, set } = useJourney();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const once = useRef(false);
  const { w, l, example } = roomSize(s);
  const chosen = s.chosenLayout ?? 0;

  useEffect(() => {
    if (once.current || s.layouts.length >= 2) return;
    once.current = true;
    (async () => {
      setBusy(true);
      try {
        const a = s.layouts[0] ?? (await makeLayout(s, { emphasis: 0 }));
        set({ layouts: [a] });
        const b = await makeLayout(s, { emphasis: 1, avoid: [a.name] });
        set({ layouts: [a, b], chosenLayout: 0 });
      } catch (e) {
        toast({ title: "Layouts aren't ready", description: (e as Error).message, variant: "destructive" });
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const another = async () => {
    setBusy(true);
    try {
      const keep = s.layouts[chosen];
      const next = await makeLayout(s, { emphasis: s.layouts.length % 2, avoid: s.layouts.map((x) => x.name) });
      const layouts = keep ? (chosen === 0 ? [keep, next] : [next, keep]) : [next];
      set({ layouts, chosenLayout: keep ? chosen : 0 });
    } catch (e) {
      toast({ title: "No other option yet", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const keepNames = s.keeping.map((k) => k.name.toLowerCase().replace(/^upright /, ""));
  const kinds = new Set(s.layouts.flatMap((x) => x.items.map((i) => i.kind)));
  const words = ["", "One way", "Two ways", "Three ways"][s.layouts.length] ?? "Ways";
  return (
    <Screen board="S4-Layouts" step={4} right={roomName(curRoom(s))} wrapStyle={{ maxWidth: "1200px" }}>
      <p className="eyebrow">Choose where life happens</p>
      <h1 className="h1">{s.layouts.length ? `${words} to live in it` : "Finding ways to live in it"}</h1>
      <p className="sub">
        {s.layouts.length > 1 ? "Both" : "It"} {keepNames.length ? `keep${s.layouts.length > 1 ? "" : "s"} your ${list(keepNames)} and ` : ""}leave{s.layouts.length > 1 ? "" : "s"} a clear route from the door. Pick one — furniture and details come next.
      </p>
      <div className="legend" style={{ justifyContent: "center", marginTop: "28px" }}>
        {kinds.has("sofa") && (
          <span>
            <i style={{ background: "#6E3550" }} />
            Sofa
          </span>
        )}
        {kinds.has("chair") && (
          <span>
            <i style={{ background: "#2F5B4A" }} />
            Chair
          </span>
        )}
        {kinds.has("keep") &&
          keepNames.slice(0, 1).map((k) => (
            <span key={k}>
              <i style={{ background: "#4A3022" }} />
              {k[0].toUpperCase() + k.slice(1)} (keep)
            </span>
          ))}
        {kinds.has("table") && (
          <span>
            <i style={{ background: "#8A6A4A" }} />
            Tables
          </span>
        )}
        <span>
          <i style={{ borderTop: "3px dotted #B4572E", height: "0", borderRadius: "0" }} />
          Walking route
        </span>
      </div>
      <div className="g2" style={{ marginTop: "28px" }}>
        {s.layouts.map((lay, i) => (
          <section key={lay.id} className={`lay${i === chosen ? " sel" : ""}`} aria-label={`Layout ${i + 1}, ${lay.name}${i === chosen ? ", selected" : ""}`} onClick={() => set({ chosenLayout: i })} style={{ cursor: "pointer" }}>
            {i === chosen && (
              <span className="check">
                <I.check />
              </span>
            )}
            <div className="stack" style={{ gap: "6px" }}>
              <span className="lbl">Layout {i + 1}</span>
              <h2 className="h2" style={{ fontSize: "30px" }}>
                {lay.name}
              </h2>
            </div>
            <div className="plan">
              <PlanDrawing layout={lay} s={s} />
            </div>
            <ul>
              {lay.notes.map((n) => (
                <li key={n.text} className={n.ok ? "" : "con"}>
                  {n.ok ? <I.check /> : <Ic>{p("M12 8v5M12 16h.01")}<circle cx="12" cy="12" r="9" /></Ic>}
                  {n.text}
                </li>
              ))}
            </ul>
          </section>
        ))}
        {busy &&
          Array.from({ length: Math.max(0, 2 - s.layouts.length) || 1 }, (_, i) => (
            <section key={`b${i}`} className="lay" style={{ minHeight: 560, alignItems: "center", justifyContent: "center", color: "#665A80" }}>
              Planning a layout around your room…
            </section>
          ))}
      </div>
      <p className="small" style={{ textAlign: "center", marginTop: "20px" }}>
        {example ? `Illustrative arrangements on example dimensions (${m(w)} × ${m(l)} m). Actual room fit: TBC until measured.` : `Arranged on your room (${m(w)} × ${m(l)} m).`}
      </p>
      <div className="actions">
        <Back to="S4-Measure" />
        <button className="btn ghost auto" type="button" style={{ marginLeft: "auto" }} onClick={another} disabled={busy}>
          <I.repeat />
          Another option
        </button>
        <Go
          className={`btn auto${s.layouts.length ? "" : " dis"}`}
          to="S4-Summary"
          onClick={() => {
            if (!s.layouts.length) return false;
            set((x) => ({ chosenLayout: chosen, done: Array.from(new Set([...x.done, 4])) }));
            void saveStepDone(s, 4);
          }}
        >
          Choose layout {chosen + 1} and finish step 4
          <I.next />
        </Go>
      </div>
    </Screen>
  );
}

/** Which piece or opening each wall is known for: "A Sofa · B Piano · C Window · D Entry". */
export function wallRoles(s: JourneyState, lay?: Layout) {
  const out: Partial<Record<Wall, string>> = {};
  const near = (i: { x: number; y: number; w: number; h: number }): Wall => {
    const d = { A: i.y, C: 100 - (i.y + i.h), D: i.x, B: 100 - (i.x + i.w) };
    return (Object.entries(d) as [Wall, number][]).sort((a, b) => a[1] - b[1])[0][0];
  };
  for (const i of lay?.items ?? []) {
    if (i.kind === "rug" || i.kind === "table") continue;
    const w = near(i);
    if (!out[w]) out[w] = i.kind === "keep" ? i.label.replace(/^upright /i, "") : i.label.split(" ").slice(-1)[0].replace(/^\w/, (c) => c.toUpperCase());
  }
  for (const x of s.placements) {
    if (!x.wall || out[x.wall]) continue;
    if (x.kind === "windows") out[x.wall] = "Window";
    if (x.kind === "doors") out[x.wall] = "Entry";
  }
  for (const x of s.placements) {
    if (x.wall && x.kind === "windows" && out[x.wall] !== "Window" && !Object.values(out).includes("Window")) out[x.wall] = "Window";
    if (x.wall && x.kind === "doors" && !Object.values(out).includes("Entry") && out[x.wall] !== "Window") out[x.wall] = "Entry";
  }
  return (["A", "B", "C", "D"] as Wall[]).map((w) => `${w} ${out[w] ?? "Open"}`).join(" · ");
}

/** 4.4 · Step 4 summary */
export function Step4Summary() {
  const { s } = useJourney();
  const { w, l, example } = roomSize(s);
  const lay = s.layouts[s.chosenLayout ?? 0];
  const input = s.room.input === "plan" ? `Floorplan uploaded · scale set from ${(s.room.scaleRef ?? "Wall A length").replace(" length", "").toLowerCase().replace("wall", "wall")}` : s.room.input === "photos" ? `${s.room.wallPhotos.length} wall photos + measurements` : "Room drawn by hand";
  const open = [
    example ? "Measure the room — sizes are examples" : null,
    !s.room.ceilingM ? "Ceiling height" : null,
    ...s.placements.filter((x) => !x.wall).map((x) => `Place ${placementLabel(x, s.placements).toLowerCase()} on the plan`),
  ].filter(Boolean) as string[];
  return (
    <StepSummary
      step={4}
      board="S4-Summary"
      sub="Your room has a shape and a plan. Now we choose the pieces that live in it — starting with the biggest one."
      media={
        lay && (
          <div className="mini" role="img" aria-label={`Chosen layout: ${lay.name}`}>
            <PlanDrawing layout={lay} s={s} box={{ w: 200, h: 262 }} t={7} mini />
          </div>
        )
      }
      decisions={[
        { k: "Room input", v: input, edit: "S4-Input" },
        {
          k: "Room size",
          v: (
            <>
              {m(w)} × {m(l)} m {example && <span className="tag tbc">Example · confirm</span>} · {s.room.ceilingM ? `ceiling ${m(s.room.ceilingM)} m` : "ceiling height not given"}
            </>
          ),
          edit: "S4-Measure",
        },
        {
          k: "Layout",
          v: lay ? (
            <>
              <b>{lay.name}</b> — {lay.notes.filter((n) => n.ok).map((n) => n.text.replace(/\.$/, "").toLowerCase()).join("; ")}. {lay.notes.find((n) => !n.ok)?.text ?? ""}
            </>
          ) : (
            "Not chosen"
          ),
          edit: "S4-Layouts",
        },
        { k: "Walls", v: wallRoles(s, lay) },
      ]}
      open={open}
      soFar={soFar(s, 4)}
      back="S4-Layouts"
      next="S5-Shops"
    />
  );
}

