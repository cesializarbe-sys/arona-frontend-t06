import { useMemo } from 'react';
import type {
  CropHealthPayload,
  OperationalActivityAnalysisPayload,
  PhytosanitaryRiskPayload,
} from '../../../shared/types/domain';

export const PROTOTYPE_COLORS = [
  '#557A38',
  '#E29839',
  '#C44536',
  '#3A6B7C',
  '#7A5C38',
  '#6E8B52',
];

export interface CropByTypeCardSummary {
  cropType: string;
  total: number;
  healthy: number;
  atRisk: number;
}

export interface ChartBreakdownItem {
  label: string;
  value: number;
  color: string;
}

/**
 * Pure domain transformation hook extracting chart datasets and aggregations
 * away from AnalyticsDashboardPage presentation logic.
 */
export function useAnalyticsCharts(
  cropHealth: CropHealthPayload | null,
  phytosanitaryRisk: PhytosanitaryRiskPayload | null,
  operationalActivity: OperationalActivityAnalysisPayload | null
) {
  const healthStatusKeys = useMemo(
    () => Object.keys(cropHealth?.resumen_por_estado || {}),
    [cropHealth]
  );

  const healthChartData = useMemo(
    () => ({
      labels: healthStatusKeys,
      datasets: [
        {
          label: 'Cultivos por Estado',
          data: healthStatusKeys.map(
            (status) => cropHealth?.resumen_por_estado?.[status]?.total ?? 0
          ),
          backgroundColor: '#557A38',
          borderRadius: 6,
          maxBarThickness: 40,
        },
      ],
    }),
    [cropHealth, healthStatusKeys]
  );

  const healthDoughnutItems = useMemo<ChartBreakdownItem[]>(
    () =>
      healthStatusKeys.map((status, idx) => {
        const upper = status.toUpperCase();
        const color =
          upper.includes('BUEN') || upper.includes('SALUD') || upper.includes('OPTIM')
            ? '#557A38'
            : upper.includes('RIESGO')
            ? '#E29839'
            : upper.includes('PROBLEM') || upper.includes('CRIT')
            ? '#C44536'
            : PROTOTYPE_COLORS[idx % PROTOTYPE_COLORS.length];
        return {
          label: status,
          value: cropHealth?.resumen_por_estado?.[status]?.total ?? 0,
          color,
        };
      }),
    [cropHealth, healthStatusKeys]
  );

  const cropsByTypeCards = useMemo<CropByTypeCardSummary[]>(() => {
    const map: Record<string, CropByTypeCardSummary> = {};
    const byStatus = cropHealth?.resumen_por_estado || {};
    Object.entries(byStatus).forEach(([status, info]) => {
      const upperStatus = String(status).toUpperCase();
      const isGood =
        upperStatus.includes('BUEN') ||
        upperStatus.includes('SALUD') ||
        upperStatus.includes('OPTIM');
      Object.entries(info?.tipos || {}).forEach(([cropType, count]) => {
        const entry = (map[cropType] = map[cropType] || {
          cropType,
          total: 0,
          healthy: 0,
          atRisk: 0,
        });
        entry.total += Number(count) || 0;
        if (isGood) {
          entry.healthy += Number(count) || 0;
        } else {
          entry.atRisk += Number(count) || 0;
        }
      });
    });
    return Object.values(map);
  }, [cropHealth]);

  const riskTypeKeys = useMemo(
    () => Object.keys(phytosanitaryRisk?.resumen_por_tipo_problema || {}),
    [phytosanitaryRisk]
  );

  const riskChartData = useMemo(
    () => ({
      labels: riskTypeKeys,
      datasets: [
        {
          label: 'Pendientes',
          data: riskTypeKeys.map(
            (type) => phytosanitaryRisk?.resumen_por_tipo_problema?.[type]?.pendientes ?? 0
          ),
          backgroundColor: '#C44536',
          borderRadius: 6,
          maxBarThickness: 32,
        },
        {
          label: 'Atendidos',
          data: riskTypeKeys.map(
            (type) => phytosanitaryRisk?.resumen_por_tipo_problema?.[type]?.atendidos ?? 0
          ),
          backgroundColor: '#557A38',
          borderRadius: 6,
          maxBarThickness: 32,
        },
      ],
    }),
    [phytosanitaryRisk, riskTypeKeys]
  );

  const riskDoughnutItems = useMemo<ChartBreakdownItem[]>(() => {
    const riskData = phytosanitaryRisk as {
      alertas_atendidas?: number;
      alertas_pendientes?: number;
    } | null;
    return [
      { label: 'Atendidas', value: riskData?.alertas_atendidas ?? 0, color: '#557A38' },
      { label: 'Pendientes Críticas', value: riskData?.alertas_pendientes ?? 0, color: '#C44536' },
    ];
  }, [phytosanitaryRisk]);

  const activitySummary = useMemo(() => {
    const raw = operationalActivity as {
      resumen_por_tipo_actividad?: Record<string, number>;
      ranking_campos_mas_activos?: Array<{ total_actividades?: number }>;
    } | null;
    return {
      byType: raw?.resumen_por_tipo_actividad || {},
      ranking: raw?.ranking_campos_mas_activos || [],
    };
  }, [operationalActivity]);

  const activityTypeKeys = useMemo(
    () => Object.keys(activitySummary.byType),
    [activitySummary.byType]
  );

  const activityChartData = useMemo(
    () => ({
      labels: activityTypeKeys,
      datasets: [
        {
          label: 'Labores Ejecutadas',
          data: activityTypeKeys.map((type) => activitySummary.byType[type] ?? 0),
          backgroundColor: '#557A38',
          borderRadius: 6,
          maxBarThickness: 42,
        },
      ],
    }),
    [activityTypeKeys, activitySummary.byType]
  );

  const activityDoughnutItems = useMemo<ChartBreakdownItem[]>(
    () =>
      activityTypeKeys.map((type, idx) => ({
        label: type,
        value: activitySummary.byType[type] ?? 0,
        color: PROTOTYPE_COLORS[idx % PROTOTYPE_COLORS.length],
      })),
    [activityTypeKeys, activitySummary.byType]
  );

  const maxFieldActivity = useMemo(() => {
    return (
      activitySummary.ranking.reduce((m, r) => Math.max(m, r.total_actividades || 0), 0) || 1
    );
  }, [activitySummary.ranking]);

  return {
    healthStatusKeys,
    healthChartData,
    healthDoughnutItems,
    cropsByTypeCards,
    riskTypeKeys,
    riskChartData,
    riskDoughnutItems,
    activityTypeKeys,
    activityChartData,
    activityDoughnutItems,
    maxFieldActivity,
  };
}
