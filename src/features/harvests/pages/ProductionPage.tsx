import React from 'react';
import { useHarvests } from '../hooks/useHarvests';
import { useHarvestFilters } from '../hooks/useHarvestFilters';
import { useHarvestsPageController } from '../hooks/useHarvestsPageController';
import { HarvestModal } from '../components/HarvestModal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { ProductionChart } from '../../dashboard/components/ProductionChart';
import { kgToTonDisplay } from '../../../shared/utils/productionUtils';

export const ProductionPage: React.FC = () => {
  const {
    harvests,
    fields,
    crops,
    isLoading,
    errorMessage,
    loadData,
    createHarvest,
    updateHarvest,
    deleteHarvest,
    restoreHarvest,
    totalTons,
    activeHarvestsCount,
    getFieldName,
    getCropName,
    getUserName,
  } = useHarvests();

  const {
    searchTerm,
    setSearchTerm,
    fieldFilter,
    setFieldFilter,
    cropFilter,
    setCropFilter,
    filteredHarvests,
    hasActiveFilters,
    clearFilters,
  } = useHarvestFilters({ harvests, getFieldName, getCropName });

  const {
    isModalOpen,
    editingHarvest,
    deletingHarvest,
    isDeleteOpen,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseModal,
    handleSaveModal,
    handleRequestDelete,
    handleCancelDelete,
    handleConfirmDelete,
  } = useHarvestsPageController({ createHarvest, updateHarvest, deleteHarvest });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Control de Producción y Cosechas
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Registro cuantitativo de pesaje y rendimiento agrícola
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="arona-btn-primary shadow-lg shadow-emerald-700/20"
        >
          <span className="material-icons-outlined text-lg">add_circle</span>
          Registrar Cosecha
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="arona-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[var(--color-arona-600)] flex items-center justify-center">
            <span className="material-icons-outlined text-xl">scale</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Total Cosechado</p>
            <p className="text-2xl font-bold text-gray-800">
              {totalTons} <span className="text-sm font-medium text-gray-500">t</span>
            </p>
          </div>
        </div>

        <div className="arona-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <span className="material-icons-outlined text-xl">fact_check</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Registros Activos</p>
            <p className="text-2xl font-bold text-gray-800">{activeHarvestsCount}</p>
          </div>
        </div>

        <div className="arona-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <span className="material-icons-outlined text-xl">local_shipping</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Cosechas Totales</p>
            <p className="text-2xl font-bold text-gray-800">{harvests.length}</p>
          </div>
        </div>
      </div>

      <div className="arona-card p-6">
        <h2 className="text-base font-bold text-gray-800 mb-1">
          Distribución Cosechada por Cultivo
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Comparativa de toneladas brutas recolectadas
        </p>
        <ProductionChart data={harvests} type="bar" />
      </div>

      <div className="arona-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            search
          </span>
          <input
            type="text"
            aria-label="Buscar cosechas por lote, cultivo u observación"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por lote, cultivo u observación..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select
            aria-label="Filtrar cosechas por campo"
            value={fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 cursor-pointer"
          >
            <option value="">Todos los campos</option>
            {fields.map((field) => {
              const id = field.id || field.idCampo;
              return (
                <option key={id} value={id}>
                  {field.nombre}
                </option>
              );
            })}
          </select>

          <select
            aria-label="Filtrar cosechas por cultivo"
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 cursor-pointer"
          >
            <option value="">Todos los cultivos</option>
            {crops.map((crop) => {
              const id = crop.id || crop.idCultivo;
              return (
                <option key={id} value={id}>
                  {crop.nombre}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-16 arona-card">
          <span className="material-icons-outlined text-5xl text-emerald-400 animate-spin">
            autorenew
          </span>
          <p className="text-sm font-semibold text-gray-500 mt-4">
            Cargando registros de cosecha…
          </p>
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
              <p className="text-sm font-bold text-red-900">Error al cargar cosechas</p>
              <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button type="button" onClick={() => void loadData()} className="arona-btn-outline text-xs py-2 px-4">
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && filteredHarvests.length > 0 && (
        <div className="arona-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4"># Lote</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Campo</th>
                  <th className="py-3.5 px-4">Cultivo</th>
                  <th className="py-3.5 px-4">Cantidad (t)</th>
                  <th className="py-3.5 px-4">Jabas/Cajas</th>
                  <th className="py-3.5 px-4">Registrado Por</th>
                  <th className="py-3.5 px-4">Observaciones</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredHarvests.map((h) => {
                  const id = h.id || h.idCosecha;
                  return (
                    <tr
                      key={String(id)}
                      className={`hover:bg-emerald-50/30 transition-colors ${
                        h.estado === false ? 'opacity-60 bg-gray-50/50' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-gray-800">#{id}</td>
                      <td className="py-3.5 px-4 text-gray-600 font-medium whitespace-nowrap">
                        {h.fecha}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 font-medium">{getFieldName(h)}</td>
                      <td className="py-3.5 px-4 font-semibold text-[var(--color-arona-600)]">
                        {getCropName(h)}
                      </td>
                      <td className="py-3.5 px-4 font-black text-gray-800">
                        {kgToTonDisplay(h.cantidadKg)}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">
                        {h.cantidadUnidades ? `${h.cantidadUnidades} u` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">{getUserName(h)}</td>
                      <td className="py-3.5 px-4 text-gray-500 max-w-[200px] truncate" title={h.observaciones}>
                        {h.observaciones || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`badge text-[10px] ${
                            h.estado !== false ? 'badge-success' : 'badge-danger'
                          }`}
                        >
                          {h.estado !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(h)}
                            aria-label={`Editar cosecha #${id}`}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 border-none bg-transparent cursor-pointer"
                          >
                            <span className="material-icons-outlined text-base">edit</span>
                          </button>
                          {h.estado !== false ? (
                            <button
                              type="button"
                              onClick={() => handleRequestDelete(h)}
                              aria-label={`Eliminar cosecha #${id}`}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 border-none bg-transparent cursor-pointer"
                            >
                              <span className="material-icons-outlined text-base">delete_outline</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void restoreHarvest(id)}
                              aria-label={`Restaurar cosecha #${id}`}
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

      {!isLoading && !errorMessage && filteredHarvests.length === 0 && !hasActiveFilters && (
        <div className="text-center py-16 arona-card">
          <span className="material-icons-outlined text-6xl text-gray-300">inventory_2</span>
          <p className="text-base font-semibold text-gray-700 mt-4">
            No hay registros de cosecha aún
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Comience registrando el peso de las jabas y lotes cosechados
          </p>
          <button type="button" onClick={handleOpenCreate} className="arona-btn-primary mt-4">
            Registrar Primera Cosecha
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && filteredHarvests.length === 0 && hasActiveFilters && (
        <div className="text-center py-16 arona-card">
          <span className="material-icons-outlined text-6xl text-gray-300">search_off</span>
          <p className="text-base font-semibold text-gray-700 mt-4">
            No se encontraron coincidencias
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Ajuste los filtros o el término de búsqueda para ver el listado general
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-2 mt-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 bg-white cursor-pointer"
          >
            Limpiar Filtros
          </button>
        </div>
      )}

      <HarvestModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSaveModal}
        initialData={editingHarvest}
        fields={fields}
        crops={crops}
        isLoading={isLoading}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        title={`¿Eliminar Cosecha #${deletingHarvest?.id || deletingHarvest?.idCosecha}?`}
        message="Esta acción marcará la cosecha como inactiva. Podrá restaurarla si fue eliminada por error."
        confirmText="Eliminar"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};
