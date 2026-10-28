/** Step 5 — Main furniture: where to shop (5.0), the piece that anchors the room (5.1), summary. */
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/looseDb";
import {
  DEFAULT_SHOP_CHOICE, addProjectShop, ensureProject, loadProjectShops, loadShopChoice, projectsReady, readShop, removeProjectShop, saveShopChoice,
  type ProjectShop, type ShopChoice,
} from "@/lib/projectStore";
import { Back, Go, Opt, Screen } from "../Shell";
import { I, Ic } from "../icons";
import { roomName } from "../data";
import { curRoom, useJourney, type JourneyState, type Wall } from "../state";
import { StepSummary } from "../Summary";
import { pieceVisual, uploadPhoto } from "../services";
import { dims, fallbackFor, sizeVariants, type SizeVariant } from "../sizes";
import { soFar } from "../story";
import { findShopPieces, type ShopPiece } from "../shopPieces";
import { saveStepDone } from "../sync";
import { PlanDrawing, roomSize, wallRoles } from "./Step4";

const p = (d: string) => <path d={d} />;

const shopLine = (sh: ProjectShop, reading: boolean) => {
  if (reading) return "Reading the shop… you can carry on";
  if (sh.status === "unreadable") return "We couldn't read this shop";
  if (sh.status === "rejected") return "This shop can't be used";
  if (sh.product_count > 0) return `Ready · ${sh.product_count} pieces match your style`;
  return "Added · not read yet";
};

/** 5.0 · Where do you want to shop? */
export function Shops() {
  const { s, set } = useJourney();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [link, setLink] = useState("");
  const [reading, setReading] = useState<string[]>([]);
  const [known, setKnown] = useState(false);
  const photo = useRef<HTMLInputElement>(null);
  const { data: ctx } = useQuery({
    queryKey: ["journey-shops"],
    queryFn: async () => {
      const ready = await projectsReady();
      const projectId = ready ? s.projectId ?? (await ensureProject()) : null;
      const [choice, shops] = await Promise.all([loadShopChoice(projectId), loadProjectShops(projectId)]);
      return { projectId, choice, shops };
    },
  });
  const [choice, setChoice] = useState<ShopChoice>(DEFAULT_SHOP_CHOICE);
  useEffect(() => {
    if (ctx?.choice) setChoice(ctx.choice);
  }, [ctx?.choice]);
  const { data: partners } = useQuery({
    queryKey: ["journey-partner-shops"],
    enabled: known,
    queryFn: async () => (await supabase.from("shops").select("id, name, domain, url").eq("status", "approved").eq("kind", "partner").order("name").limit(30)).data ?? [],
  });

  const save = (next: ShopChoice) => {
    setChoice(next);
    void saveShopChoice(ctx?.projectId ?? null, next).catch((e: Error) => toast({ title: "Could not save your choice", description: e.message, variant: "destructive" }));
  };
  const toggle = (k: keyof ShopChoice) => {
    const next = { ...choice, [k]: !choice[k] };
    if (!next.use_suggested && !next.use_custom_made && !next.use_own_shops) return toast({ title: "Pick at least one way to shop" });
    save(next);
  };
  const refresh = () => qc.invalidateQueries({ queryKey: ["journey-shops"] });
  const add = async (url: string) => {
    if (!ctx?.projectId) return toast({ title: "Sign in to add your own shops." });
    try {
      const shop = await addProjectShop(ctx.projectId, url);
      setLink("");
      if (!choice.use_own_shops) save({ ...choice, use_own_shops: true });
      await refresh();
      if (shop.product_count === 0 && shop.status !== "rejected") {
        setReading((r) => [...r, shop.id]);
        readShop(shop)
          .catch((e: Error) => toast({ title: "We couldn't read this shop yet", description: e.message }))
          .finally(() => {
            setReading((r) => r.filter((x) => x !== shop.id));
            void refresh();
          });
      }
    } catch (e) {
      toast({ title: "Could not add this shop", description: (e as Error).message, variant: "destructive" });
    }
  };
  const shops = ctx?.shops ?? [];
  const n = shops.length + s.catalogPhotos.length;
  return (
    <Screen board="S5-Shops" step={5} right={roomName(curRoom(s))}>
      <p className="eyebrow">Before we pick the pieces</p>
      <h1 className="h1">Where do you want to shop?</h1>
      <p className="sub">We look for furniture that matches your {s.moodboard?.name ?? "chosen"} style and your room sizes — in the places you choose.</p>
      <div className="g3" style={{ marginTop: "52px" }}>
        <Opt tint="a" sel={choice.use_suggested} onClick={() => toggle("use_suggested")}>
          <span className="tile">
            <Ic>{p("M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3zM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z")}</Ic>
          </span>
          <span className="opt-t">Suggested furniture</span>
          <span className="opt-d">Pieces from shops we work with, matched to your style, palette and sizes.</span>
        </Opt>
        <Opt tint="b" sel={choice.use_custom_made} onClick={() => toggle("use_custom_made")}>
          <span className="tile">
            <I.ruler />
          </span>
          <span className="opt-t">Custom made</span>
          <span className="opt-d">A carpenter or maker builds it to your exact sizes. We prepare the drawings and specs.</span>
        </Opt>
        <Opt tint="c" sel={choice.use_own_shops} onClick={() => toggle("use_own_shops")}>
          <span className="tile">
            <I.link />
          </span>
          <span className="opt-t">My own shops</span>
          <span className="opt-d">Paste links to shops you love. We search them for pieces in your style first.</span>
        </Opt>
      </div>
      <p className="multi">Pick as many as you like — you can mix them piece by piece later.</p>
      {choice.use_own_shops && (
        <section className="panel" style={{ marginTop: "36px" }}>
          <div className="row between">
            <div className="stack" style={{ gap: "6px" }}>
              <h2 className="h3">Your shops</h2>
              <p className="p" style={{ fontSize: "16px" }}>
                A shop's homepage or any product page works. We read the shop and keep the pieces that fit your style.
              </p>
            </div>
            <span className="tag">{n} added</span>
          </div>
          <form
            className="addrow"
            onSubmit={(e) => {
              e.preventDefault();
              if (link.trim()) void add(link.trim());
            }}
          >
            <div className="field">
              <label htmlFor="sl" className="sr" style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                Shop link
              </label>
              <input id="sl" className="input" placeholder="Paste a shop link, e.g. https://www.yourfavouriteshop.com" value={link} onChange={(e) => setLink(e.target.value)} />
            </div>
            <button className="btn auto" type="submit" style={{ minHeight: "56px" }}>
              <I.plus />
              Add shop
            </button>
          </form>
          <div className="ways">
            <button className="chip add" type="button" style={{ minHeight: "44px", fontSize: "15px" }} onClick={() => photo.current?.click()}>
              <I.camera />
              Photo of a shop or catalogue
            </button>
            <button className="chip add" type="button" style={{ minHeight: "44px", fontSize: "15px" }} onClick={() => setKnown((k) => !k)}>
              <Ic>{p("M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2")}</Ic>
              Pick from shops we know
            </button>
            <input
              ref={photo}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const url = await uploadPhoto(f);
                  set((x) => ({ catalogPhotos: [...x.catalogPhotos, url] }));
                } catch (err) {
                  toast({ title: "The photo didn't upload", description: (err as Error).message, variant: "destructive" });
                }
              }}
            />
          </div>
          {known && (
            <div className="chips" style={{ marginTop: "12px", gap: "8px" }}>
              {(partners ?? []).length ? (
                partners!.map((ps) => (
                  <button key={ps.id} className="chip" type="button" style={{ minHeight: "40px", fontSize: "14px" }} onClick={() => void add(ps.url ?? `https://${ps.domain}`)}>
                    + {ps.name ?? ps.domain}
                  </button>
                ))
              ) : (
                <span className="small">No partner shops yet.</span>
              )}
            </div>
          )}
          <div style={{ marginTop: "18px" }}>
            {shops.map((sh) => {
              const r = reading.includes(sh.id);
              const ready = !r && sh.product_count > 0;
              return (
                <div className="shop" key={sh.id}>
                  <span className="lg">
                    <Ic>{p("M3 9l1.5-5h15L21 9M3 9h18v11H3zM9 20v-6h6v6")}</Ic>
                  </span>
                  <span>
                    <span className="t">{sh.domain ?? sh.name}</span>
                    <br />
                    <span className="m">{shopLine(sh, r)}</span>
                  </span>
                  <span className="end">
                    {ready && <span className="tag ok">Searching here</span>}
                    {r && <span className="spin" aria-hidden="true" />}
                    {!r && sh.product_count === 0 && sh.status !== "rejected" && (
                      <button
                        className="link-btn"
                        type="button"
                        onClick={() => {
                          setReading((x) => [...x, sh.id]);
                          void readShop(sh).finally(() => {
                            setReading((x) => x.filter((y) => y !== sh.id));
                            void refresh();
                          });
                        }}
                      >
                        Read shop
                      </button>
                    )}
                    <button className="rm" type="button" aria-label={`Remove ${sh.domain ?? sh.name}`} onClick={() => ctx?.projectId && void removeProjectShop(ctx.projectId, sh.id).then(refresh)}>
                      <I.x />
                    </button>
                  </span>
                </div>
              );
            })}
            {s.catalogPhotos.map((src, i) => (
              <div className="shop" key={src}>
                <span className="lg" style={{ padding: 0, overflow: "hidden" }}>
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </span>
                <span>
                  <span className="t">Catalogue photo {i + 1}</span>
                  <br />
                  <span className="m">We look for pieces like these</span>
                </span>
                <span className="end">
                  <span className="tag ok">Searching here</span>
                  <button className="rm" type="button" aria-label="Remove photo" onClick={() => set((x) => ({ catalogPhotos: x.catalogPhotos.filter((y) => y !== src) }))}>
                    <I.x />
                  </button>
                </span>
              </div>
            ))}
          </div>
          <div className="li" style={{ borderTop: "1px solid #EDE4E8", marginTop: "6px", alignItems: "center" }}>
            <span className="ic-b">
              <Ic>{p("M3 6h18M6 12h12M10 18h4")}</Ic>
            </span>
            <span style={{ flex: "1" }}>
              <b style={{ fontWeight: "600" }}>Show pieces from my shops first</b>
              <br />
              <span className="small">Suggested pieces still appear when your shops have nothing that fits.</span>
            </span>
            <button className={`toggle${choice.own_shops_first ? " on" : ""}`} type="button" aria-pressed={choice.own_shops_first} aria-label="Show pieces from my shops first" onClick={() => save({ ...choice, own_shops_first: !choice.own_shops_first })} />
          </div>
        </section>
      )}
      <section className="panel lav" style={{ marginTop: "24px", padding: "22px 28px" }}>
        <div className="row" style={{ gap: "14px", flexWrap: "nowrap" }}>
          <I.info />
          <p className="p" style={{ fontSize: "16px" }}>
            Your shop choice applies to every room in this project. You can change it for a single piece in your buying list.
          </p>
        </div>
      </section>
      <div className="actions">
        <Back to="S3-Existing" />
        <Go className="btn auto" to="S5-Anchor" style={{ marginLeft: "auto" }}>
          Show me furniture
          <I.next />
        </Go>
      </div>
    </Screen>
  );
}

/** The biggest piece of the chosen layout decides what "anchors" the room. */
const ANCHOR_BY_ROOM: Record<string, string> = { "living-room": "sofa", bedroom: "bed", "dining-room": "dining table", office: "desk", kitchen: "dining table", "kids-room": "bed", hallway: "sideboard", bathroom: "vanity" };
const SHAPES: Record<string, { name: string; svg: JSX.Element }[]> = {
  sofa: [
    { name: "3-seater", svg: <rect x="8" y="14" width="94" height="30" rx="8" /> },
    { name: "L-shape", svg: <path d="M8 10h94v22H34v18H8z" /> },
    { name: "Curved", svg: <path d="M8 18c20 26 74 26 94 0v16c-20 22-74 22-94 0z" /> },
  ],
  bed: [
    { name: "Double", svg: <rect x="22" y="4" width="66" height="48" rx="6" /> },
    { name: "King", svg: <rect x="14" y="4" width="82" height="48" rx="6" /> },
    { name: "Daybed", svg: <rect x="8" y="16" width="94" height="26" rx="8" /> },
  ],
  "dining table": [
    { name: "Rectangular", svg: <rect x="10" y="14" width="90" height="28" rx="4" /> },
    { name: "Round", svg: <circle cx="55" cy="28" r="22" /> },
    { name: "Oval", svg: <ellipse cx="55" cy="28" rx="44" ry="18" /> },
  ],
  desk: [
    { name: "Straight", svg: <rect x="10" y="18" width="90" height="22" rx="3" /> },
    { name: "Corner", svg: <path d="M10 10h90v20H32v20H10z" /> },
    { name: "Wall-mounted", svg: <rect x="10" y="22" width="90" height="12" rx="3" /> },
  ],
};
const shapesFor = (kind: string) => SHAPES[kind] ?? [{ name: "Standard", svg: <rect x="10" y="14" width="90" height="28" rx="6" /> }, { name: "Compact", svg: <rect x="24" y="16" width="62" height="24" rx="6" /> }, { name: "Large", svg: <rect x="4" y="10" width="102" height="36" rx="6" /> }];

/** Words that mean a shape: "L-shape" also matches "L-sofa" and "corner". */
const shapeRe = (name: string) => {
  const n = name.toLowerCase();
  if (n === "l-shape") return /\bl-(shape|sofa)|corner/;
  if (n === "3-seater") return /3-seater|three-seater/;
  return new RegExp(`\\b${n.replace(/[^a-z0-9]+/g, ".")}`);
};

/** Fit checks for the anchor: kept pieces, the walkway, delivery. */
export function fitChecks(s: JourneyState) {
  const { l, w, example } = roomSize(s);
  const a = s.anchor;
  const keep = s.keeping[0];
  const out: { ok: boolean | null; text: string; tag: string; short: string; icon: "ok" | "warn" | "truck" }[] = [];
  if (keep) {
    const kname = keep.name.toLowerCase().replace(/^upright /, "");
    const extra = keep.extraLabel ? ` and its ${keep.extraLabel.split(" ")[0].toLowerCase()}` : "";
    out.push({ ok: true, text: `Leaves the ${kname}${extra} untouched`, tag: "OK on plan", short: `${kname[0].toUpperCase() + kname.slice(1)}${extra ? ` and ${keep.extraLabel!.split(" ")[0].toLowerCase()}` : ""} clear`, icon: "ok" });
  }
  const free = Math.min(w, l) * 100 - (a?.d ?? 95);
  const need = (a?.clearance ?? 0) + 90;
  out.push(
    example
      ? { ok: null, text: `Walkway in front of the ${a?.kind ?? "sofa"}`, tag: "Needs real room size", short: "Walkway — needs room size", icon: "warn" }
      : free >= need
        ? { ok: true, text: `Walkway in front of the ${a?.kind ?? "sofa"}`, tag: `${Math.round(free)} cm clear`, short: "Walkway clear", icon: "ok" }
        : { ok: false, text: `Walkway in front of the ${a?.kind ?? "sofa"}`, tag: `Only ${Math.round(free)} cm`, short: "Walkway too tight", icon: "warn" },
  );
  out.push({ ok: null, text: "Delivery: doors, stairs, lift", tag: "Check before ordering", short: "Delivery — check access", icon: "truck" });
  return out;
}

/** 5.1 · Main furniture */
export function Anchor() {
  const { s, set } = useJourney();
  const { toast } = useToast();
  const lay = s.layouts[s.chosenLayout ?? 0];
  const kind = ANCHOR_BY_ROOM[curRoom(s) ?? "living-room"] ?? "sofa";
  const shapes = shapesFor(kind);
  const readWords = (s.preview?.read ?? []).find((r) => r.key === "furniture")?.keywords.join(" ").toLowerCase() ?? "";
  const material = useMemo(() => {
    const m = s.moodboard?.palette.find((x) => x.material && /velvet|linen|leather|boucl|wool|fabric/i.test(x.material));
    return m?.material ?? (s.moodboard?.palette[0] ? `${s.moodboard.palette[0].name.toLowerCase()} fabric` : "");
  }, [s.moodboard]);
  const initial = shapes.find((x) => shapeRe(x.name).test(readWords))?.name ?? shapes[0].name;
  const a = s.anchor ?? { kind, shape: initial, images: {}, material };
  const [variants, setVariants] = useState<SizeVariant[]>(() => fallbackFor(`${kind}`));
  const [busy, setBusy] = useState(false);
  const madeFor = useRef<string | null>(null);
  const setA = (patch: Partial<NonNullable<JourneyState["anchor"]>>) => set((x) => ({ anchor: { ...(x.anchor ?? a), ...patch } }));

  useEffect(() => {
    if (!s.anchor) set({ anchor: a });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    void sizeVariants(`${kind}`).then((v) => {
      const shaped = v.filter((x) => shapeRe(a.shape).test(x.label.toLowerCase()));
      const list = shaped.length ? shaped : v;
      setVariants(list);
      if (!s.anchor?.w || s.anchor.shape !== a.shape) {
        const pick = list[0];
        if (pick) setA({ variant: pick.label, w: pick.w, d: pick.d, h: pick.h, clearance: pick.clearance });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.shape]);
  useEffect(() => {
    if (a.images[a.shape] || madeFor.current === a.shape || !s.moodboard) return;
    madeFor.current = a.shape;
    setBusy(true);
    pieceVisual(s, `${a.shape} ${kind}`, `${a.shape.toLowerCase()} ${kind} in ${a.material || "the palette's main colour"}, ${s.moodboard.name} style, against wall ${wallOf(s) ?? "A"}`)
      .then((img) => set((x) => ({ anchor: { ...(x.anchor ?? a), images: { ...(x.anchor?.images ?? {}), [a.shape]: img } } })))
      .catch((e: Error) => toast({ title: "The picture isn't ready", description: e.message }))
      .finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.shape, !!s.moodboard]);

  const [shopPieces, setShopPieces] = useState<ShopPiece[] | null>(null);
  useEffect(() => {
    let live = true;
    setShopPieces(null);
    findShopPieces(kind, [a.shape, ...(a.material ?? "").split(" "), ...(s.moodboard?.name ?? "").split(" ")])
      .then((list) => live && setShopPieces(list))
      .catch(() => live && setShopPieces([]));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, a.shape]);
  const price = (x: { price?: number; currency?: string }) => (x.price != null ? `${x.currency ?? "€"} ${Math.round(x.price).toLocaleString()}` : "Price on site");

  const fits = fitChecks({ ...s, anchor: a });
  const note = (name: string) => {
    const re = shapeRe(name);
    if (re.test(readWords)) return "As in your preview";
    const i = s.layouts.findIndex((L) => L.items.some((it) => re.test(it.label.toLowerCase())));
    if (i >= 0) return i === (s.chosenLayout ?? 0) ? `Fits layout ${i + 1}` : `Best for layout ${i + 1}`;
    return name === shapes[0].name ? `Fits layout ${(s.chosenLayout ?? 0) + 1}` : "Also fits";
  };
  const wall = wallOf(s) ?? "A";
  const tbc = openCount(s);
  const keepName = s.keeping[0]?.name;
  const label = `${a.shape} ${kind}`.replace(/^\w/, (c) => c.toUpperCase());
  return (
    <Screen board="S5-Anchor" step={5} right={roomName(curRoom(s))} wrapClass="wrap wide" wrapStyle={{ paddingTop: "28px" }}>
      <div className="palbar" aria-label="Your palette">
        <span className="lbl" style={{ marginRight: "6px" }}>
          Your palette
        </span>
        {(s.moodboard?.palette ?? []).map((c) => (
          <span className="pi" key={c.hex + c.name}>
            {c.image ? <img src={c.image} alt="" /> : <i style={{ width: 44, height: 44, borderRadius: 12, background: c.hex, display: "block" }} />}
            {c.material ?? c.name}
          </span>
        ))}
      </div>
      <nav className="crumbs" aria-label="Refinement order">
        <Go className="on" to="S5-Anchor">1 · Main furniture</Go>
        <Go to="S6-Palette">2 · Accents</Go>
        <Go to="S6-Palette">3 · Tables & chairs</Go>
        <Go to="S8-Walls">4 · Walls & floors</Go>
        <Go to="S8-Walls">5 · Decor</Go>
      </nav>
      <div className="split" style={{ marginTop: "28px" }}>
        <div className="main">
          <div className="left">
            <h1 className="h1" style={{ fontSize: "clamp(34px,3.6vw,52px)", marginTop: "0" }}>
              Start with the piece that anchors the room
            </h1>
            <p className="sub" style={{ fontSize: "18px", marginTop: "12px" }}>
              Your layout calls for a {kind} along wall {wall}. Choose its shape — the palette updates as you go.
            </p>
          </div>
          <div className="ph" style={{ marginTop: "24px", aspectRatio: "16/10" }}>
            {a.images[a.shape] ? (
              <img className="img" src={a.images[a.shape]} alt={`${label} in ${a.material}`} />
            ) : (
              <>
                {s.preview?.versions[s.preview.current] && <img className="img" src={s.preview.versions[s.preview.current].image} alt="" style={{ opacity: 0.35 }} />}
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#3B3350" }}>
                  {busy ? `Drawing your ${label.toLowerCase()}…` : ""}
                </span>
              </>
            )}
            <span className="cap">
              Wall {wall} · {kind[0].toUpperCase() + kind.slice(1)} wall
            </span>
          </div>
          <section style={{ marginTop: "28px" }}>
            <h2 className="h3">Shape</h2>
            <div className="shapes" style={{ marginTop: "14px" }}>
              {shapes.map((sh) => {
                const on = sh.name === a.shape;
                return (
                  <button key={sh.name} className={`shp${on ? " on" : ""}`} type="button" aria-pressed={on} onClick={() => setA({ shape: sh.name })}>
                    {on && (
                      <span className="check" style={{ top: "10px", right: "10px", width: "30px", height: "30px" }}>
                        <Ic style={{ width: "16px", height: "16px" }}>{p("M5 12l5 5L20 7")}</Ic>
                      </span>
                    )}
                    <svg viewBox="0 0 110 56" aria-hidden="true" fill={on ? s.moodboard?.palette[0]?.hex ?? "#6E3550" : "#B4A9C4"}>
                      {sh.svg}
                    </svg>
                    {sh.name}
                    <small>{note(sh.name)}</small>
                  </button>
                );
              })}
            </div>
          </section>
          <section style={{ marginTop: "28px" }}>
            <div className="row between">
              <h2 className="h3">Size</h2>
              <span className="tag tbc">Standard · final size TBC</span>
            </div>
            <div className="row" style={{ gap: "12px", marginTop: "14px" }}>
              <select
                className="select"
                aria-label="Size preset"
                style={{ flex: "1 1 260px" }}
                value={a.variant ?? variants[0]?.label}
                onChange={(e) => {
                  const v = variants.find((x) => x.label === e.target.value);
                  if (v) setA({ variant: v.label, w: v.w, d: v.d, h: v.h, clearance: v.clearance });
                }}
              >
                {variants.map((v) => (
                  <option key={v.label}>{v.label}</option>
                ))}
              </select>
              <span className="row" style={{ gap: "8px", fontSize: "14px", color: "#544872" }}>
                <Ic style={{ width: "18px", height: "18px" }}>
                  <ellipse cx="12" cy="5" rx="8" ry="3" />
                  {p("M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3")}
                </Ic>
                From our size database ·
                <a
                  href="#reset"
                  style={{ fontWeight: "600" }}
                  onClick={(e) => {
                    e.preventDefault();
                    const v = variants.find((x) => x.label === a.variant) ?? variants[0];
                    if (v) setA({ w: v.w, d: v.d, h: v.h });
                  }}
                >
                  Reset
                </a>
              </span>
            </div>
            <div className="dimrow" style={{ marginTop: "12px" }}>
              {(["w", "d", "h"] as const).map((k) => (
                <div className="field" key={k}>
                  <label htmlFor={`s${k}`}>{{ w: "Width", d: "Depth", h: "Height" }[k]}</label>
                  <div className="unit">
                    <input id={`s${k}`} className="input" inputMode="numeric" value={a[k] ?? ""} onChange={(e) => setA({ [k]: Number(e.target.value.replace(/\D/g, "")) || undefined })} />
                    <span>cm</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="small" style={{ margin: "10px 0 0" }}>
              Change any number and the fit checks below update.
            </p>
          </section>
          <section className="card" style={{ marginTop: "24px" }}>
            <h2 className="h3" style={{ marginBottom: "6px" }}>
              Fit checks
            </h2>
            {fits.map((f) => (
              <div className="fit" key={f.text}>
                {f.icon === "ok" ? (
                  <Ic style={{ color: "#3E6B55" }}>{p("M5 12l5 5L20 7")}</Ic>
                ) : f.icon === "truck" ? (
                  <Ic style={{ color: "#7A4A1E" }}>
                    {p("M3 6h11v10H3zM14 9h4l3 3v4h-7")}
                    <circle cx="7" cy="18" r="2" />
                    <circle cx="17" cy="18" r="2" />
                  </Ic>
                ) : (
                  <Ic style={{ color: "#7A4A1E" }}>
                    <circle cx="12" cy="12" r="9" />
                    {p("M12 8v5M12 16h.01")}
                  </Ic>
                )}
                {f.text}
                <span className={`tag ${f.ok ? "ok" : "tbc"}`}>{f.tag}</span>
              </div>
            ))}
          </section>
          <section className="card" style={{ marginTop: "24px" }} aria-label="From the shops">
            <div className="row between">
              <h2 className="h3">From the shops</h2>
              <Go to="S5-Shops" className="link-btn">
                Shop settings
              </Go>
            </div>
            {shopPieces == null ? (
              <p className="small">Looking for {kind}s that match…</p>
            ) : shopPieces.length === 0 ? (
              <p className="small">No matching {kind}s in the shops yet. Keep the standard size above and pick the actual piece later — the buying list will show it as “to choose”.</p>
            ) : (
              <div className="g2" style={{ gap: "12px", marginTop: "10px" }}>
                {shopPieces.map((x) => {
                  const on = a.product?.id === x.id;
                  return (
                    <div key={x.id} className="row" style={{ gap: "12px", flexWrap: "nowrap", padding: "10px", borderRadius: "14px", border: `${on ? 2 : 1}px solid ${on ? "#3E6B55" : "#E5DADF"}`, background: "#fff" }}>
                      {x.image ? <img src={x.image} alt={x.name} style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 10, flex: "none" }} /> : <span style={{ width: 72, height: 72, borderRadius: 10, background: "#F3ECE7", flex: "none" }} />}
                      <span className="stack" style={{ gap: "4px", minWidth: 0 }}>
                        <b style={{ fontSize: "15px" }}>{x.name}</b>
                        <span className="small" style={{ margin: 0 }}>
                          {price(x)}
                          {x.own ? " · your shop" : ""}
                          {x.url && (
                            <>
                              {" · "}
                              <a href={x.url} target="_blank" rel="noreferrer">
                                View
                              </a>
                            </>
                          )}
                        </span>
                        <button type="button" className="link-btn" style={{ minHeight: 32, padding: 0, justifyContent: "flex-start" }} aria-pressed={on} onClick={() => setA({ product: on ? undefined : { id: x.id, name: x.name, url: x.url, image: x.image, price: x.price, currency: x.currency } })}>
                          {on ? "✓ Chosen — tap to undo" : "Choose this one"}
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          <div className="actions">
            <Go
              className="btn auto"
              to="S5-Summary"
              onClick={() => {
                set((x) => ({ done: Array.from(new Set([...x.done, 5])) }));
                void saveStepDone(s, 5);
              }}
            >
              <I.check />
              Keep the {label.toLowerCase()}
            </Go>
            <Go className="btn ghost auto" to="S2-Moodboard">
              <Ic>{p("M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13 20h7")}</Ic>
              Adjust
            </Go>
            <Go
              className="link-btn"
              to="S3-Existing"
              onClick={() => {
                if (!s.keeping.some((k) => k.name.toLowerCase().includes(kind)))
                  set((x) => ({ keeping: [...x.keeping, { id: Math.random().toString(36).slice(2), name: kind[0].toUpperCase() + kind.slice(1), photos: [], measured: false, wall: (wallOf(s) ?? "A") as Wall, pos: 50, fixedSpot: false }] }));
              }}
            >
              Use my existing {kind}
            </Go>
          </div>
        </div>
        <aside className="rail">
          <div className="rail-card">
            <h2 className="h3">Your room so far</h2>
            {lay && (
              <div className="mini" role="img" aria-label={`Layout ${(s.chosenLayout ?? 0) + 1} mini plan`}>
                <PlanDrawing layout={lay} s={s} box={{ w: 124, h: 162 }} t={5} mini />
              </div>
            )}
            <div className="kv">
              <div>
                <span>Direction</span>
                <b>{s.moodboard?.name ?? "—"}</b>
              </div>
              <div>
                <span>Layout</span>
                <b>{lay?.name ?? "—"}</b>
              </div>
              <div>
                <span>Keeping</span>
                <b>{keepName ?? "Nothing"}</b>
              </div>
              <div>
                <span>Main piece</span>
                <b>{label}</b>
              </div>
            </div>
            <div className="row between" style={{ padding: "14px 16px", borderRadius: "14px", background: "#F7E9DA" }}>
              <span style={{ fontSize: "15px", color: "#7A4A1E", fontWeight: "600" }}>
                {tbc} thing{tbc === 1 ? "" : "s"} still TBC
              </span>
              <Go to="S9-Sizes" style={{ fontSize: "14px", fontWeight: "600", color: "#7A4A1E" }}>
                See list
              </Go>
            </div>
          </div>
        </aside>
      </div>
    </Screen>
  );
}

/** The wall the anchor piece stands against in the chosen layout. */
export function wallOf(s: JourneyState): Wall | undefined {
  const roles = wallRoles(s, s.layouts[s.chosenLayout ?? 0]);
  const kind = ANCHOR_BY_ROOM[curRoom(s) ?? "living-room"] ?? "sofa";
  const hit = roles.split(" · ").find((r) => r.toLowerCase().includes(kind.split(" ")[0]));
  return hit?.[0] as Wall | undefined;
}

/** How many things are still to be confirmed (sizes, positions, delivery). */
export function openCount(s: JourneyState) {
  return (
    s.keeping.filter((k) => !k.measured).length +
    (s.room.confirmed ? 0 : 1) +
    (s.room.ceilingM ? 0 : 1) +
    s.placements.filter((x) => !x.wall).length +
    (s.anchor ? 2 : 0) +
    s.fixedTbc.length
  );
}

/** 5.2 · Step 5 summary */
export function Step5Summary() {
  const { s } = useJourney();
  const a = s.anchor;
  const fits = fitChecks(s);
  const label = a ? `${a.shape} ${a.kind}` : "Not chosen";
  const v = a?.variant?.replace(/^.*·\s*/, "") ?? "standard";
  return (
    <StepSummary
      step={5}
      board="S5-Summary"
      sub="We know what you're keeping and the room has its anchor. Next we build the colours and materials around it."
      media={
        <div className="row" style={{ gap: "18px", flexWrap: "nowrap", alignItems: "flex-start" }}>
          <div className="ph" style={{ flex: "2 1 0", aspectRatio: "16/10" }}>
            {a?.images[a.shape] && <img className="img" src={a.images[a.shape]} alt={`${label} on wall ${wallOf(s) ?? "A"}`} />}
          </div>
          {s.keeping
            .filter((k) => k.photos[0])
            .slice(0, 2)
            .map((k) => (
              <div className="ph" key={k.id} style={{ flex: "1 1 0", aspectRatio: "4/5" }}>
                <img className="img" src={k.photos[0]} alt={`Yours: ${k.name.toLowerCase()}`} />
              </div>
            ))}
        </div>
      }
      decisions={[
        {
          k: "Keeping",
          v: s.keeping.length ? (
            <>
              {s.keeping.map((k, i) => (
                <span key={k.id}>
                  {i ? "; " : ""}
                  <b>{k.name}</b>
                  {k.extraLabel ? ` + ${k.extraLabel.toLowerCase()}` : ""} · {k.measured ? "measured" : "standard"} {dims(k)} cm · wall {k.wall ?? "B"} · {k.fixedSpot ? "fixed spot" : "may move"}
                  {k.photos.length ? ` · ${k.photos.length} photo${k.photos.length > 1 ? "s" : ""}` : ""}{" "}
                  {!k.measured && <span className="tag tbc">Not measured</span>}
                </span>
              ))}
            </>
          ) : (
            "Nothing — everything is new"
          ),
          edit: "S3-Existing",
        },
        {
          k: "Main piece",
          v: (
            <>
              <b>{label.replace(/^\w/, (c) => c.toUpperCase())}</b>
              {a?.material ? ` in ${a.material}` : ""}, on wall {wallOf(s) ?? "A"}
            </>
          ),
          edit: "S5-Anchor",
        },
        {
          k: "Size",
          v: (
            <>
              {a ? `${dims(a)} cm — ${v}` : "—"} <span className="tag tbc">Standard · not final</span>
            </>
          ),
          edit: "S5-Anchor",
        },
        {
          k: "Fit checks",
          v: (
            <>
              {fits.map((f) => (
                <span key={f.short} className={`tag ${f.ok ? "ok" : "tbc"}`}>
                  {f.short}
                </span>
              ))}
            </>
          ),
        },
      ]}
      open={[
        ...s.keeping.filter((k) => !k.measured).map((k) => `Measure the ${k.name.toLowerCase().replace(/^upright /, "")}${k.extraLabel ? ` and ${k.extraLabel.split(" ")[0].toLowerCase()}` : ""}`),
        `Final ${a?.kind ?? "sofa"} size, once the room is measured`,
        "Doors, stairs and lift for delivery",
      ]}
      soFar={soFar(s, 5)}
      back="S5-Anchor"
      next="S6-Palette"
    />
  );
}
