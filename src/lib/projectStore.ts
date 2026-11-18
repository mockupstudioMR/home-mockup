/**
 * Projects, rooms and shop choices for the "Designing my home" journey.
 *
 * Everything here is best-effort: the project tables (`projects`, `step_progress`,
 * `shops`, `project_shops`, `project_shop_choices`) are not in the database yet, so
 * the calls return null / defaults and the existing journey keeps working exactly as
 * before. Because those tables are absent, `src/integrations/supabase/types.ts` does
 * not describe them — they are reached through `projectDb`, a loosely-typed view of
 * the same client, so this module stays honest about what is and isn't set up.
 */
import { supabase } from "@/integrations/supabase/client";

/**
 * Same client, but without the generated table types: the optional project tables
 * have no entry in `types.ts`, and casting here keeps that file untouched.
 */
type LooseClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(relation: string): any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpc(functionName: string, args?: Record<string, unknown>): any;
};
export const projectDb = supabase as unknown as LooseClient;

const PROJECT_KEY = "hm_project_id";
const LOCAL_CHOICE_KEY = "hm_shop_choice";

export type ShopChoice = {
  use_suggested: boolean;
  use_custom_made: boolean;
  use_own_shops: boolean;
  own_shops_first: boolean;
};
export const DEFAULT_SHOP_CHOICE: ShopChoice = {
  use_suggested: true,
  use_custom_made: false,
  use_own_shops: false,
  own_shops_first: true,
};

/** A shop the user pasted into their project, as `scrape-shop` reports it. */
export type ProjectShop = {
  id: string;
  name: string;
  domain: string | null;
  url: string | null;
  status: string;
  product_count: number;
  last_scraped_at: string | null;
};

type RoomState = "core_shell" | "empty" | "partially_furnished" | "redo_all";
type PropertyType = "apartment" | "house" | "studio" | "loft";
type ProjectIntent = "new_space" | "redesign" | "exploring";

let readyCache: Promise<boolean> | null = null;
/** True when the project tables exist and the user can use them. */
export function projectsReady(): Promise<boolean> {
  if (!readyCache) {
    readyCache = (async () => {
      try {
        const { error } = await projectDb.from("projects").select("id", { head: true, count: "exact" }).limit(1);
        return !error;
      } catch {
        return false;
      }
    })();
  }
  return readyCache;
}

const safeStorage = {
  get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* private mode */
    }
  },
};

const STATE_MAP: Record<string, RoomState> = {
  "core-shell": "core_shell",
  empty: "empty",
  partial: "partially_furnished",
  redoing: "redo_all",
};
const PROPERTY_MAP: Record<string, PropertyType> = {
  apartment: "apartment",
  house: "house",
  studio: "studio",
  loft: "loft",
};
export const ROOM_LABELS: Record<string, string> = {
  "living-room": "Living room",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  "dining-living": "Dining + living",
  office: "Home office",
  bathroom: "Bathroom",
  "open-space-kitchen-dining-living": "Open space",
  "studio-apartment": "Studio",
};

/** Step 1 answers → a project with its rooms in order (the start room first). */
export async function createProjectFromGround(data: {
  propertyType: string;
  rooms: string[];
  houseState: string;
  startRoom: string;
}): Promise<string | null> {
  if (!(await projectsReady())) return null;
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return null;
    const state = STATE_MAP[data.houseState] ?? null;
    const intent: ProjectIntent =
      data.houseState === "partial" || data.houseState === "redoing" ? "redesign" : "new_space";

    const { data: project, error } = await projectDb
      .from("projects")
      .insert({
        owner_id: userId,
        name: "My home",
        intent,
        property_type: PROPERTY_MAP[data.propertyType] ?? null,
        step1_completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !project) return null;

    const ordered = [data.startRoom, ...data.rooms.filter((r) => r !== data.startRoom)].filter(Boolean);
    if (ordered.length) {
      const { data: created } = await projectDb.from("rooms").insert(
        ordered.map((roomType, i) => ({
          user_id: userId,
          project_id: project.id,
          name: ROOM_LABELS[roomType] ?? roomType,
          room_type: roomType,
          sequence_no: i + 1,
          starting_state: state,
        })),
      ).select("id, sequence_no");
      const first = (created ?? []).find((r) => r.sequence_no === 1);
      if (first) {
        safeStorage.set("hm_room_id", first.id);
        await projectDb.from("rooms").update({ current_step: 2 }).eq("id", first.id);
      }
    }
    await projectDb.from("step_progress").insert({ project_id: project.id, step_no: 1, status: "completed" });
    safeStorage.set(PROJECT_KEY, project.id);
    return project.id;
  } catch (e) {
    console.warn("[projects] could not save step 1", e);
    return null;
  }
}

/** The project this user is working on: the remembered one, else their latest, else a new one. */
export async function ensureProject(): Promise<string | null> {
  if (!(await projectsReady())) return null;
  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return null;
    const remembered = safeStorage.get(PROJECT_KEY);
    if (remembered) {
      const { data } = await projectDb.from("projects").select("id").eq("id", remembered).eq("owner_id", userId).maybeSingle();
      if (data) return data.id;
    }
    const { data: latest } = await projectDb
      .from("projects")
      .select("id")
      .eq("owner_id", userId)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest) {
      safeStorage.set(PROJECT_KEY, latest.id);
      return latest.id;
    }
    const { data: created } = await projectDb
      .from("projects")
      .insert({ owner_id: userId, name: "My home", intent: "exploring" })
      .select("id")
      .single();
    if (created) safeStorage.set(PROJECT_KEY, created.id);
    return created?.id ?? null;
  } catch {
    return null;
  }
}

export async function loadShopChoice(projectId: string | null): Promise<ShopChoice> {
  if (projectId) {
    const { data } = await projectDb.from("project_shop_choices").select("*").eq("project_id", projectId).maybeSingle();
    if (data) {
      return {
        use_suggested: data.use_suggested,
        use_custom_made: data.use_custom_made,
        use_own_shops: data.use_own_shops,
        own_shops_first: data.own_shops_first,
      };
    }
  }
  try {
    return { ...DEFAULT_SHOP_CHOICE, ...JSON.parse(safeStorage.get(LOCAL_CHOICE_KEY) ?? "{}") };
  } catch {
    return DEFAULT_SHOP_CHOICE;
  }
}

export async function saveShopChoice(projectId: string | null, choice: ShopChoice) {
  safeStorage.set(LOCAL_CHOICE_KEY, JSON.stringify(choice));
  if (!projectId) return;
  const { error } = await projectDb
    .from("project_shop_choices")
    .upsert({ project_id: projectId, ...choice, updated_at: new Date().toISOString() });
  if (error) throw error;
  // The room being designed has reached step 5 (furniture).
  const roomId = safeStorage.get("hm_room_id");
  if (roomId) await projectDb.from("rooms").update({ current_step: 5 }).eq("id", roomId).lt("current_step", 5);
}

export async function loadProjectShops(projectId: string | null): Promise<ProjectShop[]> {
  if (!projectId) return [];
  const { data } = await projectDb
    .from("project_shops")
    .select("shops(id, name, domain, url, status, product_count, last_scraped_at)")
    .eq("project_id", projectId)
    .order("added_at");
  return (data ?? []).map((r) => r.shops as ProjectShop).filter(Boolean);
}

/** Add a shop link to the project. A shop with the same domain is reused, even if someone else added it. */
export async function addProjectShop(projectId: string, link: string): Promise<ProjectShop> {
  const { data, error } = await projectDb.rpc("add_project_shop", { _project: projectId, _url: link });
  if (error) throw new Error(error.message.replace(/^.*?:\s*/, ""));
  const shop = (data ?? [])[0];
  if (!shop) throw new Error("Could not add this shop.");
  return shop as ProjectShop;
}

export async function removeProjectShop(projectId: string, shopId: string) {
  await projectDb.from("project_shops").delete().eq("project_id", projectId).eq("shop_id", shopId);
}

/** Read a shop the user added so its products can be matched (runs the existing scrape-shop function). */
export async function readShop(shop: ProjectShop) {
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase.functions.invoke("scrape-shop", {
    body: { shopUrl: shop.url ?? `https://${shop.domain}`, userId: auth.user?.id, shopRef: shop.id },
  });
  if (error) throw error;
  if (data?.success === false) throw new Error(data.error ?? "Could not read this shop.");
  return data as { message?: string; products?: unknown[] };
}

/** Shops whose products this user may be shown (approved ones plus their own), or null when shops are not set up. */
export async function visibleShopIds(): Promise<Set<string> | null> {
  if (!(await projectsReady())) return null;
  const { data, error } = await projectDb.from("shops").select("id");
  if (error) return null;
  return new Set((data ?? []).map((s) => s.id));
}

export type ShopPreferences = { choice: ShopChoice; ownShopIds: Set<string>; visibleShopIds: Set<string> | null };

/** What the product matcher needs: the shop choice, the user's own shops and the shops they may see. */
export async function loadShopPreferences(): Promise<ShopPreferences | null> {
  try {
    if (!(await projectsReady())) return null;
    const projectId = await ensureProject();
    const [choice, shops, visible] = await Promise.all([loadShopChoice(projectId), loadProjectShops(projectId), visibleShopIds()]);
    return { choice, ownShopIds: new Set(shops.map((s) => s.id)), visibleShopIds: visible };
  } catch {
    return null;
  }
}
