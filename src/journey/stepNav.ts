/** Moving between the six steps from the progress bar. */
import { SCREENS, type ScreenId } from "./routes";
import { STEP_COUNT } from "./data";

/** The first screen of each step (index = step number). */
export const STEP_FIRST: ScreenId[] = Array.from({ length: STEP_COUNT + 1 }, (_, n) =>
  n === 0 ? "Main" : SCREENS.find((x) => x.step === n)?.id ?? "Main",
);

export type StepState = "now" | "done" | "next" | "todo";

/**
 * How step `n` shows while the person is on step `now`: the same everywhere in the journey.
 * Done = finished for this room (whatever screen you are on); next = the first unfinished step after this one.
 */
export function stepState(done: number[], n: number, now: number): StepState {
  if (n === now) return "now";
  const completed = done.filter((k) => k <= 5).concat(done.includes(9) ? [6] : []);
  if (completed.includes(n)) return "done";
  const next = Array.from({ length: STEP_COUNT }, (_, i) => i + 1).find((k) => k > now && !completed.includes(k));
  return n === next ? "next" : "todo";
}
