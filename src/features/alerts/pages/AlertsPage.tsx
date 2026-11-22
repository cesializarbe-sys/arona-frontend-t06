import React from 'react';
import { useAlerts } from '../hooks/useAlerts';
import { useAlertFilters, type AttendedFilter } from '../hooks/useAlertFilters';
import { useAlertsPageController } from '../hooks/useAlertsPageController';
import { AlertModal } from '../components/AlertModal';
import { AttendAlertModal } from '../components/AttendAlertModal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { ALERT_PROBLEM_TYPES } from '../../../shared/constants/domain';

export const AlertsPage: React.FC = () => {
  const {
    alerts,
    fields,
    crops,
    users,
    isLoading,
    errorMessage,
    loadData,
    createAlert,
    updateAlert,
    deleteAlert,
    restoreAlert,
    attendAlert,
    pendingAlerts,
    getFieldName,
    getCropName,
    getIcon,
  } = useAlerts();

  const {
    searchTerm,
    setSearchTerm,
    problemTypeFilter,
    setProblemTypeFilter,
    attendedFilter,
    setAttendedFilter,
    filteredAlerts,
    hasActiveFilters,
  } = useAlertFilters(alerts, getFieldName, getCropName);

  const {
    isModalOpen,
    setIsModalOpen,
    editingAlert,
    attendTarget,
    isAttendOpen,
    setIsAttendOpen,
    setDeletingAlert,
    isDeleteOpen,
    setIsDeleteOpen,
    handleOpenCreate,
    handleOpenEdit,
    handleSaveModal,
    handleOpenAttend,
    handleConfirmAttend,
    handleConfirmDelete,
  } = useAlertsPageController({ createAlert, updateAlert, attendAlert, deleteAlert });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Control de Plagas y Enfermedades
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Monitoreo fitosanitario, alertas tempranas y aplicación de tratamientos
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="arona-btn-primary shadow-lg shadow-emerald-700/20"
        >
          <span className="material-icons-outlined text-lg">campaign</span>
          Reportar Alerta
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="arona-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <span className="material-icons-outlined text-xl">warning_amber</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Alertas Pendientes</p>
            <p className="text-2xl font-bold text-gray-800">{pendingAlerts.length}</p>
          </div>
        </div>

        <div className="arona-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <span className="material-icons-outlined text-xl">task_alt</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Casos Atendidos</p>
            <p className="text-2xl font-bold text-gray-800">
              {alerts.length - pendingAlerts.length}
            </p>
          </div>
        </div>

        <div className="arona-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <span className="material-icons-outlined text-xl">bug_report</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Total Reportes</p>
            <p className="text-2xl font-bold text-gray-800">{alerts.length}</p>
          </div>
        </div>
      </div>

      <div className="arona-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            search
          </span>
          <input
            type="text"
            aria-label="Buscar alertas por lote o síntoma"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por lote o síntoma..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select
            aria-label="Filtrar alertas por tipo de problema"
            value={problemTypeFilter}
            onChange={(e) => setProblemTypeFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 cursor-pointer"
          >
            <option value="">Todos los problemas</option>
            {ALERT_PROBLEM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar alertas por estado de atención"
            value={attendedFilter}
            onChange={(e) => setAttendedFilter(e.target.value as AttendedFilter)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 cursor-pointer"
          >
            <option value="ALL">Pendientes y Atendidas</option>
            <option value="PENDIENTE">Solo Pendientes</option>
            <option value="ATENDIDA">Solo Atendidas</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-16 arona-card">
          <span className="material-icons-outlined text-5xl text-emerald-400 animate-spin">
            autorenew
          </span>
          <p className="text-sm font-semibold text-gray-500 mt-4">Cargando alertas fitosanitarias…</p>
        </div>
      )}

      {!isLoading && errorMessage && (
        <div
          role="alert"
          className="arona-card p-6 border-l-4 border-red-500 bg-red-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <span className="material-icons-outlined text-red-600 text-2xl">error_outline</span>
            <div>
              <p className="text-sm font-bold text-red-900">Error al cargar alertas</p>
              <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button type="button" onClick={() => void loadData()} className="arona-btn-outline text-xs py-2 px-4">
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && filteredAlerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlerts.map((a) => {
            const id = a.id || a.idAlerta;
            const isAttended = a.atendida === true || Boolean(a.solucionAplicada);
            return (
              <div
                key={String(id)}
                className={`arona-card p-5 hover:shadow-lg transition-all duration-200 flex flex-col justify-between ${
                  !isAttended ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-emerald-500'
                } ${a.estado === false ? 'opacity-60 bg-gray-50/50' : ''}`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl" aria-hidden="true">
                        {getIcon(a.tipoProblema)}
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-gray-800 leading-tight">
                          {a.campo?.nombre || getFieldName(a.idCampo)}
                        </h3>
                        <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                          {a.cultivo?.nombre || getCropName(a.idCultivo) || 'Todo el lote'}
                        </p>
                      </div>
                    </div>

                    <span className={`badge text-[10px] ${isAttended ? 'badge-success' : 'badge-warning'}`}>
                      {isAttended ? 'Atendida' : 'Pendiente'}
                    </span>
                  </div>

                  <div className="space-y-1 py-2 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <span className="material-icons-outlined text-sm">calendar_today</span>
                      <span>Detección: {a.fechaDeteccion}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <span className="material-icons-outlined text-sm">category</span>
                      <span className="font-semibold text-gray-700">{a.tipoProblema}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-700 mt-2">
                    <strong className="block text-[11px] text-gray-500 uppercase font-semibold mb-0.5">
                      Problema:
                    </strong>
                    <p className="line-clamp-2 leading-relaxed">{a.descripcionProblema}</p>
                  </div>

                  {a.solucionAplicada && (
                    <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-900 mt-2">
                      <strong className="block text-[11px] text-emerald-700 uppercase font-semibold mb-0.5">
                        Tratamiento Aplicado:
                      </strong>
                      <p className="line-clamp-2 leading-relaxed">{a.solucionAplicada}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 mt-3 border-t border-gray-100">
                  {!isAttended ? (
                    <button
                      type="button"
                      onClick={() => handleOpenAttend(a)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border-none cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <span className="material-icons-outlined text-sm">healing</span>
                      Atender
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <span className="material-icons-outlined text-sm">check_circle</span>
                      Resuelto
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(a)}
                      aria-label={`Editar alerta #${id}`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all border-none bg-transparent cursor-pointer"
                    >
                      <span className="material-icons-outlined text-base">edit</span>
                    </button>
                    {a.estado !== false ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingAlert(a);
                          setIsDeleteOpen(true);
                        }}
                        aria-label={`Eliminar alerta #${id}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all border-none bg-transparent cursor-pointer"
                      >
                        <span className="material-icons-outlined text-base">delete_outline</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void restoreAlert(id)}
                        aria-label={`Restaurar alerta #${id}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all border-none bg-transparent cursor-pointer"
                      >
                        <span className="material-icons-outlined text-base">restore_from_trash</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !errorMessage && filteredAlerts.length === 0 && !hasActiveFilters && (
        <div className="text-center py-16 arona-card">
          <span className="material-icons-outlined text-6xl text-gray-300">health_and_safety</span>
          <p className="text-base font-semibold text-gray-700 mt-4">
            No se encontraron alertas fitosanitarias
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Los campos evaluados se encuentran saludables
          </p>
          <button type="button" onClick={handleOpenCreate} className="arona-btn-primary mt-4">
            Reportar Nueva Incidencia
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && filteredAlerts.length === 0 && hasActiveFilters && (
        <div className="text-center py-16 arona-card">
          <span className="material-icons-outlined text-6xl text-gray-300">search_off</span>
          <p className="text-base font-semibold text-gray-700 mt-4">
            No se encontraron coincidencias
          </p>
          <p className="text-xs text-gray-400 mt-1">Ajuste los filtros o el término de búsqueda</p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setProblemTypeFilter('');
              setAttendedFilter('ALL');
            }}
            className="px-4 py-2 mt-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 bg-white cursor-pointer"
          >
            Limpiar Filtros
          </button>
        </div>
      )}

      <AlertModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveModal}
        initialData={editingAlert}
        fields={fields}
        crops={crops}
        users={users}
        isLoading={isLoading}
      />

      <AttendAlertModal
        isOpen={isAttendOpen}
        onClose={() => setIsAttendOpen(false)}
        onSubmit={handleConfirmAttend}
        alert={attendTarget}
        fieldName={attendTarget ? getFieldName(attendTarget.idCampo) : ''}
        isLoading={isLoading}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        title="¿Eliminar Alerta Fitosanitaria?"
        message="Esta alerta se marcará como inactiva. Podrá restaurarla si fue dada de baja por error."
        confirmText="Eliminar"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};
