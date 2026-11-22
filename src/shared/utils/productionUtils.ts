/**
 * Production unit conversion utilities.
 * Backend stores kilograms (cantidadKg); UI presents metric tons (t).
 */

const KG_PER_TON = 1000;

export function kgToTonDisplay(kg: number | null | undefined): string {
  if (kg == null) return '—';
  const ton = kg / KG_PER_TON;
  return parseFloat(ton.toFixed(2)).toString();
}

export function kgToTonNum(kg: number | null | undefined): number | null {
  if (kg == null) return null;
  return parseFloat((kg / KG_PER_TON).toFixed(4));
}

export function tonToKg(ton: number | string | null | undefined): number {
  if (ton == null || ton === '') return 0;
  return parseFloat((Number(ton) * KG_PER_TON).toFixed(2));
}
