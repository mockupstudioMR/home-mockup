/** X2 · Products & shops */
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { I } from "@/journey/icons";
import { useTerms } from "@/components/admin/library/shared";
import { AdminShell, Crumb, ago } from "../ui";

type Shop = Tables<"shops">;
type Product = Tables<"shop_products">;
type Dims = { width_cm?: number; depth_cm?: number; height_cm?: number };
const dimsOf = (p: Product): Dims | null => {
  const m = (p.metadata ?? {}) as Record<string, unknown>;
  const d = (m.dimensions ?? m) as Dims;
  return d.width_cm && d.depth_cm ? d : null;
};
const sku = (p: Product) => ((p.metadata ?? {}) as Record<string, unknown>).sku as string | undefined;
const domainOf = (u: string) => {
  try {
    return new URL(u.startsWith("http") ? u : `https://${u}`).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
const scraped = (iso: string | null) => {
  if (!iso) return "not scraped yet";
  const a = ago(iso);
  if (a.startsWith("Today") || a === "Now" || a.endsWith("min ago")) return "scraped today";
  if (a === "Yesterday") return "scraped yesterday";
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  return `scraped ${days} days ago`;
};
const money = (n: number | null, cur: string | null) => (n == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: cur || "EUR", maximumFractionDigits: 0 }).format(n));

export function Products() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [sel, setSel] = useState<string | null>(null);
  const [allPending, setAllPending] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-shops2"],
    queryFn: async () => {
      const [{ data: shops, error }, { data: links }] = await Promise.all([
        supabase.from("shops").select("*").order("product_count", { ascending: false }),
        supabase.from("project_shops").select("shop_id, project_id"),
      ]);
      if (error) throw error;
      const users = new Map<string, Set<string>>();
      for (const l of links ?? []) users.set(l.shop_id, (users.get(l.shop_id) ?? new Set()).add(l.project_id));
      return { shops: (shops ?? []) as Shop[], users };
    },
  });
  const shops = data?.shops ?? [];
  const live = shops.filter((s) => s.status === "approved");
  const pending = shops.filter((s) => s.status === "pending");
  useEffect(() => {
    if (!sel && live.length) setSel(live[0].id);
  }, [live, sel]);
  const cur = shops.find((s) => s.id === sel);
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-shops2"] });

  const scrape = useMutation({
    mutationFn: async (shop: Shop) => {
      const { data: auth } = await supabase.auth.getUser();
      const { data: res, error } = await supabase.functions.invoke("scrape-shop", { body: { shopUrl: shop.url ?? `https://${shop.domain}`, userId: shop.owner_user_id ?? auth.user?.id, shopRef: shop.id } });
      if (error) throw error;
      if (res?.success === false) throw new Error(res.error);
      return res as { message?: string };
    },
    onSuccess: (res) => {
      refresh();
      qc.invalidateQueries({ queryKey: ["admin-shop-products"] });
      toast({ title: "Scrape finished", description: res?.message });
    },
    onError: (e: Error) => toast({ title: "Scrape failed", description: e.message, variant: "destructive" }),
  });
  const review = useMutation({
    mutationFn: async ({ shop, status }: { shop: Shop; status: "approved" | "rejected" }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("shops").update({ status, terms_checked: status === "approved", reviewed_by: auth.user?.id ?? null, reviewed_at: new Date().toISOString() }).eq("id", shop.id);
      if (error) throw error;
      if (status === "approved") scrape.mutate(shop);
    },
    onSuccess: (_d, v) => {
      refresh();
      qc.invalidateQueries({ queryKey: ["admin-counts"] });
      toast({ title: v.status === "approved" ? "Shop approved — scraping now" : "Shop rejected" });
    },
    onError: (e: Error) => toast({ title: "Could not update the shop", description: e.message, variant: "destructive" }),
  });
  const add = useMutation({
    mutationFn: async () => {
      const domain = domainOf(url);
      if (!name.trim() || !domain) throw new Error("Give the shop a name and a valid link.");
      const { data: auth } = await supabase.auth.getUser();
      const { data: row, error } = await supabase
        .from("shops")
        .insert({ name: name.trim(), url: url.startsWith("http") ? url : `https://${url}`, domain, kind: "partner", status: "approved", terms_checked: true, added_by: auth.user?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      return row as Shop;
    },
    onSuccess: (shop) => {
      setName("");
      setUrl("");
      setAdding(false);
      setSel(shop.id);
      refresh();
      toast({ title: "Partner shop added", description: "Scrape it to bring in its products." });
    },
    onError: (e: Error) => toast({ title: "Could not add the shop", description: e.message, variant: "destructive" }),
  });

  return (
    <AdminShell board="X2-Products" section="products">
      <Crumb items={["Curate"]} />
      <div className="hd">
        <div>
          <h1 className="ah1">Products & shops</h1>
          <p className="asub">The shops we search and the products in them. Shops users add in step 5 land here first, so we can check them before matching from them.</p>
        </div>
        <div className="row">
          <button className="btn ghost sm" type="button" disabled={!cur || scrape.isPending} onClick={() => cur && scrape.mutate(cur)}>
            {scrape.isPending ? "Scraping…" : "Scrape a shop"}
          </button>
          <button className="btn sm" type="button" onClick={() => setAdding((a) => !a)}>
            <I.plus />
            Add shop
          </button>
        </div>
      </div>
      {adding && (
        <div className="row sec" style={{ gap: "10px", flexWrap: "wrap" }}>
          <input className="input" style={{ flex: "1 1 220px" }} placeholder="Shop name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Shop name" />
          <input className="input" style={{ flex: "2 1 300px" }} placeholder="https://shop.example" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Shop link" />
          <button className="btn sm" type="button" disabled={add.isPending} onClick={() => add.mutate()}>
            Add partner shop
          </button>
        </div>
      )}
      <section className="sec">
        <div className="sec-h">
          <h2>Shops</h2>
          <span className="small">Partner shops are searched for everyone; user shops only for that user until approved</span>
        </div>
        <div className="shops">
          {live.slice(0, pending.length ? 2 : 4).map((s, i) => (
            <button key={s.id} type="button" className={`shop${sel === s.id ? " on" : ""}`} onClick={() => setSel(s.id)} style={{ textAlign: "left", font: "inherit", cursor: "pointer" }}>
              <span className="lg">{s.name.slice(0, 2).toUpperCase() || `S${i + 1}`}</span>
              <b>{s.name}</b>
              <span>
                {s.kind === "partner" ? "Partner" : "User shop"} · {s.product_count.toLocaleString()} products · {scraped(s.last_scraped_at)}
              </span>
              <span className="bdg saved" style={{ alignSelf: "flex-start" }}>
                Searched for everyone
              </span>
            </button>
          ))}
          {(allPending ? pending : pending.slice(0, 2)).map((s) => {
            const n = data?.users.get(s.id)?.size ?? 1;
            return (
              <div className="shop usr" key={s.id}>
                <span className="lg">+</span>
                <b>{s.domain ?? s.name}</b>
                <span>
                  Added by {n} user{n === 1 ? "" : "s"} · step 5
                </span>
                <div className="row" style={{ gap: "8px" }}>
                  <button className="btn sm" type="button" style={{ minHeight: "40px", padding: "0 14px", fontSize: "14px" }} onClick={() => review.mutate({ shop: s, status: "approved" })}>
                    Approve & scrape
                  </button>
                  <button className="link-btn" type="button" style={{ minHeight: "40px", fontSize: "14px" }} onClick={() => review.mutate({ shop: s, status: "rejected" })}>
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {(pending.length > 0 || live.length > 4) && (
          <p className="small" style={{ marginTop: "10px" }}>
            {pending.length} user-added shop{pending.length === 1 ? "" : "s"} waiting ·{" "}
            <a href="#" onClick={(e) => { e.preventDefault(); setAllPending((a) => !a); }}>
              {allPending ? "Show fewer" : "See all"}
            </a>
          </p>
        )}
        {data && !shops.length && <p className="mut">No shops yet. Add a partner shop to start matching products.</p>}
      </section>
      {cur && <ShopProducts shop={cur} />}
    </AdminShell>
  );
}

function ShopProducts({ shop }: { shop: Shop }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: terms } = useTerms();
  const t = (id: string | null) => (id ? terms?.byId.get(id) : undefined);
  const [filter, setFilter] = useState<"all" | "unlinked" | "nosize">("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; price: string; w: string; d: string; h: string; scheme: string }>({ name: "", price: "", w: "", d: "", h: "", scheme: "" });
  const { data } = useQuery({
    queryKey: ["admin-shop-products", shop.id],
    queryFn: async () => {
      const [{ data: products }, { data: schemes }] = await Promise.all([
        supabase.from("shop_products").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false }).limit(500),
        supabase.from("furniture_schemes").select("id, label, category_id, color_id, style_id, material_id").eq("status", "active").limit(2000),
      ]);
      return { products: (products ?? []) as Product[], schemes: schemes ?? [] };
    },
  });
  const schemeById = useMemo(() => new Map((data?.schemes ?? []).map((s) => [s.id, s])), [data]);
  const all = data?.products ?? [];
  const unlinked = all.filter((p) => !p.scheme_id);
  const nosize = all.filter((p) => !dimsOf(p));
  const shown = filter === "unlinked" ? unlinked : filter === "nosize" ? nosize : all;
  const schemeLabel = (id: string) => {
    const s = schemeById.get(id);
    return s ? [s.label || t(s.category_id)?.label, t(s.color_id)?.label, t(s.style_id)?.label].filter(Boolean).join(" · ") : id;
  };
  // Suggest the scheme whose category word appears in the product name.
  const guess = (p: Product) => {
    const n = `${p.name} ${p.type ?? ""}`.toLowerCase();
    return (data?.schemes ?? []).find((s) => {
      const c = t(s.category_id)?.label.toLowerCase();
      return c && n.includes(c);
    })?.id;
  };
  const open = (p: Product, scheme?: string) => {
    const d = dimsOf(p);
    setEditing(p.id);
    setDraft({ name: p.name, price: p.price?.toString() ?? "", w: d?.width_cm?.toString() ?? "", d: d?.depth_cm?.toString() ?? "", h: d?.height_cm?.toString() ?? "", scheme: scheme ?? p.scheme_id ?? guess(p) ?? "" });
  };
  const save = useMutation({
    mutationFn: async (p: Product) => {
      const meta = { ...((p.metadata ?? {}) as Record<string, unknown>) };
      if (draft.w && draft.d) meta.dimensions = { width_cm: Number(draft.w), depth_cm: Number(draft.d), height_cm: draft.h ? Number(draft.h) : undefined };
      const { error } = await supabase.from("shop_products").update({ name: draft.name.trim() || p.name, price: draft.price ? Number(draft.price) : null, scheme_id: draft.scheme || null, metadata: meta as Json }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-shop-products", shop.id] });
      toast({ title: "Product saved" });
    },
    onError: (e: Error) => toast({ title: "Could not save", description: e.message, variant: "destructive" }),
  });

  return (
    <section className="sec">
      <div className="sec-h">
        <h2>Products · {shop.name}</h2>
        <div className="flt">
          <button className={`pill${filter === "all" ? " on" : ""}`} type="button" onClick={() => setFilter("all")}>
            All
          </button>
          <button className={`pill${filter === "unlinked" ? " on" : ""}`} type="button" onClick={() => setFilter("unlinked")}>
            Not linked to a scheme <em>{unlinked.length}</em>
          </button>
          <button className={`pill${filter === "nosize" ? " on" : ""}`} type="button" onClick={() => setFilter("nosize")}>
            Missing size <em>{nosize.length}</em>
          </button>
        </div>
      </div>
      <div className="tbl-box">
        <table className="tbl">
          <thead>
            <tr>
              <th>Product</th>
              <th>Scheme it matches</th>
              <th>Size</th>
              <th>Price</th>
              <th>
                <span className="sr">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => {
              const s = p.scheme_id ? schemeById.get(p.scheme_id) : undefined;
              const d = dimsOf(p);
              return [
                <tr key={p.id}>
                  <td>
                    <div className="row" style={{ gap: "12px", flexWrap: "nowrap" }}>
                      {p.image_urls?.[0] ? <img className="thumb" src={p.image_urls[0]} alt="" /> : <span className="thumb" style={{ background: "#F0EAF1" }} />}
                      <span>
                        <b>{p.name}</b>
                        <br />
                        <span className="mut">{sku(p) ? `SKU ${sku(p)}` : p.type ?? ""}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    {s ? (
                      <div className="scs">
                        {[s.category_id, s.color_id, s.style_id].map((id) => (id ? <span className="sc" key={id}>{t(id)?.label}</span> : null))}
                      </div>
                    ) : (
                      <>
                        <span className="bdg idle">Not linked</span>{" "}
                        <a href="#" style={{ fontWeight: "600", fontSize: "14px" }} onClick={(e) => { e.preventDefault(); open(p, guess(p)); }}>
                          Find scheme
                        </a>
                      </>
                    )}
                  </td>
                  <td>{d ? `${d.width_cm} × ${d.depth_cm}${d.height_cm ? ` × ${d.height_cm}` : ""}` : <span className="bdg review">Missing</span>}</td>
                  <td>{money(p.price, p.currency)}</td>
                  <td>
                    <a href="#" style={{ fontWeight: "600" }} onClick={(e) => { e.preventDefault(); if (editing === p.id) setEditing(null); else open(p); }}>
                      {editing === p.id ? "Close" : "Edit"}
                    </a>
                  </td>
                </tr>,
                editing === p.id && (
                  <tr key={`${p.id}-e`}>
                    <td colSpan={5}>
                      <div className="row" style={{ gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
                        <input className="input" style={{ flex: "2 1 220px" }} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-label="Product name" />
                        <input className="input" style={{ flex: "0 1 110px" }} value={draft.price} inputMode="decimal" placeholder="Price" onChange={(e) => setDraft({ ...draft, price: e.target.value })} aria-label="Price" />
                        {(["w", "d", "h"] as const).map((k) => (
                          <input key={k} className="input" style={{ flex: "0 1 90px" }} value={draft[k]} inputMode="numeric" placeholder={{ w: "W cm", d: "D cm", h: "H cm" }[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value.replace(/[^\d]/g, "") })} aria-label={{ w: "Width", d: "Depth", h: "Height" }[k]} />
                        ))}
                        <select className="select" style={{ flex: "2 1 260px" }} value={draft.scheme} onChange={(e) => setDraft({ ...draft, scheme: e.target.value })} aria-label="Scheme">
                          <option value="">Not linked</option>
                          {(data?.schemes ?? []).map((x) => (
                            <option key={x.id} value={x.id}>
                              {schemeLabel(x.id)}
                            </option>
                          ))}
                        </select>
                        <button className="btn sm" type="button" disabled={save.isPending} onClick={() => save.mutate(p)}>
                          Save
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              ];
            })}
            {data && !shown.length && (
              <tr>
                <td colSpan={5} className="mut">
                  {all.length ? "Nothing in this filter." : "No products yet. Scrape the shop to bring them in."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
