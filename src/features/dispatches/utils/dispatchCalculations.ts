import type { Crop, Field, Harvest } from '../../../shared/types/domain';
import { DEFAULT_PRICE_USD_KG, DISPATCH_LIMITS, REFERENCE_PRICE_USD_KG } from '../constants';
import type {
  DispatchDraft,
  DispatchLineDraft,
  DispatchLineView,
  DispatchRecord,
  DispatchTotals,
  DispatchValidation,
  HarvestLot,
  HeaderErrors,
  LineErrors,
} from '../types';

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

const DECIMAL_2_REGEX = /^\d+([.,]\d{1,2})?$/;

/** Convierte texto del input en número (acepta coma decimal). NaN si no es válido. */
export function parseDecimal(value: string): number {
  const trimmed = value.trim();
  if (!DECIMAL_2_REGEX.test(trimmed)) return Number.NaN;
  return Number(trimmed.replace(',', '.'));
}

export function todayInputDate(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function referencePriceFor(tipoCultivo: string): number {
  return REFERENCE_PRICE_USD_KG[tipoCultivo.toUpperCase()] ?? DEFAULT_PRICE_USD_KG;
}

/** Kg ya comprometidos por lote en despachos registrados (no anulados). */
export function committedKgByHarvest(dispatches: readonly DispatchRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const d of dispatches) {
    if (d.estado === 'ANULADO') continue;
    for (const line of d.lines) {
      map.set(line.harvestId, round2((map.get(line.harvestId) ?? 0) + line.cantidadKg));
    }
  }
  return map;
}

/**
 * Integra Cosecha + Campo + Cultivo + Despachos previos para obtener los lotes
 * despachables con su stock disponible.
 */
export function buildHarvestLots(
  harvests: readonly Harvest[],
  fields: readonly Field[],
  crops: readonly Crop[],
  dispatches: readonly DispatchRecord[]
): HarvestLot[] {
  const fieldById = new Map<string, Field>();
  fields.forEach((f) => {
    fieldById.set(String(f.id), f);
    fieldById.set(String(f.idCampo), f);
  });
  const cropById = new Map<string, Crop>();
  crops.forEach((c) => {
    cropById.set(String(c.id), c);
    cropById.set(String(c.idCultivo), c);
  });
  const committed = committedKgByHarvest(dispatches);

  return harvests
    .filter((h) => h.estado !== false && Number(h.cantidadKg) > 0)
    .map((h) => {
      const harvestId = String(h.id || h.idCosecha);
      const fieldKey = String(h.idCampo ?? h.campo?.id ?? h.campo?.idCampo ?? '');
      const cropKey = String(h.idCultivo ?? h.cultivo?.id ?? h.cultivo?.idCultivo ?? '');
      const field = fieldById.get(fieldKey);
      const crop = cropById.get(cropKey);
      const cosechado = Number(h.cantidadKg) || 0;
      return {
        harvestId,
        fecha: h.fecha,
        campoNombre: field?.nombre ?? h.campo?.nombre ?? '—',
        cultivoNombre: crop?.nombre ?? h.cultivo?.nombre ?? '—',
        tipoCultivo: crop?.tipoCultivo ?? '',
        cantidadCosechadaKg: cosechado,
        disponibleKg: Math.max(0, round2(cosechado - (committed.get(harvestId) ?? 0))),
      };
    });
}

export function filterLots(lots: readonly HarvestLot[], term: string): HarvestLot[] {
  const q = term.trim().toLowerCase();
  if (!q) return [...lots];
  return lots.filter((l) =>
    [l.harvestId, l.campoNombre, l.cultivoNombre, l.tipoCultivo, l.fecha]
      .join(' ')
      .toLowerCase()
      .includes(q)
  );
}

export function computeLineViews(
  lines: readonly DispatchLineDraft[],
  lotsById: ReadonlyMap<string, HarvestLot>
): DispatchLineView[] {
  return lines.map((line) => {
    const cantidadNum = parseDecimal(line.cantidadKg);
    const precioNum = parseDecimal(line.precioKg);
    const subtotal =
      Number.isFinite(cantidadNum) && Number.isFinite(precioNum) ? round2(cantidadNum * precioNum) : 0;
    return {
      ...line,
      lot: lotsById.get(line.harvestId) ?? null,
      cantidadNum,
      precioNum,
      subtotal,
    };
  });
}

export function computeTotals(lineViews: readonly DispatchLineView[]): DispatchTotals {
  return lineViews.reduce<DispatchTotals>(
    (acc, l) => ({
      totalKg: round2(acc.totalKg + (Number.isFinite(l.cantidadNum) ? l.cantidadNum : 0)),
      totalUsd: round2(acc.totalUsd + l.subtotal),
      lineCount: acc.lineCount + 1,
    }),
    { totalKg: 0, totalUsd: 0, lineCount: 0 }
  );
}

export function validateDispatch(
  draft: DispatchDraft,
  lineViews: readonly DispatchLineView[],
  totals: DispatchTotals,
  today: string = todayInputDate()
): DispatchValidation {
  const header: HeaderErrors = {};
  const { clienteId, fechaDespacho, puertoEmbarque, observaciones } = draft.header;

  if (!clienteId) header.clienteId = 'Seleccione el cliente importador.';
  if (!fechaDespacho) header.fechaDespacho = 'La fecha de despacho es obligatoria.';
  else if (fechaDespacho < today) header.fechaDespacho = 'La fecha de despacho no puede ser anterior a hoy.';
  if (!puertoEmbarque) header.puertoEmbarque = 'Seleccione el puerto de embarque.';
  if (observaciones.length > DISPATCH_LIMITS.MAX_OBSERVATIONS) {
    header.observaciones = `Máximo ${DISPATCH_LIMITS.MAX_OBSERVATIONS} caracteres.`;
  }

  const lines: Record<string, LineErrors> = {};
  for (const l of lineViews) {
    const errors: LineErrors = {};
    if (!l.lot) {
      errors.lote = 'El lote ya no está disponible.';
    }
    if (!l.cantidadKg.trim()) {
      errors.cantidadKg = 'Ingrese la cantidad.';
    } else if (!Number.isFinite(l.cantidadNum)) {
      errors.cantidadKg = 'Número inválido (máx. 2 decimales).';
    } else if (l.cantidadNum <= 0) {
      errors.cantidadKg = 'Debe ser mayor a 0.';
    } else if (l.lot && l.cantidadNum > l.lot.disponibleKg) {
      errors.cantidadKg = `Supera el stock disponible (${l.lot.disponibleKg} kg).`;
    }
    if (!l.precioKg.trim()) {
      errors.precioKg = 'Ingrese el precio.';
    } else if (!Number.isFinite(l.precioNum) || l.precioNum <= 0) {
      errors.precioKg = 'Precio inválido.';
    } else if (l.precioNum > DISPATCH_LIMITS.MAX_PRICE_USD_KG) {
      errors.precioKg = `Máximo ${DISPATCH_LIMITS.MAX_PRICE_USD_KG} USD/kg.`;
    }
    if (Object.keys(errors).length > 0) lines[l.harvestId] = errors;
  }

  let detail: string | undefined;
  if (lineViews.length === 0) {
    detail = 'Agregue al menos un lote al detalle.';
  } else if (lineViews.length > DISPATCH_LIMITS.MAX_LINES) {
    detail = `Máximo ${DISPATCH_LIMITS.MAX_LINES} lotes por orden.`;
  } else if (totals.totalKg > DISPATCH_LIMITS.MAX_TOTAL_KG) {
    detail = `El total (${totals.totalKg} kg) supera la capacidad de un contenedor (${DISPATCH_LIMITS.MAX_TOTAL_KG} kg).`;
  }

  const isValid =
    Object.keys(header).length === 0 && Object.keys(lines).length === 0 && detail === undefined;

  return { header, lines, detail, isValid };
}

export const formatUsd = (n: number): string =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

export const formatKg = (n: number): string =>
  `${n.toLocaleString('es-PE', { maximumFractionDigits: 2 })} kg`;

/** dd/mm/yyyy sin desfase de zona horaria para fechas YYYY-MM-DD (new Date() las toma como UTC). */
export function formatIsoDate(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : value || '—';
}
