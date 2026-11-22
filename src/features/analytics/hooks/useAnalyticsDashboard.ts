import { useState, useEffect, useCallback } from 'react';
import { analyticsApi } from '../api/analyticsApi';
import { useToast } from '../../../shared/context/ToastContext';
import type { ExtendedApiError } from '../../../shared/api/errorUtils';
import { useLatestRequest } from '../../../shared/hooks/useLatestRequest';
import type {
  AnalyticsDashboardPayload,
  CropHealthPayload,
  OperationalActivityAnalysisPayload,
  PhytosanitaryRiskPayload,
} from '../../../shared/types/domain';

export interface ParsedAnalyticsError {
  message: string;
  is503: boolean;
  retryAfter?: string | null;
}

export interface AnalyticsSectionErrors {
  dashboard: ParsedAnalyticsError | null;
  cropHealth: ParsedAnalyticsError | null;
  phytosanitaryRisk: ParsedAnalyticsError | null;
  operationalActivity: ParsedAnalyticsError | null;
}

function parseAnalyticsError(rawErr: unknown): ParsedAnalyticsError {
  if (!rawErr) {
    return { message: 'Error desconocido al consultar la analítica.', is503: false };
  }
  const err = rawErr as ExtendedApiError;
  if (err.isServiceUnavailable || err.response?.status === 503) {
    return {
      message:
        err.response?.data?.detalle || 'Servicio no disponible, reintente en unos minutos.',
      is503: true,
      retryAfter: err.retryAfter || null,
    };
  }
  if (err.response?.status === 400) {
    return {
      message: err.detalle || err.response?.data?.detalle || 'Parámetro inválido en la consulta.',
      is503: false,
    };
  }
  if (err.response?.status === 500) {
    return {
      message:
        err.detalle || err.response?.data?.detalle || 'Error interno en el servidor analítico.',
      is503: false,
    };
  }
  return {
    message: 'No se pudo conectar con el servicio analítico (puerto 5000).',
    is503: false,
  };
}

export function useAnalyticsDashboard() {
  const [dashboard, setDashboard] = useState<AnalyticsDashboardPayload | null>(null);
  const [cropHealth, setCropHealth] = useState<CropHealthPayload | null>(null);
  const [phytosanitaryRisk, setPhytosanitaryRisk] = useState<PhytosanitaryRiskPayload | null>(null);
  const [operationalActivity, setOperationalActivity] =
    useState<OperationalActivityAnalysisPayload | null>(null);
  const [sectionErrors, setSectionErrors] = useState<AnalyticsSectionErrors>({
    dashboard: null,
    cropHealth: null,
    phytosanitaryRisk: null,
    operationalActivity: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isServiceUnavailable, setIsServiceUnavailable] = useState(false);
  const [retryAfter, setRetryAfter] = useState<string | null>(null);
  const toast = useToast();
  const { begin } = useLatestRequest();

  const loadAnalyticsDashboard = useCallback(async () => {
    const { signal, isCurrent } = begin();

    setIsLoading(true);
    setErrorMessage(null);
    setIsServiceUnavailable(false);
    setRetryAfter(null);

    const results = await Promise.allSettled([
      analyticsApi.getDashboard(signal),
      analyticsApi.getCropHealth(signal),
      analyticsApi.getPhytosanitaryRisk(signal),
      analyticsApi.getOperationalActivityAnalysis(signal),
    ]);

    if (!isCurrent()) return;

    const [dashRes, healthRes, riskRes, actRes] = results;
    const nextErrors: AnalyticsSectionErrors = {
      dashboard: null,
      cropHealth: null,
      phytosanitaryRisk: null,
      operationalActivity: null,
    };

    let any503 = false;
    let detectedRetryAfter: string | null = null;
    const errorMessages: string[] = [];

    if (dashRes.status === 'fulfilled') {
      setDashboard(dashRes.value);
    } else {
      const parsed = parseAnalyticsError(dashRes.reason);
      nextErrors.dashboard = parsed;
      if (parsed.is503) {
        any503 = true;
        detectedRetryAfter = detectedRetryAfter || parsed.retryAfter || null;
      }
      errorMessages.push(`Dashboard general: ${parsed.message}`);
    }

    if (healthRes.status === 'fulfilled') {
      setCropHealth(healthRes.value);
    } else {
      const parsed = parseAnalyticsError(healthRes.reason);
      nextErrors.cropHealth = parsed;
      if (parsed.is503) {
        any503 = true;
        detectedRetryAfter = detectedRetryAfter || parsed.retryAfter || null;
      }
      errorMessages.push(`Salud de cultivos: ${parsed.message}`);
    }

    if (riskRes.status === 'fulfilled') {
      setPhytosanitaryRisk(riskRes.value);
    } else {
      const parsed = parseAnalyticsError(riskRes.reason);
      nextErrors.phytosanitaryRisk = parsed;
      if (parsed.is503) {
        any503 = true;
        detectedRetryAfter = detectedRetryAfter || parsed.retryAfter || null;
      }
      errorMessages.push(`Riesgo fitosanitario: ${parsed.message}`);
    }

    if (actRes.status === 'fulfilled') {
      setOperationalActivity(actRes.value);
    } else {
      const parsed = parseAnalyticsError(actRes.reason);
      nextErrors.operationalActivity = parsed;
      if (parsed.is503) {
        any503 = true;
        detectedRetryAfter = detectedRetryAfter || parsed.retryAfter || null;
      }
      errorMessages.push(`Actividad operacional: ${parsed.message}`);
    }

    setSectionErrors(nextErrors);

    if (errorMessages.length > 0) {
      setIsServiceUnavailable(any503);
      setRetryAfter(detectedRetryAfter);
      const combinedMessage =
        errorMessages.length === 4
          ? errorMessages[0].replace(/^[^:]+:\s*/, '')
          : errorMessages.join(' | ');
      setErrorMessage(combinedMessage);
      toast.error(
        any503
          ? 'Servicio analítico no disponible temporalmente (503).'
          : 'Algunas secciones de analítica no pudieron cargarse.'
      );
    }

    setIsLoading(false);
  }, [begin, toast]);

  useEffect(() => {
    void loadAnalyticsDashboard();
  }, [loadAnalyticsDashboard]);

  return {
    dashboard,
    cropHealth,
    phytosanitaryRisk,
    operationalActivity,
    sectionErrors,
    isLoading,
    errorMessage,
    isServiceUnavailable,
    retryAfter,
    reload: loadAnalyticsDashboard,
  };
}

export default useAnalyticsDashboard;
