import { createClient } from "npm:@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/auth.ts";

/**
 * Library-first orchestration for camera-registered demo scenes.
 * Reuse only exact camera/dimension matches; never stretch unrelated
 * product photos into full-canvas overlays.
 */
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { ...headers, "Content-Type": "application/json" },
});
const categories = ["furniture", "walls", "floor", "lighting", "decor"] as const;
type Category = typeof categories[number];
type RequestBody = {
  projectId: string; roomId: string; layoutId: string;
  roomType: string; cameraKey: string; view: string;
  backgroundPath: string; width: number; height: number;
  categories?: Category[]; commercial?: boolean;
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAFE = /^[a-zA-Z0-9/_-]+\.(png|webp|jpg|jpeg)$/;

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  const caller = await requireAdmin(req, headers);
  if (caller instanceof Response) return caller;
  try {
    const b = await req.json() as RequestBody;
    if (!UUID.test(b.projectId ?? "") || !UUID.test(b.roomId ?? "") ||
      !b.layoutId || b.layoutId.length > 128 || !b.roomType ||
      !b.cameraKey || b.cameraKey.length > 128 ||
      !["room","wall_a","wall_b","wall_c","wall_d"].includes(b.view) ||
      !Number.isInteger(b.width) || !Number.isInteger(b.height) ||
      b.width < 128 || b.height < 128 || b.width > 4096 || b.height > 4096 ||
      !SAFE.test(b.backgroundPath ?? "") || b.backgroundPath.includes("..")) {
      return json({ error: "Invalid scene request" }, 400);
    }
    const requested = [...new Set(b.categories?.length ? b.categories : categories)];
    if (requested.some(c => !categories.includes(c))) return json({ error: "Invalid category" }, 400);
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: entries, error } = await db.from("showroom_asset_library").select("*")
      .eq("approved", true).eq("room_type", b.roomType).eq("camera_key", b.cameraKey)
      .eq("width", b.width).eq("height", b.height)
      .in("category", requested)
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    const selected = new Map<Category, typeof entries[number]>();
    for (const entry of entries ?? []) {
      if (b.commercial && entry.license_scope !== "commercial") continue;
      if (!selected.has(entry.category)) selected.set(entry.category, entry);
    }
    const missing = requested.filter(c => !selected.has(c));
    // Queue missing categories for reviewable generation. Avoid duplicate
    // in-flight jobs for the same room/camera/category.
    const queuedJobs: string[] = [];
    for (const category of missing) {
      const { data: existing } = await db.from("showroom_asset_jobs").select("id")
        .eq("project_id", b.projectId).eq("room_id", b.roomId)
        .eq("camera_key", b.cameraKey).eq("category", category)
        .in("status", ["queued", "processing", "review"]).limit(1);
      if (existing?.length) { queuedJobs.push(existing[0].id); continue; }
      const { data: job, error: jobError } = await db.from("showroom_asset_jobs").insert({
        project_id: b.projectId, room_id: b.roomId,
        room_type: b.roomType, camera_key: b.cameraKey, category,
        width: b.width, height: b.height,
        reference_path: b.backgroundPath,
        prompt: `Generate ${category} variation candidates for ${b.roomType}, camera ${b.cameraKey}.`,
      }).select("id").single();
      if (jobError) throw jobError;
      queuedJobs.push(job.id);
    }
    if (!selected.size) return json({
      status: "assets_required", reused: [], missing, queuedJobs,
      message: "No approved, camera-aligned asset library matches this scene. Generate and review layers before publishing.",
    }, 202);
    const layers = [...selected.entries()].map(([category, entry], order) => ({
      name: category,
      group: category,
      order: order * 10 + 10,
      variations: entry.image_paths,
      ...(entry.shadow_path ? { shadow: entry.shadow_path } : {}),
    }));
    // Publish through the existing admin-authenticated function using the
    // caller's token, rather than duplicating its validation and versioning.
    const auth = req.headers.get("authorization") ?? "";
    const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/publish-showroom-scene`, {
      method: "POST",
      headers: {
        authorization: auth,
        apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        projectId: b.projectId, roomId: b.roomId, layoutId: b.layoutId,
        view: b.view, backgroundPath: b.backgroundPath,
        width: b.width, height: b.height, layers,
      }),
    });
    const published = await response.json();
    if (!response.ok) return json({ error: "Publishing failed", details: published }, response.status);
    return json({ status: missing.length ? "partial" : "ready",
      reused: [...selected.values()].map(x => x.id), missing, queuedJobs, published });
  } catch (e) {
    console.error("[prepare-showroom-scene]", e);
    return json({ error: e instanceof Error ? e.message : "Preparation failed" }, 500);
  }
});
