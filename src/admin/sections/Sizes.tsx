// @ts-nocheck -- tables/columns come from migrations not yet applied to this backend; re-enable once applied.
/** F1 · Sizes, scope & design config */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/looseDb";
import type { Tables } from "@/lib/looseDb";
import { useToast } from "@/hooks/use-toast";
import { useTerms } from "@/admin/data";
import RoomFurnitureManager from "@/components/admin/RoomFurnitureManager";
import RoomActivitiesManager from "@/components/admin/RoomActivitiesManager";
import OpeningRulesManager from "@/components/admin/OpeningRulesManager";
import PromptTemplateManager from "@/components/admin/PromptTemplateManager";
import FurnitureSpecsManager from "@/components/admin/FurnitureSpecsManager";
import { AdminShell, Crumb } from "../ui";

type Spec = Tables<"furniture_specs">;
type Scope = Tables<"scope_defaults"> & { room_type?: string };
type Tab = "sizes" | "furniture" | "activities" | "openings" | "prompts" | "all";
const TABS: [Tab, string][] = [["sizes", "Standard sizes"], ["furniture", "Room furniture"], ["activities", "Room activities"], ["openings", "Opening rules"], ["prompts", "Prompt templates"]];
const STATES: [Scope["starting_state"], string][] = [["core_shell", "Core & shell"], ["empty", "Empty"], ["partially_furnished", "Partly furnished"], ["redo_all", "Redo it all"]];
export const AREA_LABEL: Record<string, string> = {
  furniture: "All furniture", walls_finishes: "Walls & paint", floors: "Flooring", lighting: "Lighting", built_ins: "Built-ins", electrical: "Electrics",
  water_plumbing: "Water points", ac_ventilation: "AC points", heating: "Heating", data_tv_sound: "Data & TV", decor: "Decor",
};
const DIMS: [keyof Spec, string][] = [["width_cm", "Width"], ["depth_cm", "Depth"], ["height_cm", "Height"], ["min_clearance_cm", "Clearance"]];

export function Sizes() {
  const [tab, setTab] = useState<Tab>("sizes");
  return (
    <AdminShell board="F1-Sizes" section="sizes">
      <Crumb items={["Curate"]} />
      <h1 className="ah1">Sizes, scope & design config</h1>
      <p className="asub">Standard sizes fill the size step for users (they can still edit them). Scope defaults decide what's pre-selected for each kind of room and starting point.</p>
      <div className="sec">
        <div className="seg-ctl" role="tablist" aria-label="Config areas" style={{ flexWrap: "wrap" }}>
          {TABS.slice(0, 1).map(([id, l]) => (
            <a key={id} href="#" role="tab" aria-selected={tab === id} className={tab === id ? "on" : undefined} onClick={(e) => { e.preventDefault(); setTab(id); }}>
              {l}
            </a>
          ))}
          <a href="#scope" role="tab" aria-selected={false} onClick={() => setTab("sizes")}>
            Scope defaults
          </a>
          {TABS.slice(1).map(([id, l]) => (
            <a key={id} href="#" role="tab" aria-selected={tab === id} className={tab === id ? "on" : undefined} onClick={(e) => { e.preventDefault(); setTab(id); }}>
              {l}
            </a>
          ))}
        </div>
      </div>
      {tab === "sizes" ? (
        <>
          <StandardSizes onAll={() => setTab("all")} />
          <ScopeDefaults />
        </>
      ) : (
        <div className="legacy sec">
          {tab === "furniture" && <RoomFurnitureManager />}
          {tab === "activities" && <RoomActivitiesManager />}
          {tab === "openings" && <OpeningRulesManager />}
          {tab === "prompts" && <PromptTemplateManager />}
          {tab === "all" && <FurnitureSpecsManager />}
        </div>
      )}
    </AdminShell>
  );
}

function StandardSizes({ onAll }: { onAll: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: terms } = useTerms();
  const { data } = useQuery({
    queryKey: ["admin-sizes"],
    queryFn: async () => {
      const [{ data: specs }, { data: used }] = await Promise.all([
        supabase.from("furniture_specs").select("*").order("width_cm"),
        supabase.from("furniture_schemes").select("category_id").eq("status", "active").limit(10000),
      ]);
      const uses = new Map<string, number>();
      for (const u of used ?? []) uses.set(u.category_id, (uses.get(u.category_id) ?? 0) + 1);
      return { specs: specs ?? [], uses };
    },
  });
  // Categories: every category term that has sizes or is used by schemes; plus sizes not linked to a term (by name).
  const cats = useMemo(() => {
    const out = new Map<string, { key: string; label: string; termId: string | null; specs: Spec[]; uses: number }>();
    for (const s of data?.specs ?? []) {
      const key = s.category_term_id ?? `name:${s.category ?? s.name}`;
      const label = (s.category_term_id && terms?.byId.get(s.category_term_id)?.label) || s.category || s.name;
      const e = out.get(key) ?? { key, label, termId: s.category_term_id, specs: [], uses: s.category_term_id ? data?.uses.get(s.category_term_id) ?? 0 : 0 };
      e.specs.push(s);
      out.set(key, e);
    }
    for (const [id, n] of data?.uses ?? []) if (!out.has(id)) out.set(id, { key: id, label: terms?.byId.get(id)?.label ?? "Category", termId: id, specs: [], uses: n });
    return [...out.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [data, terms]);
  const missing = cats.filter((c) => !c.specs.length);
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => {
    if (!sel && cats.length) setSel([...cats].sort((a, b) => b.uses - a.uses || b.specs.length - a.specs.length)[0].key);
  }, [cats, sel]);
  const cur = cats.find((c) => c.key === sel);
  const [rows, setRows] = useState<Partial<Spec>[]>([]);
  useEffect(() => setRows(cur ? cur.specs.map((s) => ({ ...s })) : []), [cur]);

  const save = useMutation({
    mutationFn: async () => {
      if (!cur) return;
      for (const r of rows) {
        if (!r.variant?.trim()) throw new Error("Every size needs a variant name.");
        const row = { name: r.name || cur.label, variant: r.variant.trim(), width_cm: Number(r.width_cm) || 0, depth_cm: Number(r.depth_cm) || 0, height_cm: r.height_cm == null || r.height_cm === ("" as unknown) ? null : Number(r.height_cm), min_clearance_cm: Number(r.min_clearance_cm) || 0, is_default: !!r.is_default, category_term_id: cur.termId, category: r.category ?? cur.label };
        const { error } = r.id ? await supabase.from("furniture_specs").update(row).eq("id", r.id) : await supabase.from("furniture_specs").insert({ ...row, source: "admin" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sizes"] });
      qc.invalidateQueries({ queryKey: ["admin-counts"] });
      toast({ title: "Sizes saved" });
    },
    onError: (e: Error) => toast({ title: "Could not save sizes", description: e.message, variant: "destructive" }),
  });
  const set = (i: number, patch: Partial<Spec>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : patch.is_default ? { ...x, is_default: false } : x)));
  const maxW = Math.max(1, ...rows.map((r) => Number(r.width_cm) || 0));

  return (
    <>
      {missing.length > 0 && (
        <section className="panel tint" style={{ marginTop: "20px", padding: "20px 24px" }}>
          <div className="miss">
            <b style={{ color: "#7A4A1E" }}>
              {missing.length} categor{missing.length === 1 ? "y has" : "ies have"} schemes but no standard size
            </b>
            {missing.slice(0, 6).map((m) => (
              <span className="sc" key={m.key}>
                {m.label}
              </span>
            ))}
            <a href="#" style={{ marginLeft: "auto", fontWeight: "600" }} onClick={(e) => { e.preventDefault(); setSel(missing[0].key); }}>
              Add sizes
            </a>
          </div>
        </section>
      )}
      <div className="cat sec">
        <nav className="cat-l" aria-label="Categories">
          {cats.map((c) => (
            <a key={c.key} href="#" className={`${c.key === sel ? "on" : ""}${c.specs.length ? "" : " ms"}`.trim() || undefined} onClick={(e) => { e.preventDefault(); setSel(c.key); }}>
              {c.label}
              <small>{c.specs.length ? `${c.specs.length} size${c.specs.length === 1 ? "" : "s"}` : "Missing"}</small>
            </a>
          ))}
        </nav>
        <section className="cat-r">
          <div className="tbl-box">
            <table className="tbl" style={{ minWidth: "680px" }}>
              <thead>
                <tr>
                  <th>Variant</th>
                  {DIMS.map(([, l]) => (
                    <th key={l}>{l}</th>
                  ))}
                  <th>Default</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id ?? `new-${i}`} className={r.is_default ? "hl" : undefined}>
                    <td>{r.id ? <b>{r.variant}</b> : <span className="dmi"><input style={{ width: "120px" }} value={r.variant ?? ""} placeholder="e.g. 3-seat" aria-label="Variant" onChange={(e) => set(i, { variant: e.target.value })} /></span>}</td>
                    {DIMS.map(([k, l]) => (
                      <td key={k}>
                        <span className="dmi">
                          <input inputMode="numeric" value={(r[k] as number | null) ?? ""} aria-label={`${l} ${r.variant ?? ""}`} onChange={(e) => set(i, { [k]: e.target.value.replace(/[^\d]/g, "") } as Partial<Spec>)} />
                          <span>cm</span>
                        </span>
                      </td>
                    ))}
                    <td>
                      <input className="chk" type="radio" name="def" checked={!!r.is_default} onChange={() => set(i, { is_default: true })} aria-label={`Default ${r.variant ?? ""}`} />
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={6} className="mut">
                      No standard size yet. Add a variant so the size step can suggest one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {rows.length > 0 && (
            <div className="sk" aria-hidden="true">
              {rows.map((r, i) => (
                <div key={r.id ?? i}>
                  <i style={{ width: `${Math.max(24, ((Number(r.width_cm) || 0) / maxW) * 150)}px`, height: `${Math.max(16, ((Number(r.depth_cm) || 0) / maxW) * 150)}px`, borderRadius: /curve|round/i.test(r.variant ?? "") ? "60px 60px 10px 10px" : undefined }} />
                  {r.variant}
                </div>
              ))}
            </div>
          )}
          <div className="actions" style={{ marginTop: "18px" }}>
            <button className="btn ghost sm" type="button" disabled={!cur} onClick={() => setRows((r) => [...r, { variant: "", width_cm: 80, depth_cm: 60, height_cm: null, min_clearance_cm: 40, is_default: !r.length }])}>
              Add variant
            </button>
            {cur && (
              <span className="small">
                {cur.termId ? `Linked to the category term “${cur.label}”` : `Not linked to a category term`} · used by {cur.uses} scheme{cur.uses === 1 ? "" : "s"} ·{" "}
                <a href="#" onClick={(e) => { e.preventDefault(); onAll(); }}>
                  All sizes & rules
                </a>
              </span>
            )}
            <button className="btn sm" type="button" style={{ marginLeft: "auto" }} disabled={!cur || save.isPending} onClick={() => save.mutate()}>
              Save sizes
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

function ScopeDefaults() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: terms } = useTerms();
  const rooms = (terms?.list ?? []).filter((x) => x.facet === "room_type" && x.status === "active");
  const [room, setRoom] = useState("");
  useEffect(() => {
    if (!room && rooms.length) setRoom((rooms.find((r) => /living/i.test(r.label)) ?? rooms[0]).slug);
  }, [rooms, room]);
  const { data } = useQuery({ queryKey: ["scope-defaults"], queryFn: async () => ((await supabase.from("scope_defaults").select("*")).data ?? []) as Scope[] });
  const rowsFor = (state: Scope["starting_state"]) => {
    const all = (data ?? []).filter((r) => r.starting_state === state);
    const own = all.filter((r) => r.room_type === room);
    const base = all.filter((r) => (r.room_type ?? "any") === "any");
    const m = new Map(base.map((r) => [r.area, r]));
    for (const r of own) m.set(r.area, r);
    return [...m.values()];
  };
  const toggle = useMutation({
    mutationFn: async ({ state, area, on }: { state: Scope["starting_state"]; area: string; on: boolean }) => {
      // Write this room's own copy of the whole row, so other rooms keep the shared defaults.
      const rows = rowsFor(state).map((r) => ({ room_type: room, starting_state: state, area: r.area, hint: r.hint, mode: r.area === area ? (on ? "in_scope" : state === "empty" ? "kept_as_is" : "on_request") : r.mode }));
      const { error } = await supabase.from("scope_defaults").upsert(rows as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["scope-defaults"] }),
    onError: (e: Error) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });
  const roomLabel = rooms.find((r) => r.slug === room)?.label ?? "All rooms";
  const chip = (state: Scope["starting_state"], r: Scope, on: boolean) => (
    <button key={r.area} type="button" className="sc" title={on ? "Click to turn off by default" : "Click to pre-select"} onClick={() => toggle.mutate({ state, area: r.area, on: !on })}>
      {AREA_LABEL[r.area] ?? r.area.replace(/_/g, " ")}
    </button>
  );
  return (
    <section className="sec" id="scope">
      <div className="sec-h">
        <h2>Scope defaults · {roomLabel}</h2>
        <select className="select" aria-label="Room type" style={{ width: "auto", minHeight: "44px", fontSize: "15px" }} value={room} onChange={(e) => setRoom(e.target.value)}>
          {rooms.map((r) => (
            <option key={r.id} value={r.slug}>
              {r.label}
            </option>
          ))}
          {!rooms.length && <option value="">All rooms</option>}
        </select>
      </div>
      <div className="tbl-box">
        <table className="tbl scope">
          <thead>
            <tr>
              <th>Starting point</th>
              <th>Pre-selected in scope</th>
              <th>Off by default</th>
            </tr>
          </thead>
          <tbody>
            {STATES.map(([s, l]) => {
              const rows = rowsFor(s);
              const on = rows.filter((r) => r.mode === "in_scope"), off = rows.filter((r) => r.mode !== "in_scope");
              return (
                <tr key={s}>
                  <td>
                    <b>{l}</b>
                  </td>
                  <td>
                    <div className="scs">{on.map((r) => chip(s, r, true))}</div>
                  </td>
                  <td>{off.length ? <div className="scs">{off.map((r) => chip(s, r, false))}</div> : <span className="mut">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="small" style={{ marginTop: "10px" }}>Click a word to move it between the two columns. Changes apply to new rooms of this type.</p>
    </section>
  );
}
