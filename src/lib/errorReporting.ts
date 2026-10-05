import { trackEvent } from "@/lib/analytics";

/**
 * Records client crashes as "client_error" rows in analytics_events, so they
 * show up in the admin Analytics tab. Only signed-in users can write there;
 * errors of logged-out visitors stay in the browser console.
 *
 * Capped per page load and de-duplicated, so a render loop cannot flood the
 * table.
 */

const MAX_REPORTS_PER_PAGE = 10;
const seen = new Set<string>();
let sent = 0;

export type ErrorKind = "render" | "uncaught" | "unhandled_rejection" | "chunk_load";

const asError = (value: unknown): Error => {
  if (value instanceof Error) return value;
  if (typeof value === "string") return new Error(value);
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
};

export const isChunkLoadError = (value: unknown) => {
  const message = asError(value).message;
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Loading chunk \d+ failed/i.test(
    message,
  );
};

export function reportError(
  value: unknown,
  kind: ErrorKind,
  extra: Record<string, unknown> = {},
): void {
  const error = asError(value);
  const message = error.message.slice(0, 500);
  const screen = typeof window !== "undefined" ? window.location.pathname : "unknown";
  const key = `${kind}|${screen}|${message}`;

  console.error(`[${kind}]`, error, extra);
  if (seen.has(key) || sent >= MAX_REPORTS_PER_PAGE) return;
  seen.add(key);
  sent++;

  void trackEvent("client_error", screen, {
    kind,
    message,
    name: error.name,
    stack: error.stack?.slice(0, 2000),
    url: typeof window !== "undefined" ? window.location.href.slice(0, 500) : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : undefined,
    ...extra,
  });
}

let installed = false;

/** Report uncaught errors and unhandled promise rejections. Call once at startup. */
export function installGlobalErrorReporting(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    // Resource load errors (broken <img> etc.) have no `error` object; skip them.
    if (!event.error) return;
    reportError(event.error, isChunkLoadError(event.error) ? "chunk_load" : "uncaught");
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportError(event.reason, isChunkLoadError(event.reason) ? "chunk_load" : "unhandled_rejection");
  });
}
