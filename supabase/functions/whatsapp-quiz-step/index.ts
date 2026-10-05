import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { STEPS, advanceAndSend } from "../_shared/whatsappQuiz.ts";

// Public — called by the picker page with a single-use step_token.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const sessionId = String(body.sessionId ?? "");
    const visualKind = String(body.visualKind ?? "");
    const token = String(body.token ?? "");
    const value = body.value;

    if (!sessionId || !visualKind || !token) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (req.method === "GET" || body._action === "verify") {
      // not used: keep simple
    }

    const { data: session } = await admin
      .from("whatsapp_quiz_sessions")
      .select("*")
      .eq("id", sessionId)
      .maybeSingle();
    if (!session) return new Response(JSON.stringify({ error: "Session not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (session.step_token !== token) return new Response(JSON.stringify({ error: "Link expired" }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (session.step_token_expires_at && new Date(session.step_token_expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Link expired" }), { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const step = STEPS[session.current_step];
    if (!step || step.visualKind !== visualKind) {
      return new Response(JSON.stringify({ error: "Wrong step" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // The picker page is opened from WhatsApp, usually without being signed
    // in, so it cannot upload to storage itself (uploads are limited to the
    // user's own folder). Hand out a one-time signed upload URL instead, only
    // to holders of this session's valid step token.
    if (body._action === "upload-url") {
      const rawName = String(body.fileName ?? "photo.jpg");
      const safeName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "photo.jpg";
      const prefix = body.purpose === "style" ? "style-" : "";
      const path = `wa/${session.id}/${prefix}${Date.now()}-${safeName}`;
      const { data: signed, error: signErr } = await admin.storage
        .from("room-photos")
        .createSignedUploadUrl(path);
      if (signErr || !signed) {
        console.error("whatsapp-quiz-step: signed upload url failed", signErr);
        return new Response(JSON.stringify({ error: "Could not prepare the upload. Please try again." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: pub } = admin.storage.from("room-photos").getPublicUrl(path);
      return new Response(
        JSON.stringify({ path: signed.path, token: signed.token, publicUrl: pub.publicUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const answers = { ...(session.answers as Record<string, unknown>) };
    if (step.id === "stylePreference" && value && typeof value === "object" && !Array.isArray(value)) {
      const v = value as { style?: string; referenceImageUrl?: string };
      if (v.style) answers.stylePreference = v.style;
      if (v.referenceImageUrl) answers.sourceImageUrl = v.referenceImageUrl;
    } else {
      answers[step.id] = value;
    }
    await advanceAndSend(admin, session.id, session.phone_e164, session.current_step + 1, answers);
    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("whatsapp-quiz-step error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});