import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../../../shared/context/ToastContext';
import { isRequestCanceled, type ExtendedApiError } from '../../../shared/api/errorUtils';
import { useLatestRequest } from '../../../shared/hooks/useLatestRequest';
import type { AnalyticsFilterRecord } from '../api/analyticsApi';

export type IndicatorFetcher<TResponse = unknown> = (
  filters: AnalyticsFilterRecord,
  signal?: AbortSignal
) => Promise<TResponse>;

/**
 * Discriminated union guaranteeing mutually exclusive indicator flow states.
 */
export type IndicatorState<TResponse> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: TResponse }
  | { status: 'service_unavailable'; message: string; retryAfter: string | null }
  | { status: 'validation_error'; message: string; param: string | null }
  | { status: 'error'; message: string };

export function useIndicator<TResponse>(
  fetcher: IndicatorFetcher<TResponse>,
  initialFilters: AnalyticsFilterRecord = {}
) {
  const [filters, setFilters] = useState<AnalyticsFilterRecord>(initialFilters);
  const [state, setState] = useState<IndicatorState<TResponse>>({ status: 'idle' });

  const toast = useToast();
  const { begin } = useLatestRequest();
  const filtersRef = useRef<AnalyticsFilterRecord>(filters);
  filtersRef.current = filters;
  const initialFiltersRef = useRef<AnalyticsFilterRecord>(initialFilters);
  initialFiltersRef.current = initialFilters;

  const executeFetch = useCallback(
    async (overrideFilters?: AnalyticsFilterRecord) => {
      const { signal, isCurrent } = begin();

      const activeFilters =
        overrideFilters !== undefined ? overrideFilters : filtersRef.current;

      setState({ status: 'loading' });

      try {
        const response = await fetcher(activeFilters, signal);
        if (isCurrent()) {
          setState({ status: 'success', data: response });
        }
      } catch (rawErr: unknown) {
        if (!isCurrent() || isRequestCanceled(rawErr)) return;
        const err = rawErr as ExtendedApiError;

        const status = err?.response?.status;
        if (err?.isServiceUnavailable || status === 503) {
          const message =
            err.response?.data?.detalle ||
            'Servicio no disponible, reintente en unos minutos.';
          setState({
            status: 'service_unavailable',
            message,
            retryAfter: err.retryAfter || null,
          });
          toast.error('Servicio analítico no disponible (503).');
        } else if (status === 400) {
          const detail =
            err.detalle ||
            err.response?.data?.detalle ||
            err.response?.data?.error ||
            'Parámetro de filtro inválido.';
          const param = err.response?.data?.parametro || null;
          setState({
            status: 'validation_error',
            message: detail,
            param,
          });
          toast.warning(detail);
        } else if (status === 500) {
          const detail =
            err.detalle ||
            err.response?.data?.detalle ||
            'Error interno en el servidor analítico.';
          setState({ status: 'error', message: detail });
          toast.error('Error interno al consultar el indicador.');
        } else if (rawErr instanceof Error && rawErr.name === 'AnalyticsContractError') {
          setState({ status: 'error', message: rawErr.message });
          toast.error('Respuesta analítica con formato inesperado.');
        } else {
          setState({
            status: 'error',
            message: 'No se pudo conectar con el servicio analítico (puerto 5000).',
          });
          toast.error('No se pudo cargar el indicador analítico.');
        }
      }
    },
    [begin, fetcher, toast]
  );

  useEffect(() => {
    const defaults = initialFiltersRef.current;
    setFilters(defaults);
    filtersRef.current = defaults;
    void executeFetch(defaults);
  }, [executeFetch]);

  const reload = useCallback(
    (customFilters?: AnalyticsFilterRecord) => {
      if (customFilters !== undefined) {
        setFilters(customFilters);
        filtersRef.current = customFilters;
        return executeFetch(customFilters);
      }
      return executeFetch(filtersRef.current);
    },
    [executeFetch]
  );

  const resetFilters = useCallback(() => {
    const defaults = initialFiltersRef.current;
    setFilters(defaults);
    filtersRef.current = defaults;
    return executeFetch(defaults);
  }, [executeFetch]);

  return {
    state,
    data: state.status === 'success' ? state.data : null,
    isLoading: state.status === 'loading',
    errorMessage:
      state.status === 'error' ||
      state.status === 'validation_error' ||
      state.status === 'service_unavailable'
        ? state.message
        : null,
    errorParam: state.status === 'validation_error' ? state.param : null,
    isValidationError: state.status === 'validation_error',
    isServiceUnavailable: state.status === 'service_unavailable',
    retryAfter: state.status === 'service_unavailable' ? state.retryAfter : null,
    filters,
    setFilters,
    reload,
    resetFilters,
  };
}

export default useIndicator;
