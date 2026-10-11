import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Inbox, ScanLine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./library/shared";

export type AdminSection =
  | "home" | "scan" | "review" | "vocabulary" | "schemes" | "styles" | "sizes" | "products"
  | "projects" | "users" | "cms" | "analytics" | "billing";

export function useAdminCounts() {
  return useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const head = { count: "exact" as const, head: true };
      const [waiting, proposed, pendingShops] = await Promise.all([
        supabase.from("detected_pieces").select("id", head).eq("status", "waiting"),
        supabase.from("taxonomy_terms").select("id", head).eq("status", "proposed"),
        supabase.from("shops").select("id", head).eq("status", "pending"),
      ]);
      // Categories used by schemes that have no standard size yet
      const [{ data: used }, { data: sized }] = await Promise.all([
        supabase.from("furniture_schemes").select("category_id").eq("status", "active").limit(5000),
        supabase.from("furniture_specs").select("category_term_id").not("category_term_id", "is", null),
      ]);
      const sizedSet = new Set((sized ?? []).map((s) => s.category_term_id));
      const missingSizes = new Set((used ?? []).map((u) => u.category_id).filter((c) => !sizedSet.has(c))).size;
      return {
        waiting: waiting.count ?? 0,
        proposed: proposed.count ?? 0,
        pendingShops: pendingShops.count ?? 0,
        missingSizes,
      };
    },
    refetchInterval: 60_000,
  });
}

export default function AdminHome({ go }: { go: (s: AdminSection) => void }) {
  const { data: counts } = useAdminCounts();
  const { data: batches } = useQuery({
    queryKey: ["ingest-batches-recent"],
    queryFn: async () => {
      const { data } = await supabase.from("ingest_batches").select("*").order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });
  const { data: changes } = useQuery({
    queryKey: ["admin-audit-recent"],
    queryFn: async () => {
      const { data } = await supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(6);
      return data ?? [];
    },
  });

  const kpis: { n: number | undefined; label: string; sub: string; to: AdminSection; warn?: boolean }[] = [
    { n: counts?.waiting, label: "Pieces waiting for review", sub: "Nothing reaches users until confirmed", to: "review", warn: (counts?.waiting ?? 0) > 0 },
    { n: counts?.proposed, label: "New words proposed", sub: "Found by scans, not in the vocabulary", to: "vocabulary" },
    { n: counts?.pendingShops, label: "Shops users added", sub: "Waiting for approval", to: "products" },
    { n: counts?.missingSizes, label: "Categories without sizes", sub: "Used by schemes, no standard size", to: "sizes" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight">What needs you today</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Feed the library with designs you trust, clear what the AI wasn&apos;t sure about, and keep the words and sizes behind every recommendation right.
          </p>
        </div>
        <Button size="lg" onClick={() => go("scan")}><ScanLine className="mr-2 h-5 w-5" /> Scan a design</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <button
            key={k.label}
            type="button"
            onClick={() => go(k.to)}
            className={cn(
              "rounded-2xl border p-5 text-left transition-colors hover:border-primary/40",
              k.warn ? "border-amber-300 bg-amber-50" : "bg-card",
            )}
          >
            <span className={cn("block text-4xl font-extrabold", k.warn && "text-amber-900")}>{k.n ?? "–"}</span>
            <span className={cn("mt-1 block font-semibold", k.warn ? "text-amber-900" : "text-foreground")}>{k.label}</span>
            <span className="block text-sm text-muted-foreground">{k.sub}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button type="button" onClick={() => go("scan")} className="rounded-3xl bg-gradient-to-br from-primary/20 via-secondary to-accent/20 p-7 text-left">
          <ScanLine className="h-8 w-8 text-primary" aria-hidden="true" />
          <p className="mt-4 text-2xl font-extrabold">Scan &amp; upload designs</p>
          <p className="mt-2 text-muted-foreground">Pieces become schemes; pieces seen together become a combination.</p>
          <span className="mt-4 inline-flex items-center gap-2 font-bold">Start a batch <ArrowRight className="h-4 w-4" /></span>
        </button>
        <button type="button" onClick={() => go("review")} className="rounded-3xl bg-gradient-to-br from-accent/30 via-secondary to-primary/10 p-7 text-left">
          <Inbox className="h-8 w-8 text-primary" aria-hidden="true" />
          <p className="mt-4 text-2xl font-extrabold">Clear the review queue</p>
          <p className="mt-2 text-muted-foreground">Confirm, fix or merge what the AI wasn&apos;t sure about.</p>
          <span className="mt-4 inline-flex items-center gap-2 font-bold">Review {counts?.waiting ?? 0} pieces <ArrowRight className="h-4 w-4" /></span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Recent batches</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {(batches ?? []).length === 0 && <p className="text-muted-foreground">No scans yet.</p>}
            {(batches ?? []).map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-sm text-muted-foreground">{new Date(b.created_at).toLocaleString()} · {b.found_count} found · {b.saved_count} saved</p>
                </div>
                <StatusBadge status={b.status} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Latest admin changes</CardTitle></CardHeader>
          <CardContent className="divide-y">
            {(changes ?? []).length === 0 && <p className="text-muted-foreground">No changes recorded yet.</p>}
            {(changes ?? []).map((c) => {
              const after = (c.after ?? c.before) as { label?: string; name?: string; key?: string } | null;
              return (
                <div key={c.id} className="py-3">
                  <p className="text-sm font-semibold capitalize">{c.action} · {c.table_name.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {after?.label ?? after?.name ?? after?.key ?? ""} · {new Date(c.created_at).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
