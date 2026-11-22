import React from 'react';
import { useCrops } from '../hooks/useCrops';
import { useCropFilters } from '../hooks/useCropFilters';
import { useCropsPageController } from '../hooks/useCropsPageController';
import { CropModal } from '../components/CropModal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { CROP_HEALTH_STATUSES, CROP_TYPES } from '../../../shared/constants/domain';

export const CropsPage: React.FC = () => {
  const {
    crops,
    fields,
    isLoading,
    errorMessage,
    loadData,
    createCrop,
    updateCrop,
    deleteCrop,
    restoreCrop,
    getFieldName,
    getHealthBadgeClass,
    getHealthIcon,
  } = useCrops();

  const {
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    healthFilter,
    setHealthFilter,
    filteredCrops,
  } = useCropFilters(crops, getFieldName);

  const {
    isModalOpen,
    setIsModalOpen,
    editingCrop,
    deletingCrop,
    setDeletingCrop,
    isDeleteOpen,
    setIsDeleteOpen,
    handleOpenCreate,
    handleOpenEdit,
    handleSaveModal,
    handleConfirmDelete,
  } = useCropsPageController({ createCrop, updateCrop, deleteCrop });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Gestión de Cultivos y Variedades
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Parámetros fenológicos, necesidades hídricas y monitoreo fitosanitario
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="arona-btn-primary shadow-lg shadow-emerald-700/20"
        >
          <span className="material-icons-outlined text-lg">add_circle</span>
          Nuevo Cultivo
        </button>
      </div>

      <div className="arona-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            search
          </span>
          <input
            type="text"
            aria-label="Buscar cultivos por variedad o campo"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar variedad o campo..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select
            aria-label="Filtrar cultivos por tipo"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 cursor-pointer"
          >
            <option value="">Todos los tipos</option>
            {CROP_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
            <option value="UVA">UVA</option>
          </select>

          <select
            aria-label="Filtrar cultivos por estado de salud"
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 cursor-pointer"
          >
            <option value="">Cualquier estado</option>
            {CROP_HEALTH_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-16 arona-card">
          <span className="material-icons-outlined text-5xl text-[var(--color-arona-500)] animate-spin">
            autorenew
          </span>
          <p className="text-sm font-semibold text-gray-500 mt-4">Cargando cultivos…</p>
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
              <p className="text-sm font-bold text-red-900">Error al cargar cultivos</p>
              <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button type="button" onClick={() => void loadData()} className="arona-btn-outline text-xs py-2 px-4">
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && filteredCrops.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map((crop) => {
            const id = crop.id || crop.idCultivo;
            return (
              <div
                key={id}
                className={`arona-card p-5 hover:shadow-lg transition-all duration-200 flex flex-col justify-between ${
                  crop.estado === false ? 'opacity-65 bg-gray-50/50' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[var(--color-arona-600)] flex items-center justify-center shrink-0">
                        <span className="material-icons-outlined text-xl">local_florist</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-800 leading-tight">
                          {crop.nombre}
                        </h3>
                        <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                          {getFieldName(crop)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`badge text-[10px] ${getHealthBadgeClass(
                        crop.estadoSalud
                      )} flex items-center gap-1`}
                    >
                      <span className="material-icons-outlined text-xs">
                        {getHealthIcon(crop.estadoSalud)}
                      </span>
                      {crop.estadoSalud}
                    </span>
                  </div>

                  <div className="space-y-1.5 py-3 border-y border-gray-100 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span className="text-gray-400 font-medium">Tipo:</span>
                      <strong className="text-gray-800 uppercase font-semibold">
                        {crop.tipoCultivo}
                      </strong>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="text-gray-400 font-medium">Riego cada:</span>
                      <span className="text-gray-800">{crop.frecuenciaRiegoDias} días</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="text-gray-400 font-medium">Temp. Ideal:</span>
                      <span className="text-gray-800">{crop.temperaturaIdeal ?? 20}°C</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="text-gray-400 font-medium">Siembra:</span>
                      <span className="text-gray-800">{crop.fechaSiembra || '—'}</span>
                    </div>
                    {crop.requiereSombra && (
                      <div className="flex justify-between text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg mt-1 font-medium">
                        <span>Mallas de sombra:</span>
                        <span>Requeridas</span>
                      </div>
                    )}
                  </div>

                  {crop.observaciones && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic">
                      &quot;{crop.observaciones}&quot;
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
                  <span
                    className={`text-[11px] font-semibold ${
                      crop.estado !== false ? 'text-emerald-700' : 'text-gray-400'
                    }`}
                  >
                    {crop.estado !== false ? 'Activo' : 'Inactivo'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(crop)}
                      aria-label={`Editar cultivo ${crop.nombre}`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all border-none bg-transparent cursor-pointer"
                    >
                      <span className="material-icons-outlined text-base">edit</span>
                    </button>
                    {crop.estado !== false ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingCrop(crop);
                          setIsDeleteOpen(true);
                        }}
                        aria-label={`Eliminar cultivo ${crop.nombre}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all border-none bg-transparent cursor-pointer"
                      >
                        <span className="material-icons-outlined text-base">delete_outline</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void restoreCrop(id)}
                        aria-label={`Restaurar cultivo ${crop.nombre}`}
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

      {!isLoading && !errorMessage && filteredCrops.length === 0 && crops.length === 0 && (
        <div className="text-center py-16 arona-card">
          <span className="material-icons-outlined text-6xl text-gray-300">local_florist</span>
          <p className="text-base font-semibold text-gray-700 mt-4">
            No hay cultivos registrados aún
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Registre los cultivos y variedades sembradas en sus campos
          </p>
          <button type="button" onClick={handleOpenCreate} className="arona-btn-primary mt-4">
            Registrar Primer Cultivo
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && filteredCrops.length === 0 && crops.length > 0 && (
        <div className="text-center py-16 arona-card">
          <span className="material-icons-outlined text-6xl text-gray-300">search_off</span>
          <p className="text-base font-semibold text-gray-700 mt-4">
            No se encontraron coincidencias
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Ajuste los filtros o el término de búsqueda para volver al listado general
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('');
              setHealthFilter('');
            }}
            className="px-4 py-2 mt-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 bg-white cursor-pointer"
          >
            Limpiar Filtros
          </button>
        </div>
      )}

      <CropModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveModal}
        initialData={editingCrop}
        fields={fields}
        isLoading={isLoading}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        title={`¿Eliminar Cultivo "${deletingCrop?.nombre}"?`}
        message="Esta acción marcará el cultivo como inactivo en el sistema. Podrá restaurarlo posteriormente."
        confirmText="Eliminar"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};
