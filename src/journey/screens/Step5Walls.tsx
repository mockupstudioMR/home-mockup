/**
 * Step 5 · Your walls. Straight after the layout, the room is shown as its four walls, drawn as outlines
 * from what the journey knows. Each wall then opens as its own showroom: everything on that wall
 * (furniture, decor, walls & floor, light, power, inside the wall) in one list, in order along the wall.
 * Choices are stored on the walls (s.walls) and in the finishes, so the buying list (step 9) picks them up.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/looseDb";
import { GeneratorProShowroom } from "@/components/showroom/GeneratorProShowroom";
import { Back, Go, Screen, useGo } from "../Shell";
import { I } from "../icons";
import { roomName } from "../data";
import { curRoom, useJourney, type JourneyState, type Wall, type WallItem, type WallPlan } from "../state";
import { KEEP_FLOOR, surfacesFor } from "../finishes";
import { findShopPieces, type ShopPiece } from "../shopPieces";
import { generatePreview } from "../services";
import { saveStepDone } from "../sync";
import { outlineFor, wallLength, type Outline } from "../wallOutline";
import { useWalls, WALLS } from "./Step8";
import { PlanDrawing } from "./Step4";
import { WallElevation } from "./WallElevation";
import "../walls.css";

const lc = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
const metres = (cm: number) => `${(cm / 100).toFixed(2)} m`;
const isPoint = (i: WallItem) => /socket|switch|dimmer|blind/i.test(i.name);
const isSet = (wp: WallPlan) => wp.status !== "review";

/**
 * Sample walls shipped with the app (public/showroom-demo/walls/{a..d}): the sample living room, each wall
 * prepared to the wall standard as a Generator PRO scene (scripts/showroom-demo/make_walls.py).
 * Shown, labelled as a sample, until the person's own wall has a prepared scene.
 */
const SAMPLE_WALLS: Record<string, string> = { "living-room": "/showroom-demo/walls" };
const SCRIPT_URL = "/generator-pro/showroom-configurator.js";

/** Finish every wall and the steps they replace (5–8: furniture, colours, lighting, details). */
function useFinishWalls() {
  const { s, set } = useJourney();
  const { walls, setWall } = useWalls();
  return () => {
    WALLS.forEach((w) => walls[w].status === "review" && setWall(w, { status: "kept" }));
    set((x) => ({ done: Array.from(new Set([...x.done, 5, 6, 7, 8])) }));
    void saveStepDone(s, 8);
  };
}

function useOutlines(walls: Record<Wall, WallPlan>, s: JourneyState) {
  return useMemo(() => Object.fromEntries(WALLS.map((w) => [w, outlineFor(s, w, walls[w])])) as Record<Wall, Outline>, [s, walls]);
}

/** One short line per wall: what's on it. */
function wallLine(wp: WallPlan) {
  const furn = wp.items.filter((i) => i.group === "furniture").map((i) => (i.action === "Keep" ? `your ${lc(i.name)}` : lc(i.choice?.name ?? i.name)));
  const light = wp.items.filter((i) => i.group === "lighting" && !isPoint(i)).map((i) => lc(i.name));
  const points = wp.items.filter((i) => i.group === "lighting" && isPoint(i)).length;
  const parts = [...furn, ...light];
  const text = parts.length ? parts.join(" · ") : "Kept clear";
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}${points ? ` · ${points} point${points > 1 ? "s" : ""}` : ""}`;
}

/** 5 · Your walls — the four walls as outlines, straight after the layout. */
export function YourWalls() {
  const { s, set } = useJourney();
  const go = useGo();
  const { walls } = useWalls();
  const outlines = useOutlines(walls, s);
  const finish = useFinishWalls();
  const lay = s.layouts[s.chosenLayout ?? 0];
  const setUp = WALLS.filter((w) => isSet(walls[w])).length;
  const next = WALLS.find((w) => !isSet(walls[w]));
  useEffect(() => {
    // Keep the composed walls in the journey, and mark this room as designed wall by wall.
    set((x) => ({ wallFlow: true, walls: Object.keys(x.walls).length ? x.walls : walls }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const kept = s.keeping.length ? s.keeping.map((k) => lc(k.name)).join(", ") : s.nothingKept ? "nothing" : "not set";
  const fixedN = s.placements.filter((p) => p.wall).length;
  const shops = s.catalogPhotos.length ? "your shops" : "suggestions";

  return (
    <Screen board="S5-Walls" step={5} right={roomName(curRoom(s))} wrapClass="wrap wide"
      dock={
        <>
          <Back to="S4-Summary" />
          {next ? (
            <button className="btn" type="button" onClick={() => go("S5-Wall", `/${next}`)}>
              {setUp ? `Next: wall ${next}` : `Start with wall ${next}`}
              <I.next />
            </button>
          ) : (
            <Go className="btn" to="S9-BuyList" onClick={finish}>
              Next: make it happen
              <I.next />
            </Go>
          )}
        </>
      }
    >
      <div className="wo-head">
        <div className="left" style={{ flex: "1 1 560px" }}>
          <p className="eyebrow">Step 5 · Your walls</p>
          <h1 className="h1" style={{ fontSize: "clamp(36px,4vw,56px)" }}>Your room, wall by wall</h1>
          <p className="sub" style={{ fontSize: "18px" }}>
            We drew each wall from your layout: the pieces you placed, the doors and windows, and the points you marked as fixed. Open a wall to choose everything on it.
          </p>
        </div>
        <div className="wo-prog">
          <span className="small"><b>{setUp} of 4</b> walls set up</span>
          <div className="bar" role="progressbar" aria-valuenow={setUp} aria-valuemin={0} aria-valuemax={4} aria-label="Walls set up">
            <span style={{ width: `${Math.max(2, (setUp / 4) * 100)}%` }} />
          </div>
        </div>
      </div>
      <div className="wo-before" aria-label="Carried over">
        <span>Carried over:</span>
        <Go to="S4-Layouts">Layout <b>{lay?.name ?? "not chosen"}</b></Go>
        <Go to="S3-Existing">You keep <b>{kept}</b></Go>
        <Go to="S5-Shops">You shop at <b>{shops}</b></Go>
        <Go to="S3-Fixed">Fixed <b>{fixedN} on the walls</b></Go>
      </div>
      <div className="wo-grid">
        <aside className="wo-plan">
          {lay && <PlanDrawing layout={lay} s={s} box={{ w: 220, h: 288 }} />}
          <p className="small">
            <b>{metres(wallLength(s, "A"))} × {metres(wallLength(s, "B"))}</b>
            {outlines.A.example ? " · example size" : ""}
            <br />Walls go clockwise: A at the top of the plan.
          </p>
          <ul className="legend" aria-label="How to read the drawings">
            <li><i className="lg-dash" />From your layout</li>
            <li><i className="lg-kept" />Yours, kept</li>
            <li><i className="lg-open" />Door or window</li>
            <li><i className="lg-pt" />Power point</li>
          </ul>
        </aside>
        {WALLS.map((w) => {
          const wp = walls[w];
          const o = outlines[w];
          const done = isSet(wp);
          return (
            <Go key={w} to="S5-Wall" extra={`/${w}`} className={`wo-card${done ? " ok" : ""}`} ariaLabel={`Open wall ${w}, ${wp.role.toLowerCase()} wall`}>
              <span className="h">
                <span className="lt">{done ? "✓" : w}</span>
                <b>{wp.role} wall</b>
                <small>{metres(o.length)}</small>
                <span className={`tag${done ? " ok" : ""}`}>{done ? "Set up" : "To set up"}</span>
              </span>
              <WallElevation o={o} wp={wp} compact labels />
              <span className="f">
                <span>{wallLine(wp)}</span>
                <span className="go">{done ? "Open again" : "Open"} <I.next /></span>
              </span>
            </Go>
          );
        })}
      </div>
    </Screen>
  );
}

const ACTIONS: Record<string, { v: WallItem["action"]; t: string }[]> = {
  furniture: [{ v: "Buy", t: "Buy new" }, { v: "Keep", t: "Keep" }, { v: "Use mine", t: "Use mine" }, { v: "Custom", t: "Custom made" }],
  finishes: [{ v: "Buy", t: "New finish" }, { v: "Keep", t: "Keep as is" }],
  fitting: [{ v: "Buy", t: "Buy new" }, { v: "Keep", t: "Keep" }, { v: "Use mine", t: "Use mine" }],
  point: [{ v: "Keep", t: "Keep" }, { v: "Buy", t: "New" }, { v: "TBC", t: "To check" }],
  inside: [{ v: "TBC", t: "To check" }, { v: "Keep", t: "Keep" }, { v: "—", t: "None" }],
};
const actionsFor = (i: WallItem) => (i.group === "lighting" ? (isPoint(i) ? ACTIONS.point : ACTIONS.fitting) : ACTIONS[i.group]);
const tagFor = (i: WallItem) => (i.choice ? "tag ok" : i.action === "Keep" ? "tag ok" : i.action === "TBC" ? "tag tbc" : i.action === "—" ? "tag line" : "tag");
const actionLabel = (i: WallItem) => (i.choice ? "Chosen" : actionsFor(i).find((a) => a.v === i.action)?.t ?? i.action);
const TYPE: Record<WallItem["group"], string> = { furniture: "Furniture & decor", finishes: "Walls", lighting: "Light & power", inside: "Inside the wall" };

/** What to look for in the catalogue for an item. */
function catalogueKind(name: string) {
  const t = name.toLowerCase();
  const k = ["sofa", "chair", "table", "console", "mirror", "bed", "desk", "bench", "rug", "sconce", "pendant", "lamp", "curtain"].find((x) => t.includes(x));
  if (k) return k;
  if (/shelv/.test(t)) return "shelf";
  if (/light/.test(t)) return "lamp";
  return t.split(" ").slice(-1)[0];
}
const canChoose = (i: WallItem) => !i.choice && !/piano/i.test(i.name) && i.action !== "Keep" && (i.group === "furniture" || (i.group === "lighting" && !isPoint(i)));

function Choices({ item, onPick }: { item: WallItem; onPick: (p: ShopPiece) => void }) {
  const { s } = useJourney();
  const kind = catalogueKind(item.name);
  const words = useMemo(() => [...(s.moodboard?.feels ?? []), ...s.styles.flatMap((st) => st.keywords.filter((k) => k.on).map((k) => k.word))], [s.moodboard, s.styles]);
  const { data = [], isLoading } = useQuery({ queryKey: ["wall-pieces", kind, words.join(",")], queryFn: () => findShopPieces(kind, words), staleTime: 300_000 });
  if (isLoading) return <p className="small" role="status">Looking in your shops…</p>;
  if (!data.length) return <p className="small">No matching {kind} in your shops yet. Pick "Use mine" or "Custom made", or paste a link below.</p>;
  return (
    <div className="ws-choices" role="list" aria-label={`Choices for ${lc(item.name)}`}>
      {data.slice(0, 5).map((p) => (
        <button key={p.id} type="button" role="listitem" className="ws-c" onClick={() => onPick(p)}>
          {p.image ? <img src={p.image} alt="" /> : <span className="ph" />}
          <span className="n">{p.name}</span>
          {p.price != null && <span className="m">{p.currency ?? "€"} {p.price}</span>}
          {p.own && <span className="tg">Your shop</span>}
        </button>
      ))}
    </div>
  );
}

function wallFinishes(s: JourneyState) {
  const pal = (s.moodboard?.palette ?? []).filter((p) => /plaster|paint|limewash|wallpaper|greige|panel|tile|green|white|plum|clay/i.test(p.material ?? p.name));
  const names = Array.from(new Set([...pal.map((p) => p.material ?? p.name), "Warm greige", "Limewash white", "Grey plaster"]));
  return names.slice(0, 6).map((n) => ({ name: n, image: pal.find((p) => (p.material ?? p.name) === n)?.image, hex: pal.find((p) => (p.material ?? p.name) === n)?.hex }));
}
function floorFinishes(s: JourneyState) {
  const wood = (s.moodboard?.palette ?? []).find((p) => /walnut|oak|ash|teak|wood/i.test(p.material ?? p.name));
  const own = wood ? `${(wood.material ?? wood.name).split(" ").slice(-1)[0].replace(/^\w/, (c) => c.toUpperCase())} flooring` : undefined;
  return Array.from(new Set([own, "Light oak flooring", "Terrazzo", "Micro-cement", KEEP_FLOOR].filter(Boolean) as string[]));
}

/** 5.1 · One wall as a showroom: everything on it, in order, on one screen. A fresh screen per wall. */
export function WallShowroom({ param }: { param?: string }) {
  return <OneWall key={param ?? "A"} param={param} />;
}

function OneWall({ param }: { param?: string }) {
  const { s, set } = useJourney();
  const go = useGo();
  const { toast } = useToast();
  const { walls, setWall } = useWalls();
  const finish = useFinishWalls();
  const w = (WALLS.includes(param as Wall) ? param : "A") as Wall;
  const wp = walls[w];
  const outlines = useOutlines(walls, s);
  const o = outlines[w];
  const [sel, setSel] = useState<number | undefined>(undefined);
  const [mode, setMode] = useState<"outline" | "picture">("outline");
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState(false);
  const [link, setLink] = useState("");
  useEffect(() => {
    if (!s.wallFlow) set({ wallFlow: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const surfaces = surfacesFor(s);
  const redoFloor = s.houseState === "core-shell" || s.houseState === "redoing";
  const update = (n: number, patch: Partial<WallItem>) => setWall(w, { items: wp.items.map((i) => (i.n === n ? { ...i, ...patch } : i)) });
  const nextN = () => Math.max(0, ...wp.items.map((i) => i.n)) + 1;
  const addPoint = (kind: "Socket" | "Switch" | "Data point" | "Wall light") => {
    const e = wp.items.filter((i) => i.code?.startsWith(`${w}-E`)).length;
    const d = wp.items.filter((i) => i.code?.startsWith(`${w}-D`)).length;
    const item: WallItem = kind === "Data point"
      ? { n: nextN(), group: "inside", name: "Data point", note: "Added by you · position TBC", action: "TBC", code: `${w}-D${d + 1}`, x: 50, y: 80, added: true }
      : { n: nextN(), group: "lighting", name: kind, note: "Added by you · position TBC", action: "Buy", code: `${w}-E${e + 1}`, x: 50, y: 70, added: true };
    setWall(w, { items: [...wp.items, item] });
    setSel(item.n);
  };
  const setFinish = (n: number, name: string) => {
    update(n, { name, action: "Buy" });
    set((x) => ({ surfaces: { walls: { ...surfacesFor(x).walls, [w]: name }, floor: surfacesFor(x).floor } }));
  };

  // A prepared interactive scene of this wall, or an approved picture of it, or the wall's own picture.
  const lay = s.layouts[s.chosenLayout ?? 0];
  const view = `wall_${w.toLowerCase()}`;
  const { data: scene } = useQuery({
    queryKey: ["showroom-scene", s.projectId, s.roomId, lay?.id, view],
    enabled: Boolean(s.projectId && s.roomId && lay?.id),
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.from("showroom_scenes").select("manifest_url,assets_url").eq("project_id", s.projectId).eq("room_id", s.roomId).eq("layout_id", lay!.id).eq("view", view).eq("status", "ready").order("version", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const picture = wp.image;
  const sampleBase = SAMPLE_WALLS[curRoom(s) ?? "living-room"];
  const sample = sampleBase ? `${sampleBase}/${w.toLowerCase()}/` : undefined;

  const ordered = o.order.map((n) => wp.items.find((i) => i.n === n)!).filter(Boolean);
  const hidden = wp.items.filter((i) => i.action === "—");
  const idx = WALLS.indexOf(w);
  const nextWall = WALLS.slice(idx + 1).find((x) => !isSet(walls[x])) ?? WALLS.slice(idx + 1)[0];
  const markThis = () => setWall(w, { status: wp.items.some((i) => i.choice || i.added) || wp.change ? "changed" : "kept" });

  const makePicture = async () => {
    if (!picture) return;
    const chosen = wp.items.filter((i) => i.choice).map((i) => `${lc(i.name)}: ${i.choice!.name}`);
    const request = [chosen.length ? `Use ${chosen.join("; ")}` : "", wp.change ?? ""].filter(Boolean).join(". ");
    if (!request) return toast({ title: "Choose something on this wall first" });
    setBusy(true);
    try {
      const img = await generatePreview(s, { sourceImage: picture, change: `Wall ${w} (${wp.role.toLowerCase()} wall): ${request}. Keep the rest.` });
      if (img) setWall(w, { image: img, status: "changed" });
      setMade(Boolean(img));
      setMode("picture");
    } catch (e) {
      toast({ title: "The picture couldn't be made", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen board="S5-Wall" step={5} right={`Wall ${w} of 4`} wrapClass="wrap wide" wrapStyle={{ paddingTop: "28px" }}
      dock={
        <>
          <Back to="S5-Walls" label="All walls" />
          {idx < 3 ? (
            <button className="btn" type="button" onClick={() => { markThis(); go("S5-Wall", `/${nextWall}`); }}>
              Next: wall {nextWall}
              <I.next />
            </button>
          ) : (
            <Go className="btn" to="S9-BuyList" onClick={() => { markThis(); finish(); }}>
              Save &amp; next: make it happen
              <I.next />
            </Go>
          )}
        </>
      }
    >
      <nav className="ws-tabs" aria-label="Walls">
        <Go to="S5-Walls" className="all">All walls</Go>
        {WALLS.map((x) => (
          <Go key={x} to="S5-Wall" extra={`/${x}`} className={x === w ? "on" : isSet(walls[x]) ? "ok" : ""}>
            <i>{isSet(walls[x]) && x !== w ? "✓" : x}</i>
            {walls[x].role}
          </Go>
        ))}
      </nav>
      <div className="ws-split">
        <section className="ws-stage" aria-label={`Wall ${w}`}>
          <div className="ws-bar">
            <div>
              <h1 className="h3" style={{ margin: 0 }}>{wp.role} wall</h1>
              <span className="small">{metres(o.length)} × {metres(o.height)}{o.example ? " · example size, confirm in step 4" : ""}</span>
            </div>
            <div className="seg-ctl ws-mode" role="group" aria-label="View">
              <a href="#outline" className={mode === "outline" ? "on" : ""} aria-pressed={mode === "outline"} onClick={(e) => (e.preventDefault(), setMode("outline"))}>Outline</a>
              <a href="#picture" className={mode === "picture" ? "on" : ""} aria-pressed={mode === "picture"} onClick={(e) => (e.preventDefault(), setMode("picture"))}>Picture</a>
            </div>
          </div>
          {mode === "outline" ? (
            <div className="ws-draw">
              <WallElevation o={o} wp={wp} selected={sel} onPick={(n) => setSel(n === sel ? undefined : n)} />
            </div>
          ) : scene?.manifest_url && scene.assets_url ? (
            <GeneratorProShowroom scriptUrl={SCRIPT_URL} configUrl={scene.manifest_url} assetsUrl={scene.assets_url} />
          ) : sample && !(made && picture) ? (
            <div className="ws-scene">
              <p className="ws-sample" role="note">Sample wall · from our sample living room. Your own wall appears here once it's prepared.</p>
              <GeneratorProShowroom key={sample} scriptUrl={SCRIPT_URL} configUrl={`${sample}manifest.json`} assetsUrl={sample} />
            </div>
          ) : picture ? (
            <div className="ws-pic">
              <img src={picture} alt={`Wall ${w}, ${wp.role.toLowerCase()} wall`} />
            </div>
          ) : (
            <div className="ws-empty">
              <p className="p">No picture of this wall yet.</p>
              <p className="small">Sizes always come from the outline. A picture appears here once your room has one.</p>
            </div>
          )}
          <div className="ws-foot">
            <span><i className="k-dot" />Tap a number or a piece to choose it</span>
            {picture && (
              <button type="button" className={`btn soft auto${busy ? " dis" : ""}`} onClick={makePicture}>
                {busy ? "Making the picture…" : "Make a picture with my choices"}
              </button>
            )}
          </div>
        </section>

        <aside className="ws-list" aria-label={`Everything on wall ${w}`}>
          <div className="ws-lh">
            <h2 className="h3">On this wall</h2>
            <span className="small">{ordered.length} things, left to right</span>
          </div>
          <ol className="ws-items">
            {ordered.map((it, k) => {
              const open = sel === it.n;
              return (
                <li key={it.n} className={`ws-it${open ? " open" : ""}`}>
                  <button type="button" className="ws-row" aria-expanded={open} onClick={() => setSel(open ? undefined : it.n)}>
                    <span className={`n${it.group === "inside" ? " in" : ""}${it.choice ? " ok" : ""}`}>{k + 1}</span>
                    {it.choice?.image && <img className="th" src={it.choice.image} alt="" />}
                    <span className="t">
                      <b>{it.choice?.name ?? it.name}</b>
                      <small>{TYPE[it.group]} · {it.choice ? lc(it.name) : it.note}{it.code ? ` · ${it.code}` : ""}</small>
                    </span>
                    <span className={tagFor(it)}>{actionLabel(it)}</span>
                  </button>
                  {open && (
                    <div className="ws-detail">
                      <div className="seg-ctl" role="group" aria-label={`What to do with ${lc(it.name)}`}>
                        {actionsFor(it).map((a) => (
                          <a key={a.v} href={`#${a.v}`} className={!it.choice && it.action === a.v ? "on" : ""} aria-pressed={!it.choice && it.action === a.v}
                            onClick={(e) => (e.preventDefault(), update(it.n, { action: a.v, choice: undefined }))}>{a.t}</a>
                        ))}
                      </div>
                      {it.group === "finishes" && !/curtain|door frame|trim/i.test(it.name) ? (
                        <div className="ws-sw" role="list" aria-label="Wall finish">
                          {wallFinishes(s).map((f) => (
                            <button key={f.name} type="button" role="listitem" className={`ws-s${it.name === f.name ? " sel" : ""}`} aria-pressed={it.name === f.name} onClick={() => setFinish(it.n, f.name)}>
                              <i style={f.image ? { backgroundImage: `url(${f.image})` } : { background: f.hex ?? "#D9CFC3" }} />
                              {f.name}
                            </button>
                          ))}
                        </div>
                      ) : canChoose(it) ? (
                        <Choices item={it} onPick={(p) => update(it.n, { choice: { name: p.name, image: p.image, url: p.url, productId: p.id, price: p.price, currency: p.currency }, action: "Buy" })} />
                      ) : it.choice ? (
                        <p className="small">
                          {it.choice.url ? <a href={it.choice.url} target="_blank" rel="noreferrer">See it in the shop</a> : "Chosen"} ·{" "}
                          <a href="#change" onClick={(e) => (e.preventDefault(), update(it.n, { choice: undefined }))}>Choose another</a>
                        </p>
                      ) : null}
                      {canChoose(it) && (
                        <div className="ws-link">
                          <label htmlFor={`lk${it.n}`} className="small">Seen one you like? Paste its link</label>
                          <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
                            <input id={`lk${it.n}`} className="input" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} />
                            <button type="button" className="btn soft auto" onClick={() => {
                              if (!/^https?:\/\/\S+\.\S+/.test(link.trim())) return toast({ title: "Paste a full shop link, starting with https://" });
                              update(it.n, { choice: { name: `${it.name} from your link`, url: link.trim() }, action: "Buy" });
                              setLink("");
                            }}>Use it</button>
                          </div>
                        </div>
                      )}
                      {it.added && (
                        <button type="button" className="link-btn" onClick={() => { setWall(w, { items: wp.items.filter((x) => x.n !== it.n) }); setSel(undefined); }}>
                          Remove this point
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
            {redoFloor && (
              <li className="ws-it">
                <div className="ws-row static">
                  <span className="n fl">F</span>
                  <span className="t"><b>{surfaces.floor}</b><small>Floor · whole room</small></span>
                </div>
                <div className="ws-sw" role="list" aria-label="Floor">
                  {floorFinishes(s).map((f) => (
                    <button key={f} type="button" role="listitem" className={`ws-s txt${surfaces.floor === f ? " sel" : ""}`} aria-pressed={surfaces.floor === f}
                      onClick={() => set((x) => ({ surfaces: { walls: surfacesFor(x).walls, floor: f } }))}>{f}</button>
                  ))}
                </div>
              </li>
            )}
          </ol>
          {hidden.length > 0 && <p className="small" style={{ marginTop: 8 }}>Not on this wall: {hidden.map((i) => lc(i.name)).join(", ")}.</p>}
          <div className="ws-add" role="group" aria-label="Add a point to this wall">
            <span className="small">Add to this wall:</span>
            {(["Socket", "Switch", "Wall light", "Data point"] as const).map((k) => (
              <button key={k} type="button" onClick={() => addPoint(k)}><I.plus />{k}</button>
            ))}
          </div>
          <div className="field" style={{ marginTop: 14 }}>
            <label htmlFor="chg">Anything else for this wall?</label>
            <textarea id="chg" className="textarea" style={{ minHeight: 84 }} placeholder="e.g. a picture ledge above the sofa, a dimmable wall light"
              value={wp.change ?? ""} onChange={(e) => setWall(w, { change: e.target.value || undefined })} />
          </div>
        </aside>
      </div>
    </Screen>
  );
}
