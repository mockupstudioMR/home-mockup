export const AI_CREDIT_ERROR_MESSAGE =
  "Lovable AI credits are exhausted. Add funds in Settings → Cloud & AI balance, then try again.";

export const getAiErrorMessage = (error: unknown, fallback = "Please try again") => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error ?? "");

  const normalized = message.toLowerCase();

  if (
    normalized.includes("402") ||
    normalized.includes("payment required") ||
    normalized.includes("ai gateway error: 402")
  ) {
    return AI_CREDIT_ERROR_MESSAGE;
  }

  if (normalized.includes("429") || normalized.includes("rate limit")) {
    return "AI is receiving too many requests right now. Please wait a moment and try again.";
  }

  return message && message !== "{}" ? message : fallback;
};