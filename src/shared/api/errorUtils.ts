import type { AxiosError } from 'axios';

export interface ServerErrorBody {
  message?: string;
  detalle?: string;
  error?: string;
  parametro?: string;
}

export interface ExtendedApiError extends AxiosError<ServerErrorBody> {
  isServiceUnavailable?: boolean;
  retryAfter?: string | null;
  detalle?: string;
  forbiddenMessage?: string;
}

/**
 * True when the error comes from an aborted request (AbortController / axios cancel).
 */
export function isRequestCanceled(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const candidate = err as { name?: string; code?: string };
  return candidate.name === 'CanceledError' || candidate.code === 'ERR_CANCELED';
}

/**
 * Extracts a safe, user-facing error message from an Axios/API or runtime error
 * without exposing raw internal stack traces.
 */
export function extractApiErrorMessage(err: unknown, fallbackMessage: string): string {
  if (!err) return fallbackMessage;

  if (typeof err === 'object' && err !== null) {
    const apiErr = err as ExtendedApiError;
    const status = apiErr.response?.status;
    const body = apiErr.response?.data;

    if (apiErr.forbiddenMessage) {
      return apiErr.forbiddenMessage;
    }

    if (status === 403) {
      return body?.message || body?.detalle || 'No tiene permisos para realizar esta acción.';
    }

    const serverMessage =
      apiErr.detalle ||
      body?.detalle ||
      body?.message ||
      body?.error;

    if (typeof serverMessage === 'string' && serverMessage.trim().length > 0) {
      return serverMessage.trim();
    }

    if (apiErr.code === 'ERR_NETWORK') {
      return 'No se pudo conectar con el servidor. Verifique su conexión.';
    }

    if (err instanceof Error && err.message.trim().length > 0) {
      return err.message.trim();
    }
  }

  return fallbackMessage;
}
