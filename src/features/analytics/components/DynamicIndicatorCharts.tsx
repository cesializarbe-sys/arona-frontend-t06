import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import type {
  AlertResolutionTimeResponse,
  ExportabilityByCropResponse,
  InventoryCoverageResponse,
  PendingAlertCard,
  QualityByCaliberResponse,
  QualityByCaliberRow,
  ReviewComplianceResponse,
  ReviewComplianceRow,
  YieldPerHectareResponse,
} from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const PROTOTYPE_COLORS = [
  '#557A38',
  '#E29839',
  '#C44536',
  '#3A6B7C',
  '#7A5C38',
  '#6E8B52',
];

const barOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        boxWidth: 12,
        usePointStyle: true,
        pointStyle: 'circle',
        font: { size: 11, family: 'Inter, sans-serif' },
        color: '#5C574B',
      },
    },
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
      ticks: { color: '#7D7769', font: { size: 11, family: 'Inter, sans-serif' } },
    },
  },
};

const doughnutOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '66%',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#2A241E',
      padding: 10,
      cornerRadius: 10,
    },
  },
};

export interface BreakdownItem {
  label: string;
  value: number;
  color?: string;
}

export interface BinaryProgressCardProps {
  title: string;
  subtitle?: string;
  items?: BreakdownItem[];
  unit?: string;
  kpiLabel?: string;
  overridePercentage?: number | null;
  footerNote?: string | null;
}

export interface DoughnutCardProps {
  title: string;
  subtitle?: string;
  items?: BreakdownItem[];
  unit?: string;
  kpiLabel?: string;
}

export function getCropVisual(cropName = ''): { emoji: string; stage: string; bg: string } {
  const upper = String(cropName).toUpperCase();
  if (upper.includes('PALTA')) {
    return { emoji: '🥑', stage: 'Maduración', bg: 'bg-[#EEF5E6]' };
  }
  if (upper.includes('MANDARINA')) {
    return { emoji: '🍊', stage: 'Floración', bg: 'bg-[#FEF3E2]' };
  }
  if (upper.includes('ARANDANO') || upper.includes('ARÁNDANO')) {
    return { emoji: '🫐', stage: 'Maduración', bg: 'bg-[#EBF1FA]' };
  }
  if (upper.includes('CAQUI')) {
    return { emoji: '🟠', stage: 'Cuajado', bg: 'bg-[#FCEEE4]' };
  }
  return { emoji: '🌱', stage: 'Activo', bg: 'bg-[#F3F1EC]' };
}

export function PrototypeBinaryProgressCard({
  title,
  subtitle,
  items = [],
  unit = '',
  kpiLabel = 'Proporción principal',
  overridePercentage = null,
  footerNote = null,
}: BinaryProgressCardProps) {
  const first = items[0] || { label: 'Categoría A', value: 0, color: '#557A38' };
  const second = items[1] || { label: 'Categoría B', value: 0, color: '#E29839' };

  const valA = Number(first.value) || 0;
  const valB = Number(second.value) || 0;
  const total = valA + valB;

  const pctA =
    overridePercentage !== null && overridePercentage !== undefined
      ? Number(overridePercentage)
      : total > 0
      ? Math.round((valA / total) * 1000) / 10
      : 0;
  const pctB = total > 0 ? Math.max(Math.round((100 - pctA) * 10) / 10, 0) : 0;

  const colorA = first.color || PROTOTYPE_COLORS[0];
  const colorB = second.color || PROTOTYPE_COLORS[1];
  const formatVal = (v: number) =>
    unit ? `${v.toLocaleString('es-PE')} ${unit}` : v.toLocaleString('es-PE');

  return (
    <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 flex flex-col justify-between shadow-xs">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#2A241E]">{title}</h3>
            {subtitle && (
              <p className="text-xs text-[#8C8574] mt-0.5">{subtitle}</p>
            )}
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FAF8F3] border border-[#EAE5D9] text-[#5C574B] shrink-0">
            Total: {formatVal(Math.round(total * 100) / 100)}
          </span>
        </div>

        {/* Main KPI Highlight */}
        <div className="mt-6 mb-4 p-4 rounded-2xl bg-[#FAF8F3] border border-[#EAE5D9]">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-[#8C8574]">
            {kpiLabel}
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span
              className="text-3xl font-black tracking-tight"
              style={{ color: colorA }}
            >
              {pctA}%
            </span>
            <span className="text-xs font-semibold text-[#5C574B]">
              {formatVal(valA)} de {formatVal(Math.round(total * 100) / 100)}
            </span>
          </div>

          {/* Segmented Horizontal Progress Bar */}
          {total > 0 ? (
            <div
              className="mt-3.5 h-3 w-full rounded-full bg-[#EFECE4] overflow-hidden flex"
              role="progressbar"
              aria-valuenow={pctA}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={title}
            >
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${Math.min(Math.max(pctA, 0), 100)}%`,
                  backgroundColor: colorA,
                }}
              />
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${Math.min(Math.max(pctB, 0), 100)}%`,
                  backgroundColor: colorB,
                }}
              />
            </div>
          ) : (
            <div className="mt-3.5 h-3 w-full rounded-full bg-[#EFECE4]" />
          )}
        </div>
      </div>

      {/* Two-Category Breakdown Cards */}
      <div className="space-y-2.5 pt-2 border-t border-[#F0ECE1]">
        {[
          { item: first, val: valA, pct: pctA, color: colorA },
          ...(items.length > 1
            ? [{ item: second, val: valB, pct: pctB, color: colorB }]
            : []),
        ].map(({ item, val, pct, color }) => (
          <div
            key={item.label}
            className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-[#FAF8F3]/70 border border-[#F0ECE1]"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-[#2A241E] font-semibold">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#8C8574] text-[11px] font-medium">
                ({formatVal(val)})
              </span>
              <span
                className="font-black w-12 text-right"
                style={{ color }}
              >
                {pct}%
              </span>
            </div>
          </div>
        ))}

        {footerNote && (
          <p className="text-[11px] text-[#8C8574] pt-1 text-center">
            {footerNote}
          </p>
        )}
      </div>
    </div>
  );
}

export function PrototypeDoughnutCard({
  title,
  subtitle,
  items = [],
  unit = '',
  kpiLabel,
}: DoughnutCardProps) {
  // Rule: A doughnut chart only adds value when splitting a total across 3+ distinct categories.
  // When there are only 1 or 2 categories, automatically render the KPI + Progress Bar card.
  if (items.length > 0 && items.length <= 2) {
    return (
      <PrototypeBinaryProgressCard
        title={title}
        subtitle={subtitle}
        items={items}
        unit={unit}
        kpiLabel={kpiLabel || items[0]?.label || 'Participación principal'}
      />
    );
  }

  const total = items.reduce((acc, i) => acc + (Number(i.value) || 0), 0);

  const chartData = {
    labels: items.map((i) => i.label),
    datasets: [
      {
        data: items.map((i) => Number(i.value) || 0),
        backgroundColor: items.map(
          (i, idx) => i.color || PROTOTYPE_COLORS[idx % PROTOTYPE_COLORS.length]
        ),
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    ],
  };

  return (
    <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 flex flex-col justify-between shadow-xs">
      <div>
        <h3 className="text-sm font-bold text-[#2A241E]">{title}</h3>
        {subtitle && <p className="text-xs text-[#8C8574] mt-0.5">{subtitle}</p>}
      </div>

      {total > 0 ? (
        <div className="my-4 h-44 flex items-center justify-center">
          <Doughnut data={chartData} options={doughnutOptions} />
        </div>
      ) : (
        <div className="my-6 py-8 text-center text-xs text-[#8C8574]">
          Sin datos suficientes para graficar distribución
        </div>
      )}

      <div className="space-y-2.5 pt-2 border-t border-[#F0ECE1]">
        {items.map((item, idx) => {
          const val = Number(item.value) || 0;
          const pct = total > 0 ? Math.round((val / total) * 1000) / 10 : 0;
          const dotColor =
            item.color || PROTOTYPE_COLORS[idx % PROTOTYPE_COLORS.length];

          return (
            <div
              key={item.label}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: dotColor }}
                />
                <span className="text-[#5C574B] font-medium">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8C8574] text-[11px]">({val})</span>
                <span className="font-bold text-[#2A241E] w-12 text-right">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type DynamicIndicatorChartsProps =
  | { indicatorKey: 'rendimiento-por-hectarea'; data: YieldPerHectareResponse }
  | { indicatorKey: 'calidad-por-calibre'; data: QualityByCaliberResponse }
  | { indicatorKey: 'cumplimiento-revisiones'; data: ReviewComplianceResponse }
  | { indicatorKey: 'cobertura-inventario'; data: InventoryCoverageResponse }
  | { indicatorKey: 'exportabilidad-por-cultivo'; data: ExportabilityByCropResponse }
  | { indicatorKey: 'tiempo-resolucion-alertas'; data: AlertResolutionTimeResponse };

export function DynamicIndicatorCharts(props: DynamicIndicatorChartsProps) {
  // 7. Rendimiento por Hectárea
  if (props.indicatorKey === 'rendimiento-por-hectarea') {
    const rows = props.data.datos;
    const summary = props.data.resumen || {};
    const chartRows = rows.slice(0, 12);
    const barData = {
      labels: chartRows.map((r) => r.nombre_campo || r.id_campo || '—'),
      datasets: [
        {
          label: 'Rendimiento (kg / ha)',
          data: chartRows.map((r) => r.kg_por_hectarea ?? 0),
          backgroundColor: '#557A38',
          borderRadius: 6,
          maxBarThickness: 38,
        },
      ],
    };

    const doughnutItems = [
      {
        label: 'Con Cosecha',
        value:
          summary.campos_con_cosecha ??
          rows.filter((r) => r.estado_rendimiento === 'CON_COSECHA').length,
        color: '#557A38',
      },
      {
        label: 'Sin Cosechas',
        value:
          summary.campos_sin_cosechas ??
          rows.filter((r) => r.estado_rendimiento === 'SIN_COSECHAS').length,
        color: '#E29839',
      },
      {
        label: 'Sin Superficie',
        value:
          summary.campos_sin_superficie ??
          rows.filter((r) => r.estado_rendimiento === 'SIN_SUPERFICIE').length,
        color: '#C44536',
      },
    ];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#2A241E]">
                Rendimiento por Campo (kg / ha)
              </h3>
              <p className="text-xs text-[#8C8574]">
                Comparativa de eficiencia agronómica entre parcelas activas
              </p>
            </div>
          </div>
          <div className="h-64">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        <PrototypeDoughnutCard
          title="Estado de Parcelas"
          subtitle="Cobertura de cosecha registrada"
          items={doughnutItems}
        />
      </div>
    );
  }

  // 8. Calidad por Calibre
  if (props.indicatorKey === 'calidad-por-calibre') {
    const rows = props.data.datos;
    const labels = rows.map((r) => r.calibre);
    const getStatusKg = (row: QualityByCaliberRow, targetStatus: string): number => {
      const found = row.fruitStatuses.find(
        (e) => e.fruitStatus.toUpperCase() === targetStatus
      );
      return found?.kg ?? 0;
    };

    const barData = {
      labels,
      datasets: [
        {
          label: 'Fruta Buena (kg)',
          data: rows.map((r) => getStatusKg(r, 'BUENA')),
          backgroundColor: '#557A38',
          borderRadius: 6,
          maxBarThickness: 32,
        },
        {
          label: 'Fruta Dañada (kg)',
          data: rows.map((r) => getStatusKg(r, 'DAÑADA')),
          backgroundColor: '#E29839',
          borderRadius: 6,
          maxBarThickness: 32,
        },
        {
          label: 'Descarte (kg)',
          data: rows.map((r) => getStatusKg(r, 'DESCARTE')),
          backgroundColor: '#C44536',
          borderRadius: 6,
          maxBarThickness: 32,
        },
      ],
    };

    const doughnutItems = rows.map((r, idx) => ({
      label: r.calibre,
      value: r.total_kg ?? 0,
      color: PROTOTYPE_COLORS[idx % PROTOTYPE_COLORS.length],
    }));

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
          <h3 className="text-sm font-bold text-[#2A241E]">
            Calidad de Fruta por Calibre (kg)
          </h3>
          <p className="text-xs text-[#8C8574] mb-4">
            Desglose de kilogramos clasificados en Buena, Dañada y Descarte
          </p>
          <div className="h-64">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        <PrototypeDoughnutCard
          title="Distribución por Calibre"
          subtitle="Participación sobre el volumen clasificado"
          items={doughnutItems}
        />
      </div>
    );
  }

  // 9. Cumplimiento de Revisiones
  if (props.indicatorKey === 'cumplimiento-revisiones') {
    const rows = props.data.datos;
    const summary = props.data.resumen || {};
    const chartRows = rows.slice(0, 10);
    const rowLabel = (r: ReviewComplianceRow) =>
      `${r.agrupacion || 'Grupo'}: ${
        r.id_usuario_supervisor || r.id_campo || r.id_cultivo || 'N/A'
      }`;

    const barData = {
      labels: chartRows.map(rowLabel),
      datasets: [
        {
          label: 'Aprobadas',
          data: chartRows.map((r) => r.aprobadas ?? 0),
          backgroundColor: '#557A38',
          borderRadius: 6,
          maxBarThickness: 28,
        },
        {
          label: 'Rechazadas',
          data: chartRows.map((r) => r.rechazadas ?? 0),
          backgroundColor: '#C44536',
          borderRadius: 6,
          maxBarThickness: 28,
        },
      ],
    };

    const doughnutItems = [
      {
        label: 'Aprobadas',
        value: summary.aprobadas ?? 0,
        color: '#557A38',
      },
      {
        label: 'Rechazadas',
        value: summary.rechazadas ?? 0,
        color: '#C44536',
      },
      {
        label: 'Sin Resultado',
        value: summary.sin_resultado ?? 0,
        color: '#E29839',
      },
    ];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
          <h3 className="text-sm font-bold text-[#2A241E]">
            Revisiones Aprobadas vs Rechazadas por Agrupación
          </h3>
          <p className="text-xs text-[#8C8574] mb-4">
            Desempeño de control de calidad por supervisor, parcela y cultivo
          </p>
          <div className="h-64">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        <PrototypeDoughnutCard
          title="Estado de Revisiones"
          subtitle={`Tasa general: ${summary.tasa_aprobacion_general ?? 0}%`}
          items={doughnutItems}
        />
      </div>
    );
  }

  // 10. Cobertura de Inventario
  if (props.indicatorKey === 'cobertura-inventario') {
    const rows = props.data.datos;
    const byCrop = props.data.resumen_por_tipo_cultivo || [];

    const barLabels =
      byCrop.length > 0
        ? byCrop.map((c) => c.tipo_cultivo)
        : rows.slice(0, 10).map((r) => r.nombre);

    const barData = {
      labels: barLabels,
      datasets: [
        {
          label: 'Stock Actual (kg)',
          data:
            byCrop.length > 0
              ? byCrop.map((c) => c.total_kg ?? 0)
              : rows.slice(0, 10).map((r) => r.cantidad_kg ?? 0),
          backgroundColor: '#557A38',
          borderRadius: 6,
          maxBarThickness: 36,
        },
        {
          label: 'Umbral Mínimo (kg)',
          data:
            byCrop.length > 0
              ? byCrop.map((c) => c.total_umbral_minimo ?? 0)
              : rows.slice(0, 10).map((r) => r.umbral_minimo ?? 0),
          backgroundColor: '#E29839',
          borderRadius: 6,
          maxBarThickness: 36,
        },
      ],
    };

    const totalBelow =
      byCrop.length > 0
        ? byCrop.reduce((sum, c) => sum + (c.productos_bajo_umbral || 0), 0)
        : rows.filter((r) => r.estado_umbral === 'BAJO_UMBRAL').length;
    const totalAll =
      byCrop.length > 0
        ? byCrop.reduce((sum, c) => sum + (c.total_productos || 0), 0)
        : rows.length;
    const totalNormal = Math.max(totalAll - totalBelow, 0);

    const doughnutItems = [
      { label: 'Stock Normal', value: totalNormal, color: '#557A38' },
      { label: 'Bajo Umbral Crítico', value: totalBelow, color: '#C44536' },
    ];

    return (
      <div className="space-y-6">
        {/* Prototype Image 2 style Crop Cards for Inventory Coverage */}
        {byCrop.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {byCrop.map((crop) => {
              const vis = getCropVisual(crop.tipo_cultivo);
              const hasAlert = (crop.productos_bajo_umbral || 0) > 0;
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
                          Almacén · {crop.total_productos} productos
                        </span>
                      </div>
                    </div>

                    {hasAlert ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#F8D7D2] text-[#C44536]">
                        ⚠️ {crop.productos_bajo_umbral} Bajo umbral
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#E3F5E8] text-[#2F7A47]">
                        ✓ Stock óptimo
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-3 pt-3 border-t border-[#F0ECE1]">
                    <div>
                      <span className="block text-[11px] text-[#8C8574]">
                        Stock Total
                      </span>
                      <span className="text-sm font-bold text-[#2A241E] mt-0.5 block">
                        {crop.total_kg ?? 0} kg
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#8C8574]">
                        Umbral Mín.
                      </span>
                      <span className="text-sm font-bold text-[#2A241E] mt-0.5 block">
                        {crop.total_umbral_minimo ?? 0} kg
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#8C8574]">
                        Cobertura
                      </span>
                      <span
                        className={`text-sm font-bold mt-0.5 block ${
                          (crop.porcentaje_cobertura ?? 0) >= 100
                            ? 'text-[#557A38]'
                            : 'text-[#C44536]'
                        }`}
                      >
                        {crop.porcentaje_cobertura ?? 0}%
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#8C8574]">
                        Ítems
                      </span>
                      <span className="text-sm font-bold text-[#E29839] mt-0.5 block">
                        {crop.total_productos} lotes
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
            <h3 className="text-sm font-bold text-[#2A241E]">
              Stock Disponible vs Umbral Mínimo (kg)
            </h3>
            <p className="text-xs text-[#8C8574] mb-4">
              Comparación de inventario actual frente al requerimiento mínimo
            </p>
            <div className="h-64">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          <PrototypeBinaryProgressCard
            title="Estado de Umbral"
            subtitle="Productos en nivel normal vs crítico"
            items={doughnutItems}
            unit="lotes"
            kpiLabel="Cumplimiento de Stock"
            footerNote={
              totalBelow > 0
                ? `${totalBelow} producto(s) requieren reposición prioritaria`
                : 'Todo el inventario supera el umbral mínimo'
            }
          />
        </div>
      </div>
    );
  }

  // 11. Exportabilidad por Cultivo
  if (props.indicatorKey === 'exportabilidad-por-cultivo') {
    const rows = props.data.datos;
    const summary = props.data.resumen || {};
    const barData = {
      labels: rows.map((r) => r.tipo_cultivo),
      datasets: [
        {
          label: 'Kg Aptos Exportación',
          data: rows.map((r) => r.kg_aptos ?? 0),
          backgroundColor: '#557A38',
          borderRadius: 6,
          maxBarThickness: 38,
        },
        {
          label: 'Kg No Aptos / Merma',
          data: rows.map((r) => r.kg_no_aptos ?? 0),
          backgroundColor: '#E29839',
          borderRadius: 6,
          maxBarThickness: 38,
        },
      ],
    };

    const totalEligible =
      summary.kg_aptos ?? rows.reduce((s, r) => s + (r.kg_aptos || 0), 0);
    const totalAll =
      summary.total_kg_considerado ??
      rows.reduce((s, r) => s + (r.total_kg || 0), 0);
    const totalNotEligible = Math.max(
      Math.round((totalAll - totalEligible) * 100) / 100,
      0
    );

    const doughnutItems = [
      { label: 'Calidad Exportable', value: totalEligible, color: '#557A38' },
      { label: 'Mercado Local / Merma', value: totalNotEligible, color: '#E29839' },
    ];

    return (
      <div className="space-y-6">
        {/* Prototype Image 2 style Crop Exportability Cards */}
        {rows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {rows.map((crop) => {
              const vis = getCropVisual(crop.tipo_cultivo);
              const pct = crop.porcentaje_apto_exportacion ?? 0;
              const isAlert = pct < 75;
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
                          {vis.stage} · {crop.registros_considerados} clasificaciones
                        </span>
                      </div>
                    </div>

                    {isAlert && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#F8D7D2] text-[#C44536]">
                        ⚠️ Alerta
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-3 pt-3 border-t border-[#F0ECE1]">
                    <div>
                      <span className="block text-[11px] text-[#8C8574]">
                        Volumen Total
                      </span>
                      <span className="text-sm font-bold text-[#2A241E] mt-0.5 block">
                        {crop.total_kg ?? 0} kg
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#8C8574]">
                        Cultivos
                      </span>
                      <span className="text-sm font-bold text-[#2A241E] mt-0.5 block">
                        {crop.cantidad_cultivos ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#8C8574]">
                        Calidad Exp.
                      </span>
                      <span
                        className={`text-sm font-bold mt-0.5 block ${
                          isAlert ? 'text-[#C44536]' : 'text-[#557A38]'
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#8C8574]">
                        Kg Aptos
                      </span>
                      <span className="text-sm font-bold text-[#E29839] mt-0.5 block">
                        {crop.kg_aptos ?? 0} kg
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
            <h3 className="text-sm font-bold text-[#2A241E]">
              Volumen Exportable vs No Exportable por Cultivo (kg)
            </h3>
            <p className="text-xs text-[#8C8574] mb-4">
              Kilogramos aptos para exportación frente a descarte o mercado interno
            </p>
            <div className="h-64">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          <PrototypeBinaryProgressCard
            title="Calidad Exportable"
            subtitle="Balance de volumen apto vs merma"
            items={doughnutItems}
            unit="kg"
            kpiLabel="Promedio Global Exportable"
            overridePercentage={summary.porcentaje_apto_exportacion_global}
          />
        </div>
      </div>
    );
  }

  // 12. Tiempo de Resolución de Alertas
  if (props.indicatorKey === 'tiempo-resolucion-alertas') {
    const rows = props.data.datos;
    const summary = props.data.resumen || {};
    const barData = {
      labels: rows.map((r) => r.tipo_problema),
      datasets: [
        {
          label: 'Días Promedio Resolución',
          data: rows.map((r) => r.dias_promedio_resolucion ?? 0),
          backgroundColor: '#557A38',
          borderRadius: 6,
          maxBarThickness: 36,
        },
        {
          label: 'Antigüedad Prom. Pendientes (días)',
          data: rows.map((r) => r.antiguedad_promedio_pendientes_dias ?? 0),
          backgroundColor: '#C44536',
          borderRadius: 6,
          maxBarThickness: 36,
        },
      ],
    };

    const totalResolved = rows.reduce(
      (s, r) => s + (r.alertas_resueltas || 0),
      0
    );
    const totalPending = rows.reduce(
      (s, r) => s + (r.alertas_pendientes || 0),
      0
    );

    const doughnutItems = [
      { label: 'Alertas Resueltas', value: totalResolved, color: '#557A38' },
      { label: 'Alertas Pendientes', value: totalPending, color: '#C44536' },
    ];

    const allPendingCards: PendingAlertCard[] = [];
    rows.forEach((r) => {
      (r.pendientes || []).forEach((p) => {
        allPendingCards.push({
          ...p,
          problemType: r.tipo_problema,
        });
      });
    });

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
            <h3 className="text-sm font-bold text-[#2A241E]">
              Tiempo de Resolución vs Antigüedad de Pendientes (Días)
            </h3>
            <p className="text-xs text-[#8C8574] mb-4">
              Comparativa por tipo de problema fitosanitario
            </p>
            <div className="h-64">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          <PrototypeBinaryProgressCard
            title="Estado de Alertas"
            subtitle="Proporción de alertas atendidas vs activas"
            items={doughnutItems}
            unit="alertas"
            kpiLabel="Tasa de Resolución"
            footerNote={
              summary.dias_promedio_resolucion_global !== undefined
                ? `Tiempo promedio global de resolución: ${summary.dias_promedio_resolucion_global} días`
                : null
            }
          />
        </div>

        {/* Prototype Image 4 style Alert Cards for Pending Alerts */}
        {allPendingCards.length > 0 && (
          <div className="space-y-4">
            <div className="bg-white border border-[#F0C8C2] rounded-2xl p-4 flex items-start gap-3">
              <span className="material-icons-outlined text-[#C44536] text-xl mt-0.5">
                warning
              </span>
              <div>
                <h4 className="text-xs font-bold text-[#C44536]">
                  Intervención inmediata requerida ({allPendingCards.length}{' '}
                  alertas pendientes activas)
                </h4>
                <p className="text-xs text-[#C44536]/90 mt-0.5">
                  Las siguientes alertas fitosanitarias continúan pendientes de resolución ordenadas por días de antigüedad.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPendingCards.slice(0, 6).map((alert) => {
                const isCritical = (alert.dias_antiguedad ?? 0) >= 7;
                return (
                  <div
                    key={alert.id}
                    className="bg-white rounded-2xl border border-[#EAE5D9] p-5 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`px-3 py-0.5 rounded-full text-[11px] font-bold ${
                            isCritical
                              ? 'bg-[#F8D7D2] text-[#C44536]'
                              : 'bg-[#FDE8C8] text-[#B56B14]'
                          }`}
                        >
                          {isCritical ? 'Crítica' : 'Moderada'}
                        </span>
                        <span className="text-xs font-mono text-[#8C8574]">
                          {alert.id}
                        </span>
                      </div>

                      <h5 className="text-sm font-bold text-[#2A241E]">
                        {alert.problemType}
                      </h5>
                      <p className="text-xs text-[#6E6A5F] mt-1">
                        Alerta activa con{' '}
                        <strong className="text-[#C44536]">
                          {alert.dias_antiguedad ?? 0} días
                        </strong>{' '}
                        de antigüedad desde su detección.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#F0ECE1] text-xs">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-[#8C8574]">
                          PARCELA / CAMPO
                        </span>
                        <span className="font-bold text-[#2A241E]">
                          {alert.id_campo || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-[#8C8574]">
                          FECHA DETECCIÓN
                        </span>
                        <span className="font-bold text-[#2A241E]">
                          {String(alert.fecha_deteccion || '—').slice(0, 10)}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[10px] uppercase tracking-wider text-[#8C8574]">
                          CULTIVO AFECTADO
                        </span>
                        <span className="font-bold text-[#2A241E]">
                          {alert.id_cultivo || 'General'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default DynamicIndicatorCharts;
