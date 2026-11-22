/**
 * Repositorio de órdenes de despacho persistido en localStorage.
 * Expone una interfaz asíncrona (como un API REST) para que la vista
 * pueda reemplazarse por un backend real sin cambiar hooks ni componentes.
 */
import { DISPATCHES_STORAGE_KEY } from '../constants';
import { committedKgByHarvest } from '../utils/dispatchCalculations';
import type { DispatchCreatePayload, DispatchRecord } from '../types';

const SIMULATED_LATENCY_MS = 600;

export class DispatchApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DispatchApiError';
  }
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

function isDispatchRecord(value: unknown): value is DispatchRecord {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<DispatchRecord>;
  return typeof v.id === 'string' && typeof v.codigo === 'string' && Array.isArray(v.lines);
}

function readAll(): DispatchRecord[] {
  const raw = localStorage.getItem(DISPATCHES_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isDispatchRecord) : [];
  } catch {
    return [];
  }
}

function writeAll(items: DispatchRecord[]): void {
  try {
    localStorage.setItem(DISPATCHES_STORAGE_KEY, JSON.stringify(items));
  } catch {
    throw new DispatchApiError('No se pudo guardar la orden (almacenamiento local lleno o bloqueado).');
  }
}

function nextCode(items: DispatchRecord[]): string {
  const max = items.reduce((acc, d) => {
    const n = Number(d.codigo.replace(/\D/g, ''));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `DSP-${String(max + 1).padStart(5, '0')}`;
}

export const dispatchesApi = {
  getAll: async (signal?: AbortSignal): Promise<DispatchRecord[]> => {
    await wait(250, signal);
    return readAll().sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
  },

  /**
   * Registra la orden. Re-valida el stock contra lo ya despachado al momento de
   * guardar (otro usuario/pestaña pudo consumirlo) igual que lo haría el backend.
   */
  create: async (
    payload: DispatchCreatePayload,
    stockByHarvest: ReadonlyMap<string, number>
  ): Promise<DispatchRecord> => {
    await wait(SIMULATED_LATENCY_MS);
    const items = readAll();
    const committed = committedKgByHarvest(items);

    for (const line of payload.lines) {
      const harvested = stockByHarvest.get(line.harvestId);
      if (harvested == null) {
        throw new DispatchApiError(`El lote #${line.harvestId} ya no está activo.`);
      }
      const available = harvested - (committed.get(line.harvestId) ?? 0);
      if (line.cantidadKg > available + 1e-9) {
        throw new DispatchApiError(
          `Stock insuficiente en el lote #${line.harvestId}: disponible ${Math.max(0, available).toFixed(2)} kg. Actualice los lotes e intente nuevamente.`
        );
      }
    }

    const record: DispatchRecord = {
      ...payload,
      id: crypto.randomUUID(),
      codigo: nextCode(items),
      estado: 'REGISTRADO',
      creadoEn: new Date().toISOString(),
    };
    writeAll([record, ...items]);
    return record;
  },

  annul: async (id: string): Promise<DispatchRecord> => {
    await wait(400);
    const items = readAll();
    const target = items.find((d) => d.id === id);
    if (!target) throw new DispatchApiError('La orden no existe.');
    if (target.estado === 'ANULADO') throw new DispatchApiError('La orden ya estaba anulada.');
    const updated: DispatchRecord = { ...target, estado: 'ANULADO' };
    writeAll(items.map((d) => (d.id === id ? updated : d)));
    return updated;
  },
};
