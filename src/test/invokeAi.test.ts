import { describe, it, expect, vi, beforeEach } from "vitest";
import { FunctionsFetchError, FunctionsHttpError } from "@supabase/supabase-js";

const invoke = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));

import { invokeAi, TIMEOUT_MESSAGE, GENERATION_TIMEOUT_MS } from "@/lib/invokeAi";

const httpError = (status: number, body: unknown) =>
  new FunctionsHttpError(new Response(JSON.stringify(body), { status }));

describe("invokeAi", () => {
  beforeEach(() => invoke.mockReset());

  it("passes the body and a timeout through", async () => {
    invoke.mockResolvedValue({ data: { imageUrl: "x" }, error: null });
    const res = await invokeAi("generate-design", { body: { a: 1 } });
    expect(res).toEqual({ data: { imageUrl: "x" }, error: null });
    expect(invoke).toHaveBeenCalledWith("generate-design", { body: { a: 1 }, timeout: GENERATION_TIMEOUT_MS });
  });

  it("uses the function's own error message", async () => {
    invoke.mockResolvedValue({ data: null, error: httpError(500, { error: "The image model did not return a design this time." }) });
    const res = await invokeAi("generate-design", { body: {} });
    expect(res.error?.message).toBe("The image model did not return a design this time.");
  });

  it("explains an expired session", async () => {
    invoke.mockResolvedValue({ data: null, error: httpError(401, {}) });
    const res = await invokeAi("generate-design", { body: {} });
    expect(res.error?.message).toMatch(/sign in again/i);
  });

  it("maps a client-side abort to the timeout message", async () => {
    const abort = new DOMException("The operation was aborted.", "AbortError");
    invoke.mockResolvedValue({ data: null, error: new FunctionsFetchError(abort) });
    const res = await invokeAi("generate-design", { body: {} });
    expect(res.error?.message).toBe(TIMEOUT_MESSAGE);
  });
});
