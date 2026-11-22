import type { EntityId } from '../../shared/types/domain';

/** Cliente importador (entidad de cabecera). */
export interface ExportClient {
  id: string;
  razonSocial: string;
  pais: string;
}

/** Cabecera editable de la orden de despacho. */
export interface DispatchHeaderDraft {
  clienteId: string;
  fechaDespacho: string; // YYYY-MM-DD (input date)
  puertoEmbarque: string;
  observaciones: string;
}

/**
 * Línea editable del detalle. Solo guarda lo que el usuario decide
 * (lote, cantidad y precio). Nombres, disponibilidad y subtotal se derivan.
 * Cantidad y precio se guardan como texto para permitir edición intermedia ("12.").
 */
export interface DispatchLineDraft {
  harvestId: string;
  cantidadKg: string;
  precioKg: string;
}

export interface DispatchDraft {
  header: DispatchHeaderDraft;
  lines: DispatchLineDraft[];
}

/** Información del lote (cosecha + campo + cultivo) usada en el detalle. */
export interface HarvestLot {
  harvestId: string;
  fecha: string;
  campoNombre: string;
  cultivoNombre: string;
  tipoCultivo: string;
  cantidadCosechadaKg: number;
  disponibleKg: number;
}

/** Línea calculada (derivada, nunca almacenada en estado). */
export interface DispatchLineView extends DispatchLineDraft {
  lot: HarvestLot | null;
  cantidadNum: number;
  precioNum: number;
  subtotal: number;
}

export interface DispatchTotals {
  totalKg: number;
  totalUsd: number;
  lineCount: number;
}

export type HeaderErrors = Partial<Record<keyof DispatchHeaderDraft, string>>;

export interface LineErrors {
  cantidadKg?: string;
  precioKg?: string;
  lote?: string;
}

export interface DispatchValidation {
  header: HeaderErrors;
  lines: Record<string, LineErrors>;
  detail?: string;
  isValid: boolean;
}

/** Línea persistida (snapshot de nombres para el historial). */
export interface DispatchLineRecord {
  harvestId: string;
  campoNombre: string;
  cultivoNombre: string;
  cantidadKg: number;
  precioKg: number;
  subtotal: number;
}

export type DispatchStatus = 'REGISTRADO' | 'ANULADO';

export interface DispatchRecord {
  id: string;
  codigo: string;
  clienteId: string;
  clienteNombre: string;
  clientePais: string;
  fechaDespacho: string;
  puertoEmbarque: string;
  observaciones: string;
  responsableId: EntityId | null;
  responsableNombre: string;
  lines: DispatchLineRecord[];
  totalKg: number;
  totalUsd: number;
  estado: DispatchStatus;
  creadoEn: string;
}

export type DispatchCreatePayload = Omit<DispatchRecord, 'id' | 'codigo' | 'estado' | 'creadoEn'>;
