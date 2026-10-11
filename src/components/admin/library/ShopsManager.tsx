import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "./shared";

type Shop = Tables<"shops">;

const domainOf = (url: string) => {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
};

/** Partner shops (searched for everyone) and shops users added in step 5 (searched only for their project until approved). */
export default function ShopsManager() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [view, setView] = useState<"pending" | "approved" | "all">("pending");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-shops"],
    queryFn: async () => {
      const [{ data: shops, error }, { data: links }] = await Promise.all([
        supabase.from("shops").select("*").order("created_at", { ascending: false }),
        supabase.from("project_shops").select("shop_id"),
      ]);
      if (error) throw error;
      const projects = new Map<string, number>();
      for (const l of links ?? []) projects.set(l.shop_id, (projects.get(l.shop_id) ?? 0) + 1);
      return { shops: (shops ?? []) as Shop[], projects };
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-shops"] });

  const review = useMutation({
    mutationFn: async ({ shop, status }: { shop: Shop; status: "approved" | "rejected" }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("shops")
        .update({ status, terms_checked: status === "approved", reviewed_by: auth.user?.id ?? null, reviewed_at: new Date().toISOString() })
        .eq("id", shop.id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      refresh();
      toast({ title: v.status === "approved" ? "Shop approved" : "Shop rejected", description: v.status === "approved" ? "It is now searched for everyone." : undefined });
    },
    onError: (e: Error) => toast({ title: "Could not update the shop", description: e.message, variant: "destructive" }),
  });

  const scrape = useMutation({
    mutationFn: async (shop: Shop) => {
      const { data: auth } = await supabase.auth.getUser();
      const { data: res, error } = await supabase.functions.invoke("scrape-shop", {
        body: { shopUrl: shop.url ?? `https://${shop.domain}`, userId: shop.owner_user_id ?? auth.user?.id, shopRef: shop.id },
      });
      if (error) throw error;
      if (res?.success === false) throw new Error(res.error);
      return res as { message?: string };
    },
    onSuccess: (res) => {
      refresh();
      qc.invalidateQueries({ queryKey: ["admin-all-products"] });
      toast({ title: "Scrape finished", description: res?.message });
    },
    onError: (e: Error) => toast({ title: "Scrape failed", description: e.message, variant: "destructive" }),
  });

  const add = useMutation({
    mutationFn: async () => {
      const domain = domainOf(url);
      if (!name.trim() || !domain) throw new Error("Give the shop a name and a valid link.");
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("shops").insert({
        name: name.trim(),
        url: url.startsWith("http") ? url : `https://${url}`,
        domain,
        kind: "partner",
        status: "approved",
        terms_checked: true,
        added_by: auth.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setUrl("");
      refresh();
      toast({ title: "Partner shop added", description: "Scrape it to bring in its products." });
    },
    onError: (e: Error) => toast({ title: "Could not add the shop", description: e.message, variant: "destructive" }),
  });

  const shops = data?.shops ?? [];
  const shown = shops.filter((s) => (view === "all" ? true : view === "pending" ? s.status === "pending" : s.status === "approved"));

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" /> Shops</CardTitle>
          <CardDescription>
            Partner shops are searched for everyone. Shops users add in step 5 are searched only for their project until you approve them.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["pending", "approved", "all"] as const).map((v) => (
            <Button key={v} size="sm" variant={view === v ? "default" : "outline"} onClick={() => setView(v)}>
              {v === "pending" ? `Waiting ${shops.filter((s) => s.status === "pending").length}` : v === "approved" ? "Searched for everyone" : `All ${shops.length}`}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="text-muted-foreground">{view === "pending" ? "No user-added shops waiting." : "No shops here yet."}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((s) => {
              const n = data?.projects.get(s.id) ?? 0;
              return (
                <div key={s.id} className={s.status === "pending" ? "space-y-3 rounded-2xl border-2 border-dashed border-amber-600/50 bg-amber-50/60 p-4" : "space-y-3 rounded-2xl border bg-background p-4"}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{s.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{s.domain ?? s.url ?? "No link"}</p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {s.kind === "partner" ? "Partner" : `Added by ${n} project${n === 1 ? "" : "s"}`} · {s.product_count} products
                    {s.last_scraped_at ? ` · scraped ${new Date(s.last_scraped_at).toLocaleDateString()}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {s.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => review.mutate({ shop: s, status: "approved" })}>Approve</Button>
                        <Button size="sm" variant="ghost" onClick={() => review.mutate({ shop: s, status: "rejected" })}>Reject</Button>
                      </>
                    )}
                    {(s.url || s.domain) && s.status !== "rejected" && (
                      <Button size="sm" variant="outline" disabled={scrape.isPending} onClick={() => scrape.mutate(s)}>
                        {scrape.isPending && scrape.variables?.id === s.id ? "Scraping…" : "Scrape"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <form
          className="flex flex-wrap items-end gap-3 border-t pt-5"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="shop-name">Partner shop name</Label>
            <Input id="shop-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Shop name" />
          </div>
          <div className="min-w-[240px] flex-1 space-y-2">
            <Label htmlFor="shop-url">Shop link</Label>
            <Input id="shop-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.shop.example" />
          </div>
          <Button type="submit" disabled={add.isPending}><Plus className="mr-2 h-4 w-4" /> Add partner shop</Button>
        </form>
      </CardContent>
    </Card>
  );
}
