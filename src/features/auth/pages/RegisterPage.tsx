import React, { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../../../shared/context/ToastContext';
import { extractApiErrorMessage } from '../../../shared/api/errorUtils';
import type { UserPayload } from '../../../shared/types/domain';

interface RegisterFormState {
  firstName: string;
  lastName: string;
  email: string;
  nationalId: string;
  phone: string;
  address: string;
  area: string;
  password: string;
  confirmPassword: string;
}

type RegisterErrors = Partial<Record<keyof RegisterFormState, string>>;

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<RegisterFormState>({
    firstName: '',
    lastName: '',
    email: '',
    nationalId: '',
    phone: '',
    address: '',
    area: 'CAMPO',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});

  const validate = (): RegisterErrors => {
    const errs: RegisterErrors = {};
    if (!formData.firstName.trim()) errs.firstName = 'El nombre es obligatorio';
    if (!formData.lastName.trim()) errs.lastName = 'Los apellidos son obligatorios';

    if (!formData.email.trim()) {
      errs.email = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Ingrese un correo electrónico válido';
    }

    if (!formData.nationalId.trim()) {
      errs.nationalId = 'El DNI es obligatorio';
    } else if (!/^\d{8}$/.test(formData.nationalId.trim())) {
      errs.nationalId = 'El DNI debe tener exactamente 8 dígitos numéricos';
    }

    if (formData.phone && !/^\d{9}$/.test(formData.phone.trim())) {
      errs.phone = 'El teléfono debe tener 9 dígitos';
    }

    if (!formData.area) errs.area = 'Seleccione un área laboral';

    if (!formData.password) {
      errs.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      errs.password = 'Mínimo 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Las contraseñas no coinciden';
    }

    return errs;
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsLoading(true);
    try {
      const payload: UserPayload = {
        fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        nationalId: formData.nationalId.trim(),
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        role: 'ENCARGADO',
        area: formData.area,
        active: true,
      };
      await register(payload);
      toastSuccess('¡Cuenta registrada exitosamente! Ahora puede iniciar sesión.');
      navigate('/auth/login');
    } catch (err) {
      toastError(extractApiErrorMessage(err, 'Error al crear la cuenta. Intente nuevamente.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#1B5E20] py-10">
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-emerald-800 to-amber-700 opacity-95" />
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920')",
        }}
      />

      <div className="relative z-10 w-full max-w-xl mx-4 animate-scale-in">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/40">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-[var(--color-arona-500)] rounded-xl flex items-center justify-center shadow-md">
                <span className="material-icons-outlined text-white text-xl">eco</span>
              </div>
              <span className="text-2xl font-bold text-[var(--color-arona-500)]">Arona</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Crear Nueva Cuenta</h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Registro de personal para operaciones agrícolas
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-firstName" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Nombres *
                </label>
                <input
                  id="reg-firstName"
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Juan Carlos"
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby={errors.firstName ? 'reg-firstName-error' : undefined}
                  className={`w-full px-3.5 py-2.5 bg-emerald-50/40 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 ${
                    errors.firstName ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                {errors.firstName && (
                  <p id="reg-firstName-error" className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="reg-lastName" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Apellidos *
                </label>
                <input
                  id="reg-lastName"
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Pérez Ramos"
                  aria-invalid={Boolean(errors.lastName)}
                  aria-describedby={errors.lastName ? 'reg-lastName-error' : undefined}
                  className={`w-full px-3.5 py-2.5 bg-emerald-50/40 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 ${
                    errors.lastName ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                {errors.lastName && (
                  <p id="reg-lastName-error" className="text-xs text-red-500 mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-email" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Correo Electrónico *
                </label>
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="juan.perez@arona.com.pe"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'reg-email-error' : undefined}
                  className={`w-full px-3.5 py-2.5 bg-emerald-50/40 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 ${
                    errors.email ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                {errors.email && (
                  <p id="reg-email-error" className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="reg-nationalId" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  DNI (8 dígitos) *
                </label>
                <input
                  id="reg-nationalId"
                  type="text"
                  name="nationalId"
                  maxLength={8}
                  value={formData.nationalId}
                  onChange={handleChange}
                  placeholder="71234567"
                  aria-invalid={Boolean(errors.nationalId)}
                  aria-describedby={errors.nationalId ? 'reg-nationalId-error' : undefined}
                  className={`w-full px-3.5 py-2.5 bg-emerald-50/40 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 ${
                    errors.nationalId ? 'border-red-400' : 'border-gray-200'
                  }`}
                />
                {errors.nationalId && (
                  <p id="reg-nationalId-error" className="text-xs text-red-500 mt-1">{errors.nationalId}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-phone" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Teléfono Móvil
                </label>
                <input
                  id="reg-phone"
                  type="text"
                  name="phone"
                  maxLength={9}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="987654321"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'reg-phone-error' : undefined}
                  className="w-full px-3.5 py-2.5 bg-emerald-50/40 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20"
                />
                {errors.phone && (
                  <p id="reg-phone-error" className="text-xs text-red-500 mt-1">{errors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="reg-area" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Área Laboral *
                </label>
                <select
                  id="reg-area"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-emerald-50/40 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20"
                >
                  <option value="CAMPO">Operaciones Campo</option>
                  <option value="ADMINISTRACION">Administración</option>
                  <option value="CALIDAD">Aseguramiento de Calidad</option>
                  <option value="LOGISTICA">Logística / Empaque</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="reg-address" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Dirección
              </label>
              <input
                id="reg-address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Av. Principal Km 14, Ica"
                className="w-full px-3.5 py-2.5 bg-emerald-50/40 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-password" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'reg-password-error' : undefined}
                    className={`w-full px-3.5 py-2.5 bg-emerald-50/40 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 ${
                      errors.password ? 'border-red-400' : 'border-gray-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0.5"
                  >
                    <span className="material-icons-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.password && (
                  <p id="reg-password-error" className="text-xs text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="reg-confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <input
                    id="reg-confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? 'reg-confirmPassword-error' : undefined}
                    className={`w-full px-3.5 py-2.5 bg-emerald-50/40 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 ${
                      errors.confirmPassword ? 'border-red-400' : 'border-gray-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Ver confirmación'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0.5"
                  >
                    <span className="material-icons-outlined text-lg">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="reg-confirmPassword-error" className="text-xs text-red-500 mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="arona-btn-primary w-full justify-center py-3.5 text-base font-semibold shadow-lg shadow-emerald-700/25 disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin material-icons-outlined text-xl">refresh</span>
                  Creando cuenta...
                </>
              ) : (
                <>
                  Registrar Cuenta
                  <span className="material-icons-outlined text-xl">person_add</span>
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-600">
              ¿Ya tiene una cuenta registrada?{' '}
              <Link to="/auth/login" className="text-[var(--color-arona-500)] font-bold hover:underline">
                Inicie sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
