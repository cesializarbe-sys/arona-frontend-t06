import React, { useState, useEffect, type ChangeEvent, type FocusEvent, type FormEvent } from 'react';
import { ModalDialog } from '../../../shared/components/ModalDialog';
import { backendDateToInput, inputDateToBackend } from '../../../shared/utils/formatDate';
import { kgToTonNum, tonToKg } from '../../../shared/utils/productionUtils';
import type { Crop, Field, Harvest, HarvestPayload } from '../../../shared/types/domain';

export interface HarvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: HarvestPayload) => void | Promise<void>;
  initialData?: Harvest | null;
  fields?: Field[];
  crops?: Crop[];
  isLoading?: boolean;
}

interface HarvestFormState {
  fecha: string;
  fieldId: string;
  cropId: string;
  tonsAmount: string;
  unitsCount: string;
  observaciones: string;
}

type HarvestFormKey = keyof HarvestFormState;
type HarvestFormErrors = Partial<Record<HarvestFormKey, string>>;
type HarvestFormTouched = Partial<Record<HarvestFormKey, boolean>>;

function createEmptyForm(): HarvestFormState {
  return {
    fecha: new Date().toISOString().split('T')[0],
    fieldId: '',
    cropId: '',
    tonsAmount: '',
    unitsCount: '',
    observaciones: '',
  };
}

function isHarvestFormKey(name: string): name is HarvestFormKey {
  return name in createEmptyForm();
}

function validateHarvestForm(data: HarvestFormState): HarvestFormErrors {
  const errs: HarvestFormErrors = {};
  if (!data.fecha) {
    errs.fecha = 'La fecha es obligatoria';
  } else {
    const selected = new Date(data.fecha);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (selected > today) {
      errs.fecha = 'La fecha no puede ser futura';
    }
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (selected < oneYearAgo) {
      errs.fecha = 'La fecha no puede tener más de 1 año de antigüedad';
    }
  }

  if (!data.fieldId) errs.fieldId = 'Seleccione un campo';
  if (!data.cropId) errs.cropId = 'Seleccione un cultivo';

  if (!data.tonsAmount || Number(data.tonsAmount) <= 0) {
    errs.tonsAmount = 'La cantidad debe ser mayor que 0';
  } else if (Number(data.tonsAmount) > 1000) {
    errs.tonsAmount = 'No puede superar las 1,000 toneladas';
  }

  if (
    data.unitsCount !== '' &&
    (!Number.isInteger(Number(data.unitsCount)) || Number(data.unitsCount) < 0)
  ) {
    errs.unitsCount = 'Debe ser un número entero mayor o igual a 0';
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

export const HarvestModal: React.FC<HarvestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  fields = [],
  crops = [],
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<HarvestFormState>(createEmptyForm);
  const [errors, setErrors] = useState<HarvestFormErrors>({});
  const [touched, setTouched] = useState<HarvestFormTouched>({});

  useEffect(() => {
    if (initialData) {
      const fVal =
        initialData.idCampo || initialData.campo?.id || initialData.campo?.idCampo || '';
      const cVal =
        initialData.idCultivo || initialData.cultivo?.id || initialData.cultivo?.idCultivo || '';
      const tons = kgToTonNum(initialData.cantidadKg);
      setFormData({
        fecha: backendDateToInput(initialData.fecha),
        fieldId: String(fVal),
        cropId: String(cVal),
        tonsAmount: tons != null ? String(tons) : '',
        unitsCount: initialData.cantidadUnidades != null ? String(initialData.cantidadUnidades) : '',
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

    const updated: HarvestFormState = {
      ...formData,
      fieldId,
      cropId: autoCrop ? String(autoCrop) : '',
    };
    setFormData(updated);
    if (touched.fieldId) {
      setErrors(validateHarvestForm(updated));
    }
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    if (!isHarvestFormKey(name)) return;
    const updated: HarvestFormState = { ...formData, [name]: value };
    setFormData(updated);
    if (touched[name]) {
      setErrors(validateHarvestForm(updated));
    }
  };

  const handleBlur = (
    event: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name } = event.target;
    if (!isHarvestFormKey(name)) return;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validateHarvestForm(formData));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({
      fecha: true,
      fieldId: true,
      cropId: true,
      tonsAmount: true,
      unitsCount: true,
      observaciones: true,
    });
    const errs = validateHarvestForm(formData);
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      const payload: HarvestPayload = {
        fecha: inputDateToBackend(formData.fecha),
        idCampo: String(formData.fieldId),
        idCultivo: String(formData.cropId),
        cantidadKg: tonToKg(Number(formData.tonsAmount)),
        cantidadUnidades: formData.unitsCount ? Number(formData.unitsCount) : 0,
        observaciones: formData.observaciones.trim(),
      };
      void onSubmit(payload);
    }
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="harvest-modal-title"
      isBusy={isLoading}
    >
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h2 id="harvest-modal-title" className="text-xl font-bold text-[var(--color-text-primary)]">
            {initialData ? 'Editar Cosecha' : 'Nueva Cosecha'}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Ingrese los registros pesados de la producción cosechada
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
        <div>
          <label
            htmlFor="harvest-fecha"
            className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
          >
            Fecha de Cosecha *
          </label>
          <input
            id="harvest-fecha"
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(touched.fecha && errors.fecha)}
            aria-describedby={touched.fecha && errors.fecha ? 'harvest-fecha-error' : undefined}
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
              touched.fecha && errors.fecha
                ? 'border-red-400'
                : 'border-gray-200 focus:border-[var(--color-arona-500)]'
            }`}
          />
          {touched.fecha && errors.fecha && (
            <p id="harvest-fecha-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <span className="material-icons-outlined text-xs">error</span> {errors.fecha}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="harvest-fieldId"
            className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
          >
            Campo / Lote *
          </label>
          <select
            id="harvest-fieldId"
            name="fieldId"
            value={formData.fieldId}
            onChange={handleFieldChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(touched.fieldId && errors.fieldId)}
            aria-describedby={touched.fieldId && errors.fieldId ? 'harvest-fieldId-error' : undefined}
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
            <p id="harvest-fieldId-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <span className="material-icons-outlined text-xs">error</span> {errors.fieldId}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="harvest-cropId"
            className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
          >
            Cultivo *
          </label>
          <select
            id="harvest-cropId"
            name="cropId"
            value={formData.cropId}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(touched.cropId && errors.cropId)}
            aria-describedby={touched.cropId && errors.cropId ? 'harvest-cropId-error' : undefined}
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
              touched.cropId && errors.cropId
                ? 'border-red-400'
                : 'border-gray-200 focus:border-[var(--color-arona-500)]'
            }`}
          >
            <option value="">— Seleccionar cultivo —</option>
            {filteredCrops.map((crop) => {
              const cId = crop.id || crop.idCultivo;
              return (
                <option key={cId} value={cId}>
                  {crop.nombre} ({crop.tipoCultivo})
                </option>
              );
            })}
          </select>
          {touched.cropId && errors.cropId && (
            <p id="harvest-cropId-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <span className="material-icons-outlined text-xs">error</span> {errors.cropId}
            </p>
          )}
          {formData.fieldId && filteredCrops.length === 0 && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <span className="material-icons-outlined text-xs">warning</span> No hay cultivos
              registrados en este lote
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="harvest-tonsAmount"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Cantidad (t) *
            </label>
            <input
              id="harvest-tonsAmount"
              type="number"
              name="tonsAmount"
              step="0.01"
              min="0.01"
              max="1000"
              value={formData.tonsAmount}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="0.00"
              aria-invalid={Boolean(touched.tonsAmount && errors.tonsAmount)}
              aria-describedby={
                touched.tonsAmount && errors.tonsAmount ? 'harvest-tonsAmount-error' : undefined
              }
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
                touched.tonsAmount && errors.tonsAmount
                  ? 'border-red-400'
                  : 'border-gray-200 focus:border-[var(--color-arona-500)]'
              }`}
            />
            {touched.tonsAmount && errors.tonsAmount && (
              <p id="harvest-tonsAmount-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span> {errors.tonsAmount}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="harvest-unitsCount"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Jabas / Cajas
            </label>
            <input
              id="harvest-unitsCount"
              type="number"
              name="unitsCount"
              step="1"
              min="0"
              value={formData.unitsCount}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="0"
              aria-invalid={Boolean(touched.unitsCount && errors.unitsCount)}
              aria-describedby={
                touched.unitsCount && errors.unitsCount ? 'harvest-unitsCount-error' : undefined
              }
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
                touched.unitsCount && errors.unitsCount
                  ? 'border-red-400'
                  : 'border-gray-200 focus:border-[var(--color-arona-500)]'
              }`}
            />
            {touched.unitsCount && errors.unitsCount && (
              <p id="harvest-unitsCount-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span> {errors.unitsCount}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="harvest-observaciones"
            className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
          >
            Observaciones *
          </label>
          <textarea
            id="harvest-observaciones"
            name="observaciones"
            rows={3}
            value={formData.observaciones}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Notas de pesaje, cuadrilla, calibre..."
            aria-invalid={Boolean(touched.observaciones && errors.observaciones)}
            aria-describedby={
              touched.observaciones && errors.observaciones
                ? 'harvest-observaciones-error'
                : undefined
            }
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all resize-none ${
              touched.observaciones && errors.observaciones
                ? 'border-red-400'
                : 'border-gray-200 focus:border-[var(--color-arona-500)]'
            }`}
          />
          {touched.observaciones && errors.observaciones && (
            <p id="harvest-observaciones-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
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
                {initialData ? 'Guardar Cambios' : 'Registrar Cosecha'}
              </>
            )}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
};
