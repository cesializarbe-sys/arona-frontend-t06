import React, { useMemo, useState } from 'react';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';
import { filterLots, formatKg, formatIsoDate } from '../utils/dispatchCalculations';
import type { HarvestLot } from '../types';

interface Props {
  lots: readonly HarvestLot[];
  selectedIds: ReadonlySet<string>;
  isLoading: boolean;
  disabled: boolean;
  onAdd: (lot: HarvestLot) => void;
}

export const LotPicker: React.FC<Props> = ({ lots, selectedIds, isLoading, disabled, onAdd }) => {
  const [term, setTerm] = useState('');
  const debouncedTerm = useDebouncedValue(term, 350);
  const isSearching = term !== debouncedTerm;

  const available = useMemo(() => lots.filter((l) => l.disponibleKg > 0), [lots]);
  const results = useMemo(() => filterLots(available, debouncedTerm), [available, debouncedTerm]);

  return (
    <section className="arona-card p-5" aria-labelledby="lot-picker-title">
      <h2 id="lot-picker-title" className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
        <span className="material-icons-outlined text-[var(--color-arona-500)]">inventory_2</span>
        Lotes disponibles
      </h2>
      <p className="text-xs text-gray-400 mb-3">Cosechas activas con stock pendiente de despacho</p>

      <div className="relative mb-3">
        <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
          search
        </span>
        <input
          type="search"
          aria-label="Buscar lotes por número, campo o cultivo"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          disabled={isLoading}
          placeholder="Buscar lote, campo o cultivo…"
          className="w-full pl-9 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20"
        />
        {isSearching && (
          <span
            className="material-icons-outlined absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-base animate-spin"
            aria-label="Buscando"
          >
            autorenew
          </span>
        )}
      </div>

      {isLoading ? (
        <ul className="space-y-2" aria-busy="true" aria-label="Cargando lotes">
          {[0, 1, 2].map((i) => (
            <li key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </ul>
      ) : results.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">
          {available.length === 0 ? 'No hay lotes con stock disponible.' : 'Sin coincidencias para la búsqueda.'}
        </p>
      ) : (
        <ul className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
          {results.map((lot) => {
            const added = selectedIds.has(lot.harvestId);
            return (
              <li
                key={lot.harvestId}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:bg-emerald-50/40"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 truncate">
                    #{lot.harvestId} · <span className="text-[var(--color-arona-600)]">{lot.cultivoNombre}</span>
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {lot.campoNombre} · {formatIsoDate(lot.fecha)}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Disponible: <strong className="text-gray-700">{formatKg(lot.disponibleKg)}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAdd(lot)}
                  disabled={disabled || added}
                  aria-label={`Agregar lote ${lot.harvestId}`}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer bg-[var(--color-arona-500)] text-white hover:bg-[var(--color-arona-600)] disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  {added ? 'Agregado' : 'Agregar'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
