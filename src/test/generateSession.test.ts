import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  GENERATE_KEYS,
  clearDesignView,
  fromRouteOrCache,
  hydrateAnalyzeRoomCacheFromMoodboard,
  readJson,
  writeString,
} from "@/lib/generateSession";
import { useSessionCachedState, useSessionCachedString } from "@/hooks/useSessionCachedState";

beforeEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe("generateSession", () => {
  it("clearDesignView removes design caches including camera angles, but keeps quiz inputs", () => {
    sessionStorage.setItem(GENERATE_KEYS.design, "{}");
    sessionStorage.setItem(GENERATE_KEYS.angles, "[]");
    sessionStorage.setItem(GENERATE_KEYS.imageHistory, "[]");
    sessionStorage.setItem(GENERATE_KEYS.quizData, '{"roomType":"bedroom"}');
    sessionStorage.setItem(GENERATE_KEYS.moodboard, "{}");

    clearDesignView();

    expect(sessionStorage.getItem(GENERATE_KEYS.design)).toBeNull();
    expect(sessionStorage.getItem(GENERATE_KEYS.angles)).toBeNull();
    expect(sessionStorage.getItem(GENERATE_KEYS.imageHistory)).toBeNull();
    expect(sessionStorage.getItem(GENERATE_KEYS.quizData)).not.toBeNull();
    expect(sessionStorage.getItem(GENERATE_KEYS.moodboard)).not.toBeNull();
  });

  it("readJson falls back on missing or corrupt values", () => {
    expect(readJson("missing", 42)).toBe(42);
    sessionStorage.setItem("bad", "{not json");
    expect(readJson("bad", [])).toEqual([]);
  });

  it("writeString evicts regenerable caches when the quota is full, then retries", () => {
    sessionStorage.setItem(GENERATE_KEYS.highlights, "big");
    const original = Storage.prototype.setItem;
    let calls = 0;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, k: string, v: string) {
      calls++;
      if (calls === 1) throw new DOMException("full", "QuotaExceededError");
      return original.call(this, k, v);
    });

    expect(writeString(GENERATE_KEYS.design, "x")).toBe(true);
    expect(sessionStorage.getItem(GENERATE_KEYS.highlights)).toBeNull();
    expect(sessionStorage.getItem(GENERATE_KEYS.design)).toBe("x");
  });

  it("fromRouteOrCache remembers route values and falls back to the cache", () => {
    expect(fromRouteOrCache(GENERATE_KEYS.inspirations, ["a"])).toEqual(["a"]);
    expect(fromRouteOrCache(GENERATE_KEYS.inspirations, undefined)).toEqual(["a"]);
    // quiz data without a room type is not usable
    sessionStorage.setItem(GENERATE_KEYS.quizData, "{}");
    expect(fromRouteOrCache(GENERATE_KEYS.quizData, undefined, (q: { roomType?: string } | undefined) => !!q?.roomType)).toBeUndefined();
  });

  it("hydrateAnalyzeRoomCacheFromMoodboard keeps unrelated analyze-room state", () => {
    sessionStorage.setItem("analyze_room_cache", JSON.stringify({ images: ["x"], editableColors: ["#fff"] }));
    hydrateAnalyzeRoomCacheFromMoodboard({ materials: [{ label: "Oak" }] });
    const cache = readJson<Record<string, unknown>>("analyze_room_cache", {});
    expect(cache.images).toEqual(["x"]);
    expect(cache.moodboardReady).toBe(true);
    expect(cache.editableColors).toEqual(["#fff"]);
    expect((cache.moodboard as { materials: unknown[] }).materials).toEqual([{ label: "Oak" }]);
  });
});

describe("useSessionCachedState", () => {
  it("starts from the cache and writes changes back", () => {
    sessionStorage.setItem("k", JSON.stringify([1]));
    const { result } = renderHook(() => useSessionCachedState<number[]>("k", []));
    expect(result.current[0]).toEqual([1]);
    act(() => result.current[1]([1, 2]));
    expect(JSON.parse(sessionStorage.getItem("k")!)).toEqual([1, 2]);
  });

  it("respects shouldPersist and serialize", () => {
    const { result } = renderHook(() =>
      useSessionCachedState<{ a: number; big?: string } | null>("k2", null, {
        shouldPersist: (v) => v !== null,
        serialize: (v) => v && { a: v.a },
      }),
    );
    expect(sessionStorage.getItem("k2")).toBeNull();
    act(() => result.current[1]({ a: 1, big: "xxx" }));
    expect(JSON.parse(sessionStorage.getItem("k2")!)).toEqual({ a: 1 });
  });

  it("reads the legacy 'true'/'false' extracting flag", () => {
    sessionStorage.setItem(GENERATE_KEYS.extracting, "true");
    const { result } = renderHook(() => useSessionCachedState<boolean>(GENERATE_KEYS.extracting, false));
    expect(result.current[0]).toBe(true);
  });

  it("stores plain strings without JSON quotes (compatible with existing caches)", () => {
    sessionStorage.setItem(GENERATE_KEYS.description, "A calm room");
    const { result } = renderHook(() => useSessionCachedString(GENERATE_KEYS.description));
    expect(result.current[0]).toBe("A calm room");
    act(() => result.current[1]("A bright room"));
    expect(sessionStorage.getItem(GENERATE_KEYS.description)).toBe("A bright room");
  });
});
