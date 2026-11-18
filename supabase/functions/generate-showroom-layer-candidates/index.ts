import { createClient } from "npm:@supabase/supabase-js@2";
import { requireAdmin } from "../_shared/auth.ts";
import { fetchWithTimeout } from "../_shared/http.ts";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...headers, "Content-Type": "application/json" },
});
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAFE = /^[a-zA-Z0-9/_-]+\.(?:png|webp|jpg|jpeg)$/;
const BUCKET = "showroom-scene-assets";
const db = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

/**
 * Admin-triggered one-job-at-a-time AI variation generator.
 * Outputs are candidates only. They cannot be published until a reviewer
 * confirms perspective, product fidelity, alpha and camera alignment.
 */
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  const caller = await requireAdmin(req, headers);
  if (caller instanceof Response) return caller;
  const client = db();
  let jobId: string | undefined;
  try {
    const body = await req.json() as { jobId?: string };
    if (!UUID.test(body.jobId ?? "")) return json({ error: "Valid jobId required" }, 400);
    jobId = body.jobId;
    const { data: job, error } = await client.from("showroom_asset_jobs")
      .select("*").eq("id", jobId).single();
    if (error || !job) return json({ error: "Job not found" }, 404);
    if (job.status !== "queued" && job.status !== "failed") {
      return json({ status: job.status, outputPaths: job.output_paths });
    }
    if (job.attempts >= 3) return json({ error: "Retry limit reached" }, 409);
    if (!SAFE.test(job.reference_path) || job.reference_path.includes("..") ||
      !["furniture","walls","floor","lighting","decor"].includes(job.category)) {
      return json({ error: "Invalid asset source" }, 400);
    }
    const { data: claimed, error: claimError } = await client.from("showroom_asset_jobs")
      .update({ status: "processing", attempts: job.attempts + 1, error: null, updated_at: new Date().toISOString() })
      .eq("id", jobId).eq("status", job.status).select("id").maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) return json({ status: "already_processing" }, 409);
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
    const reference = client.storage.from(BUCKET).getPublicUrl(job.reference_path).data.publicUrl;
    const candidates: string[] = [];
    for (let i = 0; i < 2; i++) {
      const prompt = `Create candidate variation ${i + 1} for a ${job.category} layer in a fixed-camera interior showroom. ${job.prompt}.
Reference image: maintain the exact room perspective, scale, lighting and camera. Output ${job.width}x${job.height} landscape image. Keep every pixel outside the requested object/surface unchanged. No text, watermarks or added objects. This is a REVIEW CANDIDATE, not a verified alpha overlay.`;
      const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: reference } },
          ] }],
          modalities: ["image","text"],
        }),
      });
      if (!response.ok) throw new Error(`Image service status ${response.status}`);
      const result = await response.json();
      const url: string | undefined = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!url?.startsWith("data:image/")) throw new Error("No image candidate returned");
      const mime = url.slice(5, url.indexOf(";"));
      if (!["image/png","image/jpeg","image/webp"].includes(mime)) throw new Error("Unsupported image format");
      const bytes = Uint8Array.from(atob(url.slice(url.indexOf(",") + 1)), x => x.charCodeAt(0));
      const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
      const path = `candidates/${job.project_id}/${job.id}/variation-${i + 1}.${ext}`;
      const { error: uploadError } = await client.storage.from(BUCKET)
        .upload(path, new Blob([bytes], { type: mime }), { contentType: mime, upsert: true });
      if (uploadError) throw uploadError;
      candidates.push(path);
    }
    const { error: saveError } = await client.from("showroom_asset_jobs")
      .update({ status: "review", output_paths: candidates, updated_at: new Date().toISOString() })
      .eq("id", jobId).eq("status", "processing");
    if (saveError) throw saveError;
    return json({ status: "review", jobId, candidates, warning: "Candidates are not aligned transparent layers; manual masking, registration and approval are required before publishing." });
  } catch (error) {
    if (jobId) await client.from("showroom_asset_jobs")
      .update({ status: "failed", error: error instanceof Error ? error.message : String(error), updated_at: new Date().toISOString() })
      .eq("id", jobId).eq("status", "processing");
    return json({ error: error instanceof Error ? error.message : "Generation failed" }, 500);
  }
});
