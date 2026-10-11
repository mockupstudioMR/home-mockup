import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Hammer, Link2, Loader2, Plus, Sparkles, Store, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SHOP_CHOICE,
  addProjectShop,
  ensureProject,
  loadProjectShops,
  loadShopChoice,
  projectsReady,
  readShop,
  removeProjectShop,
  saveShopChoice,
  type ProjectShop,
  type ShopChoice,
} from "@/lib/projectStore";

const OPTIONS: { key: keyof ShopChoice; title: string; text: string; icon: React.ComponentType<{ className?: string }>; tint: string }[] = [
  { key: "use_suggested", title: "Suggested furniture", text: "Pieces from shops we work with, matched to your style, palette and sizes.", icon: Sparkles, tint: "from-primary/25 via-secondary to-accent/30" },
  { key: "use_custom_made", title: "Custom made", text: "A maker builds it to your exact sizes. We prepare the specs.", icon: Hammer, tint: "from-accent/30 via-secondary to-muted" },
  { key: "use_own_shops", title: "My own shops", text: "Paste links to shops you love. We search them for pieces in your style.", icon: Link2, tint: "from-muted via-secondary to-primary/25" },
];

const shopState = (s: ProjectShop, reading: boolean) => {
  if (reading) return { text: "Reading the shop… you can carry on", tone: "text-muted-foreground" };
  if (s.status === "unreadable") return { text: "We couldn't read this shop", tone: "text-destructive" };
  if (s.status === "rejected") return { text: "This shop can't be used", tone: "text-destructive" };
  if (s.product_count > 0) return { text: `Ready · ${s.product_count} pieces found`, tone: "text-emerald-700" };
  return { text: "Added · not read yet", tone: "text-muted-foreground" };
};

/**
 * Step 5.0 — "Where do you want to shop?". Saved per project; falls back to this device
 * when the project tables are not available yet.
 */
export default function ShopChoicePanel({ compact = false, onChange }: { compact?: boolean; onChange?: (c: ShopChoice) => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(!compact);
  const [link, setLink] = useState("");
  const [choice, setChoice] = useState<ShopChoice>(DEFAULT_SHOP_CHOICE);
  const [reading, setReading] = useState<string | null>(null);

  const { data: ctx } = useQuery({
    queryKey: ["shop-choice-context"],
    queryFn: async () => {
      const ready = await projectsReady();
      const projectId = ready ? await ensureProject() : null;
      const [saved, shops] = await Promise.all([loadShopChoice(projectId), loadProjectShops(projectId)]);
      return { ready, projectId, saved, shops };
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (ctx?.saved) setChoice(ctx.saved);
  }, [ctx?.saved]);

  const persist = useMutation({
    mutationFn: async (next: ShopChoice) => {
      await saveShopChoice(ctx?.projectId ?? null, next);
      return next;
    },
    onSuccess: (next) => {
      onChange?.(next);
      qc.invalidateQueries({ queryKey: ["shop-preferences"] });
    },
    onError: (e: Error) => toast({ title: "Could not save your choice", description: e.message, variant: "destructive" }),
  });

  const toggle = (key: keyof ShopChoice) => {
    const next = { ...choice, [key]: !choice[key] };
    if (!next.use_suggested && !next.use_custom_made && !next.use_own_shops) {
      toast({ title: "Pick at least one way to shop" });
      return;
    }
    setChoice(next);
    persist.mutate(next);
  };

  const add = useMutation({
    mutationFn: async () => {
      if (!ctx?.projectId) throw new Error("Sign in to add your own shops.");
      const shop = await addProjectShop(ctx.projectId, link);
      return shop;
    },
    onSuccess: async (shop) => {
      setLink("");
      if (!choice.use_own_shops) {
        const next = { ...choice, use_own_shops: true };
        setChoice(next);
        persist.mutate(next);
      }
      await qc.invalidateQueries({ queryKey: ["shop-choice-context"] });
      if (shop.product_count === 0 && shop.status !== "rejected") {
        setReading(shop.id);
        readShop(shop)
          .then((r) => toast({ title: "Shop read", description: r?.message ?? "Its pieces are now part of your matches." }))
          .catch((e: Error) => toast({ title: "We couldn't read this shop yet", description: e.message }))
          .finally(() => {
            setReading(null);
            qc.invalidateQueries({ queryKey: ["shop-choice-context"] });
            qc.invalidateQueries({ queryKey: ["shop-preferences"] });
          });
      }
    },
    onError: (e: Error) => toast({ title: "Could not add this shop", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (shopId: string) => {
      if (ctx?.projectId) await removeProjectShop(ctx.projectId, shopId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shop-choice-context"] });
      qc.invalidateQueries({ queryKey: ["shop-preferences"] });
    },
  });

  const shops = ctx?.shops ?? [];
  const summary = [
    choice.use_suggested && "Suggested furniture",
    choice.use_custom_made && "Custom made",
    choice.use_own_shops && `Your shops${shops.length ? ` (${shops.length})` : ""}`,
  ]
    .filter(Boolean)
    .join(" · ");

  if (compact && !open) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-background/70 px-4 py-3">
        <Store className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="text-sm"><span className="font-semibold">Shopping from:</span> {summary}</span>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setOpen(true)}>Change</Button>
      </div>
    );
  }

  return (
    <section className="space-y-6 rounded-3xl border bg-background/80 p-5 md:p-7" aria-labelledby="shop-choice-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Before we pick the pieces</p>
          <h2 id="shop-choice-title" className="mt-2 text-2xl font-extrabold tracking-tight md:text-3xl">Where do you want to shop?</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Pick as many as you like. We look for furniture that matches your style and room in the places you choose.
          </p>
        </div>
        {compact && (
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {OPTIONS.map((o) => {
          const on = choice[o.key];
          const Icon = o.icon;
          return (
            <button
              key={o.key}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(o.key)}
              className={cn(
                "relative flex flex-col gap-3 rounded-3xl border bg-gradient-to-br p-6 text-left transition-shadow",
                o.tint,
                on ? "border-2 border-primary shadow-lg" : "border-border/60 opacity-90 hover:shadow-md",
              )}
            >
              {on && (
                <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-4 w-4" />
                </span>
              )}
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 text-primary shadow-sm">
                <Icon className="h-7 w-7" />
              </span>
              <span className="text-xl font-extrabold tracking-tight">{o.title}</span>
              <span className="text-sm text-foreground/75">{o.text}</span>
            </button>
          );
        })}
      </div>

      {choice.use_own_shops && (
        <div className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-bold">Your shops</h3>
            <span className="text-sm text-muted-foreground">A homepage or any product page works</span>
          </div>
          {ctx && !ctx.projectId ? (
            <p className="text-sm text-muted-foreground">Sign in to add your own shops. Your choice above is saved on this device.</p>
          ) : (
            <form
              className="flex flex-wrap gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (link.trim()) add.mutate();
              }}
            >
              <Input
                aria-label="Shop link"
                className="min-w-[240px] flex-1"
                placeholder="Paste a shop link, e.g. https://www.yourfavouriteshop.com"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
              <Button type="submit" disabled={add.isPending || !link.trim()}>
                {add.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} Add shop
              </Button>
            </form>
          )}
          {shops.length > 0 && (
            <ul className="divide-y">
              {shops.map((s) => {
                const st = shopState(s, reading === s.id);
                return (
                  <li key={s.id} className="flex items-center gap-3 py-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Store className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{s.domain ?? s.name}</span>
                      <span className={cn("text-sm", st.tone)}>{st.text}</span>
                    </span>
                    {reading === s.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />}
                    {s.product_count === 0 && reading !== s.id && s.status !== "rejected" && (
                      <Button size="sm" variant="outline" onClick={() => { setReading(s.id); readShop(s).finally(() => { setReading(null); qc.invalidateQueries({ queryKey: ["shop-choice-context"] }); }); }}>
                        Read shop
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" aria-label={`Remove ${s.domain ?? s.name}`} onClick={() => remove.mutate(s.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex items-center justify-between gap-4 border-t pt-4">
            <div>
              <p className="font-semibold">Show pieces from my shops first</p>
              <p className="text-sm text-muted-foreground">Suggested pieces still appear when your shops have nothing that fits.</p>
            </div>
            <Switch
              checked={choice.own_shops_first}
              aria-label="Show pieces from my shops first"
              onCheckedChange={(v) => {
                const next = { ...choice, own_shops_first: v };
                setChoice(next);
                persist.mutate(next);
              }}
            />
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Your choice applies to every room in this project. You can still switch a single piece in your buying list.
      </p>
      {compact && (
        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)}>Done</Button>
        </div>
      )}
    </section>
  );
}
