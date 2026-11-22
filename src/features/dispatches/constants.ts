import type { ExportClient } from './types';

/** Catálogo de clientes importadores de Sociedad Agrícola Arona S.A. */
export const EXPORT_CLIENTS: readonly ExportClient[] = [
  { id: 'CLI-001', razonSocial: 'FreshFruit Imports LLC', pais: 'Estados Unidos' },
  { id: 'CLI-002', razonSocial: 'Rotterdam Produce B.V.', pais: 'Países Bajos' },
  { id: 'CLI-003', razonSocial: 'Shanghai Green Market Co.', pais: 'China' },
  { id: 'CLI-004', razonSocial: 'Iberia Frutas S.L.', pais: 'España' },
  { id: 'CLI-005', razonSocial: 'Andes Trading Chile SpA', pais: 'Chile' },
];

export const SHIPPING_PORTS = ['Callao', 'Paita', 'Salaverry', 'Chancay'] as const;

/** Precio FOB referencial (USD/kg) por tipo de cultivo; editable en cada línea. */
export const REFERENCE_PRICE_USD_KG: Record<string, number> = {
  MANDARINA: 1.2,
  PALTA: 2.8,
  ARANDANO: 6.5,
  CAQUI: 1.9,
};
export const DEFAULT_PRICE_USD_KG = 1.5;

/** Límites del negocio. */
export const DISPATCH_LIMITS = {
  MAX_LINES: 20,
  MAX_PRICE_USD_KG: 50,
  MAX_OBSERVATIONS: 300,
  /** Un contenedor reefer de 40' admite como máximo ~26 t de fruta. */
  MAX_TOTAL_KG: 26000,
} as const;

export const DISPATCHES_STORAGE_KEY = 'arona:despachos';
