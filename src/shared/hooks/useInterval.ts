import { useEffect, useLayoutEffect, useRef } from 'react';

/** Calls `callback` every `delayMs`; pass `null` to pause. Always uses the latest callback. */
export function useInterval(callback: () => void, delayMs: number | null): void {
  const callbackRef = useRef(callback);

  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (delayMs === null) return;
    const id = window.setInterval(() => callbackRef.current(), delayMs);
    return () => window.clearInterval(id);
  }, [delayMs]);
}
