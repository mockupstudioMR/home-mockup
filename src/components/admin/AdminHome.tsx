import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Images, MessagesSquare, Package, ShieldCheck, Store, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/admin/library/shared";

export type AdminSection = "home" | "sizes" | "products" | "projects" | "users" | "cms" | "analytics" | "billing";

export type AdminCounts = {
  missingSizes: number;
  newProducts: number;
  newDesigns: number;
  newUsers: number;
  activeWhatsapp: number;
};

const weekAgo = () => new Date(Date.now() - 7 * 86_400_000).toISOString();

/** Nav badges: what actually needs an admin's attention right now. */
export function useAdminCounts() {
  return useQuery<AdminCounts>({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const since = weekAgo();
      const [specs, products, designs, users, whatsapp] = await Promise.all([
        supabase.from("furniture_specs").select("id", { count: "exact", head: true }).or("width_cm.is.null,width_cm.eq.0"),
        supabase.from("shop_products").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("generated_designs").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
        supabase.from("whatsapp_quiz_sessions").select("id", { count: "exact", head: true }).eq("status", "active"),
      ]);
      return {
        missingSizes: specs.count ?? 0,
        newProducts: products.count ?? 0,
        newDesigns: designs.count ?? 0,
        newUsers: users.count ?? 0,
        activeWhatsapp: whatsapp.count ?? 0,
      };
    },
  });
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const Kpi = ({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <Card>
    <CardContent className="flex items-start gap-4 p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </CardContent>
  </Card>
);

/** Admin home: what the product did this week, straight from the live tables. */
const AdminHome = ({ go }: { go: (s: AdminSection) => void }) => {
  const { data: counts } = useAdminCounts();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-home"],
    queryFn: async () => {
      const [totals, designs, quizzes, retailers, specs] = await Promise.all([
        Promise.all([
          supabase.from("generated_designs").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("rooms").select("id", { count: "exact", head: true }),
          supabase.from("shopping_lists").select("id", { count: "exact", head: true }),
          supabase.from("shop_products").select("id", { count: "exact", head: true }).eq("is_active", true),
        ]),
        supabase
          .from("generated_designs")
          .select("id, title, image_url, room_id, created_at")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("quiz_responses")
          .select("id, room_type, style_preference, color_palette, created_at")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("retailer_style_profiles")
          .select("id, product_range, sales_channel, product_types, created_at")
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("furniture_specs")
          .select("id, name, width_cm, depth_cm")
          .or("width_cm.is.null,width_cm.eq.0")
          .order("name")
          .limit(8),
      ]);
      return {
        designs: totals[0].count ?? 0,
        users: totals[1].count ?? 0,
        rooms: totals[2].count ?? 0,
        lists: totals[3].count ?? 0,
        products: totals[4].count ?? 0,
        recentDesigns: designs.data ?? [],
        recentQuizzes: quizzes.data ?? [],
        recentRetailers: retailers.data ?? [],
        specsMissingSizes: specs.data ?? [],
      };
    },
  });

  const quickLinks: { id: AdminSection; label: string; text: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "sizes", label: "Sizes & design config", text: "Standard sizes, activities, openings, prompt templates", icon: ShieldCheck },
    { id: "products", label: "Products & shops", text: "Everything the matcher can suggest", icon: Store },
    { id: "projects", label: "Projects support", text: "Look up what any user has designed", icon: Images },
    { id: "users", label: "Users & invites", text: "Roles, invitations, access", icon: Users },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Admin home</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Live numbers from the database — designs generated, people using it, and what still needs setting up.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi
          label="Designs"
          value={data?.designs ?? "—"}
          hint={counts ? `+${counts.newDesigns} in the last 7 days` : undefined}
          icon={Images}
        />
        <Kpi
          label="People"
          value={data?.users ?? "—"}
          hint={counts ? `+${counts.newUsers} in the last 7 days` : undefined}
          icon={Users}
        />
        <Kpi label="Rooms drawn" value={data?.rooms ?? "—"} hint="Floor plans saved" icon={ShieldCheck} />
        <Kpi label="Shopping lists" value={data?.lists ?? "—"} hint="Lists users reached" icon={Package} />
        <Kpi label="Products indexed" value={data?.products ?? "—"} hint="Live in the catalogue" icon={Store} />
        <Kpi
          label="WhatsApp chats"
          value={counts?.activeWhatsapp ?? "—"}
          hint="Quizzes in progress"
          icon={MessagesSquare}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latest designs</CardTitle>
            <CardDescription>The most recent mockups, newest first</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <p className="text-muted-foreground">Loading…</p>}
            {!isLoading && (data?.recentDesigns.length ?? 0) === 0 && (
              <p className="text-muted-foreground">No designs yet.</p>
            )}
            {(data?.recentDesigns ?? []).map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-xl border bg-background p-2">
                {d.image_url ? (
                  <img src={d.image_url} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Images className="h-4 w-4" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-semibold">{d.title || "Untitled design"}</p>
                  <p className="text-xs text-muted-foreground">{fmtDateTime(d.created_at)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest quizzes &amp; retailers</CardTitle>
            <CardDescription>What people asked for, and shops that onboarded</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!isLoading && (data?.recentQuizzes.length ?? 0) === 0 && (data?.recentRetailers.length ?? 0) === 0 && (
              <p className="text-muted-foreground">Nothing yet.</p>
            )}
            {(data?.recentQuizzes ?? []).map((q) => (
              <div key={q.id} className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold capitalize">{q.room_type?.replace(/-/g, " ") || "A room"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {q.style_preference || "No style given"}
                    {q.color_palette ? ` · ${q.color_palette}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(q.created_at)}</span>
              </div>
            ))}
            {(data?.recentRetailers ?? []).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold capitalize">{r.product_range || "Retailer"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {(r.product_types ?? []).slice(0, 3).join(", ") || "No types given"} · {r.sales_channel || "channel not set"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(r.created_at)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Needs a look
          </CardTitle>
          <CardDescription>
            {counts?.missingSizes
              ? `${counts.missingSizes} furniture ${counts.missingSizes === 1 ? "piece" : "pieces"} without standard sizes — the size step skips them.`
              : "Every furniture piece has standard sizes."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(data?.specsMissingSizes ?? []).map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2">
              <span className="font-medium">{s.name}</span>
              <StatusBadge status="pending" label="No size" />
            </div>
          ))}
          {(data?.specsMissingSizes.length ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => go("sizes")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Add the sizes <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((l) => {
          const Icon = l.icon;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => go(l.id)}
              className="rounded-2xl border bg-card p-5 text-left transition hover:border-primary/50 hover:shadow-md"
            >
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-3 font-bold">{l.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{l.text}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AdminHome;
