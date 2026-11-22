import React, { useState, useEffect, type ChangeEvent, type FocusEvent, type FormEvent } from 'react';
import { ModalDialog } from '../../../shared/components/ModalDialog';
import { backendDateToInput } from '../../../shared/utils/formatDate';
import { ACTIVITY_TYPES } from '../../../shared/constants/domain';
import type {
  Crop,
  Field,
  FieldActivity,
  FieldActivityPayload,
} from '../../../shared/types/domain';

export interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: FieldActivityPayload) => void | Promise<void>;
  initialData?: FieldActivity | null;
  fields?: Field[];
  crops?: Crop[];
  isLoading?: boolean;
}

interface ActivityFormState {
  tipoActividad: string;
  fecha: string;
  fieldId: string;
  cropId: string;
  observaciones: string;
}

type ActivityFormKey = keyof ActivityFormState;
type ActivityFormErrors = Partial<Record<ActivityFormKey, string>>;
type ActivityFormTouched = Partial<Record<ActivityFormKey, boolean>>;

const ACTIVITY_LABELS: Record<string, string> = {
  RIEGO: '💧 Riego',
  PODA: '✂️ Poda',
  FUMIGACION: '🧪 Fumigación',
  FERTILIZACION: '🌱 Fertilización',
  DESHIERBE: '🌿 Deshierbe',
  OTRO: '🛠️ Otro mantenimiento',
};

function createEmptyForm(): ActivityFormState {
  return {
    tipoActividad: ACTIVITY_TYPES[0],
    fecha: new Date().toISOString().split('T')[0],
    fieldId: '',
    cropId: '',
    observaciones: '',
  };
}

function isActivityFormKey(name: string): name is ActivityFormKey {
  return name in createEmptyForm();
}

function validateActivityForm(data: ActivityFormState): ActivityFormErrors {
  const errs: ActivityFormErrors = {};
  if (!data.fecha) errs.fecha = 'La fecha es obligatoria';
  if (!data.fieldId) errs.fieldId = 'Seleccione un campo';
  if (!data.observaciones.trim()) {
    errs.observaciones = 'Las observaciones son obligatorias';
  } else if (data.observaciones.trim().length < 10) {
    errs.observaciones = 'Mínimo 10 caracteres';
  } else if (data.observaciones.trim().length > 500) {
    errs.observaciones = 'Máximo 500 caracteres';
  }
  return errs;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  fields = [],
  crops = [],
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<ActivityFormState>(createEmptyForm);
  const [errors, setErrors] = useState<ActivityFormErrors>({});
  const [touched, setTouched] = useState<ActivityFormTouched>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        tipoActividad: initialData.tipoActividad || ACTIVITY_TYPES[0],
        fecha: backendDateToInput(initialData.fecha),
        fieldId: String(initialData.idCampo || ''),
        cropId: initialData.idCultivo ? String(initialData.idCultivo) : '',
        observaciones: initialData.observaciones || '',
      });
    } else {
      setFormData(createEmptyForm());
    }
    setErrors({});
    setTouched({});
  }, [initialData, isOpen]);

  const filteredCrops = formData.fieldId
    ? crops.filter((c) => {
        const cid = c.campoId || c.idCampo || c.campo?.id || c.campo?.idCampo;
        return String(cid) === String(formData.fieldId);
      })
    : crops;

  const handleFieldChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const fieldId = event.target.value;
    const available = crops.filter((c) => {
      const cId = c.campoId || c.idCampo || c.campo?.id || c.campo?.idCampo;
      return String(cId) === String(fieldId);
    });
    const autoCrop = available.length === 1 ? available[0].id || available[0].idCultivo : '';

    const updated: ActivityFormState = {
      ...formData,
      fieldId,
      cropId: autoCrop ? String(autoCrop) : '',
    };
    setFormData(updated);
    if (touched.fieldId) {
      setErrors(validateActivityForm(updated));
    }
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    if (!isActivityFormKey(name)) return;
    const updated: ActivityFormState = { ...formData, [name]: value };
    setFormData(updated);
    if (touched[name]) {
      setErrors(validateActivityForm(updated));
    }
  };

  const handleBlur = (
    event: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name } = event.target;
    if (!isActivityFormKey(name)) return;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validateActivityForm(formData));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({
      tipoActividad: true,
      fecha: true,
      fieldId: true,
      cropId: true,
      observaciones: true,
    });
    const errs = validateActivityForm(formData);
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      const payload: FieldActivityPayload = {
        tipoActividad: formData.tipoActividad,
        fecha: formData.fecha,
        idCampo: String(formData.fieldId),
        idCultivo: formData.cropId ? String(formData.cropId) : null,
        observaciones: formData.observaciones.trim(),
      };
      void onSubmit(payload);
    }
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="activity-modal-title"
      isBusy={isLoading}
    >
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h2 id="activity-modal-title" className="text-xl font-bold text-[var(--color-text-primary)]">
            {initialData ? 'Editar Actividad' : 'Nueva Actividad de Campo'}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Registre labores agrícolas, riegos o tratamientos fitosanitarios
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
              htmlFor="activity-tipoActividad"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Tipo de Labor *
            </label>
            <select
              id="activity-tipoActividad"
              name="tipoActividad"
              value={formData.tipoActividad}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 focus:border-[var(--color-arona-500)]"
            >
              {ACTIVITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {ACTIVITY_LABELS[type] || type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="activity-fecha"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Fecha de Ejecución *
            </label>
            <input
              id="activity-fecha"
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(touched.fecha && errors.fecha)}
              aria-describedby={touched.fecha && errors.fecha ? 'activity-fecha-error' : undefined}
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
                touched.fecha && errors.fecha
                  ? 'border-red-400'
                  : 'border-gray-200 focus:border-[var(--color-arona-500)]'
              }`}
            />
            {touched.fecha && errors.fecha && (
              <p id="activity-fecha-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span> {errors.fecha}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="activity-fieldId"
            className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
          >
            Campo / Lote *
          </label>
          <select
            id="activity-fieldId"
            name="fieldId"
            value={formData.fieldId}
            onChange={handleFieldChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(touched.fieldId && errors.fieldId)}
            aria-describedby={touched.fieldId && errors.fieldId ? 'activity-fieldId-error' : undefined}
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
              touched.fieldId && errors.fieldId
                ? 'border-red-400'
                : 'border-gray-200 focus:border-[var(--color-arona-500)]'
            }`}
          >
            <option value="">— Seleccionar campo —</option>
            {fields.map((field) => {
              const fId = field.id || field.idCampo;
              return (
                <option key={fId} value={fId}>
                  {field.nombre} ({field.hectareas || field.areaHectareas} ha)
                </option>
              );
            })}
          </select>
          {touched.fieldId && errors.fieldId && (
            <p id="activity-fieldId-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <span className="material-icons-outlined text-xs">error</span> {errors.fieldId}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="activity-cropId"
            className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
          >
            Cultivo Específico (Opcional)
          </label>
          <select
            id="activity-cropId"
            name="cropId"
            value={formData.cropId}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 focus:border-[var(--color-arona-500)]"
          >
            <option value="">— Todo el campo o no especificado —</option>
            {filteredCrops.map((crop) => {
              const cId = crop.id || crop.idCultivo;
              return (
                <option key={cId} value={cId}>
                  {crop.nombre} ({crop.tipoCultivo})
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label
            htmlFor="activity-observaciones"
            className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
          >
            Descripción / Observaciones *
          </label>
          <textarea
            id="activity-observaciones"
            name="observaciones"
            rows={3}
            value={formData.observaciones}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Detalle dosis, maquinaria, operarios o condiciones de la labor..."
            aria-invalid={Boolean(touched.observaciones && errors.observaciones)}
            aria-describedby={
              touched.observaciones && errors.observaciones
                ? 'activity-observaciones-error'
                : undefined
            }
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all resize-none ${
              touched.observaciones && errors.observaciones
                ? 'border-red-400'
                : 'border-gray-200 focus:border-[var(--color-arona-500)]'
            }`}
          />
          {touched.observaciones && errors.observaciones && (
            <p id="activity-observaciones-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
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
                {initialData ? 'Guardar Cambios' : 'Registrar Actividad'}
              </>
            )}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
};
