## WhatsApp Quiz via Twilio

Deliver the HomeMockUp quiz as a WhatsApp chat: the user enters their phone number, our backend sends them numbered questions through Twilio's WhatsApp Business API, they reply with a number (e.g. "2") for each option, and when complete we save it as a `quiz_responses` row tied to their account and link back to the app to generate the design.

### What gets built

**1. Twilio connector**
Connect Twilio via the standard connector (gateway-managed credentials, no secrets to paste). I'll guide you to enable WhatsApp on your Twilio sender (or use the Twilio Sandbox number for testing).

**2. Database** — new table `whatsapp_quiz_sessions`
- `id`, `user_id` (nullable — sessions can start anonymously and link on completion), `phone_e164`, `current_step` (int), `answers` (jsonb), `status` ('active' | 'completed' | 'abandoned'), `last_message_sid`, timestamps
- RLS: users can read their own sessions; service role writes everything from edge functions
- Index on `phone_e164` for fast inbound lookup

**3. Edge functions**
- `whatsapp-quiz-start` (called from the app): accepts `{ phone, userId }`, creates a session, sends the first WhatsApp message via Twilio gateway
- `whatsapp-quiz-webhook` (public, `verify_jwt = false`): receives Twilio inbound webhooks (`application/x-www-form-urlencoded`), looks up the session by `From`, validates the reply against the current step's options, advances state, sends the next question or the completion message + deep link, and on completion writes a `quiz_responses` row

**4. Quiz script**
A single shared `whatsappQuiz.ts` module (used by both edge functions) defines the question list, valid answers, and how to render each one as WhatsApp text (e.g. "What room? \n1️⃣ Living room \n2️⃣ Bedroom \n…"). Matches the current in-app quiz schema (`style_preference`, `color_palette`, `room_type`, `budget_feel`, `intent`).

**5. UI entry point** — `src/components/quiz/WhatsAppQuizCard.tsx`
Card on the Quiz page with a phone input (E.164), country code, "Send me the quiz on WhatsApp" button. Calls `whatsapp-quiz-start`, shows a confirmation toast, and a "Check status" link that polls the session row and redirects to `/generate` once `status = 'completed'`.

### Technical notes (for the dev)

- Twilio WhatsApp sender format is `whatsapp:+E164`. The webhook receives `From=whatsapp:+...` and `Body=...` — we strip the prefix before lookup.
- All Twilio calls go through `https://connector-gateway.lovable.dev/twilio/Messages.json` with `Authorization: Bearer ${LOVABLE_API_KEY}` and `X-Connection-Api-Key: ${TWILIO_API_KEY}`. Body is `application/x-www-form-urlencoded`.
- The Twilio webhook URL to paste into the Twilio console: `https://bofbkmgsefjnfbtvjgdz.supabase.co/functions/v1/whatsapp-quiz-webhook`. I'll show this after deploy.
- For testing without an approved WhatsApp sender, Twilio offers a sandbox — the user joins by texting "join <code>" to Twilio's sandbox number, then can receive messages immediately.
- SMS Pumping Protection + Geo Permissions: I'll remind you to enable these in the Twilio console before going live, per Twilio's anti-abuse guidance.
- The in-app quiz UI stays as-is. WhatsApp is an additional channel, not a replacement.

### What you'll need to do after I build

1. Approve the Twilio connector connection when prompted
2. In Twilio console: enable WhatsApp on a sender (or join the sandbox), then paste the webhook URL I provide into the "When a message comes in" field
3. Test by texting your WhatsApp number from the app

Want me to proceed?