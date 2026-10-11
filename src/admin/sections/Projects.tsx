/** Projects support: the list, and G1 · one project, read-only */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";
import { Ic } from "@/journey/icons";
import { STEP_NAMES } from "@/journey/data";
import { A, AdminShell, Crumb, useAdminNav } from "../ui";
import { since } from "./Users";

const STATE: Record<string, string> = { core_shell: "Core & shell", empty: "Empty", partially_furnished: "Partly furnished", redo_all: "Redo it all" };
const initials = (s: string) => s.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
const firstName = (p?: { display_name: string | null; email: string | null } | null) => p?.display_name?.split(/\s+/)[0] ?? p?.email?.split("@")[0] ?? "the user";
const pick = (j: Json | null | undefined, ...keys: string[]) => {
  if (!j || typeof j !== "object" || Array.isArray(j)) return undefined;
  for (const k of keys) {
    const v = (j as Record<string, Json>)[k];
    if (typeof v === "string" && v) return v;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const n = (v as Record<string, Json>).name ?? (v as Record<string, Json>).label;
      if (typeof n === "string") return n;
    }
  }
  return undefined;
};

/* ------------------------------------------------------------------ list */

export function Projects() {
  const { params } = useAdminNav();
  const owner = params.get("owner");
  const [q, setQ] = useState(params.get("q") ?? "");
  const { data } = useQuery({
    queryKey: ["admin-projects", owner],
    queryFn: async () => {
      let pq = supabase.from("projects").select("*").order("updated_at", { ascending: false }).limit(300);
      if (owner) pq = pq.eq("owner_id", owner);
      const { data: projects } = await pq;
      const ids = (projects ?? []).map((p) => p.id);
      const owners = [...new Set((projects ?? []).map((p) => p.owner_id))];
      const [{ data: rooms }, { data: profiles }] = await Promise.all([
        ids.length ? supabase.from("rooms").select("project_id, current_step").in("project_id", ids) : Promise.resolve({ data: [] }),
        owners.length ? supabase.from("profiles").select("user_id, email, display_name").in("user_id", owners) : Promise.resolve({ data: [] }),
      ]);
      const r = new Map<string, number[]>();
      for (const x of (rooms ?? []) as { project_id: string; current_step: number }[]) r.set(x.project_id, [...(r.get(x.project_id) ?? []), x.current_step]);
      return { projects: projects ?? [], rooms: r, who: new Map((profiles ?? []).map((p) => [p.user_id, p])) };
    },
  });
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data?.projects ?? []).filter((p) => !s || p.name.toLowerCase().includes(s) || data?.who.get(p.owner_id)?.email?.toLowerCase().includes(s) || data?.who.get(p.owner_id)?.display_name?.toLowerCase().includes(s));
  }, [data, q]);
  return (
    <AdminShell board="Projects" section="projects">
      <Crumb items={["Projects support"]} />
      <div className="hd">
        <div>
          <h1 className="ah1">Projects support</h1>
          <p className="asub">Find a user's project to see where they are and what they chose. Opening one is read-only and logged in their history.</p>
        </div>
      </div>
      <div className="sec flt">
        <input className="input" style={{ flex: "1 1 320px", maxWidth: "460px" }} placeholder="Search by project, email or name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search projects" />
        {owner && (
          <A to="projects" className="pill on">
            One user · show all
          </A>
        )}
      </div>
      <div className="tbl-box" style={{ marginTop: "20px" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Project</th>
              <th>Owner</th>
              <th>Rooms</th>
              <th>Furthest step</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => {
              const steps = data?.rooms.get(p.id) ?? [];
              const max = steps.length ? Math.max(...steps) : 1;
              const o = data?.who.get(p.owner_id);
              return (
                <tr key={p.id}>
                  <td>
                    <A className="rl" to="projects" extra={{ project: p.id }}>
                      {p.name}
                    </A>
                    {p.archived_at && <div className="mut">Archived</div>}
                  </td>
                  <td>
                    {o?.display_name ?? "—"}
                    <div className="mut">{o?.email}</div>
                  </td>
                  <td>{steps.length}</td>
                  <td>
                    Step {max} · {STEP_NAMES[max]?.toLowerCase()}
                  </td>
                  <td>{since(p.updated_at)}</td>
                </tr>
              );
            })}
            {data && !shown.length && (
              <tr>
                <td colSpan={5} className="mut">
                  No projects found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

/* ------------------------------------------------------------------ G1 */

type Room = Tables<"rooms">;
type Item = Tables<"room_items">;

export function ProjectDetail({ id }: { id: string }) {
  const { data } = useQuery({
    queryKey: ["admin-project", id],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      // Opening a project for support is logged, and shows in the user's history.
      await supabase.from("admin_audit_log").insert({ actor_id: auth.user?.id ?? null, table_name: "projects", row_id: id, action: "support_view" });
      const [{ data: project }, { data: rooms }, { data: collab }, { data: choices }, { data: shops }, { data: log }, { data: steps }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).single(),
        supabase.from("rooms").select("*").eq("project_id", id).order("sequence_no"),
        supabase.from("project_collaborators").select("id").eq("project_id", id),
        supabase.from("project_shop_choices").select("*").eq("project_id", id).maybeSingle(),
        supabase.from("project_shops").select("shop_id, shops(name, status)").eq("project_id", id),
        supabase.from("admin_audit_log").select("*").eq("row_id", id).order("created_at", { ascending: false }).limit(20),
        supabase.from("step_progress").select("*").eq("project_id", id).order("updated_at", { ascending: false }).limit(50),
      ]);
      const ownerId = project?.owner_id;
      const actors = [...new Set([ownerId, ...(log ?? []).map((l) => l.actor_id)].filter(Boolean))] as string[];
      const { data: profiles } = actors.length ? await supabase.from("profiles").select("user_id, email, display_name").in("user_id", actors) : { data: [] };
      return { project, rooms: (rooms ?? []) as Room[], collaborators: collab?.length ?? 0, choices, shops: (shops ?? []) as { shop_id: string; shops: { name: string; status: string } | null }[], log: log ?? [], steps: steps ?? [], who: new Map((profiles ?? []).map((p) => [p.user_id, p])), me: auth.user?.id };
    },
    staleTime: 5 * 60_000,
  });
  const [roomId, setRoomId] = useState<string | null>(null);
  useEffect(() => {
    if (!roomId && data?.rooms.length) setRoomId((data.rooms.find((r) => r.current_step >= 10) ?? data.rooms[0]).id);
  }, [data, roomId]);
  const room = data?.rooms.find((r) => r.id === roomId);
  const owner = data?.project ? data.who.get(data.project.owner_id) : undefined;
  const ownerName = firstName(owner);
  const started = data?.project ? Math.max(0, Math.round((Date.now() - new Date(data.project.created_at).getTime()) / 86400000)) : 0;

  const history = useMemo(() => {
    if (!data) return [];
    const out: { t: string; m: string; at: string }[] = [];
    for (const l of data.log) {
      const who = l.actor_id === data.me ? "you" : l.actor_id === data.project?.owner_id ? ownerName : "support";
      out.push({ t: l.action === "support_view" ? "Support opened the project" : `Project ${l.action.toLowerCase()}`, m: who, at: l.created_at });
    }
    const roomName = (rid: string | null) => data.rooms.find((r) => r.id === rid)?.name ?? "Project";
    for (const s of data.steps) {
      if (s.status === "completed" && s.step_no === 10) out.push({ t: `${roomName(s.room_id)} finished`, m: ownerName, at: s.completed_at ?? s.updated_at });
      else if (s.step_no === 2 && s.started_at) out.push({ t: `${roomName(s.room_id)} started`, m: ownerName, at: s.started_at });
      else if (s.step_no === 1 && s.status === "completed") out.push({ t: "Project set up", m: ownerName, at: s.completed_at ?? s.updated_at });
    }
    // The just-logged view: show it once, at the top.
    const seen = new Set<string>();
    return out
      .sort((a, b) => b.at.localeCompare(a.at))
      .filter((h) => {
        const k = `${h.t}|${h.m}`;
        if (h.t.startsWith("Support opened") && seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 6);
  }, [data, ownerName]);

  return (
    <AdminShell board="G1-Project" section="projects">
      <Crumb items={[["Projects support", "projects"]]} />
      <div className="hd" style={{ marginTop: "12px" }}>
        <div className="who">
          <span className="avatar">{initials(owner?.display_name || owner?.email || "")}</span>
          <div>
            <h1 className="ah1" style={{ margin: "0", fontSize: "34px" }}>
              {data?.project?.name ?? "Project"}
            </h1>
            <p className="small" style={{ margin: "4px 0 0" }}>
              {owner?.email ?? "—"} · owner · started {started === 0 ? "today" : `${started} day${started === 1 ? "" : "s"} ago`} · {data?.collaborators ?? 0} collaborator{data?.collaborators === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="row">
          <span className="ro">
            <Ic>
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </Ic>
            Read-only
          </span>
          <A className="btn ghost sm" to="review">
            Report a bad match
          </A>
        </div>
      </div>
      <section className="panel lav" style={{ marginTop: "20px", padding: "16px 22px" }}>
        <div className="row" style={{ gap: "12px", flexWrap: "nowrap" }}>
          <Ic style={{ color: "#665A85" }}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
          </Ic>
          <p className="p" style={{ fontSize: "15px" }}>
            Opened by you now. This is logged and shown in {ownerName}'s project history.
          </p>
        </div>
      </section>
      <section className="sec">
        <div className="sec-h">
          <h2>Rooms</h2>
          <span className="small">Each room runs steps 2–10 on its own</span>
        </div>
        <div className="rms">
          {(data?.rooms ?? []).map((r) => {
            const step = Math.max(1, Math.min(10, r.current_step));
            const done = r.current_step >= 10 && data?.steps.some((s) => s.room_id === r.id && s.step_no === 10 && s.status === "completed");
            const notStarted = step <= 1 || (step === 2 && !data?.steps.some((s) => s.room_id === r.id && s.step_no >= 2));
            return (
              <button key={r.id} type="button" className={`rm${roomId === r.id ? " on" : ""}`} onClick={() => setRoomId(r.id)} style={{ textAlign: "left", font: "inherit", cursor: "pointer" }}>
                <b>{r.name}</b>
                <span className="segs">
                  {Array.from({ length: 10 }, (_, i) => (
                    <span key={i} className={`seg${i + 1 < step || done || i === 0 ? " done" : i + 1 === step && !notStarted ? " now" : ""}`} />
                  ))}
                </span>
                {done || step >= 10 ? (
                  <span className="bdg saved" style={{ alignSelf: "flex-start" }}>
                    Step 10 · done
                  </span>
                ) : notStarted ? (
                  <span className="bdg idle" style={{ alignSelf: "flex-start" }}>
                    Not started
                  </span>
                ) : (
                  <span className="bdg match" style={{ alignSelf: "flex-start" }}>
                    Step {step} · {STEP_NAMES[step]?.toLowerCase()}
                  </span>
                )}
              </button>
            );
          })}
          {data && !data.rooms.length && <p className="mut">No rooms yet — the user is still on step 1.</p>}
        </div>
      </section>
      {room && data && <RoomDetail room={room} choices={data.choices} shops={data.shops} />}
      {!room && (
        <aside className="rail-card sec">
          <HistoryList rows={history} />
        </aside>
      )}
      {room && (
        <div className="work" style={{ marginTop: "0" }}>
          <section className="w-main" />
          <aside className="w-side">
            <div className="rail-card" style={{ marginTop: "16px" }}>
              <HistoryList rows={history} />
            </div>
          </aside>
        </div>
      )}
    </AdminShell>
  );
}

function HistoryList({ rows }: { rows: { t: string; m: string; at: string }[] }) {
  return (
    <>
      <h2 className="h3" style={{ fontSize: "19px" }}>
        Project history
      </h2>
      <div>
        {rows.map((h, i) => (
          <div className="lr" key={i}>
            <span>
              <span className="t">{h.t}</span>
              <br />
              <span className="m">
                {since(h.at)} · {h.m}
              </span>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function RoomDetail({ room, choices, shops }: { room: Room; choices: Tables<"project_shop_choices"> | null; shops: { shop_id: string; shops: { name: string; status: string } | null }[] }) {
  const { data } = useQuery({
    queryKey: ["admin-project-room", room.id],
    queryFn: async () => {
      const [{ data: items }, { data: designs }, { data: scope }, { data: points }] = await Promise.all([
        supabase.from("room_items").select("*, products!room_items_product_id_fkey(image_url, name), shop_products!room_items_shop_product_id_fkey(image_urls, name)").eq("room_id", room.id).order("sort_order"),
        supabase.from("generated_designs").select("id, image_url, is_kept, created_at").eq("room_id", room.id).order("is_kept", { ascending: false }).order("created_at", { ascending: false }).limit(1),
        supabase.from("room_scope").select("area, mode").eq("room_id", room.id),
        supabase.from("room_service_points").select("id", { count: "exact", head: true }).eq("room_id", room.id).eq("service", "electrical" as never),
      ]);
      const design = designs?.[0];
      let combo: { name: string | null; score: number } | undefined;
      if (design) {
        const { data: link } = await supabase.from("design_scheme_links").select("combination_id").eq("design_id", design.id).not("combination_id", "is", null).limit(1);
        const cid = link?.[0]?.combination_id;
        if (cid) {
          const { data: sc } = await supabase.from("mv_combination_scores").select("name, score").eq("combination_id", cid).maybeSingle();
          if (sc) combo = { name: sc.name, score: Number(sc.score ?? 0) };
        }
      }
      return { items: (items ?? []) as (Item & { products: { image_url: string | null } | null; shop_products: { image_urls: string[] | null } | null })[], design, combo, scope: scope ?? [], electricPoints: (points as unknown as { count?: number })?.count ?? 0 };
    },
  });
  const kept = (data?.items ?? []).filter((i) => i.source === "existing_kept").map((i) => i.label.toLowerCase());
  const style = pick(room.style, "name", "style", "label");
  const palette = pick(room.style, "palette", "palette_name");
  const layout = pick(room.layout, "label", "option", "name");
  const own = shops.filter((s) => s.shops);
  const waiting = own.filter((s) => s.shops?.status === "pending").length;
  const shopping = [choices?.use_suggested !== false && "Suggested furniture", (choices?.use_own_shops || own.length) && `${own.length} own shop${own.length === 1 ? "" : "s"}`, choices?.use_custom_made && "custom made"].filter(Boolean) as string[];
  const furniture = (data?.items ?? []).filter((i) => i.item_type === "furniture");
  const open: string[] = [];
  if (furniture.length && furniture.some((i) => !i.furniture_spec_id)) open.push("Exact sizes");
  if (data?.scope.some((s) => s.area === "electrical" && s.mode === "in_scope") && !data.electricPoints) open.push("Electrical positions");
  const buy = (data?.items ?? []).filter((i) => i.source !== "existing_kept" && i.item_type !== "finish").slice(0, 5);
  const badge = (i: Item) =>
    i.action === "custom" ? ["match", "Quote"] : i.sourcing === "own_shop" || (i.shop_product_id && !i.chosen_product_id) ? ["review", "Check"] : i.chosen_product_id || i.decision === "keep" ? ["saved", "Chosen"] : ["idle", "Open"];
  const sub = (i: Item) => (i.action === "custom" ? "Custom made" : i.sourcing === "own_shop" || i.shop_product_id ? "From own shop" : [i.quantity_note, i.supplier].filter(Boolean).join(" · ") || "Suggested");
  return (
    <div className="work sec">
      <section className="w-main">
        <div className="prev">{data?.design ? <img src={data.design.image_url} alt={`${room.name} preview the user ${data.design.is_kept ? "kept" : "generated"}`} /> : <div style={{ aspectRatio: "2.1/1", background: "#F0EAF1" }} />}</div>
        <div className="panel" style={{ marginTop: "18px", padding: "8px 28px" }}>
          <div className="dec">
            <span className="k">Starting point</span>
            <span className="v">
              {room.starting_state ? STATE[room.starting_state] : "—"}
              {kept.length > 0 && (
                <>
                  {" "}
                  · keeping{" "}
                  {kept.slice(0, 3).map((k, i) => (
                    <span key={k}>
                      {i ? ", " : ""}
                      <b>{k}</b>
                    </span>
                  ))}
                </>
              )}
            </span>
          </div>
          <div className="dec">
            <span className="k">Style</span>
            <span className="v">
              {style ?? "Not chosen yet"}
              {palette && (
                <>
                  {" "}
                  · palette <b>{palette}</b>
                </>
              )}
            </span>
          </div>
          <div className="dec">
            <span className="k">Shopping</span>
            <span className="v">
              {shopping.length ? shopping.map((s, i) => (i ? <b key={s}> + {s}</b> : <span key={s}>{s}</span>)) : "Not set yet"}
              {waiting > 0 && <span className="tag tbc"> {waiting} waiting approval</span>}
            </span>
          </div>
          <div className="dec">
            <span className="k">Layout</span>
            <span className="v">{layout ?? "Not chosen yet"}</span>
          </div>
          <div className="dec">
            <span className="k">Combination used</span>
            <span className="v">
              {data?.combo ? (
                <>
                  {data.combo.name ?? "Combination"} ·{" "}
                  <A to="schemes" extra={{ tab: "combinations" }}>
                    score {data.combo.score.toFixed(2)}
                  </A>
                </>
              ) : (
                "—"
              )}
            </span>
          </div>
          <div className="dec">
            <span className="k">Still open</span>
            <span className="v">
              {open.length
                ? open.map((o) => (
                    <span className="tag tbc" key={o}>
                      {o}
                    </span>
                  ))
                : "Nothing"}
            </span>
          </div>
        </div>
      </section>
      <aside className="w-side">
        <div className="rail-card">
          <h2 className="h3" style={{ fontSize: "19px" }}>
            Buying list · {room.name.toLowerCase()}
          </h2>
          <div>
            {buy.map((i) => {
              const img = i.products?.image_url ?? i.shop_products?.image_urls?.[0];
              const [cls, txt] = badge(i);
              return (
                <div className="lr" key={i.id}>
                  {img ? <img className="sq" src={img} alt="" /> : <span className="sq" style={{ background: "#F0EAF1" }} />}
                  <span>
                    <span className="t">{i.label}</span>
                    <br />
                    <span className="m">{sub(i)}</span>
                  </span>
                  <span className={`end bdg ${cls}`}>{txt}</span>
                </div>
              );
            })}
            {data && !buy.length && <div className="lr m">No buying list yet (step 9).</div>}
          </div>
        </div>
      </aside>
    </div>
  );
}
