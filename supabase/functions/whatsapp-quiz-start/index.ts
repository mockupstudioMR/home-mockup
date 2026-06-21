import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sendWhatsApp, firstMessage } from "../_shared/whatsappQuiz.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const phoneRaw = String(body.phone ?? "").trim();
    const phone = phoneRaw.startsWith("+") ? phoneRaw : `+${phoneRaw}`;
    if (!/^\+\d{8,15}$/.test(phone)) {
      return new Response(JSON.stringify({ error: "Invalid phone (use E.164, e.g. +14155550123)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: session, error: sErr } = await admin
      .from("whatsapp_quiz_sessions")
      .insert({ user_id: userId, phone_e164: phone, current_step: 0, answers: {}, status: "active" })
      .select("id")
      .single();
    if (sErr) throw sErr;

    const msg = firstMessage();
    const sid = await sendWhatsApp(phone, msg);
    await admin.from("whatsapp_quiz_sessions").update({ last_message_sid: sid }).eq("id", session.id);

    return new Response(JSON.stringify({ ok: true, sessionId: session.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("whatsapp-quiz-start error", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});