import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Calls an AI edge function with a client-side timeout and turns failures into
 * messages a user can act on.
 *
 * Plain `supabase.functions.invoke` waits indefinitely and reports every
 * server error as "Edge Function returned a non-2xx status code". The
 * functions already send a readable `{ error }` body; this reads it.
 */

// generate-design keeps itself under ~140 s; leave room for network and cold starts.
export const GENERATION_TIMEOUT_MS = 170_000;

export const TIMEOUT_MESSAGE =
  "This is taking longer than expected. Please try again in a moment.";

const messageFromHttpError = async (error: FunctionsHttpError): Promise<string> => {
  const response = error.context as Response | undefined;
  const status = response?.status;
  let bodyMessage = "";
  try {
    const body = await response?.clone().json();
    bodyMessage = typeof body?.error === "string" ? body.error : "";
  } catch {
    /* body was not JSON */
  }
  if (status === 401) return bodyMessage || "Your session has expired. Please sign in again.";
  if (status === 504) return bodyMessage || TIMEOUT_MESSAGE;
  return bodyMessage || `Request failed (${status ?? "unknown status"}). Please try again.`;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- callers read untyped function responses
export async function invokeAi<T = any>(
  fn: string,
  options: { body?: unknown; timeoutMs?: number } = {},
): Promise<{ data: T | null; error: Error | null }> {
  const { body, timeoutMs = GENERATION_TIMEOUT_MS } = options;
  const { data, error } = await supabase.functions.invoke(fn, {
    body: body as Record<string, unknown>,
    timeout: timeoutMs,
  });
  if (!error) return { data: data as T, error: null };

  if (error instanceof FunctionsHttpError) {
    return { data: null, error: new Error(await messageFromHttpError(error)) };
  }
  const aborted =
    error instanceof FunctionsFetchError &&
    /abort/i.test(String((error.context as { name?: string; message?: string })?.name ?? error.context?.message ?? ""));
  if (aborted || /abort/i.test(error.message)) {
    return { data: null, error: new Error(TIMEOUT_MESSAGE) };
  }
  return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
}
