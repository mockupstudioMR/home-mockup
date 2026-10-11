/** Step 8 — Finishing details: walk around the room wall by wall, open one wall, summary. */
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Back, Go, Screen, useGo } from "../Shell";
import { I } from "../icons";
import { roomName } from "../data";
import { curRoom, useJourney, type JourneyState, type Wall, type WallItem, type WallPlan } from "../state";
import { StepSummary } from "../Summary";
import { generatePreview } from "../services";
import { soFar } from "../story";
import { saveStepDone } from "../sync";
import { wallRoles } from "./Step4";

const WALLS: Wall[] = ["A", "B", "C", "D"];
const lc = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** Pin positions on a wall picture, in reading order. */
const SPOTS = [
  [22, 30], [82, 30], [56, 20], [70, 70], [42, 55], [44, 82], [30, 70], [62, 45], [16, 60],
];

/** What each wall holds, composed from every earlier step. */
export function composeWalls(s: JourneyState): Record<Wall, WallPlan> {
  const roles = Object.fromEntries(wallRoles(s, s.layouts[s.chosenLayout ?? 0]).split(" · ").map((r) => [r[0], r.slice(2)])) as Record<Wall, string>;
  const lay = s.layouts[s.chosenLayout ?? 0];
  const near = (i: { x: number; y: number; w: number; h: number }): Wall => {
    const d = { A: i.y, C: 100 - (i.y + i.h), D: i.x, B: 100 - (i.x + i.w) };
    return (Object.entries(d) as [Wall, number][]).sort((a, b) => a[1] - b[1])[0][0];
  };
  const pal = s.moodboard?.palette ?? [];
  const wallFinish = pal.find((p) => /plaster|paint|limewash|wallpaper|greige/i.test(p.material ?? p.name))?.material ?? "Painted wall";
  const L = s.lighting;
  const out = {} as Record<Wall, WallPlan>;
  for (const w of WALLS) {
    const role = roles[w] ?? "Open";
    const items: Omit<WallItem, "n" | "x" | "y">[] = [];
    // furniture & decor
    for (const it of lay?.items ?? []) {
      const at = it.kind === "chair" && s.accent?.wall ? s.accent.wall : near(it);
      if (it.kind === "rug" || at !== w || !it.label) continue;
      if (it.kind === "keep") continue;
      const anchor = s.anchor && it.kind === (s.anchor.kind === "sofa" ? "sofa" : it.kind) && it.kind === "sofa";
      items.push({
        group: "furniture",
        name: anchor ? `${s.anchor!.shape} ${s.anchor!.kind}` : it.kind === "chair" && s.accent ? s.accent.name : it.kind === "table" ? s.supporting[0]?.name ?? it.label : it.label,
        note: anchor ? `${s.anchor!.w} × ${s.anchor!.d} × ${s.anchor!.h} cm · standard` : it.kind === "chair" && s.accent ? `${s.accent.decision === "skip" ? "Skipped" : "Accent piece"}` : "Example size",
        action: "Buy",
      });
    }
    for (const k of s.keeping.filter((k) => (k.wall ?? "B") === w)) items.push({ group: "furniture", name: k.name, note: k.measured ? "Measured" : "Size TBC", action: "Keep" });
    if (role === "Entry" && s.supporting.find((x) => /console/i.test(x.name))) {
      const c = s.supporting.find((x) => /console/i.test(x.name))!;
      items.push({ group: "furniture", name: `${c.material.replace(/^Fluted /, "")} console`.replace(/^\w/, (x) => x.toUpperCase()), note: "Example 100 × 30 × 80 cm", action: "Buy" });
      items.push({ group: "furniture", name: "Mirror", note: "Round, above the console", action: "Buy" });
    }
    // walls & finishes
    if (role === "Window") items.push({ group: "finishes", name: "Curtains + track", note: "Track width, drop TBC", action: "Buy" });
    if (role === "Entry") items.push({ group: "finishes", name: "Door frame + trim", note: "Opening size TBC", action: "Keep" });
    items.push({ group: "finishes", name: wallFinish, note: w === "A" || w === "D" ? "Feature finish" : "Wall finish", action: "Buy" });
    // lighting & electricity
    const light = L?.layers.find((l) => (l.key === "overall" && /sofa|bed/i.test(role)) || (l.key === "task" && role === "Window") || (l.key === "accent" && s.keeping.some((k) => (k.wall ?? "B") === w)));
    if (light) items.push({ group: "lighting", name: light.decision === "change" && light.change ? light.change : light.name, note: light.key === "overall" && L?.dimmer ? "On a dimmer" : cap(light.key), action: "Buy" });
    if (role === "Entry") {
      items.push({ group: "lighting", name: "Wall sconce", note: "By the door", action: "Buy" });
      items.push({ group: "lighting", name: `Switch${L?.dimmer ? " + dimmer" : ""}`, note: "By the door", action: "Keep" });
    }
    const sockets = /sofa|bed/i.test(role) ? 2 : 1;
    items.push({ group: "lighting", name: role === "Entry" ? "Console socket" : `${sockets} socket${sockets > 1 ? "s" : ""}`, note: "Position TBC", action: "Keep" });
    if (role === "Window" && L?.blind) items.push({ group: "lighting", name: "Blind power", note: "Optional", action: "Buy" });
    // inside the wall
    const inWalls = s.houseState === "core-shell" || s.houseState === "redoing" || s.allowInWalls;
    if (role === "Entry") {
      items.push({ group: "inside", name: "Data / router point", note: "Behind console", action: "TBC" });
      items.push({ group: "inside", name: "Ventilation grille", note: "Above the door", action: "TBC" });
    }
    if (/sofa|bed/i.test(role) && inWalls) items.push({ group: "inside", name: "AC unit", note: "Position TBC", action: "TBC" });
    const water = s.placements.some((p) => p.kind === "water" && p.wall === w) || (s.fixedTbc.includes("water") && role === "Window" && /kitchen|bath/.test(curRoom(s) ?? ""));
    items.push({ group: "inside", name: "Water", note: water ? "Supply on this wall" : "None on this wall", action: water ? "TBC" : "—" });
    let e = 0, d = 0, v = 0;
    const numbered = items.map((it, i) => {
      let code: string | undefined;
      if (it.group === "lighting") code = `${w}-E${++e}`;
      if (it.name.startsWith("Data")) code = `${w}-D${++d}`;
      if (it.name.startsWith("Ventilation")) code = `${w}-V${++v}`;
      return { ...it, n: i + 1, code, x: SPOTS[i % SPOTS.length][0], y: SPOTS[i % SPOTS.length][1] };
    });
    const keepPhoto = s.keeping.find((k) => (k.wall ?? "B") === w && k.photos[0])?.photos[0];
    const image =
      (/sofa|bed/i.test(role) && s.anchor?.images[s.anchor.shape]) || keepPhoto || (role === "Window" && s.accent?.image) || (role === "Entry" && s.supportImage) || s.preview?.versions[s.preview.current]?.image;
    out[w] = { role, image: image || undefined, status: "review", items: numbered };
  }
  return out;
}

/** The walls, composed once and then kept in the journey (status and changes are the person's). */
function useWalls() {
  const { s, set } = useJourney();
  const composed = useMemo(() => composeWalls(s), [s]);
  const walls = WALLS.reduce((acc, w) => ({ ...acc, [w]: s.walls[w] ? { ...composed[w], ...s.walls[w], items: s.walls[w]!.items?.length ? s.walls[w]!.items : composed[w].items } : composed[w] }), {} as Record<Wall, WallPlan>);
  const setWall = (w: Wall, patch: Partial<WallPlan>) => set((x) => ({ walls: { ...x.walls, [w]: { ...walls[w], ...(x.walls[w] ?? {}), ...patch } } }));
  return { walls, setWall };
}

type Filter = "all" | "furniture" | "finishes" | "decor" | "lighting" | "electric";
const FILTERS: [Filter, string][] = [["all", "Everything"], ["furniture", "Furniture"], ["finishes", "Walls & floor"], ["decor", "Decor"], ["lighting", "Lighting"], ["electric", "Electricity"]];

function wallText(wp: WallPlan, f: Filter) {
  const pick = (g: WallItem["group"][]) => wp.items.filter((i) => g.includes(i.group) && i.action !== "—");
  const furn = pick(["furniture"]).map((i) => (i.action === "Keep" ? `your ${lc(i.name)}` : lc(i.name)));
  const fin = pick(["finishes"]).map((i) => lc(i.name));
  if (f === "furniture" || f === "decor") return furn.length ? cap(furn.join(", ")) + "." : "No furniture on this wall.";
  if (f === "finishes") return cap(fin.join(", ")) + ".";
  if (f === "lighting" || f === "electric") return cap(pick(["lighting"]).map((i) => lc(i.name)).join(", ")) + ".";
  const all = [...furn, ...fin];
  return all.length ? cap(all.join(", ")) + "." : "Kept clear.";
}
function wallMeta(wp: WallPlan, f: Filter) {
  const light = wp.items.filter((i) => i.group === "lighting");
  const inside = wp.items.filter((i) => i.group === "inside" && i.action === "TBC");
  const tbcKeep = wp.items.filter((i) => i.group === "furniture" && i.action === "Keep" && /TBC/.test(i.note));
  const tags = [
    ...(f === "all" || f === "lighting" || f === "electric" ? light.map((i) => ({ t: i.name, tbc: false })) : []),
    ...(f === "all" || f === "electric" ? inside.map((i) => ({ t: `${i.name} · ${lc(i.note)}`, tbc: true })) : []),
    ...(f === "all" || f === "furniture" ? tbcKeep.map((i) => ({ t: `${i.name.replace(/^Upright /, "")} size TBC`, tbc: true })) : []),
  ];
  return tags.slice(0, 5);
}

/** 8.1 · Your room, wall by wall */
export function Walls() {
  const { s, set } = useJourney();
  const go = useGo();
  const { walls, setWall } = useWalls();
  const [f, setF] = useState<Filter>("all");
  const kept = WALLS.filter((w) => walls[w].status !== "review").length;
  const next = WALLS.find((w) => walls[w].status === "review");
  useEffect(() => {
    if (!Object.keys(s.walls).length) set({ walls });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const finish = () => {
    WALLS.forEach((w) => walls[w].status === "review" && setWall(w, { status: "kept" }));
    set((x) => ({ done: Array.from(new Set([...x.done, 8])) }));
    void saveStepDone(s, 8);
  };
  const locPos: Record<Wall, React.CSSProperties> = { A: { left: "62px", top: "5px" }, B: { right: "5px", top: "77px" }, C: { left: "62px", bottom: "5px" }, D: { left: "5px", top: "77px" } };
  return (
    <Screen board="S8-Walls" step={8} right={roomName(curRoom(s))} wrapClass="wrap wide">
      <div className="row" style={{ gap: "32px", alignItems: "center", flexWrap: "wrap" }}>
        <div className="left" style={{ flex: "1 1 520px" }}>
          <p className="eyebrow">Your room, wall by wall</p>
          <h1 className="h1" style={{ fontSize: "clamp(36px,4vw,60px)" }}>
            Walk around the room
          </h1>
          <p className="sub" style={{ fontSize: "18px" }}>
            Furniture, walls, decor, lighting and power — together on each wall. Keep a wall as it is, or open it to adjust.
          </p>
          <div className="row" style={{ marginTop: "20px", gap: "14px" }}>
            <div className="bar" role="progressbar" aria-valuenow={kept} aria-valuemin={0} aria-valuemax={4} aria-label="Walls reviewed">
              <span style={{ width: `${(kept / 4) * 100}%` }} />
            </div>
            <span className="small" style={{ fontSize: "15px" }}>
              <b style={{ color: "#3B3350" }}>{kept} of 4</b> walls kept
            </span>
          </div>
        </div>
        <div className="loc" role="img" aria-label="Plan locator">
          <div className="r" />
          {WALLS.map((w) => (
            <b key={w} className={walls[w].status !== "review" ? "ok" : ""} style={locPos[w]}>
              {w}
            </b>
          ))}
        </div>
      </div>
      <div className="seg-ctl" style={{ marginTop: "28px", flexWrap: "wrap" }} role="tablist" aria-label="Show">
        {FILTERS.map(([k, t]) => (
          <a key={k} href={`#${k}`} className={f === k ? "on" : ""} role="tab" aria-selected={f === k} onClick={(e) => (e.preventDefault(), setF(k))}>
            {t}
          </a>
        ))}
      </div>
      <div className="walls">
        {WALLS.map((w) => {
          const wp = walls[w];
          return (
            <Go key={w} className={`wc${wp.status !== "review" ? " ok" : ""}`} to="S8-WallDetail" extra={`/${w}`}>
              <div className="ph">{wp.image && <img className="img" src={wp.image} alt={`Wall ${w}: ${wallText(wp, "all")}`} />}</div>
              <div className="in">
                <div className="row" style={{ gap: "12px" }}>
                  <span className="lt">{w}</span>
                  <h2 className="h3">{wp.role} wall</h2>
                  <span className={`tag${wp.status !== "review" ? " ok" : ""}`} style={{ marginLeft: "auto" }}>
                    {wp.status === "kept" ? "✓ Kept" : wp.status === "changed" ? "✓ Changed" : "To review"}
                  </span>
                </div>
                <p>{wallText(wp, f)}</p>
                <div className="meta">
                  {wallMeta(wp, f).map((t) => (
                    <span key={t.t} className={`tag ${t.tbc ? "tbc" : "line"}`}>
                      {t.t}
                    </span>
                  ))}
                </div>
              </div>
            </Go>
          );
        })}
      </div>
      <p className="small" style={{ marginTop: "18px" }}>
        Walls you haven't photographed are illustrative proposals based on your preview. Electrical positions and specs: TBC.
      </p>
      <div className="actions">
        <Back to="S7-Lighting" />
        <Go className="btn ghost auto" to="S8-Summary" style={{ marginLeft: "auto" }} onClick={finish}>
          Keep all 4 walls · finish step 8
        </Go>
        {next && (
          <button className="btn auto" type="button" onClick={() => go("S8-WallDetail", `/${next}`)}>
            Review wall {next}
            <I.next />
          </button>
        )}
      </div>
    </Screen>
  );
}

const CYCLE: WallItem["action"][] = ["Keep", "Buy", "Use mine", "Changed"];

/** 8.2 · One wall in detail */
export function WallDetail({ param }: { param?: string }) {
  const { s, set } = useJourney();
  const go = useGo();
  const { toast } = useToast();
  const { walls, setWall } = useWalls();
  const w = (WALLS.includes(param as Wall) ? param : "A") as Wall;
  const wp = walls[w];
  const [busy, setBusy] = useState(false);
  const changed = wp.items.filter((i) => i.action === "Changed" || i.action === "Use mine");
  const request =
    wp.change ??
    (changed.length
      ? `${changed.map((i) => (i.action === "Use mine" ? `use my ${lc(i.name)}` : `change the ${lc(i.name)}`)).join(", ")}. Keep the rest.`.replace(/^\w/, (c) => c.toUpperCase())
      : "");
  const cycle = (n: number) =>
    setWall(w, {
      items: wp.items.map((i) => (i.n === n && i.group !== "inside" ? { ...i, action: CYCLE[(CYCLE.indexOf(i.action) + 1) % CYCLE.length] } : i)),
      change: undefined,
    });
  const after = () => {
    const nx = WALLS.find((x) => x !== w && walls[x].status === "review");
    if (nx) go("S8-WallDetail", `/${nx}`);
    else {
      set((x) => ({ done: Array.from(new Set([...x.done, 8])) }));
      void saveStepDone(s, 8);
      go("S8-Summary");
    }
  };
  const apply = async () => {
    if (!request.trim()) return toast({ title: "Describe the change, or keep the wall as it is" });
    setBusy(true);
    try {
      const img = wp.image ? await generatePreview(s, { sourceImage: wp.image, change: `Wall ${w} (${wp.role.toLowerCase()} wall): ${request}` }) : undefined;
      setWall(w, { status: "changed", change: request, image: img ?? wp.image });
      go("S8-Walls");
    } catch (e) {
      toast({ title: "The wall couldn't be updated", description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };
  const groups: [WallItem["group"], string][] = [["furniture", "Furniture & decor"], ["finishes", "Walls & finishes"], ["lighting", "Lighting & electricity"], ["inside", "Inside the wall"]];
  const tagFor = (i: WallItem) => (i.action === "Keep" ? "tag ok" : i.action === "TBC" ? "tag tbc" : i.action === "Buy" || i.action === "—" ? "tag line" : "tag");
  const furn = wp.items.filter((i) => i.group === "furniture");
  const points = wp.items.filter((i) => i.code && i.group === "lighting");
  const hasDoor = wp.role === "Entry";
  const hasWindow = wp.role === "Window";
  return (
    <Screen board="S8-WallDetail" step={8} right={`Wall ${w} of 4`} wrapClass="wrap wide" wrapStyle={{ paddingTop: "32px" }}>
      <nav className="wtabs" aria-label="Walls">
        {WALLS.map((x) => (
          <Go key={x} className={x === w ? "on" : walls[x].status !== "review" ? "ok" : ""} to={x === w ? "S8-WallDetail" : "S8-WallDetail"} extra={`/${x}`}>
            <i>{x}</i>
            {walls[x].role}
          </Go>
        ))}
      </nav>
      <div className="split" style={{ marginTop: "24px" }}>
        <div className="main">
          <div className="left">
            <h1 className="h1" style={{ fontSize: "clamp(34px,3.6vw,52px)", marginTop: "0" }}>
              What the {lc(wp.role)} wall needs
            </h1>
            <p className="sub" style={{ fontSize: "18px", marginTop: "10px" }}>
              Keep the whole wall, or describe a change. Orange pins are what you're changing.
            </p>
          </div>
          <div className="ph pv" style={{ marginTop: "22px" }}>
            {wp.image && <img className="img" src={wp.image} alt={`${wp.role} wall`} />}
            {wp.items
              .filter((i) => i.group !== "inside")
              .map((i) => (
                <span key={i.n} className={`pin${i.action === "Changed" || i.action === "Use mine" ? " c" : ""}`} style={{ left: `${i.x}%`, top: `${i.y}%` }}>
                  {i.n}
                </span>
              ))}
          </div>
          <section style={{ marginTop: "26px" }}>
            <div className="row between">
              <h2 className="h3">Elevation preview</h2>
              <span className="tag tbc">Construction-ready after survey</span>
            </div>
            <div className="elev" style={{ marginTop: "14px" }} role="img" aria-label={`Elevation of wall ${w}`}>
              <div className="wall">
                {hasDoor && <div className="arch" />}
                {hasWindow && <div style={{ position: "absolute", left: "30%", width: "40%", top: 30, height: 90, border: "2px solid #9FC3D6", background: "rgba(159,195,214,.15)" }} />}
                {furn.some((i) => /mirror|art/i.test(i.name)) && <div className="mir" />}
                {furn.filter((i) => !/mirror|art/i.test(i.name)).slice(0, 2).map((i, k) => (
                  <div key={i.n} className="con" style={k ? { right: "auto", left: hasDoor ? 170 : 40, width: 120 } : /sofa|piano|bed/i.test(i.name) ? { width: 260, height: 70 } : undefined} />
                ))}
              </div>
              {points.map((pt, k) => (
                <span key={pt.code} className="pt" style={k === points.length - 1 && k > 0 ? { right: "52px", bottom: "112px" } : { left: hasDoor ? "196px" : `${60 + k * 150}px`, top: `${90 + k * 50}px` }}>
                  {pt.code} {lc(pt.name)}
                </span>
              ))}
              <span className="floor">Wall width, heights and point positions: TBC until measured</span>
            </div>
          </section>
        </div>
        <aside className="rail">
          <div className="rail-card">
            <div className="grp">
              {groups.map(([g, title]) => (
                <div key={g}>
                  <h3>{title}</h3>
                  {wp.items
                    .filter((i) => i.group === g)
                    .map((i) => (
                      <div className="it" key={i.n} style={g === "inside" ? { paddingLeft: "38px" } : undefined}>
                        {g !== "inside" && <i className={i.action === "Changed" || i.action === "Use mine" ? "c" : ""}>{i.n}</i>}
                        <span>
                          <b>{i.name}</b>
                          <small>
                            {i.note}
                            {i.code ? ` · ${i.code}` : ""}
                          </small>
                        </span>
                        {g === "inside" ? (
                          <span className={tagFor(i)}>{i.action}</span>
                        ) : (
                          <button className={tagFor(i)} type="button" style={{ cursor: "pointer", border: i.action === "Buy" ? undefined : 0 }} onClick={() => cycle(i.n)} title="Tap to change">
                            {i.action}
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              ))}
            </div>
            <div className="field">
              <label htmlFor="chg">Your change</label>
              <textarea id="chg" className="textarea" style={{ minHeight: "104px" }} placeholder={`e.g. keep the ${wp.items[0] ? lc(wp.items[0].name) : "furniture"}, add a dimmable wall light`} value={request} onChange={(e) => setWall(w, { change: e.target.value })} />
            </div>
            <button className={`btn${busy ? " dis" : ""}`} type="button" style={{ minHeight: "60px", fontSize: "18px" }} onClick={apply}>
              {busy ? "Updating the wall…" : `Apply and see wall ${w}`}
            </button>
            <button
              className="btn ghost"
              type="button"
              style={{ minHeight: "56px", fontSize: "17px" }}
              onClick={() => {
                setWall(w, { status: "kept" });
                after();
              }}
            >
              Keep wall as it is
            </button>
          </div>
        </aside>
      </div>
    </Screen>
  );
}

/** "AC unit on wall A (TBC) · data point D-D1 · vent D-V1 · no water in this room" */
function insideLine(walls: Record<Wall, WallPlan>) {
  const parts: React.ReactNode[] = [];
  for (const w of WALLS)
    for (const i of walls[w].items.filter((x) => x.group === "inside" && x.action === "TBC")) {
      if (i.name === "AC unit") parts.push(<span key={w + i.n}>AC unit on wall {w} <span className="tag tbc">Position TBC</span></span>);
      else if (i.code) parts.push(<span key={w + i.n}>{i.name.startsWith("Data") ? "data point" : i.name.startsWith("Vent") ? "vent" : lc(i.name)} {i.code}</span>);
      else parts.push(<span key={w + i.n}>{lc(i.name)} on wall {w}</span>);
    }
  const water = WALLS.some((w) => walls[w].items.some((i) => i.name === "Water" && i.action !== "—"));
  parts.push(<span key="water">{water ? "water points TBC" : "no water in this room"}</span>);
  return parts.map((p, i) => (
    <span key={i}>
      {i ? " · " : ""}
      {p}
    </span>
  ));
}

/** 8.3 · Step 8 summary */
export function Step8Summary() {
  const { s } = useJourney();
  const { walls } = useWalls();
  const kept = WALLS.filter((w) => walls[w].status !== "changed");
  const changed = WALLS.filter((w) => walls[w].status === "changed");
  return (
    <StepSummary
      step={8}
      board="S8-Summary"
      sub="All four walls are designed. Next we turn the design into a buying list and a plan to make it real."
      media={
        <div className="wg">
          {WALLS.map((w) => (
            <div key={w}>
              <span className="ph">
                {walls[w].image && <img className="img" src={walls[w].image} alt="" />}
                <span className="lt">{w}</span>
              </span>
              {walls[w].role} wall
            </div>
          ))}
        </div>
      }
      decisions={[
        { k: "Kept as designed", v: kept.map((w) => `Wall ${w} (${lc(walls[w].role)})`).join(" · ") || "None", edit: "S8-Walls" },
        {
          k: "Changed",
          v: changed.length ? (
            <>
              {changed.map((w, i) => (
                <span key={w}>
                  {i ? " · " : ""}Wall {w}: <b>{walls[w].change}</b>
                </span>
              ))}
            </>
          ) : (
            "Nothing changed"
          ),
          edit: "S8-WallDetail",
          editExtra: `/${changed[0] ?? "A"}`,
        },
        { k: "Inside the walls", v: <>{insideLine(walls)}</> },
      ]}
      open={["Measured elevations, after the survey", ...WALLS.flatMap((w) => walls[w].items.filter((i) => i.name === "AC unit" && i.action === "TBC").map(() => `AC unit position on wall ${w}`))]}
      soFar={soFar(s, 8)}
      back={changed.length ? "S8-WallDetail" : "S8-Walls"}
      next="S9-BuyList"
    />
  );
}
