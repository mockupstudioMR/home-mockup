## Goal

Run the full HomeMockUp quiz inside WhatsApp. Text-only questions are answered by replying with a number. Questions that need visuals (style moodboard, color palette, inspiration image, floor plan) are sent as a **one-time link** to a tiny web picker; the user taps, picks visually, and WhatsApp continues with the next question automatically. On completion, the user gets a link back to `/generate`.

## User flow

1. On `/quiz`, the user enters their phone number and taps **Send me the quiz on WhatsApp**.
2. WhatsApp sends message 1. They reply with numbers for text questions (`1`, `2`, …), `skip` for optional, `restart` to reset.
3. For visual questions, WhatsApp sends a short message + a unique link like `https://home-mockup.lovable.app/wa/<sessionId>/<step>?t=<token>`. The user taps, picks on a minimal mobile-first picker page, the picker posts the choice to our backend, and the next WhatsApp message arrives within a second.
4. After the last answer, WhatsApp sends a deep link `…/generate?wa_session=<id>` which hydrates `QuizContext` and runs generation.

## Question routing (text vs link)

| Step | Mode | Source component |
| --- | --- | --- |
| Intent | text (numbered) | `IntentStep` |
| Room type | text (numbered) | `RoomStep` |
| Style preference | **link → picker** | `StyleStep` moodboards (`styleMoodboards.ts`) |
| Color palette | **link → picker** | `ColorStep` swatches |
| Budget feel | text (numbered) | `BudgetStep` |
| Must-have elements | text (multi: `1,3,5` or `skip`) | `ElementsStep` |
| Furniture source | text (numbered) | `FurnitureSourceStep` |
| Inspiration image (optional) | **link → picker/uploader** | `ImageStep` (gallery + upload) |
| Floor plan (if room needs it) | **link → picker** | reuses existing `FloorPlan` page in a lightweight standalone mode |

Each visual question is delivered as: `"Pick your style here 👇 https://…/wa/<id>/style?t=<token> (link expires when you pick)"`.

## What gets built

**1. Twilio connector** — gateway-managed, no secrets pasted.

**2. DB** — `whatsapp_quiz_sessions`
- `id uuid pk`, `user_id uuid null`, `phone_e164 text`, `current_step int`, `answers jsonb`, `status text`, `step_token text` (rotated per visual step so old links die), `step_token_expires_at timestamptz`, `last_message_sid text`, timestamps
- Index on `phone_e164`
- RLS: `user_id = auth.uid()` for reads; picker pages read/write via service-role edge function using `step_token` (no auth required); GRANTs for `authenticated` + `service_role`.

**3. Edge functions**
- `whatsapp-quiz-start` (auth): `{ phone }` → create session, send msg 1.
- `whatsapp-quiz-webhook` (public, `verify_jwt=false`): Twilio inbound. Validates Twilio signature. Advances text steps. When the next step is visual, sends the picker link with a fresh `step_token`.
- `whatsapp-quiz-step` (public, `verify_jwt=false`): the picker page calls this with `{ sessionId, step, token, value }`. Validates token + step, stores answer, rotates token, triggers the next WhatsApp message via Twilio, returns `{ ok: true, nextStep }`.
- `whatsapp-quiz-claim` (auth): `{ sessionId }` → returns answers for `/generate` hydration.

**4. Frontend**
- `src/components/quiz/WhatsAppQuizCard.tsx` — phone input + send button + status poller.
- `src/pages/Quiz.tsx` — show the WhatsApp card as primary; small "answer here instead" link reveals existing in-app steps as fallback.
- `src/pages/WhatsAppPicker.tsx` (new, route `/wa/:sessionId/:step`) — minimal, no auth, mobile-first. Renders the matching visual picker:
  - `style` → reuses `styleMoodboards.ts` grid
  - `color` → reuses palette swatches from `ColorStep`
  - `image` → reuses `ImageStep` gallery + upload (writes to `room-photos`)
  - `floorplan` → embeds existing `FloorPlan` picker in a slimmed standalone shell
  After submit, shows: "Got it! Check WhatsApp for the next question 💬" and closes.
- `src/pages/Generate.tsx` — detect `?wa_session=<id>`, call `whatsapp-quiz-claim`, hydrate `QuizContext`, run normal generation.

**5. Security / resilience**
- Twilio signature validation on webhook.
- `step_token` is a single-use random string, rotated after each picker submit and expired after 30 min; old links return a friendly "this link expired, check WhatsApp for a new one" page.
- Invalid text reply → friendly retry with the option list.
- Session inactive >24h → marked `abandoned` on next inbound.

## Technical notes

- Twilio sender: `whatsapp:+E164`. Inbound `From=whatsapp:+...` — strip prefix.
- Twilio calls: `https://connector-gateway.lovable.dev/twilio/Messages.json`, headers `Authorization: Bearer ${LOVABLE_API_KEY}` + `X-Connection-Api-Key: ${TWILIO_API_KEY}`, body `application/x-www-form-urlencoded`.
- Webhook URL to paste in Twilio: `https://bofbkmgsefjnfbtvjgdz.supabase.co/functions/v1/whatsapp-quiz-webhook`.
- Picker pages render even when the user is logged out — the `step_token` is the only auth they need for that single step.
- For testing without an approved WhatsApp sender, use the Twilio sandbox (`join <code>`).
- Enable **SMS Pumping Protection** + **Geo Permissions** in Twilio before going live.

## What you'll do after I build

1. Approve the Twilio connector.
2. In Twilio: enable WhatsApp on a sender (or join sandbox), paste the webhook URL.
3. Test from the app.

Proceed?
