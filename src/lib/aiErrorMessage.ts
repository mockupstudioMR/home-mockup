export const AI_CREDIT_ERROR_MESSAGE =
  "AI credits are exhausted for this workspace. Add credits, then try again.";

export const AI_BLOCKED_ERROR_MESSAGE =
  "AI access is blocked by a workspace policy or credit limit. An admin needs to unblock it.";

const extractMessage = (error: unknown): string => {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    // Supabase FunctionsHttpError often carries the JSON body on `context`
    const ctx = (error as unknown as { context?: unknown }).context;
    const ctxError =
      ctx && typeof ctx === "object" ? (ctx as { error?: string }).error : undefined;
    return [error.message, ctxError].filter(Boolean).join(" ");
  }
  if (typeof error === "object") {
    const obj = error as { error?: string; message?: string };
    return obj.error || obj.message || JSON.stringify(error);
  }
  return String(error);
};

export const getAiErrorMessage = (error: unknown, fallback = "Please try again") => {
  const message = extractMessage(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("402") ||
    normalized.includes("payment required") ||
    normalized.includes("credits are exhausted") ||
    normalized.includes("insufficient credit")
  ) {
    return AI_CREDIT_ERROR_MESSAGE;
  }

  if (
    normalized.includes("403") ||
    normalized.includes("credit limit") ||
    normalized.includes("blocked by")
  ) {
    return AI_BLOCKED_ERROR_MESSAGE;
  }

  if (normalized.includes("429") || normalized.includes("rate limit")) {
    return "AI is receiving too many requests right now. Please wait a moment and try again.";
  }

  return message && message !== "{}" ? message : fallback;
};
