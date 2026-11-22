import React, { useState, useEffect, type ChangeEvent, type FocusEvent, type FormEvent } from 'react';
import { ModalDialog } from '../../../shared/components/ModalDialog';
import { backendDateToInput, inputDateToBackend } from '../../../shared/utils/formatDate';
import { CROP_HEALTH_STATUSES, CROP_TYPES } from '../../../shared/constants/domain';
import type { Crop, CropPayload, Field } from '../../../shared/types/domain';

export interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CropPayload) => void | Promise<void>;
  initialData?: Crop | null;
  fields?: Field[];
  isLoading?: boolean;
}

interface CropFormState {
  nombre: string;
  tipoCultivo: string;
  frecuenciaRiegoDias: string;
  temperaturaIdeal: string;
  fechaSiembraInput: string;
  estadoSalud: string;
  requiereSombra: boolean;
  observaciones: string;
  selectedFieldId: string;
}

type CropFormKey = keyof CropFormState;
type CropFormErrors = Partial<Record<CropFormKey, string>>;
type CropFormTouched = Partial<Record<CropFormKey, boolean>>;

const CROP_LABELS: Record<string, string> = {
  MANDARINA: 'Mandarina',
  PALTA: 'Palta Hass',
  ARANDANO: 'Arándano Biloxi / Ventura',
  CAQUI: 'Caqui Rojo Brillante',
};

const HEALTH_LABELS: Record<string, string> = {
  BUENO: 'Bueno (Óptimo)',
  EN_RIESGO: 'En Riesgo',
  CON_PROBLEMAS: 'Con Problemas',
};

function createEmptyForm(defaultFieldId: string): CropFormState {
  return {
    nombre: '',
    tipoCultivo: CROP_TYPES[0],
    frecuenciaRiegoDias: '3',
    temperaturaIdeal: '20',
    fechaSiembraInput: new Date().toISOString().split('T')[0],
    estadoSalud: CROP_HEALTH_STATUSES[0],
    requiereSombra: false,
    observaciones: '',
    selectedFieldId: defaultFieldId,
  };
}

function isCropFormKey(name: string): name is CropFormKey {
  return name in createEmptyForm('');
}

function validateCropForm(data: CropFormState): CropFormErrors {
  const errs: CropFormErrors = {};
  if (!data.nombre.trim()) {
    errs.nombre = 'El nombre es obligatorio';
  } else if (data.nombre.length > 100) {
    errs.nombre = 'Máximo 100 caracteres';
  }

  if (!data.selectedFieldId) {
    errs.selectedFieldId = 'Debe seleccionar un campo';
  }

  if (!data.fechaSiembraInput) {
    errs.fechaSiembraInput = 'La fecha de siembra es requerida';
  }

  if (!data.frecuenciaRiegoDias || Number(data.frecuenciaRiegoDias) < 1) {
    errs.frecuenciaRiegoDias = 'Debe ser al menos 1 día';
  }

  if (
    data.temperaturaIdeal === '' ||
    Number(data.temperaturaIdeal) < 5 ||
    Number(data.temperaturaIdeal) > 45
  ) {
    errs.temperaturaIdeal = 'Debe estar entre 5°C y 45°C';
  }

  if (!data.observaciones.trim()) {
    errs.observaciones = 'Las observaciones son obligatorias';
  } else if (data.observaciones.trim().length < 10) {
    errs.observaciones = 'Mínimo 10 caracteres';
  } else if (data.observaciones.trim().length > 500) {
    errs.observaciones = 'Máximo 500 caracteres';
  }

  return errs;
}

export const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  fields = [],
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CropFormState>(() => createEmptyForm(''));
  const [errors, setErrors] = useState<CropFormErrors>({});
  const [touched, setTouched] = useState<CropFormTouched>({});

  useEffect(() => {
    if (initialData) {
      const fieldRef =
        initialData.campoId ||
        initialData.idCampo ||
        initialData.campo?.id ||
        initialData.campo?.idCampo ||
        '';
      setFormData({
        nombre: initialData.nombre || '',
        tipoCultivo: initialData.tipoCultivo || CROP_TYPES[0],
        frecuenciaRiegoDias: String(initialData.frecuenciaRiegoDias ?? 3),
        temperaturaIdeal: String(initialData.temperaturaIdeal ?? 20),
        fechaSiembraInput: backendDateToInput(initialData.fechaSiembra),
        estadoSalud: initialData.estadoSalud || CROP_HEALTH_STATUSES[0],
        requiereSombra: Boolean(initialData.requiereSombra),
        observaciones: initialData.observaciones || '',
        selectedFieldId: String(fieldRef),
      });
    } else {
      const firstId = fields[0]?.id || fields[0]?.idCampo || '';
      setFormData(createEmptyForm(String(firstId)));
    }
    setErrors({});
    setTouched({});
  }, [initialData, isOpen, fields]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    if (!isCropFormKey(name)) return;
    const updated: CropFormState =
      name === 'requiereSombra' && event.target instanceof HTMLInputElement
        ? { ...formData, requiereSombra: event.target.checked }
        : { ...formData, [name]: value };
    setFormData(updated);
    if (touched[name]) {
      setErrors(validateCropForm(updated));
    }
  };

  const handleBlur = (
    event: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name } = event.target;
    if (!isCropFormKey(name)) return;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validateCropForm(formData));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const allTouched: CropFormTouched = {
      nombre: true,
      tipoCultivo: true,
      frecuenciaRiegoDias: true,
      temperaturaIdeal: true,
      fechaSiembraInput: true,
      estadoSalud: true,
      requiereSombra: true,
      observaciones: true,
      selectedFieldId: true,
    };
    setTouched(allTouched);
    const errs = validateCropForm(formData);
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      const payload: CropPayload = {
        nombre: formData.nombre.trim(),
        tipoCultivo: formData.tipoCultivo,
        frecuenciaRiegoDias: Number(formData.frecuenciaRiegoDias),
        temperaturaIdeal: Number(formData.temperaturaIdeal),
        fechaSiembra: inputDateToBackend(formData.fechaSiembraInput),
        requiereSombra: formData.requiereSombra,
        estadoSalud: formData.estadoSalud,
        observaciones: formData.observaciones.trim(),
        idCampo: String(formData.selectedFieldId),
        campoId: String(formData.selectedFieldId),
      };
      void onSubmit(payload);
    }
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="crop-modal-title"
      isBusy={isLoading}
      panelClassName="max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
    >
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h2 id="crop-modal-title" className="text-xl font-bold text-[var(--color-text-primary)]">
            {initialData ? 'Editar Cultivo' : 'Nuevo Cultivo'}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Configure las variables agronómicas del cultivo
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
              htmlFor="crop-nombre"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Nombre de la Variedad *
            </label>
            <input
              id="crop-nombre"
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Ej: Mandarina W. Murcott Lote 1"
              aria-invalid={Boolean(touched.nombre && errors.nombre)}
              aria-describedby={touched.nombre && errors.nombre ? 'crop-nombre-error' : undefined}
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
                touched.nombre && errors.nombre
                  ? 'border-red-400'
                  : 'border-gray-200 focus:border-[var(--color-arona-500)]'
              }`}
            />
            {touched.nombre && errors.nombre && (
              <p id="crop-nombre-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span> {errors.nombre}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="crop-selectedFieldId"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Campo Destino *
            </label>
            <select
              id="crop-selectedFieldId"
              name="selectedFieldId"
              value={formData.selectedFieldId}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(touched.selectedFieldId && errors.selectedFieldId)}
              aria-describedby={
                touched.selectedFieldId && errors.selectedFieldId
                  ? 'crop-selectedFieldId-error'
                  : undefined
              }
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
                touched.selectedFieldId && errors.selectedFieldId
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
            {touched.selectedFieldId && errors.selectedFieldId && (
              <p id="crop-selectedFieldId-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span> {errors.selectedFieldId}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="crop-tipoCultivo"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Tipo de Cultivo *
            </label>
            <select
              id="crop-tipoCultivo"
              name="tipoCultivo"
              value={formData.tipoCultivo}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 focus:border-[var(--color-arona-500)]"
            >
              {CROP_TYPES.map((ct) => (
                <option key={ct} value={ct}>
                  {CROP_LABELS[ct] || ct}
                </option>
              ))}
              <option value="UVA">Uva de Mesa</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="crop-fechaSiembraInput"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Fecha de Siembra *
            </label>
            <input
              id="crop-fechaSiembraInput"
              type="date"
              name="fechaSiembraInput"
              value={formData.fechaSiembraInput}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(touched.fechaSiembraInput && errors.fechaSiembraInput)}
              aria-describedby={
                touched.fechaSiembraInput && errors.fechaSiembraInput
                  ? 'crop-fechaSiembraInput-error'
                  : undefined
              }
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
                touched.fechaSiembraInput && errors.fechaSiembraInput
                  ? 'border-red-400'
                  : 'border-gray-200 focus:border-[var(--color-arona-500)]'
              }`}
            />
            {touched.fechaSiembraInput && errors.fechaSiembraInput && (
              <p id="crop-fechaSiembraInput-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span>{' '}
                {errors.fechaSiembraInput}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="crop-frecuenciaRiegoDias"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Riego (días) *
            </label>
            <input
              id="crop-frecuenciaRiegoDias"
              type="number"
              name="frecuenciaRiegoDias"
              min="1"
              value={formData.frecuenciaRiegoDias}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(touched.frecuenciaRiegoDias && errors.frecuenciaRiegoDias)}
              aria-describedby={
                touched.frecuenciaRiegoDias && errors.frecuenciaRiegoDias
                  ? 'crop-frecuenciaRiegoDias-error'
                  : undefined
              }
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 focus:border-[var(--color-arona-500)]"
            />
            {touched.frecuenciaRiegoDias && errors.frecuenciaRiegoDias && (
              <p id="crop-frecuenciaRiegoDias-error" className="text-xs text-red-500 mt-1">
                {errors.frecuenciaRiegoDias}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="crop-temperaturaIdeal"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Temp. Ideal (°C) *
            </label>
            <input
              id="crop-temperaturaIdeal"
              type="number"
              name="temperaturaIdeal"
              min="5"
              max="45"
              value={formData.temperaturaIdeal}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(touched.temperaturaIdeal && errors.temperaturaIdeal)}
              aria-describedby={
                touched.temperaturaIdeal && errors.temperaturaIdeal
                  ? 'crop-temperaturaIdeal-error'
                  : undefined
              }
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 focus:border-[var(--color-arona-500)]"
            />
            {touched.temperaturaIdeal && errors.temperaturaIdeal && (
              <p id="crop-temperaturaIdeal-error" className="text-xs text-red-500 mt-1">
                {errors.temperaturaIdeal}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="crop-estadoSalud"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Estado Fitosanitario *
            </label>
            <select
              id="crop-estadoSalud"
              name="estadoSalud"
              value={formData.estadoSalud}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 focus:border-[var(--color-arona-500)]"
            >
              {CROP_HEALTH_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {HEALTH_LABELS[status] || status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            id="crop-requiereSombra"
            name="requiereSombra"
            checked={formData.requiereSombra}
            onChange={handleChange}
            className="w-4 h-4 rounded border-gray-300 text-[var(--color-arona-500)] focus:ring-[var(--color-arona-500)] cursor-pointer"
          />
          <label
            htmlFor="crop-requiereSombra"
            className="text-sm text-gray-700 cursor-pointer font-medium"
          >
            Requiere mallas de sombra o protección solar especial
          </label>
        </div>

        <div>
          <label
            htmlFor="crop-observaciones"
            className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
          >
            Observaciones del Cultivo *
          </label>
          <textarea
            id="crop-observaciones"
            name="observaciones"
            rows={3}
            value={formData.observaciones}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Notas fenológicas, requerimientos nutricionales..."
            aria-invalid={Boolean(touched.observaciones && errors.observaciones)}
            aria-describedby={
              touched.observaciones && errors.observaciones ? 'crop-observaciones-error' : undefined
            }
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all resize-none ${
              touched.observaciones && errors.observaciones
                ? 'border-red-400'
                : 'border-gray-200 focus:border-[var(--color-arona-500)]'
            }`}
          />
          {touched.observaciones && errors.observaciones && (
            <p id="crop-observaciones-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
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
                {initialData ? 'Guardar Cambios' : 'Registrar Cultivo'}
              </>
            )}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
};
