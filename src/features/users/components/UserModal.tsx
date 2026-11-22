import React, { useState, useEffect, type ChangeEvent, type FocusEvent, type FormEvent } from 'react';
import { ModalDialog } from '../../../shared/components/ModalDialog';
import { USER_ROLES } from '../../../shared/constants/domain';
import type { User, UserPayload } from '../../../shared/types/domain';

export interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: UserPayload) => void | Promise<void>;
  initialData?: User | null;
  isLoading?: boolean;
}

interface UserFormState {
  fullName: string;
  email: string;
  nationalId: string;
  phone: string;
  address: string;
  password: string;
  role: string;
  area: string;
  active: boolean;
}

type UserFormKey = keyof UserFormState;
type UserFormErrors = Partial<Record<UserFormKey, string>>;
type UserFormTouched = Partial<Record<UserFormKey, boolean>>;

const EMPTY_FORM: UserFormState = {
  fullName: '',
  email: '',
  nationalId: '',
  phone: '',
  address: '',
  password: '',
  role: 'ENCARGADO',
  area: 'CAMPO',
  active: true,
};

function isUserFormKey(name: string): name is UserFormKey {
  return name in EMPTY_FORM;
}

function validateUserForm(data: UserFormState, isCreate: boolean): UserFormErrors {
  const errs: UserFormErrors = {};
  if (!data.fullName.trim()) {
    errs.fullName = 'El nombre completo es obligatorio';
  } else if (data.fullName.trim().length < 2) {
    errs.fullName = 'Mínimo 2 caracteres';
  } else if (data.fullName.length > 100) {
    errs.fullName = 'Máximo 100 caracteres';
  }

  if (!data.email.trim()) {
    errs.email = 'El correo es obligatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errs.email = 'Ingrese un correo electrónico válido';
  }

  if (data.nationalId && !/^\d{8}$/.test(data.nationalId)) {
    errs.nationalId = 'El DNI debe tener 8 dígitos numéricos';
  }

  if (data.phone && !/^\d{9}$/.test(data.phone)) {
    errs.phone = 'El teléfono debe tener 9 dígitos numéricos';
  }

  if (isCreate) {
    if (!data.password) {
      errs.password = 'La contraseña es obligatoria';
    } else if (data.password.length < 6) {
      errs.password = 'Mínimo 6 caracteres';
    }
  } else if (data.password && data.password.length < 6) {
    errs.password = 'Mínimo 6 caracteres si desea cambiarla';
  }

  return errs;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  isLoading = false,
}) => {
  const isCreate = !initialData;
  const [formData, setFormData] = useState<UserFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<UserFormErrors>({});
  const [touched, setTouched] = useState<UserFormTouched>({});

  useEffect(() => {
    if (initialData) {
      const name =
        initialData.fullName ||
        `${initialData.firstName || ''} ${initialData.lastName || ''}`.trim() ||
        '';
      setFormData({
        fullName: name,
        email: initialData.email || '',
        nationalId: initialData.nationalId || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        password: '',
        role: initialData.role || 'ENCARGADO',
        area: initialData.area || 'CAMPO',
        active: initialData.active ?? true,
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setErrors({});
    setTouched({});
  }, [initialData, isOpen]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    if (!isUserFormKey(name)) return;
    const updated: UserFormState =
      name === 'active' && event.target instanceof HTMLInputElement
        ? { ...formData, active: event.target.checked }
        : { ...formData, [name]: value };
    setFormData(updated);
    if (touched[name]) {
      setErrors(validateUserForm(updated, isCreate));
    }
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = event.target;
    if (!isUserFormKey(name)) return;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validateUserForm(formData, isCreate));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({
      fullName: true,
      email: true,
      nationalId: true,
      phone: true,
      address: true,
      password: true,
      role: true,
      area: true,
      active: true,
    });
    const errs = validateUserForm(formData, isCreate);
    setErrors(errs);

    if (Object.keys(errs).length === 0) {
      const parts = formData.fullName.trim().split(/\s+(.*)/s);
      const payload: UserPayload = {
        fullName: formData.fullName.trim(),
        firstName: parts[0] || '',
        lastName: parts[1] || '',
        email: formData.email.trim(),
        nationalId: formData.nationalId.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        role: formData.role,
        area: formData.area,
        active: formData.active,
      };
      if (formData.password) {
        payload.password = formData.password;
      }
      void onSubmit(payload);
    }
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="user-modal-title"
      isBusy={isLoading}
    >
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h2 id="user-modal-title" className="text-xl font-bold text-[var(--color-text-primary)]">
            {isCreate ? 'Nuevo Usuario' : 'Editar Usuario'}
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Administración de cuentas, accesos y roles del sistema
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
            htmlFor="user-fullName"
            className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
          >
            Nombre Completo *
          </label>
          <input
            id="user-fullName"
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ej: Juan Pérez Morales"
            aria-invalid={Boolean(touched.fullName && errors.fullName)}
            aria-describedby={
              touched.fullName && errors.fullName
                ? 'user-fullName-error'
                : undefined
            }
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
              touched.fullName && errors.fullName
                ? 'border-red-400'
                : 'border-gray-200 focus:border-[var(--color-arona-500)]'
            }`}
          />
          {touched.fullName && errors.fullName && (
            <p id="user-fullName-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <span className="material-icons-outlined text-xs">error</span> {errors.fullName}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="user-email"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Correo Institucional *
            </label>
            <input
              id="user-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="usuario@arona.com.pe"
              aria-invalid={Boolean(touched.email && errors.email)}
              aria-describedby={touched.email && errors.email ? 'user-email-error' : undefined}
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
                touched.email && errors.email
                  ? 'border-red-400'
                  : 'border-gray-200 focus:border-[var(--color-arona-500)]'
              }`}
            />
            {touched.email && errors.email && (
              <p id="user-email-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span> {errors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="user-password"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              {isCreate ? 'Contraseña *' : 'Nueva Contraseña (Opcional)'}
            </label>
            <input
              id="user-password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder={isCreate ? '••••••••' : 'Dejar en blanco para conservar'}
              aria-invalid={Boolean(touched.password && errors.password)}
              aria-describedby={touched.password && errors.password ? 'user-password-error' : undefined}
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
                touched.password && errors.password
                  ? 'border-red-400'
                  : 'border-gray-200 focus:border-[var(--color-arona-500)]'
              }`}
            />
            {touched.password && errors.password && (
              <p id="user-password-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span> {errors.password}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="user-nationalId"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              DNI (8 dígitos)
            </label>
            <input
              id="user-nationalId"
              type="text"
              name="nationalId"
              maxLength={8}
              value={formData.nationalId}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="12345678"
              aria-invalid={Boolean(touched.nationalId && errors.nationalId)}
              aria-describedby={touched.nationalId && errors.nationalId ? 'user-nationalId-error' : undefined}
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
                touched.nationalId && errors.nationalId
                  ? 'border-red-400'
                  : 'border-gray-200 focus:border-[var(--color-arona-500)]'
              }`}
            />
            {touched.nationalId && errors.nationalId && (
              <p id="user-nationalId-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span> {errors.nationalId}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="user-phone"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Teléfono (9 dígitos)
            </label>
            <input
              id="user-phone"
              type="text"
              name="phone"
              maxLength={9}
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="987654321"
              aria-invalid={Boolean(touched.phone && errors.phone)}
              aria-describedby={
                touched.phone && errors.phone ? 'user-phone-error' : undefined
              }
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all ${
                touched.phone && errors.phone
                  ? 'border-red-400'
                  : 'border-gray-200 focus:border-[var(--color-arona-500)]'
              }`}
            />
            {touched.phone && errors.phone && (
              <p id="user-phone-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span> {errors.phone}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="user-role"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Rol del Sistema *
            </label>
            <select
              id="user-role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 focus:border-[var(--color-arona-500)]"
            >
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r === 'ADMINISTRADOR' ? 'Administrador General' : 'Encargado de Campo'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="user-area"
              className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
            >
              Área Laboral *
            </label>
            <select
              id="user-area"
              name="area"
              value={formData.area}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 focus:border-[var(--color-arona-500)]"
            >
              <option value="CAMPO">Operaciones Campo</option>
              <option value="ADMINISTRACION">Administración</option>
              <option value="CALIDAD">Aseguramiento de Calidad</option>
              <option value="LOGISTICA">Logística y Despacho</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="user-address"
            className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
          >
            Dirección Domiciliaria
          </label>
          <input
            id="user-address"
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Ej: Av. Los Libertadores 450, Ica"
            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 focus:border-[var(--color-arona-500)]"
          />
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
                  {isCreate ? 'person_add' : 'save'}
                </span>
                {isCreate ? 'Registrar Usuario' : 'Guardar Cambios'}
              </>
            )}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
};
