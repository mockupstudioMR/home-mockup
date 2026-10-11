/**
 * fetch() with a timeout, so one slow upstream (AI model, retailer site,
 * scraper) cannot hold an edge function until the platform kills it.
 *
 * Defaults by destination:
 * - Lovable AI gateway: 110 s, below the ~150 s edge function wall-clock
 *   limit so the function can still return a clear error to the app
 * - Firecrawl (scraping): 60 s
 * - anything else (image downloads, HEAD checks, Twilio): 15 s
 */

const AI_GATEWAY_MS = 110_000;
const SCRAPER_MS = 60_000;
const DEFAULT_MS = 15_000;

export class UpstreamTimeoutError extends Error {
  constructor(public readonly host: string, public readonly timeoutMs: number) {
    super(`${host} did not respond within ${Math.round(timeoutMs / 1000)} seconds. Please try again.`);
    this.name = "UpstreamTimeoutError";
  }
}

const urlOf = (input: string | URL | Request) =>
  typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

export const defaultTimeoutFor = (url: string) => {
  if (url.includes("ai.gateway.lovable.dev")) return AI_GATEWAY_MS;
  if (url.includes("api.firecrawl.dev")) return SCRAPER_MS;
  return DEFAULT_MS;
};

export async function fetchWithTimeout(
  input: string | URL | Request,
  init: RequestInit = {},
  timeoutMs?: number,
): Promise<Response> {
  const url = urlOf(input);
  const ms = timeoutMs ?? defaultTimeoutFor(url);
  const timeout = AbortSignal.timeout(ms);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  try {
    return await fetch(input, { ...init, signal });
  } catch (e) {
    if (timeout.aborted) {
      let host = url;
      try { host = new URL(url).host; } catch { /* keep raw url */ }
      throw new UpstreamTimeoutError(host, ms);
    }
    throw e;
  }
}

/**
 * CORS headers for edge function responses.
 *
 * Defined here rather than imported from `@supabase/supabase-js/cors`: that
 * subpath is not listed in the package's `exports` map (2.91+), so importing
 * it makes the whole function fail to load at runtime.
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
