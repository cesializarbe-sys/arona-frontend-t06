import React from 'react';
import { formatKg, formatUsd, formatIsoDate } from '../utils/dispatchCalculations';
import type { DispatchRecord } from '../types';

interface Props {
  dispatches: readonly DispatchRecord[];
  isLoading: boolean;
  annullingId: string | null;
  onRequestAnnul: (record: DispatchRecord) => void;
}

export const DispatchHistory: React.FC<Props> = ({ dispatches, isLoading, annullingId, onRequestAnnul }) => (
  <section className="arona-card overflow-hidden" aria-labelledby="dispatch-history-title">
    <div className="p-5 pb-3">
      <h2 id="dispatch-history-title" className="text-base font-bold text-gray-800 flex items-center gap-2">
        <span className="material-icons-outlined text-[var(--color-arona-500)]">history</span>
        Órdenes registradas
      </h2>
    </div>

    {isLoading ? (
      <p className="text-xs text-gray-400 text-center py-8">Cargando órdenes…</p>
    ) : dispatches.length === 0 ? (
      <p className="text-xs text-gray-400 text-center py-8">Todavía no se registraron órdenes de despacho.</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/70 border-y border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Código</th>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Despacho</th>
              <th className="py-3 px-4">Puerto</th>
              <th className="py-3 px-4">Lotes</th>
              <th className="py-3 px-4 text-right">Total kg</th>
              <th className="py-3 px-4 text-right">Total USD</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4" aria-label="Acciones" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dispatches.map((d) => (
              <tr key={d.id} className={d.estado === 'ANULADO' ? 'opacity-60' : ''}>
                <td className="py-3 px-4 font-bold text-gray-800">{d.codigo}</td>
                <td className="py-3 px-4">
                  <p className="font-semibold text-gray-700">{d.clienteNombre}</p>
                  <p className="text-[11px] text-gray-400">{d.clientePais}</p>
                </td>
                <td className="py-3 px-4 whitespace-nowrap">{formatIsoDate(d.fechaDespacho)}</td>
                <td className="py-3 px-4">{d.puertoEmbarque}</td>
                <td className="py-3 px-4" title={d.lines.map((l) => `#${l.harvestId} ${l.cultivoNombre}`).join(', ')}>
                  {d.lines.length}
                </td>
                <td className="py-3 px-4 text-right">{formatKg(d.totalKg)}</td>
                <td className="py-3 px-4 text-right font-bold">{formatUsd(d.totalUsd)}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`badge text-[10px] ${d.estado === 'ANULADO' ? 'badge-danger' : 'badge-success'}`}>
                    {d.estado}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {d.estado === 'REGISTRADO' && (
                    <button
                      type="button"
                      onClick={() => onRequestAnnul(d)}
                      disabled={annullingId === d.id}
                      className="text-[11px] font-semibold text-red-500 bg-transparent border-none cursor-pointer hover:underline disabled:opacity-50"
                    >
                      {annullingId === d.id ? 'Anulando…' : 'Anular'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);
