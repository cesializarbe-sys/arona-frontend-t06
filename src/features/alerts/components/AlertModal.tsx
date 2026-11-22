import React, { useState, useEffect, useMemo, type ChangeEvent, type FocusEvent, type FormEvent } from 'react';
import { ModalDialog } from '../../../shared/components/ModalDialog';
import { backendDateToInput, inputDateToBackend } from '../../../shared/utils/formatDate';
import { useAuth } from '../../auth/context/AuthContext';
import { ALERT_PROBLEM_TYPES } from '../../../shared/constants/domain';
import type {
  AlertPayload,
  Crop,
  Field,
  PhytosanitaryAlert,
  User,
} from '../../../shared/types/domain';

export interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: AlertPayload) => void | Promise<void>;
  initialData?: PhytosanitaryAlert | null;
  fields?: Field[];
  crops?: Crop[];
  users?: User[];
  isLoading?: boolean;
}

interface AlertFormState {
  fieldId: string;
  cropId: string;
  reporterUserId: string;
  tipoProblema: string;
  fechaDeteccion: string;
  descripcionProblema: string;
}

type AlertFormKey = keyof AlertFormState;
type AlertFormErrors = Partial<Record<AlertFormKey, string>>;
type AlertFormTouched = Partial<Record<AlertFormKey, boolean>>;

const PROBLEM_LABELS: Record<string, string> = {
  ENFERMEDAD: '🍂 Enfermedad (Hongo/Bacteria)',
  PLAGA: '🐛 Plaga de Insectos / Ácaros',
  OTRO: '⚠️ Fisiopatía u Otro daño',
};

function createEmptyForm(defaultReporterId: string): AlertFormState {
  return {
    fieldId: '',
    cropId: '',
    reporterUserId: defaultReporterId,
    tipoProblema: 'ENFERMEDAD',
    fechaDeteccion: new Date().toISOString().split('T')[0],
    descripcionProblema: '',
  };
}

function isAlertFormKey(name: string): name is AlertFormKey {
  return name in createEmptyForm('');
}

function validateAlertForm(data: AlertFormState, currentUserId: string): AlertFormErrors {
  const errs: AlertFormErrors = {};
  if (!data.fieldId) errs.fieldId = 'Seleccione un campo afectado';
  if (!data.reporterUserId && !currentUserId) {
    errs.reporterUserId = 'El ID del usuario que reporta es obligatorio';
  }
  if (!data.fechaDeteccion) errs.fechaDeteccion = 'La fecha de detección es obligatoria';
  if (!data.descripcionProblema.trim()) {
    errs.descripcionProblema = 'La descripción es obligatoria';
  } else if (data.descripcionProblema.trim().length < 5) {
    errs.descripcionProblema = 'Mínimo 5 caracteres';
  } else if (data.descripcionProblema.trim().length > 500) {
    errs.descripcionProblema = 'Máximo 500 caracteres';
  }
  return errs;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  fields = [],
  crops = [],
  users = [],
  isLoading = false,
}) => {
  const { currentUser, userName } = useAuth();
  const currentUserId = String(currentUser?.id || '');

  const [formData, setFormData] = useState<AlertFormState>(() => createEmptyForm(''));
  const [errors, setErrors] = useState<AlertFormErrors>({});
  const [touched, setTouched] = useState<AlertFormTouched>({});

  const userOptions = useMemo<User[]>(() => {
    const list = Array.isArray(users) ? [...users] : [];
    if (
      currentUserId &&
      !list.some((u) => String(u.id) === currentUserId)
    ) {
      list.unshift({
        id: currentUserId,
        firstName: '',
        lastName: '',
        fullName: userName || currentUser?.fullName || 'Usuario Actual',
        email: currentUser?.email || '',
      });
    }
    return list;
  }, [users, currentUserId, userName, currentUser]);

  useEffect(() => {
    if (initialData) {
      const fId =
        initialData.idCampo ||
        initialData.campoId ||
        initialData.campo?.idCampo ||
        initialData.campo?.id ||
        '';
      const cId =
        initialData.idCultivo ||
        initialData.cultivoId ||
        initialData.cultivo?.idCultivo ||
        initialData.cultivo?.id ||
        '';
      const repId =
        initialData.reporterUserId ||
        initialData.idUsuarioReporta ||
        initialData.idUsuario ||
        initialData.usuario?.id ||
        currentUserId ||
        userOptions[0]?.id ||
        '';

      setFormData({
        fieldId: String(fId),
        cropId: cId ? String(cId) : '',
        reporterUserId: String(repId),
        tipoProblema: initialData.tipoProblema || 'ENFERMEDAD',
        fechaDeteccion: backendDateToInput(initialData.fechaDeteccion),
        descripcionProblema: initialData.descripcionProblema || '',
      });
    } else {
      const defaultReporter = currentUserId || userOptions[0]?.id || '';
      setFormData(createEmptyForm(String(defaultReporter)));
    }
    setErrors({});
    setTouched({});
  }, [initialData, isOpen, currentUserId, userOptions]);

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

    const updated: AlertFormState = {
      ...formData,
      fieldId,
      cropId: autoCrop ? String(autoCrop) : '',
    };
    setFormData(updated);
    if (touched.fieldId) {
      setErrors(validateAlertForm(updated, currentUserId));
    }
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    if (!isAlertFormKey(name)) return;
    const updated: AlertFormState = { ...formData, [name]: value };
    setFormData(updated);
    if (touched[name]) {
      setErrors(validateAlertForm(updated, currentUserId));
    }
  };

  const handleBlur = (
    event: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name } = event.target;
    if (!isAlertFormKey(name)) return;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validateAlertForm(formData, currentUserId));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({
      fieldId: true,
      cropId: true,
      reporterUserId: true,
      tipoProblema: true,
      fechaDeteccion: true,
      descripcionProblema: true,
    });
    const errs = validateAlertForm(formData, currentUserId);
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      const reporterId = String(formData.reporterUserId || currentUserId || '');
      const payload: AlertPayload = {
        idCampo: String(formData.fieldId),
        campoId: String(formData.fieldId),
        idCultivo: formData.cropId ? String(formData.cropId) : null,
        cultivoId: formData.cropId ? String(formData.cropId) : null,
        reporterUserId: reporterId,
        idUsuarioReporta: reporterId,
        idUsuario: reporterId,
        tipoProblema: formData.tipoProblema,
        fechaDeteccion: inputDateToBackend(formData.fechaDeteccion),
        descripcionProblema: formData.descripcionProblema.trim(),
      };
      void onSubmit(payload);
    }
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="alert-modal-title"
      isBusy={isLoading}
    >
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h2 id="alert-modal-title" className="text-xl font-bold text-[var(--color-text-primary)]">
            {initialData ? 'Editar Alerta' : 'Reportar Alerta Fitosanitaria'}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Notifique plagas, hongos o anomalías sanitarias en los lotes
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
              htmlFor="alert-tipoProblema"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Tipo de Incidencia *
            </label>
            <select
              id="alert-tipoProblema"
              name="tipoProblema"
              value={formData.tipoProblema}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 focus:border-[var(--color-arona-500)]"
            >
              {ALERT_PROBLEM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PROBLEM_LABELS[type] || type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="alert-fechaDeteccion"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Fecha de Detección *
            </label>
            <input
              id="alert-fechaDeteccion"
              type="date"
              name="fechaDeteccion"
              value={formData.fechaDeteccion}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(touched.fechaDeteccion && errors.fechaDeteccion)}
              aria-describedby={
                touched.fechaDeteccion && errors.fechaDeteccion
                  ? 'alert-fechaDeteccion-error'
                  : undefined
              }
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
                touched.fechaDeteccion && errors.fechaDeteccion
                  ? 'border-red-400'
                  : 'border-gray-200 focus:border-[var(--color-arona-500)]'
              }`}
            />
            {touched.fechaDeteccion && errors.fechaDeteccion && (
              <p id="alert-fechaDeteccion-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span>{' '}
                {errors.fechaDeteccion}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="alert-reporterUserId"
            className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
          >
            Usuario que Reporta *
          </label>
          <select
            id="alert-reporterUserId"
            name="reporterUserId"
            value={formData.reporterUserId}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(touched.reporterUserId && errors.reporterUserId)}
            aria-describedby={
              touched.reporterUserId && errors.reporterUserId
                ? 'alert-reporterUserId-error'
                : undefined
            }
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
              touched.reporterUserId && errors.reporterUserId
                ? 'border-red-400'
                : 'border-gray-200 focus:border-[var(--color-arona-500)]'
            }`}
          >
            <option value="">— Seleccionar usuario —</option>
            {userOptions.map((u) => {
              const uId = String(u.id || '');
              const name =
                u.fullName ||
                `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
                u.email ||
                uId;
              return (
                <option key={uId} value={uId}>
                  {name} ({uId})
                </option>
              );
            })}
          </select>
          {touched.reporterUserId && errors.reporterUserId && (
            <p id="alert-reporterUserId-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <span className="material-icons-outlined text-xs">error</span>{' '}
              {errors.reporterUserId}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="alert-fieldId"
            className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
          >
            Campo / Lote Afectado *
          </label>
          <select
            id="alert-fieldId"
            name="fieldId"
            value={formData.fieldId}
            onChange={handleFieldChange}
            onBlur={handleBlur}
            aria-invalid={Boolean(touched.fieldId && errors.fieldId)}
            aria-describedby={touched.fieldId && errors.fieldId ? 'alert-fieldId-error' : undefined}
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
            <p id="alert-fieldId-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <span className="material-icons-outlined text-xs">error</span> {errors.fieldId}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="alert-cropId"
            className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
          >
            Cultivo en Lote (Opcional)
          </label>
          <select
            id="alert-cropId"
            name="cropId"
            value={formData.cropId}
            onChange={handleChange}
            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 focus:border-[var(--color-arona-500)]"
          >
            <option value="">— Todo el lote / Sin especificar —</option>
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
            htmlFor="alert-descripcionProblema"
            className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
          >
            Descripción del Síntoma o Daño *
          </label>
          <textarea
            id="alert-descripcionProblema"
            name="descripcionProblema"
            rows={3}
            value={formData.descripcionProblema}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Describa síntomas visibles, porcentaje de afectación o sospecha de patógeno..."
            aria-invalid={Boolean(touched.descripcionProblema && errors.descripcionProblema)}
            aria-describedby={
              touched.descripcionProblema && errors.descripcionProblema
                ? 'alert-descripcionProblema-error'
                : undefined
            }
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all resize-none ${
              touched.descripcionProblema && errors.descripcionProblema
                ? 'border-red-400'
                : 'border-gray-200 focus:border-[var(--color-arona-500)]'
            }`}
          />
          {touched.descripcionProblema && errors.descripcionProblema && (
            <p id="alert-descripcionProblema-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <span className="material-icons-outlined text-xs">error</span>{' '}
              {errors.descripcionProblema}
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
                  {initialData ? 'save' : 'campaign'}
                </span>
                {initialData ? 'Guardar Cambios' : 'Emitir Alerta'}
              </>
            )}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
};
