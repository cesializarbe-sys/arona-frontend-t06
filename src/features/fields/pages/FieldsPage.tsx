import React, { useState } from 'react';
import { useFields } from '../hooks/useFields';
import { useFieldFilters, type FieldStatusFilter } from '../hooks/useFieldFilters';
import { useFieldsPageController } from '../hooks/useFieldsPageController';
import { FieldModal } from '../components/FieldModal';
import { FieldImportModal } from '../components/FieldImportModal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { ModalDialog } from '../../../shared/components/ModalDialog';

type StatusFilter = FieldStatusFilter;
type ViewMode = 'grid' | 'table';

export const FieldsPage: React.FC = () => {
  const {
    fields,
    isLoading,
    errorMessage,
    loadFields,
    createField,
    updateField,
    deleteField,
    restoreField,
    totalHectares,
    activeFieldsCount,
    exportPdf,
    exportExcel,
    importFields,
    isExportingPdf,
    isExportingExcel,
    isImporting,
  } = useFields();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredFields,
  } = useFieldFilters(fields);

  const {
    isModalOpen,
    setIsModalOpen,
    editingField,
    isImportModalOpen,
    setIsImportModalOpen,
    pendingToggleField,
    isConfirmOpen,
    setIsConfirmOpen,
    detailField,
    setDetailField,
    handleOpenCreate,
    handleOpenEdit,
    handleSaveModal,
    handleToggleStatusRequest,
    handleConfirmToggle,
  } = useFieldsPageController({ createField, updateField, deleteField, restoreField });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Mis Campos y Lotes
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Administración agronómica y zonificación de parcelas productivas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span className="material-icons-outlined text-base text-emerald-700">upload_file</span>
            Importar
          </button>

          <button
            type="button"
            onClick={() => void exportPdf()}
            disabled={isExportingPdf}
            className="px-3.5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className="material-icons-outlined text-base">picture_as_pdf</span>
            {isExportingPdf ? 'Generando PDF...' : 'Exportar PDF'}
          </button>

          <button
            type="button"
            onClick={() => void exportExcel()}
            disabled={isExportingExcel}
            className="px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className="material-icons-outlined text-base">table_view</span>
            {isExportingExcel ? 'Generando Excel...' : 'Exportar Excel'}
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="arona-btn-primary shadow-lg shadow-emerald-700/20"
          >
            <span className="material-icons-outlined text-lg">add_circle</span>
            Nuevo Campo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="arona-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[var(--color-arona-600)] flex items-center justify-center">
            <span className="material-icons-outlined text-xl">landscape</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Total Lotes</p>
            <p className="text-2xl font-bold text-gray-800">{fields.length}</p>
          </div>
        </div>

        <div className="arona-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
            <span className="material-icons-outlined text-xl">check_circle</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Lotes Activos</p>
            <p className="text-2xl font-bold text-gray-800">{activeFieldsCount}</p>
          </div>
        </div>

        <div className="arona-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <span className="material-icons-outlined text-xl">straighten</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Extensión Total</p>
            <p className="text-2xl font-bold text-gray-800">{totalHectares} ha</p>
          </div>
        </div>
      </div>

      <div className="arona-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            search
          </span>
          <input
            type="text"
            aria-label="Buscar campos por nombre, zona o responsable"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, zona o responsable..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 focus:border-[var(--color-arona-500)] transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <select
            aria-label="Filtrar campos por estado"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 cursor-pointer"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Solo Activos</option>
            <option value="INACTIVE">Solo Inactivos</option>
          </select>

          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Vista cuadrícula"
              aria-pressed={viewMode === 'grid'}
              className={`w-7 h-7 rounded-lg flex items-center justify-center border-none cursor-pointer transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-[var(--color-arona-600)] shadow-xs'
                  : 'text-gray-400 hover:text-gray-600 bg-transparent'
              }`}
            >
              <span className="material-icons-outlined text-base">grid_view</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Vista lista"
              aria-pressed={viewMode === 'table'}
              className={`w-7 h-7 rounded-lg flex items-center justify-center border-none cursor-pointer transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-[var(--color-arona-600)] shadow-xs'
                  : 'text-gray-400 hover:text-gray-600 bg-transparent'
              }`}
            >
              <span className="material-icons-outlined text-base">view_list</span>
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-16 arona-card">
          <span className="material-icons-outlined text-5xl text-emerald-400 animate-spin">
            autorenew
          </span>
          <p className="text-sm font-semibold text-gray-500 mt-4">Cargando campos…</p>
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
              <p className="text-sm font-bold text-red-900">Error al cargar los campos</p>
              <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button type="button" onClick={() => void loadFields()} className="arona-btn-outline text-xs py-2 px-4">
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && viewMode === 'grid' && filteredFields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFields.map((field) => {
            const id = field.id || field.idCampo;
            return (
              <div
                key={id}
                className={`arona-card p-5 hover:shadow-lg transition-all duration-200 flex flex-col justify-between ${
                  !field.estado ? 'opacity-70 bg-gray-50/50' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[var(--color-arona-600)] flex items-center justify-center shrink-0">
                        <span className="material-icons-outlined text-xl">landscape</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-800 leading-tight">
                          {field.nombre}
                        </h3>
                        <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                          {field.zona || 'Zona no especificada'}
                        </p>
                      </div>
                    </div>

                    <span className={`badge text-[11px] ${field.estado ? 'badge-success' : 'badge-danger'}`}>
                      {field.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="space-y-1.5 py-3 border-y border-gray-100 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span className="text-gray-400 font-medium">Extensión:</span>
                      <strong className="text-gray-800">{field.hectareas || field.areaHectareas} ha</strong>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="text-gray-400 font-medium">Responsable:</span>
                      <span className="text-gray-800 truncate max-w-[150px]">{field.responsable || '—'}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="text-gray-400 font-medium">Riego:</span>
                      <span className="text-gray-800">{field.sistemaRiego || '—'}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="text-gray-400 font-medium">Tipo Suelo:</span>
                      <span className="text-gray-800">{field.tipoSuelo || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setDetailField(field)}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 bg-transparent border-none cursor-pointer flex items-center gap-1 p-0"
                  >
                    <span className="material-icons-outlined text-base">visibility</span>
                    Ver Detalle
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(field)}
                      aria-label={`Editar campo ${field.nombre}`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all border-none bg-transparent cursor-pointer"
                    >
                      <span className="material-icons-outlined text-base">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatusRequest(field)}
                      aria-label={
                        field.estado
                          ? `Desactivar campo ${field.nombre}`
                          : `Restaurar campo ${field.nombre}`
                      }
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border-none bg-transparent cursor-pointer ${
                        field.estado
                          ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      <span className="material-icons-outlined text-base">
                        {field.estado ? 'delete_outline' : 'restore_from_trash'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !errorMessage && viewMode === 'table' && filteredFields.length > 0 && (
        <div className="arona-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Campo</th>
                  <th className="py-3.5 px-4">Responsable</th>
                  <th className="py-3.5 px-4">Ubicación</th>
                  <th className="py-3.5 px-4">Hectáreas</th>
                  <th className="py-3.5 px-4">Tipo Suelo</th>
                  <th className="py-3.5 px-4">Zona</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFields.map((field) => {
                  const id = field.id || field.idCampo;
                  return (
                    <tr
                      key={id}
                      className={`hover:bg-emerald-50/30 transition-colors ${
                        !field.estado ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-gray-800 flex items-center gap-2">
                        <span className="material-icons-outlined text-emerald-600 text-base">
                          landscape
                        </span>
                        {field.nombre}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{field.responsable || '—'}</td>
                      <td className="py-3.5 px-4 text-gray-600">{field.ubicacion || '—'}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-700">
                        {field.hectareas || field.areaHectareas} ha
                      </td>
                      <td className="py-3.5 px-4 text-gray-600">{field.tipoSuelo || '—'}</td>
                      <td className="py-3.5 px-4 text-gray-600">{field.zona || '—'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`badge text-[10px] ${field.estado ? 'badge-success' : 'badge-danger'}`}>
                          {field.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailField(field)}
                            aria-label={`Ver detalle de ${field.nombre}`}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-sky-600 hover:bg-sky-50 border-none bg-transparent cursor-pointer"
                          >
                            <span className="material-icons-outlined text-base">visibility</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(field)}
                            aria-label={`Editar campo ${field.nombre}`}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 border-none bg-transparent cursor-pointer"
                          >
                            <span className="material-icons-outlined text-base">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatusRequest(field)}
                            aria-label={
                              field.estado
                                ? `Desactivar campo ${field.nombre}`
                                : `Restaurar campo ${field.nombre}`
                            }
                            className={`w-7 h-7 rounded-lg flex items-center justify-center border-none bg-transparent cursor-pointer ${
                              field.estado
                                ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <span className="material-icons-outlined text-base">
                              {field.estado ? 'delete_outline' : 'restore_from_trash'}
                            </span>
                          </button>
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

      {!isLoading && !errorMessage && filteredFields.length === 0 && fields.length === 0 && (
        <div className="text-center py-16 arona-card">
          <span className="material-icons-outlined text-6xl text-gray-300">landscape</span>
          <p className="text-base font-semibold text-gray-700 mt-4">
            No hay campos registrados aún
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Registre un nuevo campo agrícola para comenzar
          </p>
          <button type="button" onClick={handleOpenCreate} className="arona-btn-primary mt-4">
            Registrar Primer Campo
          </button>
        </div>
      )}

      {!isLoading && !errorMessage && filteredFields.length === 0 && fields.length > 0 && (
        <div className="text-center py-16 arona-card">
          <span className="material-icons-outlined text-6xl text-gray-300">search_off</span>
          <p className="text-base font-semibold text-gray-700 mt-4">
            No se encontraron coincidencias
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Ajuste los filtros o el término de búsqueda
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('ALL');
            }}
            className="px-4 py-2 mt-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 bg-white cursor-pointer"
          >
            Limpiar Filtros
          </button>
        </div>
      )}

      <FieldModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveModal}
        initialData={editingField}
        isLoading={isLoading}
      />

      <FieldImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={importFields}
        isLoading={isImporting}
      />

      <ModalDialog
        isOpen={Boolean(detailField)}
        onClose={() => setDetailField(null)}
        labelledBy="field-detail-title"
        zIndexClass="z-[140]"
        panelClassName="rounded-3xl max-w-lg w-full overflow-hidden p-0"
      >
        {detailField && (
          <>
            <div className="h-32 bg-gradient-to-r from-emerald-700 to-green-600 p-6 text-white relative">
              <button
                type="button"
                onClick={() => setDetailField(null)}
                aria-label="Cerrar ficha agronómica"
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center border-none cursor-pointer"
              >
                <span className="material-icons-outlined text-sm">close</span>
              </button>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
                Ficha Agronómica
              </span>
              <h2 id="field-detail-title" className="text-2xl font-black mt-1">
                {detailField.nombre}
              </h2>
              <p className="text-xs text-emerald-100">
                {detailField.ubicacion || 'Sin ubicación geográfica'}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <p className="text-gray-400 font-semibold uppercase">Extensión</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">
                    {detailField.hectareas || detailField.areaHectareas} ha
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <p className="text-gray-400 font-semibold uppercase">Zona</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{detailField.zona || '—'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <p className="text-gray-400 font-semibold uppercase">Responsable</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">
                    {detailField.responsable || '—'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl">
                  <p className="text-gray-400 font-semibold uppercase">Riego</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">
                    {detailField.sistemaRiego || '—'}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-2xl col-span-2">
                  <p className="text-gray-400 font-semibold uppercase">Tipo de Suelo</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">
                    {detailField.tipoSuelo || '—'}
                  </p>
                </div>
              </div>

              {detailField.observaciones && (
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-xs">
                  <p className="font-semibold text-emerald-900 mb-1">Observaciones:</p>
                  <p className="text-emerald-800 leading-relaxed">{detailField.observaciones}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const current = detailField;
                    setDetailField(null);
                    handleOpenEdit(current);
                  }}
                  className="arona-btn-primary flex-1 justify-center"
                >
                  <span className="material-icons-outlined text-base">edit</span>
                  Editar Ficha
                </button>
              </div>
            </div>
          </>
        )}
      </ModalDialog>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title={pendingToggleField?.estado ? '¿Desactivar campo?' : '¿Restaurar campo?'}
        message={
          pendingToggleField?.estado
            ? `Esta acción marcará como inactivo el campo "${pendingToggleField?.nombre}". Podrá reactivarlo en cualquier momento.`
            : `Se restaurará el campo "${pendingToggleField?.nombre}" a estado activo.`
        }
        confirmText={pendingToggleField?.estado ? 'Desactivar' : 'Restaurar'}
        type={pendingToggleField?.estado ? 'warning' : 'success'}
        onConfirm={handleConfirmToggle}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
