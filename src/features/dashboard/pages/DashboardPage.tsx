import React from 'react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../../auth/context/AuthContext';
import { KpiCard } from '../../../shared/components/KpiCard';
import { ProductionChart } from '../components/ProductionChart';
import { formatRelativeDate } from '../../../shared/utils/formatDate';

export const DashboardPage: React.FC = () => {
  const { userName } = useAuth();
  const {
    totalProduction,
    averageYield,
    pendingAlertsCount,
    pendingAlerts,
    totalUsers,
    recentActivities,
    harvests,
    isLoading,
    errorMessage,
    resolveFieldName,
    loadData,
  } = useDashboard();

  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'RIEGO':
        return 'bg-blue-500';
      case 'PODA':
        return 'bg-emerald-500';
      case 'FUMIGACION':
        return 'bg-purple-500';
      case 'FERTILIZACION':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-emerald-800 to-green-700 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-emerald-950/15 relative overflow-hidden">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-2 text-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            Panel Operativo Central
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            ¡Hola, {userName || 'Operador'}!
          </h1>
          <p className="text-sm text-emerald-100 mt-1 max-w-xl leading-relaxed">
            Monitoreo en tiempo real de producción, fitosanidad y rendimientos agronómicos en
            Sociedad Agrícola Arona.
          </p>
        </div>

        <div className="relative z-10 flex gap-3">
          <Link
            to="/produccion"
            className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 font-bold text-sm shadow-md hover:bg-emerald-50 transition-all flex items-center gap-2 no-underline"
          >
            <span className="material-icons-outlined text-lg">add_circle</span>
            Registrar Cosecha
          </Link>
        </div>

        <span className="material-icons-outlined absolute -right-6 -bottom-8 text-white/10 text-9xl pointer-events-none select-none">
          eco
        </span>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="arona-card p-4 border-l-4 border-red-500 bg-red-50/70 flex items-center justify-between gap-4"
        >
          <p className="text-xs font-medium text-red-700">{errorMessage}</p>
          <button type="button" onClick={() => void loadData()} className="arona-btn-outline text-xs py-1.5 px-3">
            Reintentar
          </button>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-8 arona-card">
          <span className="material-icons-outlined text-4xl text-emerald-500 animate-spin">
            autorenew
          </span>
          <p className="text-xs text-gray-500 mt-2">Actualizando resumen operativo...</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KpiCard
          label="Producción Total"
          value={totalProduction}
          unit="t"
          subtitle="Cosecha acumulada activa"
          trendValue="+12.4%"
          trendUp={true}
          icon="bar_chart"
          iconBg="bg-emerald-100 text-emerald-700"
        />

        <KpiCard
          label="Rendimiento Promedio"
          value={averageYield}
          unit="tn/ha"
          subtitle="Eficiencia por hectárea"
          trendValue="+5.1%"
          trendUp={true}
          icon="trending_up"
          iconBg="bg-blue-100 text-blue-700"
        />

        <KpiCard
          label="Alertas Fitosanitarias"
          value={pendingAlertsCount}
          subtitle={
            pendingAlertsCount > 0 ? 'Requieren atención técnica' : 'Todos los lotes bajo control'
          }
          trendValue={pendingAlertsCount > 0 ? 'Atención' : 'Todo OK'}
          trendUp={pendingAlertsCount === 0}
          icon="warning_amber"
          iconBg={
            pendingAlertsCount > 0
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700'
          }
        />

        <KpiCard
          label="Usuarios en Plataforma"
          value={totalUsers}
          subtitle="Personal de campo activo"
          trendValue="Activos"
          trendUp={true}
          icon="groups"
          iconBg="bg-purple-100 text-purple-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 arona-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Distribución de Producción por Cultivo
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Volumen cosechado expresado en toneladas métricas (t)
              </p>
            </div>
            <Link
              to="/produccion"
              className="text-xs font-semibold text-[var(--color-arona-500)] hover:underline flex items-center gap-1"
            >
              Ver tabla completa
              <span className="material-icons-outlined text-sm">chevron_right</span>
            </Link>
          </div>
          <ProductionChart data={harvests} type="bar" />
        </div>

        <div className="arona-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Acceso Rápido</h2>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              Módulos principales del sistema
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1">
            <Link
              to="/produccion"
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer no-underline group"
            >
              <span className="material-icons-outlined text-3xl group-hover:scale-110 transition-transform">
                bar_chart
              </span>
              <span className="text-xs font-semibold">Producción</span>
            </Link>

            <Link
              to="/mis-campos"
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer no-underline group"
            >
              <span className="material-icons-outlined text-3xl group-hover:scale-110 transition-transform">
                landscape
              </span>
              <span className="text-xs font-semibold">Mis Campos</span>
            </Link>

            <Link
              to="/enfermedades"
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer no-underline group"
            >
              <span className="material-icons-outlined text-3xl group-hover:scale-110 transition-transform">
                bug_report
              </span>
              <span className="text-xs font-semibold">Enfermedades</span>
            </Link>

            <Link
              to="/calidad"
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer no-underline group"
            >
              <span className="material-icons-outlined text-3xl group-hover:scale-110 transition-transform">
                verified
              </span>
              <span className="text-xs font-semibold">Calidad</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="arona-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Últimas Labores</h2>
            <Link
              to="/actividades"
              className="text-xs font-semibold text-[var(--color-arona-500)] hover:underline"
            >
              Ver todas
            </Link>
          </div>

          <div className="space-y-4">
            {recentActivities.slice(0, 5).map((act) => {
              const id = act.id || act.idActividad;
              return (
                <div key={String(id)} className="flex items-start gap-3">
                  <div
                    className={`w-3 h-3 rounded-full mt-1 shrink-0 ${getActivityColor(
                      act.tipoActividad
                    )}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 leading-snug">
                      {act.tipoActividad} — {resolveFieldName(act.idCampo)}
                    </p>
                    {act.observaciones && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{act.observaciones}</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {formatRelativeDate(act.fecha)}
                    </p>
                  </div>
                </div>
              );
            })}

            {recentActivities.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                <span className="material-icons-outlined text-3xl mb-1">assignment</span>
                <p className="text-xs">No hay actividades recientes registradas.</p>
              </div>
            )}
          </div>
        </div>

        <div className="arona-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Alertas Sanitarias</h2>
            <Link
              to="/enfermedades"
              className="text-xs font-semibold text-[var(--color-arona-500)] hover:underline"
            >
              Gestionar
            </Link>
          </div>

          <div className="space-y-3">
            {pendingAlerts.slice(0, 4).map((alert) => {
              const id = alert.id || alert.idAlerta;
              const isPest = alert.tipoProblema === 'PLAGA';
              const isDisease = alert.tipoProblema === 'ENFERMEDAD';
              return (
                <div
                  key={String(id)}
                  className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                    isPest
                      ? 'bg-red-50/70 border-red-200'
                      : isDisease
                      ? 'bg-amber-50/70 border-amber-200'
                      : 'bg-yellow-50/70 border-yellow-200'
                  }`}
                >
                  <span
                    className={`material-icons-outlined mt-0.5 text-xl ${
                      isPest ? 'text-red-500' : isDisease ? 'text-amber-600' : 'text-yellow-600'
                    }`}
                  >
                    {isPest ? 'bug_report' : isDisease ? 'local_pharmacy' : 'warning_amber'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800">
                      {alert.campo?.nombre || resolveFieldName(alert.idCampo)} ·{' '}
                      {alert.tipoProblema}
                    </p>
                    <p className="text-xs text-gray-600 truncate mt-0.5">
                      {alert.descripcionProblema}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 font-medium">
                      📅 Detectado: {alert.fechaDeteccion}
                    </p>
                  </div>
                </div>
              );
            })}

            {pendingAlerts.length === 0 && (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <span className="material-icons-outlined text-emerald-600 text-2xl">
                  check_circle
                </span>
                <div>
                  <p className="text-xs font-bold text-emerald-900">Sin alertas pendientes</p>
                  <p className="text-xs text-emerald-700">
                    Todos los lotes se encuentran en óptimo estado fitosanitario.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-emerald-800 via-green-800 to-emerald-950 p-6 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Condiciones de Campo</h2>
              <span className="material-icons-outlined text-emerald-300">cloud</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
                <span className="material-icons-outlined text-3xl text-yellow-300">wb_sunny</span>
                <div>
                  <p className="text-2xl font-black">24°C</p>
                  <p className="text-[11px] text-emerald-200">Temperatura</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-xs">
                <span className="material-icons-outlined text-3xl text-blue-300">water_drop</span>
                <div>
                  <p className="text-2xl font-black">68%</p>
                  <p className="text-[11px] text-emerald-200">Humedad Rel.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/20 pt-4 mt-2">
            <p className="text-xs font-semibold text-emerald-100 flex items-center gap-1.5">
              <span className="material-icons-outlined text-sm">location_on</span>
              Estación Valle de Ica - Arona S.A.
            </p>
            <p className="text-xs text-emerald-200 mt-1">
              Radiación moderada · Viento 12 km/h SE
            </p>
            <div className="flex items-center gap-2 mt-3 p-2.5 rounded-xl bg-white/10">
              <span className="material-icons-outlined text-emerald-300 text-lg">eco</span>
              <p className="text-xs font-medium text-emerald-100">
                Rendimiento promedio general:{' '}
                <strong className="text-white">{averageYield} tn/ha</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
