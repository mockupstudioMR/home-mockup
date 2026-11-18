/**
 * Real pieces from shops for step 5: products from the shop catalogue (shop_products) that match the main piece,
 * filtered and ordered by the shop choice made on 5.0 (own shops first, own shops only, shops this user may see).
 */
import { loadShopPreferences, projectDb, type ShopPreferences } from "@/lib/projectStore";

export type ShopPiece = { id: string; name: string; price?: number; currency?: string; image?: string; url?: string; own: boolean; score: number };

type Row = { id: string; name: string; type: string | null; description: string | null; ai_image_description?: string | null; price: number | null; currency: string | null; image_urls: string[] | null; source_url: string | null; shop_ref?: string | null; style?: string | null };

/** Words to look for per kind of main piece (the catalogue's `type` varies between shops). */
const KIND_WORDS: Record<string, string[]> = {
  sofa: ["sofa", "couch", "settee"],
  bed: ["bed"],
  table: ["dining table", "table"],
  desk: ["desk"],
};

/** Ranks and filters catalogue rows for a piece. Pure, so it can be tested. */
export function rankPieces(rows: Row[], kind: string, words: string[], prefs: ShopPreferences | null, limit = 4): ShopPiece[] {
  const kinds = KIND_WORDS[kind] ?? [kind];
  const want = words.map((w) => w.toLowerCase()).filter((w) => w.length > 2);
  let out = rows
    .filter((r) => {
      const t = `${r.type ?? ""} ${r.name}`.toLowerCase();
      return kinds.some((k) => t.includes(k));
    })
    .map((r) => {
      const text = `${r.name} ${r.type ?? ""} ${r.description ?? ""} ${r.ai_image_description ?? ""} ${r.style ?? ""}`.toLowerCase();
      const own = !!r.shop_ref && !!prefs?.ownShopIds.has(r.shop_ref);
      return {
        id: r.id,
        name: r.name,
        price: r.price ?? undefined,
        currency: r.currency ?? undefined,
        image: r.image_urls?.[0],
        url: r.source_url ?? undefined,
        own,
        shop: r.shop_ref ?? undefined,
        score: want.filter((w) => text.includes(w)).length,
      };
    });
  if (prefs?.visibleShopIds) out = out.filter((p) => !p.shop || prefs.visibleShopIds!.has(p.shop) || p.own);
  if (prefs && !prefs.choice.use_suggested && prefs.choice.use_own_shops) out = out.filter((p) => p.own);
  out.sort((a, b) => (prefs?.choice.use_own_shops && prefs.choice.own_shops_first ? Number(b.own) - Number(a.own) : 0) || b.score - a.score);
  const seen = new Set<string>();
  return out
    .filter((p) => {
      const k = p.name.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, limit)
    .map(({ shop: _shop, ...p }) => p);
}

/** Catalogue pieces for the main piece, best first. Empty when the catalogue can't be reached. */
export async function findShopPieces(kind: string, words: string[]): Promise<ShopPiece[]> {
  const kinds = KIND_WORDS[kind] ?? [kind];
  const or = kinds.flatMap((k) => [`type.ilike.%${k}%`, `name.ilike.%${k}%`]).join(",");
  const [res, prefs] = await Promise.all([
    projectDb.from("shop_products").select("*").eq("is_active", true).or(or).limit(60),
    loadShopPreferences(),
  ]);
  if (res.error) return [];
  return rankPieces((res.data ?? []) as Row[], kind, words, prefs);
}
