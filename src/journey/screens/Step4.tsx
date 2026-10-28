/** Step 4 — Your layout: how we get the room, its shape and scale, two layouts, summary. */
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { Back, Go, Opt, Screen, useGo } from "../Shell";
import { I, Ic } from "../icons";
import { roomName, stateInfo } from "../data";
import { curRoom, uid, useJourney, type FixedKind, type JourneyState, type Layout, type LayoutItem, type Placement, type Wall } from "../state";
import { ADDABLE, newPiece, resizeCm, sizeCm, turn } from "../plan/editLayout";
import { StepSummary } from "../Summary";
import { analyzePlan, makeLayout, uploadPhoto } from "../services";
import { onPlanReaderStatus, readPlan, warmPlanReader, type PlanRead } from "../plan/reader";
import { applyPlanRead, withWritten } from "../plan/apply";
import { layoutChecks, pieceInfo } from "../plan/layoutCheck";
import { pdfToImages } from "@/lib/pdfToImages";
import { list, soFar } from "../story";
import { saveStepDone } from "../sync";
import { fixedLine, placementLabel } from "./Step3";
import { LayoutPlan, PlanDrawing, TEX } from "./LayoutPlan";

export { PlanDrawing };

const p = (d: string) => <path d={d} />;
/** The last plan image, kept so the person can tap a different room on it without uploading again. */
let lastPlan: Blob | null = null;
import { EX_L, EX_W, roomSize } from "../plan/room";
export { roomSize };
const m = (n: number) => n.toFixed(2);
/** "3.75 × 4.90 m, both written on your plan" / "…, 3.75 written, 4.90 estimated". */
const sizeLine = (r: JourneyState["room"]) => {
  const w = r.widthM ?? EX_W, l = r.lengthM ?? EX_L, src = r.sizeSource;
  if (!src) return `${m(w)} × ${m(l)} m`;
  const word = (x: string) => (x === "written" ? "written on the plan" : x === "from area" ? "from the printed area" : "estimated");
  return src.width === src.length ? `${m(w)} × ${m(l)} m, ${word(src.width)}` : `${m(w)} m ${word(src.width)}, ${m(l)} m ${word(src.length)}`;
};
/** The note after one side's size on the plan drawing. */
const sideNote = (r: JourneyState["room"], side: "width" | "length", example: boolean) => {
  const src = r.sizeSource?.[side];
  if (src === "written") return " · written on plan";
  if (src === "from area") return " · from printed area";
  if (src === "estimated") return " · estimated";
  return example ? (r.planRead?.guessM ? " · from plan" : " · example") : "";
};

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
    const stop = onPlanReaderStatus((t) => setBusy(t));
    try {
      // a PDF is read from its first page
      const image = f.type === "application/pdf" || /\.pdf$/i.test(f.name) ? (await pdfToImages(f, 1))[0] : f;
      lastPlan = image;
      const [url, read] = await Promise.all([
        uploadPhoto(image),
        readPlan(image).catch((e: Error): PlanRead => ({ ok: false, reason: "error", message: e.message })),
      ]);
      if (read.ok) {
        set((x) => {
          const next = applyPlanRead(x, read, EX_W);
          return { ...next, room: { ...next.room, planImage: url }, layouts: [], chosenLayout: undefined };
        });
        // Sizes written on the plan beat the door-width guess. Read in the background; applied unless
        // the person has already typed a measurement or uploaded another plan.
        void analyzePlan(url)
          .then((est) => {
            if (!est?.written) return;
            let applied: JourneyState["room"] | null = null;
            set((x) => {
              // a size the person typed in the meantime wins; another plan uploaded meanwhile is left alone
              if (x.room.planImage !== url || (x.room.confirmed && !x.room.sizeSource)) return {};
              const room = { ...x.room, ...withWritten({ widthM: x.room.widthM ?? EX_W, lengthM: x.room.lengthM ?? EX_L }, est.written) };
              applied = room;
              return { room, layouts: [], chosenLayout: undefined };
            });
            if (applied) toast({ title: "Sizes read from your plan", description: sizeLine(applied) });
          })
          .catch(() => undefined);
      } else {
        // the drawing couldn't be measured: fall back to the AI, which reads sizes written on the plan or estimates them
        const est = await analyzePlan(url).catch(() => null);
        const room: JourneyState["room"] = {
          ...s.room,
          input: "plan",
          planImage: url,
          planRead: undefined,
          ...(est ? withWritten({ widthM: est.widthM, lengthM: est.lengthM }, est.written) : { confirmed: false, written: undefined, sizeSource: undefined }),
        };
        set({ room, layouts: [], chosenLayout: undefined });
        toast({
          title: est?.written ? "Sizes read from your plan" : "We estimated this plan",
          description: est?.written ? `${sizeLine(room)}. ${read.message} Place the doors and windows yourself.` : `${read.message} Check the sizes and place the doors and windows yourself.`,
        });
      }
      go("S4-Measure");
    } catch (e) {
      toast({ title: "The plan didn't upload", description: (e as Error).message, variant: "destructive" });
    } finally {
      stop();
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
        <Opt
          tint="a"
          className="left-al ri"
          sel={(s.room.input ?? "plan") === "plan"}
          onClick={() => {
            warmPlanReader(); // start loading the reader while the file picker is open
            planIn.current?.click();
          }}
        >
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
        <Back to="S3-Summary" />
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

/**
 * The room as read on the plan: its edges on the plan image. The person can drag an edge onto the right wall
 * (the reader snaps it to the wall face), or tap another room. Either way the room is measured again.
 */
function PlanOutline() {
  const { s, set } = useJourney();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const pr = s.room.planRead!;
  const [box, setBox] = useState<[number, number, number, number]>(pr.box);
  useEffect(() => setBox(pr.box), [pr.box]);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ edge: 0 | 1 | 2 | 3; moved: boolean } | null>(null);

  const reread = async (opts: { tap?: [number, number]; box?: [number, number, number, number] }) => {
    setBusy(true);
    try {
      const img = lastPlan ?? (await (await fetch(s.room.planImage!)).blob());
      lastPlan = img;
      const r = await readPlan(img, opts.tap, 120_000, opts.box);
      if (!r.ok || r.picked === "tap_missed") throw new Error(r.ok ? "That room isn't closed off on the plan. Drag the edges onto its walls instead." : r.message);
      set((x) => {
        // the printed sizes belong to the room first read: kept when its outline is adjusted, dropped for another room
        const next = applyPlanRead(x, r, EX_W, opts.tap ? undefined : x.room.written);
        return { ...next, room: { ...next.room, planImage: x.room.planImage }, layouts: [], chosenLayout: undefined };
      });
    } catch (e) {
      setBox(pr.box);
      toast({ title: "We couldn't measure that", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };
  const at = (e: { clientX: number; clientY: number }) => {
    const r = frame.current!.getBoundingClientRect();
    return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))] as const;
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const [x, y] = at(e);
    drag.current.moved = true;
    setBox((b) => {
      const n = [...b] as [number, number, number, number];
      const v = drag.current!.edge % 2 === 0 ? x : y;
      n[drag.current!.edge] = v;
      if (n[2] - n[0] < 0.03 || n[3] - n[1] < 0.03) return b;
      return n;
    });
  };
  const onUp = () => {
    if (drag.current?.moved) void reread({ box });
    drag.current = null;
  };
  const edge = (i: 0 | 1 | 2 | 3) => {
    const vertical = i % 2 === 0;
    const pos = box[i] * 100;
    const style: CSSProperties = vertical
      ? { left: `calc(${pos}% - 8px)`, top: `${box[1] * 100}%`, height: `${(box[3] - box[1]) * 100}%`, width: 16, cursor: "ew-resize" }
      : { top: `calc(${pos}% - 8px)`, left: `${box[0] * 100}%`, width: `${(box[2] - box[0]) * 100}%`, height: 16, cursor: "ns-resize" };
    return (
      <span
        key={i}
        role="slider"
        aria-label={["Left wall", "Top wall", "Right wall", "Bottom wall"][i]}
        aria-valuenow={Math.round(pos)}
        tabIndex={0}
        onPointerDown={(e) => {
          e.stopPropagation();
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          drag.current = { edge: i, moved: false };
        }}
        onKeyDown={(e) => {
          const d = { ArrowLeft: -0.005, ArrowUp: -0.005, ArrowRight: 0.005, ArrowDown: 0.005 }[e.key];
          if (d === undefined) return;
          e.preventDefault();
          const n = [...box] as [number, number, number, number];
          n[i] = Math.min(1, Math.max(0, n[i] + d));
          setBox(n);
          void reread({ box: n });
        }}
        style={{ position: "absolute", ...style, display: "flex", alignItems: "center", justifyContent: "center", touchAction: "none", zIndex: 2 }}
      >
        <span style={vertical ? { width: 6, height: 28, borderRadius: 3, background: "#665A85" } : { height: 6, width: 28, borderRadius: 3, background: "#665A85" }} />
      </span>
    );
  };
  return (
    <div className="rail-card" style={{ marginTop: "20px", maxWidth: "640px" }}>
      <h2 className="h3">Your room on the plan</h2>
      <p className="small" style={{ margin: "0 0 12px" }}>
        {busy
          ? "Measuring…"
          : "Check the outline sits on your room's walls. Drag an edge to the right wall — it snaps into place — or tap a different room."}
      </p>
      <div
        ref={frame}
        style={{ position: "relative", borderRadius: 12, overflow: "hidden", opacity: busy ? 0.6 : 1, userSelect: "none", touchAction: "none" }}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onClick={(e) => {
          if (busy || drag.current) return;
          const [x, y] = at(e);
          const inside = x > box[0] && x < box[2] && y > box[1] && y < box[3];
          if (!inside) void reread({ tap: [x, y] });
        }}
      >
        <img src={s.room.planImage} alt="Your floor plan" draggable={false} style={{ display: "block", width: "100%" }} />
        {pr.rooms
          .filter((b) => !b.every((v, i) => Math.abs(v - pr.box[i]) < 0.02))
          .map((b, i) => (
            <span key={i} aria-hidden="true" style={{ position: "absolute", left: `${b[0] * 100}%`, top: `${b[1] * 100}%`, width: `${(b[2] - b[0]) * 100}%`, height: `${(b[3] - b[1]) * 100}%`, border: "2px dashed rgba(102,90,133,.45)", borderRadius: 4, pointerEvents: "none" }} />
          ))}
        <span aria-label="The room we measured" style={{ position: "absolute", left: `${box[0] * 100}%`, top: `${box[1] * 100}%`, width: `${(box[2] - box[0]) * 100}%`, height: `${(box[3] - box[1]) * 100}%`, border: "3px solid #665A85", background: "rgba(102,90,133,.12)", pointerEvents: "none" }} />
        {([0, 1, 2, 3] as const).map(edge)}
      </div>
    </div>
  );
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

  const setRoom = (patch: Partial<JourneyState["room"]>) => set((x) => ({ room: { ...x.room, sizeSource: undefined, ...patch }, layouts: [], chosenLayout: undefined }));
  // a side printed on the plan isn't rescaled when the other side is typed
  const printedW = s.room.sizeSource?.width === "written", printedL = s.room.sizeSource?.length === "written";
  const doorM = s.room.doorM ?? 0.9;
  const known = ref === "Wall A length" ? s.room.widthM ?? EX_W : ref === "Wall B length" ? s.room.lengthM ?? EX_L : doorM;
  const setKnown = (v: number) => {
    if (!v || v <= 0 || (s.room.confirmed && Math.abs(v - known) < 0.005)) return; // unchanged: keep the layouts
    if (ref === "Wall A length") setRoom({ lengthM: printedL ? l : +(v * (l / w)).toFixed(2), widthM: v, confirmed: true });
    else if (ref === "Wall B length") setRoom({ widthM: printedW ? w : +(v * (w / l)).toFixed(2), lengthM: v, confirmed: true });
    else setRoom({ widthM: +((w * v) / doorM).toFixed(2), lengthM: +((l * v) / doorM).toFixed(2), doorM: v, confirmed: true });
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
          {s.room.input === "plan"
            ? s.room.planRead
              ? `We measured your plan and put ${s.room.planRead.doors} door${s.room.planRead.doors === 1 ? "" : "s"} and ${s.room.planRead.windows} window${s.room.planRead.windows === 1 ? "" : "s"} on its walls. Check them, then type one real measurement.`
              : "We traced your plan. Drag the features you counted onto the right walls."
            : "Here's your room's shape. Type its sizes and drag the features you counted onto the right walls."}
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
                {m(w)} m{sideNote(s.room, "width", example)}
              </span>
              <span className="dim" style={{ right: `calc(50% - ${(W + 20) / 2 + 110}px)`, top: "50%", transform: "translateY(-50%) rotate(90deg)" }}>
                {m(l)} m{sideNote(s.room, "length", example)}
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
                      if (v > 0 && !(s.room.confirmed && Math.abs(v - (ref === "Wall B length" ? w : l)) < 0.005)) setRoom(ref === "Wall B length" ? { widthM: v, confirmed: true } : { lengthM: v, confirmed: true });
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
              {s.room.sizeSource
                ? s.room.confirmed
                  ? "Read from the sizes written on your plan. Change them above if they're not right."
                  : "One side is written on your plan; the other is estimated from the drawing. Type it above to make it exact."
                : example
                ? s.room.planRead?.guessM
                  ? `A rough size from your plan's door width. Type one real length above to make it exact.`
                  : "Sizes shown are examples until you confirm them."
                : "Sizes confirmed — layouts use them."}
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
              to="S3-Fixed"
              style={{ minHeight: "64px", fontSize: "19px" }}
              onClick={() => {
                if (!shown.some((x) => x.kind === "doors" && x.wall)) toast({ title: "Tip: place at least one door", description: "Layouts keep a clear route from the door." });
              }}
            >
              Next: what can't move
              <I.next />
            </Go>
            <Go className="link-btn" to="S4-Input" style={{ justifyContent: "center" }}>
              {s.room.input === "plan" ? "Upload a different plan" : "Upload a plan instead"}
            </Go>
          </div>
        </aside>
      </div>
      {s.room.input === "plan" && s.room.planImage && s.room.planRead && <PlanOutline />}
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

/** 4.4 · Choose a layout — up to three options, the chosen one large and to scale, with fit checks and every piece. */
export function Layouts() {
  const { s, set } = useJourney();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const once = useRef(false);
  const { w, l, example } = roomSize(s);
  const chosen = Math.min(s.chosenLayout ?? 0, Math.max(0, s.layouts.length - 1));
  const lay = s.layouts[chosen];
  const [sel, setSel] = useState<number | null>(null);
  useEffect(() => setSel(null), [chosen]);
  const picked = lay && sel != null ? lay.items[sel] : undefined;

  /** Changes the chosen layout's pieces; the suggestion is kept the first time, to reset to. */
  const editItems = (fn: (items: LayoutItem[]) => LayoutItem[]) =>
    set((x) => ({
      layouts: x.layouts.map((L, i) => (i === chosen ? { ...L, original: L.original ?? L.items, items: fn(L.items) } : L)),
    }));
  const changeItem = (n: number, item: LayoutItem) => editItems((items) => items.map((it, i) => (i === n ? item : it)));
  const addPiece = (k: (typeof ADDABLE)[number]) => {
    if (!lay) return;
    // drop it next to the picked piece, or in the middle of the room
    const at = picked ? { x: Math.min(90, picked.x + picked.w + 6), y: picked.y + picked.h / 2 } : undefined;
    const item = newPiece(k.kind, k.label, k.w, k.d, w, l, at);
    editItems((items) => [...items, item]);
    setSel(lay.items.length);
  };
  const removePiece = (n: number) => {
    editItems((items) => items.filter((_, i) => i !== n));
    setSel(null);
  };

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

  /** A third option is added; after that, a new one replaces the oldest option you haven't picked. */
  const another = async () => {
    setBusy(true);
    try {
      const next = await makeLayout(s, { emphasis: s.layouts.length % 2, avoid: s.layouts.map((x) => x.name) });
      set((x) => {
        if (x.layouts.length < 3) return { layouts: [...x.layouts, next] };
        const drop = x.layouts.findIndex((_, i) => i !== chosen);
        return { layouts: x.layouts.map((y, i) => (i === drop ? next : y)) };
      });
    } catch (e) {
      toast({ title: "No other option yet", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const keepNames = s.keeping.map((k) => k.name.toLowerCase().replace(/^upright /, ""));
  const words = ["", "One way", "Two ways", "Three ways"][s.layouts.length] ?? "Ways";
  const checks = lay ? layoutChecks(s, lay.items, w, l) : [];
  const pieces = lay ? pieceInfo(s, lay.items, w, l) : [];
  const keptN = pieces.filter((x) => x.kept).length;
  return (
    <Screen board="S4-Layouts" step={4} right={`${roomName(curRoom(s))} · ${m(w)} × ${m(l)} m`} wrapClass="wrap wide">
      <div className="ly-top">
        <div className="stack" style={{ gap: "6px", maxWidth: "760px" }}>
          <p className="ly-script">built from your real walls</p>
          <h1 className="ly-h1">{s.layouts.length ? `${words} to live in your room` : "Finding ways to live in your room"}</h1>
          <p className="ly-sub">
            Each layout is checked against your door, window and walking route{keepNames.length ? `, and makes room for your ${list(keepNames)}` : ""}. Pick one — you can still change pieces later.
          </p>
        </div>
      </div>

      <div className="ly-row">
        <nav className="ly-opts" aria-label="Layout options">
          {s.layouts.map((x, i) => {
            const c = layoutChecks(s, x.items, w, l);
            const bad = c.filter((k) => !k.ok).length;
            return (
              <button key={x.id} type="button" className={`ly-opt${i === chosen ? " sel" : ""}`} aria-pressed={i === chosen} onClick={() => set({ chosenLayout: i })}>
                <span className="ly-mini" aria-hidden="true">
                  <PlanDrawing layout={x} s={s} box={{ w: 62, h: 82 }} t={4} mini />
                </span>
                <span className="stack" style={{ gap: "4px", minWidth: 0, textAlign: "left" }}>
                  <span className="ly-k">
                    Layout {i + 1}
                    {i === 0 ? " · best fit" : ""}
                  </span>
                  <b>{x.name}</b>
                  {x.notes[0] && <span className="ly-n">{x.notes[0].text}</span>}
                  <span className={bad ? "ly-flag warn" : "ly-flag"}>{bad ? `${bad} thing${bad > 1 ? "s" : ""} to check` : "Passes every check"}</span>
                </span>
              </button>
            );
          })}
          {busy && <div className="ly-opt wait">Planning a layout around your room…</div>}
          <button type="button" className="ly-more" onClick={another} disabled={busy}>
            <I.repeat />
            {s.layouts.length < 3 ? "Another option" : "Replace an option"}
          </button>
        </nav>

        <section className="ly-plan" aria-label={lay ? `Layout ${chosen + 1} on your plan` : "Your plan"}>
          {lay ? (
            <>
              <div className="stack" style={{ gap: "2px" }}>
                <span className="ly-k">Layout {chosen + 1}</span>
                <h2 className="ly-h2">
                  {lay.name}
                  {lay.original && <span className="tag" style={{ marginLeft: "10px", verticalAlign: "middle" }}>Edited by you</span>}
                </h2>
              </div>
              <div className="ly-tools" role="toolbar" aria-label="Edit this layout">
                <span className="lbl">Add</span>
                {ADDABLE.slice(0, 3).map((k) => (
                  <button key={k.label} type="button" className="ly-add" onClick={() => addPiece(k)}>
                    + {k.label}
                  </button>
                ))}
                <select
                  className="ly-add"
                  aria-label="Add another piece"
                  value=""
                  onChange={(e) => {
                    const k = ADDABLE.find((x) => x.label === e.target.value);
                    if (k) addPiece(k);
                  }}
                >
                  <option value="">More pieces…</option>
                  {ADDABLE.slice(3).map((k) => (
                    <option key={k.label} value={k.label}>
                      {k.label}
                    </option>
                  ))}
                </select>
                {lay.original && (
                  <button
                    type="button"
                    className="ly-reset"
                    onClick={() => {
                      set((x) => ({ layouts: x.layouts.map((L, i) => (i === chosen ? { ...L, items: L.original ?? L.items, original: undefined } : L)) }));
                      setSel(null);
                    }}
                  >
                    Undo my changes
                  </button>
                )}
              </div>
              <LayoutPlan layout={lay} s={s} edit={{ selected: sel, onSelect: setSel, onChange: changeItem }} />
              <p className="small ly-hint">{picked ? "Drag to move · corner to resize · arrow keys nudge" : "Tap a piece to move, resize or remove it."}</p>
              <div className="ly-legend">
                <span>
                  <i className="t-sofa" />
                  New piece
                </span>
                {keptN > 0 && (
                  <span>
                    <i className="t-keep" />
                    Yours, kept
                  </span>
                )}
                <span>
                  <i className="lg-route" />
                  Walking route
                </span>
                <span>
                  <i className="lg-door" />
                  Door swing
                </span>
              </div>
              {lay.notes.length > 0 && (
                <ul className="ly-notes">
                  {lay.notes.map((n) => (
                    <li key={n.text} className={n.ok ? "" : "con"}>
                      {n.ok ? <I.check /> : <Ic>{p("M12 8v5M12 16h.01")}<circle cx="12" cy="12" r="9" /></Ic>}
                      {n.text}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="ly-wait">Planning a layout around your room…</div>
          )}
        </section>

        <aside className="ly-side">
          {picked && sel != null && (
            <section className="ly-card ly-edit" aria-label={`Edit piece ${sel + 1}`}>
              <div className="row between">
                <h2 className="ly-cap">Piece {sel + 1}</h2>
                <button type="button" className="link-btn" onClick={() => setSel(null)}>
                  Done
                </button>
              </div>
              <div className="field">
                <label htmlFor="pc-name">Name</label>
                <input id="pc-name" className="input" value={picked.label} onChange={(e) => changeItem(sel, { ...picked, label: e.target.value })} />
              </div>
              <div className="row" style={{ gap: "10px", flexWrap: "nowrap" }}>
                {(["w", "d"] as const).map((k) => (
                  <div className="field" key={k} style={{ flex: 1 }}>
                    <label htmlFor={`pc-${k}`}>{k === "w" ? "Width" : "Depth"}</label>
                    <div className="unit">
                      <input
                        id={`pc-${k}`}
                        className="input"
                        inputMode="numeric"
                        key={`${sel}-${k}-${sizeCm(picked, w, l)[k]}`}
                        defaultValue={sizeCm(picked, w, l)[k]}
                        onBlur={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!(v > 0)) return;
                          const cur = sizeCm(picked, w, l);
                          if (v !== cur[k]) changeItem(sel, resizeCm(picked, k === "w" ? v : cur.w, k === "d" ? v : cur.d, w, l));
                        }}
                      />
                      <span>cm</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="row" style={{ gap: "8px" }}>
                <button type="button" className="btn ghost sm" onClick={() => changeItem(sel, turn(picked, w, l))}>
                  Turn 90°
                </button>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => {
                    const { w: cw, d: cd } = sizeCm(picked, w, l);
                    editItems((items) => [...items, newPiece(picked.kind, picked.label, cw, cd, w, l, { x: Math.min(95, picked.x + picked.w * 1.5 + 2), y: picked.y + picked.h / 2 })]);
                    setSel(lay.items.length);
                  }}
                >
                  Duplicate
                </button>
                <button type="button" className="btn ghost sm danger" onClick={() => removePiece(sel)}>
                  Remove
                </button>
              </div>
            </section>
          )}
          {checks.length > 0 && (
            <section className="ly-card">
              <h2 className="ly-cap">Fit checks</h2>
              <div className="ly-checks">
                {checks.map((c) => (
                  <div key={c.label} className={c.ok ? "ok" : "warn"}>
                    <b>{c.value}</b>
                    <span>{c.label}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
          {pieces.length > 0 && (
            <section className="ly-card">
              <div className="row between">
                <h2 className="ly-cap">Pieces in this layout</h2>
                <span className="small">
                  {pieces.length} pieces{keptN ? ` · ${keptN} yours` : ""}
                </span>
              </div>
              {pieces.map((x) => (
                <article key={x.n} className={`ly-piece${sel === x.n - 1 ? " sel" : ""}`} onClick={() => setSel(x.n - 1)} style={{ cursor: "pointer" }}>
                  <span className={`ly-num ${TEX[x.item.kind] ?? "t-other"}`}>{x.n}</span>
                  <div className="stack" style={{ gap: "3px", minWidth: 0 }}>
                    <div className="row between" style={{ gap: "8px", flexWrap: "nowrap" }}>
                      <b>{x.item.label || x.item.kind.replace(/^\w/, (c) => c.toUpperCase())}</b>
                      <span className={x.kept ? "ly-tag kept" : "ly-tag"}>{x.kept ? "Yours · kept" : "New"}</span>
                    </div>
                    <span className="ly-size">
                      {x.size} · {x.where}
                    </span>
                    <span className="ly-why">{x.why}</span>
                  </div>
                </article>
              ))}
            </section>
          )}
        </aside>
      </div>

      <div className="ly-foot">
        <Back to="S3-Fixed" />
        <span className="small">{example ? `Sizes use example room measurements (${m(w)} × ${m(l)} m) until you confirm them.` : "Piece sizes are standard until you choose the actual pieces in step 5."}</span>
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
  const st = stateInfo(s.houseState);
  const tbc = s.fixedTbc.map((k) => (k === "sockets" ? "Sockets & switches" : "water & drains"));
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
        { k: "Can't move", v: fixedLine(s), edit: "S3-Fixed" },
        {
          k: "In the walls",
          v: tbc.length ? (
            <>
              {tbc.join(", ")} <span className="tag tbc">Not sure</span> — {st.id === "core-shell" || st.id === "redoing" ? `we'll plan these (${st.lbl.toLowerCase()})` : "kept where they are"}
            </>
          ) : (
            "Known and counted"
          ),
          edit: "S3-Fixed",
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
      next="S3-Existing"
    />
  );
}

