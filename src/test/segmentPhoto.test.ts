import { beforeEach, describe, expect, it, vi } from "vitest";

const invoke = vi.hoisted(() => vi.fn());
vi.mock("@/lib/invokeAi", () => ({ invokeAi: invoke }));
import { segmentPhoto } from "@/journey/wallScenes/segment";

describe("photo outlining recovery", () => {
  beforeEach(() => invoke.mockReset());

  it("does not replay a timeout or send remaining batches", async () => {
    const error = new Error("Photo outlining took too long.");
    invoke.mockResolvedValue({ data: null, error });
    const items = Array.from({ length: 9 }, (_, n) => ({ key: `piece-${n}`, name: "Chair" }));
    await expect(segmentPhoto("https://example.com/photo.jpg", items, 10, 10)).rejects.toBe(error);
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke.mock.calls[0][1].body.items).toEqual(items.slice(0, 4));
  });

  it("returns missing outlines without repeating an empty response", async () => {
    invoke.mockResolvedValue({ data: { masks: [] }, error: null });
    await expect(segmentPhoto("https://example.com/photo.jpg", [{ key: "chair", name: "Chair" }], 10, 10)).resolves.toEqual({});
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it("preserves credit denials rather than reissuing the request", async () => {
    const error = new Error("AI credits are used up.");
    invoke.mockResolvedValue({ data: null, error });
    await expect(segmentPhoto("https://example.com/photo.jpg", [{ key: "chair", name: "Chair" }], 10, 10)).rejects.toBe(error);
    expect(invoke).toHaveBeenCalledTimes(1);
  });
});