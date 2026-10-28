/** Moving between the 10 steps from the progress bar: where each step starts and how it is shown. */
import { SCREENS, type ScreenId } from "./routes";

/** The first screen of each step (index = step number). */
export const STEP_FIRST: ScreenId[] = Array.from({ length: 11 }, (_, n) => (n === 0 ? "Main" : SCREENS.find((x) => x.step === n)!.id));

export type StepState = "now" | "done" | "next" | "todo";

/**
 * How step `n` shows while the person is on step `now`: the same everywhere in the journey.
 * Done = finished for this room (whatever screen you are on); next = the first unfinished step after this one.
 */
export function stepState(done: number[], n: number, now: number): StepState {
  if (n === now) return "now";
  if (done.includes(n)) return "done";
  const next = Array.from({ length: 10 }, (_, i) => i + 1).find((k) => k > now && !done.includes(k));
  return n === next ? "next" : "todo";
}
