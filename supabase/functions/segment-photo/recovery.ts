import { UpstreamTimeoutError } from "../_shared/http.ts";

/** A timeout does not establish whether the remote model finished or billed. */
export function segmentationFailure(error: unknown) {
  if (error instanceof UpstreamTimeoutError) {
    return {
      status: 200,
      body: { error: "Photo outlining took too long. Your wall photo is kept; simpler cut-outs will be used instead.", code: "SEGMENTATION_TIMEOUT", retryable: false, outcome: "unknown", fallback: true, masks: [] },
    };
  }
  return { status: 500, body: { error: error instanceof Error ? error.message : "Photo outlining failed." } };
}