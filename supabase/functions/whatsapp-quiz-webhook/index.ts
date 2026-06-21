import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { STEPS, parseTextAnswer, renderTextStep, advanceAndSend, sendWhatsApp, firstMessage } from "../_shared/whatsappQuiz.ts";

// Public endpoint — Twilio webhook. verify_jwt is disabled via supabase/config.toml.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const form = await req.formData();
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