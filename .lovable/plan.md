## Goal

Let users complete the entire HomeMockUp quiz inside WhatsApp. They tap "Start on WhatsApp" in the app, get a chat from our Twilio number, answer each question by replying with a number, and when finished receive a link back to `/generate` where their design is built from the answers they gave on WhatsApp.

The current in-app quiz stays available as a fallback, but WhatsApp becomes the primary path from the Quiz page.

## User flow

1. On `/quiz` the user sees one card: "Take the quiz on WhatsApp" with a phone input (country code + number).
2. They tap **Send me the quiz**. We create a session and Twilio sends message 1.
3. In WhatsApp they answer each question by replying with the option number (`1`, `2`, `3`…). Free-text questions (e.g. inspiration link, optional notes) accept any text. They can reply `skip` for optional steps and `restart` to start over.
4. After the last answer, WhatsApp sends a completion message with a deep link: `https://home-mockup.lovable.app/generate?wa_session=<id>`.
5. Opening that link signs the user in (or prompts auth), loads their answers into `QuizContext`, writes a `quiz_responses` row, and runs generation exactly like the in-app quiz does today.

## Quiz script over WhatsApp

The current quiz collects: `intent`, `roomType` (only required step today), and uses defaults for the rest (`style_preference=modern-minimal`, `color_palette=neutral`, `budget_feel=mid-range`, `furniture_source=open`). WhatsApp version asks the same things the user could be asked in the app, in this order, with numbered options matching the in-app step components:

1. Intent — Starting fresh / Updating current / Just gathering inspiration (`IntentStep`)
2. Room type — Living room / Bedroom / Kitchen / Dining / Office / Bathroom / Kids / Outdoor (`RoomStep`)
3. Style — options from `StyleStep`
4. Color palette — options from `ColorStep`
5. Budget feel — options from `BudgetStep`
6. Must-have elements — multi-select, reply with comma-separated numbers (e.g. `1,3,5`), or `skip`
7. Furniture source — Shop products only / Open to anything (`FurnitureSourceStep`)
8. Optional inspiration image — "Reply with a link, or `skip`"

A shared `whatsappQuiz.ts` module defines the question list, valid answers, and renders each message (e.g. `"What room? \n1️⃣ Living room \n2️⃣ Bedroom \n…\nReply with a number."`). Used by both edge functions and by the resume-on-web step so option labels stay in sync.

## What gets built

**1. Twilio connector**
Gateway-managed, no secrets pasted. After approval you'll enable WhatsApp on a sender (or use the Twilio sandbox for testing) and paste our webhook URL into the "When a message comes in" field.

**2. Database** — new table `whatsapp_quiz_sessions`
- `id uuid`, `user_id uuid null`, `phone_e164 text`, `current_step int`, `answers jsonb`, `status text` (`active` | `completed` | `abandoned`), `last_message_sid text`, `created_at`, `updated_at`
- Index on `phone_e164`
- RLS: users can read sessions where `user_id = auth.uid()` or where they hold the matching `wa_session` id; service role does all writes
- GRANTs for `authenticated` and `service_role` in the same migration

**3. Edge functions**
- `whatsapp-quiz-start` (auth required): `{ phone, userId? }` → creates a session, sends message 1 via Twilio gateway, returns `{ sessionId }`.
- `whatsapp-quiz-webhook` (public, `verify_jwt = false`): receives Twilio inbound (`application/x-www-form-urlencoded`), looks up active session by `From`, validates the reply against current step, advances state, sends next question. On completion sends the deep link and marks session `completed`. Handles `restart` and `skip`.
- `whatsapp-quiz-claim` (auth required): `{ sessionId }` → verifies session belongs to the caller (or links it if `user_id` was null), returns the `answers` object so the client can hydrate `QuizContext` and trigger generation.

**4. Frontend changes**
- `src/components/quiz/WhatsAppQuizCard.tsx` — phone input (E.164), country code select, "Send me the quiz on WhatsApp" button, post-send state showing "Open WhatsApp" link (`wa.me`) and a "Check status" poller.
- `src/pages/Quiz.tsx` — replace the current step UI with the WhatsApp card. Keep a small "Prefer to answer here?" link that reveals the existing in-app steps as a fallback.
- `src/pages/Generate.tsx` — detect `?wa_session=<id>` on mount; call `whatsapp-quiz-claim`, map the returned answers into `QuizContext` via `updateQuizData`, then run the same generation kickoff that the in-app flow does today.

**5. Status & resilience**
- Webhook validates Twilio signature using the connector secret to reject spoofed inbound.
- Invalid reply → friendly retry message ("Please reply with a number from 1 to N, or `skip`").
- Inactivity / abandoned sessions: a session older than 24h with `status='active'` is marked `abandoned` on next inbound from that phone (no cron needed for v1).

## Technical notes

- Twilio sender format: `whatsapp:+E164`. Inbound `From=whatsapp:+...` — strip the prefix before lookup.
- All Twilio calls go through `https://connector-gateway.lovable.dev/twilio/Messages.json` with `Authorization: Bearer ${LOVABLE_API_KEY}` and `X-Connection-Api-Key: ${TWILIO_API_KEY}`, body `application/x-www-form-urlencoded`.
- Webhook URL to paste into Twilio: `https://bofbkmgsefjnfbtvjgdz.supabase.co/functions/v1/whatsapp-quiz-webhook` (shown again after deploy).
- For testing without an approved WhatsApp sender, use the Twilio Sandbox — text `join <code>` to Twilio's sandbox number, then sessions work immediately.
- Reminder to enable **SMS Pumping Protection** and **Geo Permissions** in the Twilio console before going live.

## What you'll do after I build

1. Approve the Twilio connector when prompted.
2. In Twilio console: enable WhatsApp on a sender (or join the sandbox), paste the webhook URL into "When a message comes in".
3. Test by sending yourself the quiz from the app and replying on WhatsApp.

Proceed?
