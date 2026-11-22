import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AxiosRequestConfig } from 'axios';
import { apiClient } from '../api/httpClient';
import { extractApiErrorMessage, isRequestCanceled } from '../api/errorUtils';
import { useLatestRequest } from './useLatestRequest';

export interface UseFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Generic GET hook with AbortController cancellation for stale responses.
 */
export function useFetch<T = unknown>(
  url: string | null | undefined,
  options?: AxiosRequestConfig
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(url));
  const [error, setError] = useState<string | null>(null);
  const { begin } = useLatestRequest();

  const serializedOptions = JSON.stringify(options ?? {});
  const stableOptions = useMemo<AxiosRequestConfig | undefined>(
    () => (serializedOptions === '{}' ? undefined : (JSON.parse(serializedOptions) as AxiosRequestConfig)),
    [serializedOptions]
  );

  const fetchData = useCallback(async () => {
    if (!url) return;
    const { signal, isCurrent } = begin();
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<T>(url, {
        ...stableOptions,
        signal,
      });
      if (isCurrent()) {
        setData(response.data);
      }
    } catch (err: unknown) {
      if (!isCurrent() || isRequestCanceled(err)) return;
      setError(extractApiErrorMessage(err, 'Error en la petición'));
    } finally {
      if (isCurrent()) {
        setIsLoading(false);
      }
    }
  }, [begin, stableOptions, url]);

  useEffect(() => {
    if (!url) return undefined;
    void fetchData();
    return undefined;
  }, [url, fetchData]);

  const refetch = useCallback(() => {
    void fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
