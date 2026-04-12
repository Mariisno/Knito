import { useCallback, useEffect, useRef } from 'react';

export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
): T & { flush: () => void } {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  const pendingArgsRef = useRef<Parameters<T> | null>(null);

  callbackRef.current = callback;

  const flush = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pendingArgsRef.current !== null) {
      callbackRef.current(...pendingArgsRef.current);
      pendingArgsRef.current = null;
    }
  }, []);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      pendingArgsRef.current = args;
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        if (pendingArgsRef.current !== null) {
          callbackRef.current(...pendingArgsRef.current);
          pendingArgsRef.current = null;
        }
      }, delay);
    },
    [delay],
  ) as T & { flush: () => void };

  debounced.flush = flush;

  // Flush on unmount
  useEffect(() => {
    return () => {
      flush();
    };
  }, [flush]);

  return debounced;
}
