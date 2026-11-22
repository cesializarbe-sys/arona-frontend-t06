import React from 'react';
import { useActivities } from '../hooks/useActivities';
import { useActivityFilters } from '../hooks/useActivityFilters';
import { useActivitiesPageController } from '../hooks/useActivitiesPageController';
import { ActivityModal } from '../components/ActivityModal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { ACTIVITY_TYPES } from '../../../shared/constants/domain';

export const ActivitiesPage: React.FC = () => {
  const {
    activities,
    fields,
    crops,
    isLoading,
    errorMessage,
    loadData,
    createActivity,
    updateActivity,
    deleteActivity,
    restoreActivity,
    getIcon,
    getColor,
    getFieldName,
    getCropName,
    formatActivityDate,
  } = useActivities();

  const {
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    filteredActivities,
    hasActiveFilters,
  } = useActivityFilters(activities, getFieldName);

  const {
    isModalOpen,
    setIsModalOpen,
    editingActivity,
    deletingActivity,
    setDeletingActivity,
    isDeleteOpen,
    setIsDeleteOpen,
    handleOpenCreate,
    handleOpenEdit,
    handleSaveModal,
    handleConfirmDelete,
  } = useActivitiesPageController({ createActivity, updateActivity, deleteActivity });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Actividades y Labores de Campo
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Bitácora de riego, fertilización, poda y manejos fitotécnicos
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="arona-btn-primary shadow-lg shadow-emerald-700/20"
        >
          <span className="material-icons-outlined text-lg">add_circle</span>
          Nueva Actividad
        </button>
      </div>

      <div className="arona-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            search
          </span>
          <input
            type="text"
            aria-label="Buscar actividades por campo u observación"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por campo u observación..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <select
            aria-label="Filtrar actividades por tipo de labor"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 cursor-pointer"
          >
            <option value="">Todas las labores</option>
            {ACTIVITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-16 arona-card">
          <span className="material-icons-outlined text-5xl text-emerald-400 animate-spin">
            autorenew
          </span>
          <p className="text-sm font-semibold text-gray-500 mt-4">Cargando actividades…</p>
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
              <p className="text-sm font-bold text-red-900">Error al cargar actividades</p>
              <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button type="button" onClick={() => void loadData()} className="arona-btn-outline text-xs py-2 px-4">
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && filteredActivities.length > 0 && (
        <div className="arona-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Labor</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Campo</th>
                  <th className="py-3.5 px-4">Cultivo</th>
                  <th className="py-3.5 px-4">Observaciones</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredActivities.map((a) => {
                  const id = a.id || a.idActividad;
                  return (
                    <tr
                      key={String(id)}
                      className={`hover:bg-emerald-50/30 transition-colors ${
                        a.estado === false ? 'opacity-60 bg-gray-50/50' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${getColor(
                              a.tipoActividad
                            )}`}
                          >
                            <span className="material-icons-outlined text-base">
                              {getIcon(a.tipoActividad)}
                            </span>
                          </span>
                          <strong className="font-bold text-gray-800">{a.tipoActividad}</strong>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-600 whitespace-nowrap">
                        {formatActivityDate(a.fecha)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        {getFieldName(a.idCampo)}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{getCropName(a.idCultivo) || '—'}</td>
                      <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate" title={a.observaciones}>
                        {a.observaciones || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`badge text-[10px] ${
                            a.estado !== false ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {a.estado !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(a)}
                            aria-label={`Editar actividad ${a.tipoActividad}`}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 border-none bg-transparent cursor-pointer"
                          >
                            <span className="material-icons-outlined text-base">edit</span>
                          </button>
                          {a.estado !== false ? (
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingActivity(a);
                                setIsDeleteOpen(true);
                              }}
                              aria-label={`Eliminar actividad ${a.tipoActividad}`}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 border-none bg-transparent cursor-pointer"
                            >
                              <span className="material-icons-outlined text-base">delete_outline</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void restoreActivity(id)}
                              aria-label={`Restaurar actividad ${a.tipoActividad}`}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 border-none bg-transparent cursor-pointer"
                            >
                              <span className="material-icons-outlined text-base">restore_from_trash</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && !errorMessage && filteredActivities.length === 0 && !hasActiveFilters && (
        <div className="text-center py-16 arona-card">
          <span className="material-icons-outlined text-6xl text-gray-300">assignment</span>
          <p className="text-base font-semibold text-gray-700 mt-4">
            No hay actividades registradas aún
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Comience anotando las faenas de riego y fertilización
          </p>
          <button type="button" onClick={handleOpenCreate} className="arona-btn-primary mt-4">
            Registrar Primera Actividad
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && filteredActivities.length === 0 && hasActiveFilters && (
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
              setTypeFilter('');
            }}
            className="px-4 py-2 mt-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 bg-white cursor-pointer"
          >
            Limpiar Filtros
          </button>
        </div>
      )}

      <ActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveModal}
        initialData={editingActivity}
        fields={fields}
        crops={crops}
        isLoading={isLoading}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        title={`¿Eliminar Actividad "${deletingActivity?.tipoActividad || ''}"?`}
        message={`La labor "${deletingActivity?.tipoActividad || ''}" en ${getFieldName(
          deletingActivity?.idCampo
        )} se marcará como inactiva. Podrá restaurarla posteriormente.`}
        confirmText="Eliminar"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};
