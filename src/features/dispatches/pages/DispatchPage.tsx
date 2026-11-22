import React, { useState } from 'react';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { useDispatchTransaction } from '../hooks/useDispatchTransaction';
import { DispatchHeaderForm } from '../components/DispatchHeaderForm';
import { DispatchDetailTable } from '../components/DispatchDetailTable';
import { LotPicker } from '../components/LotPicker';
import { DispatchHistory } from '../components/DispatchHistory';
import { formatKg, formatUsd } from '../utils/dispatchCalculations';
import type { DispatchRecord } from '../types';

/**
 * Vista transaccional: "Orden de Despacho de Exportación" (ruta de despachos).
 *
 * Entidades que involucra:
 * - Despacho (DispatchRecord): cabecera (cliente, fecha, puerto, observaciones, responsable)
 *   y detalle de líneas. Se registra un código correlativo DSP-00001, DSP-00002, etc.
 * - Línea de despacho (DispatchLineRecord): lote, cantidad (kg), precio FOB (USD/kg) y subtotal.
 * - Lote de cosecha (Harvest), con su campo (Field) y cultivo (Crop): origen del stock disponible.
 * - Cliente importador (ExportClient): catálogo fijo en constants.ts, no es una entidad persistida.
 * - Usuario responsable: se toma de AuthContext y se guarda como responsable del despacho.
 *
 * Persistencia:
 * - Borrador (cabecera y líneas): solo en estado local de React (useReducer en useDispatchDraft).
 *   Si el usuario recarga la página sin confirmar, el borrador se pierde.
 * - Confirmar despacho: la orden se persiste en localStorage del navegador (clave 'arona:despachos')
 *   a través de dispatchesApi. Hoy no llega a un backend real.
 * - Anular orden: cambia el estado del registro a ANULADO y lo conserva en el historial.
 */
export const DispatchPage: React.FC = () => {
  const tx = useDispatchTransaction();
  const [annulTarget, setAnnulTarget] = useState<DispatchRecord | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void tx.submit();
  };

  const canSubmit = !tx.isSubmitting && !tx.isLoadingCatalogs && !tx.catalogError;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Orden de Despacho de Exportación</h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          Asigne lotes cosechados a un cliente importador, controlando el stock disponible por lote
        </p>
      </div>

      {tx.catalogError && (
        <div
          role="alert"
          className="arona-card p-5 border-l-4 border-red-500 bg-red-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <span className="material-icons-outlined text-red-600 text-2xl">error_outline</span>
            <div>
              <p className="text-sm font-bold text-red-900">No se pudieron cargar los lotes</p>
              <p className="text-xs text-red-700 mt-0.5">{tx.catalogError}</p>
            </div>
          </div>
          <button type="button" onClick={() => void tx.reloadCatalogs()} className="arona-btn-outline text-xs py-2 px-4">
            Reintentar
          </button>
        </div>
      )}

      {tx.lastCreated && (
        <div
          role="status"
          className="arona-card p-4 border-l-4 border-emerald-500 bg-emerald-50/70 flex items-start justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <span className="material-icons-outlined text-emerald-600 text-2xl">check_circle</span>
            <div>
              <p className="text-sm font-bold text-emerald-900">Orden {tx.lastCreated.codigo} registrada</p>
              <p className="text-xs text-emerald-800 mt-0.5">
                {tx.lastCreated.clienteNombre} · {tx.lastCreated.lines.length} lote(s) ·{' '}
                {formatKg(tx.lastCreated.totalKg)} · {formatUsd(tx.lastCreated.totalUsd)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={tx.dismissLastCreated}
            aria-label="Cerrar mensaje"
            className="text-emerald-700 bg-transparent border-none cursor-pointer"
          >
            <span className="material-icons-outlined text-lg">close</span>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate aria-busy={tx.isSubmitting}>
        {/* fieldset disabled bloquea todos los controles durante el envío */}
        <fieldset disabled={tx.isSubmitting} className="border-none p-0 m-0 min-w-0">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6 min-w-0">
              <DispatchHeaderForm
                header={tx.draft.header}
                errors={tx.validation.header}
                showErrors={tx.showErrors}
                responsableNombre={tx.responsableNombre}
                onChange={tx.setHeaderField}
              />
              <DispatchDetailTable
                lines={tx.lineViews}
                totals={tx.totals}
                lineErrors={tx.validation.lines}
                detailError={tx.validation.detail}
                showErrors={tx.showErrors}
                onUpdate={tx.updateLine}
                onRemove={tx.removeLine}
              />
            </div>

            <div className="space-y-6 min-w-0">
              <LotPicker
                lots={tx.lots}
                selectedIds={tx.selectedIds}
                isLoading={tx.isLoadingCatalogs}
                disabled={tx.isSubmitting}
                onAdd={tx.handleAddLot}
              />

              <section className="arona-card p-5 space-y-3" aria-label="Resumen y confirmación">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Lotes</span>
                  <strong>{tx.totals.lineCount}</strong>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Peso total</span>
                  <strong>{formatKg(tx.totals.totalKg)}</strong>
                </div>
                <div className="flex justify-between text-lg border-t border-gray-100 pt-3">
                  <span className="font-semibold text-gray-700">Total FOB</span>
                  <strong className="text-[var(--color-arona-700)]">{formatUsd(tx.totals.totalUsd)}</strong>
                </div>

                {tx.submitError && (
                  <div role="alert" className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                    <p className="font-bold">No se pudo registrar la orden</p>
                    <p className="mt-0.5">{tx.submitError}</p>
                    <p className="mt-1 text-red-600/80">Sus datos se conservaron; corrija y vuelva a confirmar.</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="arona-btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <span className={`material-icons-outlined text-lg ${tx.isSubmitting ? 'animate-spin' : ''}`}>
                    {tx.isSubmitting ? 'autorenew' : 'local_shipping'}
                  </span>
                  {tx.isSubmitting ? 'Registrando orden…' : 'Confirmar despacho'}
                </button>
                <button
                  type="button"
                  onClick={tx.discardDraft}
                  disabled={tx.draft.lines.length === 0 && !tx.draft.header.clienteId}
                  className="arona-btn-outline w-full justify-center text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Limpiar orden
                </button>
              </section>
            </div>
          </div>
        </fieldset>
      </form>

      <DispatchHistory
        dispatches={tx.dispatches}
        isLoading={tx.isLoadingCatalogs}
        annullingId={tx.annullingId}
        onRequestAnnul={setAnnulTarget}
      />

      <ConfirmModal
        isOpen={annulTarget !== null}
        title={`¿Anular la orden ${annulTarget?.codigo ?? ''}?`}
        message="La orden quedará como ANULADA y el stock de sus lotes volverá a estar disponible."
        confirmText="Anular"
        type="danger"
        isLoading={annulTarget !== null && tx.annullingId === annulTarget.id}
        onConfirm={async () => {
          if (!annulTarget) return;
          await tx.annul(annulTarget.id);
          setAnnulTarget(null);
        }}
        onCancel={() => setAnnulTarget(null)}
      />
    </div>
  );
};
