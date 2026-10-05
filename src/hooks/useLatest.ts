import { useLayoutEffect, useRef } from "react";

/**
 * Keeps a ref pointing at the latest value (usually a callback prop).
 *
 * Use it when an effect must call a parent's callback but must NOT re-run
 * every time the parent re-renders and passes a new function, e.g. effects
 * that start paid AI requests. Read `ref.current` inside the effect.
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
