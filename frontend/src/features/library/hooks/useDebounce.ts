import { useCallback, useRef } from 'react';

/**
 * Returns a debounced version of the provided callback.
 * The callback is only called after `delay` ms of inactivity.
 * Cancels the in-flight timer on each new invocation.
 */
export function useDebounce<T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number,
): (...args: T) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: T) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  );
}
