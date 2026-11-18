import { createClient } from "npm:@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/auth.ts";
import { fetchWithTimeout } from "../_shared/http.ts";

/**
 * Admin-only. Generates ONE default showroom background per call (an image
 * takes 20–60 s, so one per call stays well inside the function time limit;
 * the admin page calls it again until nothing is left).
 *
 * Body: { id?: string, roomType?: string, state?: string }
 *  - id: (re)generate that row
 *  - otherwise: the next row with status 'to_generate', filtered by
 *    roomType / state if given. Whole-room views go first, so wall views
 *    can use the room picture as a reference and look like the same room.
 *
 * Returns { done: boolean, row?: {...}, remaining: number }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const BUCKET = "showroom-backgrounds";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const VIEW_ORDER = ["room", "wall_a", "wall_b", "wall_c", "wall_d"];
type Bg = { id: string; starting_state: string; room_type: string; view: string; prompt: string; image_path: string | null };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const caller = await requireAdmin(req, corsHeaders);
  if (caller instanceof Response) return caller;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { id, roomType, state } = (await req.json().catch(() => ({}))) as { id?: string; roomType?: string; state?: string };

    const pending = (cols = "*", opts?: { count: "exact"; head: boolean }) => {
      let q = db.from("showroom_backgrounds").select(cols, opts).eq("status", "to_generate");
      if (roomType) q = q.eq("room_type", roomType);
      if (state) q = q.eq("starting_state", state);
      return q;
    };

    let row: Bg | null = null;
    if (id) {
      const { data, error } = await db.from("showroom_backgrounds").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      row = data as Bg | null;
    } else {
      const { data, error } = await pending().limit(200);
      if (error) throw error;
      row = ((data ?? []) as Bg[]).sort((a, b) => VIEW_ORDER.indexOf(a.view) - VIEW_ORDER.indexOf(b.view))[0] ?? null;
    }
    if (!row) return json({ done: true, remaining: 0 });

    // Wall views: show the model the whole-room picture so it stays the same room.
    let reference: string | null = null;
    if (row.view !== "room") {
      const { data: roomRow } = await db.from("showroom_backgrounds").select("image_path")
        .eq("starting_state", row.starting_state).eq("room_type", row.room_type).eq("view", "room").maybeSingle();
      // Only full URLs can be sent to the image service (test rows use app paths).
      reference = roomRow?.image_path?.startsWith("http") ? roomRow.image_path : null;
    }

    const text = `${row.prompt}${reference ? " Use the attached picture as the same room: keep its walls, floor, ceiling, windows, door and light exactly the same, only change the camera to this view." : ""} Landscape 16:9.`;
    const content: unknown[] = [{ type: "text", text }];
    if (reference) content.push({ type: "image_url", image_url: { url: reference } });

    const res = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash-image", messages: [{ role: "user", content }], modalities: ["image", "text"] }),
    });
    if (res.status === 429) return json({ error: "The image service is busy. Wait a minute and press Generate again." }, 429);
    if (res.status === 402) return json({ error: "The AI workspace is out of credits. Top it up in Lovable, then press Generate again." }, 402);
    if (!res.ok) throw new Error(`Image service answered ${res.status}`);
    const data = await res.json();
    const dataUrl: string | undefined = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!dataUrl?.startsWith("data:")) throw new Error("No image came back. Try again.");

    const mime = dataUrl.slice(5, dataUrl.indexOf(";")) || "image/png";
    const bytes = Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(",") + 1)), (c) => c.charCodeAt(0));
    const path = `${row.starting_state}/${row.room_type}/${row.view}-${Date.now()}.${mime.split("/")[1] ?? "png"}`;
    const { error: upErr } = await db.storage.from(BUCKET).upload(path, new Blob([bytes], { type: mime }), { contentType: mime, upsert: true });
    if (upErr) throw upErr;
    const publicUrl = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

    const { data: saved, error: saveErr } = await db.from("showroom_backgrounds")
      .update({ image_path: publicUrl, status: "generated", updated_at: new Date().toISOString() })
      .eq("id", row.id).select("*").single();
    if (saveErr) throw saveErr;

    const { count } = await pending("id", { count: "exact", head: true });
    return json({ done: false, row: saved, remaining: count ?? 0 });
  } catch (e) {
    console.error("[generate-showroom-backgrounds]", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
