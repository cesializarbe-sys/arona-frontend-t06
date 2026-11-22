import React, { useState, useEffect, type ChangeEvent, type FocusEvent, type FormEvent } from 'react';
import { ModalDialog } from '../../../shared/components/ModalDialog';
import { IRRIGATION_SYSTEMS } from '../../../shared/constants/domain';
import type { Field, FieldPayload } from '../../../shared/types/domain';

export interface FieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: FieldPayload) => void | Promise<void>;
  initialData?: Field | null;
  isLoading?: boolean;
}

interface FieldFormState {
  nombre: string;
  ubicacion: string;
  hectareas: string;
  responsable: string;
  sistemaRiego: string;
  tipoSuelo: string;
  zona: string;
  observaciones: string;
  estado: boolean;
}

type FieldFormKey = keyof FieldFormState;
type FieldFormErrors = Partial<Record<FieldFormKey, string>>;
type FieldFormTouched = Partial<Record<FieldFormKey, boolean>>;

const EMPTY_FORM: FieldFormState = {
  nombre: '',
  ubicacion: '',
  hectareas: '',
  responsable: '',
  sistemaRiego: 'Goteo',
  tipoSuelo: '',
  zona: '',
  observaciones: '',
  estado: true,
};

function isFieldFormKey(name: string): name is FieldFormKey {
  return name in EMPTY_FORM;
}

function getWordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function validateFieldForm(data: FieldFormState): FieldFormErrors {
  const errs: FieldFormErrors = {};
  if (!data.nombre.trim()) {
    errs.nombre = 'El nombre es obligatorio';
  } else if (data.nombre.length > 100) {
    errs.nombre = 'Máximo 100 caracteres';
  }

  if (!data.ubicacion.trim()) {
    errs.ubicacion = 'La ubicación es obligatoria';
  } else if (data.ubicacion.length > 200) {
    errs.ubicacion = 'Máximo 200 caracteres';
  }

  if (!data.hectareas || Number(data.hectareas) <= 0) {
    errs.hectareas = 'Las hectáreas deben ser mayores a 0';
  }

  if (!data.responsable.trim()) {
    errs.responsable = 'El responsable es obligatorio';
  } else if (data.responsable.length > 150) {
    errs.responsable = 'Máximo 150 caracteres';
  }

  if (!data.tipoSuelo.trim()) {
    errs.tipoSuelo = 'El tipo de suelo es obligatorio';
  } else if (data.tipoSuelo.length > 100) {
    errs.tipoSuelo = 'Máximo 100 caracteres';
  }

  if (!data.zona.trim()) {
    errs.zona = 'La zona es obligatoria';
  } else if (data.zona.length > 100) {
    errs.zona = 'Máximo 100 caracteres';
  }

  if (!data.observaciones.trim()) {
    errs.observaciones = 'Las observaciones son obligatorias';
  } else {
    const words = getWordCount(data.observaciones);
    if (words > 300) {
      errs.observaciones = `Límite superado: ${words}/300 palabras`;
    }
  }

  return errs;
}

export const FieldModal: React.FC<FieldModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<FieldFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldFormErrors>({});
  const [touched, setTouched] = useState<FieldFormTouched>({});

  useEffect(() => {
    if (initialData) {
      const ha = initialData.hectareas ?? initialData.areaHectareas;
      setFormData({
        nombre: initialData.nombre || '',
        ubicacion: initialData.ubicacion || '',
        hectareas: ha != null ? String(ha) : '',
        responsable: initialData.responsable || '',
        sistemaRiego: initialData.sistemaRiego || 'Goteo',
        tipoSuelo: initialData.tipoSuelo || '',
        zona: initialData.zona || '',
        observaciones: initialData.observaciones || '',
        estado: initialData.estado ?? true,
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setErrors({});
    setTouched({});
  }, [initialData, isOpen]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    if (!isFieldFormKey(name)) return;

    const updated: FieldFormState =
      name === 'estado' && event.target instanceof HTMLInputElement
        ? { ...formData, estado: event.target.checked }
        : { ...formData, [name]: value };

    setFormData(updated);
    if (touched[name]) {
      setErrors(validateFieldForm(updated));
    }
  };

  const handleBlur = (
    event: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name } = event.target;
    if (!isFieldFormKey(name)) return;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validateFieldForm(formData));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const allTouched: FieldFormTouched = {
      nombre: true,
      ubicacion: true,
      hectareas: true,
      responsable: true,
      sistemaRiego: true,
      tipoSuelo: true,
      zona: true,
      observaciones: true,
      estado: true,
    };
    setTouched(allTouched);
    const errs = validateFieldForm(formData);
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      const payload: FieldPayload = {
        nombre: formData.nombre.trim(),
        ubicacion: formData.ubicacion.trim(),
        hectareas: Number(formData.hectareas),
        responsable: formData.responsable.trim(),
        sistemaRiego: formData.sistemaRiego,
        tipoSuelo: formData.tipoSuelo.trim(),
        zona: formData.zona.trim(),
        observaciones: formData.observaciones.trim(),
        estado: formData.estado,
      };
      void onSubmit(payload);
    }
  };

  const wordCount = getWordCount(formData.observaciones);

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="field-modal-title"
      isBusy={isLoading}
      panelClassName="max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
    >
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h2 id="field-modal-title" className="text-xl font-bold text-[var(--color-text-primary)]">
            {initialData ? 'Editar Campo' : 'Nuevo Campo'}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Complete los detalles agronómicos del lote
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Cerrar modal"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all border-none bg-transparent cursor-pointer"
        >
          <span className="material-icons-outlined">close</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="field-nombre"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Nombre del Lote *
            </label>
            <input
              id="field-nombre"
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ej: Lote Norte A1"
              aria-invalid={Boolean(touched.nombre && errors.nombre)}
              aria-describedby={touched.nombre && errors.nombre ? 'field-nombre-error' : undefined}
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
                touched.nombre && errors.nombre
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-gray-200 focus:border-[var(--color-arona-500)]'
              }`}
            />
            {touched.nombre && errors.nombre && (
              <p id="field-nombre-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span> {errors.nombre}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="field-hectareas"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Área (Hectáreas) *
            </label>
            <input
              id="field-hectareas"
              type="number"
              name="hectareas"
              step="0.01"
              min="0.01"
              value={formData.hectareas}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ej: 15.5"
              aria-invalid={Boolean(touched.hectareas && errors.hectareas)}
              aria-describedby={
                touched.hectareas && errors.hectareas ? 'field-hectareas-error' : undefined
              }
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
                touched.hectareas && errors.hectareas
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-gray-200 focus:border-[var(--color-arona-500)]'
              }`}
            />
            {touched.hectareas && errors.hectareas && (
              <p id="field-hectareas-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span> {errors.hectareas}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="field-ubicacion"
            className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
          >
            Ubicación *
          </label>
          <input
            id="field-ubicacion"
            type="text"
            name="ubicacion"
            value={formData.ubicacion}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ej: Valle de Ica - Sector La Tinguiña Km 12"
            aria-invalid={Boolean(touched.ubicacion && errors.ubicacion)}
            aria-describedby={
              touched.ubicacion && errors.ubicacion ? 'field-ubicacion-error' : undefined
            }
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
              touched.ubicacion && errors.ubicacion
                ? 'border-red-400 focus:border-red-400'
                : 'border-gray-200 focus:border-[var(--color-arona-500)]'
            }`}
          />
          {touched.ubicacion && errors.ubicacion && (
            <p id="field-ubicacion-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <span className="material-icons-outlined text-xs">error</span> {errors.ubicacion}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="field-responsable"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Responsable de Campo *
            </label>
            <input
              id="field-responsable"
              type="text"
              name="responsable"
              value={formData.responsable}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ej: Ing. Carlos Arona"
              aria-invalid={Boolean(touched.responsable && errors.responsable)}
              aria-describedby={
                touched.responsable && errors.responsable ? 'field-responsable-error' : undefined
              }
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
                touched.responsable && errors.responsable
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-gray-200 focus:border-[var(--color-arona-500)]'
              }`}
            />
            {touched.responsable && errors.responsable && (
              <p id="field-responsable-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span> {errors.responsable}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="field-zona"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Zona Agrícola *
            </label>
            <input
              id="field-zona"
              type="text"
              name="zona"
              value={formData.zona}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ej: Zona Norte, Sector D"
              aria-invalid={Boolean(touched.zona && errors.zona)}
              aria-describedby={touched.zona && errors.zona ? 'field-zona-error' : undefined}
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
                touched.zona && errors.zona
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-gray-200 focus:border-[var(--color-arona-500)]'
              }`}
            />
            {touched.zona && errors.zona && (
              <p id="field-zona-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span> {errors.zona}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="field-sistemaRiego"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Sistema de Riego
            </label>
            <select
              id="field-sistemaRiego"
              name="sistemaRiego"
              value={formData.sistemaRiego}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 focus:border-[var(--color-arona-500)]"
            >
              {IRRIGATION_SYSTEMS.map((sys) => (
                <option key={sys} value={sys}>
                  {sys}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="field-tipoSuelo"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Tipo de Suelo *
            </label>
            <input
              id="field-tipoSuelo"
              type="text"
              name="tipoSuelo"
              value={formData.tipoSuelo}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ej: Franco arenoso"
              aria-invalid={Boolean(touched.tipoSuelo && errors.tipoSuelo)}
              aria-describedby={
                touched.tipoSuelo && errors.tipoSuelo ? 'field-tipoSuelo-error' : undefined
              }
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
                touched.tipoSuelo && errors.tipoSuelo
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-gray-200 focus:border-[var(--color-arona-500)]'
              }`}
            />
            {touched.tipoSuelo && errors.tipoSuelo && (
              <p id="field-tipoSuelo-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span> {errors.tipoSuelo}
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="field-observaciones"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600"
            >
              Observaciones *
            </label>
            <span
              className={`text-xs ${
                wordCount > 300 ? 'text-red-500 font-bold' : 'text-[var(--color-text-muted)]'
              }`}
            >
              {wordCount} / 300 palabras
            </span>
          </div>
          <textarea
            id="field-observaciones"
            name="observaciones"
            rows={3}
            value={formData.observaciones}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Notas sobre el estado físico, fertilidad, antecedentes..."
            aria-invalid={Boolean(touched.observaciones && errors.observaciones)}
            aria-describedby={
              touched.observaciones && errors.observaciones ? 'field-observaciones-error' : undefined
            }
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all resize-none ${
              touched.observaciones && errors.observaciones
                ? 'border-red-400 focus:border-red-400'
                : 'border-gray-200 focus:border-[var(--color-arona-500)]'
            }`}
          />
          {touched.observaciones && errors.observaciones && (
            <p id="field-observaciones-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <span className="material-icons-outlined text-xs">error</span> {errors.observaciones}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="arona-btn-outline"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="arona-btn-primary disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="material-icons-outlined text-lg animate-spin">refresh</span>
                Guardando...
              </>
            ) : (
              <>
                <span className="material-icons-outlined text-lg">
                  {initialData ? 'save' : 'add_circle'}
                </span>
                {initialData ? 'Guardar Cambios' : 'Crear Campo'}
              </>
            )}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
};
