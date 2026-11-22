import type { AnalyticsPagination } from '../../shared/types/domain';

export type AnalyticsRow = Record<string, unknown>;

export interface IndicatorEnvelope<
  TRow extends AnalyticsRow = AnalyticsRow,
  TSummary extends Record<string, unknown> = Record<string, unknown>,
> {
  indicador?: string;
  filtros_aplicados?: Record<string, unknown>;
  total_registros?: number;
  datos: TRow[];
  paginacion?: AnalyticsPagination;
  resumen?: TSummary;
  extra?: Record<string, unknown>;
}

// ============================================================
// Historical Indicators (1 - 6)
// ============================================================

export interface CropTypeWarningGroup {
  total_cultivos?: number;
  cultivos?: AnalyticsRow[];
}

export interface ProductionByCropRow extends AnalyticsRow {
  tipo_cultivo: string;
  total_kg?: number;
  cantidad_cultivos?: number;
  total_hectareas?: number;
  cantidad_campos?: number;
  kg_por_hectarea?: number;
}

export interface ProductionByCropResponse {
  indicador?: string;
  advertencia?: string;
  sugerencia?: string;
  recomendacion?: string;
  tipo_mas_productivo?: string;
  totales_generales?: Record<string, unknown>;
  cultivos_por_tipo?: Record<string, CropTypeWarningGroup>;
  produccion_por_tipo?: ProductionByCropRow[];
}

export interface FieldAlertRankingRow extends AnalyticsRow {
  campo_nombre?: string;
  campo_id?: string;
  alertas_pendientes?: number;
  alertas_atendidas?: number;
}

export interface HistoricalCriticalAlert {
  id?: string | number;
  tipo_problema?: string;
  descripcion?: string;
  campo?: string;
  campo_id?: string;
  fecha_deteccion?: string;
}

export interface AlertsByFieldResponse {
  indicador?: string;
  recomendacion?: string;
  resumen_general?: Record<string, unknown>;
  distribucion_tipo_problema?: Record<string, number>;
  ranking_campos_con_mas_alertas?: FieldAlertRankingRow[];
  alertas_pendientes_criticas?: HistoricalCriticalAlert[];
}

export interface ActiveFieldRankingRow extends AnalyticsRow {
  campo_nombre?: string;
  campo_id?: string;
  total_actividades?: number;
}

export interface InactiveFieldItem {
  campo_id?: string;
  campo_nombre?: string;
}

export interface OperationalActivityResponse {
  indicador?: string;
  recomendacion?: string;
  resumen_general?: Record<string, unknown>;
  actividades_por_tipo?: Record<string, number>;
  distribucion_por_usuario?: Record<string, number>;
  ranking_campos_mas_activos?: ActiveFieldRankingRow[];
  campos_sin_actividad_reciente?: InactiveFieldItem[];
}

export interface ZoneOccupancyRow extends AnalyticsRow {
  zona: string;
  total_hectareas?: number;
}

export interface OccupancyByZoneResponse {
  indicador?: string;
  recomendacion?: string;
  zona_mayor_extension?: string;
  totales_generales?: Record<string, unknown>;
  ocupacion_por_zona?: ZoneOccupancyRow[];
}

export interface UserProductivityRow extends AnalyticsRow {
  nombre?: string;
  usuario_id?: string;
  total_actividades?: number;
}

export interface RoleProductivityStats {
  total_usuarios?: number;
  total_actividades?: number;
}

export interface UserProductivityResponse {
  indicador?: string;
  recomendacion?: string;
  resumen_general?: Record<string, unknown>;
  distribucion_por_rol?: Record<string, RoleProductivityStats>;
  ranking_usuarios_mas_productivos?: UserProductivityRow[];
  usuarios_sin_actividad?: AnalyticsRow[];
}

export interface DiversificationRankingRow extends AnalyticsRow {
  campo_nombre?: string;
  campo_id?: string;
  indice_diversificacion?: number;
}

export interface CropDiversificationResponse {
  indicador?: string;
  recomendacion?: string;
  resumen_general?: Record<string, unknown>;
  distribucion_tipos_cultivo?: Record<string, number>;
  ranking_campos_mas_diversificados?: DiversificationRankingRow[];
  campos_monocultivo?: AnalyticsRow[];
}

export type HistoricalIndicatorResponse =
  | ProductionByCropResponse
  | AlertsByFieldResponse
  | OperationalActivityResponse
  | OccupancyByZoneResponse
  | UserProductivityResponse
  | CropDiversificationResponse;

// ============================================================
// Dynamic Indicators (7 - 12)
// ============================================================

export interface YieldPerHectareRow extends AnalyticsRow {
  id_campo?: string;
  nombre_campo?: string;
  kg_por_hectarea?: number;
  estado_rendimiento?: string;
}

export interface YieldPerHectareSummary extends Record<string, unknown> {
  campos_con_cosecha?: number;
  campos_sin_cosechas?: number;
  campos_sin_superficie?: number;
}

export type YieldPerHectareResponse = IndicatorEnvelope<
  YieldPerHectareRow,
  YieldPerHectareSummary
>;

export interface FruitStatusEntry {
  fruitStatus: string;
  kg: number;
}

export interface QualityByCaliberRow extends AnalyticsRow {
  calibre: string;
  total_kg?: number;
  fruitStatuses: FruitStatusEntry[];
}

export type QualityByCaliberResponse = IndicatorEnvelope<QualityByCaliberRow>;

export interface ReviewComplianceRow extends AnalyticsRow {
  agrupacion?: string;
  id_usuario_supervisor?: string;
  id_campo?: string;
  id_cultivo?: string;
  aprobadas?: number;
  rechazadas?: number;
}

export interface ReviewComplianceSummary extends Record<string, unknown> {
  aprobadas?: number;
  rechazadas?: number;
  sin_resultado?: number;
  tasa_aprobacion_general?: number;
}

export type ReviewComplianceResponse = IndicatorEnvelope<
  ReviewComplianceRow,
  ReviewComplianceSummary
>;

export interface InventoryCoverageRow extends AnalyticsRow {
  nombre?: string;
  cantidad_kg?: number;
  umbral_minimo?: number;
  estado_umbral?: string;
}

export interface CropStockSummary {
  tipo_cultivo: string;
  total_kg?: number;
  total_umbral_minimo?: number;
  productos_bajo_umbral?: number;
  total_productos?: number;
  porcentaje_cobertura?: number;
}

export interface InventoryCoverageResponse extends IndicatorEnvelope<InventoryCoverageRow> {
  resumen_por_tipo_cultivo?: CropStockSummary[];
}

export interface ExportabilityByCropRow extends AnalyticsRow {
  tipo_cultivo: string;
  kg_aptos?: number;
  kg_no_aptos?: number;
  total_kg?: number;
  cantidad_cultivos?: number;
  registros_considerados?: number;
  porcentaje_apto_exportacion?: number;
}

export interface ExportabilityByCropSummary extends Record<string, unknown> {
  kg_aptos?: number;
  total_kg_considerado?: number;
  porcentaje_apto_exportacion_global?: number;
}

export type ExportabilityByCropResponse = IndicatorEnvelope<
  ExportabilityByCropRow,
  ExportabilityByCropSummary
>;

export interface PendingAlertItem {
  id?: string | number;
  id_campo?: string;
  id_cultivo?: string | null;
  fecha_deteccion?: string;
  dias_antiguedad?: number;
}

export interface PendingAlertCard extends PendingAlertItem {
  problemType: string;
}

export interface AlertResolutionTimeRow extends AnalyticsRow {
  tipo_problema: string;
  dias_promedio_resolucion?: number;
  antiguedad_promedio_pendientes_dias?: number;
  alertas_resueltas?: number;
  alertas_pendientes?: number;
  pendientes?: PendingAlertItem[];
}

export interface AlertResolutionTimeSummary extends Record<string, unknown> {
  dias_promedio_resolucion_global?: number;
}

export type AlertResolutionTimeResponse = IndicatorEnvelope<
  AlertResolutionTimeRow,
  AlertResolutionTimeSummary
>;

export type DynamicIndicatorKey =
  | 'rendimiento-por-hectarea'
  | 'calidad-por-calibre'
  | 'cumplimiento-revisiones'
  | 'cobertura-inventario'
  | 'exportabilidad-por-cultivo'
  | 'tiempo-resolucion-alertas';

export type DynamicIndicatorResponse =
  | YieldPerHectareResponse
  | QualityByCaliberResponse
  | ReviewComplianceResponse
  | InventoryCoverageResponse
  | ExportabilityByCropResponse
  | AlertResolutionTimeResponse;
