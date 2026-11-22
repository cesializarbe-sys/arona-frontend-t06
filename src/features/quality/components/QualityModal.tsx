import React, { useState, useEffect, type ChangeEvent, type FocusEvent, type FormEvent } from 'react';
import { ModalDialog } from '../../../shared/components/ModalDialog';
import { backendDateToInput, inputDateToBackend } from '../../../shared/utils/formatDate';
import { kgToTonDisplay } from '../../../shared/utils/productionUtils';
import { useAuth } from '../../auth/context/AuthContext';
import type {
  Harvest,
  QualityReview,
  QualityReviewPayload,
  User,
} from '../../../shared/types/domain';

export interface QualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: QualityReviewPayload) => void | Promise<void>;
  initialData?: QualityReview | null;
  harvests?: Harvest[];
  users?: User[];
  isLoading?: boolean;
}

interface QualityFormState {
  selectedHarvestId: string;
  selectedSupervisorId: string;
  fecha: string;
  cumpleRequisitos: boolean;
  observaciones: string;
}

type QualityFormKey = keyof QualityFormState;
type QualityFormErrors = Partial<Record<QualityFormKey, string>>;
type QualityFormTouched = Partial<Record<QualityFormKey, boolean>>;

function createEmptyForm(harvestId: string, supervisorId: string): QualityFormState {
  return {
    selectedHarvestId: harvestId,
    selectedSupervisorId: supervisorId,
    fecha: new Date().toISOString().split('T')[0],
    cumpleRequisitos: true,
    observaciones: '',
  };
}

function isQualityFormKey(name: string): name is QualityFormKey {
  return name in createEmptyForm('', '');
}

function validateQualityForm(data: QualityFormState): QualityFormErrors {
  const errs: QualityFormErrors = {};
  if (!data.selectedHarvestId) errs.selectedHarvestId = 'Seleccione una cosecha para auditar';
  if (!data.selectedSupervisorId) errs.selectedSupervisorId = 'Seleccione un supervisor responsable';
  if (!data.fecha) errs.fecha = 'La fecha de revisión es obligatoria';

  if (!data.cumpleRequisitos && !data.observaciones.trim()) {
    errs.observaciones =
      'Las observaciones son obligatorias cuando la revisión no cumple requisitos (rechazada)';
  } else if (data.observaciones.trim()) {
    if (data.observaciones.trim().length < 10) {
      errs.observaciones = 'Mínimo 10 caracteres';
    } else if (data.observaciones.trim().length > 500) {
      errs.observaciones = 'Máximo 500 caracteres';
    }
  }
  return errs;
}

export const QualityModal: React.FC<QualityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  harvests = [],
  users = [],
  isLoading = false,
}) => {
  const { currentUser } = useAuth();
  const currentUserId = String(currentUser?.id || '');

  const [formData, setFormData] = useState<QualityFormState>(() => createEmptyForm('', ''));
  const [errors, setErrors] = useState<QualityFormErrors>({});
  const [touched, setTouched] = useState<QualityFormTouched>({});

  useEffect(() => {
    if (initialData) {
      const hId =
        initialData.idCosecha ??
        initialData.cosecha?.idCosecha ??
        initialData.cosecha?.id ??
        '';
      const sId =
        initialData.idUsuarioSupervisor ||
        initialData.idSupervisor ||
        initialData.supervisor?.id ||
        currentUserId;
      setFormData({
        selectedHarvestId: String(hId),
        selectedSupervisorId: String(sId),
        fecha: backendDateToInput(initialData.fecha),
        cumpleRequisitos: initialData.cumpleRequisitos ?? true,
        observaciones: initialData.observaciones || '',
      });
    } else {
      const firstHarvest = harvests[0]?.id || harvests[0]?.idCosecha || '';
      setFormData(createEmptyForm(String(firstHarvest), currentUserId));
    }
    setErrors({});
    setTouched({});
  }, [initialData, isOpen, currentUserId, harvests]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    if (!isQualityFormKey(name)) return;
    const updated: QualityFormState =
      name === 'cumpleRequisitos' && event.target instanceof HTMLInputElement
        ? { ...formData, cumpleRequisitos: event.target.checked }
        : { ...formData, [name]: value };
    setFormData(updated);
    if (touched[name]) {
      setErrors(validateQualityForm(updated));
    }
  };

  const handleBlur = (
    event: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name } = event.target;
    if (!isQualityFormKey(name)) return;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validateQualityForm(formData));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({
      selectedHarvestId: true,
      selectedSupervisorId: true,
      fecha: true,
      cumpleRequisitos: true,
      observaciones: true,
    });
    const errs = validateQualityForm(formData);
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      const payload: QualityReviewPayload = {
        idCosecha: Number(formData.selectedHarvestId),
        idSupervisor: String(formData.selectedSupervisorId),
        cumpleRequisitos: formData.cumpleRequisitos,
        observaciones: formData.observaciones.trim(),
        fecha: inputDateToBackend(formData.fecha),
      };
      void onSubmit(payload);
    }
  };

  const getHarvestOptionLabel = (h: Harvest): string => {
    const id = h.id || h.idCosecha;
    const crop = h.cultivo?.nombre || h.idCultivo || 'Cultivo';
    const field = h.campo?.nombre || h.idCampo || 'Campo';
    const tons = h.cantidadKg ? `${kgToTonDisplay(h.cantidadKg)} t` : '';
    return `#${id} · ${crop} en ${field} ${tons ? `(${tons})` : ''}`;
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="quality-modal-title"
      isBusy={isLoading}
    >
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h2 id="quality-modal-title" className="text-xl font-bold text-[var(--color-text-primary)]">
            {initialData ? 'Editar Control de Calidad' : 'Nueva Inspección de Calidad'}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Auditoría sensorial, calibre y estándares de inocuidad
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
            htmlFor="quality-selectedHarvestId"
            className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
          >
            Lote de Cosecha a Auditar *
          </label>
          <select
            id="quality-selectedHarvestId"
            name="selectedHarvestId"
            value={formData.selectedHarvestId}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(touched.selectedHarvestId && errors.selectedHarvestId)}
            aria-describedby={
              touched.selectedHarvestId && errors.selectedHarvestId
                ? 'quality-selectedHarvestId-error'
                : undefined
            }
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
              touched.selectedHarvestId && errors.selectedHarvestId
                ? 'border-red-400'
                : 'border-gray-200 focus:border-[var(--color-arona-500)]'
            }`}
          >
            <option value="">— Seleccionar cosecha —</option>
            {harvests.map((h) => {
              const hId = String(h.id || h.idCosecha);
              return (
                <option key={hId} value={hId}>
                  {getHarvestOptionLabel(h)}
                </option>
              );
            })}
          </select>
          {touched.selectedHarvestId && errors.selectedHarvestId && (
            <p id="quality-selectedHarvestId-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <span className="material-icons-outlined text-xs">error</span>{' '}
              {errors.selectedHarvestId}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="quality-selectedSupervisorId"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Supervisor Asignado *
            </label>
            <select
              id="quality-selectedSupervisorId"
              name="selectedSupervisorId"
              value={formData.selectedSupervisorId}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(touched.selectedSupervisorId && errors.selectedSupervisorId)}
              aria-describedby={
                touched.selectedSupervisorId && errors.selectedSupervisorId
                  ? 'quality-selectedSupervisorId-error'
                  : undefined
              }
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
                touched.selectedSupervisorId && errors.selectedSupervisorId
                  ? 'border-red-400'
                  : 'border-gray-200 focus:border-[var(--color-arona-500)]'
              }`}
            >
              <option value="">— Seleccionar supervisor —</option>
              {users.map((u) => {
                const uId = String(u.id || '');
                const name =
                  u.fullName ||
                  `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
                  u.email;
                return (
                  <option key={uId} value={uId}>
                    {name}
                  </option>
                );
              })}
            </select>
            {touched.selectedSupervisorId && errors.selectedSupervisorId && (
              <p id="quality-selectedSupervisorId-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span>{' '}
                {errors.selectedSupervisorId}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="quality-fecha"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Fecha de Inspección *
            </label>
            <input
              id="quality-fecha"
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(touched.fecha && errors.fecha)}
              aria-describedby={touched.fecha && errors.fecha ? 'quality-fecha-error' : undefined}
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
                touched.fecha && errors.fecha
                  ? 'border-red-400'
                  : 'border-gray-200 focus:border-[var(--color-arona-500)]'
              }`}
            />
            {touched.fecha && errors.fecha && (
              <p id="quality-fecha-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span> {errors.fecha}
              </p>
            )}
          </div>
        </div>

        <fieldset className="border-0 p-0 m-0">
          <legend className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1.5">
            Dictamen de Calidad *
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={formData.cumpleRequisitos}
              onClick={() => setFormData((prev) => ({ ...prev, cumpleRequisitos: true }))}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all border cursor-pointer ${
                formData.cumpleRequisitos
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="material-icons-outlined text-emerald-600">check_circle</span>
              Aprobado (Cumple)
            </button>

            <button
              type="button"
              aria-pressed={!formData.cumpleRequisitos}
              onClick={() => setFormData((prev) => ({ ...prev, cumpleRequisitos: false }))}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all border cursor-pointer ${
                !formData.cumpleRequisitos
                  ? 'bg-red-50 border-red-500 text-red-800 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <span className="material-icons-outlined text-red-600">cancel</span>
              Rechazado (No Cumple)
            </button>
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="quality-observaciones"
            className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
          >
            Observaciones del Inspector{' '}
            {!formData.cumpleRequisitos ? '(Obligatorio en Rechazo) *' : '(Opcional)'}
          </label>
          <textarea
            id="quality-observaciones"
            name="observaciones"
            rows={3}
            value={formData.observaciones}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={
              formData.cumpleRequisitos
                ? 'Notas de muestreo, grados Brix, firmeza...'
                : 'Detalle el motivo técnico del rechazo (ej. daño mecánico > 5%, plaga cuarentenaria)...'
            }
            aria-invalid={Boolean(touched.observaciones && errors.observaciones)}
            aria-describedby={
              touched.observaciones && errors.observaciones
                ? 'quality-observaciones-error'
                : undefined
            }
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all resize-none ${
              touched.observaciones && errors.observaciones
                ? 'border-red-400'
                : 'border-gray-200 focus:border-[var(--color-arona-500)]'
            }`}
          />
          {touched.observaciones && errors.observaciones && (
            <p id="quality-observaciones-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
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
                  {initialData ? 'save' : 'verified'}
                </span>
                {initialData ? 'Guardar Cambios' : 'Emitir Dictamen'}
              </>
            )}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
};
