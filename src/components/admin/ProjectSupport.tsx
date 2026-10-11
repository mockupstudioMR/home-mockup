import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Lock, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./library/shared";

const SOURCING: Record<string, string> = {
  suggested: "Suggested",
  own_shop: "Own shop",
  custom_made: "Custom made",
  keep_existing: "Keeping",
};

/** Read-only view of a user's project for support. Every open is written to the admin audit log. */
export default function ProjectSupport() {
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  const search = useMutation({
    mutationFn: async (q: string) => {
      const term = q.trim();
      if (!term) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, display_name")
        .or(`email.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(20);
      const owners = (profiles ?? []).map((p) => p.user_id);
      const [{ data: byOwner }, { data: byName }] = await Promise.all([
        owners.length ? supabase.from("projects").select("*").in("owner_id", owners) : Promise.resolve({ data: [] }),
        supabase.from("projects").select("*").ilike("name", `%${term}%`).limit(20),
      ]);
      const all = [...(byOwner ?? []), ...(byName ?? [])];
      const unique = Array.from(new Map(all.map((p) => [p.id, p])).values());
      const prof = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      if (unique.some((p) => !prof.has(p.owner_id))) {
        const { data: more } = await supabase.from("profiles").select("user_id, email, display_name").in("user_id", unique.map((p) => p.owner_id));
        (more ?? []).forEach((p) => prof.set(p.user_id, p));
      }
      return unique.map((p) => ({ ...p, owner: prof.get(p.owner_id) }));
    },
  });

  const { data: detail } = useQuery({
    queryKey: ["support-project", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const id = projectId!;
      const [{ data: project }, { data: rooms }, { data: progress }, { data: choices }, { data: shops }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", id).single(),
        supabase.from("rooms").select("*").eq("project_id", id).order("sequence_no"),
        supabase.from("step_progress").select("*").eq("project_id", id),
        supabase.from("project_shop_choices").select("*").eq("project_id", id).maybeSingle(),
        supabase.from("project_shops").select("added_at, shops(name, domain, status, product_count)").eq("project_id", id),
      ]);
      const { data: auth } = await supabase.auth.getUser();
      await supabase.from("admin_audit_log").insert({ actor_id: auth.user?.id ?? null, table_name: "projects", row_id: id, action: "support_view" });
      return { project, rooms: rooms ?? [], progress: progress ?? [], choices, shops: shops ?? [] };
    },
  });

  const activeRoom = roomId ?? detail?.rooms[0]?.id ?? null;
  const { data: items } = useQuery({
    queryKey: ["support-room-items", activeRoom],
    enabled: !!activeRoom,
    queryFn: async () => (await supabase.from("room_items").select("*").eq("room_id", activeRoom!).order("created_at")).data ?? [],
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Projects support</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">Find a project by the owner&apos;s email or name, or by project name. Read-only; every open is logged.</p>
      </div>

      <form
        className="flex max-w-xl gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setProjectId(null);
          search.mutate(query);
        }}
      >
        <Input aria-label="Search projects" placeholder="Email, name or project name" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Button type="submit"><Search className="mr-2 h-4 w-4" /> Find</Button>
      </form>

      {!projectId && search.data && (
        <Card>
          <CardContent className="divide-y pt-2">
            {search.data.length === 0 && <p className="py-4 text-muted-foreground">No projects found. Users of the earlier journey have no project yet.</p>}
            {search.data.map((p) => (
              <button key={p.id} type="button" onClick={() => { setProjectId(p.id); setRoomId(null); }} className="flex w-full items-center gap-3 py-3 text-left hover:bg-muted/40">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">{p.owner?.email ?? p.owner_id} · started {new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-semibold text-primary">Open</span>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {projectId && detail?.project && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <button type="button" className="text-sm font-semibold text-muted-foreground hover:text-foreground" onClick={() => setProjectId(null)}>← Results</button>
              <h3 className="text-2xl font-extrabold">{detail.project.name}</h3>
              <p className="text-sm text-muted-foreground">
                {detail.project.intent.replace(/_/g, " ")} · {detail.project.property_type ?? "property not set"}
                {detail.project.budget_max ? ` · budget up to ${detail.project.budget_max} ${detail.project.currency}` : ""}
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-bold text-muted-foreground"><Lock className="h-4 w-4" /> Read-only</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {detail.rooms.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRoomId(r.id)}
                className={cn("space-y-2 rounded-2xl border bg-card p-4 text-left", activeRoom === r.id && "border-2 border-primary")}
              >
                <p className="font-bold">{r.name}</p>
                <div className="grid grid-cols-10 gap-0.5" aria-label={`Step ${r.current_step} of 10`}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <span key={i} className={cn("h-1.5 rounded", i + 1 < r.current_step ? "bg-primary/60" : i + 1 === r.current_step ? "bg-primary" : "bg-muted")} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Step {r.current_step} of 10 · {r.starting_state?.replace(/_/g, " ") ?? "state not set"}</p>
              </button>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader><CardTitle>Room items</CardTitle><CardDescription>What this room keeps, buys or has made, and where each piece comes from</CardDescription></CardHeader>
              <CardContent className="divide-y">
                {(items ?? []).length === 0 && <p className="text-muted-foreground">No items yet.</p>}
                {(items ?? []).map((i) => (
                  <div key={i.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{i.label}</p>
                      <p className="text-xs text-muted-foreground">{i.item_type} · {i.action}</p>
                    </div>
                    {i.sourcing && <StatusBadge status="matched">{SOURCING[i.sourcing] ?? i.sourcing}</StatusBadge>}
                  </div>
                ))}
              </CardContent>
            </Card>
            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Shopping</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {detail.choices ? (
                    <p>
                      {[detail.choices.use_suggested && "Suggested furniture", detail.choices.use_custom_made && "Custom made", detail.choices.use_own_shops && "Own shops"]
                        .filter(Boolean)
                        .join(" · ")}
                      {detail.choices.use_own_shops && detail.choices.own_shops_first ? " (own shops first)" : ""}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">Not chosen yet (step 5.0).</p>
                  )}
                  {detail.shops.map((s, n) => {
                    const shop = s.shops as { name: string; domain: string | null; status: string; product_count: number } | null;
                    return (
                      <div key={n} className="flex items-center justify-between gap-2 border-t pt-2">
                        <span>{shop?.name ?? shop?.domain}</span>
                        {shop && <StatusBadge status={shop.status} />}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Step progress</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {detail.progress.length === 0 && <p className="text-muted-foreground">No steps recorded.</p>}
                  {detail.progress
                    .sort((a, b) => a.step_no - b.step_no)
                    .map((s) => (
                      <p key={s.id}>
                        Step {s.step_no}
                        {s.room_id ? ` · ${detail.rooms.find((r) => r.id === s.room_id)?.name ?? "room"}` : " · project"} · {s.status}
                      </p>
                    ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
