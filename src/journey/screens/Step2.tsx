/** Step 2 — Inspiration & moodboard: how to share a style, photos, reading them, style matches, moodboard, one preview, adjusting it, summary. */
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Back, Go, Opt, Screen, useGo } from "../Shell";
import { I, Ic, SCOPE_ICON } from "../icons";
import { roomName } from "../data";
import { stepLine } from "../story";
import { curRoom, uid, useJourney, type JourneyState, type ReadKey, type StyleMatch } from "../state";
import { StepSummary } from "../Summary";
import { analyzeStyles, blendName, findStylePieces, generatePreview, paletteFrom, readDesign, uploadPhoto } from "../services";
import { saveStepDone } from "../sync";

const MAX_PHOTOS = 10;
const QUICK = ["Keep it cosy", "Not too dark", "Pet friendly", "Kid friendly"];

/** 2.1 · Capture the vision */
export function Vision() {
  const { s, set } = useJourney();
  const go = useGo();
  const pick = (mode: "upload" | "describe" | "discover") => {
    set({ visionMode: mode });
    if (mode === "discover") {
      set({ styles: DISCOVER, analysis: undefined });
      go("S2-Matches");
    } else go("S2-Upload");
  };
  return (
    <Screen board="S2-Vision" step={2} right={roomName(curRoom(s))}>
      <p className="eyebrow">Start your journey</p>
      <h1 className="h1">Capture the vision</h1>
      <p className="sub">How would you like to share your style?</p>
      <div className="g3">
        <Opt tint="a" className="left-al" sel={(s.visionMode ?? "upload") === "upload"} onClick={() => pick("upload")}>
          <span className="tile" style={{ alignSelf: "center" }}>
            <Ic>
              <path d="M12 15V4M7 9l5-5 5 5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
            </Ic>
          </span>
          <span className="stack" style={{ gap: "12px" }}>
            <span className="opt-t">
              Upload
              <br />
              inspiration
            </span>
            <span className="p" style={{ color: "#4E4566" }}>
              Photos you've taken, screenshots, Pinterest saves.
            </span>
          </span>
        </Opt>
        <Opt tint="b" className="left-al" sel={s.visionMode === "describe"} onClick={() => pick("describe")}>
          <span className="tile" style={{ alignSelf: "center" }}>
            <Ic>
              <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13 20h7" />
            </Ic>
          </span>
          <span className="stack" style={{ gap: "12px" }}>
            <span className="opt-t">
              Describe your
              <br />
              style
            </span>
            <span className="p" style={{ color: "#4E4566" }}>
              “Dark, cosy, lots of plants and velvet.”
            </span>
          </span>
        </Opt>
        <Opt tint="c" className="left-al" sel={s.visionMode === "discover"} onClick={() => pick("discover")}>
          <span className="tile" style={{ alignSelf: "center" }}>
            <Ic>
              <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.9-.6-1.3-.6-2.2 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4c0-4.7-4-8.5-9-8.5z" />
              <circle cx="7.5" cy="11" r="1" />
              <circle cx="10" cy="7" r="1" />
              <circle cx="15" cy="7.5" r="1" />
            </Ic>
          </span>
          <span className="stack" style={{ gap: "12px" }}>
            <span className="opt-t">
              Discover
              <br />
              styles
            </span>
            <span className="p" style={{ color: "#4E4566" }}>
              Swipe through looks and keep the ones you love.
            </span>
          </span>
        </Opt>
      </div>
      <div className="actions">
        <Back to="S1-Summary" />
      </div>
    </Screen>
  );
}

/** Starting looks for "Discover styles" (the six core styles of the app). */
const DISCOVER: StyleMatch[] = [
  { name: "Modern Minimal", score: 0, keywords: ["clean lines", "neutral", "calm", "uncluttered", "matte"].map((w) => ({ word: w, on: false })), pieces: [] },
  { name: "Bohemian Eclectic", score: 0, keywords: ["layered", "pattern", "plants", "collected", "warm"].map((w) => ({ word: w, on: false })), pieces: [] },
  { name: "Glam & Luxe", score: 0, keywords: ["velvet", "brass", "jewel tones", "marble", "curved"].map((w) => ({ word: w, on: false })), pieces: [] },
  { name: "Rustic Nature", score: 0, keywords: ["wood", "linen", "stone", "earthy", "handmade"].map((w) => ({ word: w, on: false })), pieces: [] },
  { name: "Mediterranean", score: 0, keywords: ["terracotta", "arches", "lime plaster", "sun-washed", "rattan"].map((w) => ({ word: w, on: false })), pieces: [] },
  { name: "Classic Historical", score: 0, keywords: ["mouldings", "symmetry", "antiques", "panelling", "rich wood"].map((w) => ({ word: w, on: false })), pieces: [] },
];

/** 2.2 · Upload inspiration */
export function Upload() {
  const { s, set } = useJourney();
  const go = useGo();
  const { toast } = useToast();
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [pin, setPin] = useState<string | null>(null);
  const describe = s.visionMode === "describe";

  const add = async (files: FileList | null) => {
    const list = Array.from(files ?? []).slice(0, MAX_PHOTOS - s.photos.length);
    for (const f of list) {
      setBusy((n) => n + 1);
      try {
        const url = await uploadPhoto(f);
        set((p) => ({ photos: [...p.photos, url].slice(0, MAX_PHOTOS), styles: [], analysis: undefined }));
      } catch (e) {
        toast({ title: "A photo didn't upload", description: (e as Error).message, variant: "destructive" });
      } finally {
        setBusy((n) => n - 1);
      }
    }
  };
  const canAnalyze = s.photos.length > 0 || (describe && (s.note ?? "").trim().length > 3);

  return (
    <Screen board="S2-Upload" step={2} right={roomName(curRoom(s))}>
      <h1 className="h1" style={{ marginTop: "0" }}>
        {describe ? "Describe your style" : "Upload Room Inspiration"}
      </h1>
      <p className="sub">
        {describe
          ? "Tell us what you love — add a few photos too if you have them — and we'll build your personalized moodboard."
          : "Share photos of rooms you love and we'll analyze the styles to create your personalized moodboard."}
      </p>
      <section className="panel" style={{ marginTop: "44px" }}>
        <div className="row between" style={{ marginBottom: "20px" }}>
          <span className="lbl">
            {s.photos.length} of {MAX_PHOTOS} photos · JPG, PNG or HEIC
          </span>
          <button className="link-btn" type="button" onClick={() => setPin(pin == null ? "" : null)}>
            <I.link />
            Paste a Pinterest link
          </button>
        </div>
        {pin != null && (
          <div className="row" style={{ marginBottom: "20px", gap: "12px", flexWrap: "nowrap" }}>
            <input
              className="input"
              placeholder="https://pin.it/… or a board link"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              aria-label="Pinterest link"
            />
            <button
              className="btn auto"
              type="button"
              style={{ minHeight: "56px" }}
              onClick={() => {
                if (!/^https?:\/\/\S+$/.test(pin.trim())) {
                  toast({ title: "Paste a full link, starting with https://" });
                  return;
                }
                set({ pinterest: pin.trim(), note: [s.note, `Pinterest: ${pin.trim()}`].filter(Boolean).join("\n") });
                setPin(null);
              }}
            >
              Add link
            </button>
          </div>
        )}
        <div className="up">
          {s.photos.map((src, i) => (
            <div className="ph" key={src}>
              <img className="img" src={src} alt={`Inspiration photo ${i + 1}`} />
              <button
                className="rm"
                type="button"
                aria-label="Remove photo"
                onClick={() => set((p) => ({ photos: p.photos.filter((x) => x !== src), styles: [], analysis: undefined }))}
              >
                <I.x />
              </button>
            </div>
          ))}
          {Array.from({ length: busy }, (_, i) => (
            <div className="ph" key={`b${i}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "#665A80" }}>
              Uploading…
            </div>
          ))}
          {s.photos.length + busy < MAX_PHOTOS && (
            <button className="add" type="button" onClick={() => file.current?.click()}>
              <Ic>
                <path d="M12 15V4M7 9l5-5 5 5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
              </Ic>
              {s.photos.length ? "Add more" : "Add photos"}
            </button>
          )}
          <input ref={file} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={(e) => void add(e.target.files).then(() => (e.target.value = ""))} />
        </div>
        <div className="field" style={{ marginTop: "32px" }}>
          <label htmlFor="note">
            {describe ? "Describe the room you want " : "Anything we should know? "}
            <span style={{ fontWeight: "400", color: "#7C7090" }}>{describe ? "— a few words is enough" : "— optional"}</span>
          </label>
          <textarea
            id="note"
            className="textarea"
            placeholder={describe ? "e.g. Dark, cosy, lots of plants and velvet." : "e.g. I love the green shelving, but not the red chair."}
            value={s.note ?? ""}
            onChange={(e) => set({ note: e.target.value })}
          />
        </div>
        <div className="chips" style={{ marginTop: "14px" }}>
          {QUICK.map((q) => {
            const on = s.quickNotes.includes(q);
            return (
              <button
                key={q}
                className={`chip${on ? " on" : ""}`}
                type="button"
                aria-pressed={on}
                style={{ minHeight: "44px", fontSize: "15px" }}
                onClick={() => set((p) => ({ quickNotes: on ? p.quickNotes.filter((x) => x !== q) : [...p.quickNotes, q] }))}
              >
                {on ? "✓" : "+"} {q}
              </button>
            );
          })}
        </div>
        <Go className={`btn${canAnalyze && !busy ? "" : " dis"}`} to="S2-Analyzing" style={{ marginTop: "32px" }} onClick={() => canAnalyze && !busy}>
          <Ic>
            <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
            <path d="M19 3v4M17 5h4" />
          </Ic>
          Analyze Styles
        </Go>
      </section>
      <div className="actions">
        <Back to="S2-Vision" />
      </div>
    </Screen>
  );
}

const PENDING_CUES = ["Colours and palette", "Materials and textures", "Furniture and objects", "Greenery and natural shapes", "Lighting mood"];

/** 2.3 · Reading your references */
export function Analyzing() {
  const { s, set } = useJourney();
  const go = useGo();
  const { toast } = useToast();
  const [pct, setPct] = useState(4);
  const [err, setErr] = useState<string | null>(null);
  const started = useRef(false);
  const n = Math.max(1, s.photos.length);

  useEffect(() => {
    const t = setInterval(() => setPct((p) => (p < 92 ? p + Math.max(1, Math.round((92 - p) / 12)) : p)), 450);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        const r = await analyzeStyles(s);
        const styles = await Promise.all(
          r.styles.map(async (st) => {
            const pieces = await findStylePieces(st);
            return {
              ...st,
              pieces: pieces.length ? pieces : s.photos.slice(0, 4).map((src, i) => ({ id: `photo-${i}`, label: `From your photo ${i + 1}`, image: src, added: i === 0, source: "photo" })),
            };
          }),
        );
        set({ styles, analysis: { colors: r.colors, cues: r.cues, materials: r.materials, description: r.description } });
        setPct(100);
        setTimeout(() => go("S2-Matches"), 500);
      } catch (e) {
        setErr((e as Error).message);
        toast({ title: "We couldn't read your references", description: (e as Error).message, variant: "destructive" });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const photoNo = Math.min(n, Math.max(1, Math.ceil((pct / 100) * n)));
  const cues = s.analysis?.cues?.length ? s.analysis.cues : PENDING_CUES;
  const ticked = s.analysis ? cues.length : Math.min(cues.length - 2, Math.floor(pct / 22));
  return (
    <Screen board="S2-Analyzing" step={2} right={roomName(curRoom(s))} wrapStyle={{ maxWidth: "860px" }}>
      <p className="script">reading your references…</p>
      <h1 className="h1" style={{ fontSize: "clamp(36px,4.4vw,60px)" }}>
        Finding what you love
      </h1>
      <div className="thumbs">
        {s.photos.slice(0, 4).map((src, i) => (
          <div className={`ph${i === photoNo - 1 ? " scan" : ""}`} key={src}>
            <img className="img" src={src} alt={`Reference photo ${i + 1}`} />
          </div>
        ))}
      </div>
      <section className="panel" style={{ marginTop: "40px" }}>
        <div className="row between" style={{ marginBottom: "12px" }}>
          <span className="lbl">{s.photos.length ? `Analysing photo ${photoNo} of ${n}` : "Reading your description"}</span>
          <span className="lbl">{pct}%</span>
        </div>
        <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Analysis progress">
          <span style={{ width: `${pct}%` }} />
        </div>
        <div style={{ marginTop: "20px" }}>
          {cues.map((c, i) =>
            i < ticked ? (
              <div className="cue" key={c}>
                <span className="ok">
                  <I.check />
                </span>
                {c}
                {i === 0 && s.analysis?.colors?.length ? (
                  <span className="sw-mini">
                    {s.analysis.colors.slice(0, 3).map((h) => (
                      <i key={h} style={{ background: h }} />
                    ))}
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="cue pending" key={c}>
                <span className="wait" aria-hidden="true" style={i > ticked ? { borderTopColor: "#E4DAE2" } : undefined} />
                {c}
              </div>
            ),
          )}
        </div>
      </section>
      <p className="small" style={{ textAlign: "center", marginTop: "24px" }}>
        {err ? (
          <>
            Something went wrong. <Go to="S2-Upload">Back to photos</Go>
          </>
        ) : (
          <>
            This usually takes under 20 seconds.{" "}
            {s.styles.length > 0 && <Go to="S2-Matches">See results</Go>}
          </>
        )}
      </p>
    </Screen>
  );
}

/** 2.4 · Style matches */
export function Matches() {
  const { s, set } = useJourney();
  const { toast } = useToast();
  const [more, setMore] = useState(false);
  const discover = s.visionMode === "discover";
  const upd = (i: number, f: (st: StyleMatch) => StyleMatch) => set((p) => ({ styles: p.styles.map((st, j) => (j === i ? f(st) : st)) }));
  const added = s.styles.flatMap((st) => st.pieces.filter((p) => p.added));
  const words = s.styles.flatMap((st) => st.keywords.filter((k) => k.on));
  const ready = added.length + words.length > 0;

  useEffect(() => {
    // Discover mode: fetch pieces for each look once.
    if (!discover || s.styles.every((st) => st.pieces.length)) return;
    (async () => {
      const filled = await Promise.all(s.styles.map(async (st) => (st.pieces.length ? st : { ...st, pieces: await findStylePieces(st) })));
      set({ styles: filled });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discover]);

  const another = async () => {
    setMore(true);
    try {
      const r = await analyzeStyles(s, { exclude: s.styles.map((st) => st.name) });
      const extra = await Promise.all(r.styles.slice(0, 1).map(async (st) => ({ ...st, pieces: await findStylePieces(st) })));
      if (!extra.length) toast({ title: "No other style stood out in your photos" });
      set((p) => ({ styles: [...p.styles, ...extra] }));
    } catch (e) {
      toast({ title: "Couldn't detect another style", description: (e as Error).message, variant: "destructive" });
    } finally {
      setMore(false);
    }
  };

  const create = () => {
    const top = [...s.styles].sort((a, b) => b.score - a.score);
    const colors = s.analysis?.colors?.length ? s.analysis.colors : ["#5B2E45", "#2F5B4A", "#4A3022", "#B4975A", "#6B6862"];
    set({
      moodboard: {
        name: blendName(top.filter((st) => st.keywords.some((k) => k.on) || st.pieces.some((p) => p.added))),
        description: s.analysis?.description,
        image: s.moodboard?.image,
        palette: paletteFrom(colors),
        feels: words.map((w) => w.word).slice(0, 8),
      },
      preview: undefined,
    });
    return true;
  };

  return (
    <Screen board="S2-Matches" step={2} right={roomName(curRoom(s))}>
      <h1 className="h1" style={{ marginTop: "0" }}>
        {discover ? "Discover styles" : "Style Matches"}
      </h1>
      <p className="sub">
        {discover
          ? "Tap the words and pieces that feel like you — they shape your moodboard."
          : `We found ${s.styles.length === 1 ? "one style" : s.styles.length === 2 ? "two styles" : `${s.styles.length} styles`} in your photos. Tap the words and pieces that feel like you — they shape your moodboard.`}
      </p>
      <section className="panel" style={{ marginTop: "40px", padding: "28px" }}>
        {s.styles.map((st, i) => {
          const chosen = st.keywords.some((k) => k.on) || st.pieces.some((p) => p.added);
          return (
            <div key={st.name} className={`style ${i % 2 ? "bio" : "luxe"}`} style={{ marginTop: i ? "24px" : undefined, ...(i % 2 && !chosen ? { borderColor: "transparent" } : {}) }}>
              <div className="row between">
                <h2 className="h2" style={{ fontSize: "30px" }}>
                  {st.name}
                </h2>
                {st.score > 0 && <span className="pct">{st.score}% match</span>}
              </div>
              <div className="chips" style={{ marginTop: "18px", gap: "10px" }}>
                {st.keywords.map((k, ki) => (
                  <button
                    key={k.word}
                    className={`kw${k.on ? " on" : ""}`}
                    type="button"
                    aria-pressed={k.on}
                    onClick={() => upd(i, (x) => ({ ...x, keywords: x.keywords.map((y, yi) => (yi === ki ? { ...y, on: !y.on } : y)) }))}
                  >
                    {k.on ? <I.check /> : <I.plus />}
                    {k.word}
                  </button>
                ))}
              </div>
              {st.pieces.length > 0 && (
                <div className="pics">
                  {st.pieces.slice(0, 4).map((p, pi) => (
                    <div className="ph" key={p.id}>
                      <img className="img" src={p.image} alt={p.label} />
                      <button
                        className={`add-pill${p.added ? " on" : ""}`}
                        type="button"
                        aria-pressed={p.added}
                        onClick={() => upd(i, (x) => ({ ...x, pieces: x.pieces.map((y, yi) => (yi === pi ? { ...y, added: !y.added } : y)) }))}
                      >
                        {p.added ? <I.check /> : <I.plus />}
                        {p.added ? "Added" : "Add to moodboard"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {!discover && (
          <div className="row" style={{ justifyContent: "center", marginTop: "28px" }}>
            <button className="btn ghost auto" type="button" onClick={another} disabled={more}>
              <I.plus />
              {more ? "Looking for another style…" : "Detect another style"}
            </button>
          </div>
        )}
        <div className="sticky">
          <div className="thumbs">
            {added.slice(0, 4).map((p) => (
              <img key={p.id} src={p.image} alt="" />
            ))}
          </div>
          <span style={{ fontSize: "17px" }}>
            <b>
              {added.length} piece{added.length === 1 ? "" : "s"}
            </b>{" "}
            and{" "}
            <b>
              {words.length} word{words.length === 1 ? "" : "s"}
            </b>{" "}
            on your moodboard
          </span>
          <Go
            className={`btn auto${ready ? "" : " dis"}`}
            to="S2-Moodboard"
            style={{ marginLeft: "auto", background: "#FBF8F6", color: "#3B3350" }}
            onClick={() => ready && create()}
          >
            <Ic>
              <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
            </Ic>
            Create my moodboard
          </Go>
        </div>
      </section>
      <div className="actions">
        <Back to={discover ? "S2-Vision" : "S2-Upload"} label={discover ? "Back" : "Back to photos"} />
      </div>
    </Screen>
  );
}

/** Six-dot sub-progress of step 2 shown on the moodboard. */
function Dots({ at }: { at: number }) {
  return (
    <div className="dots" aria-label={`Moodboard page ${at} of 6`}>
      {Array.from({ length: 6 }, (_, i) => (
        <i key={i} className={i + 1 < at ? "done" : i + 1 === at ? "on" : ""} />
      ))}
    </div>
  );
}

/** The moodboard picture: the saved image, or a collage of the chosen pieces and photos. */
function Collage({ s, id }: { s: JourneyState; id?: string }) {
  if (s.moodboard?.image) return <img className="img" src={s.moodboard.image} alt="Your moodboard" />;
  const imgs = [...s.styles.flatMap((st) => st.pieces.filter((p) => p.added).map((p) => p.image)), ...s.photos].slice(0, 6);
  return (
    <div id={id} style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gridAutoRows: "1fr", gap: "8px", padding: "8px" }}>
      {imgs.map((src, i) => (
        <img key={src + i} src={src} alt="" crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "14px", gridColumn: i === 0 ? "span 2" : undefined, gridRow: i === 0 ? "span 2" : undefined }} />
      ))}
    </div>
  );
}

/** 2.5 · Your moodboard */
export function Moodboard() {
  const { s } = useJourney();
  const { toast } = useToast();
  const mb = s.moodboard;
  const share = async () => {
    const text = `My ${roomName(curRoom(s)).toLowerCase()} moodboard: ${mb?.name}`;
    try {
      if (navigator.share) await navigator.share({ title: mb?.name, text, url: mb?.image });
      else {
        await navigator.clipboard.writeText(`${text}${mb?.image ? ` — ${mb.image}` : ""}`);
        toast({ title: "Copied — paste it anywhere to share" });
      }
    } catch {
      /* cancelled */
    }
  };
  const save = async () => {
    try {
      let href = mb?.image;
      if (!href) {
        const el = document.getElementById("mb-collage");
        if (!el) return;
        const html2canvas = (await import("html2canvas")).default;
        href = (await html2canvas(el, { useCORS: true, backgroundColor: "#F4EDE8" })).toDataURL("image/png");
      }
      const a = document.createElement("a");
      a.href = href;
      a.download = `${(mb?.name ?? "moodboard").replace(/\s+/g, "-").toLowerCase()}.png`;
      a.target = "_blank";
      a.click();
    } catch {
      toast({ title: "Couldn't save the image", variant: "destructive" });
    }
  };
  return (
    <Screen board="S2-Moodboard" step={2} right={roomName(curRoom(s))}>
      <section className="panel" style={{ padding: "40px" }}>
        <Dots at={2} />
        <p className="script" style={{ marginTop: "20px" }}>
          a moodboard, curated for you
        </p>
        <h1 className="h1" style={{ fontSize: "clamp(36px,4vw,56px)", marginTop: "6px" }}>
          {mb?.name ?? "Your moodboard"}
        </h1>
        {mb?.description && (
          <p className="sub" style={{ fontSize: "19px" }}>
            {mb.description}
          </p>
        )}
        <div className="mb">
          <div className="mb-img">
            <div className="ph">
              <Collage s={s} id="mb-collage" />
            </div>
          </div>
          <div className="mb-side">
            <div className="card">
              <span className="lbl">Palette</span>
              <div style={{ marginTop: "8px" }}>
                {(mb?.palette ?? []).map((c) => (
                  <div className="col" key={c.hex + c.name}>
                    <i style={{ background: c.hex }} />
                    {c.name}
                    <span>{c.use}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <span className="lbl">Feels like</span>
              <div className="chips" style={{ marginTop: "12px", gap: "8px" }}>
                {(mb?.feels ?? []).map((f) => (
                  <span className="tag" key={f}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div className="row" style={{ gap: "12px" }}>
              <button className="btn ghost auto" type="button" style={{ flex: "1 1 auto", minHeight: "56px", fontSize: "16px" }} onClick={share}>
                <Ic>
                  <path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
                </Ic>
                Share
              </button>
              <button className="btn ghost auto" type="button" style={{ flex: "1 1 auto", minHeight: "56px", fontSize: "16px" }} onClick={save}>
                <Ic>
                  <path d="M12 4v11M7 10l5 5 5-5M4 20h16" />
                </Ic>
                Save image
              </button>
            </div>
          </div>
        </div>
        <div className="actions">
          <Go className="btn ghost auto" to="S2-Matches">
            Back
          </Go>
          <Go className="btn auto" to="S2-Preview" style={{ marginLeft: "auto" }}>
            See it in a room
            <I.next />
          </Go>
        </div>
      </section>
    </Screen>
  );
}

/** Make the first preview (or reuse it) and read it once. */
function usePreview() {
  const { s, set } = useJourney();
  const { toast } = useToast();
  const [busy, setBusy] = useState<"make" | "read" | null>(null);
  const v = s.preview?.versions[s.preview.current];
  const once = useRef(false);
  useEffect(() => {
    if (once.current) return;
    once.current = true;
    (async () => {
      try {
        let img = v?.image;
        if (!img) {
          setBusy("make");
          img = await generatePreview(s);
          set({ preview: { versions: [{ id: uid(), image: img, createdAt: new Date().toISOString() }], current: 0 } });
        }
        if (s.preview?.readOf !== img || !s.preview?.read) {
          setBusy("read");
          const read = await readDesign(img, s.moodboard?.name);
          set((p) => ({ preview: { ...(p.preview ?? { versions: [], current: 0 }), read, readOf: img } }));
        }
      } catch (e) {
        toast({ title: "The preview isn't ready", description: (e as Error).message, variant: "destructive" });
      } finally {
        setBusy(null);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { busy, v };
}

const PART: Record<ReadKey, { title: string; icon: () => JSX.Element; n: number }> = {
  finishes: { title: "Interior finishes", icon: SCOPE_ICON.walls, n: 1 },
  furniture: { title: "Furniture", icon: SCOPE_ICON.furniture, n: 2 },
  colours: {
    title: "Colours, contrast & materials",
    n: 3,
    icon: () => (
      <Ic>
        <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-.9-.6-1.3-.6-2.2 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4c0-4.7-4-8.5-9-8.5z" />
        <circle cx="7.5" cy="11" r="1" />
        <circle cx="10" cy="7" r="1" />
        <circle cx="15" cy="7.5" r="1" />
      </Ic>
    ),
  },
  decor: { title: "Decor", n: 4, icon: () => <Ic><path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15M5 19l7-7" /></Ic> },
  lighting: { title: "Lighting", icon: SCOPE_ICON.lighting, n: 5 },
};

/** 2.6 · One preview — keep or adjust */
export function Preview() {
  const { s, set } = useJourney();
  const { busy, v } = usePreview();
  const items = (s.preview?.read ?? []).flatMap((p) => (p.key === "furniture" ? p.keywords.slice(0, 2) : p.key === "colours" ? p.keywords.slice(0, 2) : p.keywords.slice(0, 1))).slice(0, 6);
  const n = (s.preview?.current ?? 0) + 1;
  return (
    <Screen board="S2-Preview" step={2} right={roomName(curRoom(s))}>
      <p className="eyebrow">Your direction</p>
      <h1 className="h1">One preview. Keep or adjust.</h1>
      <p className="sub">
        Here's your {roomName(curRoom(s)).toLowerCase()}, inspired by your references. It's a direction — the real fit comes once we know the room.
      </p>
      <div className="ph hero" style={{ marginTop: "40px", borderRadius: "28px" }}>
        {v ? (
          <img className="img" src={v.image} alt={`Inspired ${roomName(curRoom(s)).toLowerCase()} preview`} style={{ borderRadius: "28px" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#665A80", fontSize: "20px" }}>
            {busy === "make" ? "Painting your preview… about a minute" : "No preview yet"}
          </div>
        )}
        <span className="num">{n}</span>
        <span className="badge">
          <I.info />
          Inspired preview · not to scale
        </span>
      </div>
      <div className="row" style={{ marginTop: "20px", gap: "10px" }}>
        <span className="lbl" style={{ marginRight: "4px" }}>
          In this preview
        </span>
        {items.length ? (
          items.map((t) => (
            <span className="tag line" key={t}>
              {t}
            </span>
          ))
        ) : (
          <span className="small">{busy === "read" ? "Reading the preview…" : "—"}</span>
        )}
      </div>
      <div className="decide">
        <Go
          className="dc pri"
          to="S2-Summary"
          onClick={() => {
            if (!v) return false;
            set((p) => ({ preview: { ...p.preview!, kept: true }, done: Array.from(new Set([...p.done, 2])) }));
            void saveStepDone(s, 2);
          }}
        >
          <span className="tile" style={{ background: "rgba(255,255,255,.16)", color: "#fff", boxShadow: "none" }}>
            <I.check />
          </span>
          <span className="stack" style={{ gap: "6px" }}>
            <span className="h3" style={{ color: "#fff" }}>
              Keep this direction
            </span>
            <span className="p">Go straight to how you use the room and its layout.</span>
          </span>
        </Go>
        <Go className="dc" to="S2-Adjust" onClick={() => !!v}>
          <span className="tile">
            <Ic>
              <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13 20h7" />
            </Ic>
          </span>
          <span className="stack" style={{ gap: "6px" }}>
            <span className="h3">Adjust it</span>
            <span className="p">Say what to change — “lighter walls, but keep the sofa.”</span>
          </span>
        </Go>
      </div>
      <div className="actions" style={{ marginTop: "28px" }}>
        <Back to="S2-Moodboard" label="Back to moodboard" />
      </div>
    </Screen>
  );
}

/** The change request, built from what is kept and what changes. */
function buildRequest(read: { key: ReadKey; keywords: string[] }[], changes: Partial<Record<ReadKey, string>>) {
  const changed = (Object.entries(changes) as [ReadKey, string][]).filter(([, t]) => t?.trim()).map(([, t]) => t.trim().replace(/\.$/, ""));
  const keep = read.filter((p) => changes[p.key] == null).flatMap((p) => p.keywords.slice(0, 1)).map((k) => `the ${k.toLowerCase()}`);
  const parts = [...changed];
  if (keep.length) parts.push(`Keep ${keep.length > 1 ? `${keep.slice(0, -1).join(", ")} and ${keep[keep.length - 1]}` : keep[0]}`);
  return parts.length ? `${parts.join(". ")}.` : "";
}

/** 2.7 · What should change? */
export function Adjust() {
  const { s, set } = useJourney();
  const go = useGo();
  const { toast } = useToast();
  const { busy } = usePreview();
  const [making, setMaking] = useState(false);
  const pv = s.preview;
  const v = pv?.versions[pv.current];
  const read = pv?.read ?? [];
  const changes = pv?.changes ?? {};
  const request = pv?.request ?? buildRequest(read, changes);
  const setPv = (patch: Partial<NonNullable<JourneyState["preview"]>>) => set((p) => ({ preview: { ...(p.preview ?? { versions: [], current: 0 }), ...patch } }));
  const setChange = (k: ReadKey, t: string | null) => {
    const next = { ...changes };
    if (t == null) delete next[k];
    else next[k] = t;
    setPv({ changes: next, request: buildRequest(read, next) });
  };

  const readAgain = async () => {
    if (!v) return;
    try {
      const r = await readDesign(v.image, s.moodboard?.name);
      setPv({ read: r, readOf: v.image, changes: {}, request: undefined });
    } catch (e) {
      toast({ title: "Couldn't read it again", description: (e as Error).message, variant: "destructive" });
    }
  };
  const update = async () => {
    if (!v || !request.trim()) {
      toast({ title: "Say what should change first" });
      return;
    }
    setMaking(true);
    try {
      const img = await generatePreview(s, { sourceImage: v.image, change: request });
      const versions = [...(pv?.versions ?? []), { id: uid(), image: img, request, createdAt: new Date().toISOString() }];
      setPv({ versions, current: versions.length - 1, read: undefined, readOf: undefined, changes: {}, request: undefined });
      const r = await readDesign(img, s.moodboard?.name);
      setPv({ read: r, readOf: img });
      go("S2-Preview");
    } catch (e) {
      toast({ title: "The preview couldn't be updated", description: (e as Error).message, variant: "destructive" });
    } finally {
      setMaking(false);
    }
  };

  return (
    <Screen board="S2-Adjust" step={2} right={roomName(curRoom(s))} wrapClass="wrap wide">
      <div className="left">
        <p className="eyebrow">Adjust your direction</p>
        <h1 className="h1" style={{ fontSize: "clamp(36px,4vw,56px)" }}>
          What should change?
        </h1>
        <p className="sub" style={{ fontSize: "19px" }}>
          We read the preview and summed it up in five parts. Keep what you like, change what you don't.
        </p>
      </div>
      <div className="lay">
        <div className="imgcol">
          <div className="ph pv" style={{ borderRadius: "26px" }}>
            {v && <img className="img" src={v.image} alt="Current inspired preview" style={{ borderRadius: "26px" }} />}
            {read.map((p) => (
              <span key={p.key} className={`hs${changes[p.key] != null ? " chg" : ""}`} style={{ left: `${p.x}%`, top: `${p.y}%` }} aria-label={`${PART[p.key].n} ${PART[p.key].title}`}>
                {PART[p.key].n}
              </span>
            ))}
          </div>
          <span className="lbl" style={{ display: "block", marginTop: "18px" }}>
            Versions
          </span>
          <div className="vers">
            {(pv?.versions ?? []).map((ver, i) => (
              <button
                key={ver.id}
                type="button"
                className={`v${i === pv!.current ? " on" : ""}`}
                style={{ padding: 0, background: "none" }}
                onClick={() => setPv({ current: i, read: undefined, readOf: undefined, changes: {}, request: undefined })}
                aria-label={`Version ${i + 1}`}
              >
                <img className="img" src={ver.image} alt={`Version ${i + 1}`} style={{ borderRadius: "0" }} />
                <span>V{i + 1}</span>
              </button>
            ))}
            <div className="v" style={{ border: "2px dashed #CFC3CF", display: "flex", alignItems: "center", justifyContent: "center", color: "#7C7090", fontSize: "13px", fontWeight: "600" }}>
              {making ? "Making…" : `V${(pv?.versions.length ?? 0) + 1} next`}
            </div>
          </div>
          <p className="small" style={{ marginTop: "14px" }}>
            Each version gets its own read-out — pick a version to see what we saw in it.
          </p>
        </div>
        <div className="rkcol">
          <div className="ai">
            <Ic>
              <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
              <path d="M19 3v4M17 5h4" />
            </Ic>
            {busy === "read" ? "Reading the preview…" : `Read by AI from version ${(pv?.current ?? 0) + 1}`}
            <button type="button" onClick={readAgain}>
              Read again
            </button>
          </div>
          {read.map((p) => {
            const chg = changes[p.key] != null;
            const Icon = PART[p.key].icon;
            return (
              <article className={`rk${chg ? " chg" : ""}`} key={p.key}>
                <div className="rk-h">
                  <span className="n">{PART[p.key].n}</span>
                  <Icon />
                  <b>{PART[p.key].title}</b>
                  <span className="seg-ctl">
                    <a href="#keep" className={chg ? "" : "on"} onClick={(e) => (e.preventDefault(), setChange(p.key, null))}>
                      Keep
                    </a>
                    <a href="#change" className={`c${chg ? " on" : ""}`} onClick={(e) => (e.preventDefault(), setChange(p.key, changes[p.key] ?? ""))}>
                      Change
                    </a>
                  </span>
                </div>
                <p>{p.text}</p>
                <div className="kw">
                  {p.keywords.map((k) => (
                    <span key={k}>{k}</span>
                  ))}
                </div>
                {chg && (
                  <>
                    <label className="lbl" htmlFor={`c-${p.key}`} style={{ marginTop: "4px" }}>
                      What should change?
                    </label>
                    <input id={`c-${p.key}`} className="input" value={changes[p.key]} placeholder="e.g. Lighter walls — warm greige." onChange={(e) => setChange(p.key, e.target.value)} autoFocus />
                  </>
                )}
              </article>
            );
          })}
        </div>
      </div>
      <section className="panel" style={{ marginTop: "32px", padding: "28px" }}>
        <div className="row" style={{ gap: "24px", alignItems: "flex-end" }}>
          <div className="field" style={{ flex: "1 1 520px" }}>
            <label htmlFor="req">
              Your change request <span style={{ fontWeight: "400", color: "#7C7090" }}>— built from your choices, edit freely</span>
            </label>
            <textarea id="req" className="textarea" style={{ minHeight: "88px" }} value={request} onChange={(e) => setPv({ request: e.target.value })} />
          </div>
          <div className="stack" style={{ gap: "10px", flex: "0 1 300px" }}>
            <button className={`btn${making ? " dis" : ""}`} type="button" style={{ minHeight: "60px", fontSize: "18px" }} onClick={update}>
              <I.repeat />
              {making ? "Updating…" : "Update preview"}
            </button>
            <Go
              className="link-btn"
              to="S2-Summary"
              style={{ justifyContent: "center" }}
              onClick={() => {
                set((p) => ({ preview: { ...p.preview!, kept: true }, done: Array.from(new Set([...p.done, 2])) }));
                void saveStepDone(s, 2);
              }}
            >
              Keep V{(pv?.current ?? 0) + 1} and finish step 2
            </Go>
          </div>
        </div>
      </section>
    </Screen>
  );
}

/** 2.8 · Step 2 summary */
export function Step2Summary() {
  const { s } = useJourney();
  const mb = s.moodboard;
  const top = [...s.styles].sort((a, b) => b.score - a.score).filter((st) => st.score > 0).slice(0, 2);
  const pv = s.preview;
  const v = pv?.versions[pv.current];
  const change = pv && pv.current > 0 ? pv.versions[pv.current].request : undefined;
  return (
    <StepSummary
      step={2}
      board="S2-Summary"
      sub="You've set the look. Next we make it fit how you actually live."
      media={
        <div className="row" style={{ gap: "16px", margin: "20px 0 8px", flexWrap: "nowrap" }}>
          <div className="ph" style={{ flex: "2 1 0", aspectRatio: "3/2" }}>
            {v && <img className="img" src={v.image} alt={`Kept preview, version ${(pv?.current ?? 0) + 1}`} />}
          </div>
          <div className="ph" style={{ flex: "1 1 0", aspectRatio: "3/4" }}>
            <Collage s={s} />
          </div>
        </div>
      }
      decisions={[
        {
          k: "Direction",
          v: (
            <>
              <b>{mb?.name ?? "Not chosen"}</b>
              {top.length > 1 ? ` — mix of ${top[0].name} (${top[0].score}%) and ${top[1].name} (${top[1].score}%)` : top.length ? ` — ${top[0].name} (${top[0].score}%)` : ""}
            </>
          ),
          edit: "S2-Matches",
        },
        {
          k: "Palette",
          v: (
            <>
              {(mb?.palette ?? []).map((c) => c.name).join(", ").toLowerCase().replace(/^./, (c) => c.toUpperCase())}
              <span className="swrow">
                {(mb?.palette ?? []).map((c) => (
                  <i key={c.hex + c.name} style={{ background: c.hex }} />
                ))}
              </span>
            </>
          ),
          edit: "S2-Moodboard",
        },
        {
          k: "Preview",
          v: change ? (
            <>
              Version {(pv?.current ?? 0) + 1} kept, with one change: <b>{change}</b>
            </>
          ) : (
            `Version ${(pv?.current ?? 0) + 1} kept`
          ),
          edit: "S2-Adjust",
        },
        {
          k: "Feels like",
          v: (
            <>
              {(mb?.feels ?? []).map((f) => (
                <span className="tag" key={f}>
                  {f}
                </span>
              ))}
            </>
          ),
        },
      ]}
      open={["Exact colours — confirmed with real samples in step 6", "The preview isn't to scale — it gets fitted to your room in step 4"]}
      soFar={[
        ["1", stepLine(s, 1)],
        ["2", `${mb?.name ?? "Your"} direction`],
      ]}
      back={pv?.versions.length && pv.versions.length > 1 ? "S2-Adjust" : "S2-Preview"}
      next="S3-Activities"
    />
  );
}
