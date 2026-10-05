/**
 * Twilio webhook signature check (X-Twilio-Signature).
 *
 * Twilio signs: the full webhook URL + every POST param, sorted by name, with
 * name and value appended without separators. HMAC-SHA1 with the account's
 * auth token, base64-encoded.
 * https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */

const encoder = new TextEncoder();

export async function computeTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
): Promise<string> {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(authToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

const timingSafeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

export type TwilioCheck = "valid" | "invalid" | "not-configured";

/**
 * Verifies the request when TWILIO_AUTH_TOKEN is set. The signed URL must be
 * the public URL configured in Twilio; set WHATSAPP_WEBHOOK_URL if it differs
 * from `${SUPABASE_URL}/functions/v1/whatsapp-quiz-webhook`.
 */
export async function verifyTwilioRequest(
  req: Request,
  form: FormData,
): Promise<TwilioCheck> {
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  if (!authToken) return "not-configured";

  const signature = req.headers.get("X-Twilio-Signature") ?? "";
  if (!signature) return "invalid";

  const url =
    Deno.env.get("WHATSAPP_WEBHOOK_URL") ??
    `${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-quiz-webhook`;

  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) params[k] = typeof v === "string" ? v : "";

  const expected = await computeTwilioSignature(authToken, url, params);
  return timingSafeEqual(expected, signature) ? "valid" : "invalid";
}
