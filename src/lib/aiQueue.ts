import { supabase } from "@/integrations/supabase/client";

/**
 * Global concurrency limiter for edge-function AI calls.
 *
 * The moodboard used to fire ~10+ `generate-highlight-visuals` invocations in
 * parallel, which makes the edge runtime cold-boot that many isolates at once
 * and fail with 503 BOOT_ERROR. Serialising to a small number of in-flight
 * requests keeps every call warm and reliable.
 */
const MAX_CONCURRENT = 2;
let active = 0;
const waiting: (() => void)[] = [];

const acquire = () =>
  new Promise<void>((resolve) => {
    if (active < MAX_CONCURRENT) {
      active++;
      resolve();
    } else {
      waiting.push(resolve);
    }
  });

const release = () => {
  const next = waiting.shift();
  if (next) next();
  else active = Math.max(0, active - 1);
};

const isTransient = (error: unknown) => {
  const msg = String(
    (error as { message?: string })?.message ?? error ?? "",
  ).toLowerCase();
  return (
    msg.includes("503") ||
    msg.includes("boot_error") ||
    msg.includes("failed to start") ||
    msg.includes("429") ||
    msg.includes("rate limit") ||
    msg.includes("failed to fetch") ||
    msg.includes("504") ||
    msg.includes("timeout")
  );
};

/**
 * Invoke an edge function through the queue, retrying transient boot / rate
 * limit failures with exponential backoff.
 */
export const invokeQueued = async <T = unknown>(
  fn: string,
  body: unknown,
  maxAttempts = 3,
): Promise<{ data: T | null; error: unknown }> => {
  await acquire();
  try {
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke(fn, { body });
        if (!error) return { data: data as T, error: null };
        lastError = error;
        if (!isTransient(error)) return { data: null, error };
      } catch (err) {
        lastError = err;
        if (!isTransient(err)) return { data: null, error: err };
      }
      if (attempt < maxAttempts) {
        await new Promise((r) =>
          setTimeout(r, 1200 * attempt + Math.random() * 400),
        );
      }
    }
    return { data: null, error: lastError };
  } finally {
    release();
  }
};
