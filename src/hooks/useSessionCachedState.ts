import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { readJson, readString, writeJson, writeString } from "@/lib/generateSession";

type Options<T> = {
  /** Return false to skip writing this value (e.g. empty lists). Default: always write. */
  shouldPersist?: (value: T) => boolean;
  /** Transform before writing (e.g. strip large fields). */
  serialize?: (value: T) => unknown;
};

/**
 * useState that starts from sessionStorage and writes changes back.
 * Replaces the pattern of a useState initializer plus a separate effect
 * per cached value.
 */
export function useSessionCachedState<T>(
  key: string,
  fallback: T,
  { shouldPersist, serialize }: Options<T> = {},
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readJson<T>(key, fallback));

  useEffect(() => {
    if (shouldPersist && !shouldPersist(value)) return;
    writeJson(key, serialize ? serialize(value) : value);
    // shouldPersist / serialize are expected to be pure, module-level functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value]);

  return [value, setValue];
}

/** Same as useSessionCachedState for plain strings (stored without JSON quotes). */
export function useSessionCachedString(
  key: string,
  { onlyNonEmpty = true }: { onlyNonEmpty?: boolean } = {},
): [string, Dispatch<SetStateAction<string>>] {
  const [value, setValue] = useState<string>(() => readString(key) || "");

  useEffect(() => {
    if (onlyNonEmpty && !value) return;
    writeString(key, value);
  }, [key, value, onlyNonEmpty]);

  return [value, setValue];
}
