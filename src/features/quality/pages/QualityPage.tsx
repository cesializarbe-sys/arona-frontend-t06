import React from 'react';
import { useQuality } from '../hooks/useQuality';
import { useQualityFilters, type DictumFilter } from '../hooks/useQualityFilters';
import { useQualityPageController } from '../hooks/useQualityPageController';
import { QualityModal } from '../components/QualityModal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';

export const QualityPage: React.FC = () => {
  const {
    reviews,
    harvests,
    users,
    isLoading,
    errorMessage,
    loadData,
    createReview,
    updateReview,
    deleteReview,
    restoreReview,
    approvedCount,
    rejectedCount,
    approvalRate,
    getHarvestDisplay,
    getSupervisorDisplay,
  } = useQuality();

  const {
    searchTerm,
    setSearchTerm,
    dictumFilter,
    setDictumFilter,
    filteredReviews,
    hasActiveFilters,
  } = useQualityFilters(reviews, getHarvestDisplay, getSupervisorDisplay);

  const {
    isModalOpen,
    setIsModalOpen,
    editingReview,
    setDeletingReview,
    isDeleteOpen,
    setIsDeleteOpen,
    handleOpenCreate,
    handleOpenEdit,
    handleSaveModal,
    handleConfirmDelete,
  } = useQualityPageController({ createReview, updateReview, deleteReview });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Control de Calidad e Inocuidad
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Auditorías de lote, parámetros organolépticos y estándares de exportación
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="arona-btn-primary shadow-lg shadow-emerald-700/20"
        >
          <span className="material-icons-outlined text-lg">verified</span>
          Nueva Inspección
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="arona-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <span className="material-icons-outlined text-xl">fact_check</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Total Muestreos</p>
            <p className="text-2xl font-bold text-gray-800">{reviews.length}</p>
          </div>
        </div>

        <div className="arona-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <span className="material-icons-outlined text-xl">check_circle</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Lotes Aprobados</p>
            <p className="text-2xl font-bold text-gray-800">{approvedCount}</p>
          </div>
        </div>

        <div className="arona-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
            <span className="material-icons-outlined text-xl">cancel</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Rechazos</p>
            <p className="text-2xl font-bold text-gray-800">{rejectedCount}</p>
          </div>
        </div>

        <div className="arona-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <span className="material-icons-outlined text-xl">percent</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Cumplimiento</p>
            <p className="text-2xl font-bold text-gray-800">{approvalRate}%</p>
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
            aria-label="Buscar revisiones por lote o supervisor"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por lote, supervisor..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <select
            aria-label="Filtrar revisiones por dictamen"
            value={dictumFilter}
            onChange={(e) => setDictumFilter(e.target.value as DictumFilter)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 cursor-pointer"
          >
            <option value="ALL">Todos los dictámenes</option>
            <option value="APROBADO">Solo Aprobados</option>
            <option value="RECHAZADO">Solo Rechazados</option>
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-16 arona-card">
          <span className="material-icons-outlined text-5xl text-emerald-400 animate-spin">
            autorenew
          </span>
          <p className="text-sm font-semibold text-gray-500 mt-4">Cargando revisiones de calidad…</p>
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
              <p className="text-sm font-bold text-red-900">Error al cargar revisiones de calidad</p>
              <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button type="button" onClick={() => void loadData()} className="arona-btn-outline text-xs py-2 px-4">
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && filteredReviews.length > 0 && (
        <div className="arona-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4"># Insp</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Lote Cosecha</th>
                  <th className="py-3.5 px-4">Supervisor</th>
                  <th className="py-3.5 px-4 text-center">Dictamen</th>
                  <th className="py-3.5 px-4">Observaciones</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReviews.map((rev) => {
                  const id = rev.id || rev.idRevision;
                  return (
                    <tr
                      key={String(id)}
                      className={`hover:bg-emerald-50/30 transition-colors ${
                        rev.estado === false ? 'opacity-60 bg-gray-50/50' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-gray-800">#{id}</td>
                      <td className="py-3.5 px-4 font-medium text-gray-600 whitespace-nowrap">
                        {rev.fecha}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-800">
                        {getHarvestDisplay(rev)}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{getSupervisorDisplay(rev)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`badge text-[10px] ${
                            rev.cumpleRequisitos ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {rev.cumpleRequisitos ? 'Aprobado' : 'Rechazado'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 max-w-xs truncate" title={rev.observaciones}>
                        {rev.observaciones || 'Sin observaciones'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`badge text-[10px] ${
                            rev.estado !== false ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {rev.estado !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(rev)}
                            aria-label={`Editar revisión #${id}`}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 border-none bg-transparent cursor-pointer"
                          >
                            <span className="material-icons-outlined text-base">edit</span>
                          </button>
                          {rev.estado !== false ? (
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingReview(rev);
                                setIsDeleteOpen(true);
                              }}
                              aria-label={`Eliminar revisión #${id}`}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 border-none bg-transparent cursor-pointer"
                            >
                              <span className="material-icons-outlined text-base">delete_outline</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void restoreReview(id)}
                              aria-label={`Restaurar revisión #${id}`}
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

      {!isLoading && !errorMessage && filteredReviews.length === 0 && !hasActiveFilters && (
        <div className="text-center py-16 arona-card">
          <span className="material-icons-outlined text-6xl text-gray-300">verified</span>
          <p className="text-base font-semibold text-gray-700 mt-4">
            No se encontraron revisiones de calidad
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Realice auditorías de empaque e inocuidad sobre las cosechas
          </p>
          <button type="button" onClick={handleOpenCreate} className="arona-btn-primary mt-4">
            Registrar Primer Dictamen
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && filteredReviews.length === 0 && hasActiveFilters && (
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
              setDictumFilter('ALL');
            }}
            className="px-4 py-2 mt-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 bg-white cursor-pointer"
          >
            Limpiar Filtros
          </button>
        </div>
      )}

      <QualityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveModal}
        initialData={editingReview}
        harvests={harvests}
        users={users}
        isLoading={isLoading}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        title="¿Eliminar Dictamen de Calidad?"
        message="Esta auditoría quedará archivada como inactiva. Podrá restaurarla si fue borrada por equivocación."
        confirmText="Eliminar"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};
