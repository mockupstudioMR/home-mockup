import { createClient } from "npm:@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/auth.ts";

/**
 * Publishes a prepared Generator PRO scene, not an AI segmentation service.
 * Every overlay MUST already be aligned, transparent and reviewed.
 * Inputs are storage object paths, never arbitrary remote URLs.
 */
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...headers, "Content-Type": "application/json" },
});
const BUCKET = "showroom-scene-assets";
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAFE = /^[a-zA-Z0-9/_-]+\.(?:png|webp|jpg|jpeg)$/;
const VIEWS = ["room", "wall_a", "wall_b", "wall_c", "wall_d"];

type LayerInput = {
  name: string;
  group: "furniture" | "walls" | "floor" | "lighting" | "decor";
  order: number;
  variations: string[];
  shadow?: string;
};
type RequestBody = {
  projectId: string; roomId: string; layoutId: string; view: string;
  backgroundPath: string; width: number; height: number; layers: LayerInput[];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  const caller = await requireAdmin(req, headers);
  if (caller instanceof Response) return caller;
  try {
    const body = await req.json() as RequestBody;
    if (!ID.test(body.projectId ?? "") || !ID.test(body.roomId ?? "") ||
      !body.layoutId || body.layoutId.length > 128 || !VIEWS.includes(body.view) ||
      !Number.isInteger(body.width) || !Number.isInteger(body.height) ||
      body.width < 128 || body.height < 128 || body.width > 4096 || body.height > 4096 ||
      !Array.isArray(body.layers) || body.layers.length < 1 || body.layers.length > 24) {
      return json({ error: "Invalid scene metadata; at least one real layer is required" }, 400);
    }
    const paths = [body.backgroundPath];
    const layers: Record<string, unknown> = {};
    for (const layer of body.layers) {
      if (!layer.name || !/^[a-zA-Z0-9_-]{1,64}$/.test(layer.name) ||
        layers[layer.name] || !Number.isFinite(layer.order) ||
        !Array.isArray(layer.variations) || layer.variations.length < 2 ||
        layer.variations.length > 20 ||
        !["furniture", "walls", "floor", "lighting", "decor"].includes(layer.group)) {
        return json({ error: "Invalid layer definition or duplicate layer name" }, 400);
      }
      paths.push(...layer.variations);
      if (layer.shadow) paths.push(layer.shadow);
    }
    if (paths.some(path => typeof path !== "string" || !SAFE.test(path) ||
      path.startsWith("/") || path.includes("..") || path.includes("//"))) {
      return json({ error: "Only relative PNG/WebP/JPEG storage paths are allowed" }, 400);
    }
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: room } = await db.from("rooms").select("id,project_id")
      .eq("id", body.roomId).eq("project_id", body.projectId).maybeSingle();
    if (!room) return json({ error: "Room does not belong to project" }, 404);

    // Validate the actual stored files before publishing. Do not publish a
    // manifest that points to nonexistent assets or an arbitrary external host.
    for (const path of new Set(paths)) {
      const index = path.lastIndexOf("/");
      const folder = index < 0 ? "" : path.slice(0, index);
      const name = path.slice(index + 1);
      const { data, error } = await db.storage.from(BUCKET).list(folder, { search: name, limit: 100 });
      if (error || !data?.some(item => item.name === name)) {
        return json({ error: `Missing prepared asset: ${path}` }, 422);
      }
    }
    const publicUrl = (path: string) => db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    for (const layer of body.layers) {
      // Generator PRO supports direct URL variations in array mode.
      // The shadow is optional; all assets share the scene's pixel dimensions.
      layers[layer.name] = {
        group: layer.group,
        order: layer.order,
        visible: true,
        variations: layer.variations.map(publicUrl),
        ...(layer.shadow ? { shadow: publicUrl(layer.shadow) } : {}),
      };
    }
    const manifest = {
      background: publicUrl(body.backgroundPath),
      imageSize: { width: body.width, height: body.height },
      layers,
    };
    const { data: latest, error: versionError } = await db.from("showroom_scenes")
      .select("version").eq("project_id", body.projectId).eq("room_id", body.roomId)
      .eq("layout_id", body.layoutId).eq("view", body.view)
      .order("version", { ascending: false }).limit(1);
    if (versionError) throw versionError;
    const version = (latest?.[0]?.version ?? 0) + 1;
    const manifestPath = `manifests/${body.projectId}/${body.roomId}/${encodeURIComponent(body.layoutId)}/${body.view}-v${version}.json`;
    const { error: uploadError } = await db.storage.from(BUCKET).upload(
      manifestPath, new Blob([JSON.stringify(manifest)], { type: "application/json" }),
      { contentType: "application/json", upsert: false },
    );
    if (uploadError) throw uploadError;
    const { data: saved, error: saveError } = await db.from("showroom_scenes").insert({
      project_id: body.projectId, room_id: body.roomId, layout_id: body.layoutId,
      view: body.view, manifest_url: publicUrl(manifestPath),
      assets_url: publicUrl(""), status: "ready", version,
    }).select("id,version,manifest_url").single();
    if (saveError) throw saveError;
    return json({ scene: saved, layerCount: body.layers.length });
  } catch (error) {
    console.error("[publish-showroom-scene]", error);
    return json({ error: error instanceof Error ? error.message : "Scene publish failed" }, 500);
  }
});
