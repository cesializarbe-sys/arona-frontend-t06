// Contract reference: docs/api-contract.md (Analytics service)
import { analyticsClient, ensureObjectResponse } from '../../../shared/api/httpClient';
import type {
  AnalyticsDashboardPayload,
  CropHealthPayload,
  OperationalActivityAnalysisPayload,
  PhytosanitaryRiskPayload,
} from '../../../shared/types/domain';
import type {
  AlertResolutionTimeResponse,
  AlertsByFieldResponse,
  AnalyticsRow,
  CropDiversificationResponse,
  ExportabilityByCropResponse,
  FruitStatusEntry,
  IndicatorEnvelope,
  InventoryCoverageResponse,
  OccupancyByZoneResponse,
  OperationalActivityResponse,
  ProductionByCropResponse,
  QualityByCaliberResponse,
  QualityByCaliberRow,
  ReviewComplianceResponse,
  UserProductivityResponse,
  YieldPerHectareResponse,
} from '../types';

export type AnalyticsFilterRecord = Record<string, string | number | boolean | null | undefined>;

export class AnalyticsContractError extends Error {
  readonly indicator: string;

  constructor(indicator: string, detail: string) {
    super(`Contrato analítico inválido para "${indicator}": ${detail}`);
    this.name = 'AnalyticsContractError';
    this.indicator = indicator;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOptionalArrayOfObjects(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.every(isPlainObject));
}

function isOptionalObject(value: unknown): boolean {
  return value === undefined || value === null || isPlainObject(value);
}

export function isProductionByCropResponse(data: unknown): data is ProductionByCropResponse {
  if (!isPlainObject(data)) return false;
  return (
    isOptionalArrayOfObjects(data.produccion_por_tipo) &&
    isOptionalObject(data.totales_generales) &&
    isOptionalObject(data.cultivos_por_tipo)
  );
}

export function isAlertsByFieldResponse(data: unknown): data is AlertsByFieldResponse {
  if (!isPlainObject(data)) return false;
  return (
    isOptionalObject(data.resumen_general) &&
    isOptionalObject(data.distribucion_tipo_problema) &&
    isOptionalArrayOfObjects(data.ranking_campos_con_mas_alertas) &&
    isOptionalArrayOfObjects(data.alertas_pendientes_criticas)
  );
}

export function isOperationalActivityResponse(data: unknown): data is OperationalActivityResponse {
  if (!isPlainObject(data)) return false;
  return (
    isOptionalObject(data.resumen_general) &&
    isOptionalObject(data.actividades_por_tipo) &&
    isOptionalObject(data.distribucion_por_usuario) &&
    isOptionalArrayOfObjects(data.ranking_campos_mas_activos) &&
    isOptionalArrayOfObjects(data.campos_sin_actividad_reciente)
  );
}

export function isOccupancyByZoneResponse(data: unknown): data is OccupancyByZoneResponse {
  if (!isPlainObject(data)) return false;
  return (
    isOptionalObject(data.totales_generales) &&
    isOptionalArrayOfObjects(data.ocupacion_por_zona)
  );
}

export function isUserProductivityResponse(data: unknown): data is UserProductivityResponse {
  if (!isPlainObject(data)) return false;
  return (
    isOptionalObject(data.resumen_general) &&
    isOptionalObject(data.distribucion_por_rol) &&
    isOptionalArrayOfObjects(data.ranking_usuarios_mas_productivos) &&
    isOptionalArrayOfObjects(data.usuarios_sin_actividad)
  );
}

export function isCropDiversificationResponse(data: unknown): data is CropDiversificationResponse {
  if (!isPlainObject(data)) return false;
  return (
    isOptionalObject(data.resumen_general) &&
    isOptionalObject(data.distribucion_tipos_cultivo) &&
    isOptionalArrayOfObjects(data.ranking_campos_mas_diversificados) &&
    isOptionalArrayOfObjects(data.campos_monocultivo)
  );
}

export function isIndicatorEnvelope<
  TRow extends AnalyticsRow = AnalyticsRow,
  TSummary extends Record<string, unknown> = Record<string, unknown>,
>(data: unknown): data is IndicatorEnvelope<TRow, TSummary> {
  if (!isPlainObject(data)) return false;
  return (
    Array.isArray(data.datos) &&
    data.datos.every(isPlainObject) &&
    isOptionalObject(data.resumen) &&
    isOptionalObject(data.paginacion)
  );
}

interface RawFruitStatusEntry {
  estado_fruta?: unknown;
  kg?: unknown;
}

function normalizeFruitStatuses(rawStatuses: unknown): FruitStatusEntry[] {
  if (!Array.isArray(rawStatuses)) return [];
  return rawStatuses
    .filter(isPlainObject)
    .map((entry: RawFruitStatusEntry) => ({
      fruitStatus: typeof entry.estado_fruta === 'string' ? entry.estado_fruta : '',
      kg: typeof entry.kg === 'number' ? entry.kg : Number(entry.kg ?? 0) || 0,
    }));
}

function assertContract<T>(
  data: unknown,
  guard: (value: unknown) => value is T,
  indicator: string,
  expectedShape: string
): T {
  if (!guard(data)) {
    throw new AnalyticsContractError(indicator, expectedShape);
  }
  return data;
}

function cleanParams(filters: AnalyticsFilterRecord = {}): Record<string, string | number | boolean> {
  const params: Record<string, string | number | boolean> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params[key] = value;
    }
  });
  return params;
}

export const analyticsApi = {
  getDashboard: async (signal?: AbortSignal): Promise<AnalyticsDashboardPayload> => {
    const { data } = await analyticsClient.get<unknown>('/dashboard', { signal });
    return ensureObjectResponse<AnalyticsDashboardPayload>(data, 'dashboard analítico');
  },

  getCropHealth: async (signal?: AbortSignal): Promise<CropHealthPayload> => {
    const { data } = await analyticsClient.get<unknown>('/analytics/salud-cultivos', { signal });
    return ensureObjectResponse<CropHealthPayload>(data, 'salud de cultivos');
  },

  getPhytosanitaryRisk: async (signal?: AbortSignal): Promise<PhytosanitaryRiskPayload> => {
    const { data } = await analyticsClient.get<unknown>('/analytics/riesgo-fitosanitario', { signal });
    return ensureObjectResponse<PhytosanitaryRiskPayload>(data, 'riesgo fitosanitario');
  },

  getOperationalActivityAnalysis: async (
    signal?: AbortSignal
  ): Promise<OperationalActivityAnalysisPayload> => {
    const { data } = await analyticsClient.get<unknown>('/analytics/actividad-operacional', { signal });
    return ensureObjectResponse<OperationalActivityAnalysisPayload>(data, 'actividad operacional');
  },

  getProductionByCrop: async (
    filters: AnalyticsFilterRecord = {},
    signal?: AbortSignal
  ): Promise<ProductionByCropResponse> => {
    const { data } = await analyticsClient.get<unknown>('/indicadores/produccion-por-cultivo', {
      params: cleanParams({ tipoCultivo: filters.tipoCultivo }),
      signal,
    });
    return assertContract(
      data,
      isProductionByCropResponse,
      'produccion-por-cultivo',
      'se esperaba objeto con produccion_por_tipo/totales_generales'
    );
  },

  getAlertsByField: async (
    filters: AnalyticsFilterRecord = {},
    signal?: AbortSignal
  ): Promise<AlertsByFieldResponse> => {
    const { data } = await analyticsClient.get<unknown>('/indicadores/alertas-por-campo', {
      params: cleanParams({
        estadoAlerta: filters.estadoAlerta,
        tipoProblema: filters.tipoProblema,
        top: filters.top,
      }),
      signal,
    });
    return assertContract(
      data,
      isAlertsByFieldResponse,
      'alertas-por-campo',
      'se esperaba objeto con resumen_general y ranking_campos_con_mas_alertas'
    );
  },

  getOperationalActivity: async (
    filters: AnalyticsFilterRecord = {},
    signal?: AbortSignal
  ): Promise<OperationalActivityResponse> => {
    const { data } = await analyticsClient.get<unknown>('/indicadores/actividad-operacional', {
      params: cleanParams({
        tipoActividad: filters.tipoActividad,
        campoId: filters.campoId,
        fechaDesde: filters.fechaDesde,
        fechaHasta: filters.fechaHasta,
        top: filters.top,
      }),
      signal,
    });
    return assertContract(
      data,
      isOperationalActivityResponse,
      'actividad-operacional',
      'se esperaba objeto con actividades_por_tipo y ranking_campos_mas_activos'
    );
  },

  getOccupancyByZone: async (
    filters: AnalyticsFilterRecord = {},
    signal?: AbortSignal
  ): Promise<OccupancyByZoneResponse> => {
    const { data } = await analyticsClient.get<unknown>('/indicadores/ocupacion-por-zona', {
      params: cleanParams({ zona: filters.zona }),
      signal,
    });
    return assertContract(
      data,
      isOccupancyByZoneResponse,
      'ocupacion-por-zona',
      'se esperaba objeto con ocupacion_por_zona'
    );
  },

  getUserProductivity: async (
    filters: AnalyticsFilterRecord = {},
    signal?: AbortSignal
  ): Promise<UserProductivityResponse> => {
    const { data } = await analyticsClient.get<unknown>('/indicadores/productividad-usuarios', {
      params: cleanParams({
        rol: filters.rol,
        area: filters.area,
        top: filters.top,
      }),
      signal,
    });
    return assertContract(
      data,
      isUserProductivityResponse,
      'productividad-usuarios',
      'se esperaba objeto con ranking_usuarios_mas_productivos'
    );
  },

  getCropDiversification: async (
    filters: AnalyticsFilterRecord = {},
    signal?: AbortSignal
  ): Promise<CropDiversificationResponse> => {
    const { data } = await analyticsClient.get<unknown>('/indicadores/diversificacion-cultivos', {
      params: cleanParams({
        campoId: filters.campoId,
        minCultivos: filters.minCultivos,
      }),
      signal,
    });
    return assertContract(
      data,
      isCropDiversificationResponse,
      'diversificacion-cultivos',
      'se esperaba objeto con ranking_campos_mas_diversificados'
    );
  },

  getYieldByHectare: async (
    filters: AnalyticsFilterRecord = {},
    signal?: AbortSignal
  ): Promise<YieldPerHectareResponse> => {
    const { data } = await analyticsClient.get<unknown>('/indicadores/rendimiento-por-hectarea', {
      params: cleanParams({
        fecha_inicio: filters.fecha_inicio,
        fecha_fin: filters.fecha_fin,
        zona: filters.zona,
        id_campo: filters.id_campo,
      }),
      signal,
    });
    return assertContract(
      data,
      (v): v is YieldPerHectareResponse => isIndicatorEnvelope(v),
      'rendimiento-por-hectarea',
      'se esperaba sobre dinámico con arreglo datos'
    );
  },

  getQualityByCaliber: async (
    filters: AnalyticsFilterRecord = {},
    signal?: AbortSignal
  ): Promise<QualityByCaliberResponse> => {
    const { data } = await analyticsClient.get<unknown>('/indicadores/calidad-por-calibre', {
      params: cleanParams({
        fecha_inicio: filters.fecha_inicio,
        fecha_fin: filters.fecha_fin,
        calibre: filters.calibre,
        estado_fruta: filters.estado_fruta,
      }),
      signal,
    });
    const envelope = assertContract(
      data,
      (v): v is IndicatorEnvelope => isIndicatorEnvelope(v),
      'calidad-por-calibre',
      'se esperaba sobre dinámico con arreglo datos'
    );
    const normalizedRows: QualityByCaliberRow[] = envelope.datos.map((row) => ({
      ...row,
      calibre: typeof row.calibre === 'string' ? row.calibre : '',
      total_kg: typeof row.total_kg === 'number' ? row.total_kg : Number(row.total_kg ?? 0) || 0,
      fruitStatuses: normalizeFruitStatuses(row.estados),
    }));
    return {
      ...envelope,
      datos: normalizedRows,
    };
  },

  getReviewCompliance: async (
    filters: AnalyticsFilterRecord = {},
    signal?: AbortSignal
  ): Promise<ReviewComplianceResponse> => {
    const { data } = await analyticsClient.get<unknown>('/indicadores/cumplimiento-revisiones', {
      params: cleanParams({
        fecha_inicio: filters.fecha_inicio,
        fecha_fin: filters.fecha_fin,
        id_campo: filters.id_campo,
        id_usuario_supervisor: filters.id_usuario_supervisor,
      }),
      signal,
    });
    return assertContract(
      data,
      (v): v is ReviewComplianceResponse => isIndicatorEnvelope(v),
      'cumplimiento-revisiones',
      'se esperaba sobre dinámico con arreglo datos'
    );
  },

  getInventoryCoverage: async (
    filters: AnalyticsFilterRecord = {},
    signal?: AbortSignal
  ): Promise<InventoryCoverageResponse> => {
    const { data } = await analyticsClient.get<unknown>('/indicadores/cobertura-inventario', {
      params: cleanParams({
        tipo_cultivo: filters.tipo_cultivo,
        estado_umbral: filters.estado_umbral,
        fecha_ingreso_inicio: filters.fecha_ingreso_inicio,
        fecha_ingreso_fin: filters.fecha_ingreso_fin,
        page: filters.page,
        size: filters.size,
      }),
      signal,
    });
    return assertContract(
      data,
      (v): v is InventoryCoverageResponse =>
        isPlainObject(v) &&
        isIndicatorEnvelope(v) &&
        isOptionalArrayOfObjects(v.resumen_por_tipo_cultivo),
      'cobertura-inventario',
      'se esperaba sobre dinámico con arreglo datos'
    );
  },

  getExportabilityByCrop: async (
    filters: AnalyticsFilterRecord = {},
    signal?: AbortSignal
  ): Promise<ExportabilityByCropResponse> => {
    const { data } = await analyticsClient.get<unknown>('/indicadores/exportabilidad-por-cultivo', {
      params: cleanParams({
        fecha_inicio: filters.fecha_inicio,
        fecha_fin: filters.fecha_fin,
        tipo_cultivo: filters.tipo_cultivo,
        apto_exportacion: filters.apto_exportacion,
      }),
      signal,
    });
    return assertContract(
      data,
      (v): v is ExportabilityByCropResponse => isIndicatorEnvelope(v),
      'exportabilidad-por-cultivo',
      'se esperaba sobre dinámico con arreglo datos'
    );
  },

  getAlertResolutionTime: async (
    filters: AnalyticsFilterRecord = {},
    signal?: AbortSignal
  ): Promise<AlertResolutionTimeResponse> => {
    const { data } = await analyticsClient.get<unknown>('/indicadores/tiempo-resolucion-alertas', {
      params: cleanParams({
        tipo_problema: filters.tipo_problema,
        estado_alerta: filters.estado_alerta,
        id_campo: filters.id_campo,
        fecha_inicio: filters.fecha_inicio,
        fecha_fin: filters.fecha_fin,
      }),
      signal,
    });
    return assertContract(
      data,
      (v): v is AlertResolutionTimeResponse => isIndicatorEnvelope(v),
      'tiempo-resolucion-alertas',
      'se esperaba sobre dinámico con arreglo datos'
    );
  },
};

export default analyticsApi;
