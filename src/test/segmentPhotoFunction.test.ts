import { describe, expect, it } from "vitest";
import { UpstreamTimeoutError } from "../../supabase/functions/_shared/http";
import { segmentationFailure } from "../../supabase/functions/segment-photo/recovery";

describe("segmentation function timeout", () => {
  it("returns a non-replayed fallback answer with unknown remote outcome, not a generic 500", () => {
    const failure = segmentationFailure(new UpstreamTimeoutError("ai.gateway.lovable.dev", 90_000));
    expect(failure.status).toBe(200);
    expect(failure.body).toMatchObject({ fallback: true, masks: [] });
    expect(failure.body).toMatchObject({ code: "SEGMENTATION_TIMEOUT", retryable: false, outcome: "unknown" });
  });

  it("does not misclassify application errors as upstream timeouts", () => {
    expect(segmentationFailure(new Error("Invalid mask JSON"))).toEqual({ status: 500, body: { error: "Invalid mask JSON" } });
  });
});