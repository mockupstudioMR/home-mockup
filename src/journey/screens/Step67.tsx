/** Steps 6 and 7 — colours & materials, lighting & power, and their summaries. */
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Back, Go, Screen } from "../Shell";
import { Ic } from "../icons";
import { roomName } from "../data";
import { curRoom, useJourney, type JourneyState, type Wall } from "../state";
import { StepSummary } from "../Summary";
import { pieceVisual } from "../services";
import { soFar } from "../story";
import { saveStepDone } from "../sync";
import { PlanDrawing, wallRoles } from "./Step4";
import { openCount } from "./Step5";
import { KEEP_FLOOR, PARTS, decorFor, partOf, surfacesFor, wallsLine } from "../finishes";
import { RefineCrumbs } from "./RefineCrumbs";

const p = (d: string) => <path d={d} />;

type Mat = { name: string; hex: string };
const LIB: Record<string, Mat[]> = {
  fabric: [
    { name: "Plum velvet", hex: "#6E3550" }, { name: "Green velvet", hex: "#2F5B4A" }, { name: "Rust velvet", hex: "#A4462F" }, { name: "Navy velvet", hex: "#26304E" },
    { name: "Ochre bouclé", hex: "#C4943A" }, { name: "Oatmeal linen", hex: "#D8CBB4" }, { name: "Sage linen", hex: "#9EAA8C" }, { name: "Charcoal wool", hex: "#36363A" },
  ],
  wood: [
    { name: "Dark walnut", hex: "#5A3A26" }, { name: "Light oak", hex: "#B08A60" }, { name: "Smoked oak", hex: "#6B5040" }, { name: "Ash", hex: "#C9B79A" }, { name: "Black-stained oak", hex: "#2A2522" }, { name: "Teak", hex: "#8A5A34" },
  ],
  metal: [
    { name: "Brushed brass", hex: "#B4975A" }, { name: "Matte black", hex: "#222222" }, { name: "Brushed nickel", hex: "#A7A7A2" }, { name: "Antique bronze", hex: "#6E5A3E" }, { name: "Copper", hex: "#B0704A" },
  ],
  wall: [
    { name: "Grey plaster", hex: "#6B6862" }, { name: "Warm greige", hex: "#B6AC9E" }, { name: "Limewash white", hex: "#ECE6DB" }, { name: "Terracotta plaster", hex: "#B56242" }, { name: "Sage paint", hex: "#9EAA8C" }, { name: "Deep green paint", hex: "#2F4B3E" },
  ],
};
const groupOf = (m?: string) => {
  const n = (m ?? "").toLowerCase();
  if (/velvet|linen|wool|boucl|leather|fabric|cotton/.test(n)) return "fabric";
  if (/walnut|oak|ash|teak|wood|pine|elm/.test(n)) return "wood";
  if (/brass|black|nickel|bronze|copper|steel|chrome|metal/.test(n)) return "metal";
  return "wall";
};
const word = (m?: string) => (m ?? "").split(" ")[0].toLowerCase();

/** The accent chair and its wall, from the chosen layout. */
function accentFrom(s: JourneyState) {
  const lay = s.layouts[s.chosenLayout ?? 0];
  const chair = lay?.items.find((i) => i.kind === "chair");
  if (!chair) return null;
  const d = { A: chair.y, C: 100 - (chair.y + chair.h), D: chair.x, B: 100 - (chair.x + chair.w) };
  const wall = (Object.entries(d) as [Wall, number][]).sort((a, b) => a[1] - b[1])[0][0];
  const colour = word(s.moodboard?.palette[1]?.material ?? s.moodboard?.palette[1]?.name);
  return { name: `${colour ? colour[0].toUpperCase() + colour.slice(1) + " " : ""}statement chair`, wall };
}
/** Tables and storage of the layout, each with a coordinated material. */
function supportingFrom(s: JourneyState) {
  const lay = s.layouts[s.chosenLayout ?? 0];
  const pal = s.moodboard?.palette ?? [];
  const wood = pal.find((x) => groupOf(x.material ?? x.name) === "wood")?.material ?? "Walnut";
  const metal = pal.find((x) => groupOf(x.material ?? x.name) === "metal")?.material ?? "Brass";
  const accent = word(pal[1]?.material ?? pal[1]?.name) || "green";
  const w = word(wood);
  const named = (lay?.items ?? []).filter((i) => ["table", "storage", "desk"].includes(i.kind)).map((i) => (i.label && i.label.toLowerCase() !== "table" ? i.label : "Coffee table"));
  const names = Array.from(new Set([...named, "Side table", "Console"])).slice(0, 3);
  return names.map((n, i) => ({
    name: n,
    material: i === 0 ? `${w[0].toUpperCase() + w.slice(1)} + ${accent} stone` : i === 1 ? metal.split(" ").slice(-1)[0].replace(/^\w/, (c) => c.toUpperCase()) : `Fluted ${w}`,
  }));
}

function MiniRail({ s, extra }: { s: JourneyState; extra: [string, string][] }) {
  const lay = s.layouts[s.chosenLayout ?? 0];
  const tbc = openCount(s) + (s.samplesAdded ? 0 : 1);
  return (
    <aside className="rail">
      <div className="rail-card">
        <h2 className="h3">Your room so far</h2>
        {lay && (
          <div className="mini" role="img" aria-label={`Layout ${(s.chosenLayout ?? 0) + 1} mini plan`}>
            <PlanDrawing layout={lay} s={s} box={{ w: 124, h: 162 }} t={5} mini />
          </div>
        )}
        <div className="kv">
          {[["Direction", s.moodboard?.name ?? "—"], ["Layout", lay?.name ?? "—"], ...extra].map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <b>{v}</b>
            </div>
          ))}
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
  );
}

const anchorLine = (s: JourneyState) => (s.anchor ? `${s.anchor.shape} ${word(s.anchor.material) ? word(s.anchor.material) + " " : ""}${s.anchor.kind}` : "—");

/** 6 · Colours & materials */
export function Palette() {
  const { s, set } = useJourney();
  const { toast } = useToast();
  const [swap, setSwap] = useState<number | null>(null);
  const part = partOf(useLocation().search);
  const pal = s.moodboard?.palette ?? [];
  const surfaces = surfacesFor(s);
  const decor = decorFor(s);
  const [newDecor, setNewDecor] = useState("");
  const setWall = (w: Wall, name: string) => set((x) => ({ surfaces: { ...surfacesFor(x), walls: { ...surfacesFor(x).walls, [w]: name } } }));
  const setFloor = (floor: string) => set((x) => ({ surfaces: { ...surfacesFor(x), floor } }));
  const wallChoices = Array.from(new Set([...pal.filter((c) => groupOf(c.material ?? c.name) === "wall").map((c) => c.material ?? c.name), ...LIB.wall.map((m) => m.name), ...Object.values(surfaces.walls)]));
  const floorChoices = Array.from(new Set([KEEP_FLOOR, ...LIB.wood.map((m) => `${m.name} flooring`), "Micro-cement", "Terrazzo", "Large-format stone tiles", surfaces.floor]));
  const PART_ORDER = ["accents", "tables", "surfaces", "decor"] as const;
  const nextPart = PART_ORDER[PART_ORDER.indexOf(part) + 1];
  const prevPart = PART_ORDER[PART_ORDER.indexOf(part) - 1];
  const markRefined = () => set((x) => ({ refined: Array.from(new Set([...(x.refined ?? []), part])) }));
  const base = accentFrom(s);
  const accent = s.accent ?? (base ? { ...base, decision: "keep" as const } : undefined);
  const supporting = s.supporting.length ? s.supporting : supportingFrom(s);
  // Pictures are drawn when the screen opens and again after every material swap (gen changes);
  // a failed one shows "Try again" instead of an empty box.
  const [gen, setGen] = useState(0);
  const [pics, setPics] = useState<{ accent?: "busy" | "failed"; support?: "busy" | "failed" }>({});
  const asking = useRef(new Set<string>()); // pictures being drawn, so one isn't asked for twice
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!s.accent && accent) set({ accent });
    if (!s.supporting.length && supporting.length) set({ supporting });
    if (!s.moodboard) return;
    const live = () => mounted.current;
    const last = supporting[supporting.length - 1];
    if (accent && !accent.image && !asking.current.has(`a:${accent.name}`)) {
      const name = accent.name;
      asking.current.add(`a:${name}`);
      setPics((p) => ({ ...p, accent: "busy" }));
      void pieceVisual(s, name, `${name.toLowerCase()} in ${pal[1]?.material ?? "the accent colour"}, by the window`)
        .then((img) => {
          // a newer swap may have changed the accent meanwhile: keep only a picture of the current one
          set((x) => (x.accent && x.accent.name !== name ? {} : { accent: { ...(x.accent ?? accent), image: img } }));
          if (live()) setPics((p) => ({ ...p, accent: undefined }));
        })
        .catch(() => live() && setPics((p) => ({ ...p, accent: "failed" })))
        .finally(() => asking.current.delete(`a:${name}`));
    }
    if (!s.supportImage && last && !asking.current.has(`s:${last.name}`)) {
      const key = `s:${last.name}`;
      asking.current.add(key);
      setPics((p) => ({ ...p, support: "busy" }));
      void pieceVisual(s, last.name, `${last.material.toLowerCase()} ${last.name.toLowerCase()}`)
        .then((img) => {
          set({ supportImage: img });
          if (live()) setPics((p) => ({ ...p, support: undefined }));
        })
        .catch(() => live() && setPics((p) => ({ ...p, support: "failed" })))
        .finally(() => asking.current.delete(key));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gen]);
  const retry = (
    <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", margin: 0 }}>
      <button type="button" className="link-btn" onClick={() => setGen((g) => g + 1)}>
        The picture didn't come through — try again
      </button>
    </span>
  );

  const swapTo = (i: number, m: Mat) => {
    set((x) => {
      const palette = (x.moodboard?.palette ?? []).map((c, j) => (j === i ? { ...c, name: m.name, material: m.name, hex: m.hex, image: undefined } : c));
      const next = { ...x, moodboard: { ...x.moodboard!, palette } };
      return { moodboard: next.moodboard, supporting: supportingFrom(next), accent: x.accent ? { ...x.accent, name: accentFrom(next)?.name ?? x.accent.name, image: undefined } : x.accent, supportImage: undefined };
    });
    setSwap(null);
    setGen((g) => g + 1);
  };
  const setAccent = (decision: "keep" | "adjust" | "skip") => set((x) => ({ accent: { ...(x.accent ?? accent!), decision } }));

  return (
    <Screen board="S6-Palette" step={6} right={roomName(curRoom(s))} wrapClass="wrap wide" wrapStyle={{ paddingTop: "28px" }}>
      <RefineCrumbs on={part} />
      <div className="split" style={{ marginTop: "28px" }}>
        <div className="main">
          <div className="left">
            <h1 className="h1" style={{ fontSize: "clamp(34px,3.6vw,52px)", marginTop: "0" }}>
              Keep the combination in view
            </h1>
            <p className="sub" style={{ fontSize: "18px", marginTop: "12px" }}>
              Swap any material and every coordinated suggestion updates with it.
            </p>
          </div>
          <div className="mats">
            {pal.map((c, i) => (
              <div className="mat" key={i}>
                {c.image ? <img src={c.image} alt={`${c.material ?? c.name} texture`} /> : <i style={{ display: "block", width: "100%", aspectRatio: "1/1", borderRadius: 14, background: c.hex }} />}
                <span className="bar" style={{ background: c.hex }} />
                <b>{c.material ?? c.name}</b>
                <small>{c.use}</small>
                <button type="button" onClick={() => setSwap(swap === i ? null : i)} aria-expanded={swap === i}>
                  Swap
                </button>
                {swap === i && (
                  <div className="stack" style={{ gap: 6, padding: "0 4px" }}>
                    {LIB[groupOf(c.material ?? c.name)]
                      .filter((m) => m.name !== (c.material ?? c.name))
                      .map((m) => (
                        <button key={m.name} type="button" onClick={() => swapTo(i, m)} style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-start", padding: "0 10px", margin: 0 }}>
                          <i style={{ width: 16, height: 16, borderRadius: 4, background: m.hex, display: "block" }} />
                          {m.name}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="two">
            {part === "accents" && (
            <section className="card" id="accents">
              <div className="ph">
                {accent?.image ? <img className="img" src={accent.image} alt={accent.name} /> : pics.accent === "failed" ? retry : pics.accent === "busy" ? <span className="small" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", margin: 0 }}>Drawing the picture…</span> : null}
              </div>
              <div className="row between" style={{ marginTop: "18px" }}>
                <h2 className="h3">Accent piece</h2>
                {accent?.wall && <span className="tag">Wall {accent.wall}</span>}
              </div>
              <p className="p" style={{ marginTop: "8px", fontSize: "16px" }}>
                {accent
                  ? accent.decision === "skip"
                    ? "No accent piece — the room stays calmer."
                    : `One ${accent.name.toLowerCase()} adds character${s.placements.some((x) => x.kind === "windows" && x.wall === accent.wall) ? " by the window" : ""}.`
                  : "Your layout has no accent chair."}
              </p>
              {accent && (
                <div className="seg-ctl" style={{ marginTop: "16px" }}>
                  {(["keep", "adjust", "skip"] as const).map((d) => (
                    <a key={d} href={`#${d}`} className={accent.decision === d ? "on" : ""} onClick={(e) => (e.preventDefault(), setAccent(d))}>
                      {d[0].toUpperCase() + d.slice(1)}
                    </a>
                  ))}
                </div>
              )}
              {accent?.decision === "adjust" && (
                <input className="input" style={{ marginTop: 12 }} placeholder="e.g. a rust leather chair instead" value={accent.change ?? ""} onChange={(e) => set((x) => ({ accent: { ...x.accent!, change: e.target.value } }))} />
              )}
            </section>
            )}
            {part === "tables" && (
            <section className="card" id="tables">
              <div className="ph">
                {s.supportImage ? <img className="img" src={s.supportImage} alt={supporting.map((x) => x.name).join(", ")} /> : pics.support === "failed" ? retry : pics.support === "busy" ? <span className="small" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", margin: 0 }}>Drawing the picture…</span> : null}
              </div>
              <div className="row between" style={{ marginTop: "18px" }}>
                <h2 className="h3">Supporting furniture</h2>
                <span className="tag">Coordinated</span>
              </div>
              <div style={{ marginTop: "8px" }}>
                {supporting.map((x) => (
                  <div className="ln" key={x.name}>
                    {x.name}
                    <span className="tag line">{x.material}</span>
                  </div>
                ))}
              </div>
            </section>
            )}
            {part === "surfaces" && (
              <section className="card" id="surfaces" style={{ gridColumn: "1 / -1" }}>
                <div className="row between">
                  <h2 className="h3">Walls &amp; floors</h2>
                  <span className="tag">From your palette</span>
                </div>
                <p className="p" style={{ marginTop: "8px", fontSize: "16px" }}>
                  Choose the finish for each wall and the floor. {wallRoles(s, s.layouts[s.chosenLayout ?? 0])}
                </p>
                <div className="g2" style={{ gap: "12px", marginTop: "14px" }}>
                  {(["A", "B", "C", "D"] as Wall[]).map((w) => (
                    <div className="field" key={w}>
                      <label htmlFor={`wall-${w}`}>Wall {w}</label>
                      <select id={`wall-${w}`} className="select" value={surfaces.walls[w]} onChange={(e) => setWall(w, e.target.value)}>
                        {wallChoices.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <div className="field">
                    <label htmlFor="floor">Floor</label>
                    <select id="floor" className="select" value={surfaces.floor} onChange={(e) => setFloor(e.target.value)}>
                      {floorChoices.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>
            )}
            {part === "decor" && (
              <section className="card" id="decor" style={{ gridColumn: "1 / -1" }}>
                <div className="row between">
                  <h2 className="h3">Decor</h2>
                  <span className="tag">{decor.filter((d) => d.on).length} on your list</span>
                </div>
                <p className="p" style={{ marginTop: "8px", fontSize: "16px" }}>
                  Suggested from your preview and moodboard. Switch off what you don't want, add your own.
                </p>
                <div style={{ marginTop: "8px" }}>
                  {decor.map((d) => (
                    <label className="ln" key={d.name} style={{ cursor: "pointer" }}>
                      <input type="checkbox" checked={d.on} onChange={() => set((x) => ({ decor: decorFor(x).map((y) => (y.name === d.name ? { ...y, on: !y.on } : y)) }))} />
                      {d.name}
                      <span className={d.on ? "tag ok" : "tag line"}>{d.on ? "On the list" : "Not now"}</span>
                    </label>
                  ))}
                </div>
                <form
                  className="row"
                  style={{ gap: "8px", flexWrap: "nowrap", marginTop: "12px" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const name = newDecor.trim();
                    if (!name) return;
                    set((x) => ({ decor: [...decorFor(x).filter((y) => y.name.toLowerCase() !== name.toLowerCase()), { name, on: true }] }));
                    setNewDecor("");
                  }}
                >
                  <input className="input" aria-label="Add a decor piece" placeholder="e.g. Floor mirror, throw blanket" value={newDecor} onChange={(e) => setNewDecor(e.target.value)} />
                  <button className="btn ghost auto" type="submit" style={{ minHeight: "48px", fontSize: "15px", padding: "0 18px" }}>
                    Add
                  </button>
                </form>
              </section>
            )}
          </div>
          <section className="panel tint" style={{ marginTop: "24px", padding: "22px 26px" }}>
            <div className="row" style={{ gap: "16px" }}>
              <Ic style={{ color: "#7A4A1E" }}>
                <circle cx="12" cy="12" r="9" />
                {p("M12 11v5M12 8h.01")}
              </Ic>
              <p className="p" style={{ fontSize: "16px", flex: "1 1 360px" }}>
                Screens shift colour. Before you buy, check real samples — brands, finishes and product links are still TBC.
              </p>
              <button
                className="btn ghost auto"
                type="button"
                style={{ minHeight: "48px", fontSize: "15px", padding: "0 18px" }}
                onClick={() => {
                  set({ samplesAdded: true });
                  toast({ title: `${pal.length} samples added to your buying list` });
                }}
              >
                {s.samplesAdded ? "Samples on your list ✓" : "Add samples to my list"}
              </button>
            </div>
          </section>
          <div className="actions">
            {prevPart ? (
              <Go to="S6-Palette" extra={`?part=${prevPart}`} className="back">
                <Ic>{p("M19 12H5M11 6l-6 6 6 6")}</Ic>
                Back
              </Go>
            ) : (
              <Back to="S5-Anchor" />
            )}
            {nextPart ? (
              <Go className="btn auto" to="S6-Palette" extra={`?part=${nextPart}`} style={{ marginLeft: "auto" }} onClick={markRefined}>
                Next: {PARTS.find((x) => x.key === nextPart)!.label}
                <Ic>{p("M5 12h14M13 6l6 6-6 6")}</Ic>
              </Go>
            ) : (
              <Go
                className="btn auto"
                to="S6-Summary"
                style={{ marginLeft: "auto" }}
                onClick={() => {
                  markRefined();
                  set((x) => ({ done: Array.from(new Set([...x.done, 6])), surfaces: surfacesFor(x), decor: decorFor(x) }));
                  void saveStepDone(s, 6);
                }}
              >
                Finish step 6
                <Ic>{p("M5 12h14M13 6l6 6-6 6")}</Ic>
              </Go>
            )}
          </div>
        </div>
        <MiniRail s={s} extra={[["Main piece", anchorLine(s)], ["Accent", accent && accent.decision !== "skip" ? accent.name.replace(" statement", "") : "None"]]} />
      </div>
    </Screen>
  );
}

const lc = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
/** 6.1 · Step 6 summary */
export function Step6Summary() {
  const { s } = useJourney();
  const pal = s.moodboard?.palette ?? [];
  const a = s.accent;
  return (
    <StepSummary
      step={6}
      board="S6-Summary"
      sub="The materials and supporting pieces work together. Next we light it."
      media={
        <div className="mats">
          {pal.map((c, i) => (
            <div key={i}>
              {c.image ? <img src={c.image} alt="" /> : <i style={{ display: "block", width: "100%", aspectRatio: "1/1", borderRadius: 14, background: c.hex }} />}
              {c.material ?? c.name}
            </div>
          ))}
        </div>
      }
      decisions={[
        { k: "Materials", v: pal.map((c, i) => (i ? lc(c.material ?? c.name) : c.material ?? c.name)).join(" · "), edit: "S6-Palette" },
        {
          k: "Accent piece",
          v: a ? (
            a.decision === "skip" ? (
              "Skipped"
            ) : (
              <>
                <b>{a.name}</b>
                {s.placements.some((x) => x.kind === "windows" && x.wall === a.wall) ? " by the window" : ""} (wall {a.wall}) — {a.decision === "keep" ? "kept" : `change: ${a.change || "to decide"}`}
              </>
            )
          ) : (
            "None"
          ),
          edit: "S6-Palette",
        },
        { k: "Supporting pieces", v: s.supporting.map((x, i) => `${i ? lc(x.name) : x.name}: ${lc(x.material)}`).join(" · "), edit: "S6-Palette", editExtra: "?part=tables" },
        { k: "Walls & floors", v: `${wallsLine(surfacesFor(s).walls)} · floor: ${lc(surfacesFor(s).floor)}`, edit: "S6-Palette", editExtra: "?part=surfaces" },
        { k: "Decor", v: decorFor(s).filter((d) => d.on).map((d, i) => (i ? lc(d.name) : d.name)).join(" · ") || "None", edit: "S6-Palette", editExtra: "?part=decor" },
      ]}
      open={["Order real samples before buying", "Brands, finishes and product links"]}
      soFar={soFar(s, 6)}
      back="S6-Palette"
      next="S7-Lighting"
    />
  );
}

/** Three light layers from the preview's lighting, what the person does and what they keep. */
function layersFrom(s: JourneyState): NonNullable<JourneyState["lighting"]>["layers"] {
  const read = (s.preview?.read ?? []).find((r) => r.key === "lighting")?.keywords ?? [];
  const img = s.preview?.versions[s.preview.current]?.image;
  const acts = s.activities.join(" ").toLowerCase();
  const keep = s.keeping[0]?.name.toLowerCase().replace(/^upright /, "");
  const accentChair = s.accent && s.accent.decision !== "skip" ? s.accent.name.replace(" statement", "").toLowerCase() : null;
  const overall = read.find((k) => /pendant|ceiling|chandelier|cluster|track|spot/i.test(k)) ?? "Ceiling pendant";
  return [
    { key: "overall", name: /glass/i.test(overall) || !/pendant cluster/i.test(overall) ? overall : `Glass ${overall.toLowerCase()}`, text: "Soft general light over the seating. On a dimmer.", image: img, pos: "55% 0%", decision: "keep" },
    {
      key: "task",
      name: /work|study/.test(acts) ? "Desk task lamp" : /read/.test(acts) || accentChair ? "Reading floor lamp" : "Floor lamp",
      text: accentChair ? `Beside the ${accentChair} at the window.` : "Where you sit and read.",
      image: img,
      pos: "75% 40%",
      decision: "keep",
    },
    keep
      ? { key: "accent", name: `${keep[0].toUpperCase() + keep.slice(1)} picture light`, text: /piano/.test(keep) ? "Lights the music and the artwork above." : `Lights the ${keep} and what's above it.`, image: img, pos: "50% 15%", decision: "keep" }
      : { key: "accent", name: "Shelf lighting", text: "Warm light on the shelves and objects.", image: img, pos: "50% 15%", decision: "keep" },
  ];
}

/** Power each wall needs, from what stands on it. */
function powerByWall(s: JourneyState) {
  const roles = wallRoles(s, s.layouts[s.chosenLayout ?? 0]).split(" · ");
  const L = s.lighting;
  return roles.map((r) => {
    const [w, ...rest] = r.split(" ");
    const what = rest.join(" ");
    const n = what.toLowerCase();
    const need =
      n === "entry" ? `Switch${L?.dimmer ? ", dimmer" : ""}` : n === "window" ? `Socket${L?.blind ? ", blind" : ""}` : /sofa|bed/.test(n) ? "Lamp + charging" : s.keeping.some((k) => k.name.toLowerCase().includes(n)) ? (L?.layers.find((l) => l.key === "accent")?.name.replace(/^\w+ /, "").replace(/^\w/, (c) => c.toUpperCase()) ?? "Socket") : "Socket";
    return { w, what, need };
  });
}
const finishOf = (s: JourneyState) => s.moodboard?.palette.find((x) => groupOf(x.material ?? x.name) === "metal")?.material ?? "Brushed brass";

/** 7 · Lighting & power */
export function Lighting() {
  const { s, set } = useJourney();
  const base = useMemo(() => layersFrom(s), [s]);
  const L = s.lighting ?? { layers: base, dimmer: true, blind: false };
  const once = useRef(false);
  useEffect(() => {
    if (!s.lighting) set({ lighting: L });
    if (once.current || L.stripImage) return;
    once.current = true;
    void pieceVisual(s, "Sockets, switches and a dimmer", `${finishOf(s).toLowerCase()} wall plates: a socket, a double switch, a rotary dimmer and a blind outlet, side by side on a plaster wall`)
      .then((img) => set((x) => ({ lighting: { ...(x.lighting ?? L), stripImage: img } })))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const setL = (patch: Partial<NonNullable<JourneyState["lighting"]>>) => set((x) => ({ lighting: { ...(x.lighting ?? L), ...patch } }));
  const setLayer = (k: string, patch: Partial<NonNullable<JourneyState["lighting"]>["layers"][number]>) => setL({ layers: L.layers.map((l) => (l.key === k ? { ...l, ...patch } : l)) });
  const hasWindow = s.placements.some((x) => x.kind === "windows" && x.wall);
  const pal = s.moodboard?.palette ?? [];
  return (
    <Screen board="S7-Lighting" step={7} right={roomName(curRoom(s))} wrapClass="wrap wide" wrapStyle={{ paddingTop: "28px" }}>
      <div className="palbar" aria-label="Your palette">
        <span className="lbl" style={{ marginRight: "4px" }}>
          Palette
        </span>
        {pal.map((c, i) => (
          <span className="pi" key={i}>
            {c.image ? <img src={c.image} alt="" /> : <i style={{ width: 36, height: 36, borderRadius: 10, background: c.hex, display: "block" }} />}
            {c.material ?? c.name}
          </span>
        ))}
      </div>
      <div className="split" style={{ marginTop: "28px" }}>
        <div className="main">
          <div className="left">
            <h1 className="h1" style={{ fontSize: "clamp(34px,3.6vw,52px)", marginTop: "0" }}>
              See lights and power together
            </h1>
            <p className="sub" style={{ fontSize: "18px", marginTop: "12px" }}>
              Three layers of light, matched to what you do in each part of the room. Change only what you want to.
            </p>
          </div>
          <h2 className="h3" style={{ marginTop: "32px" }}>
            Room lighting
          </h2>
          <div className="layers">
            {L.layers.map((l) => (
              <article className="ly" key={l.key}>
                <div className="ph">{l.image && <img className="img" src={l.image} alt={l.name} style={{ objectPosition: l.pos }} />}</div>
                <div className="in">
                  <span className="k">{l.key}</span>
                  <b>{l.decision === "change" && l.change ? l.change : l.name}</b>
                  <p>{l.text}</p>
                  <div className="seg-ctl" style={{ marginTop: "6px", alignSelf: "flex-start" }}>
                    <a href="#keep" className={l.decision === "keep" ? "on" : ""} onClick={(e) => (e.preventDefault(), setLayer(l.key, { decision: "keep" }))}>
                      Keep
                    </a>
                    <a href="#change" className={l.decision === "change" ? "on" : ""} onClick={(e) => (e.preventDefault(), setLayer(l.key, { decision: "change" }))}>
                      Change
                    </a>
                  </div>
                  {l.decision === "change" && <input className="input" style={{ minHeight: 44, fontSize: 15 }} placeholder="What instead?" value={l.change ?? ""} onChange={(e) => setLayer(l.key, { change: e.target.value })} />}
                </div>
              </article>
            ))}
          </div>
          <h2 className="h3" style={{ marginTop: "36px" }}>
            Visible electrical features
          </h2>
          <div className="strip" style={{ marginTop: "16px" }}>
            {L.stripImage ? <img className="img" src={L.stripImage} alt={`${finishOf(s)} socket, switch, dimmer and blind outlet`} style={{ borderRadius: "18px" }} /> : <div style={{ width: "100%", height: "100%", background: "#EDE5EA" }} />}
          </div>
          <div className="pw">
            {(
              [
                ["Sockets", "sockets", "Lamp, charging" + (s.keeping[0] ? `, ${s.keeping[0].name.toLowerCase().replace(/^upright /, "")}` : "")],
                ["Switches", "switches", "By the entry door"],
              ] as const
            ).map(([t, k, sub]) => (
              <div className="pt" key={k}>
                <div className="row between">
                  <b>{t}</b>
                  {L[k] ? (
                    <span className="tag ok">{L[k]}</span>
                  ) : (
                    <button className="tag tbc" type="button" style={{ border: 0, cursor: "pointer" }} onClick={() => setL({ [k]: k === "sockets" ? s.fixedCounts.sockets || 4 : 1 })}>
                      Qty TBC
                    </button>
                  )}
                </div>
                <small>{sub}</small>
              </div>
            ))}
            <div className="pt">
              <div className="row between">
                <b>Dimmer</b>
                <button className={`tag ${L.dimmer ? "ok" : "line"}`} type="button" style={{ border: L.dimmer ? 0 : undefined, cursor: "pointer" }} onClick={() => setL({ dimmer: !L.dimmer })}>
                  {L.dimmer ? "Included" : "Not included"}
                </button>
              </div>
              <small>For the {lc(L.layers[0]?.name ?? "ceiling light")}</small>
            </div>
            {hasWindow && (
              <div className="pt">
                <div className="row between">
                  <b>Blind power</b>
                  <button className={`toggle${L.blind ? " on" : ""}`} type="button" role="switch" aria-checked={L.blind} aria-label="Include blind power" onClick={() => setL({ blind: !L.blind })} />
                </div>
                <small>Optional · window wall</small>
              </div>
            )}
          </div>
          <section className="panel lav" style={{ marginTop: "24px", padding: "22px 26px" }}>
            <div className="row" style={{ gap: "14px", flexWrap: "nowrap" }}>
              <Ic style={{ color: "#665A85" }}>{p("M13 2 4 14h7l-1 8 9-12h-7z")}</Ic>
              <p className="p" style={{ fontSize: "16px" }}>
                These show the look. Your electrician confirms the standard, circuits, compatible fixtures and exact positions before anything is installed.
              </p>
            </div>
          </section>
          <div className="actions">
            <Back to="S6-Palette" />
            <Go
              className="btn auto"
              to="S7-Summary"
              style={{ marginLeft: "auto" }}
              onClick={() => {
                set((x) => ({ done: Array.from(new Set([...x.done, 7])) }));
                void saveStepDone(s, 7);
              }}
            >
              Finish step 7
              <Ic>{p("M5 12h14M13 6l6 6-6 6")}</Ic>
            </Go>
          </div>
        </div>
        <aside className="rail">
          <div className="rail-card">
            <h2 className="h3">Power by wall</h2>
            <div>
              {powerByWall({ ...s, lighting: L }).map((x) => (
                <div className="wl" key={x.w}>
                  <i>{x.w}</i>
                  {x.what}
                  <span>{x.need}</span>
                </div>
              ))}
            </div>
            <p className="small" style={{ margin: "0" }}>
              Exact positions are set on each wall in the next step.
            </p>
            <hr className="divider" />
            <div className="kv">
              <div>
                <span>Fixtures</span>
                <b>{L.layers.length} lights</b>
              </div>
              <div>
                <span>Finish</span>
                <b>{finishOf(s)}</b>
              </div>
              <div>
                <span>Wiring plan</span>
                <b style={{ color: "#7A4A1E" }}>TBC</b>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </Screen>
  );
}

/** 7.1 · Step 7 summary */
export function Step7Summary() {
  const { s } = useJourney();
  const L = s.lighting;
  const name = (l: NonNullable<JourneyState["lighting"]>["layers"][number]) => (l.decision === "change" && l.change ? l.change : l.name);
  return (
    <StepSummary
      step={7}
      board="S7-Summary"
      sub="Light and power are planned. Next we walk around the room, wall by wall."
      media={
        <div className="lt">
          {(L?.layers ?? []).map((l) => (
            <div key={l.key}>
              <span className="ph">{l.image && <img className="img" src={l.image} alt="" style={{ objectPosition: l.pos }} />}</span>
              {name(l).replace(/^Glass /, "").replace(/^\w/, (c) => c.toUpperCase())}
            </div>
          ))}
        </div>
      }
      decisions={[
        {
          k: "Room lighting",
          v: (
            <>
              {(L?.layers ?? []).map((l, i) => (
                <span key={l.key}>
                  {i ? " · " : ""}
                  <b>{l.key[0].toUpperCase() + l.key.slice(1)}:</b> {lc(name(l))}
                  {l.key === "overall" && L?.dimmer ? " on a dimmer" : ""}
                </span>
              ))}
            </>
          ),
          edit: "S7-Lighting",
        },
        {
          k: "Power",
          v: (
            <>
              Sockets and switches {!L?.sockets || !L?.switches ? <span className="tag tbc">Qty TBC</span> : `(${L.sockets} sockets, ${L.switches} switches)`} · dimmer {L?.dimmer ? "included" : "not included"} · blind power {L?.blind ? "on" : "off"}
            </>
          ),
          edit: "S7-Lighting",
        },
        { k: "Finish", v: `${finishOf(s)} plates and fixtures` },
      ]}
      open={["Wiring plan — your electrician confirms circuits and positions", ...(!L?.sockets ? ["How many sockets, and where"] : [])]}
      soFar={soFar(s, 7)}
      back="S7-Lighting"
      next="S8-Walls"
    />
  );
}

