import React from 'react';

export interface AnalyticsErrorStateProps {
  isServiceUnavailable?: boolean;
  errorMessage?: string | null;
  errorParam?: string | null;
  isValidationError?: boolean;
  retryAfter?: string | null;
  onRetry?: (() => void) | null;
}

export const AnalyticsErrorState: React.FC<AnalyticsErrorStateProps> = ({
  isServiceUnavailable = false,
  errorMessage = null,
  errorParam = null,
  isValidationError = false,
  retryAfter = null,
  onRetry = null,
}) => {
  if (!isServiceUnavailable && !errorMessage) {
    return null;
  }

  if (isServiceUnavailable) {
    return (
      <div
        role="alert"
        className="arona-card p-6 border-l-4 border-amber-500 bg-amber-50/80 animate-fade-in"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <span className="material-icons-outlined text-xl">cloud_off</span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Servicio no disponible, reintente en unos minutos
              </h3>
              <p className="text-xs text-amber-800 mt-1">
                {errorMessage ||
                  'El servicio analítico o una de sus bases de datos no se encuentra disponible temporalmente (HTTP 503).'}
              </p>
              {retryAfter && (
                <p className="text-[11px] font-semibold text-amber-700 mt-1">
                  Tiempo sugerido de espera (Retry-After): {retryAfter}s
                </p>
              )}
            </div>
          </div>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              aria-label="Reintentar consulta analítica"
              className="arona-btn-outline bg-white border-amber-300 text-amber-800 hover:bg-amber-100 shrink-0 text-xs py-2 px-4"
            >
              <span className="material-icons-outlined text-base">refresh</span>
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isValidationError) {
    return (
      <div
        role="alert"
        className="arona-card p-5 border-l-4 border-orange-500 bg-orange-50/80 animate-fade-in"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
            <span className="material-icons-outlined text-lg">warning_amber</span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-orange-900">
              Parámetro de filtro inválido (400)
            </h3>
            <p className="text-xs text-orange-800 mt-0.5">{errorMessage}</p>
            {errorParam && (
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-orange-100 text-orange-900 text-[11px] font-mono">
                Parámetro: {errorParam}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="arona-card p-6 border-l-4 border-red-500 bg-red-50/70 animate-fade-in"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <span className="material-icons-outlined text-xl">error_outline</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-900">No se pudo cargar la analítica</h3>
            <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
          </div>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            aria-label="Reintentar carga de analítica"
            className="arona-btn-outline bg-white border-red-200 text-red-700 hover:bg-red-100 shrink-0 text-xs py-2 px-4"
          >
            <span className="material-icons-outlined text-base">refresh</span>
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
};

export default AnalyticsErrorState;
