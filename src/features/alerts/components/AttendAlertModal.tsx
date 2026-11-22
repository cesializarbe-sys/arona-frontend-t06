import React, { useState, useEffect, type FormEvent } from 'react';
import { ModalDialog } from '../../../shared/components/ModalDialog';
import type { EntityId, PhytosanitaryAlert } from '../../../shared/types/domain';

export interface AttendAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: EntityId, solution: string) => void | Promise<void>;
  alert?: PhytosanitaryAlert | null;
  fieldName?: string;
  isLoading?: boolean;
}

export const AttendAlertModal: React.FC<AttendAlertModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  alert = null,
  fieldName = '',
  isLoading = false,
}) => {
  const [solution, setSolution] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSolution('');
      setError('');
    }
  }, [isOpen, alert]);

  if (!alert) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!solution.trim()) {
      setError('Ingrese una solución o tratamiento aplicado');
      return;
    }
    const id = alert.id || alert.idAlerta;
    void onSubmit(id, solution.trim());
  };

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="attend-alert-modal-title"
      isBusy={isLoading}
      panelClassName="max-w-md w-full p-6"
    >
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[var(--color-arona-600)] flex items-center justify-center shrink-0">
            <span className="material-icons-outlined text-xl">healing</span>
          </div>
          <div>
            <h3 id="attend-alert-modal-title" className="text-lg font-bold text-[var(--color-text-primary)]">
              Atender Alerta #{alert.id || alert.idAlerta}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              {alert.campo?.nombre || fieldName || 'Lote'} · {alert.tipoProblema}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Cerrar modal"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all border-none bg-transparent cursor-pointer"
        >
          <span className="material-icons-outlined">close</span>
        </button>
      </div>

      <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 mb-4 border border-gray-100">
        <strong className="block font-semibold text-gray-800 mb-0.5">
          Problema Reportado:
        </strong>
        {alert.descripcionProblema}
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="attend-alert-solution"
            className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
          >
            Tratamiento / Solución Aplicada *
          </label>
          <textarea
            id="attend-alert-solution"
            rows={4}
            value={solution}
            onChange={(e) => {
              setSolution(e.target.value);
              if (error) setError('');
            }}
            placeholder="Ej: Se realizó fumigación con producto X en dosis 1.5 L/ha, supervisado por técnico agrónomo..."
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'attend-alert-solution-error' : undefined}
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all resize-none ${
              error ? 'border-red-400' : 'border-gray-200 focus:border-[var(--color-arona-500)]'
            }`}
          />
          {error && (
            <p id="attend-alert-solution-error" className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <span className="material-icons-outlined text-xs">error</span> {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="arona-btn-outline"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="arona-btn-primary disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="material-icons-outlined text-lg animate-spin">refresh</span>
                Guardando...
              </>
            ) : (
              <>
                <span className="material-icons-outlined text-lg">task_alt</span>
                Marcar Atendida
              </>
            )}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
};
