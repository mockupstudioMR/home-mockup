import { useMemo, useState } from "react";
import type { BuyListItem, BuyListMeasurements } from "./BuyListStep";

/**
 * Editorial "furnishing journey" presentation of the shopping list:
 * hero + measured basis, a build-order layering system with a progress slider,
 * and expandable line items that explain themselves in plain words.
 */

const C = {
  cream: "#FBF7F5",
  creamTop: "#FDF3EE",
  peach: "#F6E7E0",
  ink: "#2F2740",
  inkSoft: "#4A4257",
  plum: "#4A3F5C",
  muted: "#6B6180",
  mutedSoft: "#8A7F95",
  faint: "#9A90A8",
  line: "#EDE3DE",
  lineSoft: "#EDE6E2",
  terracotta: "#A96A4C",
  clay: "#C97F5E",
  blush: "#C9AFA4",
  dark: "#2A2336",
  darkText: "#F7F1ED",
  darkMuted: "#BDB0C4",
  lilac: "#F4EEF9",
} as const;

const serif = "'Instrument Serif', Georgia, serif";

export interface Layer {
  num: number;
  name: string;
  group: string;
  plain: string;
  keywords: string[];
  categories?: string[];
}

/** The build order: cables before plaster, plaster before floor, floor before sofa. */
export const LAYERS: Layer[] = [
  { num: 1, name: "Structure & openings", group: "Shell", plain: "Walls, partitions, doors and windows — the shape of the room is fixed here.", keywords: ["wall", "partition", "drywall", "door", "window", "frame", "stud", "brick"] },
  { num: 2, name: "Electrics & data", group: "Shell", plain: "Cables, sockets, switches and lighting circuits, buried before anything is closed up.", keywords: ["cable", "socket", "switch", "electric", "wiring", "circuit", "conduit"] },
  { num: 3, name: "Plumbing & heating", group: "Shell", plain: "Pipework, radiators and any wet connections.", keywords: ["pipe", "plumb", "radiator", "heating", "water", "drain"] },
  { num: 4, name: "Plaster & substrate", group: "Shell", plain: "Levelling, plasterboard and screed — the flat, clean base every finish needs.", keywords: ["plaster", "screed", "primer", "levelling", "render", "filler"] },
  { num: 5, name: "Flooring", group: "Surfaces", plain: "The single largest surface in the room, and the one everything else sits on.", keywords: ["floor", "parquet", "tile", "vinyl", "laminate", "underlay", "carpet"] },
  { num: 6, name: "Wall finishes", group: "Surfaces", plain: "Paint, wallpaper, panelling or tile on the vertical surfaces.", keywords: ["paint", "wallpaper", "panel", "cladding", "wall finish"] },
  { num: 7, name: "Trims & skirting", group: "Surfaces", plain: "Skirting, architrave and cornice close the gap between floor, wall and ceiling.", keywords: ["skirting", "architrave", "cornice", "trim", "moulding", "beading"] },
  { num: 8, name: "Joinery & built-ins", group: "Surfaces", plain: "Cabinets, wardrobes and shelving fixed to the fabric of the room.", keywords: ["cabinet", "joinery", "built-in", "wardrobe", "shelving", "worktop", "kitchen"] },
  { num: 9, name: "Fixed lighting", group: "Light", plain: "Ceiling lights, spots and tracks wired into the circuits from layer two.", keywords: ["ceiling light", "spot", "track", "downlight", "pendant", "chandelier"] },
  { num: 10, name: "Anchor furniture", group: "Furnishing", plain: "The one or two pieces the room is planned around — sofa, bed, dining table.", keywords: ["sofa", "couch", "bed", "dining table", "sectional", "modular"] },
  { num: 11, name: "Supporting furniture", group: "Furnishing", plain: "Chairs, side tables, sideboards and everything that orbits the anchors.", keywords: ["chair", "armchair", "stool", "side table", "coffee table", "console", "sideboard", "desk", "bench", "dresser", "nightstand"] },
  { num: 12, name: "Storage", group: "Furnishing", plain: "Freestanding storage: shelves, baskets, media units.", keywords: ["shelf", "storage", "basket", "media", "bookcase", "cupboard"] },
  { num: 13, name: "Rugs & floor textiles", group: "Softening", plain: "Rugs zone the plan and take the hardness out of the floor.", keywords: ["rug", "runner", "mat", "carpet tile"] },
  { num: 14, name: "Window dressing", group: "Softening", plain: "Curtains, blinds and sheers — light control and acoustics in one move.", keywords: ["curtain", "blind", "sheer", "drape", "shade", "track", "pole"] },
  { num: 15, name: "Upholstery & cushions", group: "Softening", plain: "Cushions, throws and bedding: the layer that makes the room feel lived in.", keywords: ["cushion", "throw", "pillow", "bedding", "duvet", "upholstery", "boucle"] },
  { num: 16, name: "Decorative lighting", group: "Light", plain: "Table and floor lamps that carry the evening once the ceiling lights go off.", keywords: ["lamp", "floor lamp", "table lamp", "sconce", "candle"] },
  { num: 17, name: "Art & mirrors", group: "Finishing", plain: "Wall pieces and mirrors, hung last so nothing gets moved twice.", keywords: ["art", "mirror", "print", "frame", "poster"] },
  { num: 18, name: "Styling & greenery", group: "Finishing", plain: "Plants, ceramics, books and the small objects that finish the story.", keywords: ["plant", "vase", "ceramic", "book", "tray", "object", "greenery", "planter", "styling"] },
];

const CATEGORY_FALLBACK: Record<string, number> = {
  materials: 5,
  labour: 4,
  furniture: 11,
  lighting: 16,
  textiles: 15,
  decor: 18,
};

const GROUP_META: Record<string, { blurb: string; dot: string }> = {
  Shell: { blurb: "Everything that disappears behind a finish.", dot: "#6E5F80" },
  Surfaces: { blurb: "The big planes: floor, walls, trims, joinery.", dot: "#A3785F" },
  Light: { blurb: "Fixed first, decorative last.", dot: "#C97F5E" },
  Furnishing: { blurb: "Anchors before the pieces that orbit them.", dot: "#4A3F5C" },
  Softening: { blurb: "Textiles turn a finished shell into a room.", dot: "#C9AFA4" },
  Finishing: { blurb: "The last five percent you actually notice.", dot: "#E9CEC1" },
};

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
const euro = (n: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const layerFor = (item: BuyListItem): number => {
  const hay = `${item.name} ${item.spec || ""} ${item.notes || ""}`.toLowerCase();
  let best = 0;
  let bestScore = 0;
  LAYERS.forEach((l) => {
    const score = l.keywords.reduce((s, k) => (hay.includes(k) ? s + k.length : s), 0);
    if (score > bestScore) {
      bestScore = score;
      best = l.num;
    }
  });
  return best || CATEGORY_FALLBACK[item.category] || 18;
};

interface Props {
  summary?: string;
  items: BuyListItem[];
  measurements: BuyListMeasurements;
  roomLabel?: string;
  palette?: string[];
  paletteNote?: string;
  images: Record<string, string>;
  total: number;
  savedAt?: string | null;
  actions?: React.ReactNode;
}

const BuyListJourney = ({
  summary,
  items,
  measurements,
  roomLabel,
  palette = [],
  paletteNote,
  images,
  total,
  savedAt,
  actions,
}: Props) => {
  const [cut, setCut] = useState(18);
  const [openLayer, setOpenLayer] = useState<number | null>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const sections = useMemo(() => {
    const byLayer = new Map<number, BuyListItem[]>();
    items.forEach((it) => {
      const n = layerFor(it);
      const arr = byLayer.get(n) || [];
      arr.push(it);
      byLayer.set(n, arr);
    });
    return LAYERS.filter((l) => byLayer.get(l.num)?.length).map((l) => {
      const rows = byLayer.get(l.num)!;
      return {
        layer: l,
        items: rows,
        subtotal: rows.reduce((s, it) => s + (it.unit_price_eur || 0) * (it.quantity || 0), 0),
      };
    });
  }, [items]);

  const measured = [
    { label: "Floor", value: `${measurements.floorAreaSqm} m²`, note: "usable area" },
    { label: "Perimeter", value: `${measurements.perimeterM} m`, note: "wall run" },
    { label: "Wall area", value: `${measurements.netWallAreaSqm} m²`, note: "minus openings" },
    { label: "Skirting", value: `${measurements.skirtingM} m`, note: "trim length" },
    { label: "Ceiling", value: `${measurements.ceilingHeightM} m`, note: "clear height" },
  ];

  const cutCaption =
    cut === 0
      ? "An empty shell: measured, but nothing in it yet."
      : cut >= 18
        ? "Everything on your list, in place — a finished room."
        : `Built up to layer ${cut}: ${LAYERS[cut - 1].name.toLowerCase()}.`;

  const doneCount = Object.values(done).filter(Boolean).length;

  return (
    <div
      style={{
        background: `linear-gradient(180deg,${C.creamTop} 0%,${C.cream} 340px,${C.cream} 100%)`,
        borderRadius: 24,
        overflow: "hidden",
        color: C.ink,
      }}
    >
      {/* Hero */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "48px 28px 32px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 620 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", color: C.mutedSoft, fontWeight: 600 }}>
              <span style={{ width: 22, height: 1, background: C.blush, display: "inline-block" }} />
              Built from your design &amp; floor plan
            </div>
            <h1 style={{ fontFamily: serif, fontWeight: 400, fontSize: 48, lineHeight: 1.04, letterSpacing: "-0.01em", margin: "18px 0 0", color: C.ink }}>
              Everything your room needs,
              <br />
              <span style={{ fontStyle: "italic", color: C.plum }}>in the order you’ll need it.</span>
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: C.muted, margin: "18px 0 0", maxWidth: "56ch" }}>
              {summary ||
                `We measured ${roomLabel || "your room"}, matched your palette, and turned it into a buying list you can work through step by step. Every line explains itself in plain words.`}
            </p>
          </div>

          {palette.length > 0 && (
            <div style={{ background: "#FFFFFF", border: `1px solid ${C.line}`, borderRadius: 20, padding: "20px 22px", minWidth: 250, boxShadow: "0 1px 2px rgba(47,39,64,.04)" }}>
              <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: C.mutedSoft, fontWeight: 600 }}>Your palette</div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {palette.slice(0, 6).map((hex, i) => (
                  <div key={`${hex}-${i}`} style={{ flex: 1 }}>
                    <div title={hex} style={{ height: 40, borderRadius: 8, border: "1px solid rgba(47,39,64,.08)", background: hex }} />
                  </div>
                ))}
              </div>
              {paletteNote && <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "#7A7089", marginTop: 12 }}>{paletteNote}</div>}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginTop: 36 }}>
          {measured.map((m) => (
            <div key={m.label} style={{ background: C.peach, borderRadius: 14, padding: "16px 18px" }}>
              <div style={{ fontSize: 12.5, color: "#8A6E62", fontWeight: 500 }}>{m.label}</div>
              <div style={{ fontFamily: serif, fontSize: 28, lineHeight: 1.1, marginTop: 6, color: "#3A3049" }}>{m.value}</div>
              <div style={{ fontSize: 11.5, color: "#A08A80", marginTop: 6 }}>{m.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Layering system, dark band */}
      <div style={{ background: C.dark }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 28px 34px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div style={{ maxWidth: 620 }}>
              <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: C.blush, fontWeight: 600 }}>
                How a room gets built — in eighteen moves
              </div>
              <h2 style={{ fontFamily: serif, fontWeight: 400, fontSize: 34, lineHeight: 1.1, margin: "12px 0 0", color: C.darkText }}>
                A room is built in layers,
                <br />
                and the order is not negotiable.
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: C.darkMuted, margin: "12px 0 0" }}>
                Cables before plaster, plaster before floor, floor before sofa, sofa before cushions. Your whole list is ordered by these
                layers — open one to see what it means and what it needs.
              </p>
            </div>

            <div style={{ background: "rgba(247,241,237,.06)", border: "1px solid rgba(233,206,193,.25)", borderRadius: 16, padding: "16px 18px", minWidth: 260 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: C.blush, fontWeight: 600 }}>Build the room</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#E9CEC1" }}>{cut === 0 ? "shell" : `layer ${cut}`}</div>
              </div>
              <input
                type="range"
                min={0}
                max={18}
                step={1}
                value={cut}
                onChange={(e) => setCut(Number(e.target.value))}
                style={{ width: "100%", marginTop: 14, accentColor: C.clay }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8C8098", marginTop: 2 }}>
                <span>empty shell</span>
                <span>finished room</span>
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, color: C.darkMuted, marginTop: 10 }}>{cutCaption}</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "5px 18px", marginTop: 24 }}>
            {LAYERS.map((l) => {
              const section = sections.find((s) => s.layer.num === l.num);
              const active = l.num <= cut;
              return (
                <button
                  key={l.num}
                  type="button"
                  onClick={() => {
                    setCut(l.num);
                    setOpenLayer(l.num);
                    document.getElementById(`layer-${l.num}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "9px 12px",
                    borderRadius: 11,
                    cursor: "pointer",
                    textAlign: "left",
                    background: active ? "rgba(233,206,193,.09)" : "transparent",
                    border: `1px solid ${active ? "rgba(233,206,193,.22)" : "transparent"}`,
                  }}
                >
                  <span style={{ width: 4, height: 26, borderRadius: 2, background: GROUP_META[l.group]?.dot || C.blush, opacity: active ? 1 : 0.35, flex: "none" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: active ? "#E9CEC1" : "#6C6180", width: 20, flex: "none" }}>
                    {String(l.num).padStart(2, "0")}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 500, color: active ? C.darkText : "#8C8098", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {l.name}
                  </span>
                  <span style={{ fontSize: 11.5, color: section ? "#C9AFA4" : "#5E5470", whiteSpace: "nowrap" }}>
                    {section ? `${section.items.length} item${section.items.length > 1 ? "s" : ""}` : "—"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Layer sections */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "12px 28px 40px" }}>
        {sections.map((s, idx) => {
          const showGroup = idx === 0 || sections[idx - 1].layer.group !== s.layer.group;
          const dim = s.layer.num <= cut ? 1 : 0.45;
          const isOpen = openLayer === s.layer.num;
          return (
            <div key={s.layer.num} id={`layer-${s.layer.num}`} style={{ paddingTop: 32 }}>
              {showGroup && (
                <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap", padding: "18px 0 8px" }}>
                  <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: C.terracotta, fontWeight: 600 }}>{s.layer.group}</div>
                  <div style={{ fontSize: 13.5, color: C.mutedSoft }}>{GROUP_META[s.layer.group]?.blurb}</div>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, borderBottom: `1px solid ${C.line}`, paddingBottom: 14, opacity: dim }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                  <span style={{ fontFamily: serif, fontSize: 22, color: GROUP_META[s.layer.group]?.dot }}>{String(s.layer.num).padStart(2, "0")}</span>
                  <div>
                    <div style={{ fontFamily: serif, fontSize: 28, lineHeight: 1.1, color: C.ink }}>{s.layer.name}</div>
                    <div style={{ fontSize: 14.5, color: C.muted, marginTop: 4, maxWidth: "62ch" }}>{s.layer.plain}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 9, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setOpenLayer(isOpen ? null : s.layer.num)}
                        style={{ fontSize: 12.5, fontWeight: 600, color: C.plum, background: "#F1ECF6", padding: "5px 11px", borderRadius: 999, cursor: "pointer", border: "none" }}
                      >
                        {isOpen ? "Hide the detail ↑" : "Why it sits here ↓"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCut(s.layer.num)}
                        style={{ fontSize: 12.5, color: s.layer.num <= cut ? C.terracotta : C.faint, cursor: "pointer", background: "none", border: "none" }}
                      >
                        {s.layer.num <= cut ? "in place" : "not built yet"}
                      </button>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <div style={{ fontSize: 12, color: C.faint }}>
                    {s.items.length} line{s.items.length > 1 ? "s" : ""}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#3A3049", marginTop: 2 }}>{s.subtotal ? euro(s.subtotal) : "—"}</div>
                </div>
              </div>

              {isOpen && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, background: "#FFFFFF", border: `1px solid ${C.lineSoft}`, borderRadius: 16, padding: "20px 22px", marginTop: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: C.mutedSoft, fontWeight: 600 }}>Why it sits here</div>
                    <p style={{ fontSize: 14.5, lineHeight: 1.65, color: C.inkSoft, margin: "8px 0 0" }}>{s.layer.plain}</p>
                  </div>
                  <div style={{ background: C.lilac, borderRadius: 12, padding: "14px 16px", alignSelf: "start" }}>
                    <div style={{ fontSize: 11, letterSpacing: ".12em", textTransform: "uppercase", color: "#7A6B90", fontWeight: 600 }}>Timing</div>
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: C.plum, marginTop: 6 }}>
                      Order everything in this layer before you start layer {Math.min(s.layer.num + 1, 18)} — reversing it means paying twice.
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16, opacity: dim }}>
                {s.items.map((it, i) => {
                  const key = `${s.layer.num}-${i}-${it.name}`;
                  const expanded = openItem === key;
                  const checked = !!done[key];
                  return (
                    <div key={key} style={{ background: "#FFFFFF", border: `1px solid ${C.lineSoft}`, borderRadius: 16, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "16px 18px", cursor: "pointer" }} onClick={() => setOpenItem(expanded ? null : key)}>
                        <button
                          type="button"
                          aria-label={checked ? "Mark as not bought" : "Mark as bought"}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDone((d) => ({ ...d, [key]: !d[key] }));
                          }}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 7,
                            border: `1.5px solid ${checked ? C.clay : "#DCD2D8"}`,
                            background: checked ? C.clay : "#FFF",
                            flex: "none",
                            marginTop: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#FFF",
                            fontSize: 13,
                            lineHeight: 1,
                            cursor: "pointer",
                          }}
                        >
                          {checked ? "✓" : ""}
                        </button>

                        {images[it.name] && (
                          <img
                            src={images[it.name]}
                            alt={it.name}
                            loading="lazy"
                            style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flex: "none", border: `1px solid ${C.line}` }}
                          />
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 17, fontWeight: 600, color: C.ink, textDecoration: checked ? "line-through" : "none" }}>{it.name}</div>
                          {it.spec && <div style={{ fontSize: 14, color: "#7A7089", marginTop: 3 }}>{it.spec}</div>}
                          <div style={{ fontSize: 13, color: "#A08A80", marginTop: 7 }}>{it.basis}</div>
                        </div>

                        <div style={{ textAlign: "right", whiteSpace: "nowrap", flex: "none" }}>
                          <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>
                            {fmt(it.quantity)} {it.unit}
                          </div>
                          <div style={{ fontSize: 13, color: C.mutedSoft, marginTop: 3 }}>
                            {it.unit_price_eur ? `${euro(it.unit_price_eur)} / ${it.unit}` : "price on request"}
                          </div>
                        </div>
                        <div style={{ flex: "none", fontSize: 13, color: "#B3A6AE", marginTop: 4, width: 14, textAlign: "center" }}>{expanded ? "↑" : "↓"}</div>
                      </div>

                      {expanded && (
                        <div style={{ borderTop: "1px solid #F1E9E5", background: "#FDFAF8", padding: "20px 18px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
                          <div>
                            <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: C.mutedSoft, fontWeight: 600 }}>In plain words</div>
                            <p style={{ fontSize: 14.5, lineHeight: 1.65, color: C.inkSoft, margin: "8px 0 0" }}>
                              {it.notes || `${it.name} belongs to layer ${s.layer.num}, ${s.layer.name.toLowerCase()}. ${s.layer.plain}`}
                            </p>
                            {it.size_constraint && (
                              <>
                                <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: C.mutedSoft, fontWeight: 600, marginTop: 18 }}>
                                  Do not exceed
                                </div>
                                <p style={{ fontSize: 14.5, lineHeight: 1.65, color: C.terracotta, margin: "8px 0 0", fontWeight: 500 }}>{it.size_constraint}</p>
                              </>
                            )}
                          </div>
                          <div>
                            <div style={{ background: C.lilac, borderRadius: 12, padding: "12px 14px" }}>
                              <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: "#7A6B90", fontWeight: 600 }}>How we got the number</div>
                              <div style={{ fontSize: 14, color: C.plum, marginTop: 6, fontVariantNumeric: "tabular-nums" }}>
                                {fmt(it.quantity)} {it.unit}
                                {it.unit_price_eur ? ` × ${euro(it.unit_price_eur)} = ${euro(it.unit_price_eur * it.quantity)}` : ""}
                              </div>
                              <div style={{ fontSize: 13, color: "#7A7089", marginTop: 6, lineHeight: 1.55 }}>{it.basis}</div>
                            </div>
                            <a
                              href={`https://www.bing.com/images/search?q=${encodeURIComponent(`${it.name} ${it.spec || ""} buy`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ display: "inline-block", marginTop: 14, fontSize: 13.5, fontWeight: 600, color: "#FFF", background: C.plum, padding: "9px 14px", borderRadius: 10, textDecoration: "none" }}
                            >
                              Find this piece →
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer bar */}
      <div style={{ borderTop: `1px solid ${C.line}`, background: "#FFFFFF" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", color: C.mutedSoft, fontWeight: 600 }}>Estimated total</div>
            <div style={{ fontFamily: serif, fontSize: 34, lineHeight: 1.1, color: C.ink }}>{euro(total)}</div>
            <div style={{ fontSize: 12, color: C.faint, marginTop: 2 }}>
              {doneCount > 0 ? `${doneCount} of ${items.length} lines ticked off · ` : ""}
              {savedAt ? `saved ${new Date(savedAt).toLocaleString("de-DE")}` : "not saved yet"}
            </div>
          </div>
          {actions}
        </div>
      </div>
    </div>
  );
};

export default BuyListJourney;
