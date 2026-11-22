import React, { useState, useMemo, type ComponentType } from 'react';
import { analyticsApi, type AnalyticsFilterRecord } from '../api/analyticsApi';
import { useIndicator, type IndicatorFetcher } from '../hooks/useIndicator';
import {
  IndicatorFilterBar,
  type IndicatorFilterField,
} from '../components/IndicatorFilterBar';
import { IndicatorTable, formatColumnHeader } from '../components/IndicatorTable';
import { AnalyticsErrorState } from '../components/AnalyticsErrorState';
import { AnalyticsSubNav } from '../components/AnalyticsSubNav';
import { DynamicIndicatorCharts } from '../components/DynamicIndicatorCharts';
import {
  ProductionByCropPresenter,
  AlertsByFieldPresenter,
  OperationalActivityPresenter,
  OccupancyByZonePresenter,
  UserProductivityPresenter,
  CropDiversificationPresenter,
} from '../components/HistoricalIndicatorPresenters';
import {
  CROP_TYPES,
  CALIBERS,
  FRUIT_STATUSES,
  THRESHOLD_STATUSES,
  ALERT_PROBLEM_TYPES as PROBLEM_TYPES,
  ALERT_STATUSES,
  ACTIVITY_TYPES,
  USER_ROLES as ROLES,
  USER_AREAS as AREAS,
} from '../../../shared/constants/domain';
import type {
  AlertResolutionTimeResponse,
  AlertsByFieldResponse,
  CropDiversificationResponse,
  DynamicIndicatorKey,
  ExportabilityByCropResponse,
  HistoricalIndicatorResponse,
  IndicatorEnvelope,
  InventoryCoverageResponse,
  OccupancyByZoneResponse,
  OperationalActivityResponse,
  ProductionByCropResponse,
  QualityByCaliberResponse,
  ReviewComplianceResponse,
  UserProductivityResponse,
  YieldPerHectareResponse,
} from '../types';

export interface IndicatorConfigBase<TResponse> {
  key: string;
  number: number;
  label: string;
  endpoint: string;
  materialIcon: string;
  description: string;
  fetcher: IndicatorFetcher<TResponse>;
  initialFilters: AnalyticsFilterRecord;
  fields: IndicatorFilterField[];
}

export interface HistoricalIndicatorConfig<
  TKey extends string = string,
  TResponse extends HistoricalIndicatorResponse = HistoricalIndicatorResponse,
> extends IndicatorConfigBase<TResponse> {
  key: TKey;
  Presenter: ComponentType<{ data: TResponse }>;
}

export type AnyHistoricalIndicatorConfig =
  | HistoricalIndicatorConfig<'produccion-por-cultivo', ProductionByCropResponse>
  | HistoricalIndicatorConfig<'alertas-por-campo', AlertsByFieldResponse>
  | HistoricalIndicatorConfig<'actividad-operacional', OperationalActivityResponse>
  | HistoricalIndicatorConfig<'ocupacion-por-zona', OccupancyByZoneResponse>
  | HistoricalIndicatorConfig<'productividad-usuarios', UserProductivityResponse>
  | HistoricalIndicatorConfig<'diversificacion-cultivos', CropDiversificationResponse>;

export interface DynamicIndicatorConfig<
  TKey extends DynamicIndicatorKey = DynamicIndicatorKey,
  TResponse extends IndicatorEnvelope = IndicatorEnvelope,
> extends IndicatorConfigBase<TResponse> {
  key: TKey;
  isPaginated?: boolean;
  renderCharts: (data: TResponse) => React.ReactNode;
}

export type AnyDynamicIndicatorConfig =
  | DynamicIndicatorConfig<'rendimiento-por-hectarea', YieldPerHectareResponse>
  | DynamicIndicatorConfig<'calidad-por-calibre', QualityByCaliberResponse>
  | DynamicIndicatorConfig<'cumplimiento-revisiones', ReviewComplianceResponse>
  | DynamicIndicatorConfig<'cobertura-inventario', InventoryCoverageResponse>
  | DynamicIndicatorConfig<'exportabilidad-por-cultivo', ExportabilityByCropResponse>
  | DynamicIndicatorConfig<'tiempo-resolucion-alertas', AlertResolutionTimeResponse>;

export const HISTORICAL_INDICATORS_CONFIG: AnyHistoricalIndicatorConfig[] = [
  {
    key: 'produccion-por-cultivo',
    number: 1,
    label: '1. Producción por Cultivo',
    endpoint: 'GET /api/indicadores/produccion-por-cultivo',
    materialIcon: 'bar_chart',
    description:
      'Producción histórica registrada (kg, unidades, hectáreas y rendimiento) agrupada por tipo de cultivo.',
    fetcher: analyticsApi.getProductionByCrop,
    Presenter: ProductionByCropPresenter,
    initialFilters: {
      tipoCultivo: '',
    },
    fields: [
      {
        name: 'tipoCultivo',
        label: 'Tipo de Cultivo',
        type: 'select',
        options: CROP_TYPES,
      },
    ],
  },
  {
    key: 'alertas-por-campo',
    number: 2,
    label: '2. Alertas por Campo',
    endpoint: 'GET /api/indicadores/alertas-por-campo',
    materialIcon: 'bug_report',
    description:
      'Consolidado de alertas fitosanitarias por campo, distribución por problema y alertas críticas pendientes.',
    fetcher: analyticsApi.getAlertsByField,
    Presenter: AlertsByFieldPresenter,
    initialFilters: {
      estadoAlerta: '',
      tipoProblema: '',
      top: '',
    },
    fields: [
      {
        name: 'estadoAlerta',
        label: 'Estado de Alerta',
        type: 'select',
        options: ALERT_STATUSES,
      },
      {
        name: 'tipoProblema',
        label: 'Tipo de Problema',
        type: 'select',
        options: PROBLEM_TYPES,
      },
      {
        name: 'top',
        label: 'Top Campos (Límite)',
        type: 'number',
        min: 1,
        max: 100,
        placeholder: 'Ej. 10',
      },
    ],
  },
  {
    key: 'actividad-operacional',
    number: 3,
    label: '3. Actividad Operacional',
    endpoint: 'GET /api/indicadores/actividad-operacional',
    materialIcon: 'assignment',
    description:
      'Actividades de campo registradas agrupadas por campo, tipo de labor, usuario y periodo.',
    fetcher: analyticsApi.getOperationalActivity,
    Presenter: OperationalActivityPresenter,
    initialFilters: {
      tipoActividad: '',
      campoId: '',
      fechaDesde: '',
      fechaHasta: '',
      top: '',
    },
    fields: [
      {
        name: 'tipoActividad',
        label: 'Tipo de Actividad',
        type: 'select',
        options: ACTIVITY_TYPES,
      },
      {
        name: 'campoId',
        label: 'ID Campo',
        type: 'text',
        placeholder: 'Ej. CMP-001',
      },
      { name: 'fechaDesde', label: 'Fecha Desde', type: 'date' },
      { name: 'fechaHasta', label: 'Fecha Hasta', type: 'date' },
      {
        name: 'top',
        label: 'Top Campos (Límite)',
        type: 'number',
        min: 1,
        max: 100,
        placeholder: 'Ej. 10',
      },
    ],
  },
  {
    key: 'ocupacion-por-zona',
    number: 4,
    label: '4. Ocupación por Zona',
    endpoint: 'GET /api/indicadores/ocupacion-por-zona',
    materialIcon: 'map',
    description:
      'Distribución territorial de campos, hectáreas, sistemas de riego y cultivos por zona geográfica.',
    fetcher: analyticsApi.getOccupancyByZone,
    Presenter: OccupancyByZonePresenter,
    initialFilters: {
      zona: '',
    },
    fields: [
      {
        name: 'zona',
        label: 'Zona Geográfica',
        type: 'text',
        placeholder: 'Ej. Valle Norte',
      },
    ],
  },
  {
    key: 'productividad-usuarios',
    number: 5,
    label: '5. Productividad Usuarios',
    endpoint: 'GET /api/indicadores/productividad-usuarios',
    materialIcon: 'groups',
    description:
      'Desempeño de usuarios activos basado en actividades realizadas, campos atendidos y rol.',
    fetcher: analyticsApi.getUserProductivity,
    Presenter: UserProductivityPresenter,
    initialFilters: {
      rol: '',
      area: '',
      top: '',
    },
    fields: [
      { name: 'rol', label: 'Rol', type: 'select', options: ROLES },
      { name: 'area', label: 'Área', type: 'select', options: AREAS },
      {
        name: 'top',
        label: 'Top Usuarios (Límite)',
        type: 'number',
        min: 1,
        max: 100,
        placeholder: 'Ej. 10',
      },
    ],
  },
  {
    key: 'diversificacion-cultivos',
    number: 6,
    label: '6. Diversificación Cultivos',
    endpoint: 'GET /api/indicadores/diversificacion-cultivos',
    materialIcon: 'eco',
    description:
      'Variedad de cultivos por campo e índice de Shannon para identificar monocultivos y multicultivos.',
    fetcher: analyticsApi.getCropDiversification,
    Presenter: CropDiversificationPresenter,
    initialFilters: {
      campoId: '',
      minCultivos: '',
    },
    fields: [
      {
        name: 'campoId',
        label: 'ID Campo',
        type: 'text',
        placeholder: 'Ej. CMP-001',
      },
      {
        name: 'minCultivos',
        label: 'Mínimo de Cultivos',
        type: 'number',
        min: 1,
        max: 50,
        placeholder: 'Ej. 1',
      },
    ],
  },
];

export const DYNAMIC_INDICATORS_CONFIG: AnyDynamicIndicatorConfig[] = [
  {
    key: 'rendimiento-por-hectarea',
    number: 7,
    label: '7. Rendimiento por Hectárea',
    endpoint: 'GET /api/indicadores/rendimiento-por-hectarea',
    materialIcon: 'agriculture',
    description:
      'Kilos cosechados por hectárea en cada campo activo (cruce SQL Server cosechas + MongoDB campos).',
    fetcher: analyticsApi.getYieldByHectare,
    renderCharts: (data) => (
      <DynamicIndicatorCharts indicatorKey="rendimiento-por-hectarea" data={data} />
    ),
    initialFilters: {
      fecha_inicio: '',
      fecha_fin: '',
      zona: '',
      id_campo: '',
    },
    fields: [
      { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'date' },
      { name: 'fecha_fin', label: 'Fecha Fin', type: 'date' },
      {
        name: 'zona',
        label: 'Zona Geográfica',
        type: 'text',
        placeholder: 'Ej. Valle Norte',
      },
      {
        name: 'id_campo',
        label: 'ID Campo',
        type: 'text',
        placeholder: 'Ej. CMP-001',
      },
    ],
  },
  {
    key: 'calidad-por-calibre',
    number: 8,
    label: '8. Calidad por Calibre',
    endpoint: 'GET /api/indicadores/calidad-por-calibre',
    materialIcon: 'category',
    description:
      'Kilos y unidades clasificados por calibre y estado de fruta en SQL Server.',
    fetcher: analyticsApi.getQualityByCaliber,
    renderCharts: (data) => (
      <DynamicIndicatorCharts indicatorKey="calidad-por-calibre" data={data} />
    ),
    initialFilters: {
      fecha_inicio: '',
      fecha_fin: '',
      calibre: '',
      estado_fruta: '',
    },
    fields: [
      { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'date' },
      { name: 'fecha_fin', label: 'Fecha Fin', type: 'date' },
      { name: 'calibre', label: 'Calibre', type: 'select', options: CALIBERS },
      {
        name: 'estado_fruta',
        label: 'Estado de Fruta',
        type: 'select',
        options: FRUIT_STATUSES,
      },
    ],
  },
  {
    key: 'cumplimiento-revisiones',
    number: 9,
    label: '9. Cumplimiento de Revisiones',
    endpoint: 'GET /api/indicadores/cumplimiento-revisiones',
    materialIcon: 'fact_check',
    description:
      'Tasa de aprobación de revisiones de calidad agrupadas por supervisor, campo y cultivo.',
    fetcher: analyticsApi.getReviewCompliance,
    renderCharts: (data) => (
      <DynamicIndicatorCharts indicatorKey="cumplimiento-revisiones" data={data} />
    ),
    initialFilters: {
      fecha_inicio: '',
      fecha_fin: '',
      id_campo: '',
      id_usuario_supervisor: '',
    },
    fields: [
      { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'date' },
      { name: 'fecha_fin', label: 'Fecha Fin', type: 'date' },
      {
        name: 'id_campo',
        label: 'ID Campo',
        type: 'text',
        placeholder: 'Ej. CMP-001',
      },
      {
        name: 'id_usuario_supervisor',
        label: 'ID Supervisor',
        type: 'text',
        placeholder: 'Ej. USR-001',
      },
    ],
  },
  {
    key: 'cobertura-inventario',
    number: 10,
    label: '10. Cobertura de Inventario',
    endpoint: 'GET /api/indicadores/cobertura-inventario',
    materialIcon: 'inventory_2',
    description:
      'Cobertura de stock frente al umbral mínimo por producto (paginado).',
    fetcher: analyticsApi.getInventoryCoverage,
    renderCharts: (data) => (
      <DynamicIndicatorCharts indicatorKey="cobertura-inventario" data={data} />
    ),
    isPaginated: true,
    initialFilters: {
      tipo_cultivo: '',
      estado_umbral: '',
      fecha_ingreso_inicio: '',
      fecha_ingreso_fin: '',
      page: 1,
      size: 50,
    },
    fields: [
      {
        name: 'tipo_cultivo',
        label: 'Tipo de Cultivo',
        type: 'select',
        options: CROP_TYPES,
      },
      {
        name: 'estado_umbral',
        label: 'Estado de Umbral',
        type: 'select',
        options: THRESHOLD_STATUSES,
      },
      { name: 'fecha_ingreso_inicio', label: 'Ingreso Desde', type: 'date' },
      { name: 'fecha_ingreso_fin', label: 'Ingreso Hasta', type: 'date' },
      {
        name: 'size',
        label: 'Tamaño de Página (1-100)',
        type: 'number',
        min: 1,
        max: 100,
        placeholder: '50',
      },
    ],
  },
  {
    key: 'exportabilidad-por-cultivo',
    number: 11,
    label: '11. Exportabilidad por Cultivo',
    endpoint: 'GET /api/indicadores/exportabilidad-por-cultivo',
    materialIcon: 'flight_takeoff',
    description:
      'Porcentaje de kilogramos aptos para exportación por tipo de cultivo.',
    fetcher: analyticsApi.getExportabilityByCrop,
    renderCharts: (data) => (
      <DynamicIndicatorCharts indicatorKey="exportabilidad-por-cultivo" data={data} />
    ),
    initialFilters: {
      fecha_inicio: '',
      fecha_fin: '',
      tipo_cultivo: '',
      apto_exportacion: '',
    },
    fields: [
      { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'date' },
      { name: 'fecha_fin', label: 'Fecha Fin', type: 'date' },
      {
        name: 'tipo_cultivo',
        label: 'Tipo de Cultivo',
        type: 'select',
        options: CROP_TYPES,
      },
      {
        name: 'apto_exportacion',
        label: 'Apto Exportación',
        type: 'boolean',
        placeholder: 'Todos',
      },
    ],
  },
  {
    key: 'tiempo-resolucion-alertas',
    number: 12,
    label: '12. Tiempo de Resolución de Alertas',
    endpoint: 'GET /api/indicadores/tiempo-resolucion-alertas',
    materialIcon: 'timer',
    description:
      'Días promedio, mínimo y máximo de resolución de alertas fitosanitarias y antigüedad de pendientes.',
    fetcher: analyticsApi.getAlertResolutionTime,
    renderCharts: (data) => (
      <DynamicIndicatorCharts indicatorKey="tiempo-resolucion-alertas" data={data} />
    ),
    initialFilters: {
      tipo_problema: '',
      estado_alerta: '',
      id_campo: '',
      fecha_inicio: '',
      fecha_fin: '',
    },
    fields: [
      {
        name: 'tipo_problema',
        label: 'Tipo de Problema',
        type: 'select',
        options: PROBLEM_TYPES,
      },
      {
        name: 'estado_alerta',
        label: 'Estado de Alerta',
        type: 'select',
        options: ALERT_STATUSES,
      },
      {
        name: 'id_campo',
        label: 'ID Campo',
        type: 'text',
        placeholder: 'Ej. CMP-001',
      },
      { name: 'fecha_inicio', label: 'Detección Desde', type: 'date' },
      { name: 'fecha_fin', label: 'Detección Hasta', type: 'date' },
    ],
  },
];

export function HistoricalIndicatorPanel<
  TKey extends string,
  TResponse extends HistoricalIndicatorResponse,
>({ config }: { config: HistoricalIndicatorConfig<TKey, TResponse> }) {
  const {
    data,
    isLoading,
    errorMessage,
    errorParam,
    isValidationError,
    isServiceUnavailable,
    retryAfter,
    filters,
    setFilters,
    reload,
    resetFilters,
  } = useIndicator(config.fetcher, config.initialFilters);

  const PresenterComponent = config.Presenter;

  return (
    <section
      className="space-y-6"
      aria-label={`Sección de indicador ${config.label}`}
    >
      {/* Section Header with Endpoint Badge */}
      <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EEF5E6] text-[#557A38] flex items-center justify-center shrink-0">
            <span className="material-icons-outlined text-xl">
              {config.materialIcon}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-black text-[#2A241E]">
              {data?.indicador || config.label}
            </h2>
            <p className="text-xs text-[#8C8574] mt-0.5">
              {config.description}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#FAF8F3] border border-[#EAE5D9] text-[#557A38] self-start sm:self-center shrink-0">
          {config.endpoint}
        </span>
      </div>

      <IndicatorFilterBar
        idPrefix={`hist-${config.key}`}
        fields={config.fields}
        filters={filters}
        setFilters={setFilters}
        onApply={() => reload()}
        onReset={resetFilters}
        isLoading={isLoading}
      />

      <AnalyticsErrorState
        isServiceUnavailable={isServiceUnavailable}
        isValidationError={isValidationError}
        errorMessage={errorMessage}
        errorParam={errorParam}
        retryAfter={retryAfter}
        onRetry={() => reload()}
      />

      {isLoading && (
        <div
          className="bg-white rounded-2xl border border-[#EAE5D9] p-12 text-center animate-fade-in shadow-xs"
          aria-busy="true"
          aria-label="Consultando indicador histórico"
        >
          <span className="material-icons-outlined text-3xl text-[#557A38] animate-spin block mb-2">
            sync
          </span>
          <p className="text-xs font-medium text-[#8C8574]">
            Consultando datos y gráficos del endpoint {config.endpoint}...
          </p>
        </div>
      )}

      {!isLoading && data && PresenterComponent && (
        <PresenterComponent data={data} />
      )}
    </section>
  );
}

export function DynamicIndicatorPanel<
  TKey extends DynamicIndicatorKey,
  TResponse extends IndicatorEnvelope,
>({ config }: { config: DynamicIndicatorConfig<TKey, TResponse> }) {
  const {
    data,
    isLoading,
    errorMessage,
    errorParam,
    isValidationError,
    isServiceUnavailable,
    retryAfter,
    filters,
    setFilters,
    reload,
    resetFilters,
  } = useIndicator(config.fetcher, config.initialFilters);

  const handlePageChange = (nextPage: number) => {
    const updated = { ...filters, page: nextPage };
    void reload(updated);
  };

  const resumenEntries = useMemo(() => {
    if (!data?.resumen || typeof data.resumen !== 'object') return [];
    return Object.entries(data.resumen);
  }, [data]);

  const kpiColors = [
    'text-[#557A38]',
    'text-[#2A241E]',
    'text-[#E29839]',
    'text-[#C44536]',
  ];

  return (
    <section
      className="space-y-6"
      aria-label={`Sección de indicador ${config.label}`}
    >
      {/* Section Header with Endpoint Badge */}
      <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EEF5E6] text-[#557A38] flex items-center justify-center shrink-0">
            <span className="material-icons-outlined text-xl">
              {config.materialIcon}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-black text-[#2A241E]">
              {data?.indicador || config.label}
            </h2>
            <p className="text-xs text-[#8C8574] mt-0.5">
              {config.description}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#FAF8F3] border border-[#EAE5D9] text-[#557A38] self-start sm:self-center shrink-0">
          {config.endpoint}
        </span>
      </div>

      <IndicatorFilterBar
        idPrefix={`dyn-${config.key}`}
        fields={config.fields}
        filters={filters}
        setFilters={setFilters}
        onApply={() => reload()}
        onReset={resetFilters}
        isLoading={isLoading}
      />

      <AnalyticsErrorState
        isServiceUnavailable={isServiceUnavailable}
        isValidationError={isValidationError}
        errorMessage={errorMessage}
        errorParam={errorParam}
        retryAfter={retryAfter}
        onRetry={() => reload()}
      />

      {isLoading && (
        <div
          className="bg-white rounded-2xl border border-[#EAE5D9] p-12 text-center animate-fade-in shadow-xs"
          aria-busy="true"
          aria-label="Consultando indicador dinámico"
        >
          <span className="material-icons-outlined text-3xl text-[#557A38] animate-spin block mb-2">
            sync
          </span>
          <p className="text-xs font-medium text-[#8C8574]">
            Consultando datos y gráficos del endpoint {config.endpoint}...
          </p>
        </div>
      )}

      {/* Prototype Image 1 style Top Summary Cards from data.resumen */}
      {!isLoading && data && resumenEntries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {resumenEntries.map(([k, v], idx) => (
            <div
              key={k}
              className="bg-white rounded-2xl border border-[#EAE5D9] p-5 shadow-xs"
            >
              <span className="block text-xs font-medium text-[#8C8574]">
                {formatColumnHeader(k)}
              </span>
              <span
                className={`text-2xl font-black mt-2 block tracking-tight ${
                  kpiColors[idx % kpiColors.length]
                }`}
              >
                {v != null ? String(v) : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Dedicated Charts Section (Bar + Doughnut + Prototype Cards) for Indicators 7 to 12 */}
      {!isLoading && data && config.renderCharts(data)}

      {/* Generic Indicator Table with Prototype Progress Bars & Pagination */}
      {!isLoading && data && (
        <IndicatorTable
          title={`Registros del Indicador — ${data.indicador || config.label}`}
          rows={data.datos || []}
          totalRecords={data.total_registros ?? (data.datos || []).length}
          pagination={config.isPaginated ? data.paginacion : null}
          onPageChange={config.isPaginated ? handlePageChange : null}
        />
      )}
    </section>
  );
}

function renderHistoricalSection(config: AnyHistoricalIndicatorConfig): React.ReactNode {
  switch (config.key) {
    case 'produccion-por-cultivo':
      return <HistoricalIndicatorPanel key={config.key} config={config} />;
    case 'alertas-por-campo':
      return <HistoricalIndicatorPanel key={config.key} config={config} />;
    case 'actividad-operacional':
      return <HistoricalIndicatorPanel key={config.key} config={config} />;
    case 'ocupacion-por-zona':
      return <HistoricalIndicatorPanel key={config.key} config={config} />;
    case 'productividad-usuarios':
      return <HistoricalIndicatorPanel key={config.key} config={config} />;
    case 'diversificacion-cultivos':
      return <HistoricalIndicatorPanel key={config.key} config={config} />;
  }
}

function renderDynamicSection(config: AnyDynamicIndicatorConfig): React.ReactNode {
  switch (config.key) {
    case 'rendimiento-por-hectarea':
      return <DynamicIndicatorPanel key={config.key} config={config} />;
    case 'calidad-por-calibre':
      return <DynamicIndicatorPanel key={config.key} config={config} />;
    case 'cumplimiento-revisiones':
      return <DynamicIndicatorPanel key={config.key} config={config} />;
    case 'cobertura-inventario':
      return <DynamicIndicatorPanel key={config.key} config={config} />;
    case 'exportabilidad-por-cultivo':
      return <DynamicIndicatorPanel key={config.key} config={config} />;
    case 'tiempo-resolucion-alertas':
      return <DynamicIndicatorPanel key={config.key} config={config} />;
  }
}

export function IndicatorsPage() {
  const [groupTab, setGroupTab] = useState<'historicos' | 'dinamicos'>('dinamicos');
  const [selectedDynamicKey, setSelectedDynamicKey] = useState<string>(
    DYNAMIC_INDICATORS_CONFIG[0].key
  );
  const [selectedHistoricalKey, setSelectedHistoricalKey] = useState<string>(
    HISTORICAL_INDICATORS_CONFIG[0].key
  );

  const activeDynamicConfig = useMemo(
    () =>
      DYNAMIC_INDICATORS_CONFIG.find((c) => c.key === selectedDynamicKey) ||
      DYNAMIC_INDICATORS_CONFIG[0],
    [selectedDynamicKey]
  );

  const activeHistoricalConfig = useMemo(
    () =>
      HISTORICAL_INDICATORS_CONFIG.find(
        (c) => c.key === selectedHistoricalKey
      ) || HISTORICAL_INDICATORS_CONFIG[0],
    [selectedHistoricalKey]
  );

  const activeList =
    groupTab === 'historicos'
      ? HISTORICAL_INDICATORS_CONFIG
      : DYNAMIC_INDICATORS_CONFIG;
  const activeKey =
    groupTab === 'historicos' ? selectedHistoricalKey : selectedDynamicKey;
  const handleSelectIndicator =
    groupTab === 'historicos'
      ? setSelectedHistoricalKey
      : setSelectedDynamicKey;

  return (
    <div className="space-y-6 animate-fade-in pb-12 bg-[#FAF8F3] -m-4 sm:-m-6 p-4 sm:p-6 min-h-screen">
      {/* Top Internal Sub-Navigation */}
      <AnalyticsSubNav />

      {/* Prototype Category Switcher & Indicator Underline Tabs */}
      <div className="bg-white rounded-2xl border border-[#EAE5D9] px-6 pt-5 pb-0 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-[#2A241E]">
              Secciones por Endpoint de Indicadores (1 al 12)
            </h2>
            <p className="text-xs text-[#8C8574] mt-0.5">
              Cada sección consulta su endpoint correspondiente, permite filtrado parametrizado y genera gráficos de barras, distribuciones circulares (3+ categorías) o tarjetas KPI con barra de progreso.
            </p>
          </div>

          <div
            className="inline-flex rounded-xl p-1 bg-[#FAF8F3] border border-[#EAE5D9] self-start"
            role="tablist"
            aria-label="Categoría de indicadores"
          >
            <button
              type="button"
              role="tab"
              aria-selected={groupTab === 'historicos'}
              onClick={() => setGroupTab('historicos')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                groupTab === 'historicos'
                  ? 'bg-[#557A38] text-white shadow-xs'
                  : 'bg-transparent text-[#6E6A5F] hover:text-[#2A241E]'
              }`}
            >
              <span className="material-icons-outlined text-base">history</span>
              Históricos (1 a 6)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={groupTab === 'dinamicos'}
              onClick={() => setGroupTab('dinamicos')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                groupTab === 'dinamicos'
                  ? 'bg-[#557A38] text-white shadow-xs'
                  : 'bg-transparent text-[#6E6A5F] hover:text-[#2A241E]'
              }`}
            >
              <span className="material-icons-outlined text-base">tune</span>
              Dinámicos (7 a 12)
            </button>
          </div>
        </div>

        {/* Prototype Image 2 Underline Tabs for Individual Indicator Endpoints */}
        <div
          className="flex flex-wrap gap-5 pt-2 border-t border-[#F0ECE1]"
          role="tablist"
          aria-label="Selector de indicador específico"
        >
          {activeList.map((ind) => {
            const active = ind.key === activeKey;
            return (
              <button
                key={ind.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleSelectIndicator(ind.key)}
                className={`pb-3.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer bg-transparent ${
                  active
                    ? 'border-[#557A38] text-[#3B5924]'
                    : 'border-transparent text-[#8C8574] hover:text-[#2A241E]'
                }`}
              >
                <span className="material-icons-outlined text-base">
                  {ind.materialIcon}
                </span>
                {ind.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Selected Endpoint Section */}
      {groupTab === 'historicos'
        ? renderHistoricalSection(activeHistoricalConfig)
        : renderDynamicSection(activeDynamicConfig)}
    </div>
  );
}

export default IndicatorsPage;
