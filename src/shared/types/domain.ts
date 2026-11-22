export type EntityId = string | number;

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  nationalId?: string | null;
  phone?: string | null;
  address?: string | null;
  role?: string;
  area?: string;
  active?: boolean;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface UserPayload {
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  nationalId?: string | null;
  phone?: string | null;
  address?: string | null;
  role: string;
  area: string;
  active: boolean;
}

export interface Field {
  id: string;
  idCampo: string;
  _id?: string;
  nombre: string;
  ubicacion: string;
  hectareas: number;
  areaHectareas: number;
  responsable?: string;
  sistemaRiego?: string;
  tipoSuelo?: string;
  zona?: string;
  observaciones?: string;
  estado: boolean;
  fechaRegistro?: string;
}

export interface FieldPayload {
  nombre: string;
  ubicacion: string;
  hectareas: number;
  areaHectareas?: number;
  responsable: string;
  sistemaRiego: string;
  tipoSuelo: string;
  zona: string;
  observaciones: string;
  estado: boolean;
}

export interface ImportFieldsResult {
  totalProcesados?: number;
  exitosos?: number;
  fallidos?: number;
  errores?: string[];
}

export interface Crop {
  id: string;
  idCultivo: string;
  _id?: string;
  campoId?: string;
  idCampo?: EntityId;
  campo?: Partial<Field>;
  nombre: string;
  tipoCultivo: string;
  variedad?: string;
  frecuenciaRiegoDias?: number;
  temperaturaIdeal?: number;
  fechaSiembra?: string;
  estadoSalud?: string;
  requiereSombra?: boolean;
  observaciones?: string;
  estado?: boolean;
}

export interface CropPayload {
  nombre: string;
  tipoCultivo: string;
  frecuenciaRiegoDias: number;
  temperaturaIdeal: number;
  fechaSiembra: string;
  requiereSombra: boolean;
  estadoSalud: string;
  observaciones: string;
  idCampo: string;
  campoId: string;
}

export interface Harvest {
  id: EntityId;
  idCosecha: EntityId;
  fecha: string;
  idCampo?: EntityId;
  idCultivo?: EntityId;
  idUsuario?: EntityId;
  campo?: Partial<Field>;
  cultivo?: Partial<Crop>;
  usuario?: Partial<User>;
  cantidadKg: number;
  cantidadUnidades?: number;
  observaciones?: string;
  estado?: boolean;
}

export interface HarvestPayload {
  fecha: string;
  idCampo: string;
  idCultivo: string;
  cantidadKg: number;
  cantidadUnidades: number;
  observaciones: string;
}

export interface FieldActivity {
  id: EntityId;
  idActividad: EntityId;
  tipoActividad: string;
  fecha: string;
  idCampo?: EntityId;
  idCultivo?: EntityId | null;
  campo?: Partial<Field>;
  cultivo?: Partial<Crop>;
  observaciones?: string;
  estado?: boolean;
}

export interface FieldActivityPayload {
  tipoActividad: string;
  fecha: string;
  idCampo: string;
  idCultivo: string | null;
  observaciones: string;
}

export interface PhytosanitaryAlert {
  id: EntityId;
  idAlerta: EntityId;
  idCampo?: EntityId;
  campoId?: EntityId;
  idCultivo?: EntityId | null;
  cultivoId?: EntityId | null;
  reporterUserId?: EntityId;
  idUsuarioReporta?: EntityId;
  idUsuario?: EntityId;
  campo?: Partial<Field>;
  cultivo?: Partial<Crop>;
  usuario?: Partial<User>;
  tipoProblema: string;
  fechaDeteccion: string;
  descripcionProblema: string;
  solucionAplicada?: string | null;
  atendida?: boolean;
  estado?: boolean;
}

export interface AlertPayload {
  idCampo: string;
  campoId: string;
  idCultivo: string | null;
  cultivoId: string | null;
  reporterUserId: string;
  idUsuarioReporta: string;
  idUsuario: string;
  tipoProblema: string;
  fechaDeteccion: string;
  descripcionProblema: string;
}

export interface QualityReview {
  id: EntityId;
  idRevision: EntityId;
  idCosecha?: EntityId;
  cosecha?: Partial<Harvest>;
  idUsuarioSupervisor?: EntityId;
  idSupervisor?: EntityId;
  supervisor?: Partial<User>;
  fecha: string;
  cumpleRequisitos: boolean;
  notificado?: boolean;
  observaciones?: string;
  estado?: boolean;
}

export interface QualityReviewPayload {
  idCosecha: number;
  idSupervisor: string;
  cumpleRequisitos: boolean;
  observaciones: string;
  fecha: string;
}

export interface DashboardSummaryData {
  fields: Field[];
  harvests: Harvest[];
  pendingAlerts: PhytosanitaryAlert[];
  recentActivities: FieldActivity[];
  totalUsers: number;
}

export interface AnalyticsPagination {
  page?: number;
  size?: number;
  total_paginas?: number;
  total_registros?: number;
  tiene_anterior?: boolean;
  tiene_siguiente?: boolean;
}

export interface IndicatorPayload<T extends Record<string, unknown> = Record<string, unknown>> {
  indicador?: string;
  filtros_aplicados?: Record<string, unknown>;
  total_registros?: number;
  datos?: T[];
  paginacion?: AnalyticsPagination;
  resumen?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AnalyticsMongoSummary {
  totalCampos?: number;
  totalCultivos?: number;
  totalUsuarios?: number;
  totalActividades?: number;
  alertasPendientes?: number;
}

export interface AnalyticsSqlSummary {
  totalCosechas?: number;
  totalClasificaciones?: number;
  totalProductos?: number;
  productosBajoUmbral?: number;
}

export interface AnalyticsDashboardPayload {
  mongoDB?: AnalyticsMongoSummary;
  sqlServer?: AnalyticsSqlSummary;
  [key: string]: unknown;
}

export interface CropHealthStatusEntry {
  total?: number;
  tipos?: Record<string, number>;
}

export interface AtRiskCropItem {
  id?: EntityId;
  nombre?: string;
  tipo_cultivo?: string;
  campo_id?: string;
  observaciones?: string;
  estado_salud?: string;
}

export interface CropHealthPayload {
  servicio?: string;
  total_cultivos?: number;
  porcentaje_saludables?: number;
  alerta_decision?: string;
  resumen_por_estado?: Record<string, CropHealthStatusEntry>;
  cultivos_en_riesgo_o_con_problemas?: AtRiskCropItem[];
  [key: string]: unknown;
}

export interface PhytosanitaryRiskEntry {
  pendientes?: number;
  atendidos?: number;
  total?: number;
}

export interface CriticalPhytosanitaryAlert {
  id?: EntityId;
  tipo_problema?: string;
  descripcion?: string;
  campo?: string;
  campo_id?: string;
  fecha_deteccion?: string;
}

export interface HighRiskFieldRanking {
  campo?: string;
  pendientes?: number;
  total_alertas?: number;
}

export interface PhytosanitaryRiskPayload {
  servicio?: string;
  total_alertas?: number;
  alertas_pendientes?: number;
  alertas_atendidas?: number;
  recomendacion?: string;
  resumen_por_tipo_problema?: Record<string, PhytosanitaryRiskEntry>;
  alertas_criticas_pendientes?: CriticalPhytosanitaryAlert[];
  campos_con_mayor_riesgo?: HighRiskFieldRanking[];
  [key: string]: unknown;
}

export interface FieldActivityRankingItem {
  campo?: string;
  total_actividades?: number;
  tipos?: Record<string, number>;
}

export interface OperationalActivityAnalysisPayload {
  servicio?: string;
  descripcion?: string;
  recomendacion?: string;
  total_actividades_registradas?: number;
  tipo_actividad_mas_frecuente?: string;
  actividades_por_tipo?: Record<string, number>;
  campos_sin_actividad_reciente?: Array<{ campo_id?: string; campo_nombre?: string }>;
  ranking_campos_mas_activos?: FieldActivityRankingItem[];
  [key: string]: unknown;
}
