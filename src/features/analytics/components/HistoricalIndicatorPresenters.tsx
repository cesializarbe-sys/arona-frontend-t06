import React from 'react';
import type { ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { IndicatorTable, formatColumnHeader } from './IndicatorTable';
import {
  PrototypeDoughnutCard,
  getCropVisual,
} from './DynamicIndicatorCharts';
import type {
  AlertsByFieldResponse,
  CropDiversificationResponse,
  OccupancyByZoneResponse,
  OperationalActivityResponse,
  ProductionByCropResponse,
  UserProductivityResponse,
} from '../types';

const PROTOTYPE_COLORS = [
  '#557A38',
  '#E29839',
  '#C44536',
  '#3A6B7C',
  '#7A5C38',
  '#6E8B52',
];

const chartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#2A241E',
      titleFont: { size: 12, family: 'Inter, sans-serif' },
      bodyFont: { size: 11, family: 'Inter, sans-serif' },
      padding: 10,
      cornerRadius: 10,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#7D7769', font: { size: 11, family: 'Inter, sans-serif' } },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(140, 133, 116, 0.12)' },
      ticks: {
        color: '#7D7769',
        precision: 0,
        font: { size: 11, family: 'Inter, sans-serif' },
      },
    },
  },
};

// Typed presenter props are imported from ../types

function PrototypeKpiRow({
  summaryObj = {},
  recommendation = null,
}: {
  summaryObj?: Record<string, unknown>;
  recommendation?: string | null;
}) {
  const entries = Object.entries(summaryObj || {});
  if (entries.length === 0 && !recommendation) return null;

  const valueColors = [
    'text-[#557A38]',
    'text-[#2A241E]',
    'text-[#E29839]',
    'text-[#C44536]',
    'text-[#557A38]',
  ];

  return (
    <div className="space-y-4">
      {entries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {entries.slice(0, 4).map(([key, val], idx) => (
            <div
              key={key}
              className="bg-white rounded-2xl border border-[#EAE5D9] p-5 shadow-xs"
            >
              <span className="block text-xs font-medium text-[#8C8574]">
                {formatColumnHeader(key)}
              </span>
              <span
                className={`text-2xl font-black mt-2 block tracking-tight ${valueColors[idx % valueColors.length]}`}
              >
                {val != null ? String(val) : '—'}
              </span>
              {entries[idx + 4] && (
                <span className="block text-[11px] text-[#8C8574] mt-2">
                  {formatColumnHeader(entries[idx + 4][0])}:{' '}
                  <strong>{entries[idx + 4][1] != null ? String(entries[idx + 4][1]) : '—'}</strong>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {recommendation && (
        <div className="bg-white border border-[#DCE6D3] rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-[#EEF5E6] text-[#557A38] flex items-center justify-center shrink-0">
            <span className="material-icons-outlined text-lg">tips_and_updates</span>
          </div>
          <p className="text-xs font-semibold text-[#3B5924]">{recommendation}</p>
        </div>
      )}
    </div>
  );
}

// 1. Producción por Cultivo
export function ProductionByCropPresenter({ data }: { data: ProductionByCropResponse }) {
  if (!data) return null;

  if (data.advertencia && data.cultivos_por_tipo) {
    const types = Object.entries(data.cultivos_por_tipo);
    return (
      <div className="space-y-5">
        <div className="bg-white border border-[#F0C8C2] rounded-2xl p-4 flex items-start gap-3">
          <span className="material-icons-outlined text-[#C44536] text-xl">
            warning
          </span>
          <div>
            <p className="text-xs font-bold text-[#C44536]">{data.advertencia}</p>
            {data.sugerencia && (
              <p className="text-xs text-[#C44536]/80 mt-0.5">{data.sugerencia}</p>
            )}
          </div>
        </div>
        <PrototypeKpiRow summaryObj={data.totales_generales} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {types.map(([cropType, info]) => (
            <div
              key={cropType}
              className="bg-white rounded-2xl border border-[#EAE5D9] p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#2A241E]">{cropType}</h4>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EEF5E6] text-[#557A38]">
                  {info.total_cultivos} cultivos
                </span>
              </div>
              <IndicatorTable
                rows={info.cultivos || []}
                totalRecords={info.total_cultivos}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const rows = data.produccion_por_tipo || [];
  const barData = {
    labels: rows.map((r) => r.tipo_cultivo),
    datasets: [
      {
        label: 'Producción Cosechada (kg)',
        data: rows.map((r) => r.total_kg ?? 0),
        backgroundColor: '#557A38',
        borderRadius: 6,
        maxBarThickness: 42,
      },
    ],
  };

  const doughnutItems = rows.map((r, idx) => ({
    label: r.tipo_cultivo,
    value: r.total_kg ?? 0,
    color: PROTOTYPE_COLORS[idx % PROTOTYPE_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <PrototypeKpiRow
        summaryObj={{
          ...data.totales_generales,
          tipo_mas_productivo: data.tipo_mas_productivo || '—',
        }}
        recommendation={data.recomendacion}
      />

      {/* Prototype Image 2 style Crop Cards (Palta, Mandarina, Arándano, Caqui) */}
      {rows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rows.map((crop) => {
            const vis = getCropVisual(crop.tipo_cultivo);
            return (
              <div
                key={crop.tipo_cultivo}
                className="bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl ${vis.bg} flex items-center justify-center text-2xl`}
                    >
                      {vis.emoji}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#2A241E]">
                        {crop.tipo_cultivo}
                      </h4>
                      <span className="text-xs text-[#8C8574]">
                        {vis.stage} · {crop.cantidad_cultivos} variedades
                      </span>
                    </div>
                  </div>

                  {data.tipo_mas_productivo === crop.tipo_cultivo && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#EEF5E6] text-[#557A38]">
                      ★ Líder Producción
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-3 pt-3 border-t border-[#F0ECE1]">
                  <div>
                    <span className="block text-[11px] text-[#8C8574]">
                      Hectáreas
                    </span>
                    <span className="text-sm font-bold text-[#2A241E] mt-0.5 block">
                      {crop.total_hectareas ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#8C8574]">
                      Parcelas
                    </span>
                    <span className="text-sm font-bold text-[#2A241E] mt-0.5 block">
                      {crop.cantidad_campos ?? 0}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#8C8574]">
                      Rendimiento
                    </span>
                    <span className="text-sm font-bold text-[#557A38] mt-0.5 block">
                      {crop.kg_por_hectarea ?? 0} kg/ha
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#8C8574]">
                      Volumen Total
                    </span>
                    <span className="text-sm font-bold text-[#E29839] mt-0.5 block">
                      {crop.total_kg ?? 0} kg
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Charts: Bar + Doughnut */}
      {rows.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
            <h3 className="text-sm font-bold text-[#2A241E]">
              Cosecha Acumulada por Tipo de Cultivo (kg)
            </h3>
            <p className="text-xs text-[#8C8574] mb-4">
              Volumen físico registrado en SQL Server cruzado con catálogo MongoDB
            </p>
            <div className="h-64">
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>

          <PrototypeDoughnutCard
            title="Participación por Cultivo"
            subtitle="Proporción sobre el volumen total"
            items={doughnutItems}
            unit="kg"
            kpiLabel="Participación Principal"
          />
        </div>
      )}

      <IndicatorTable
        title="Tabla Consolidada de Producción por Cultivo"
        rows={rows}
        totalRecords={rows.length}
      />
    </div>
  );
}

// 2. Alertas Fitosanitarias por Campo (Prototype Image 4 style)
export function AlertsByFieldPresenter({ data }: { data: AlertsByFieldResponse }) {
  if (!data) return null;

  const dist = data.distribucion_tipo_problema || {};
  const distLabels = Object.keys(dist);
  const ranking = data.ranking_campos_con_mas_alertas || [];
  const criticalAlerts = data.alertas_pendientes_criticas || [];

  const barData = {
    labels: ranking.map((r) => r.campo_nombre || r.campo_id),
    datasets: [
      {
        label: 'Alertas Pendientes',
        data: ranking.map((r) => r.alertas_pendientes ?? 0),
        backgroundColor: '#C44536',
        borderRadius: 6,
        maxBarThickness: 32,
      },
      {
        label: 'Alertas Atendidas',
        data: ranking.map((r) => r.alertas_atendidas ?? 0),
        backgroundColor: '#557A38',
        borderRadius: 6,
        maxBarThickness: 32,
      },
    ],
  };

  const doughnutItems = distLabels.map((label, idx) => ({
    label,
    value: dist[label] ?? 0,
    color:
      label === 'PLAGA'
        ? '#C44536'
        : label === 'ENFERMEDAD'
          ? '#E29839'
          : PROTOTYPE_COLORS[idx % PROTOTYPE_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Prototype Image 4 Intervention Banner */}
      <div className="bg-white border border-[#F0C8C2] rounded-2xl p-5 flex items-start gap-3.5 shadow-2xs">
        <span className="material-icons-outlined text-[#C44536] text-2xl mt-0.5">
          warning
        </span>
        <div>
          <h3 className="text-sm font-bold text-[#C44536]">
            Intervención inmediata requerida
          </h3>
          <p className="text-xs text-[#C44536]/90 mt-1">
            {data.recomendacion ||
              'Monitoreo fitosanitario activo en parcelas de mayor incidencia.'}
          </p>
        </div>
      </div>

      <PrototypeKpiRow summaryObj={data.resumen_general} />

      {/* Charts: Bar + Doughnut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
          <h3 className="text-sm font-bold text-[#2A241E]">
            Alertas Pendientes vs Atendidas por Parcela
          </h3>
          <p className="text-xs text-[#8C8574] mb-4">
            Ranking de campos según carga sanitaria activa
          </p>
          <div className="h-64">
            <Bar
              data={barData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    display: true,
                    position: 'top',
                    labels: { boxWidth: 12, font: { size: 11 } },
                  },
                },
              }}
            />
          </div>
        </div>

        <PrototypeDoughnutCard
          title="Tipo de Problema"
          subtitle="Distribución de alertas registradas"
          items={doughnutItems}
          unit="alertas"
          kpiLabel="Problema Predominante"
        />
      </div>

      {/* Prototype Image 4 Alert Cards */}
      {criticalAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-bold text-[#2A241E]">
              Alertas Fitosanitarias Críticas
            </h3>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-[#F8D7D2] text-[#C44536]">
              {criticalAlerts.length} críticas activas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {criticalAlerts.map((alert) => {
              const isPlaga = String(alert.tipo_problema).toUpperCase() === 'PLAGA';
              return (
                <div
                  key={alert.id}
                  className="bg-white rounded-2xl border border-[#EAE5D9] p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-3 py-0.5 rounded-full text-[11px] font-bold ${isPlaga
                            ? 'bg-[#F8D7D2] text-[#C44536]'
                            : 'bg-[#FDE8C8] text-[#B56B14]'
                          }`}
                      >
                        {isPlaga ? 'Crítica' : 'Moderada'}
                      </span>
                      <span className="text-xs font-mono text-[#8C8574]">
                        {alert.id}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#2A241E]">
                      {alert.tipo_problema}
                    </h4>
                    <p className="text-xs text-[#6E6A5F] mt-1 line-clamp-3">
                      {alert.descripcion || 'Requiere evaluación fitosanitaria en campo.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#F0ECE1] text-xs">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-[#8C8574]">
                        PARCELA
                      </span>
                      <span className="font-bold text-[#2A241E]">
                        {alert.campo} ({alert.campo_id})
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-[#8C8574]">
                        FECHA
                      </span>
                      <span className="font-bold text-[#2A241E]">
                        {String(alert.fecha_deteccion || '—').slice(0, 10)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <IndicatorTable
        title="Ranking de Campos con Más Alertas"
        rows={ranking}
        totalRecords={ranking.length}
      />
    </div>
  );
}

// 3. Actividad Operacional (Prototype Image 3 style: Labores de Campo)
export function OperationalActivityPresenter({ data }: { data: OperationalActivityResponse }) {
  if (!data) return null;

  const byType = data.actividades_por_tipo || {};
  const typeKeys = Object.keys(byType);
  const byUser = data.distribucion_por_usuario || {};
  const userKeys = Object.keys(byUser);
  const ranking = data.ranking_campos_mas_activos || [];
  const inactiveFields = data.campos_sin_actividad_reciente || [];
  const maxAct =
    ranking.reduce((m, r) => Math.max(m, r.total_actividades || 0), 0) || 1;

  // Enrich rows with percentage of operational load so IndicatorTable renders Prototype Image 3 progress bars
  const rankingWithProgress = ranking.map((r) => ({
    ...r,
    porcentaje_carga_operativa: Math.round(((r.total_actividades || 0) / maxAct) * 100),
  }));

  const typeChartData = {
    labels: typeKeys,
    datasets: [
      {
        label: 'Labores Ejecutadas',
        data: typeKeys.map((k) => byType[k]),
        backgroundColor: '#557A38',
        borderRadius: 6,
        maxBarThickness: 40,
      },
    ],
  };

  const doughnutItems = userKeys.slice(0, 5).map((u, idx) => ({
    label: u,
    value: byUser[u] ?? 0,
    color: PROTOTYPE_COLORS[idx % PROTOTYPE_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <PrototypeKpiRow
        summaryObj={data.resumen_general}
        recommendation={data.recomendacion}
      />

      {/* Charts: Bar + Doughnut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
          <h3 className="text-sm font-bold text-[#2A241E]">
            Labores de Campo por Tipo de Actividad
          </h3>
          <p className="text-xs text-[#8C8574] mb-4">
            Volumen de tareas agronómicas ejecutadas en el periodo
          </p>
          <div className="h-64">
            <Bar data={typeChartData} options={chartOptions} />
          </div>
        </div>

        <PrototypeDoughnutCard
          title="Distribución por Responsable"
          subtitle="Participación de cuadrillas / técnicos"
          items={doughnutItems}
          unit="labores"
          kpiLabel="Mayor Participación Operativa"
        />
      </div>

      <IndicatorTable
        title="Labores de Campo — Ranking e Intensidad por Parcela"
        rows={rankingWithProgress}
        totalRecords={rankingWithProgress.length}
      />

      {inactiveFields.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EAE5D9] p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C8574] mb-2.5">
            Parcelas sin actividad registrada en el periodo (
            {inactiveFields.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {inactiveFields.map((c) => (
              <span
                key={c.campo_id}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF6D8] text-[#B5811C]"
              >
                {c.campo_nombre} ({c.campo_id})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 4. Ocupación por Zona
export function OccupancyByZonePresenter({ data }: { data: OccupancyByZoneResponse }) {
  if (!data) return null;

  const zones = data.ocupacion_por_zona || [];
  const barData = {
    labels: zones.map((z) => z.zona),
    datasets: [
      {
        label: 'Superficie Cultivable (ha)',
        data: zones.map((z) => z.total_hectareas ?? 0),
        backgroundColor: '#557A38',
        borderRadius: 6,
        maxBarThickness: 42,
      },
    ],
  };

  const doughnutItems = zones.map((z, idx) => ({
    label: z.zona,
    value: z.total_hectareas ?? 0,
    color: PROTOTYPE_COLORS[idx % PROTOTYPE_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <PrototypeKpiRow
        summaryObj={{
          ...data.totales_generales,
          zona_mayor_extension: data.zona_mayor_extension || '—',
        }}
        recommendation={data.recomendacion}
      />

      {zones.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
            <h3 className="text-sm font-bold text-[#2A241E]">
              Extensión Cultivable por Zona Geográfica (ha)
            </h3>
            <p className="text-xs text-[#8C8574] mb-4">
              Distribución territorial de hectáreas activas
            </p>
            <div className="h-64">
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>

          <PrototypeDoughnutCard
            title="Distribución Territorial"
            subtitle="Porcentaje de hectáreas por zona"
            items={doughnutItems}
            unit="ha"
            kpiLabel="Zona de Mayor Extensión"
          />
        </div>
      )}

      <IndicatorTable
        title="Detalle de Ocupación por Zona y Parcelas"
        rows={zones}
        totalRecords={zones.length}
      />
    </div>
  );
}

// 5. Productividad de Usuarios
export function UserProductivityPresenter({ data }: { data: UserProductivityResponse }) {
  if (!data) return null;

  const ranking = data.ranking_usuarios_mas_productivos || [];
  const roles = Object.entries(data.distribucion_por_rol || {});
  const maxUserAct =
    ranking.reduce((m, u) => Math.max(m, u.total_actividades || 0), 0) || 1;

  const rankingWithProgress = ranking.map((u) => ({
    ...u,
    porcentaje_desempeno: Math.round(((u.total_actividades || 0) / maxUserAct) * 100),
  }));

  const barData = {
    labels: ranking.map((u) => u.nombre || u.usuario_id),
    datasets: [
      {
        label: 'Labores Completadas',
        data: ranking.map((u) => u.total_actividades ?? 0),
        backgroundColor: '#557A38',
        borderRadius: 6,
        maxBarThickness: 38,
      },
    ],
  };

  const doughnutItems = roles.map(([roleName, stats], idx) => ({
    label: `${roleName} (${stats.total_usuarios} usr)`,
    value: stats.total_actividades ?? 0,
    color: PROTOTYPE_COLORS[idx % PROTOTYPE_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <PrototypeKpiRow
        summaryObj={data.resumen_general}
        recommendation={data.recomendacion}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
          <h3 className="text-sm font-bold text-[#2A241E]">
            Productividad por Responsable Técnico / Operador
          </h3>
          <p className="text-xs text-[#8C8574] mb-4">
            Actividades completadas y parcelas atendidas
          </p>
          <div className="h-64">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        <PrototypeDoughnutCard
          title="Actividades por Rol"
          subtitle="Distribución de carga según perfil"
          items={doughnutItems}
          unit="labores"
          kpiLabel="Participación del Rol Principal"
        />
      </div>

      <IndicatorTable
        title="Ranking de Productividad de Usuarios"
        rows={rankingWithProgress}
        totalRecords={rankingWithProgress.length}
      />

      {data.usuarios_sin_actividad && data.usuarios_sin_actividad.length > 0 && (
        <IndicatorTable
          title={`Usuarios Activos Sin Actividades Registradas (${data.usuarios_sin_actividad.length})`}
          rows={data.usuarios_sin_actividad}
          totalRecords={data.usuarios_sin_actividad.length}
        />
      )}
    </div>
  );
}

// 6. Diversificación de Cultivos
export function CropDiversificationPresenter({ data }: { data: CropDiversificationResponse }) {
  if (!data) return null;

  const dist = data.distribucion_tipos_cultivo || {};
  const distKeys = Object.keys(dist);
  const ranking = data.ranking_campos_mas_diversificados || [];

  const barData = {
    labels: ranking.map((r) => r.campo_nombre || r.campo_id),
    datasets: [
      {
        label: 'Índice de Shannon (H)',
        data: ranking.map((r) => r.indice_diversificacion ?? 0),
        backgroundColor: '#557A38',
        borderRadius: 6,
        maxBarThickness: 38,
      },
    ],
  };

  const doughnutItems = distKeys.map((k, idx) => ({
    label: k,
    value: dist[k] ?? 0,
    color: PROTOTYPE_COLORS[idx % PROTOTYPE_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <PrototypeKpiRow
        summaryObj={data.resumen_general}
        recommendation={data.recomendacion}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
          <h3 className="text-sm font-bold text-[#2A241E]">
            Índice de Diversificación de Shannon por Parcela
          </h3>
          <p className="text-xs text-[#8C8574] mb-4">
            Valores superiores a 0 indican multicultivo; 0 corresponde a monocultivo
          </p>
          <div className="h-64">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        <PrototypeDoughnutCard
          title="Variedades Sembradas"
          subtitle="Distribución global de cultivos"
          items={doughnutItems}
          unit="lotes"
          kpiLabel="Cultivo Predominante"
        />
      </div>

      <IndicatorTable
        title="Ranking de Parcelas por Diversificación Agrícola"
        rows={ranking}
        totalRecords={ranking.length}
      />

      {data.campos_monocultivo && data.campos_monocultivo.length > 0 && (
        <IndicatorTable
          title={`Parcelas con Monocultivo — Requieren Diversificación (${data.campos_monocultivo.length})`}
          rows={data.campos_monocultivo}
          totalRecords={data.campos_monocultivo.length}
        />
      )}
    </div>
  );
}
