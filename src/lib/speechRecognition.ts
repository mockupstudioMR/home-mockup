// Minimal typings for the browser Web Speech API (not in TypeScript's DOM lib).
// Only the parts the app uses are described here.

export interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

export interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
}

export interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

export interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

/** Returns the browser's speech-recognition constructor, or null when unsupported. */
export function getSpeechRecognition(
  win: unknown = typeof window !== "undefined" ? window : undefined,
): SpeechRecognitionConstructor | null {
  if (!win) return null;
  const w = win as SpeechWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Joins the final (not interim) transcripts from a result event, trimmed. */
export function collectFinalTranscript(event: SpeechRecognitionEventLike): string {
  let text = "";
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    if (result.isFinal) text += result[0].transcript + " ";
  }
  return text.trim();
}

/** Appends newly dictated text to what the user already has. */
export function appendTranscript(prev: string, addition: string): string {
  if (!addition) return prev;
  return prev ? `${prev} ${addition}` : addition;
}
