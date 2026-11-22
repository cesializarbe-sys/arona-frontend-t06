import React from 'react';
import { inputClass } from './DispatchHeaderForm';
import { formatKg, formatUsd } from '../utils/dispatchCalculations';
import type { DispatchLineView, DispatchTotals, LineErrors } from '../types';

interface Props {
  lines: readonly DispatchLineView[];
  totals: DispatchTotals;
  lineErrors: Record<string, LineErrors>;
  detailError?: string;
  showErrors: boolean;
  onUpdate: (harvestId: string, field: 'cantidadKg' | 'precioKg', value: string) => void;
  onRemove: (harvestId: string) => void;
}

export const DispatchDetailTable: React.FC<Props> = ({
  lines,
  totals,
  lineErrors,
  detailError,
  showErrors,
  onUpdate,
  onRemove,
}) => (
  <section className="arona-card overflow-hidden" aria-labelledby="dispatch-detail-title">
    <div className="p-5 pb-3 flex items-center justify-between">
      <h2 id="dispatch-detail-title" className="text-base font-bold text-gray-800 flex items-center gap-2">
        <span className="material-icons-outlined text-[var(--color-arona-500)]">list_alt</span>
        Detalle de lotes
      </h2>
      <span className="badge badge-neutral">{lines.length} línea(s)</span>
    </div>

    {showErrors && detailError && (
      <p role="alert" className="mx-5 mb-3 px-3 py-2 rounded-lg bg-red-50 text-xs font-medium text-red-700">
        {detailError}
      </p>
    )}

    {lines.length === 0 ? (
      <div className="text-center py-10 border-t border-gray-100">
        <span className="material-icons-outlined text-5xl text-gray-300">playlist_add</span>
        <p className="text-sm font-semibold text-gray-600 mt-2">Aún no hay lotes en la orden</p>
        <p className="text-xs text-gray-400">Agréguelos desde el panel «Lotes disponibles».</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/70 border-y border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Lote</th>
              <th className="py-3 px-4">Disponible</th>
              <th className="py-3 px-4 w-36">Cantidad (kg)</th>
              <th className="py-3 px-4 w-32">Precio (USD/kg)</th>
              <th className="py-3 px-4 text-right">Subtotal</th>
              <th className="py-3 px-4" aria-label="Acciones" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.map((l) => {
              const e = showErrors ? lineErrors[l.harvestId] ?? {} : {};
              const qtyId = `qty-${l.harvestId}`;
              const priceId = `price-${l.harvestId}`;
              return (
                <tr key={l.harvestId} className="align-top">
                  <td className="py-3 px-4">
                    <p className="font-bold text-gray-800">#{l.harvestId}</p>
                    <p className="text-[11px] text-[var(--color-arona-600)] font-semibold">
                      {l.lot?.cultivoNombre ?? '—'}
                    </p>
                    <p className="text-[11px] text-gray-400">{l.lot?.campoNombre ?? '—'}</p>
                    {e.lote && <p className="text-[11px] text-red-600">{e.lote}</p>}
                  </td>
                  <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                    {l.lot ? formatKg(l.lot.disponibleKg) : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <label htmlFor={qtyId} className="sr-only">
                      Cantidad en kg del lote {l.harvestId}
                    </label>
                    <input
                      id={qtyId}
                      inputMode="decimal"
                      value={l.cantidadKg}
                      onChange={(ev) => onUpdate(l.harvestId, 'cantidadKg', ev.target.value)}
                      aria-invalid={Boolean(e.cantidadKg)}
                      aria-describedby={e.cantidadKg ? `${qtyId}-error` : undefined}
                      className={inputClass(Boolean(e.cantidadKg))}
                    />
                    {e.cantidadKg && (
                      <p id={`${qtyId}-error`} className="text-[11px] text-red-600 mt-1">
                        {e.cantidadKg}
                      </p>
                    )}
                    {l.lot && (
                      <button
                        type="button"
                        onClick={() => onUpdate(l.harvestId, 'cantidadKg', String(l.lot?.disponibleKg ?? 0))}
                        className="text-[11px] text-[var(--color-arona-600)] bg-transparent border-none p-0 mt-1 cursor-pointer hover:underline"
                      >
                        Usar todo el disponible
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <label htmlFor={priceId} className="sr-only">
                      Precio USD por kg del lote {l.harvestId}
                    </label>
                    <input
                      id={priceId}
                      inputMode="decimal"
                      value={l.precioKg}
                      onChange={(ev) => onUpdate(l.harvestId, 'precioKg', ev.target.value)}
                      aria-invalid={Boolean(e.precioKg)}
                      aria-describedby={e.precioKg ? `${priceId}-error` : undefined}
                      className={inputClass(Boolean(e.precioKg))}
                    />
                    {e.precioKg && (
                      <p id={`${priceId}-error`} className="text-[11px] text-red-600 mt-1">
                        {e.precioKg}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-800 whitespace-nowrap">
                    {formatUsd(l.subtotal)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      type="button"
                      onClick={() => onRemove(l.harvestId)}
                      aria-label={`Quitar lote ${l.harvestId}`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 border-none bg-transparent cursor-pointer disabled:opacity-40"
                    >
                      <span className="material-icons-outlined text-base">delete_outline</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-emerald-50/60 border-t border-emerald-100 font-bold text-gray-800">
            <tr>
              <td className="py-3 px-4" colSpan={2}>
                Totales
              </td>
              <td className="py-3 px-4" data-testid="total-kg">
                {formatKg(totals.totalKg)}
              </td>
              <td />
              <td className="py-3 px-4 text-right text-[var(--color-arona-700)]" data-testid="total-usd">
                {formatUsd(totals.totalUsd)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    )}
  </section>
);
