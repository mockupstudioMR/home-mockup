import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Images, MessageSquare, Package, Search, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/admin/library/shared";

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

/**
 * Projects support: pick a person and see everything they have done — quizzes,
 * designs, rooms, shopping lists, retailer profiles and credit history.
 */
const ProjectSupport = () => {
  const [term, setTerm] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const { data: people, isLoading: loadingPeople } = useQuery({
    queryKey: ["support-people"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, email, display_name, city, country, created_at")
        .order("created_at", { ascending: false })
        .limit(300);
      return data ?? [];
    },
  });

  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ["support-detail", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      const [
        quiz,
        designs,
        rooms,
        lists,
        journey,
        retailer,
        whatsapp,
        credits,
        business,
        roles,
        invites,
      ] = await Promise.all([
        supabase.from("quiz_responses").select("id, room_type, style_preference, color_palette, budget_feel, furniture_source, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(8),
        supabase.from("generated_designs").select("id, title, image_url, room_id, is_favorite, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(12),
        supabase.from("rooms").select("id, name, room_type, style, updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(8),
        supabase.from("shopping_lists").select("id, room_label, room_id, design_id, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(8),
        supabase.from("journey_sessions").select("id, stage, sub_step, updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(5),
        supabase.from("retailer_style_profiles").select("id, product_range, sales_channel, product_types, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
        supabase.from("whatsapp_quiz_sessions").select("id, current_step, status, updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(5),
        supabase.from("credit_transactions").select("id, amount, transaction_type, description, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(8),
        supabase.from("business_profiles").select("id, business_name, website_url, city, country, credits_balance, subscription_tier, created_at").eq("user_id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("role_invites").select("id, email, role, status, created_at").eq("created_by", userId).order("created_at", { ascending: false }).limit(5),
      ]);
      return {
        quiz: quiz.data ?? [],
        designs: designs.data ?? [],
        rooms: rooms.data ?? [],
        lists: lists.data ?? [],
        journey: journey.data ?? [],
        retailer: retailer.data ?? [],
        whatsapp: whatsapp.data ?? [],
        credits: credits.data ?? [],
        business: business.data ?? null,
        roles: (roles.data ?? []).map((r) => r.role),
        invites: invites.data ?? [],
      };
    },
  });

  const filtered = (people ?? []).filter((p) => {
    const t = term.trim().toLowerCase();
    if (!t) return true;
    return [p.email, p.display_name, p.city, p.country].some((v) => (v ?? "").toLowerCase().includes(t));
  });

  const person = (people ?? []).find((p) => p.user_id === userId);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Projects support</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Find a person and see what they have designed, what they asked for and where they got stuck.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4" /> People</CardTitle>
            <CardDescription>{(people ?? []).length} signed up</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search name, email, city"
                className="pl-9"
                aria-label="Search people"
              />
            </div>
            {loadingPeople && <p className="text-muted-foreground">Loading…</p>}
            {!loadingPeople && filtered.length === 0 && <p className="text-muted-foreground">Nobody matches that.</p>}
            <ul className="max-h-[420px] space-y-1 overflow-y-auto">
              {filtered.map((p) => (
                <li key={p.user_id}>
                  <button
                    type="button"
                    onClick={() => setUserId(p.user_id)}
                    className={`w-full rounded-xl px-3 py-2 text-left transition ${
                      userId === p.user_id ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"
                    }`}
                  >
                    <p className="truncate text-sm font-semibold">{p.display_name || p.email || "Unnamed"}</p>
                    <p className={`truncate text-xs ${userId === p.user_id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {[p.city, p.country].filter(Boolean).join(", ") || p.email}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-6">
          {!userId && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Pick a person on the left to see their project history.
              </CardContent>
            </Card>
          )}

          {userId && loadingDetail && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">Loading their history…</CardContent>
            </Card>
          )}

          {userId && detail && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{person?.display_name || person?.email || "This person"}</CardTitle>
                  <CardDescription>
                    {person?.email} · joined {fmt(person?.created_at ?? null)}
                    {detail.roles.length > 0 ? ` · ${detail.roles.join(", ")}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border bg-background p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Designs</p>
                    <p className="text-2xl font-extrabold">{detail.designs.length}</p>
                  </div>
                  <div className="rounded-xl border bg-background p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Quizzes</p>
                    <p className="text-2xl font-extrabold">{detail.quiz.length}</p>
                  </div>
                  <div className="rounded-xl border bg-background p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Shopping lists</p>
                    <p className="text-2xl font-extrabold">{detail.lists.length}</p>
                  </div>
                </CardContent>
              </Card>

              {detail.business && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Store className="h-4 w-4" /> Business</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="font-semibold">{detail.business.business_name}</p>
                    {detail.business.website_url && (
                      <a className="text-primary hover:underline" href={detail.business.website_url} target="_blank" rel="noreferrer">
                        {detail.business.website_url}
                      </a>
                    )}
                    <p className="text-muted-foreground">
                      {[detail.business.city, detail.business.country].filter(Boolean).join(", ")}
                      {" · "}
                      {detail.business.credits_balance ?? 0} credits · {detail.business.subscription_tier || "no plan"}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><Images className="h-4 w-4" /> Designs</CardTitle>
                  <CardDescription>Newest first</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {detail.designs.length === 0 && <p className="text-muted-foreground">No designs yet.</p>}
                  {detail.designs.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 rounded-xl border bg-background p-2">
                      {d.image_url ? (
                        <img src={d.image_url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className="h-12 w-12 shrink-0 rounded-lg bg-muted" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{d.title || "Untitled design"}</p>
                        <p className="text-xs text-muted-foreground">{fmt(d.created_at)}</p>
                      </div>
                      {d.is_favorite && <span className="ml-auto shrink-0"><StatusBadge status="active" label="Favourite" /></span>}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">What they asked for</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {detail.quiz.length === 0 && <p className="text-muted-foreground">No quiz answers yet.</p>}
                    {detail.quiz.map((q) => (
                      <div key={q.id} className="rounded-xl border bg-background p-3 text-sm">
                        <p className="font-semibold capitalize">{q.room_type?.replace(/-/g, " ") || "A room"}</p>
                        <p className="text-xs text-muted-foreground">
                          {q.style_preference || "no style"} · {q.color_palette || "no palette"} · {q.budget_feel || "no budget"}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">{fmt(q.created_at)}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Rooms &amp; lists</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {detail.rooms.length === 0 && detail.lists.length === 0 && (
                      <p className="text-muted-foreground">No rooms or lists yet.</p>
                    )}
                    {detail.rooms.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border bg-background p-3 text-sm">
                        <span className="truncate font-semibold">{r.name || r.room_type}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{fmt(r.updated_at)}</span>
                      </div>
                    ))}
                    {detail.lists.map((l) => (
                      <div key={l.id} className="flex items-center justify-between gap-2 rounded-xl border bg-background p-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2 truncate">
                          <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{l.room_label || "Shopping list"}</span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">{fmt(l.created_at)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Journey &amp; WhatsApp</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {detail.journey.length === 0 && detail.whatsapp.length === 0 && (
                      <p className="text-muted-foreground">Nothing in progress.</p>
                    )}
                    {detail.journey.map((j) => (
                      <div key={j.id} className="flex items-center justify-between gap-2 rounded-xl border bg-background p-3 text-sm">
                        <span className="truncate">
                          <span className="font-semibold">{j.stage}</span>
                          {j.sub_step ? ` · ${j.sub_step}` : ""}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">{fmt(j.updated_at)}</span>
                      </div>
                    ))}
                    {detail.whatsapp.map((w) => (
                      <div key={w.id} className="flex items-center justify-between gap-2 rounded-xl border bg-background p-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">Step {w.current_step}</span>
                        </span>
                        <StatusBadge status={w.status} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Retailer &amp; credits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {detail.retailer.length === 0 && detail.credits.length === 0 && (
                      <p className="text-muted-foreground">No retailer profile and no credit history.</p>
                    )}
                    {detail.retailer.map((r) => (
                      <div key={r.id} className="rounded-xl border bg-background p-3 text-sm">
                        <p className="font-semibold capitalize">{r.product_range || "Retailer"}</p>
                        <p className="text-xs text-muted-foreground">
                          {(r.product_types ?? []).join(", ") || "no types"} · {r.sales_channel || "channel not set"} · {fmt(r.created_at)}
                        </p>
                      </div>
                    ))}
                    {detail.credits.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-2 rounded-xl border bg-background p-3 text-sm">
                        <span className="truncate">
                          <span className="font-semibold">{c.amount}</span> · {c.transaction_type}
                          {c.description ? ` · ${c.description}` : ""}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">{fmt(c.created_at)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Button variant="outline" onClick={() => setUserId(null)}>
                Choose someone else
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSupport;
