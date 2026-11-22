import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounce } from './useDebounce';

interface SetOptions {
  /** Replace the history entry (default true). */
  replace?: boolean;
}

/**
 * One search param constrained to `allowed` values. Unknown or missing values
 * read as `fallback`; writing `fallback` removes the param. Other params are kept.
 */
export function useUrlState<T extends string>(
  param: string,
  allowed: readonly T[],
  fallback: T,
): [T, (next: T, options?: SetOptions) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(param);
  const value =
    raw !== null && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;

  const setValue = useCallback(
    (next: T, options: SetOptions = {}) => {
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current);
          if (next === fallback) params.delete(param);
          else params.set(param, next);
          return params;
        },
        { replace: options.replace ?? true },
      );
    },
    [fallback, param, setSearchParams],
  );

  return [value, setValue];
}

/**
 * Free-text search param with a debounced URL write. Returns the live input
 * value, its setter and the debounced value to filter or query with.
 */
export function useUrlSearch(
  param = 'q',
  debounceMs = 250,
): { value: string; setValue: (next: string) => void; debouncedValue: string } {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlValue = searchParams.get(param) ?? '';
  const [value, setValue] = useState(urlValue);
  const [syncedUrlValue, setSyncedUrlValue] = useState(urlValue);
  const debouncedValue = useDebounce(value, debounceMs);

  // Back/forward navigation changes the URL: adopt it as the input value
  // (our own debounced write matches the trimmed input and is left alone).
  if (urlValue !== syncedUrlValue) {
    setSyncedUrlValue(urlValue);
    if (urlValue !== value.trim()) setValue(urlValue);
  }

  useEffect(() => {
    // Only write once the debounce has settled on the current input, so a
    // stale debounced value never overwrites a URL that just changed.
    if (debouncedValue !== value) return;
    const next = debouncedValue.trim();
    if (next === urlValue) return;
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (next) params.set(param, next);
        else params.delete(param);
        return params;
      },
      { replace: true },
    );
  }, [debouncedValue, value, param, setSearchParams, urlValue]);

  return { value, setValue, debouncedValue: debouncedValue.trim() };
}
