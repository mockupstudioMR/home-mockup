/** X1 · Users & invites */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { A, AdminShell, Crumb } from "../ui";

type Role = Tables<"user_roles">["role"];
const ROLE: Record<Role, [string, string]> = { admin: ["ad", "Admin"], designer: ["de", "Designer"], furniture_shop: ["re", "Retailer"], user: ["us", "User"] };
const RANK: Role[] = ["admin", "designer", "furniture_shop", "user"];
const initials = (s: string) => s.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
const shortName = (n: string | null, email: string | null) => {
  if (n) {
    const [a, b] = n.trim().split(/\s+/);
    return b ? `${a} ${b[0]}.` : a;
  }
  return email?.split("@")[0] ?? "Unknown";
};
export const since = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const mins = (Date.now() - new Date(iso).getTime()) / 60000;
  if (mins < 5) return "Now";
  const d = new Date(iso), today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const days = Math.floor((today.setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86400000);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return d.toLocaleDateString();
};

export function Users() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Role | "all">("all");
  const [manage, setManage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("designer");
  const [creating, setCreating] = useState(false);
  const [acc, setAcc] = useState({ email: "", password: "", displayName: "", role: "user" as Role });

  const { data } = useQuery({
    queryKey: ["admin-users2"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }, { data: projects }, { data: rooms }, { data: collab }, { data: events }] = await Promise.all([
        supabase.from("profiles").select("user_id, email, display_name, updated_at").order("updated_at", { ascending: false }).limit(2000),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("projects").select("id, owner_id").is("archived_at", null).limit(10000),
        supabase.from("rooms").select("project_id").not("project_id", "is", null).limit(20000),
        supabase.from("project_collaborators").select("user_id").not("user_id", "is", null).limit(10000),
        supabase.from("analytics_events").select("user_id, created_at").order("created_at", { ascending: false }).limit(5000),
      ]);
      const rolesOf = new Map<string, Role[]>();
      for (const r of roles ?? []) rolesOf.set(r.user_id, [...(rolesOf.get(r.user_id) ?? []), r.role]);
      const roomsOf = new Map<string, number>();
      for (const r of rooms ?? []) roomsOf.set(r.project_id!, (roomsOf.get(r.project_id!) ?? 0) + 1);
      const owned = new Map<string, { n: number; rooms: number; first: string }>();
      for (const p of projects ?? []) {
        const e = owned.get(p.owner_id) ?? { n: 0, rooms: 0, first: p.id };
        e.n++;
        e.rooms += roomsOf.get(p.id) ?? 0;
        owned.set(p.owner_id, e);
      }
      const shared = new Map<string, number>();
      for (const c of collab ?? []) shared.set(c.user_id!, (shared.get(c.user_id!) ?? 0) + 1);
      const last = new Map<string, string>();
      for (const e of events ?? []) if (!last.has(e.user_id)) last.set(e.user_id, e.created_at);
      const users = (profiles ?? []).map((p) => {
        const rs = rolesOf.get(p.user_id) ?? [];
        const top = RANK.find((r) => rs.includes(r)) ?? "user";
        return { ...p, roles: rs, role: top, owned: owned.get(p.user_id), shared: shared.get(p.user_id) ?? 0, last: last.get(p.user_id) ?? p.updated_at };
      });
      return { users };
    },
  });
  const { data: invites } = useQuery({
    queryKey: ["admin-invites"],
    queryFn: async () => (await supabase.from("role_invites").select("*").eq("status", "pending").order("created_at", { ascending: false })).data ?? [],
  });
  const users = data?.users ?? [];
  const count = (r: Role) => users.filter((u) => u.role === r).length;
  const shown = filter === "all" ? users : users.filter((u) => u.role === filter);
  const link = (token: string) => `${window.location.origin}/auth?invite=${token}`;
  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(link(token));
    } catch {
      /* clipboard may be blocked */
    }
  };

  const invite = useMutation({
    mutationFn: async () => {
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error("Enter a valid email.");
      const { data: row, error } = await supabase.from("role_invites").insert({ role, email: email.trim() }).select().single();
      if (error) throw error;
      return row;
    },
    onSuccess: async (row) => {
      await copy(row.token);
      setEmail("");
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
      toast({ title: "Invite created", description: "The invite link is copied — send it to them." });
    },
    onError: (e: Error) => toast({ title: "Could not invite", description: e.message, variant: "destructive" }),
  });
  const resend = useMutation({
    mutationFn: async (inv: Tables<"role_invites">) => {
      const { error } = await supabase.from("role_invites").update({ expires_at: new Date(Date.now() + 14 * 86400000).toISOString() }).eq("id", inv.id);
      if (error) throw error;
      await copy(inv.token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invites"] });
      toast({ title: "Invite renewed for 14 days", description: "Link copied again." });
    },
  });
  const setUserRole = useMutation({
    mutationFn: async ({ userId, role, on }: { userId: string; role: Role; on: boolean }) => {
      const { error } = on ? await supabase.from("user_roles").insert({ user_id: userId, role }) : await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users2"] }),
    onError: (e: Error) => toast({ title: "Could not change the role", description: e.message, variant: "destructive" }),
  });
  const create = useMutation({
    mutationFn: async () => {
      const { data: res, error } = await supabase.functions.invoke("create-user", { body: { ...acc, displayName: acc.displayName || undefined } });
      if (error) throw error;
      if (res?.error) throw new Error(res.error);
    },
    onSuccess: () => {
      setCreating(false);
      setAcc({ email: "", password: "", displayName: "", role: "user" });
      qc.invalidateQueries({ queryKey: ["admin-users2"] });
      toast({ title: "Account created" });
    },
    onError: (e: Error) => toast({ title: "Could not create the account", description: e.message, variant: "destructive" }),
  });

  return (
    <AdminShell board="X1-Users" section="users">
      <Crumb items={["Run"]} />
      <div className="hd">
        <div>
          <h1 className="ah1">Users & invites</h1>
          <p className="asub">Find people by email or name, see their projects, and give out roles by invite.</p>
        </div>
        <button className="btn ghost sm" type="button" onClick={() => setCreating((c) => !c)}>
          Create account
        </button>
      </div>
      {creating && (
        <div className="row sec" style={{ gap: "10px", flexWrap: "wrap" }}>
          <input className="input" style={{ flex: "1 1 200px" }} placeholder="Email" value={acc.email} onChange={(e) => setAcc({ ...acc, email: e.target.value })} aria-label="Email" />
          <input className="input" style={{ flex: "1 1 160px" }} placeholder="Name" value={acc.displayName} onChange={(e) => setAcc({ ...acc, displayName: e.target.value })} aria-label="Name" />
          <input className="input" style={{ flex: "1 1 160px" }} type="password" placeholder="Password (8+)" value={acc.password} onChange={(e) => setAcc({ ...acc, password: e.target.value })} aria-label="Password" />
          <select className="select" style={{ flex: "0 1 150px" }} value={acc.role} onChange={(e) => setAcc({ ...acc, role: e.target.value as Role })} aria-label="Role">
            {RANK.map((r) => (
              <option key={r} value={r}>
                {ROLE[r][1]}
              </option>
            ))}
          </select>
          <button className="btn sm" type="button" disabled={create.isPending || !acc.email || acc.password.length < 8} onClick={() => create.mutate()}>
            Create
          </button>
        </div>
      )}
      <div className="work sec">
        <section className="w-main">
          <div className="flt" style={{ marginBottom: "14px" }}>
            <button className={`pill${filter === "all" ? " on" : ""}`} type="button" onClick={() => setFilter("all")}>
              All
            </button>
            {(["admin", "designer", "furniture_shop"] as Role[]).map((r) => (
              <button key={r} className={`pill${filter === r ? " on" : ""}`} type="button" onClick={() => setFilter(r)}>
                {ROLE[r][1]}s <em>{count(r)}</em>
              </button>
            ))}
          </div>
          <div className="tbl-box">
            <table className="tbl">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Projects</th>
                  <th>Last sign-in</th>
                  <th>
                    <span className="sr">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((u) => [
                  <tr key={u.user_id}>
                    <td>
                      <div className="u">
                        <span className="avatar">{initials(u.display_name || u.email || "")}</span>
                        <span>
                          <b>{shortName(u.display_name, u.email)}</b>
                          <br />
                          <span className="mut">{u.email}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`role ${ROLE[u.role][0]}`}>{ROLE[u.role][1]}</span>
                    </td>
                    <td>
                      {u.owned ? (
                        <A to="projects" extra={u.owned.n === 1 ? { project: u.owned.first } : { owner: u.user_id }}>
                          {u.owned.n} · {u.owned.rooms} room{u.owned.rooms === 1 ? "" : "s"}
                        </A>
                      ) : u.shared ? (
                        `${u.shared} shared`
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{since(u.last)}</td>
                    <td>
                      <a href="#" style={{ fontWeight: "600" }} onClick={(e) => { e.preventDefault(); setManage(manage === u.user_id ? null : u.user_id); }}>
                        {manage === u.user_id ? "Close" : "Manage"}
                      </a>
                    </td>
                  </tr>,
                  manage === u.user_id && (
                    <tr key={`${u.user_id}-m`}>
                      <td colSpan={5}>
                        <div className="row" style={{ gap: "10px", flexWrap: "wrap" }}>
                          <span className="small">Roles:</span>
                          {(["admin", "designer", "furniture_shop"] as Role[]).map((r) => {
                            const on = u.roles.includes(r);
                            return (
                              <button key={r} type="button" className={`pill${on ? " on" : ""}`} aria-pressed={on} onClick={() => setUserRole.mutate({ userId: u.user_id, role: r, on: !on })}>
                                {on ? "✓ " : ""}
                                {ROLE[r][1]}
                              </button>
                            );
                          })}
                          {u.owned && (
                            <A to="projects" extra={{ owner: u.user_id }} className="btn soft sm" style={{ marginLeft: "auto" }}>
                              Open projects
                            </A>
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                ])}
                {data && !shown.length && (
                  <tr>
                    <td colSpan={5} className="mut">
                      Nobody here yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <aside className="w-side">
          <div className="rail-card">
            <h2 className="h3" style={{ fontSize: "19px" }}>
              Invite someone
            </h2>
            <div className="field">
              <label htmlFor="ie">Email</label>
              <input id="ie" className="input" placeholder="name@studio.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="ir">Role</label>
              <select id="ir" className="select" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option value="designer">Designer</option>
                <option value="furniture_shop">Retailer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <p className="small" style={{ margin: "0" }}>
              They get a link; the role is given when they accept. Roles can't be picked at sign-up.
            </p>
            <button className="btn sm" type="button" style={{ width: "100%" }} disabled={invite.isPending} onClick={() => invite.mutate()}>
              Send invite
            </button>
          </div>
          <div className="rail-card" style={{ marginTop: "16px" }}>
            <h2 className="h3" style={{ fontSize: "19px" }}>
              Pending invites
            </h2>
            <div>
              {(invites ?? []).map((i) => (
                <div className="lr" key={i.id}>
                  <span>
                    <span className="t">{i.email ?? "Link invite"}</span>
                    <br />
                    <span className="m">
                      {ROLE[i.role][1]} · sent {since(i.created_at).toLowerCase()}
                    </span>
                  </span>
                  <span className="end">
                    <a href="#" style={{ fontWeight: "600", fontSize: "14px" }} onClick={(e) => { e.preventDefault(); resend.mutate(i); }}>
                      Resend
                    </a>
                  </span>
                </div>
              ))}
              {invites && !invites.length && <div className="lr m">No invites waiting.</div>}
            </div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
