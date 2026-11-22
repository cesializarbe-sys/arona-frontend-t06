import React, { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../../../shared/context/ToastContext';
import { extractApiErrorMessage } from '../../../shared/api/errorUtils';

interface LoginFormState {
  email: string;
  password: string;
  remember: boolean;
}

type LoginErrors = Partial<Record<'email' | 'password', string>>;

type SubmissionState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string };

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { error: toastError, info: toastInfo } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<LoginFormState>({
    email: '',
    password: '',
    remember: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submission, setSubmission] = useState<SubmissionState>({ status: 'idle' });
  const [errors, setErrors] = useState<LoginErrors>({});

  const isLoading = submission.status === 'submitting';
  const errorMessage = submission.status === 'error' ? submission.message : '';

  const validate = (): LoginErrors => {
    const errs: LoginErrors = {};
    if (!formData.email.trim()) {
      errs.email = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Ingrese un correo electrónico válido';
    }

    if (!formData.password) {
      errs.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      errs.password = 'Mínimo 6 caracteres';
    }

    return errs;
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (submission.status === 'error') {
      setSubmission({ status: 'idle' });
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmission({ status: 'submitting' });

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });
      setSubmission({ status: 'idle' });
      navigate('/dashboard');
    } catch (err) {
      const msg = extractApiErrorMessage(err, 'Credenciales inválidas. Intente nuevamente.');
      setSubmission({ status: 'error', message: msg });
      toastError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#1B5E20]">
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-emerald-800 to-amber-700 opacity-95" />
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920')",
        }}
      />

      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-4 animate-scale-in">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/40">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-3.5">
              <div className="w-12 h-12 bg-[var(--color-arona-500)] rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-700/20">
                <span className="material-icons-outlined text-white text-2xl">eco</span>
              </div>
              <span className="text-3xl font-extrabold text-[var(--color-arona-500)] tracking-tight">
                Arona
              </span>
            </div>
            <h1 className="text-lg font-bold text-gray-800 leading-tight">
              Sociedad Agrícola Arona S.A.
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 font-medium">
              Plataforma Integral de Gestión y Trazabilidad Agrícola
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="operador@arona.com.pe"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                  className={`w-full pl-4 pr-10 py-3 bg-emerald-50/40 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all placeholder-gray-400 ${
                    errors.email
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-gray-200 focus:border-[var(--color-arona-500)]'
                  }`}
                />
                <span className="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">
                  mail
                </span>
              </div>
              {errors.email && (
                <p id="login-email-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span className="material-icons-outlined text-xs">error</span> {errors.email}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-600"
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() =>
                    toastInfo('Por favor solicite el restablecimiento al Administrador de TI.')
                  }
                  className="text-xs text-[var(--color-arona-500)] hover:underline font-medium bg-transparent border-none cursor-pointer p-0"
                >
                  ¿Olvidó contraseña?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  className={`w-full pl-4 pr-11 py-3 bg-emerald-50/40 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all placeholder-gray-400 ${
                    errors.password
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-gray-200 focus:border-[var(--color-arona-500)]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer flex items-center justify-center p-1"
                >
                  <span className="material-icons-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.password && (
                <p id="login-password-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <span className="material-icons-outlined text-xs">error</span> {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="remember"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-[var(--color-arona-500)] focus:ring-[var(--color-arona-500)] cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-gray-600 cursor-pointer select-none">
                Recordar en este equipo
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="arona-btn-primary w-full justify-center py-3.5 text-base font-semibold shadow-lg shadow-emerald-700/25 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin material-icons-outlined text-xl">refresh</span>
                  Validando credenciales...
                </>
              ) : (
                <>
                  Iniciar Sesión
                  <span className="material-icons-outlined text-xl">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {errorMessage && (
            <div
              role="alert"
              className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 animate-fade-in flex items-center gap-2"
            >
              <span className="material-icons-outlined text-base">error_outline</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="text-center mt-8 pt-4 border-t border-gray-100 space-y-3">
            <p className="text-xs text-gray-600">
              ¿No tiene una cuenta asignada?{' '}
              <Link to="/auth/register" className="text-[var(--color-arona-500)] font-bold hover:underline">
                Regístrese aquí
              </Link>
            </p>
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
              <span className="material-icons-outlined text-base text-[var(--color-arona-500)]">
                admin_panel_settings
              </span>
              <Link
                to="/auth/login-admin"
                className="hover:text-[var(--color-arona-500)] transition-colors font-medium"
              >
                Acceso Administrador del Sistema
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
