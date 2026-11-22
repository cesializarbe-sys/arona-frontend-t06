import React, { useState } from 'react';
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
import { Bar } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import { KpiCard } from '../../../shared/components/KpiCard';
import { AnalyticsErrorState } from '../components/AnalyticsErrorState';
import { AnalyticsSubNav } from '../components/AnalyticsSubNav';
import {
  PrototypeBinaryProgressCard,
  PrototypeDoughnutCard,
  getCropVisual,
} from '../components/DynamicIndicatorCharts';
import { useAnalyticsDashboard } from '../hooks/useAnalyticsDashboard';
import { useAnalyticsCharts } from '../hooks/useAnalyticsCharts';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const baseBarOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
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
      ticks: { color: '#7D7769', font: { family: 'Inter, sans-serif', size: 11 } },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(140, 133, 116, 0.12)' },
      ticks: {
        color: '#7D7769',
        precision: 0,
        font: { family: 'Inter, sans-serif', size: 11 },
      },
    },
  },
};

export function AnalyticsDashboardPage() {
  const {
    dashboard,
    cropHealth,
    phytosanitaryRisk,
    operationalActivity,
    isLoading,
    errorMessage,
    isServiceUnavailable,
    retryAfter,
    reload,
  } = useAnalyticsDashboard();

  const [activeSection, setActiveSection] = useState('all');

  const mongo = dashboard?.mongoDB || {};
  const sql = dashboard?.sqlServer || {};

  const {
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
  } = useAnalyticsCharts(cropHealth, phytosanitaryRisk, operationalActivity);

  const sectionTabs = [
    { id: 'all', label: 'Vista Completa (4 Endpoints)' },
    { id: 'dashboard', label: '1. Dashboard (/api/dashboard)' },
    { id: 'cultivos', label: '2. Cultivos (/api/analytics/salud-cultivos)' },
    {
      id: 'labores',
      label: '3. Labores de Campo (/api/analytics/actividad-operacional)',
    },
    {
      id: 'alertas',
      label: '4. Alertas Fitosanitarias (/api/analytics/riesgo-fitosanitario)',
    },
  ];

  const showDashboard = activeSection === 'all' || activeSection === 'dashboard';
  const showCultivos = activeSection === 'all' || activeSection === 'cultivos';
  const showLabores = activeSection === 'all' || activeSection === 'labores';
  const showAlertas = activeSection === 'all' || activeSection === 'alertas';

  return (
    <div className="space-y-6 animate-fade-in pb-12 bg-[#FAF8F3] -m-4 sm:-m-6 p-4 sm:p-6 min-h-screen">
      {/* Top Sub-Navigation */}
      <AnalyticsSubNav />

      {/* Prototype Section Selector + Action Bar */}
      <div className="bg-white rounded-2xl border border-[#EAE5D9] px-6 pt-4 pb-0 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div
          className="flex flex-wrap items-center gap-5"
          role="tablist"
          aria-label="Secciones de endpoints del dashboard analítico"
        >
          {sectionTabs.map((tab) => {
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveSection(tab.id)}
                className={`pb-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer bg-transparent ${
                  active
                    ? 'border-[#557A38] text-[#3B5924]'
                    : 'border-transparent text-[#8C8574] hover:text-[#2A241E]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5 pb-3">
          <Link
            to="/analitica/indicadores"
            aria-label="Ir a los 12 indicadores analíticos"
            className="px-3.5 py-2 rounded-xl border border-[#EAE5D9] bg-[#FAF8F3] hover:bg-[#EFECE4] text-xs font-bold text-[#3B5924] no-underline flex items-center gap-1.5 transition-colors"
          >
            <span className="material-icons-outlined text-base">tune</span>
            Ir a 12 Indicadores
          </Link>

          <button
            type="button"
            onClick={reload}
            disabled={isLoading}
            aria-label="Actualizar datos del dashboard analítico"
            className="px-4 py-2 rounded-xl bg-[#557A38] hover:bg-[#46662D] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border-none disabled:opacity-60"
          >
            <span
              className={`material-icons-outlined text-base ${
                isLoading ? 'animate-spin' : ''
              }`}
            >
              refresh
            </span>
            Actualizar
          </button>
        </div>
      </div>

      {/* Global / Partial Error Banner */}
      <AnalyticsErrorState
        isServiceUnavailable={isServiceUnavailable}
        errorMessage={errorMessage}
        retryAfter={retryAfter}
        onRetry={reload}
      />

      {/* Loading Skeletons */}
      {isLoading &&
        !dashboard &&
        !cropHealth &&
        !phytosanitaryRisk &&
        !operationalActivity && (
          <div
            className="space-y-6"
            aria-busy="true"
            aria-label="Cargando datos analíticos"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-2xl border border-[#EAE5D9] p-6 h-32 animate-pulse"
                />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5D9] p-6 h-80 animate-pulse" />
              <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 h-80 animate-pulse" />
            </div>
          </div>
        )}

      {/* =====================================================================
          SECCIÓN 1: DASHBOARD GENERAL (GET /api/dashboard) — Prototype Image 1
         ===================================================================== */}
      {showDashboard && (
        <section className="space-y-6" aria-label="Dashboard General">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-[#2A241E]">
                Dashboard General
              </h2>
              <p className="text-xs text-[#8C8574]">
                Campaña 2026 · Agrícola Arona S.A. · Consolidado MongoDB y SQL Server
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-white border border-[#EAE5D9] text-[#557A38]">
              GET /api/dashboard
            </span>
          </div>

          {/* Prototype Image 1 Top 4 Executive Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
              <span className="block text-xs font-medium text-[#8C8574]">
                Cosechas Registradas
              </span>
              <span className="text-3xl font-black text-[#557A38] mt-2 block tracking-tight">
                {sql.totalCosechas ?? 0} Lotes
              </span>
              <span className="block text-xs text-[#8C8574] mt-2">
                {mongo.totalCampos ?? 0} campos · {mongo.totalCultivos ?? 0} cultivos activos
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
              <span className="block text-xs font-medium text-[#8C8574]">
                Salud de Cultivos
              </span>
              <span className="text-3xl font-black text-[#557A38] mt-2 block tracking-tight">
                {cropHealth?.porcentaje_saludables ?? 0}%
              </span>
              <span className="block text-xs text-[#8C8574] mt-2">
                {mongo.totalActividades ?? 0} labores de campo registradas
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
              <span className="block text-xs font-medium text-[#8C8574]">
                Alertas Fitosanitarias
              </span>
              <span className="text-3xl font-black text-[#C44536] mt-2 block tracking-tight">
                {mongo.alertasPendientes ?? phytosanitaryRisk?.alertas_pendientes ?? 0}{' '}
                críticas
              </span>
              <span className="block text-xs text-[#8C8574] mt-2">
                requieren atención inmediata
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
              <span className="block text-xs font-medium text-[#8C8574]">
                Clasificaciones & Stock
              </span>
              <span className="text-3xl font-black text-[#E29839] mt-2 block tracking-tight">
                {sql.totalClasificaciones ?? 0}
              </span>
              <span className="block text-xs text-[#8C8574] mt-2">
                {sql.totalProductos ?? 0} productos ({sql.productosBajoUmbral ?? 0}{' '}
                bajo umbral)
              </span>
            </div>
          </div>

          {/* Prototype Image 1 Side-by-Side Bar Chart + Doughnut Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#2A241E]">
                    Labores Ejecutadas por Tipo de Actividad
                  </h3>
                  <p className="text-xs text-[#8C8574]">
                    Distribución de intensidad operativa en los campos activos
                  </p>
                </div>
              </div>
              <div className="h-64">
                {activityTypeKeys.length > 0 ? (
                  <Bar data={activityChartData} options={baseBarOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-[#8C8574]">
                    Sin datos de actividades para graficar
                  </div>
                )}
              </div>
            </div>

            <PrototypeDoughnutCard
              title="Estado Sanitario de Cultivos"
              subtitle="Distribución de salud agronómica"
              items={healthDoughnutItems}
            />
          </div>

          {/* Detailed MongoDB & SQL Server KPI Cards */}
          {dashboard && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-[#EAE5D9] p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C574B] flex items-center gap-2">
                  <span className="material-icons-outlined text-base text-[#557A38]">
                    storage
                  </span>
                  Entidades Maestras en MongoDB
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <KpiCard
                    label="Campos"
                    value={mongo.totalCampos ?? 0}
                    subtitle="Parcelas activas"
                    icon="landscape"
                    iconBg="bg-[#EEF5E6] text-[#557A38]"
                  />
                  <KpiCard
                    label="Cultivos"
                    value={mongo.totalCultivos ?? 0}
                    subtitle="Sembrados"
                    icon="local_florist"
                    iconBg="bg-[#EEF5E6] text-[#557A38]"
                  />
                  <KpiCard
                    label="Usuarios"
                    value={mongo.totalUsuarios ?? 0}
                    subtitle="Personal activo"
                    icon="groups"
                    iconBg="bg-[#EEF5E6] text-[#557A38]"
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#EAE5D9] p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#5C574B] flex items-center gap-2">
                  <span className="material-icons-outlined text-base text-[#E29839]">
                    dns
                  </span>
                  Entidades Transaccionales en SQL Server
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <KpiCard
                    label="Cosechas"
                    value={sql.totalCosechas ?? 0}
                    subtitle="Lotes cosechados"
                    icon="agriculture"
                    iconBg="bg-[#FEF3E2] text-[#E29839]"
                  />
                  <KpiCard
                    label="Productos"
                    value={sql.totalProductos ?? 0}
                    subtitle="En inventario"
                    icon="inventory_2"
                    iconBg="bg-[#FEF3E2] text-[#E29839]"
                  />
                  <KpiCard
                    label="Bajo Umbral"
                    value={sql.productosBajoUmbral ?? 0}
                    subtitle="Stock crítico"
                    icon="production_quantity_limits"
                    iconBg="bg-[#F8D7D2] text-[#C44536]"
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* =====================================================================
          SECCIÓN 2: SALUD DE CULTIVOS (GET /api/analytics/salud-cultivos) — Prototype Image 2
         ===================================================================== */}
      {showCultivos && (
        <section
          className="space-y-6 pt-4 border-t border-[#EAE5D9]"
          aria-label="Salud de Cultivos"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-[#2A241E]">
                {cropHealth?.servicio || 'Cultivos y Estado Sanitario'}
              </h2>
              <p className="text-xs text-[#8C8574]">
                {cropHealth?.total_cultivos ?? 0} cultivos activos ·{' '}
                {cropHealth?.porcentaje_saludables ?? 0}% saludables ·{' '}
                {cropHealth?.alerta_decision || ''}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-white border border-[#EAE5D9] text-[#557A38]">
              GET /api/analytics/salud-cultivos
            </span>
          </div>

          {/* Prototype Image 2 Crop Cards */}
          {cropsByTypeCards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {cropsByTypeCards.map((crop) => {
                const vis = getCropVisual(crop.cropType);
                const healthPct =
                  crop.total > 0
                    ? Math.round((crop.healthy / crop.total) * 100)
                    : 0;
                const hasRisk = crop.atRisk > 0;

                return (
                  <div
                    key={crop.cropType}
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
                          <h3 className="text-base font-bold text-[#2A241E]">
                            {crop.cropType}
                          </h3>
                          <span className="text-xs text-[#8C8574]">
                            {vis.stage}
                          </span>
                        </div>
                      </div>

                      {hasRisk ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#F8D7D2] text-[#C44536]">
                          ⚠️ Alerta ({crop.atRisk})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#E3F5E8] text-[#2F7A47]">
                          ✓ Saludable
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-3 pt-3 border-t border-[#F0ECE1]">
                      <div>
                        <span className="block text-[11px] text-[#8C8574]">
                          Cultivos
                        </span>
                        <span className="text-sm font-bold text-[#2A241E] mt-0.5 block">
                          {crop.total}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-[#8C8574]">
                          Saludables
                        </span>
                        <span className="text-sm font-bold text-[#2A241E] mt-0.5 block">
                          {crop.healthy}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-[#8C8574]">
                          Calidad / Salud
                        </span>
                        <span
                          className={`text-sm font-bold mt-0.5 block ${
                            hasRisk ? 'text-[#C44536]' : 'text-[#557A38]'
                          }`}
                        >
                          {healthPct}%
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-[#8C8574]">
                          En Riesgo
                        </span>
                        <span className="text-sm font-bold text-[#E29839] mt-0.5 block">
                          {crop.atRisk} lotes
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Charts + At-Risk Table for Salud de Cultivos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className=" bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
              <h3 className="text-sm font-bold text-[#2A241E]">
                Cultivos por Estado Sanitario
              </h3>
              <p className="text-xs text-[#8C8574] mb-4">
                Conteo de lotes según diagnóstico agronómico
              </p>
              <div className="h-56">
                {healthStatusKeys.length > 0 ? (
                  <Bar data={healthChartData} options={baseBarOptions} />
                ) : (
                  <p className="text-xs text-[#8C8574] py-12 text-center">
                    Sin datos de estados sanitarios
                  </p>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5D9] overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-[#EAE5D9] bg-[#FAF8F3] flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A463B]">
                  Cultivos en Riesgo o con Problemas (
                  {cropHealth?.cultivos_en_riesgo_o_con_problemas?.length ?? 0})
                </h3>
                <span className="text-xs font-semibold text-[#C44536]">
                  {cropHealth?.alerta_decision}
                </span>
              </div>

              {(cropHealth?.cultivos_en_riesgo_o_con_problemas?.length ?? 0) > 0 ? (
                <div className="overflow-x-auto max-h-72 custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F4EC] text-[#8C8574] uppercase text-[11px] border-b border-[#EAE5D9]">
                      <tr>
                        <th className="py-3 px-5">ID</th>
                        <th className="py-3 px-5">Cultivo</th>
                        <th className="py-3 px-5">Tipo</th>
                        <th className="py-3 px-5">Parcela</th>
                        <th className="py-3 px-5">Observaciones</th>
                        <th className="py-3 px-5">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0ECE1]">
                      {(cropHealth?.cultivos_en_riesgo_o_con_problemas ?? []).map(
                        (c, idx) => (
                          <tr
                            key={c.id || idx}
                            className="hover:bg-[#FAF8F3] transition-colors"
                          >
                            <td className="py-3 px-5 font-mono text-[#8C8574]">
                              {c.id}
                            </td>
                            <td className="py-3 px-5 font-bold text-[#2A241E]">
                              {c.nombre || c.id}
                            </td>
                            <td className="py-3 px-5 text-[#5C574B]">
                              {c.tipo_cultivo}
                            </td>
                            <td className="py-3 px-5 font-semibold text-[#2A241E]">
                              {c.campo_id || '—'}
                            </td>
                            <td className="py-3 px-5 text-[#6E6A5F] max-w-xs truncate">
                              {c.observaciones || '—'}
                            </td>
                            <td className="py-3 px-5">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FDE4E1] text-[#C44536]">
                                {c.estado_salud}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-10 text-center text-xs text-[#8C8574]">
                  Todos los cultivos registrados se encuentran en estado saludable.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          SECCIÓN 3: LABORES DE CAMPO (GET /api/analytics/actividad-operacional) — Prototype Image 3
         ===================================================================== */}
      {showLabores && (
        <section
          className="space-y-6 pt-4 border-t border-[#EAE5D9]"
          aria-label="Labores de Campo"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-[#2A241E]">
                {operationalActivity?.servicio || 'Labores de Campo'}
              </h2>
              <p className="text-xs text-[#8C8574]">
                {operationalActivity?.descripcion ||
                  'Intensidad operativa por parcela y tipo de labor'}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-white border border-[#EAE5D9] text-[#557A38]">
              GET /api/analytics/actividad-operacional
            </span>
          </div>

          {/* Prototype Image 3 Top 3 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
              <span className="block text-xs font-medium text-[#8C8574]">
                Total Labores Ejecutadas
              </span>
              <span className="text-3xl font-black text-[#557A38] mt-2 block">
                {operationalActivity?.total_actividades_registradas ?? 0}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
              <span className="block text-xs font-medium text-[#8C8574]">
                Labor Más Frecuente
              </span>
              <span className="text-3xl font-black text-[#2A241E] mt-2 block">
                {operationalActivity?.tipo_actividad_mas_frecuente || 'N/A'}
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
              <span className="block text-xs font-medium text-[#8C8574]">
                Parcelas Sin Actividad Reciente
              </span>
              <span className="text-3xl font-black text-[#2A241E] mt-2 block">
                {operationalActivity?.campos_sin_actividad_reciente?.length ?? 0}
              </span>
            </div>
          </div>

          {/* Charts: Bar + Doughnut for Operational Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
              <h3 className="text-sm font-bold text-[#2A241E]">
                Distribución por Tipo de Labor Agronómica
              </h3>
              <p className="text-xs text-[#8C8574] mb-4">
                {operationalActivity?.recomendacion}
              </p>
              <div className="h-60">
                {activityTypeKeys.length > 0 ? (
                  <Bar data={activityChartData} options={baseBarOptions} />
                ) : (
                  <p className="text-xs text-[#8C8574] py-12 text-center">
                    Sin actividades registradas
                  </p>
                )}
              </div>
            </div>

            <PrototypeDoughnutCard
              title="Estado de Labores por Tipo"
              subtitle="Participación porcentual por actividad"
              items={activityDoughnutItems}
            />
          </div>

          {/* Prototype Image 3 Table with Progress Bars & Status Pills */}
          <div className="bg-white rounded-2xl border border-[#EAE5D9] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F4EC] text-[#8C8574] uppercase text-[11px] border-b border-[#EAE5D9]">
                  <tr>
                    <th className="py-3.5 px-5">#</th>
                    <th className="py-3.5 px-5">PARCELA / CAMPO</th>
                    <th className="py-3.5 px-5">DESGLOSE DE LABORES</th>
                    <th className="py-3.5 px-5">TOTAL LABORES</th>
                    <th className="py-3.5 px-5">INTENSIDAD OPERATIVA</th>
                    <th className="py-3.5 px-5">ESTADO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0ECE1]">
                  {(operationalActivity?.ranking_campos_mas_activos || []).map(
                    (item, idx) => {
                      const pct = Math.round(
                        ((item.total_actividades || 0) / maxFieldActivity) * 100
                      );
                      const barColor =
                        pct >= 70
                          ? 'bg-[#557A38]'
                          : pct >= 40
                          ? 'bg-[#E29839]'
                          : 'bg-[#C44536]';
                      const statusLabel =
                        pct >= 70
                          ? 'Alta Actividad'
                          : pct >= 40
                          ? 'En Progreso'
                          : 'Baja Carga';
                      const statusClass =
                        pct >= 70
                          ? 'bg-[#E3F5E8] text-[#2F7A47]'
                          : pct >= 40
                          ? 'bg-[#FEF6D8] text-[#B5811C]'
                          : 'bg-[#FDE4E1] text-[#C44536]';

                      return (
                        <tr
                          key={item.campo || idx}
                          className="hover:bg-[#FAF8F3] transition-colors"
                        >
                          <td className="py-3.5 px-5 font-mono text-[#8C8574]">
                            T-00{idx + 1}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-[#2A241E]">
                            {item.campo}
                          </td>
                          <td className="py-3.5 px-5 text-[#6E6A5F]">
                            {Object.entries(item.tipos || {})
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' · ') || '—'}
                          </td>
                          <td className="py-3.5 px-5 font-bold text-[#2A241E]">
                            {item.total_actividades} labores
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3 min-w-[140px]">
                              <div className="flex-1 h-2 rounded-full bg-[#EFECE4] overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${barColor}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-[#6E6A5F] w-10 text-right">
                                {pct}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold ${statusClass}`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          SECCIÓN 4: ALERTAS FITOSANITARIAS (GET /api/analytics/riesgo-fitosanitario) — Prototype Image 4
         ===================================================================== */}
      {showAlertas && (
        <section
          className="space-y-6 pt-4 border-t border-[#EAE5D9]"
          aria-label="Alertas Fitosanitarias"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-[#2A241E]">
                    {phytosanitaryRisk?.servicio || 'Alertas Fitosanitarias'}
                  </h2>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F8D7D2] text-[#C44536]">
                    {phytosanitaryRisk?.alertas_pendientes ?? 0} críticas activas
                  </span>
                </div>
                <p className="text-xs text-[#8C8574] mt-0.5">
                  Monitoreo agronómico · Tiempo real ·{' '}
                  {phytosanitaryRisk?.total_alertas ?? 0} alertas registradas
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-white border border-[#EAE5D9] text-[#557A38]">
              GET /api/analytics/riesgo-fitosanitario
            </span>
          </div>

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
                {phytosanitaryRisk?.recomendacion ||
                  'Priorizar atención en campos con mayor número de alertas PENDIENTE.'}
              </p>
            </div>
          </div>

          {/* Charts: Bar + Doughnut for Phytosanitary Risk */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE5D9] p-6 shadow-xs">
              <h3 className="text-sm font-bold text-[#2A241E]">
                Incidencia por Tipo de Problema Fitosanitario
              </h3>
              <p className="text-xs text-[#8C8574] mb-4">
                Comparativa entre alertas pendientes y atendidas
              </p>
              <div className="h-60">
                {riskTypeKeys.length > 0 ? (
                  <Bar
                    data={riskChartData}
                    options={{
                      ...baseBarOptions,
                      plugins: {
                        ...baseBarOptions.plugins,
                        legend: {
                          display: true,
                          position: 'top',
                          labels: { boxWidth: 12, font: { size: 11 } },
                        },
                      },
                    }}
                  />
                ) : (
                  <p className="text-xs text-[#8C8574] py-12 text-center">
                    Sin alertas registradas
                  </p>
                )}
              </div>
            </div>

            <PrototypeBinaryProgressCard
              title="Resolución Sanitaria"
              subtitle="Estado global de alertas fitosanitarias"
              items={riskDoughnutItems}
              unit="alertas"
              kpiLabel="Tasa de Atención Sanitaria"
            />
          </div>

          {/* Prototype Image 4 3-Column Critical Alert Cards */}
          {(phytosanitaryRisk?.alertas_criticas_pendientes?.length ?? 0) > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(phytosanitaryRisk?.alertas_criticas_pendientes ?? []).map((alert) => {
                const isPlaga =
                  String(alert.tipo_problema).toUpperCase() === 'PLAGA';
                return (
                  <div
                    key={alert.id}
                    className="bg-white rounded-2xl border border-[#EAE5D9] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`px-3 py-0.5 rounded-full text-[11px] font-bold ${
                            isPlaga
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
                      <p className="text-xs text-[#6E6A5F] mt-1 leading-relaxed">
                        {alert.descripcion ||
                          'Alerta fitosanitaria detectada en monitoreo de campo.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#F0ECE1] text-xs">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-[#8C8574]">
                          PARCELA
                        </span>
                        <span className="font-bold text-[#2A241E]">
                          {alert.campo}
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
          )}

          {/* Top Risky Fields Table */}
          {(phytosanitaryRisk?.campos_con_mayor_riesgo?.length ?? 0) > 0 && (
            <div className="bg-white rounded-2xl border border-[#EAE5D9] overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-[#EAE5D9] bg-[#FAF8F3]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A463B]">
                  Ranking de Parcelas con Mayor Riesgo Fitosanitario
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F7F4EC] text-[#8C8574] uppercase text-[11px] border-b border-[#EAE5D9]">
                    <tr>
                      <th className="py-3 px-5">PARCELA / CAMPO</th>
                      <th className="py-3 px-5">ALERTAS PENDIENTES</th>
                      <th className="py-3 px-5">TOTAL ALERTAS</th>
                      <th className="py-3 px-5">NIVEL DE RIESGO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE1]">
                    {(phytosanitaryRisk?.campos_con_mayor_riesgo ?? []).map(
                      (item, idx) => (
                        <tr
                          key={item.campo || idx}
                          className="hover:bg-[#FAF8F3]"
                        >
                          <td className="py-3 px-5 font-bold text-[#2A241E]">
                            {item.campo}
                          </td>
                          <td className="py-3 px-5 font-bold text-[#C44536]">
                            {item.pendientes} pendientes
                          </td>
                          <td className="py-3 px-5 text-[#6E6A5F]">
                            {item.total_alertas}
                          </td>
                          <td className="py-3 px-5">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-[#F8D7D2] text-[#C44536]">
                              Prioridad Alta
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default AnalyticsDashboardPage;
