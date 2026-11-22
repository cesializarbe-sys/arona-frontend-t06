export const RELOAD_FAILED_MESSAGE =
  'Se guardó, pero no se pudo actualizar la lista. Reintente.';

export interface WriteThenReloadOptions<T> {
  /** The mutation. If it rejects, the error propagates (callers keep their modal open). */
  write: () => Promise<T>;
  /** Reload that MUST reject when the refresh fails (do not swallow errors here). */
  reload: () => Promise<void>;
  successMessage: string;
  notifySuccess: (message: string) => void;
  notifyWarning: (message: string) => void;
}

/**
 * Runs a write operation and then refreshes the list.
 *
 * - write fails  -> rejects (no success toast, modal must stay open)
 * - write ok, reload ok -> success toast
 * - write ok, reload fails -> warning toast (never a bare "success"), resolves with the result
 */
export async function writeThenReload<T>({
  write,
  reload,
  successMessage,
  notifySuccess,
  notifyWarning,
}: WriteThenReloadOptions<T>): Promise<T> {
  const result = await write();
  try {
    await reload();
    notifySuccess(successMessage);
  } catch {
    notifyWarning(RELOAD_FAILED_MESSAGE);
  }
  return result;
}
