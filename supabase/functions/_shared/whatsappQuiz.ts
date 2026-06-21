// Shared WhatsApp quiz logic: question flow + Twilio sender.

export const APP_URL = Deno.env.get("APP_URL") ?? "https://home-mockup.lovable.app";

export type StepKind = "text" | "multi" | "link" | "optional-link";

export interface QuestionStep {
  id: string;            // answer key in session.answers
  kind: StepKind;
  prompt: string;        // base prompt text
  options?: { value: string; label: string }[];
  visualKind?: "style" | "color" | "image"; // for link steps
}

export const STEPS: QuestionStep[] = [
  {
    id: "intent",
    kind: "text",
    prompt: "Why are you here today?",
    options: [
      { value: "starting-fresh", label: "Starting fresh in a new space" },
      { value: "updating-current", label: "Updating my current space" },
      { value: "gathering-inspiration", label: "Gathering inspiration" },
    ],
  },
  {
    id: "roomType",
    kind: "text",
    prompt: "Which room are we designing?",
    options: [
      { value: "living-room", label: "Living Room" },
      { value: "bedroom", label: "Bedroom" },
      { value: "kitchen", label: "Kitchen" },
      { value: "office", label: "Home Office" },
      { value: "bathroom", label: "Bathroom" },
      { value: "open-space-kitchen-dining-living", label: "Open Space (Kitchen + Dining + Living)" },
      { value: "dining-living", label: "Dining + Living" },
      { value: "studio-apartment", label: "Studio Apartment" },
    ],
  },
  { id: "stylePreference", kind: "link", visualKind: "style", prompt: "Time to pick your design style 🎨" },
  { id: "colorPalette", kind: "link", visualKind: "color", prompt: "Pick the color palette that feels like home 🎨" },
  {
    id: "budgetFeel",
    kind: "text",
    prompt: "What's your budget feel?",
    options: [
      { value: "budget-friendly", label: "Budget-friendly" },
      { value: "mid-range", label: "Mid-range" },
      { value: "high-end", label: "High-end" },
      { value: "luxury", label: "Luxury / no limit" },
    ],
  },
  {
    id: "mustHaveElements",
    kind: "multi",
    prompt: "Any must-have elements? (reply with numbers separated by commas, or 'skip')",
    options: [
      { value: "plants", label: "Plants & greenery" },
      { value: "art", label: "Wall art" },
      { value: "rug", label: "Statement rug" },
      { value: "lighting", label: "Mood lighting" },
      { value: "storage", label: "Smart storage" },
      { value: "textiles", label: "Cozy textiles" },
    ],
  },
  {
    id: "furnitureSource",
    kind: "text",
    prompt: "Where should furniture come from?",
    options: [
      { value: "open", label: "Anywhere (AI picks freely)" },
      { value: "shop_only", label: "Only from partner shops" },
    ],
  },
  { id: "sourceImageUrl", kind: "optional-link", visualKind: "image", prompt: "Got an inspiration image? (optional)" },
];

export function firstMessage(): string {
  return [
    "👋 Welcome to HomeMockUp!",
    "I'll guide you through a few quick questions and design your dream room.",
    "Reply 'restart' anytime to start over.",
    "",
    renderTextStep(STEPS[0]),
  ].join("\n");
}

export function renderTextStep(step: QuestionStep): string {
  const lines = [step.prompt];
  if (step.options) {
    step.options.forEach((o, i) => lines.push(`${i + 1}. ${o.label}`));
    lines.push(step.kind === "multi" ? "(e.g. 1,3 or 'skip')" : "(reply with a number)");
  }
  return lines.join("\n");
}

export function renderLinkStep(step: QuestionStep, sessionId: string, token: string): string {
  const url = `${APP_URL}/wa/${sessionId}/${step.visualKind}?t=${token}`;
  const skipNote = step.kind === "optional-link" ? "\n(Reply 'skip' to skip)" : "";
  return `${step.prompt}\nTap to pick: ${url}${skipNote}`;
}

export function parseTextAnswer(step: QuestionStep, raw: string): string | string[] | null {
  const text = raw.trim().toLowerCase();
  if (!step.options) return null;
  if (step.kind === "multi") {
    if (text === "skip" || text === "") return [];
    const nums = text.split(/[,\s]+/).map((n) => parseInt(n, 10)).filter((n) => !Number.isNaN(n));
    const picked: string[] = [];
    for (const n of nums) {
      const opt = step.options[n - 1];
      if (!opt) return null;
      picked.push(opt.value);
    }
    return picked;
  }
  const n = parseInt(text, 10);
  if (Number.isNaN(n)) return null;
  const opt = step.options[n - 1];
  return opt ? opt.value : null;
}

export function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sendWhatsApp(toE164: string, body: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");
  const TWILIO_WHATSAPP_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM") ?? "+14155238886"; // Twilio sandbox default
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");
  if (!TWILIO_API_KEY) throw new Error("TWILIO_API_KEY missing");

  const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: `whatsapp:${toE164}`,
      From: `whatsapp:${TWILIO_WHATSAPP_FROM.startsWith("+") ? TWILIO_WHATSAPP_FROM : "+" + TWILIO_WHATSAPP_FROM}`,
      Body: body,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Twilio error [${res.status}]: ${JSON.stringify(data)}`);
  return data.sid as string;
}

export async function advanceAndSend(
  admin: ReturnType<typeof import("npm:@supabase/supabase-js@2").createClient>,
  sessionId: string,
  phone: string,
  nextStepIndex: number,
  answers: Record<string, unknown>,
): Promise<void> {
  if (nextStepIndex >= STEPS.length) {
    await admin
      .from("whatsapp_quiz_sessions")
      .update({ status: "completed", current_step: nextStepIndex, answers, step_token: null, step_token_expires_at: null })
      .eq("id", sessionId);
    const link = `${APP_URL}/generate?wa_session=${sessionId}`;
    await sendWhatsApp(phone, `🎉 All set! Tap to see your design:\n${link}`);
    return;
  }
  const step = STEPS[nextStepIndex];
  if (step.kind === "link" || step.kind === "optional-link") {
    const token = generateToken();
    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    await admin
      .from("whatsapp_quiz_sessions")
      .update({ current_step: nextStepIndex, answers, step_token: token, step_token_expires_at: expires })
      .eq("id", sessionId);
    const sid = await sendWhatsApp(phone, renderLinkStep(step, sessionId, token));
    await admin.from("whatsapp_quiz_sessions").update({ last_message_sid: sid }).eq("id", sessionId);
  } else {
    await admin
      .from("whatsapp_quiz_sessions")
      .update({ current_step: nextStepIndex, answers, step_token: null, step_token_expires_at: null })
      .eq("id", sessionId);
    const sid = await sendWhatsApp(phone, renderTextStep(step));
    await admin.from("whatsapp_quiz_sessions").update({ last_message_sid: sid }).eq("id", sessionId);
  }
}