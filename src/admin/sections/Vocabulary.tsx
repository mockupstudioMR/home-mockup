/** C1 · Vocabulary */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { I, Ic } from "@/journey/icons";
import { facetLabel, slugify, useTerms, type Facet, type Term } from "@/components/admin/library/shared";
import { AdminShell, Crumb } from "../ui";

type Tab = "category" | "color" | "style" | "material" | "tags" | "room_type" | "proposed";
const TABS: [Tab, string][] = [["category", "Category"], ["color", "Colour"], ["style", "Style"], ["material", "Material"], ["tags", "Tags"], ["room_type", "Room type"]];
const TAG_FACETS: Facet[] = ["finish", "shape", "pattern", "mood"];
const facetsOf = (t: Tab): Facet[] => (t === "tags" ? TAG_FACETS : t === "proposed" ? [] : [t as Facet]);
const plural: Record<string, string> = { category: "categories", color: "colours", style: "styles", material: "materials", tags: "tags", room_type: "room types" };

/** The active term a proposed word is most likely the same as. */
export function closestTerm(word: Term, list: Term[]) {
  const w = word.label.toLowerCase();
  const pool = list.filter((x) => x.facet === word.facet && x.status === "active");
  const words = w.split(/[\s-]+/);
  let best: Term | undefined, score = 0;
  for (const t of pool) {
    const l = t.label.toLowerCase();
    let s = 0;
    if (t.synonyms.some((y) => y.toLowerCase() === w)) s += 10;
    for (const x of words) if (x.length > 2 && l.includes(x)) s += 3;
    if (l.split(/[\s-]+/).some((x) => x.length > 2 && w.includes(x))) s += 2;
    if (s > score) {
      score = s;
      best = t;
    }
  }
  return best;
}

function useUsage() {
  return useQuery({
    queryKey: ["term-usage"],
    queryFn: async () => {
      const [{ data: schemes }, { data: links }, { data: rules }, { data: pieces }] = await Promise.all([
        supabase.from("furniture_schemes").select("id, category_id, color_id, style_id, material_id").neq("status", "retired").limit(10000),
        supabase.from("product_scheme_links").select("scheme_id").limit(20000),
        supabase.from("compatibility_rules").select("term_a_id, term_b_id").limit(5000),
        supabase.from("detected_pieces").select("category_id, color_id, style_id, material_id, item_id, ingest_items(batch_id)").limit(10000),
      ]);
      const sc = new Map<string, number>(), pr = new Map<string, number>(), ru = new Map<string, number>();
      const productsOf = new Map<string, number>();
      for (const l of links ?? []) productsOf.set(l.scheme_id, (productsOf.get(l.scheme_id) ?? 0) + 1);
      for (const s of schemes ?? [])
        for (const id of [s.category_id, s.color_id, s.style_id, s.material_id]) {
          if (!id) continue;
          sc.set(id, (sc.get(id) ?? 0) + 1);
          pr.set(id, (pr.get(id) ?? 0) + (productsOf.get(s.id) ?? 0));
        }
      for (const r of rules ?? []) for (const id of [r.term_a_id, r.term_b_id]) ru.set(id, (ru.get(id) ?? 0) + 1);
      const seen = new Map<string, { n: number; batches: Set<string> }>();
      for (const pc of pieces ?? [])
        for (const id of [pc.category_id, pc.color_id, pc.style_id, pc.material_id]) {
          if (!id) continue;
          const e = seen.get(id) ?? { n: 0, batches: new Set<string>() };
          e.n++;
          const b = (pc.ingest_items as { batch_id?: string } | null)?.batch_id;
          if (b) e.batches.add(b);
          seen.set(id, e);
        }
      return { schemes: sc, products: pr, rules: ru, seen };
    },
  });
}

export function Vocabulary() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [params] = useSearchParams();
  const { data: terms } = useTerms();
  const { data: usage } = useUsage();
  const list = useMemo(() => terms?.list ?? [], [terms]);
  const [tab, setTab] = useState<Tab>("category");
  const [filter, setFilter] = useState(params.get("q") ?? "");
  const [selId, setSelId] = useState<string | null>(params.get("term"));
  const [draft, setDraft] = useState<{ label: string; parent: string; hex: string; synonyms: string[] } | null>(null);
  const [newSyn, setNewSyn] = useState<string | null>(null);
  const [mergeTo, setMergeTo] = useState<string | null>(null);
  const [mapFor, setMapFor] = useState<Record<string, string>>({});
  const sel = selId ? terms?.byId.get(selId) : undefined;
  const proposed = list.filter((t) => t.status === "proposed");

  // A ?term= link opens on that term's tab.
  useEffect(() => {
    if (!sel) return;
    setTab(TAG_FACETS.includes(sel.facet) ? "tags" : (sel.facet as Tab));
    setDraft({ label: sel.label, parent: sel.parent_id ?? "", hex: sel.hex ?? "", synonyms: sel.synonyms });
    setMergeTo(null);
  }, [sel]);
  // Search from the top bar: open the first match.
  useEffect(() => {
    const q = params.get("q");
    if (!q || !list.length || selId) return;
    const hit = list.find((t) => t.label.toLowerCase().includes(q.toLowerCase()) && t.status !== "proposed");
    if (hit) setSelId(hit.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  const facetTerms = list.filter((t) => facetsOf(tab).includes(t.facet) && t.status !== "proposed" && (!filter || t.label.toLowerCase().includes(filter.toLowerCase()) || t.synonyms.some((y) => y.toLowerCase().includes(filter.toLowerCase()))));
  // Branches stay folded except the one holding the selected term (or all, while filtering).
  const [open, setOpen] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!selId) return;
    const up = new Set<string>();
    let cur = list.find((t) => t.id === selId);
    while (cur) {
      up.add(cur.id);
      cur = cur.parent_id ? list.find((t) => t.id === cur!.parent_id) : undefined;
    }
    setOpen((o) => new Set([...o, ...up]));
  }, [selId, list]);
  const kids = (id: string) => facetTerms.filter((c) => c.parent_id === id);
  const tree = useMemo(() => {
    const roots = facetTerms.filter((t) => !t.parent_id || !facetTerms.some((x) => x.id === t.parent_id));
    const out: { term: Term; depth: number; hasKids: boolean }[] = [];
    const walk = (t: Term, d: number) => {
      const ch = facetTerms.filter((c) => c.parent_id === t.id);
      out.push({ term: t, depth: d, hasKids: ch.length > 0 });
      if (filter || open.has(t.id)) ch.forEach((c) => walk(c, Math.min(d + 1, 2)));
    };
    roots.forEach((r) => walk(r, 0));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facetTerms, open, filter]);
  const own = (id: string) => (usage?.schemes.get(id) ?? 0) + (usage?.products.get(id) ?? 0);
  /** A branch counts its own uses and every term under it. */
  const uses = (id: string): number => own(id) + kids(id).reduce((a, c) => a + uses(c.id), 0);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-terms"] });
    qc.invalidateQueries({ queryKey: ["term-usage"] });
    qc.invalidateQueries({ queryKey: ["admin-counts"] });
  };
  const fail = (title: string) => (e: Error) => toast({ title, description: e.message, variant: "destructive" });
  const save = useMutation({
    mutationFn: async () => {
      if (!sel || !draft) return;
      const { error } = await supabase
        .from("taxonomy_terms")
        .update({ label: draft.label.trim(), parent_id: draft.parent || null, hex: sel.facet === "color" && /^#[0-9a-f]{6}$/i.test(draft.hex) ? draft.hex : sel.hex, synonyms: draft.synonyms })
        .eq("id", sel.id);
      if (error) throw error;
    },
    onSuccess: () => (refresh(), toast({ title: "Term saved" })),
    onError: fail("Could not save the term"),
  });
  const add = useMutation({
    mutationFn: async () => {
      const facet = tab === "tags" || tab === "proposed" ? "finish" : (tab as Facet);
      const label = filter.trim() || "New term";
      const { data, error } = await supabase.from("taxonomy_terms").insert({ facet, slug: slugify(label), label, status: "active", is_active: true }).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => (refresh(), setSelId(id)),
    onError: fail("Could not add the term"),
  });
  const setStatus = useMutation({
    mutationFn: async ({ id, status, parent }: { id: string; status: "active" | "retired"; parent?: string | null }) => {
      const { error } = await supabase.from("taxonomy_terms").update({ status, is_active: status === "active", ...(parent !== undefined ? { parent_id: parent } : {}) }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: fail("Could not change the term"),
  });
  const merge = useMutation({
    mutationFn: async ({ keep, drop }: { keep: string; drop: string }) => {
      const { error } = await supabase.rpc("merge_terms", { _keep: keep, _drop: drop });
      if (error) throw error;
    },
    onSuccess: (_, v) => (refresh(), setSelId(v.keep), toast({ title: "Merged", description: "Everything now points to the kept term." })),
    onError: fail("Could not merge"),
  });

  const parentOf = sel?.parent_id ? terms?.byId.get(sel.parent_id) : undefined;
  const suggested = sel ? proposed.filter((w) => closestTerm(w, list)?.id === sel.id) : [];
  return (
    <AdminShell board="C1-Vocabulary" section="vocabulary">
      <Crumb items={["Curate"]} />
      <div className="hd">
        <div>
          <h1 className="ah1">Vocabulary</h1>
          <p className="asub">The shared words behind every scheme, product and rule. Synonyms let free text from AI and shop feeds land on the right term.</p>
        </div>
        <button className="btn sm" type="button" onClick={() => add.mutate()}>
          <I.plus />
          Add term
        </button>
      </div>
      <div className="sec">
        <div className="seg-ctl" role="tablist" aria-label="Facets">
          {TABS.map(([k, l]) => (
            <a key={k} href={`#${k}`} className={tab === k ? "on" : ""} role="tab" aria-selected={tab === k} onClick={(e) => (e.preventDefault(), setTab(k), setSelId(null))}>
              {l}
            </a>
          ))}
          <a href="#proposed" role="tab" aria-selected={false} onClick={() => document.getElementById("proposed")?.scrollIntoView({ behavior: "smooth" })}>
            Proposed · {proposed.length}
          </a>
        </div>
      </div>
      <div className="vgrid" style={{ marginTop: "20px" }}>
        <section className="vtree rail-card" style={{ gap: "8px" }}>
          <div className="field">
            <label className="sr" htmlFor="tf">
              Filter {plural[tab]}
            </label>
            <input id="tf" className="input" placeholder={`Filter ${plural[tab]}`} value={filter} onChange={(e) => setFilter(e.target.value)} style={{ minHeight: "46px", fontSize: "15px" }} />
          </div>
          <div className="tree">
            {tree.map(({ term, depth, hasKids }) => (
              <div key={term.id} className={`tn${depth ? ` l${depth}` : ""}${term.id === selId ? " on" : ""}`} role="button" tabIndex={0} onClick={() => setSelId(term.id)} style={{ cursor: "pointer", opacity: term.status === "retired" ? 0.5 : 1 }}>
                {hasKids && !filter && (
                  <span
                    role="button"
                    aria-label={open.has(term.id) ? `Fold ${term.label}` : `Open ${term.label}`}
                    aria-expanded={open.has(term.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpen((o) => {
                        const n = new Set(o);
                        if (n.has(term.id)) n.delete(term.id);
                        else n.add(term.id);
                        return n;
                      });
                    }}
                    style={{ display: "inline-flex" }}
                  >
                    <Ic style={{ transform: open.has(term.id) ? undefined : "rotate(-90deg)" }}>
                      <path d="M6 9l6 6 6-6" />
                    </Ic>
                  </span>
                )}
                {term.hex && <span style={{ width: 14, height: 14, borderRadius: 4, background: term.hex, display: "inline-block" }} />}
                {term.label}
                <small>{uses(term.id)}</small>
              </div>
            ))}
            {!tree.length && <p className="small" style={{ margin: "8px 12px" }}>No terms yet. Type one above and press “Add term”.</p>}
          </div>
          <p className="small" style={{ margin: "4px 12px 0" }}>
            Numbers are schemes + products using the term.
          </p>
        </section>
        <section className="vdet panel" style={{ padding: "30px" }}>
          {sel && draft ? (
            <>
              <div className="row between">
                <div className="crumb">
                  <span>{facetLabel[sel.facet]}</span>
                  {parentOf && (
                    <>
                      <span>›</span>
                      <span>{parentOf.label}</span>
                    </>
                  )}
                </div>
                <span className={`tag ${sel.status === "active" ? "ok" : "tbc"}`}>{sel.status === "active" ? "Active" : sel.status === "retired" ? "Retired" : "Proposed"}</span>
              </div>
              <div className="two" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px", marginTop: "16px" }}>
                <div className="field">
                  <label htmlFor="lb">Label</label>
                  <input id="lb" className="input" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
                </div>
                <div className="field">
                  <label htmlFor="pa">Parent</label>
                  <select id="pa" className="select" value={draft.parent} onChange={(e) => setDraft({ ...draft, parent: e.target.value })}>
                    <option value="">No parent</option>
                    {list
                      .filter((t) => t.facet === sel.facet && t.id !== sel.id && t.status === "active")
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                  </select>
                </div>
                {sel.facet === "color" && (
                  <div className="field">
                    <label htmlFor="hx">Colour</label>
                    <input id="hx" className="input" value={draft.hex} placeholder="#5B2E45" onChange={(e) => setDraft({ ...draft, hex: e.target.value })} />
                  </div>
                )}
              </div>
              <div className="field" style={{ marginTop: "20px" }}>
                <span className="lbl">Synonyms</span>
                <div className="syn">
                  {draft.synonyms.map((y) => (
                    <span key={y}>
                      {y}
                      <button type="button" aria-label={`Remove ${y}`} onClick={() => setDraft({ ...draft, synonyms: draft.synonyms.filter((x) => x !== y) })}>
                        <I.x />
                      </button>
                    </span>
                  ))}
                  {suggested.map((w) => (
                    <button key={w.id} className="sug" type="button" style={{ display: "inline-flex", alignItems: "center", minHeight: 38, padding: "0 14px", borderRadius: 999, background: "#FFF8F1", border: "1.5px dashed #C98A4E", color: "#7A4A1E", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }} onClick={() => merge.mutate({ keep: sel.id, drop: w.id })}>
                      + {w.label.toLowerCase()} · suggested by {usage?.seen.get(w.id)?.n ?? 1} scan{(usage?.seen.get(w.id)?.n ?? 1) === 1 ? "" : "s"}
                    </button>
                  ))}
                  {newSyn == null ? (
                    <button className="chip add" type="button" style={{ minHeight: "38px", fontSize: "14px" }} onClick={() => setNewSyn("")}>
                      + Add synonym
                    </button>
                  ) : (
                    <input
                      className="input"
                      autoFocus
                      style={{ minHeight: 38, width: 200, fontSize: 14 }}
                      value={newSyn}
                      placeholder="Type and press Enter"
                      onChange={(e) => setNewSyn(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newSyn.trim()) {
                          setDraft({ ...draft, synonyms: Array.from(new Set([...draft.synonyms, newSyn.trim()])) });
                          setNewSyn(null);
                        }
                        if (e.key === "Escape") setNewSyn(null);
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="used" style={{ marginTop: "22px" }}>
                <div className="card">
                  <b>{usage?.schemes.get(sel.id) ?? 0}</b>
                  <span>Schemes</span>
                </div>
                <div className="card">
                  <b>{usage?.products.get(sel.id) ?? 0}</b>
                  <span>Products</span>
                </div>
                <div className="card">
                  <b>{usage?.rules.get(sel.id) ?? 0}</b>
                  <span>Compatibility rules</span>
                </div>
              </div>
              {mergeTo != null && (
                <div className="row" style={{ gap: 10, marginTop: 18 }}>
                  <select className="select" style={{ flex: "1 1 260px" }} value={mergeTo} onChange={(e) => setMergeTo(e.target.value)} aria-label="Merge into">
                    <option value="">Merge into…</option>
                    {list
                      .filter((t) => t.facet === sel.facet && t.id !== sel.id && t.status === "active")
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                  </select>
                  <button className="btn sm" type="button" disabled={!mergeTo} onClick={() => mergeTo && merge.mutate({ keep: mergeTo, drop: sel.id })}>
                    Merge
                  </button>
                </div>
              )}
              <div className="actions" style={{ marginTop: "24px" }}>
                <button className="btn ghost sm" type="button" onClick={() => setMergeTo(mergeTo == null ? "" : null)}>
                  Merge into another term
                </button>
                <button className="btn ghost sm" type="button" onClick={() => setStatus.mutate({ id: sel.id, status: sel.status === "retired" ? "active" : "retired" })}>
                  {sel.status === "retired" ? "Bring back" : "Retire"}
                </button>
                <button className="btn sm" type="button" style={{ marginLeft: "auto" }} onClick={() => save.mutate()}>
                  Save term
                </button>
              </div>
              <p className="small" style={{ margin: "12px 0 0" }}>
                Merging moves every scheme, product and rule to the kept term; this label becomes its synonym. Retired terms stay on old schemes but leave every picker.
              </p>
            </>
          ) : (
            <p className="p">Pick a term on the left to edit it, or add a new one.</p>
          )}
        </section>
      </div>
      <section className="sec" id="proposed">
        <div className="sec-h">
          <h2>Proposed by scans</h2>
          <span className="small">Words the AI used that aren't terms yet</span>
        </div>
        <div className="tbl-box">
          <table className="tbl">
            <thead>
              <tr>
                <th>Word</th>
                <th>Facet</th>
                <th>Seen</th>
                <th>Closest term</th>
                <th>
                  <span className="sr">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {proposed.map((w) => {
                const close = closestTerm(w, list);
                const seen = usage?.seen.get(w.id);
                const parentGuess = close && !close.parent_id && list.some((x) => x.parent_id === close.id) ? close : undefined;
                return (
                  <tr key={w.id}>
                    <td>
                      <span className="wd">{w.label.toLowerCase()}</span>
                    </td>
                    <td>{TAG_FACETS.includes(w.facet) ? "Tag" : facetLabel[w.facet]}</td>
                    <td>
                      {seen?.n ?? 1}×{seen && seen.batches.size > 1 ? ` · ${seen.batches.size} batches` : ""}
                    </td>
                    <td>{close?.label ?? "—"}</td>
                    <td>
                      <div className="row" style={{ gap: "8px" }}>
                        <button className="btn sm" type="button" onClick={() => setStatus.mutate({ id: w.id, status: "active", parent: parentGuess?.id ?? null })}>
                          {parentGuess ? `Accept under ${parentGuess.label}` : "Accept"}
                        </button>
                        {close && !parentGuess ? (
                          <button className="btn soft sm" type="button" onClick={() => merge.mutate({ keep: close.id, drop: w.id })}>
                            Map to {close.label}
                          </button>
                        ) : (
                          <span className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                            <select className="select" style={{ minHeight: 44, fontSize: 14, width: 150 }} value={mapFor[w.id] ?? ""} onChange={(e) => setMapFor({ ...mapFor, [w.id]: e.target.value })} aria-label={`Map ${w.label} to`}>
                              <option value="">Map to…</option>
                              {list
                                .filter((x) => x.facet === w.facet && x.status === "active")
                                .map((x) => (
                                  <option key={x.id} value={x.id}>
                                    {x.label}
                                  </option>
                                ))}
                            </select>
                            <button className="btn soft sm" type="button" disabled={!mapFor[w.id]} onClick={() => merge.mutate({ keep: mapFor[w.id], drop: w.id })}>
                              Map
                            </button>
                          </span>
                        )}
                        <button className="link-btn" type="button" onClick={() => setStatus.mutate({ id: w.id, status: "retired" })}>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!proposed.length && (
                <tr>
                  <td colSpan={5} className="mut">
                    No new words waiting.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
