/** E1 · Styles, palettes & compatibility rules */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Ic } from "@/journey/icons";
import { facetLabel, useTerms, type Term } from "@/components/admin/library/shared";
import { A, AdminShell, Crumb } from "../ui";
import { Shot } from "./Schemes";

const POS_ROLE = ["Main", "Second", "Base", "Accent"];
const REL: Record<string, [string, string]> = { works: ["go", "Goes with"], only: ["on", "Only with"], avoid: ["av", "Avoid with"], neutral: ["", "Neutral"] };
const strengthWord = (n: number) => (n >= 4 ? "Strong" : n >= 3 ? "Medium" : "Weak");

type RefImg = { item: string; path: string | null; url: string | null };

function useStyleData() {
  return useQuery({
    queryKey: ["admin-styles"],
    queryFn: async () => {
      const [{ data: defs }, { data: palettes }, { data: schemes }, { data: pieces }] = await Promise.all([
        supabase.from("style_definitions").select("*"),
        supabase.from("palettes").select("*, palette_colors(position, color_id, role)").order("created_at"),
        supabase.from("furniture_schemes").select("id, style_id, color_id, material_id, furniture_scheme_tags(term_id)").eq("status", "active").limit(10000),
        supabase.from("detected_pieces").select("style_id, item_id, ingest_items(storage_path, source_url)").not("style_id", "is", null).neq("status", "rejected").limit(5000),
      ]);
      const counts = new Map<string, number>();
      const words = new Map<string, Map<string, number>>();
      for (const s of (schemes ?? []) as { style_id: string | null; color_id: string | null; material_id: string | null; furniture_scheme_tags: { term_id: string }[] }[]) {
        if (!s.style_id) continue;
        counts.set(s.style_id, (counts.get(s.style_id) ?? 0) + 1);
        const w = words.get(s.style_id) ?? new Map<string, number>();
        for (const id of [s.color_id, s.material_id, ...s.furniture_scheme_tags.map((x) => x.term_id)]) if (id) w.set(id, (w.get(id) ?? 0) + 1);
        words.set(s.style_id, w);
      }
      const refs = new Map<string, RefImg[]>();
      for (const p of (pieces ?? []) as { style_id: string; item_id: string; ingest_items: { storage_path: string | null; source_url: string | null } | null }[]) {
        const r = refs.get(p.style_id) ?? [];
        if (r.length < 4 && !r.some((x) => x.item === p.item_id)) r.push({ item: p.item_id, path: p.ingest_items?.storage_path ?? null, url: p.ingest_items?.source_url ?? null });
        refs.set(p.style_id, r);
      }
      return { defs: defs ?? [], palettes: palettes ?? [], counts, words, refs };
    },
  });
}

export function Styles() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: terms } = useTerms();
  const list = useMemo(() => terms?.list ?? [], [terms]);
  const t = (id: string | null | undefined) => (id ? terms?.byId.get(id) : undefined);
  const { data } = useStyleData();
  const styles = useMemo(() => list.filter((x) => x.facet === "style" && x.status === "active").sort((a, b) => (data?.counts.get(b.id) ?? 0) - (data?.counts.get(a.id) ?? 0)), [list, data]);
  const [styleId, setStyleId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newStyle, setNewStyle] = useState("");
  useEffect(() => {
    if (!styleId && data && styles.length) setStyleId(styles[0].id);
  }, [styles, styleId, data]);
  const def = data?.defs.find((d) => d.style_id === styleId);
  const [desc, setDesc] = useState("");
  const [prompt, setPrompt] = useState("");
  useEffect(() => {
    setDesc(def?.description ?? "");
    setPrompt(def?.prompt_fragment ?? "");
  }, [def, styleId]);
  const palCount = (id: string) => (data?.palettes ?? []).filter((p) => p.style_id === id).length;
  const cur = t(styleId);
  const top = (facets: string[], n = 4) =>
    [...(data?.words.get(styleId ?? "")?.entries() ?? [])]
      .map(([id, c]) => [t(id), c] as [Term | undefined, number])
      .filter(([x]) => x && facets.includes(x.facet))
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([x]) => x!);

  const save = useMutation({
    mutationFn: async () => {
      if (!styleId) return;
      const { error } = await supabase.from("style_definitions").upsert({ style_id: styleId, description: desc || null, prompt_fragment: prompt || null, mood_keywords: def?.mood_keywords ?? [], default_palette_id: def?.default_palette_id ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-styles"] });
      toast({ title: "Style saved" });
    },
    onError: (e: Error) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });
  const addStyle = useMutation({
    mutationFn: async () => {
      const label = newStyle.trim();
      if (!label) throw new Error("Give the style a name.");
      const { data: row, error } = await supabase.from("taxonomy_terms").insert({ facet: "style", label, slug: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"), status: "active" }).select("id").single();
      if (error) throw error;
      return row.id;
    },
    onSuccess: (id) => {
      setAdding(false);
      setNewStyle("");
      setStyleId(id);
      qc.invalidateQueries({ queryKey: ["admin-terms"] });
      toast({ title: "Style added" });
    },
    onError: (e: Error) => toast({ title: "Could not add the style", description: e.message.includes("duplicate") ? "That style already exists." : e.message, variant: "destructive" }),
  });

  const refs = data?.refs.get(styleId ?? "") ?? [];
  return (
    <AdminShell board="E1-Styles" section="styles">
      <Crumb items={["Curate"]} />
      <h1 className="ah1">Styles, palettes & rules</h1>
      <p className="asub">What each style means, which colours belong together, and the pairings the matching engine should prefer or avoid.</p>
      <section className="sec">
        <div className="sec-h">
          <h2>Styles</h2>
          <button className="btn soft sm" type="button" onClick={() => setAdding((a) => !a)}>
            Add style
          </button>
        </div>
        {adding && (
          <div className="row" style={{ gap: "10px", marginBottom: "16px" }}>
            <input className="input" style={{ flex: "1 1 260px" }} placeholder="Style name, e.g. Japandi" value={newStyle} onChange={(e) => setNewStyle(e.target.value)} aria-label="New style name" />
            <button className="btn sm" type="button" disabled={addStyle.isPending} onClick={() => addStyle.mutate()}>
              Add
            </button>
          </div>
        )}
        <div className="stl">
          <div className="stl-list">
            {styles.map((s) => {
              const r = data?.refs.get(s.id)?.[0];
              const n = data?.counts.get(s.id) ?? 0, p = palCount(s.id);
              return (
                <button key={s.id} type="button" className={`stl-it${styleId === s.id ? " on" : ""}`} onClick={() => setStyleId(s.id)} style={{ textAlign: "left", font: "inherit" }}>
                  {r ? <Shot path={r.path} url={r.url} alt="" /> : <span aria-hidden="true" style={{ width: 52, height: 52, borderRadius: 12, flex: "none", background: s.hex ?? "#EFE9F3" }} />}
                  <span>
                    {s.label}
                    <small>
                      {n} scheme{n === 1 ? "" : "s"} · {p} palette{p === 1 ? "" : "s"}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>
          {cur && (
            <div className="stl-det panel" style={{ padding: "28px" }}>
              <div className="row between">
                <h3 className="h3">{cur.label}</h3>
                <span className="tag line">style_definitions</span>
              </div>
              <div className="field" style={{ marginTop: "14px" }}>
                <label htmlFor="sd">Description shown to users</label>
                <textarea id="sd" className="textarea" style={{ minHeight: "88px" }} value={desc} onChange={(e) => setDesc(e.target.value)} />
              </div>
              <div className="tt" style={{ marginTop: "18px" }}>
                <span className="k">Colours</span>
                <span className="scs">
                  {top(["color"]).map((x) => (
                    <span className="sc" key={x.id}>
                      {x.hex && <span className="dot" style={{ background: x.hex }} />}
                      {x.label}
                    </span>
                  ))}
                  {!top(["color"]).length && <span className="small">From scans, once schemes use this style</span>}
                </span>
                <span className="k">Materials</span>
                <span className="scs">
                  {top(["material", "finish"]).map((x) => (
                    <span className="sc" key={x.id}>
                      {x.label}
                    </span>
                  ))}
                </span>
                <span className="k">Shapes</span>
                <span className="scs">
                  {top(["shape", "pattern"], 3).map((x) => (
                    <span className="sc" key={x.id}>
                      {x.label}
                    </span>
                  ))}
                </span>
              </div>
              <div style={{ marginTop: "18px" }}>
                <span className="lbl">Reference images · from scans</span>
                <div className="refs" style={{ marginTop: "8px" }}>
                  {refs.map((r) => (
                    <Shot key={r.item} path={r.path} url={r.url} alt={`${cur.label} reference`} />
                  ))}
                </div>
                {!refs.length && (
                  <p className="small">
                    No scans tagged with this style yet. <A to="scan">Scan a design</A>
                  </p>
                )}
              </div>
              <details style={{ marginTop: "18px" }}>
                <summary className="small" style={{ cursor: "pointer", fontWeight: 600 }}>
                  Words added to design generation{prompt ? "" : " · not set"}
                </summary>
                <div className="field" style={{ marginTop: "10px" }}>
                  <label htmlFor="sp">Added to every design prompt for this style</label>
                  <textarea id="sp" className="textarea" style={{ minHeight: "60px" }} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. saturated jewel tones, curved silhouettes, brass details" />
                </div>
              </details>
              <div className="row" style={{ marginTop: "18px", justifyContent: "flex-end" }}>
                <button className="btn sm" type="button" disabled={save.isPending || (desc === (def?.description ?? "") && prompt === (def?.prompt_fragment ?? ""))} onClick={() => save.mutate()}>
                  Save style
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      <Palettes terms={list} styles={styles} palettes={data?.palettes ?? []} />
      <Rules terms={list} />
    </AdminShell>
  );
}

type Pal = { id: string; name: string; style_id: string | null; palette_colors: { position: number; color_id: string; role: string | null }[] };

function Palettes({ terms, styles, palettes }: { terms: Term[]; styles: Term[]; palettes: unknown[] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const byId = useMemo(() => new Map(terms.map((x) => [x.id, x])), [terms]);
  const colors = terms.filter((x) => x.facet === "color" && x.status === "active");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [style, setStyle] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const create = useMutation({
    mutationFn: async () => {
      if (!name.trim() || picked.length < 2) throw new Error("Name it and pick at least two colours.");
      const { data: p, error } = await supabase.from("palettes").insert({ name: name.trim(), style_id: style || null }).select("id").single();
      if (error) throw error;
      const roles = ["main", "neutral", "wood", "accent"];
      const { error: e2 } = await supabase.from("palette_colors").insert(picked.map((color_id, i) => ({ palette_id: p.id, position: i + 1, color_id, role: i === picked.length - 1 ? "accent" : roles[i] ?? "neutral" })));
      if (e2) throw e2;
    },
    onSuccess: () => {
      setOpen(false);
      setName("");
      setPicked([]);
      qc.invalidateQueries({ queryKey: ["admin-styles"] });
      toast({ title: "Palette saved" });
    },
    onError: (e: Error) => toast({ title: "Could not save the palette", description: e.message, variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("palettes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-styles"] }),
  });
  return (
    <section className="sec">
      <div className="sec-h">
        <h2>Palettes</h2>
        <button className="btn soft sm" type="button" onClick={() => setOpen((o) => !o)}>
          New palette
        </button>
      </div>
      {open && (
        <div className="rail-card" style={{ marginBottom: "16px" }}>
          <div className="row" style={{ gap: "10px", flexWrap: "wrap" }}>
            <input className="input" style={{ flex: "1 1 220px" }} placeholder="Palette name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Palette name" />
            <select className="select" style={{ flex: "1 1 200px" }} value={style} onChange={(e) => setStyle(e.target.value)} aria-label="Style">
              <option value="">No style</option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <span className="lbl">Colours in order: main, second, base, accent</span>
          <div className="scs">
            {colors.map((c) => {
              const i = picked.indexOf(c.id);
              return (
                <button key={c.id} type="button" className={`sc${i >= 0 ? " on" : ""}`} aria-pressed={i >= 0} onClick={() => setPicked((p) => (i >= 0 ? p.filter((x) => x !== c.id) : [...p, c.id].slice(0, 6)))}>
                  {c.hex && <span className="dot" style={{ background: c.hex }} />}
                  {i >= 0 ? `${i + 1}. ` : ""}
                  {c.label}
                </button>
              );
            })}
          </div>
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn sm" type="button" disabled={create.isPending} onClick={() => create.mutate()}>
              Save palette
            </button>
          </div>
        </div>
      )}
      <div className="pals">
        {(palettes as Pal[]).map((p) => {
          const cols = [...p.palette_colors].sort((a, b) => a.position - b.position);
          return (
            <div className="pal-c" key={p.id}>
              <div className="row between">
                <b>{p.name}</b>
                {p.style_id ? <span className="tag">{byId.get(p.style_id)?.label}</span> : <button className="link-btn" type="button" onClick={() => remove.mutate(p.id)} aria-label={`Delete ${p.name}`}>Delete</button>}
              </div>
              <div className="bars" aria-hidden="true">
                {cols.map((c, i) => (
                  <i key={c.color_id} style={{ flex: String(Math.max(1, 4 - i)), background: byId.get(c.color_id)?.hex ?? "#ccc" }} />
                ))}
              </div>
              <div className="roles">
                {cols.map((c, i) => (
                  <span key={c.color_id}>
                    {i ? "· " : ""}
                    {POS_ROLE[i] ?? "Extra"} · {byId.get(c.color_id)?.label.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        {!palettes.length && <p className="mut">No palettes yet.</p>}
      </div>
    </section>
  );
}

function Rules({ terms }: { terms: Term[] }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const byId = useMemo(() => new Map(terms.map((x) => [x.id, x])), [terms]);
  const pickable = terms.filter((x) => x.status === "active" && ["color", "style", "material", "finish", "shape", "pattern"].includes(x.facet));
  const [open, setOpen] = useState(false);
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [verdict, setVerdict] = useState("works");
  const [strength, setStrength] = useState("3");
  const { data } = useQuery({
    queryKey: ["compat-rules"],
    queryFn: async () => {
      const [{ data: rules }, { data: pairs }] = await Promise.all([
        supabase.from("compatibility_rules").select("*").order("strength", { ascending: false }),
        supabase.from("mv_term_pair_scores").select("*").order("combinations", { ascending: false }).limit(300),
      ]);
      return { rules: rules ?? [], pairs: pairs ?? [] };
    },
  });
  const ev = (x: string, y: string) => data?.pairs.find((p) => (p.term_a === x && p.term_b === y) || (p.term_a === y && p.term_b === x));
  const evidence = (x: string, y: string, source: string) => {
    const e = ev(x, y);
    if (!e || !Number(e.combinations)) return `Not enough data yet${source === "expert" ? " · rule by admin" : ""}`;
    const pos = Number(e.positive ?? 0), neg = Number(e.negative ?? 0);
    return neg ? `${pos} kept · ${neg} changed` : `Seen together in ${pos || e.combinations} kept designs`;
  };
  const ruleSet = new Set((data?.rules ?? []).map((r) => `${r.term_a_id}|${r.term_b_id}`));
  const suggestion = (data?.pairs ?? []).find((p) => p.term_a && p.term_b && Number(p.positive ?? 0) >= 5 && !Number(p.negative ?? 0) && !ruleSet.has(`${p.term_a}|${p.term_b}`) && byId.get(p.term_a) && byId.get(p.term_b));

  // "Only with" rules are grouped by their subject word (the non-style side).
  const rows = useMemo(() => {
    const out: { key: string; when: string[]; rel: string; with: string[]; strength: number; data: string; ids: string[] }[] = [];
    const only = new Map<string, (typeof out)[number]>();
    for (const r of data?.rules ?? []) {
      const ta = byId.get(r.term_a_id), tb = byId.get(r.term_b_id);
      if (r.verdict === "only") {
        const [subj, obj] = ta?.facet === "style" ? [r.term_b_id, r.term_a_id] : [r.term_a_id, r.term_b_id];
        const g = only.get(subj);
        if (g) {
          g.with.push(obj);
          g.ids.push(r.id);
        } else {
          const row = { key: r.id, when: [subj], rel: "only", with: [obj], strength: r.strength, data: r.reason || "Rarely kept outside these styles", ids: [r.id] };
          only.set(subj, row);
          out.push(row);
        }
        continue;
      }
      out.push({ key: r.id, when: [r.term_a_id], rel: r.verdict, with: [r.term_b_id], strength: r.strength, data: evidence(r.term_a_id, r.term_b_id, r.source), ids: [r.id] });
      void tb;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, byId]);

  const add = useMutation({
    mutationFn: async (r?: { a: string; b: string; verdict: string; reason: string; source: "learned" | "expert" }) => {
      const x = r?.a ?? a, y = r?.b ?? b;
      if (!x || !y || x === y) throw new Error("Pick two different words.");
      const [lo, hi] = x < y ? [x, y] : [y, x];
      const { error } = await supabase.from("compatibility_rules").insert({ term_a_id: lo, term_b_id: hi, verdict: r?.verdict ?? verdict, strength: Number(strength), reason: r?.reason ?? null, source: r?.source ?? "expert" });
      if (error) throw error;
    },
    onSuccess: () => {
      setA("");
      setB("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["compat-rules"] });
      toast({ title: "Rule added" });
    },
    onError: (e: Error) => toast({ title: "Could not add the rule", description: e.message.includes("duplicate") ? "A rule for this pair already exists." : e.message, variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("compatibility_rules").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compat-rules"] }),
  });
  const sel = (v: string, set: (s: string) => void, label: string) => (
    <select className="select" style={{ flex: "1 1 200px" }} value={v} onChange={(e) => set(e.target.value)} aria-label={label}>
      <option value="">{label}</option>
      {pickable.map((x) => (
        <option key={x.id} value={x.id}>
          {facetLabel[x.facet]} · {x.label}
        </option>
      ))}
    </select>
  );
  const names = (ids: string[]) => ids.map((id) => byId.get(id)?.label ?? "—").join(", ");

  return (
    <section className="sec">
      <div className="sec-h">
        <h2>Compatibility rules</h2>
        <button className="btn soft sm" type="button" onClick={() => setOpen((o) => !o)}>
          Add rule
        </button>
      </div>
      {open && (
        <div className="row" style={{ gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
          {sel(a, setA, "When…")}
          <select className="select" style={{ flex: "0 1 160px" }} value={verdict} onChange={(e) => setVerdict(e.target.value)} aria-label="Rule">
            <option value="works">Goes with</option>
            <option value="only">Only with</option>
            <option value="avoid">Avoid with</option>
            <option value="neutral">Neutral</option>
          </select>
          {sel(b, setB, "With…")}
          <select className="select" style={{ flex: "0 1 130px" }} value={strength} onChange={(e) => setStrength(e.target.value)} aria-label="Strength">
            <option value="5">Strong</option>
            <option value="3">Medium</option>
            <option value="1">Weak</option>
          </select>
          <button className="btn sm" type="button" disabled={add.isPending} onClick={() => add.mutate(undefined)}>
            Add
          </button>
        </div>
      )}
      <div className="tbl-box">
        <table className="tbl">
          <thead>
            <tr>
              <th>When</th>
              <th>Rule</th>
              <th>With</th>
              <th>Strength</th>
              <th>What the data says</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>
                  <span className="sc">{names(r.when)}</span>
                </td>
                <td>
                  <span className={`rel ${REL[r.rel]?.[0] ?? ""}`}>{REL[r.rel]?.[1] ?? r.rel}</span>
                </td>
                <td>
                  <span className="sc">{names(r.with)}</span>
                </td>
                <td>{strengthWord(r.strength)}</td>
                <td className="mut">{r.data}</td>
                <td>
                  <button className="link-btn" type="button" onClick={() => remove.mutate(r.ids)} aria-label="Remove rule">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {data && !rows.length && (
              <tr>
                <td colSpan={6} className="mut">
                  No rules yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {suggestion && (
        <section className="panel lav" style={{ marginTop: "16px", padding: "20px 24px" }}>
          <div className="row" style={{ gap: "14px", flexWrap: "nowrap" }}>
            <Ic style={{ color: "#665A85" }}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 8h.01" />
            </Ic>
            <p className="p" style={{ fontSize: "15px" }}>
              Suggested from the data:{" "}
              <b>
                {byId.get(suggestion.term_a!)?.label} goes with {byId.get(suggestion.term_b!)?.label.toLowerCase()}
              </b>{" "}
              (kept together {suggestion.positive} times, never changed).{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  add.mutate({ a: suggestion.term_a!, b: suggestion.term_b!, verdict: "works", reason: "suggested from combinations", source: "learned" });
                }}
              >
                Add as rule
              </a>
            </p>
          </div>
        </section>
      )}
    </section>
  );
}
