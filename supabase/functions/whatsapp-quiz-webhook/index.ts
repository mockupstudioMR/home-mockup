import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { verifyTwilioRequest } from "../_shared/twilioSignature.ts";
import { STEPS, parseTextAnswer, renderTextStep, advanceAndSend, sendWhatsApp, firstMessage } from "../_shared/whatsappQuiz.ts";
import { fetchWithTimeout } from "../_shared/http.ts";

async function downloadTwilioMediaToStorage(
  admin: ReturnType<typeof createClient>,
  mediaUrl: string,
  sessionId: string,
  contentType: string,
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
  if (!LOVABLE_API_KEY || !TWILIO_API_KEY) throw new Error("Twilio gateway credentials missing");

  // Twilio media URL: https://api.twilio.com/2010-04-01/Accounts/{Sid}/Messages/{MSid}/Media/{MeSid}
  // Gateway auto-prepends /2010-04-01/Accounts/{Sid}, so strip everything up to and including the Sid.
  const m = mediaUrl.match(/\/2010-04-01\/Accounts\/[^/]+(\/.*)$/);
  const pathSuffix = m ? m[1] : new URL(mediaUrl).pathname;
  const gatewayUrl = `https://connector-gateway.lovable.dev/twilio${pathSuffix}`;

  const res = await fetchWithTimeout(gatewayUrl, {
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY,
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Twilio media fetch failed [${res.status}]: ${await res.text()}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const ext = contentType.split("/")[1]?.split(";")[0] || "jpg";
  const path = `wa/${sessionId}/wa-${Date.now()}.${ext}`;
  const { error: upErr } = await admin.storage.from("room-photos").upload(path, bytes, {
    contentType,
    upsert: true,
  });
  if (upErr) throw upErr;
  const { data } = admin.storage.from("room-photos").getPublicUrl(path);
  return data.publicUrl;
}

// Public endpoint — Twilio webhook. verify_jwt is disabled via supabase/config.toml.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const form = await req.formData();

    // Reject forged requests: anyone can POST to this public URL and claim
    // any phone number in "From".
    const check = await verifyTwilioRequest(req, form);
    if (check === "invalid") {
      console.warn("whatsapp-quiz-webhook: rejected request with invalid Twilio signature");
      return new Response("Forbidden", { status: 403 });
    }
    if (check === "not-configured") {
      console.warn("whatsapp-quiz-webhook: TWILIO_AUTH_TOKEN not set; Twilio signatures are NOT verified");
    }

    const from = String(form.get("From") ?? ""); // e.g. "whatsapp:+1415..."
    const bodyRaw = String(form.get("Body") ?? "").trim();
    const phone = from.replace(/^whatsapp:/, "");
    const numMedia = parseInt(String(form.get("NumMedia") ?? "0"), 10) || 0;
    if (!phone) return new Response("ok");

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Latest active session for this phone
    const { data: session } = await admin
      .from("whatsapp_quiz_sessions")
      .select("*")
      .eq("phone_e164", phone)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!session) {
      await sendWhatsApp(phone, "Hi! I don't see an active quiz for this number. Please start one from the HomeMockUp app.");
      return new Response("ok");
    }

    const lower = bodyRaw.toLowerCase();
    if (lower === "restart") {
      await admin.from("whatsapp_quiz_sessions").update({ current_step: 0, answers: {}, status: "active", step_token: null }).eq("id", session.id);
      await sendWhatsApp(phone, firstMessage());
      return new Response("ok");
    }

    const step = STEPS[session.current_step];
    if (!step) {
      await sendWhatsApp(phone, "Your quiz is already complete 🎉");
      return new Response("ok");
    }

    const answers = { ...(session.answers as Record<string, unknown>) };

    // Handle inbound media (photo via WhatsApp)
    if (numMedia > 0) {
      const mediaUrl = String(form.get("MediaUrl0") ?? "");
      const contentType = String(form.get("MediaContentType0") ?? "image/jpeg");
      if (mediaUrl && contentType.startsWith("image/")) {
        try {
          const publicUrl = await downloadTwilioMediaToStorage(admin, mediaUrl, session.id, contentType);
          answers.sourceImageUrl = publicUrl;
          await admin.from("whatsapp_quiz_sessions").update({ answers }).eq("id", session.id);

          // If on style step, accept image as reference and advance (keep any prior style pick or leave blank for default)
          if (step.kind === "link" && step.visualKind === "style") {
            if (!answers.stylePreference) answers.stylePreference = "modern_minimal";
            await sendWhatsApp(phone, "📸 Got your reference image! Saved as inspiration.");
            await advanceAndSend(admin, session.id, phone, session.current_step + 1, answers);
            return new Response("ok");
          }
          if (step.kind === "optional-link" && step.visualKind === "image") {
            answers[step.id] = publicUrl;
            await advanceAndSend(admin, session.id, phone, session.current_step + 1, answers);
            return new Response("ok");
          }
          await sendWhatsApp(phone, "📸 Saved your image as inspiration. Continuing…\n\n" + renderTextStep(step));
          return new Response("ok");
        } catch (mediaErr) {
          console.error("twilio media download failed", mediaErr);
          await sendWhatsApp(phone, "Hmm, I couldn't read that image. Try sending it again, or tap the link to upload.");
          return new Response("ok");
        }
      }
    }

    if (step.kind === "link") {
      await sendWhatsApp(phone, `Please tap the link above to pick ${step.visualKind}. Reply 'restart' to start over.`);
      return new Response("ok");
    }
    if (step.kind === "optional-link") {
      if (lower === "skip" || lower === "") {
        answers[step.id] = null;
        await advanceAndSend(admin, session.id, phone, session.current_step + 1, answers);
        return new Response("ok");
      }
      await sendWhatsApp(phone, `Tap the link above to upload, or reply 'skip' to skip.`);
      return new Response("ok");
    }

    const parsed = parseTextAnswer(step, bodyRaw);
    if (parsed === null) {
      await sendWhatsApp(phone, `Sorry, I didn't catch that.\n\n${renderTextStep(step)}`);
      return new Response("ok");
    }
    answers[step.id] = parsed;
    await advanceAndSend(admin, session.id, phone, session.current_step + 1, answers);
    return new Response("ok");
  } catch (e) {
    console.error("whatsapp-quiz-webhook error", e);
    return new Response("ok"); // never 500 to Twilio
  }
});