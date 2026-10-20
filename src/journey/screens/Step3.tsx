/** Step 3 — How you use the space: activities, priorities, what stays, what can't move, summary. */
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeAi } from "@/lib/invokeAi";
import { useToast } from "@/hooks/use-toast";
import { Back, Go, Opt, Screen } from "../Shell";
import { I, Ic, ROOM_ICON, SCOPE_ICON } from "../icons";
import { roomName, stateInfo } from "../data";
import { curRoom, uid, useJourney, type FixedKind, type JourneyState, type KeepItem, type Placement, type Wall } from "../state";
import { StepSummary } from "../Summary";
import { uploadPhoto } from "../services";
import { dims, fallbackFor, sizeVariants, type SizeVariant } from "../sizes";
import { list, soFar } from "../story";
import { saveStepDone } from "../sync";

const p = (d: string) => <path d={d} />;

/** Activities and their icons. The room's own list comes from room_activities (Curate › Sizes, scope & config). */
const ACT_ICON: Record<string, () => JSX.Element> = {
  relax: ROOM_ICON["living-room"],
  host: () => (
    <Ic>
      <circle cx="9" cy="8" r="3.5" />
      {p("M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a5 5 0 0 1 3.5 6")}
    </Ic>
  ),
  music: () => (
    <Ic>
      {p("M9 18V5l11-2v13")}
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </Ic>
  ),
  films: SCOPE_ICON.data,
  read: () => <Ic>{p("M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2zM4 19V5")}</Ic>,
  work: ROOM_ICON.office,
  craft: () => <Ic>{p("M18 3 9 12M7 14c-2 0-3 1.5-3 3.5S3 21 3 21s3 0 4.5-.5S10 19 10 17s-1-3-3-3z")}</Ic>,
  kids: ROOM_ICON["kids-room"],
  eat: ROOM_ICON.kitchen,
  yoga: () => <Ic>{p("M5 19c0-9 6-14 15-14 0 9-5 15-14 15M5 19l7-7")}</Ic>,
  sleep: ROOM_ICON.bedroom,
  cook: ROOM_ICON.kitchen,
  bath: ROOM_ICON.bathroom,
  star: I.sparkle,
};
const iconFor = (name: string) => {
  const n = name.toLowerCase();
  const k = /relax|lounge|unwind/.test(n) ? "relax" : /host|guest|friend|party|social/.test(n) ? "host" : /piano|music|instrument|guitar/.test(n) ? "music"
    : /film|tv|movie|watch|gam/.test(n) ? "films" : /read|book/.test(n) ? "read" : /work|study|office/.test(n) ? "work" : /paint|craft|hobby|sew/.test(n) ? "craft"
    : /kid|child|play/.test(n) ? "kids" : /eat|dine|dinner|breakfast/.test(n) ? "eat" : /yoga|stretch|exercise|workout/.test(n) ? "yoga"
    : /sleep|rest|nap/.test(n) ? "sleep" : /cook|bake/.test(n) ? "cook" : /bath|shower|wash/.test(n) ? "bath" : "star";
  return ACT_ICON[k];
};
const DEFAULT_ACTS: Record<string, string[]> = {
  "living-room": ["Relax", "Host friends", "Play piano", "Watch films", "Read", "Work", "Paint & craft", "Kids play", "Eat here", "Yoga & stretch"],
  bedroom: ["Sleep", "Read", "Get dressed", "Work", "Watch films", "Yoga & stretch", "Relax", "Kids play"],
  kitchen: ["Cook", "Bake", "Eat here", "Host friends", "Work", "Kids play"],
  "dining-room": ["Eat here", "Host friends", "Work", "Kids play", "Play board games"],
  office: ["Work", "Video calls", "Read", "Paint & craft", "Play piano"],
  bathroom: ["Shower", "Bath", "Get ready", "Laundry"],
  "kids-room": ["Sleep", "Kids play", "Read", "Study", "Paint & craft"],
  hallway: ["Arrive & leave", "Store coats & shoes", "Read the post"],
};

function useActivities(room?: string) {
  const [db, setDb] = useState<string[]>([]);
  useEffect(() => {
    let off = false;
    supabase
      .from("room_activities")
      .select("activity_name")
      .eq("room_type", (room ?? "living-room").replace(/-/g, "_"))
      .order("priority")
      .then(({ data }) => !off && setDb((data ?? []).map((a) => a.activity_name)));
    return () => {
      off = true;
    };
  }, [room]);
  return useMemo(() => {
    const base = DEFAULT_ACTS[room ?? "living-room"] ?? DEFAULT_ACTS["living-room"];
    const seen = new Set(base.map((x) => x.toLowerCase()));
    return [...base, ...db.filter((x) => !seen.has(x.toLowerCase()))];
  }, [db, room]);
}

/** 3.1 · Activities */
export function Activities() {
  const { s, set } = useJourney();
  const all = useActivities(curRoom(s));
  const extra = s.activities.filter((a) => !all.includes(a));
  const [own, setOwn] = useState("");
  const toggle = (a: string) => set((x) => ({ activities: x.activities.includes(a) ? x.activities.filter((y) => y !== a) : [...x.activities, a] }));
  const add = () => {
    const v = own.trim();
    if (!v) return;
    set((x) => ({ activities: x.activities.includes(v) ? x.activities : [...x.activities, v] }));
    setOwn("");
  };
  const n = s.activities.length;
  return (
    <Screen board="S3-Activities" step={3} right={roomName(curRoom(s))}>
      <p className="eyebrow">Design around your everyday life</p>
      <h1 className="h1">What happens in this room?</h1>
      <p className="sub">Pick everything you do here. Do you play an instrument, paint or work from the sofa? Add it.</p>
      <div className="g5" style={{ gap: "18px", marginTop: "48px" }}>
        {[...all, ...extra].map((a, i) => {
          const Icon = iconFor(a);
          return (
            <Opt key={a} tint={(["a", "b", "c", "d"] as const)[i % 4]} className="act" sel={s.activities.includes(a)} onClick={() => toggle(a)}>
              <span className="tile sm">
                <Icon />
              </span>
              <span className="opt-t">{a}</span>
            </Opt>
          );
        })}
      </div>
      <div className="field" style={{ marginTop: "28px", maxWidth: "640px" }}>
        <label htmlFor="own">Something else?</label>
        <div className="row" style={{ gap: "10px", flexWrap: "nowrap" }}>
          <input id="own" className="input" placeholder="e.g. record podcasts, play board games" value={own} onChange={(e) => setOwn(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <button className="btn soft auto" type="button" style={{ minHeight: "56px" }} onClick={add}>
            Add
          </button>
        </div>
      </div>
      <div className="actions">
        <Back to="S2-Preview" />
        <Go
          className={`btn auto${n ? "" : " dis"}`}
          to="S3-Summary"
          style={{ marginLeft: "auto" }}
          onClick={() => {
            if (!n) return false;
            set((x) => ({ done: Array.from(new Set([...x.done, 3])) }));
            void saveStepDone(s, 3);
          }}
        >
          Finish step 3 · {n} selected
          <I.next />
        </Go>
      </div>
    </Screen>
  );
}

const KEEP_CHIPS = ["Sofa", "Rug", "Bookshelf", "TV", "Artwork"];
const WALLS: Wall[] = ["A", "B", "C", "D"];

/** A piece's spot on a small plan: which wall and how far along it. */
function onWall(wall: Wall, pos: number, size: { long: number; thick: number }, box: { w: number; h: number }) {
  const along = (len: number) => Math.round(((len - size.long) * Math.min(100, Math.max(0, pos))) / 100);
  if (wall === "A") return { top: 0, left: along(box.w), width: size.long, height: size.thick };
  if (wall === "C") return { bottom: 0, left: along(box.w), width: size.long, height: size.thick };
  if (wall === "B") return { right: 0, top: along(box.h), width: size.thick, height: size.long };
  return { left: 0, top: along(box.h), width: size.thick, height: size.long };
}
const WL_POS: Record<Wall, (w: number, h: number) => React.CSSProperties> = {
  A: (w) => ({ left: `${w / 2 - 20}px`, top: "-36px" }),
  B: (_, h) => ({ right: "-40px", top: `${h / 2 - 19}px` }),
  C: (w) => ({ left: `${w / 2 - 20}px`, bottom: "-40px" }),
  D: (_, h) => ({ left: "-40px", top: `${h / 2 - 19}px` }),
};

/** Windows and doors already placed in 3.4, drawn on the small plans for orientation. */
function Openings({ s, box, t }: { s: JourneyState; box: { w: number; h: number }; t: number }) {
  return (
    <>
      {s.placements
        .filter((x) => x.wall && (x.kind === "windows" || x.kind === "doors"))
        .map((x) => {
          const st = onWall(x.wall!, x.pos ?? 50, { long: x.kind === "windows" ? 90 : 46, thick: t }, { w: box.w + 2 * t, h: box.h + 2 * t });
          const shift = (v: number | undefined) => (v === 0 ? -t : v);
          return (
            <div
              key={x.id}
              style={{
                position: "absolute",
                background: x.kind === "windows" ? "#9FC3D6" : "#FBF8F6",
                top: "top" in st ? shift(st.top as number) : undefined,
                left: "left" in st ? shift(st.left as number) : undefined,
                right: "right" in st ? shift(st.right as number) : undefined,
                bottom: "bottom" in st ? shift(st.bottom as number) : undefined,
                width: st.width,
                height: st.height,
              }}
            />
          );
        })}
    </>
  );
}

function KeepPanel({ item, update, remove, s }: { item: KeepItem; update: (k: Partial<KeepItem>) => void; remove: () => void; s: JourneyState }) {
  const { toast } = useToast();
  const [variants, setVariants] = useState<SizeVariant[]>(() => fallbackFor(item.name));
  const [shot, setShot] = useState(0);
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);
  const mp = useRef<HTMLDivElement>(null);
  useEffect(() => {
    void sizeVariants(item.name).then((v) => {
      setVariants(v);
      if (item.w == null && v[0]) update({ variant: v[0].label, w: v[0].w, d: v[0].d, h: v[0].h, extraLabel: v[0].extraLabel, extra: v[0].extra });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.name]);
  const std = variants.find((v) => v.label === item.variant) ?? variants[0];
  const add = async (files: FileList | null) => {
    for (const f of Array.from(files ?? []).slice(0, 4)) {
      try {
        const url = await uploadPhoto(f);
        update({ photos: [...item.photos, url] });
      } catch (e) {
        toast({ title: "The photo didn't upload", description: (e as Error).message, variant: "destructive" });
      }
    }
  };
  const box = { w: 186, h: 248 };
  const pos = onWall(item.wall ?? "B", item.pos ?? 50, { long: 62, thick: 22 }, box);
  const pin: React.CSSProperties =
    (item.wall ?? "B") === "B" ? { right: "28px", top: `${(pos.top as number) + 8}px` }
      : item.wall === "D" ? { left: "28px", top: `${(pos.top as number) + 8}px` }
      : item.wall === "A" ? { top: "28px", left: `${Math.max(0, (pos.left as number) - 10)}px` }
      : { bottom: "28px", left: `${Math.max(0, (pos.left as number) - 10)}px` };
  const placeByClick = (e: MouseEvent<HTMLDivElement>) => {
    const r = mp.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const d = { A: y, C: 1 - y, D: x, B: 1 - x };
    const wall = (Object.entries(d) as [Wall, number][]).sort((a, b) => a[1] - b[1])[0][0];
    update({ wall, pos: Math.round((wall === "A" || wall === "C" ? x : y) * 100) });
  };
  const short = item.name.replace(/^Upright /, "").replace(/^\w/, (c) => c.toUpperCase());
  return (
    <section className="panel" style={{ marginTop: "44px" }}>
      <div className="row between" style={{ marginBottom: "24px" }}>
        <div className="row" style={{ gap: "12px" }}>
          <h2 className="h3">{item.name}</h2>
          <span className="tag ok">Keep · required</span>
        </div>
        <button className="link-btn" type="button" onClick={remove}>
          <Ic>{p("M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13")}</Ic>
          Remove
        </button>
      </div>
      <div className="piece">
        <div className="blk">
          <span className="blk-h">
            <i>1</i>Photo
          </span>
          <div className="ph photo">
            {item.photos[shot] ? (
              <>
                <img className="img" src={item.photos[shot]} alt={`Photo of the ${item.name.toLowerCase()}`} />
                <span className="cap">
                  Photo {shot + 1} of {item.photos.length}
                </span>
              </>
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#7C7090", fontSize: "15px" }}>No photo yet</div>
            )}
          </div>
          <div className="thumbs">
            {item.photos.map((src, i) => (
              <img key={src + i} src={src} alt={`${item.name} photo ${i + 1}`} onClick={() => setShot(i)} style={i === 1 ? { objectPosition: "80% 70%" } : undefined} />
            ))}
            <span aria-hidden="true" onClick={() => gal.current?.click()} style={{ cursor: "pointer" }}>
              +
            </span>
          </div>
          <div className="pbtns">
            <button className="pri" type="button" onClick={() => cam.current?.click()}>
              <I.camera />
              Take photo
            </button>
            <button type="button" onClick={() => gal.current?.click()}>
              <I.upload />
              Upload
            </button>
          </div>
          <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void add(e.target.files)} />
          <input ref={gal} type="file" accept="image/*" multiple hidden onChange={(e) => void add(e.target.files)} />
          <p className="small" style={{ margin: "0" }}>
            Tip: one front-on, one from the side.
          </p>
        </div>
        <div className="blk">
          <span className="blk-h">
            <i>2</i>Size
          </span>
          <div className="field">
            <label htmlFor={`type-${item.id}`}>Type</label>
            <select
              id={`type-${item.id}`}
              className="select"
              value={item.variant ?? std?.label}
              onChange={(e) => {
                const v = variants.find((x) => x.label === e.target.value);
                if (v) update({ variant: v.label, w: v.w, d: v.d, h: v.h, extraLabel: v.extraLabel, extra: v.extra, measured: false });
              }}
            >
              {variants.map((v) => (
                <option key={v.label}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="row" style={{ gap: "10px", padding: "10px 14px", borderRadius: "12px", background: "#F0EAF1", fontSize: "14px", color: "#544872" }}>
            <Ic style={{ width: "18px", height: "18px" }}>
              <ellipse cx="12" cy="5" rx="8" ry="3" />
              {p("M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3")}
            </Ic>
            <span style={{ flex: "1 1 auto" }}>Standard size from our database — edit if yours is different</span>
            <a
              href="#reset"
              style={{ fontWeight: "600" }}
              onClick={(e) => {
                e.preventDefault();
                if (std) update({ w: std.w, d: std.d, h: std.h, extra: std.extra, measured: false });
              }}
            >
              Reset
            </a>
          </div>
          <div className="dims">
            {(["w", "d", "h"] as const).map((k) => (
              <div className="field" key={k}>
                <label htmlFor={`${k}-${item.id}`}>{{ w: "Width", d: "Depth", h: "Height" }[k]}</label>
                <div className="unit">
                  <input id={`${k}-${item.id}`} className="input" inputMode="numeric" value={item[k] ?? ""} onChange={(e) => update({ [k]: Number(e.target.value.replace(/\D/g, "")) || undefined })} />
                  <span>cm</span>
                </div>
              </div>
            ))}
          </div>
          {item.extraLabel && (
            <div className="field">
              <label htmlFor={`x-${item.id}`}>{item.extraLabel}</label>
              <div className="unit">
                <input id={`x-${item.id}`} className="input" value={item.extra ?? ""} onChange={(e) => update({ extra: e.target.value })} />
                <span>cm</span>
              </div>
            </div>
          )}
          <label className="chk">
            <input type="checkbox" checked={item.measured} onChange={(e) => update({ measured: e.target.checked })} />
            I've measured mine
            {!item.measured && <span className="tag tbc">Standard · not measured yet</span>}
          </label>
          <div className="row between" style={{ padding: "16px 20px", borderRadius: "16px", background: "#F0EAF1", marginTop: "6px" }}>
            <span className="stack" style={{ gap: "2px" }}>
              <b style={{ fontSize: "16px" }}>Its position is fixed</b>
              <span className="small">Off: we may suggest a better spot.</span>
            </span>
            <button className={`toggle${item.fixedSpot ? " on" : ""}`} type="button" role="switch" aria-checked={item.fixedSpot} aria-label="Position is fixed" onClick={() => update({ fixedSpot: !item.fixedSpot })} />
          </div>
        </div>
        <div className="blk">
          <span className="blk-h">
            <i>3</i>Where is it now?
          </span>
          <div className="mp-box">
            <div className="mp" ref={mp} role="img" aria-label={`Room outline with the ${item.name.toLowerCase()} pinned on wall ${item.wall ?? "B"}`} onClick={placeByClick} style={{ cursor: "crosshair" }}>
              {WALLS.map((w) => (
                <span key={w} className={`wl${(item.wall ?? "B") === w ? " on" : ""}`} style={WL_POS[w](186 + 14 - 60, 262 - 30)}>
                  {w}
                </span>
              ))}
              <Openings s={s} box={box} t={7} />
              <div className="item" style={{ ...pos, right: pos.right, top: pos.top }} />
              <span className="pin" style={pin}>
                <Ic style={{ width: "14px", height: "14px" }}>
                  {p("M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z")}
                  <circle cx="12" cy="10" r="2" />
                </Ic>
                {short}
              </span>
            </div>
          </div>
          <span className="lbl">Against which wall?</span>
          <div className="walls">
            {WALLS.map((w) => (
              <button key={w} className={(item.wall ?? "B") === w ? "on" : ""} type="button" aria-pressed={(item.wall ?? "B") === w} onClick={() => update({ wall: w })}>
                {w}
              </button>
            ))}
          </div>
          <p className="small" style={{ margin: "0" }}>
            Drag the pin onto the wall it stands against. A rough spot is fine.
          </p>
        </div>
      </div>
    </section>
  );
}

/** 5.1 · Pieces you're keeping — asked before we look for new furniture. */
export function Existing() {
  const { s, set } = useJourney();
  const { toast } = useToast();
  const snap = useRef<HTMLInputElement>(null);
  const [naming, setNaming] = useState(false);
  const addPiece = (name: string, photo?: string) =>
    set((x) => ({ keeping: [...x.keeping, { id: uid(), name, photos: photo ? [photo] : [], measured: false, wall: "B", pos: 50, fixedSpot: false }], nothingKept: false }));
  const update = (id: string) => (k: Partial<KeepItem>) => set((x) => ({ keeping: x.keeping.map((i) => (i.id === id ? { ...i, ...k } : i)) }));
  const snapIt = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    setNaming(true);
    try {
      const url = await uploadPhoto(f);
      const { data } = await invokeAi<{ item?: { item_name?: string; item_type?: string } }>("identify-item", { body: { imageUrl: url, clickX: 50, clickY: 55 }, timeoutMs: 45_000 });
      const t = data?.item?.item_type;
      const name = t && t !== "surface" ? t[0].toUpperCase() + t.slice(1) : data?.item?.item_name ?? "Piece";
      addPiece(name, url);
    } catch (e) {
      toast({ title: "We couldn't name it", description: (e as Error).message, variant: "destructive" });
    } finally {
      setNaming(false);
    }
  };
  return (
    <Screen board="S3-Existing" step={5} right={roomName(curRoom(s))} wrapStyle={{ maxWidth: "1240px" }}>
      <p className="eyebrow">Before we suggest new pieces</p>
      <h1 className="h1">What do you already have?</h1>
      <p className="sub">
        We'll suggest new furniture next. First, tell us what's already covered — pieces you're keeping, have bought or plan to
        buy yourself — so we only suggest what's missing.
      </p>
      {s.keeping.map((it) => (
        <KeepPanel key={it.id} item={it} s={s} update={update(it.id)} remove={() => set((x) => ({ keeping: x.keeping.filter((i) => i.id !== it.id) }))} />
      ))}
      <div className="addrow">
        <span style={{ fontWeight: "600", marginRight: "8px" }}>{s.keeping.length ? "Add another piece" : "Add a piece you have or plan to buy"}</span>
        {(s.keeping.length ? KEEP_CHIPS : ["Upright piano", ...KEEP_CHIPS]).map((c) => (
          <button key={c} className="chip" type="button" style={{ minHeight: "44px", fontSize: "15px" }} onClick={() => addPiece(c)}>
            + {c}
          </button>
        ))}
        <button className="chip add" type="button" style={{ minHeight: "44px", fontSize: "15px" }} onClick={() => snap.current?.click()}>
          <I.camera />
          {naming ? "Naming it…" : "Snap it — we'll name it"}
        </button>
        <input ref={snap} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void snapIt(e.target.files)} />
      </div>
      <div className="actions">
        <Back to="S4-Summary" />
        <Go className="link-btn" to="S5-Shops" style={{ marginLeft: "auto" }} onClick={() => void set({ keeping: [], nothingKept: true })}>
          Nothing yet — suggest everything
        </Go>
        <Go className="btn auto" to="S5-Shops">
          Next: suggest new pieces
          <I.next />
        </Go>
      </div>
    </Screen>
  );
}

type FixedDef = { kind: FixedKind; title: string; text: string; one: string; icon: () => JSX.Element; inWalls?: boolean; mark: string; color: string };
const FIXED: FixedDef[] = [
  { kind: "windows", title: "Windows", text: "Include balcony doors", one: "Window", mark: "", color: "#9FC3D6", icon: () => <Ic><rect x="4" y="3" width="16" height="18" rx="1" />{p("M12 3v18M4 12h16")}</Ic> },
  { kind: "doors", title: "Doors", text: "And which way they open", one: "Door", mark: "D", color: "#665A85", icon: ROOM_ICON.hallway },
  { kind: "radiators", title: "Radiators", text: "Or other heaters", one: "Radiator", mark: "R", color: "#9E8E7A", icon: SCOPE_ICON.heating },
  { kind: "columns", title: "Columns", text: "Pillars, beams, boxed pipes", one: "Column", mark: "C", color: "#3B3350", icon: () => <Ic>{p("M7 3h10M7 21h10M9 3v18M15 3v18")}</Ic> },
  { kind: "sockets", title: "Sockets & switches", text: "", one: "Sockets & switches", mark: "S", color: "#B4975A", icon: SCOPE_ICON.electrical, inWalls: true },
  { kind: "builtins", title: "Built-ins", text: "Fireplace, alcoves, fitted units", one: "Built-in", mark: "B", color: "#8A6A4A", icon: () => <Ic>{p("M3 3h18v18H3zM3 12h7v9M14 3v6h7")}</Ic> },
  { kind: "water", title: "Water supply & drains", text: "", one: "Water point", mark: "W", color: "#5B8BA6", icon: SCOPE_ICON.water, inWalls: true },
  { kind: "stacks", title: "Soil stack & risers", text: "Shared pipes that usually can't move", one: "Soil stack", mark: "S", color: "#6B6862", icon: () => <Ic>{p("M9 3h6M10 3v18M14 3v18M8 21h8M14 9h4a2 2 0 0 1 2 2v2")}</Ic> },
  { kind: "ac", title: "AC units & vents", text: "Indoor units, grilles, extract fans", one: "AC unit", mark: "AC", color: "#7C9AA8", icon: SCOPE_ICON.ac },
  { kind: "panels", title: "Fuse box, meters & panels", text: "Need access, can't be covered", one: "Fuse box", mark: "F", color: "#3E6B55", icon: () => <Ic><rect x="5" y="3" width="14" height="18" rx="1" />{p("M9 7h6M9 11h6M12 15v2")}</Ic> },
];
const fdef = (k: FixedKind) => FIXED.find((f) => f.kind === k)!;
export const placementLabel = (pl: Placement, all: Placement[]) => {
  const d = fdef(pl.kind);
  const many = all.filter((x) => x.kind === pl.kind).length > 1;
  return many ? `${d.one} ${pl.n}` : d.kind === "panels" ? "Fuse box" : d.one;
};

/** Counts → one placement per counted thing, keeping walls already set. */
function syncPlacements(counts: JourneyState["fixedCounts"], prev: Placement[]): Placement[] {
  const out: Placement[] = [];
  for (const d of FIXED) {
    if (d.inWalls) continue;
    const n = counts[d.kind] ?? 0;
    for (let i = 1; i <= n; i++) out.push(prev.find((x) => x.kind === d.kind && x.n === i) ?? { id: uid(), kind: d.kind, n: i });
  }
  return out;
}

/** 4.3 · Fixed features — asked after the floor plan, so doors and windows read from the plan are already here. */
export function Fixed() {
  const { s, set } = useJourney();
  const { toast } = useToast();
  const st = stateInfo(s.houseState);
  const plan = st.id === "core-shell" || st.id === "redoing";
  const cam = useRef<HTMLInputElement>(null);
  const gal = useRef<HTMLInputElement>(null);
  const target = useRef<string | null>(null);
  const mp = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const pl = s.placements;
  const current = pl.find((x) => x.id === active) ?? pl.find((x) => !x.wall);
  const placed = pl.filter((x) => x.wall).length;

  const setCount = (k: FixedKind, n: number) =>
    set((x) => {
      const counts = { ...x.fixedCounts, [k]: Math.max(0, Math.min(9, n)) };
      return { fixedCounts: counts, placements: syncPlacements(counts, x.placements), fixedTbc: x.fixedTbc.filter((t) => t !== k) };
    });
  const photo = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    try {
      const url = await uploadPhoto(f);
      const id = target.current;
      set((x) => (id ? { placements: x.placements.map((p) => (p.id === id ? { ...p, photo: url } : p)) } : { fixedPhotos: [...x.fixedPhotos, url] }));
    } catch (e) {
      toast({ title: "The photo didn't upload", description: (e as Error).message, variant: "destructive" });
    }
  };
  const box = { w: 214, h: 284 };
  const place = (e: MouseEvent<HTMLDivElement>) => {
    if (!current) return;
    const r = mp.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    const d = { A: y, C: 1 - y, D: x, B: 1 - x };
    const wall = (Object.entries(d) as [Wall, number][]).sort((a, b) => a[1] - b[1])[0][0];
    const pos = Math.round((wall === "A" || wall === "C" ? x : y) * 100);
    set((xx) => ({ placements: xx.placements.map((p) => (p.id === current.id ? { ...p, wall, pos } : p)) }));
    setActive(null);
  };
  const needPhoto = pl.filter((x) => !x.photo);
  const shots = [...pl.filter((x) => x.photo), ...needPhoto.slice(0, 2)];

  return (
    <Screen board="S3-Fixed" step={4} right={roomName(curRoom(s))} wrapStyle={{ maxWidth: "1080px" }}>
      <p className="eyebrow">Your room, as it is</p>
      <h1 className="h1">What can't move?</h1>
      <p className="sub">Count what's built into the room, then snap a photo and show us where each one is.</p>
      <div className="fx">
        {FIXED.map((d) => {
          const n = s.fixedCounts[d.kind] ?? 0;
          const Icon = d.icon;
          if (d.inWalls) {
            const tbc = s.fixedTbc.includes(d.kind);
            return (
              <div className="fr" key={d.kind}>
                <span className="ic-w">
                  <Icon />
                </span>
                <span>
                  <b>{d.title}</b>
                  <small>{plan ? `${st.lbl}: we'll plan these` : "Kept where they are"}</small>
                </span>
                <span className="step">
                  <button className="ns" type="button" aria-pressed={tbc} onClick={() => set((x) => ({ fixedTbc: tbc ? x.fixedTbc.filter((t) => t !== d.kind) : [...x.fixedTbc, d.kind] }))}>
                    {tbc ? "Not sure · TBC" : "Not sure · TBC"}
                  </button>
                </span>
              </div>
            );
          }
          return (
            <div className={`fr${n ? " set" : ""}`} key={d.kind}>
              <span className="ic-w">
                <Icon />
              </span>
              <span>
                <b>{d.title}</b>
                <small>{d.text}</small>
              </span>
              <span className="step">
                <button type="button" aria-label={`Fewer ${d.title.toLowerCase()}`} onClick={() => setCount(d.kind, n - 1)}>
                  −
                </button>
                <output>{n}</output>
                <button type="button" aria-label={`More ${d.title.toLowerCase()}`} onClick={() => setCount(d.kind, n + 1)}>
                  +
                </button>
              </span>
            </div>
          );
        })}
      </div>
      <section className="panel" style={{ marginTop: "28px" }}>
        <div className="row between">
          <div className="stack" style={{ gap: "6px" }}>
            <h2 className="h3">Show us where they are</h2>
            <p className="p" style={{ fontSize: "16px" }}>
              A photo of each, then a tap on the wall it sits on. Anything we read from your plan is already placed.
            </p>
          </div>
          <span className="tag">
            {placed} of {pl.length} placed
          </span>
        </div>
        <div className="where">
          <div className="stack" style={{ gap: "14px" }}>
            <span className="lbl">Photos</span>
            <div className="shots">
              {shots.map((x, i) =>
                x.photo ? (
                  <div className="shot" key={x.id}>
                    <div className="ph">
                      <img className="img" src={x.photo} alt={placementLabel(x, pl)} />
                      <span className="ok">
                        <I.check />
                      </span>
                    </div>
                    {placementLabel(x, pl)}
                  </div>
                ) : (
                  <div className="shot" key={x.id}>
                    <button
                      className={`snap${i === shots.findIndex((y) => !y.photo) ? " pri" : ""}`}
                      type="button"
                      onClick={() => {
                        target.current = x.id;
                        cam.current?.click();
                      }}
                    >
                      <I.camera />
                      Take photo
                    </button>
                    {placementLabel(x, pl)}
                  </div>
                ),
              )}
              {s.fixedPhotos.map((src, i) => (
                <div className="shot" key={src}>
                  <div className="ph">
                    <img className="img" src={src} alt={`Room photo ${i + 1}`} />
                    <span className="ok">
                      <I.check />
                    </span>
                  </div>
                  Room photo {i + 1}
                </div>
              ))}
              <div className="shot">
                <button
                  className="snap"
                  type="button"
                  onClick={() => {
                    target.current = null;
                    gal.current?.click();
                  }}
                >
                  <I.upload />
                  Upload
                </button>
                From your gallery
              </div>
            </div>
            <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void photo(e.target.files)} />
            <input ref={gal} type="file" accept="image/*" hidden onChange={(e) => void photo(e.target.files)} />
            <p className="small" style={{ margin: "0" }}>
              We read sockets, pipes and vents from the photos too — you just confirm.
            </p>
          </div>
          <div className="stack" style={{ gap: "14px" }}>
            <span className="lbl">Mark on the plan</span>
            <div className="mp-box">
              <div className="mp" ref={mp} role="img" aria-label="Room outline with the fixed features placed" onClick={place} style={{ cursor: current ? "crosshair" : undefined }}>
                {WALLS.map((w) => (
                  <span key={w} className="wl" style={{ A: { left: "94px", top: "-38px" }, B: { right: "-42px", top: "128px" }, C: { left: "94px", bottom: "-42px" }, D: { left: "-42px", top: "128px" } }[w]}>
                    {w}
                  </span>
                ))}
                {pl
                  .filter((x) => x.wall)
                  .flatMap((x) => {
                    const d = fdef(x.kind);
                    const els: JSX.Element[] = [];
                    if (x.kind === "windows" || x.kind === "doors") {
                      const bar = onWall(x.wall!, x.pos ?? 50, { long: x.kind === "windows" ? 100 : 52, thick: 8 }, { w: 230, h: 300 });
                      const off = (v: unknown) => (v === 0 ? -8 : (v as number) - 8);
                      els.push(
                        <div key={x.id + "b"} className="f" style={{ background: d.color, borderRadius: 0, width: bar.width, height: bar.height, top: "top" in bar ? off(bar.top) : undefined, left: "left" in bar ? off(bar.left) : undefined, right: "right" in bar ? off(bar.right) : undefined, bottom: "bottom" in bar ? off(bar.bottom) : undefined }} />,
                      );
                    }
                    if (x.kind !== "windows") {
                      const big = x.kind === "radiators";
                      const m = onWall(x.wall!, x.pos ?? 50, { long: big ? 80 : 24, thick: big ? 14 : 24 }, box);
                      const inset = (v: unknown) => (v === 0 ? 6 : v);
                      els.push(
                        <div key={x.id} className="f" style={{ background: d.color, width: m.width, height: m.height, top: inset(m.top), left: inset(m.left), right: inset(m.right), bottom: inset(m.bottom) } as React.CSSProperties}>
                          {d.mark}
                          {x.kind === "doors" && pl.filter((y) => y.kind === "doors").length > 1 ? x.n : ""}
                        </div>,
                      );
                    }
                    return els;
                  })}
                {current && <span className="ghost">Tap to place {placementLabel(current, pl).toLowerCase()}</span>}
              </div>
            </div>
            <div className="plc">
              {pl.map((x) => (
                <button key={x.id} className={x.wall && x.id !== current?.id ? "done" : x.id === current?.id ? "now" : ""} type="button" aria-pressed={x.id === current?.id} onClick={() => setActive(x.id)}>
                  {x.wall && x.id !== current?.id ? `✓ ${placementLabel(x, pl)} · ${x.wall}` : placementLabel(x, pl)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="panel lav" style={{ marginTop: "28px", padding: "24px 28px" }}>
        <div className="row" style={{ gap: "14px", flexWrap: "nowrap" }}>
          <I.info />
          <p className="p" style={{ fontSize: "16px" }}>
            {s.keeping.some((k) => !k.fixedSpot)
              ? `Your ${list(s.keeping.filter((k) => !k.fixedSpot).map((k) => k.name.toLowerCase().replace(/^upright /, "")))} can move unless you marked its spot fixed. Everything here stays where it is.`
              : "Everything here stays where it is."}
          </p>
        </div>
      </section>
      <div className="actions">
        <Back to="S4-Measure" />
        <Go className="btn auto" to="S4-Layouts" style={{ marginLeft: "auto" }}>
          Show me layouts
          <I.next />
        </Go>
      </div>
    </Screen>
  );
}

const wallsOf = (xs: Placement[]) => Array.from(new Set(xs.map((x) => x.wall).filter(Boolean))).join(", ");

/** "1 window + 1 radiator (wall C) · 2 doors (wall D, 1 to place) · fuse box (wall D)" */
export function fixedLine(s: JourneyState) {
  const groups = FIXED.filter((d) => !d.inWalls && (s.fixedCounts[d.kind] ?? 0) > 0).map((d) => {
    const xs = s.placements.filter((x) => x.kind === d.kind);
    const n = xs.length;
    const todo = xs.filter((x) => !x.wall).length;
    const name = d.kind === "panels" ? "fuse box" : `${n} ${n === 1 ? d.one.toLowerCase() : d.title.toLowerCase()}`;
    const w = wallsOf(xs);
    const where = [w ? `wall ${w}` : null, todo ? `${todo} to place` : null].filter(Boolean).join(", ");
    return { name, where, w };
  });
  // group neighbours on the same single wall: "1 window + 1 radiator (wall C)"
  const out: string[] = [];
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const nx = groups[i + 1];
    if (nx && g.where && g.where === nx.where && !g.where.includes("to place")) {
      out.push(`${g.name} + ${nx.name} (${g.where})`);
      i++;
    } else out.push(g.where ? `${g.name} (${g.where})` : g.name);
  }
  return out.join(" · ") || "Nothing fixed";
}

/** 3.2 · Step 3 summary */
export function Step3Summary() {
  const { s } = useJourney();
  const open = [
    ...s.placements.filter((x) => !x.photo && x.kind === "panels").map(() => "Photo of the fuse box & meters"),
  ];
  return (
    <StepSummary
      step={3}
      board="S3-Summary"
      sub="We know how you live in the room. Next: your floor plan, and what can't move."
      decWrap
      decisions={[
        { k: "Activities", v: s.activities.join(" · ") || "None picked", edit: "S3-Activities" },
      ]}
      open={open}
      soFar={soFar(s, 3)}
      back="S3-Activities"
      next="S4-Input"
    />
  );
}

