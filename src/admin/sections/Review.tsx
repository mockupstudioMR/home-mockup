/** B1–B3 · Review queue, review one piece, spot-check. */
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { I, Ic } from "@/journey/icons";
import { facetLabel, useScanImage, useTerms, type Term } from "@/admin/data";
import { A, AdminShell, AdminTop, Chip, Crop, Crumb, Scan as ScanImg, adminHref, useAdminNav, type Box } from "../ui";

const p = (d: string) => <path d={d} />;
type Piece = Tables<"detected_pieces">;
const REASONS: Record<string, string> = { new_word: "New word", low_confidence: "Low confidence", possible_duplicate: "Possible duplicate", reported: "Reported by support", spot_check: "Spot-check" };
const FACETS = ["category", "color", "style", "material"] as const;
type MainFacet = (typeof FACETS)[number];

type QueueRow = Piece & { ingest_items: { storage_path: string | null; source_url: string | null; batch_id: string; ingest_batches: { id: string; name: string; room_type_id: string | null } | null } | null };

export function useQueue() {
  return useQuery({
    queryKey: ["review-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("detected_pieces")
        .select("*, ingest_items(storage_path, source_url, batch_id, ingest_batches(id, name, room_type_id))")
        .eq("status", "waiting")
        .order("created_at", { ascending: true })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as QueueRow[];
    },
  });
}

function RowCrop({ row }: { row: QueueRow }) {
  const { data: src } = useScanImage(row.ingest_items?.storage_path, row.ingest_items?.source_url);
  return <Crop src={src} box={row.box as Box | null} alt="" />;
}
const hoursAgo = (iso: string) => {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3600000);
  return h < 1 ? "now" : h < 48 ? `${h}h` : `${Math.round(h / 24)}d`;
};

/** B1 · Review queue */
export function Queue() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: terms } = useTerms();
  const { data: rows } = useQueue();
  const [reason, setReason] = useState("all");
  const [batch, setBatch] = useState("");
  const [room, setRoom] = useState("");
  const [cat, setCat] = useState("");
  const [sort, setSort] = useState("old");
  const [sel, setSel] = useState<string[]>([]);
  const t = (id: string | null) => (id ? terms?.byId.get(id) : undefined);
  const all = rows ?? [];
  const newWordOf = (r: Piece) => [r.category_id, r.color_id, r.style_id, r.material_id].map(t).find((x) => x?.status === "proposed");
  const shown = useMemo(() => {
    const out = all.filter(
      (r) =>
        (reason === "all" || r.review_reason === reason || (reason === "new_word" && newWordOf(r))) &&
        (!batch || r.ingest_items?.batch_id === batch) &&
        (!room || r.ingest_items?.ingest_batches?.room_type_id === room) &&
        (!cat || t(r.category_id)?.parent_id === cat || r.category_id === cat),
    );
    return sort === "low" ? [...out].sort((a, b) => (a.confidence ?? 0) - (b.confidence ?? 0)) : out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, reason, batch, room, cat, sort, terms]);
  const count = (r: string) => all.filter((x) => x.review_reason === r || (r === "new_word" && x.review_reason !== r && newWordOf(x))).length;
  const batches = Array.from(new Map(all.map((r) => [r.ingest_items?.batch_id, r.ingest_items?.ingest_batches?.name])).entries()).filter(([k]) => k);
  const rooms = terms?.list.filter((x) => x.facet === "room_type" && x.status === "active") ?? [];
  const cats = terms?.list.filter((x) => x.facet === "category" && x.status === "active" && !x.parent_id) ?? [];
  // As on the board: pieces that share the same new word start selected, so one decision clears them all.
  const [presel, setPresel] = useState(false);
  useEffect(() => {
    if (presel || !rows || !terms) return;
    setPresel(true);
    const by = new Map<string, string[]>();
    for (const r of rows) {
      const w = newWordOf(r);
      if (w) by.set(w.id, [...(by.get(w.id) ?? []), r.id]);
    }
    const best = [...by.values()].sort((a, b) => b.length - a.length)[0];
    if (best && best.length > 1) setSel(best);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, terms, presel]);
  const selRows = all.filter((r) => sel.includes(r.id));
  const shared = selRows.length > 1 ? newWordOf(selRows[0]) : undefined;
  const allShare = shared && selRows.every((r) => newWordOf(r)?.id === shared.id);

  const confirmAll = useMutation({
    mutationFn: async () => {
      let ok = 0, blocked = 0;
      for (const r of selRows) {
        if (newWordOf(r) || !r.category_id) {
          blocked++;
          continue;
        }
        const { error } = await supabase.rpc("save_detected_piece", { _piece: r.id, _confirmed: true });
        if (error) blocked++;
        else ok++;
      }
      return { ok, blocked };
    },
    onSuccess: ({ ok, blocked }) => {
      setSel([]);
      qc.invalidateQueries({ queryKey: ["review-queue"] });
      qc.invalidateQueries({ queryKey: ["admin-counts"] });
      toast({ title: `${ok} confirmed`, description: blocked ? `${blocked} skipped: they need a new word decided or a category first.` : undefined });
    },
  });
  const acceptWord = useMutation({
    mutationFn: async (term: Term) => {
      const { error } = await supabase.from("taxonomy_terms").update({ status: "active", is_active: true }).eq("id", term.id);
      if (error) throw error;
      for (const r of selRows) await supabase.rpc("save_detected_piece", { _piece: r.id, _confirmed: true });
    },
    onSuccess: () => {
      setSel([]);
      qc.invalidateQueries({ queryKey: ["review-queue"] });
      qc.invalidateQueries({ queryKey: ["admin-terms"] });
      qc.invalidateQueries({ queryKey: ["admin-counts"] });
      toast({ title: "Word accepted and pieces saved" });
    },
    onError: (e: Error) => toast({ title: "Couldn't accept the word", description: e.message, variant: "destructive" }),
  });

  return (
    <AdminShell board="B1-Queue" section="review">
      <Crumb items={["Feed"]} />
      <div className="hd">
        <div>
          <h1 className="ah1">Review queue</h1>
          <p className="asub">Everything the AI wasn't sure about. Nothing here reaches users until you confirm, fix or merge it.</p>
        </div>
        <A className="btn soft sm" to="review" extra={{ view: "spotcheck" }}>
          <Ic>{p("M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9")}</Ic>
          Spot-check AI-saved items
        </A>
      </div>
      <div className="sec">
        <div className="flt">
          <button className={`pill${reason === "all" ? " on" : ""}`} type="button" onClick={() => setReason("all")}>
            All <em>{all.length}</em>
          </button>
          {(["new_word", "low_confidence", "possible_duplicate", "reported"] as const).map((k) => (
            <button key={k} className={`pill${reason === k ? " on" : ""}`} type="button" onClick={() => setReason(k)}>
              {REASONS[k]} <em>{count(k)}</em>
            </button>
          ))}
        </div>
        <div className="selr">
          <div className="field">
            <label htmlFor="f1" className="sr">
              Batch
            </label>
            <select id="f1" className="select" value={batch} onChange={(e) => setBatch(e.target.value)}>
              <option value="">All batches</option>
              {batches.map(([id, name]) => (
                <option key={id} value={id!}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f2" className="sr">
              Room type
            </label>
            <select id="f2" className="select" value={room} onChange={(e) => setRoom(e.target.value)}>
              <option value="">All room types</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f3" className="sr">
              Category
            </label>
            <select id="f3" className="select" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">All categories</option>
              {cats.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f4" className="sr">
              Sort
            </label>
            <select id="f4" className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="old">Oldest first</option>
              <option value="low">Lowest confidence first</option>
            </select>
          </div>
        </div>
      </div>
      <section className="sec">
        {sel.length > 0 && (
          <div className="bulk">
            <b>{sel.length} selected</b>
            {allShare && <span style={{ opacity: ".8" }}>{sel.length === 2 ? "Both" : "All"} use “{shared!.label.toLowerCase()}”</span>}
            <span style={{ marginLeft: "auto", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button className="btn ghost sm" type="button" onClick={() => confirmAll.mutate()}>
                Confirm as suggested
              </button>
              {allShare && (
                <button className="btn sm" type="button" onClick={() => acceptWord.mutate(shared!)}>
                  Accept “{shared!.label.toLowerCase()}” everywhere
                </button>
              )}
            </span>
          </div>
        )}
        <div className="tbl-box">
          <table className="tbl">
            <thead>
              <tr>
                <th>
                  <input className="chk" type="checkbox" aria-label="Select all" checked={!!shown.length && sel.length === shown.length} onChange={(e) => setSel(e.target.checked ? shown.map((r) => r.id) : [])} />
                </th>
                <th>Piece</th>
                <th>Suggested scheme</th>
                <th>Why it's here</th>
                <th>Sure</th>
                <th>Batch</th>
                <th>
                  <span className="sr">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const on = sel.includes(r.id);
                const nw = newWordOf(r);
                return (
                  <tr key={r.id} className={on ? "hl" : ""}>
                    <td>
                      <input className="chk" type="checkbox" checked={on} aria-label={`Select ${t(r.category_id)?.label ?? "piece"}`} onChange={(e) => setSel((s) => (e.target.checked ? [...s, r.id] : s.filter((x) => x !== r.id)))} />
                    </td>
                    <td>
                      <RowCrop row={r} />
                    </td>
                    <td>
                      <div className="scs">
                        {FACETS.map((f) => (t(r[`${f}_id` as const]) || (r.raw as Record<string, string>)?.[f] ? <Chip key={f} plain term={t(r[`${f}_id` as const])} fallback={(r.raw as Record<string, string>)?.[f]} /> : null))}
                      </div>
                    </td>
                    <td>
                      <span className={`rs${r.review_reason === "possible_duplicate" ? " dup" : ""}`}>{nw ? "New word" : REASONS[r.review_reason ?? ""] ?? "Review"}</span>
                    </td>
                    <td>{(r.confidence ?? 0).toFixed(2)}</td>
                    <td>
                      <span className="mut">
                        {r.ingest_items?.ingest_batches?.name?.split(" ·")[0] ?? "—"} · {hoursAgo(r.created_at)}
                      </span>
                    </td>
                    <td>
                      <A className="btn soft sm" to="review" extra={{ piece: r.id }}>
                        Review
                      </A>
                    </td>
                  </tr>
                );
              })}
              {!shown.length && (
                <tr>
                  <td colSpan={7} className="mut">
                    Nothing waiting. New scans that need a decision will show up here.
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

/** B2 · Review a piece */
export function ReviewPiece({ id }: { id: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { go } = useAdminNav();
  const { data: terms } = useTerms();
  const { data: queue } = useQueue();
  const [vals, setVals] = useState<Record<MainFacet, string | null>>({ category: null, color: null, style: null, material: null });
  const [tags, setTags] = useState<string[]>([]);
  const [choice, setChoice] = useState<"accept" | "map" | "reject">("accept");
  const [parent, setParent] = useState("");
  const [mapTo, setMapTo] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState<Box | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const imgBox = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["review-piece", id],
    queryFn: async () => {
      const { data: piece, error } = await supabase.from("detected_pieces").select("*").eq("id", id).single();
      if (error) throw error;
      const { data: item } = await supabase.from("ingest_items").select("*").eq("id", piece.item_id).single();
      const [{ data: sib }, { data: batch }, { data: items }] = await Promise.all([
        supabase.from("detected_pieces").select("*").eq("item_id", piece.item_id).order("created_at"),
        item ? supabase.from("ingest_batches").select("id, name, threshold").eq("id", item.batch_id).single() : Promise.resolve({ data: null }),
        item ? supabase.from("ingest_items").select("id").eq("batch_id", item.batch_id).order("created_at") : Promise.resolve({ data: [] }),
      ]);
      return { piece: piece as Piece, item, siblings: (sib ?? []) as Piece[], batch, imageNo: (items ?? []).findIndex((x: { id: string }) => x.id === piece.item_id) + 1 };
    },
  });
  useEffect(() => {
    if (!data?.piece) return;
    const pc = data.piece;
    setVals({ category: pc.category_id, color: pc.color_id, style: pc.style_id, material: pc.material_id });
    setTags(pc.tag_ids);
  }, [data?.piece]);
  const { data: src } = useScanImage(data?.item?.storage_path, data?.item?.source_url);
  const t = (x: string | null | undefined) => (x ? terms?.byId.get(x) : undefined);
  const active = (f: string) => terms?.list.filter((x) => x.facet === f && x.status === "active") ?? [];
  const nwFacet = FACETS.find((f) => t(vals[f])?.status === "proposed");
  const nw = nwFacet ? t(vals[nwFacet]) : undefined;
  useEffect(() => {
    if (nw && !parent) {
      const guess = active(nwFacet!).find((x) => nw.label.toLowerCase().includes(x.label.toLowerCase()));
      if (guess) setParent(guess.id);
      const close = active(nwFacet!).find((x) => x.label.toLowerCase().split(" ").some((w) => nw.label.toLowerCase().includes(w)));
      if (close) setMapTo(close.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nw?.id]);

  const { data: closest } = useQuery({
    queryKey: ["closest-schemes", vals.category],
    enabled: !!vals.category,
    queryFn: async () => (await supabase.from("furniture_schemes").select("id, category_id, color_id, style_id, material_id, label, status").eq("category_id", vals.category!).eq("status", "active").limit(40)).data ?? [],
  });
  const ranked = useMemo(() => {
    const score = (s: { color_id: string | null; style_id: string | null; material_id: string | null }) => (s.color_id === vals.color ? 1 : 0) + (s.style_id === vals.style ? 1 : 0) + (s.material_id === vals.material ? 1 : 0);
    return (closest ?? []).map((s) => ({ ...s, score: score(s) })).sort((a, b) => b.score - a.score).slice(0, 3);
  }, [closest, vals]);
  const diff = (s: { color_id: string | null; style_id: string | null; material_id: string | null }) => {
    const out: string[] = [];
    if (s.material_id !== vals.material) out.push(`${t(s.material_id)?.label?.toLowerCase() ?? "no material"}`);
    if (s.style_id !== vals.style) out.push(`${t(s.style_id)?.label?.toLowerCase() ?? "no style"}`);
    if (s.color_id !== vals.color) out.push(`${t(s.color_id)?.label?.toLowerCase() ?? "no colour"}`);
    return out;
  };

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["review-piece", id] });
    qc.invalidateQueries({ queryKey: ["admin-terms"] });
    qc.invalidateQueries({ queryKey: ["review-queue"] });
    qc.invalidateQueries({ queryKey: ["admin-counts"] });
  };
  const idx = (queue ?? []).findIndex((q) => q.id === id);
  const nextId = (queue ?? []).find((q, i) => i > idx && q.id !== id)?.id ?? (queue ?? []).find((q) => q.id !== id)?.id;
  const prevId = idx > 0 ? queue![idx - 1].id : undefined;
  const next = () => (nextId ? go("review", { piece: nextId }) : go("review"));

  const confirm = useMutation({
    mutationFn: async (asSuggested: boolean) => {
      const pc = data!.piece;
      let v = { ...vals };
      if (!asSuggested && nw && nwFacet) {
        if (choice === "accept") {
          const { error } = await supabase.from("taxonomy_terms").update({ status: "active", is_active: true, parent_id: parent || null }).eq("id", nw.id);
          if (error) throw error;
        } else if (choice === "map") {
          if (!mapTo) throw new Error("Pick the existing term first.");
          const { error } = await supabase.rpc("merge_terms", { _keep: mapTo, _drop: nw.id });
          if (error) throw error;
          v = { ...v, [nwFacet]: mapTo };
        } else {
          await supabase.from("taxonomy_terms").update({ status: "retired", is_active: false }).eq("id", nw.id);
          v = { ...v, [nwFacet]: null };
        }
      }
      const { data: auth } = await supabase.auth.getUser();
      const corrections = FACETS.filter((f) => (pc[`${f}_id` as const] ?? null) !== (v[f] ?? null)).map((f) => ({
        piece_id: pc.id,
        facet: f,
        ai_value: t(pc[`${f}_id` as const])?.label ?? (pc.raw as Record<string, string>)?.[f] ?? null,
        fixed_value: t(v[f])?.label ?? null,
        fixed_by: auth.user?.id ?? null,
      }));
      if (corrections.length) await supabase.from("detection_corrections").insert(corrections);
      const { error: e1 } = await supabase.from("detected_pieces").update({ category_id: v.category, color_id: v.color, style_id: v.style, material_id: v.material, tag_ids: tags }).eq("id", pc.id);
      if (e1) throw e1;
      const { error } = await supabase.rpc("save_detected_piece", { _piece: pc.id, _confirmed: true });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "The scheme is in the library." });
      refresh();
      next();
    },
    onError: (e: Error) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });
  const drop = useMutation({
    mutationFn: async () => {
      const pc = data!.piece;
      const { data: auth } = await supabase.auth.getUser();
      await supabase.from("detected_pieces").update({ status: "dropped", reviewed_by: auth.user?.id ?? null, reviewed_at: new Date().toISOString() }).eq("id", pc.id);
      await supabase.rpc("save_ingest_combination", { _item: pc.item_id });
      if (data?.batch) await supabase.rpc("refresh_ingest_batch", { _batch: data.batch.id });
    },
    onSuccess: () => {
      toast({ title: "Dropped", description: "Kept as a rejected detection to improve the AI." });
      refresh();
      next();
    },
  });
  const saveBox = async (box: Box) => {
    await supabase.from("detected_pieces").update({ box }).eq("id", id);
    await supabase.from("detection_corrections").insert({ piece_id: id, facet: "box", ai_value: JSON.stringify(data?.piece.box), fixed_value: JSON.stringify(box) });
    refresh();
    toast({ title: "Box redrawn" });
  };
  const split = async () => {
    const pc = data!.piece;
    const b = (pc.box as Box | null) ?? { x: 0.3, y: 0.3, w: 0.4, h: 0.4 };
    const left = { ...b, w: b.w / 2 };
    const right = { ...b, x: b.x + b.w / 2, w: b.w / 2 };
    await supabase.from("detected_pieces").update({ box: left }).eq("id", pc.id);
    const { data: twin } = await supabase
      .from("detected_pieces")
      .insert({ item_id: pc.item_id, box: right, category_id: pc.category_id, color_id: pc.color_id, style_id: pc.style_id, material_id: pc.material_id, tag_ids: pc.tag_ids, confidence: pc.confidence, raw: pc.raw, status: "waiting", review_reason: pc.review_reason ?? "low_confidence" })
      .select("id")
      .single();
    refresh();
    toast({ title: "Split in two", description: "Fix each half, then confirm both." });
    if (twin) qc.invalidateQueries({ queryKey: ["review-queue"] });
  };
  const rel = (e: MouseEvent) => {
    const r = imgBox.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };

  const pc = data?.piece;
  const sibs = data?.siblings ?? [];
  const label = (s: Piece) => t(s.category_id)?.label ?? (s.raw as { category?: string })?.category ?? "Piece";
  const waitingSibs = sibs.filter((s) => s.status === "waiting");
  const primary = nw ? (choice === "accept" ? "Add term & confirm" : choice === "map" ? "Map & confirm" : "Reject word & confirm") : "Confirm";
  return (
    <AdminShell board="B2-Review" section="review">
      <div className="hd">
        <div>
          <Crumb items={[["Review queue", "review"], pc ? label(pc) : "Piece"]} />
          <h1 className="ah1">Is this right?</h1>
          <p className="asub" style={{ marginTop: "8px" }}>
            From “{data?.batch?.name ?? "a scan"}”, image {data?.imageNo || 1}. The AI was {(pc?.confidence ?? 0).toFixed(2)} sure
            {nw ? " but found a word we don't know." : pc?.review_reason === "low_confidence" ? " — below the auto-save bar." : "."}
          </p>
        </div>
        <div className="pager">
          {prevId ? (
            <Link to={adminHref("review", { piece: prevId })} aria-label="Previous piece">
              <I.back />
            </Link>
          ) : (
            <Link to={adminHref("review")} aria-label="Previous piece">
              <I.back />
            </Link>
          )}
          <span>
            {idx >= 0 ? idx + 1 : 1} of {queue?.length ?? 1}
          </span>
          <Link to={nextId ? adminHref("review", { piece: nextId }) : adminHref("review")} aria-label="Next piece">
            <I.next />
          </Link>
        </div>
      </div>
      <div className="work sec">
        <section className="w-main">
          <div
            ref={imgBox}
            style={{ position: "relative", cursor: drawing ? "crosshair" : undefined }}
            onMouseDown={(e) => {
              if (!drawing) return;
              start.current = rel(e);
              setDraft({ ...start.current, w: 0, h: 0 });
            }}
            onMouseMove={(e) => {
              if (!drawing || !start.current) return;
              const q = rel(e);
              setDraft({ x: Math.min(q.x, start.current.x), y: Math.min(q.y, start.current.y), w: Math.abs(q.x - start.current.x), h: Math.abs(q.y - start.current.y) });
            }}
            onMouseUp={() => {
              if (!drawing || !draft) return;
              start.current = null;
              setDrawing(false);
              if (draft.w > 0.02 && draft.h > 0.02) void saveBox(draft);
              setDraft(null);
            }}
          >
            <ScanImg
              src={src}
              alt={`Scan with the ${pc ? label(pc).toLowerCase() : "piece"} highlighted`}
              selected={id}
              pieces={sibs.map((s, i) => ({ id: s.id, box: (s.id === id && draft ? draft : (s.box as Box | null)), status: s.status, label: s.id === id ? label(s) : "", n: i + 1 }))}
            />
          </div>
          <div className="row" style={{ marginTop: "12px", gap: "10px" }}>
            <button className="link-btn" type="button" style={{ minHeight: "40px", fontSize: "14px" }} onClick={() => setDrawing(!drawing)}>
              <Ic>{p("M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z")}</Ic>
              {drawing ? "Drag on the picture…" : "Redraw the box"}
            </button>
            <button className="link-btn" type="button" style={{ minHeight: "40px", fontSize: "14px" }} onClick={() => void split()}>
              <Ic>{p("M12 3v18M5 8l-3 4 3 4M19 8l3 4-3 4")}</Ic>
              Split into separate pieces
            </button>
          </div>
          <div className="panel" style={{ marginTop: "20px", padding: "28px" }}>
            <div className="row between" style={{ marginBottom: "18px" }}>
              <h2 className="h3" style={{ fontSize: "20px" }}>
                Scheme
              </h2>
              <span className="small">AI suggestion shown · change anything that's wrong</span>
            </div>
            <div className="fp">
              {FACETS.map((f) => {
                const cur = t(vals[f]);
                const opts = active(f);
                const aiSame = pc && vals[f] === pc[`${f}_id` as const];
                return (
                  <span key={f} style={{ display: "contents" }}>
                    <span className="k">{facetLabel[f]}</span>
                    <label className={`sel-box${cur?.status === "proposed" ? " new" : ""}`} style={{ position: "relative" }}>
                      {cur?.hex && <span className="dot" style={{ width: "18px", height: "18px", borderRadius: "5px", background: cur.hex, display: "inline-block" }} />}
                      {cur?.label ?? "Not set"}
                      {cur?.status === "proposed" ? (
                        <span className="tag tbc" style={{ marginLeft: "6px" }}>
                          New word
                        </span>
                      ) : (
                        aiSame && cur && <span className="ai">AI</span>
                      )}
                      <select
                        aria-label={facetLabel[f]}
                        value={vals[f] ?? ""}
                        onChange={(e) => setVals((s) => ({ ...s, [f]: e.target.value || null }))}
                        style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                      >
                        {f !== "category" && <option value="">Not set</option>}
                        {cur && cur.status !== "active" && <option value={cur.id}>{cur.label} · new word</option>}
                        {opts.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </span>
                );
              })}
              <span className="k">Tags</span>
              <span className="scs">
                {tags.map((tid) => (
                  <button key={tid} className="sc" type="button" onClick={() => setTags((x) => x.filter((y) => y !== tid))} aria-label={`Remove tag ${t(tid)?.label}`} style={{ cursor: "pointer" }}>
                    {t(tid)?.label}
                  </button>
                ))}
                <label className="sc" style={{ borderStyle: "dashed", color: "#665A80", cursor: "pointer", position: "relative" }}>
                  + Add tag
                  <select aria-label="Add tag" value="" onChange={(e) => e.target.value && setTags((x) => Array.from(new Set([...x, e.target.value])))} style={{ position: "absolute", inset: 0, opacity: 0 }}>
                    <option value="" />
                    {(terms?.list ?? [])
                      .filter((x) => ["finish", "shape", "pattern", "mood"].includes(x.facet) && x.status === "active")
                      .map((x) => (
                        <option key={x.id} value={x.id}>
                          {facetLabel[x.facet]} · {x.label}
                        </option>
                      ))}
                  </select>
                </label>
              </span>
            </div>
            {nw && nwFacet && (
              <div className="nw">
                <h3>“{nw.label}” isn't in the vocabulary</h3>
                <div className="opts">
                  <div className={`ch${choice === "accept" ? " on" : ""}`} onClick={() => setChoice("accept")} role="button" tabIndex={0}>
                    <b>Add as a new term</b>
                    Under
                    <select className="select" value={parent} onChange={(e) => setParent(e.target.value)} aria-label="Parent term">
                      <option value="">No parent</option>
                      {active(nwFacet).map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    Usable everywhere after this.
                  </div>
                  <div className={`ch${choice === "map" ? " on" : ""}`} onClick={() => setChoice("map")} role="button" tabIndex={0}>
                    <b>Same as an existing term</b>
                    <select className="select" value={mapTo} onChange={(e) => setMapTo(e.target.value)} aria-label="Existing term">
                      <option value="">Pick a term</option>
                      {active(nwFacet).map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    “{nw.label}” becomes its synonym.
                  </div>
                  <div className={`ch${choice === "reject" ? " on" : ""}`} onClick={() => setChoice("reject")} role="button" tabIndex={0}>
                    <b>Reject the word</b>
                    Leave {facetLabel[nwFacet].toLowerCase()} empty for this piece.
                    {(() => {
                      const more = (queue ?? []).filter((q) => q.id !== id && [q.category_id, q.color_id, q.style_id, q.material_id].includes(nw.id)).length;
                      return more ? ` Used ${more} more time${more > 1 ? "s" : ""} in the queue.` : "";
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
        <aside className="w-side">
          <div className="rail-card">
            <h2 className="h3" style={{ fontSize: "19px" }}>
              Closest existing schemes
            </h2>
            <div>
              {ranked.map((s) => {
                const d = diff(s);
                return (
                  <div className="cl" key={s.id}>
                    <span style={{ width: 56, height: 56, borderRadius: 12, background: t(s.color_id)?.hex ?? "#E8DFE3", flex: "none" }} />
                    <span className="d">
                      <b>{[t(s.category_id)?.label, t(s.color_id)?.label?.toLowerCase(), t(s.style_id)?.label?.toLowerCase()].filter(Boolean).join(" · ")}</b>
                      {d.length ? (
                        <>
                          Same, but <em>{d.join(", ")}</em>
                        </>
                      ) : (
                        "The same scheme"
                      )}
                    </span>
                    <button
                      className="btn ghost sm"
                      type="button"
                      style={{ minHeight: "40px", padding: "0 12px", fontSize: "14px" }}
                      onClick={() => {
                        setVals({ category: s.category_id, color: s.color_id, style: s.style_id, material: s.material_id });
                        toast({ title: "Merged into the existing scheme", description: "Confirm to save it." });
                      }}
                    >
                      Merge
                    </button>
                  </div>
                );
              })}
              {!ranked.length && <p className="small">No scheme in this category yet — confirming creates the first one.</p>}
            </div>
          </div>
          <div className="rail-card" style={{ marginTop: "16px" }}>
            <div className="row between">
              <h2 className="h3" style={{ fontSize: "19px" }}>
                Its combination
              </h2>
              {waitingSibs.length ? <span className="bdg review">Waiting on {waitingSibs.length}</span> : <span className="bdg saved">Ready</span>}
            </div>
            <div className="sofar">
              {sibs
                .filter((s) => s.status !== "dropped")
                .map((s) => (
                  <div key={s.id}>
                    <span style={s.status === "waiting" ? { color: "#7A4A1E" } : undefined}>{s.status === "waiting" ? "•" : "✓"}</span>
                    <b>
                      {label(s)}
                      {s.id === id ? " · this one" : t(s.color_id) ? ` · ${t(s.color_id)!.label.toLowerCase()}` : ""}
                    </b>
                  </div>
                ))}
            </div>
            <p className="small" style={{ margin: "0" }}>
              Saved and scored once {waitingSibs.length > 1 ? `all ${waitingSibs.length} are` : "it's"} confirmed.
            </p>
          </div>
        </aside>
      </div>
      <div className="foot">
        <button className="btn ghost sm" type="button" onClick={() => drop.mutate()}>
          Not furniture / wrong box
        </button>
        <button className="link-btn" type="button" onClick={next}>
          Skip
        </button>
        <span className="small" style={{ marginLeft: "auto" }}>
          Your changes are kept to improve detection.
        </span>
        {nw && (
          <button className="btn soft sm" type="button" onClick={() => toast({ title: "Decide on the new word first", description: "Accept it, map it to an existing term or reject it." })}>
            Confirm as suggested
          </button>
        )}
        {!nw && (
          <button className="btn soft sm" type="button" onClick={() => confirm.mutate(true)}>
            Confirm as suggested
          </button>
        )}
        <button className={`btn sm${!vals.category ? " dis" : ""}`} type="button" onClick={() => confirm.mutate(false)}>
          {primary}
          <I.next />
        </button>
      </div>
    </AdminShell>
  );
}

const ROUND_KEY = "hm_spotcheck_round";
type Round = { ids: string[]; results: Record<string, "ok" | "fix"> };

/** B3 · Spot-check */
export function SpotCheck() {
  const { go } = useAdminNav();
  const qc = useQueryClient();
  const { data: terms } = useTerms();
  const [round, setRound] = useState<Round | null>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(ROUND_KEY) ?? "null");
    } catch {
      return null;
    }
  });
  const { data: sample } = useQuery({
    queryKey: ["spotcheck-sample", round?.ids.join()],
    queryFn: async () => {
      let ids = round?.ids;
      if (!ids?.length) {
        const since = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data } = await supabase.from("detected_pieces").select("id").eq("status", "saved").gte("created_at", since).limit(200);
        ids = (data ?? []).map((x) => x.id).sort(() => Math.random() - 0.5).slice(0, 10);
        const r = { ids, results: {} };
        setRound(r);
        try {
          sessionStorage.setItem(ROUND_KEY, JSON.stringify(r));
        } catch {
          /* ignore */
        }
      }
      if (!ids.length) return [];
      const { data } = await supabase.from("detected_pieces").select("*, ingest_items(storage_path, source_url, batch_id, ingest_batches(id, name, room_type_id))").in("id", ids);
      const { data: fixes } = await supabase.from("detection_corrections").select("piece_id, facet, ai_value, fixed_value").in("piece_id", ids);
      return ids.map((i) => ({ ...(data ?? []).find((d) => d.id === i), fixes: (fixes ?? []).filter((f) => f.piece_id === i) })).filter((x) => x.id) as (QueueRow & { fixes: { facet: string; ai_value: string | null; fixed_value: string | null }[] })[];
    },
  });
  const save = (r: Round) => {
    setRound(r);
    try {
      sessionStorage.setItem(ROUND_KEY, JSON.stringify(r));
    } catch {
      /* ignore */
    }
  };
  const items = sample ?? [];
  const at = items.findIndex((x) => !round?.results[x.id]);
  const cur = at >= 0 ? items[at] : undefined;
  const { data: src } = useScanImage(cur?.ingest_items?.storage_path, cur?.ingest_items?.source_url);
  const t = (x: string | null) => (x ? terms?.byId.get(x) : undefined);
  const ok = async () => {
    if (!cur || !round) return;
    await supabase.rpc("save_detected_piece", { _piece: cur.id, _confirmed: true });
    save({ ...round, results: { ...round.results, [cur.id]: "ok" } });
    qc.invalidateQueries({ queryKey: ["admin-home"] });
  };
  const fix = async () => {
    if (!cur || !round) return;
    await supabase.from("detected_pieces").update({ status: "waiting", review_reason: "spot_check" }).eq("id", cur.id);
    save({ ...round, results: { ...round.results, [cur.id]: "fix" } });
    go("review", { piece: cur.id });
  };
  const byBatch = new Map<string, { checked: number; fixed: number; wrong: string[] }>();
  for (const it of items) {
    const res = round?.results[it.id];
    if (!res) continue;
    const name = it.ingest_items?.ingest_batches?.name ?? "—";
    const b = byBatch.get(name) ?? { checked: 0, fixed: 0, wrong: [] };
    b.checked++;
    if (res === "fix") {
      b.fixed++;
      for (const f of it.fixes) b.wrong.push(`${facetLabel[f.facet] ?? f.facet}: “${(f.ai_value ?? "—").toLowerCase()}” should be “${(f.fixed_value ?? "—").toLowerCase()}”`);
    }
    byBatch.set(name, b);
  }
  const doneN = Object.keys(round?.results ?? {}).length;
  return (
    <div className="mu mua app ab-B3-SpotCheck" data-board="B3-SpotCheck">
      <div className="blob" />
      <div className="blob2" />
      <AdminTop
        right={
          <A className="link-btn" to="review">
            Stop spot-check
          </A>
        }
      />
      <main className="wrap" style={{ maxWidth: "1080px", paddingTop: "40px" }}>
        <p className="eyebrow">
          Spot-check · {Math.min(items.length, doneN + 1)} of {items.length || 10}
        </p>
        <h1 className="h1" style={{ fontSize: "clamp(36px,4.4vw,60px)" }}>
          {cur ? "Does this look right?" : items.length ? "Round done" : "Nothing to check"}
        </h1>
        <p className="sub">A random sample of pieces the AI saved on its own this week. One tap each. What you fix tells us whether the auto-save bar is set right.</p>
        <div className="dots" aria-hidden="true">
          {(items.length ? items : Array.from({ length: 10 })).map((it, i) => {
            const r = it && round?.results[(it as QueueRow).id];
            return <i key={i} className={r === "ok" ? "d" : r === "fix" ? "f" : i === at ? "n" : ""} />;
          })}
        </div>
        {cur && (
          <section className="panel sec" style={{ marginTop: "36px" }}>
            <div className="sc-card">
              <div className="pic">
                {src &&
                  (() => {
                    const b = cur.box as Box | null;
                    const z = b ? Math.min(4, 1 / Math.max(b.w, b.h, 0.25)) : 1;
                    return <img src={src} alt={t(cur.category_id)?.label ?? "Piece"} style={b ? { transform: `scale(${z})`, transformOrigin: `${(b.x + b.w / 2) * 100}% ${(b.y + b.h / 2) * 100}%` } : undefined} />;
                  })()}
              </div>
              <div className="stack" style={{ gap: "18px" }}>
                <div className="row" style={{ gap: "8px" }}>
                  <span className="bdg ai">AI-saved · {(cur.confidence ?? 0).toFixed(2)}</span>
                  <span className="bdg match">{cur.ingest_items?.ingest_batches?.name ?? "Scan"}</span>
                </div>
                <h2 className="h2" style={{ fontSize: "34px" }}>
                  {t(cur.category_id)?.label ?? "Piece"}
                </h2>
                <div className="scs">
                  <Chip facet="color" term={t(cur.color_id)} />
                  <Chip facet="style" term={t(cur.style_id)} />
                  <Chip facet="material" term={t(cur.material_id)} />
                  {cur.tag_ids.map((x) => (
                    <span className="sc" key={x}>
                      <i>Tag</i>
                      {t(x)?.label}
                    </span>
                  ))}
                </div>
                <p className="p" style={{ fontSize: "16px" }}>
                  Saved by the AI as a scheme{cur.scheme_id ? "" : ""}. Confirming it marks it as checked by a person.
                </p>
                <div className="yn">
                  <button className="opt c" type="button" onClick={() => void ok()}>
                    <span className="tile">
                      <I.check />
                    </span>
                    <span className="opt-t">Looks right</span>
                  </button>
                  <button className="opt b" type="button" onClick={() => void fix()}>
                    <span className="tile">
                      <Ic>{p("M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16zM13 20h7")}</Ic>
                    </span>
                    <span className="opt-t">Fix it</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
        <section className="sec">
          <div className="sec-h">
            <h2>This round so far</h2>
            <span className="small">Fixed items go back through review</span>
          </div>
          <div className="tbl-box">
            <table className="tbl" style={{ minWidth: "600px" }}>
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Checked</th>
                  <th>Fixed</th>
                  <th>What was wrong</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(byBatch.entries()).map(([name, b]) => (
                  <tr key={name}>
                    <td>
                      <b>{name}</b>
                    </td>
                    <td>{b.checked}</td>
                    <td>{b.fixed}</td>
                    <td className={b.wrong.length ? "" : "mut"}>{b.wrong.join("; ") || "—"}</td>
                  </tr>
                ))}
                {!byBatch.size && (
                  <tr>
                    <td colSpan={4} className="mut">
                      Nothing checked yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <section className="panel lav" style={{ marginTop: "20px", padding: "22px 26px" }}>
            <div className="row" style={{ gap: "14px", flexWrap: "nowrap" }}>
              <I.info />
              <p className="p" style={{ fontSize: "16px" }}>
                {doneN >= 10 ? (
                  <>
                    {Array.from(byBatch.values()).reduce((s, b) => s + b.fixed, 0)} of {doneN} needed fixing. If that's more than 1 in 10, raise the auto-save bar in <A to="cms">settings</A>.
                  </>
                ) : (
                  <>
                    After 10 checks you'll see the fix rate per category, with a suggestion to raise or lower the auto-save bar in <A to="cms">settings</A>.
                  </>
                )}
              </p>
            </div>
          </section>
          {!cur && items.length > 0 && (
            <button
              className="btn auto"
              type="button"
              style={{ marginTop: 20 }}
              onClick={() => {
                try {
                  sessionStorage.removeItem(ROUND_KEY);
                } catch {
                  /* ignore */
                }
                setRound(null);
              }}
            >
              Start a new round
            </button>
          )}
        </section>
      </main>
    </div>
  );
}

