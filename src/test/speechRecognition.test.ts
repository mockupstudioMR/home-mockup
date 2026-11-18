import { describe, expect, it } from "vitest";
import {
  appendTranscript,
  collectFinalTranscript,
  getSpeechRecognition,
  type SpeechRecognitionEventLike,
} from "@/lib/speechRecognition";

const result = (transcript: string, isFinal: boolean) => ({ isFinal, 0: { transcript } });

describe("getSpeechRecognition", () => {
  it("returns null when no window or no API", () => {
    expect(getSpeechRecognition(undefined)).toBeNull();
    expect(getSpeechRecognition({})).toBeNull();
  });

  it("prefers the standard constructor, falls back to webkit", () => {
    class Std {}
    class Webkit {}
    expect(getSpeechRecognition({ SpeechRecognition: Std, webkitSpeechRecognition: Webkit })).toBe(Std);
    expect(getSpeechRecognition({ webkitSpeechRecognition: Webkit })).toBe(Webkit);
  });
});

describe("collectFinalTranscript", () => {
  it("keeps only final results from resultIndex onwards", () => {
    const event: SpeechRecognitionEventLike = {
      resultIndex: 1,
      results: [result("old", true), result("warm oak", true), result("maybe", false), result("floors", true)],
    };
    expect(collectFinalTranscript(event)).toBe("warm oak floors");
  });

  it("returns empty string when nothing is final", () => {
    expect(collectFinalTranscript({ resultIndex: 0, results: [result("hmm", false)] })).toBe("");
  });
});

describe("appendTranscript", () => {
  it("appends with a single space, or starts fresh", () => {
    expect(appendTranscript("", "linen sofa")).toBe("linen sofa");
    expect(appendTranscript("cosy room", "linen sofa")).toBe("cosy room linen sofa");
    expect(appendTranscript("cosy room", "")).toBe("cosy room");
  });
});
