import axios, { type AxiosInstance } from 'axios';
import type { ExtendedApiError } from './errorUtils';

const SESSION_EXPIRED_EVENT = 'arona:session-expired';
const FORBIDDEN_ACCESS_EVENT = 'arona:forbidden-access';

export const TOKEN_STORAGE_KEY = 'arona_token';
export const USER_STORAGE_KEY = 'arona_user';

export interface HttpClientOptions {
  baseURL: string;
  handleAuthRedirects?: boolean;
  handleAnalyticsStatuses?: boolean;
}

export function onSessionExpired(callback: () => void): () => void {
  window.addEventListener(SESSION_EXPIRED_EVENT, callback);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, callback);
}

export function onForbiddenAccess(callback: (message: string) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ message?: string }>;
    callback(
      customEvent.detail?.message ||
        'Acceso denegado: no cuenta con permisos suficientes para esta operación.'
    );
  };
  window.addEventListener(FORBIDDEN_ACCESS_EVENT, handler);
  return () => window.removeEventListener(FORBIDDEN_ACCESS_EVENT, handler);
}

/**
 * Validates and URL-encodes a dynamic path parameter before interpolating into a route.
 */
export function encodePathParam(value: string | number | null | undefined, paramName = 'id'): string {
  if (value === null || value === undefined || String(value).trim() === '') {
    throw new Error(`Parámetro de ruta obligatorio ausente: ${paramName}`);
  }
  return encodeURIComponent(String(value).trim());
}

/**
 * Runtime contract guard: ensures an API collection response is genuinely an array.
 */
export function ensureArrayResponse<T>(data: unknown, resourceLabel: string): T[] {
  if (!Array.isArray(data)) {
    throw new Error(`Respuesta inválida del servidor al consultar ${resourceLabel}.`);
  }
  return data as T[];
}

/**
 * Runtime contract guard: ensures an API entity response is a non-null object.
 */
export function ensureObjectResponse<T extends Record<string, unknown>>(
  data: unknown,
  resourceLabel: string
): T {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error(`Respuesta inválida del servidor para ${resourceLabel}.`);
  }
  return data as T;
}

/**
 * Shared Axios transport factory used by both transactional and analytics services.
 */
export function createHttpClient(options: HttpClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL: options.baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    (rawError: ExtendedApiError) => {
      const status = rawError.response?.status;

      if (status === 401 && options.handleAuthRedirects) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login';
        }
      } else if (status === 403) {
        const detail =
          rawError.response?.data?.message ||
          rawError.response?.data?.detalle ||
          'Acceso denegado: no tiene permisos para realizar esta acción.';
        rawError.forbiddenMessage = detail;
        window.dispatchEvent(
          new CustomEvent(FORBIDDEN_ACCESS_EVENT, { detail: { message: detail } })
        );
      }

      if (options.handleAnalyticsStatuses) {
        if (status === 503) {
          rawError.isServiceUnavailable = true;
          const headers = rawError.response?.headers;
          rawError.retryAfter =
            (headers?.['retry-after'] as string | undefined) ||
            (headers?.['Retry-After'] as string | undefined) ||
            null;
        }
        if ((status === 400 || status === 500) && rawError.response?.data?.detalle) {
          rawError.detalle = rawError.response.data.detalle;
        }
      }

      return Promise.reject(rawError);
    }
  );

  return client;
}

const mainBaseURL = import.meta.env.VITE_API_URL || '/api';
const analyticsBaseURL =
  import.meta.env.VITE_ANALYTICS_API_URL || 'http://localhost:5000/api';

export const apiClient = createHttpClient({
  baseURL: mainBaseURL,
  handleAuthRedirects: true,
});

export const analyticsClient = createHttpClient({
  baseURL: analyticsBaseURL,
  handleAuthRedirects: false,
  handleAnalyticsStatuses: true,
});

export default apiClient;
