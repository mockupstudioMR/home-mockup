/** Step 2 — Inspiration & moodboard: how to share a style, photos, reading them, style matches, moodboard, one preview, adjusting it, summary. */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { Back, Go, Opt, Screen, useGo } from "../Shell";
import { I, Ic } from "../icons";
import { roomName } from "../data";
import { stepLine } from "../story";
import { curRoom, uid, useJourney, type JourneyState, type ReadKey, type StyleMatch, type Swatch } from "../state";
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
        const analysis = { colors: r.colors, cues: r.cues, materials: r.materials, description: r.description };
        set((x) => ({ analysis, ...moodboardFrom({ ...x, analysis }, styles) }));
        setPct(100);
        setTimeout(() => go("S2-Moodboard"), 500);
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
            {s.moodboard && s.styles.length > 0 && <Go to="S2-Moodboard">See your moodboard</Go>}
          </>
        )}
      </p>
    </Screen>
  );
}

/**
 * The moodboard from the styles we found. With photos there is no separate "Style matches" screen any more: the
 * strongest style's words and pieces are picked for the person, and they adjust the result on the moodboard.
 */
function moodboardFrom(s: JourneyState, styles: StyleMatch[]): Pick<JourneyState, "styles" | "moodboard" | "preview"> {
  const anyPicked = styles.some((st) => st.keywords.some((k) => k.on) || st.pieces.some((p) => p.added));
  const ranked = [...styles].sort((a, b) => b.score - a.score);
  const picked = anyPicked
    ? styles
    : styles.map((st) =>
        ranked.indexOf(st) === 0 || (ranked.indexOf(st) === 1 && st.score >= 30)
          ? { ...st, keywords: st.keywords.map((k, i) => ({ ...k, on: i < (ranked.indexOf(st) === 0 ? 5 : 2) })), pieces: st.pieces.map((p, i) => ({ ...p, added: i < 2 })) }
          : st,
      );
  const words = picked.flatMap((st) => st.keywords.filter((k) => k.on));
  const colors = s.analysis?.colors?.length ? s.analysis.colors : ["#5B2E45", "#2F5B4A", "#4A3022", "#B4975A", "#6B6862"];
  return {
    styles: picked,
    moodboard: {
      name: blendName(picked.filter((st) => st.keywords.some((k) => k.on) || st.pieces.some((p) => p.added))),
      description: s.analysis?.description,
      image: s.moodboard?.image,
      palette: paletteFrom(colors),
      feels: words.map((w) => w.word).slice(0, 8),
    },
    preview: undefined,
  };
}

/** 2.4 · Discover styles — only for people without photos ("Just show me styles"). */
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
    set(moodboardFrom(s, s.styles));
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

/** What each part of the read-out is called, numbered on the preview. */
const PART_NAME: Record<ReadKey, string> = { finishes: "Finishes", furniture: "Furniture", colours: "Colours & materials", decor: "Decor", lighting: "Lighting" };
const PART_N: Record<ReadKey, number> = { finishes: 1, furniture: 2, colours: 3, decor: 4, lighting: 5 };

/** How much of the room each palette colour covers: walls the most, then in the palette's order. */
function paletteShares(palette: Swatch[]) {
  const rest = [22, 16, 12, 10, 8];
  let k = 0;
  return palette.map((c) => (/wall/i.test(c.use ?? "") ? 40 : rest[Math.min(k++, rest.length - 1)]));
}

/** Text colour that reads on a swatch. */
const onColour = (hex: string) => {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const l = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.6 ? "#2F2840" : "#FFFFFF";
};

/** 2.4 · Your direction — the moodboard and the one preview on one screen: keep it or say what to change. */
export function Moodboard() {
  const { s, set } = useJourney();
  const { toast } = useToast();
  const { busy, v } = usePreview();
  const [req, setReq] = useState("");
  const [making, setMaking] = useState(false);
  const mb = s.moodboard;
  const pv = s.preview;
  const room = roomName(curRoom(s)).toLowerCase();
  const palette = mb?.palette ?? [];
  const shares = paletteShares(palette);
  const read = pv?.read ?? [];
  const refs = (s.photos.length ? s.photos : s.styles.flatMap((st) => st.pieces.filter((p) => p.added).map((p) => p.image))).slice(0, 3);

  const share = async () => {
    const text = `My ${room} direction: ${mb?.name}`;
    const url = v?.image ?? mb?.image;
    try {
      if (navigator.share) await navigator.share({ title: mb?.name, text, url });
      else {
        await navigator.clipboard.writeText(`${text}${url ? ` — ${url}` : ""}`);
        toast({ title: "Copied — paste it anywhere to share" });
      }
    } catch {
      /* cancelled */
    }
  };
  const save = () => {
    const href = v?.image ?? mb?.image;
    if (!href) return;
    const a = document.createElement("a");
    a.href = href;
    a.download = `${(mb?.name ?? "my-direction").replace(/\s+/g, "-").toLowerCase()}.png`;
    a.target = "_blank";
    a.click();
  };
  /** "Adjust it": the request makes a new version; earlier versions stay to go back to. */
  const update = async (e: FormEvent) => {
    e.preventDefault();
    const change = req.trim();
    if (!v || !change) {
      toast({ title: "Say what should change first" });
      return;
    }
    setMaking(true);
    try {
      const img = await generatePreview(s, { sourceImage: v.image, change });
      set((p) => {
        const versions = [...(p.preview?.versions ?? []), { id: uid(), image: img, request: change, createdAt: new Date().toISOString() }];
        return { preview: { ...(p.preview ?? { versions: [], current: 0 }), versions, current: versions.length - 1, read: undefined, readOf: undefined } };
      });
      setReq("");
      const r = await readDesign(img, mb?.name);
      set((p) => ({ preview: { ...p.preview!, read: r, readOf: img } }));
    } catch (err) {
      toast({ title: "The preview couldn't be updated", description: (err as Error).message, variant: "destructive" });
    } finally {
      setMaking(false);
    }
  };

  return (
    <Screen board="S2-Moodboard" step={2} right={roomName(curRoom(s))} wrapClass="wrap wide">
      <div className="dr-top">
        <div className="stack" style={{ gap: "6px", maxWidth: "720px" }}>
          <p className="dr-script">your direction, curated for you</p>
          <h1 className="dr-h1">
            <span className="brush">{mb?.name ?? "Your direction"}</span>
          </h1>
          {mb?.description && <p className="dr-sub">{mb.description}</p>}
        </div>
        <div className="row" style={{ gap: "10px" }}>
          <button className="dr-ghost" type="button" onClick={share}>
            <Ic>
              <path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
            </Ic>
            Share
          </button>
          <button className="dr-ghost" type="button" onClick={save} disabled={!v && !mb?.image}>
            <Ic>
              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            </Ic>
            Save as image
          </button>
        </div>
      </div>

      {palette.length > 0 && (
        <section aria-label="Colour palette" className="dr-strip-wrap">
          <div className="dr-strip">
            {palette.map((c, i) => (
              <div key={c.hex + c.name} style={{ flex: shares[i], background: c.hex, color: onColour(c.hex) }}>
                <b>{c.name}</b>
                <span>{c.hex.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="dr-row">
        <section className="dr-main">
          <figure className="dr-hero">
            {v ? (
              <img src={v.image} alt={`Inspired ${room} preview`} />
            ) : (
              <div className="dr-wait">{busy === "make" ? "Painting your preview… about a minute" : "No preview yet"}</div>
            )}
            <span className="dr-badge">
              <I.info />
              Inspired preview · not to scale
            </span>
            {v &&
              read.map((p) => (
                <span key={p.key} className="dr-dot" style={{ left: `${p.x}%`, top: `${p.y}%` }} aria-hidden="true">
                  {PART_N[p.key]}
                </span>
              ))}
          </figure>
          <ol className="dr-key">
            {read.length ? (
              [...read]
                .sort((a, b) => PART_N[a.key] - PART_N[b.key])
                .map((p) => (
                  <li key={p.key}>
                    <b>{PART_N[p.key]}</b>
                    {p.keywords.slice(0, 2).join(", ") || PART_NAME[p.key]}
                  </li>
                ))
            ) : (
              <li className="muted">{busy === "read" ? "Reading the preview…" : "In this preview"}</li>
            )}
          </ol>
          {pv && pv.versions.length > 1 && (
            <div className="dr-vers">
              <span className="lbl">Versions</span>
              {pv.versions.map((ver, i) => (
                <button
                  key={ver.id}
                  type="button"
                  aria-pressed={i === pv.current}
                  aria-label={`Version ${i + 1}${ver.request ? `: ${ver.request}` : ""}`}
                  onClick={() => set((p) => ({ preview: { ...p.preview!, current: i, read: undefined, readOf: undefined } }))}
                >
                  <img src={ver.image} alt="" />
                  <span>V{i + 1}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="dr-side">
          <div className="dr-card">
            <h2 className="dr-h2">Palette &amp; materials</h2>
            {palette.map((c) => (
              <div className="dr-mat" key={c.hex + c.name}>
                <i style={{ background: c.image ? `url(${c.image}) center/cover, ${c.hex}` : c.hex }} />
                <b>{c.material ?? c.name}</b>
                <span>{c.use}</span>
              </div>
            ))}
          </div>
          {(mb?.feels ?? []).length > 0 && (
            <div className="dr-card">
              <h2 className="dr-h2">Feels like</h2>
              <div className="chips" style={{ gap: "8px" }}>
                {(mb?.feels ?? []).map((f) => (
                  <span className="tag" key={f}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
          {refs.length > 0 && (
            <div className="dr-card">
              <h2 className="dr-h2">From your photos</h2>
              <div className="dr-polas">
                {refs.map((src, i) => (
                  <figure key={src + i} className="dr-pola" style={{ transform: `rotate(${[-4, 2.5, -1.5][i]}deg)` }}>
                    <img src={src} alt={`Your reference ${i + 1}`} />
                  </figure>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <section className="dr-decide" aria-label="Decide">
        <Go
          className="dr-keep"
          to="S2-Summary"
          onClick={() => {
            if (!v) return false;
            set((p) => ({ preview: { ...p.preview!, kept: true }, done: Array.from(new Set([...p.done, 2])) }));
            void saveStepDone(s, 2);
          }}
        >
          <span className="tile">
            <I.check />
          </span>
          <span className="stack" style={{ gap: "2px" }}>
            <b>Keep this direction</b>
            <span>Next: how you use the room and its layout</span>
          </span>
        </Go>
        <form className="dr-adjust" onSubmit={(e) => void update(e)}>
          <label htmlFor="adjust">Or adjust it</label>
          <div className="row" style={{ gap: "10px", flexWrap: "nowrap" }}>
            <input id="adjust" className="input" value={req} placeholder="e.g. lighter walls, but keep the sofa" onChange={(e) => setReq(e.target.value)} disabled={making} />
            <button className="dr-ghost pri" type="submit" disabled={making || !v}>
              {making ? "Updating… about a minute" : "Update preview"}
            </button>
          </div>
        </form>
      </section>

      <div className="actions" style={{ marginTop: "20px" }}>
        <Back to={s.visionMode === "discover" ? "S2-Matches" : "S2-Upload"} label={s.visionMode === "discover" ? "Back to styles" : "Back to your photos"} />
      </div>
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
          edit: s.visionMode === "discover" ? "S2-Matches" : "S2-Upload",
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
          edit: "S2-Moodboard",
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
      back="S2-Moodboard"
      next="S3-Activities"
    />
  );
}
