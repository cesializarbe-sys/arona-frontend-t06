import { useState, useEffect, useCallback, useMemo } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import { extractApiErrorMessage, isRequestCanceled } from '../../../shared/api/errorUtils';
import { useLatestRequest } from '../../../shared/hooks/useLatestRequest';
import { kgToTonDisplay, kgToTonNum } from '../../../shared/utils/productionUtils';
import type { DashboardSummaryData } from '../../../shared/types/domain';

const INITIAL_SUMMARY: DashboardSummaryData = {
  fields: [],
  harvests: [],
  pendingAlerts: [],
  recentActivities: [],
  totalUsers: 0,
};

export function useDashboard() {
  const [data, setData] = useState<DashboardSummaryData>(INITIAL_SUMMARY);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { begin } = useLatestRequest();

  const loadData = useCallback(async () => {
    const { signal, isCurrent } = begin();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const summary = await dashboardApi.getSummaryData(signal);
      if (isCurrent()) {
        setData(summary);
      }
    } catch (err) {
      if (!isCurrent() || isRequestCanceled(err)) return;
      setErrorMessage(extractApiErrorMessage(err, 'No se pudo conectar con el servidor.'));
    } finally {
      if (isCurrent()) {
        setIsLoading(false);
      }
    }
  }, [begin]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const totalProduction = useMemo(() => {
    const totalKg = data.harvests.reduce((sum, h) => sum + (h.cantidadKg ?? 0), 0);
    return kgToTonDisplay(totalKg);
  }, [data.harvests]);

  const averageYield = useMemo(() => {
    const validHarvests = data.harvests.filter((h) => h.cantidadKg > 0);
    if (validHarvests.length === 0) return '0.0';
    const totalHa = data.fields.reduce(
      (sum, f) => sum + (f.hectareas ?? f.areaHectareas ?? 0),
      0
    );
    if (totalHa === 0) return '0.0';
    const totalKg = validHarvests.reduce((sum, h) => sum + (h.cantidadKg ?? 0), 0);
    const totalTon = kgToTonNum(totalKg) ?? 0;
    return (totalTon / totalHa).toFixed(1);
  }, [data.harvests, data.fields]);

  const harvestedLots = useMemo(
    () => data.harvests.filter((h) => h.cantidadKg > 0).length,
    [data.harvests]
  );

  const resolveFieldName = useCallback(
    (fieldId?: string | number) => {
      if (!fieldId) return 'Campo';
      const target = String(fieldId).trim().toUpperCase();
      const found = data.fields.find(
        (f) => String(f.id || f.idCampo || f._id || '').trim().toUpperCase() === target
      );
      return found?.nombre || `Campo #${fieldId}`;
    },
    [data.fields]
  );

  return {
    ...data,
    isLoading,
    errorMessage,
    totalProduction,
    averageYield,
    harvestedLots,
    totalFields: data.fields.length,
    pendingAlertsCount: data.pendingAlerts.length,
    resolveFieldName,
    loadData,
  };
}
