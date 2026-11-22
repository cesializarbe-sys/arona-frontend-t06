import { useCallback, useEffect, useRef } from 'react';

export interface LatestRequestHandle {
  /** Abort signal to forward to the HTTP call (aborted when superseded or unmounted). */
  signal: AbortSignal;
  /** True only while this is the most recent request and the component is still mounted. */
  isCurrent: () => boolean;
}

/**
 * Guards list loaders against stale responses.
 *
 * Call `begin()` right before issuing a request: it aborts the previous in-flight
 * request, and the returned `isCurrent()` tells whether the response is still wanted
 * (no newer request started and the component has not unmounted).
 */
export function useLatestRequest(): { begin: () => LatestRequestHandle } {
  const counterRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  const begin = useCallback((): LatestRequestHandle => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    counterRef.current += 1;
    const requestId = counterRef.current;
    return {
      signal: controller.signal,
      isCurrent: () => mountedRef.current && counterRef.current === requestId,
    };
  }, []);

  return { begin };
}
