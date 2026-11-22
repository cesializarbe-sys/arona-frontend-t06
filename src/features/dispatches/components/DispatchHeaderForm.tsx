import React from 'react';
import { DISPATCH_LIMITS, EXPORT_CLIENTS, SHIPPING_PORTS } from '../constants';
import { todayInputDate } from '../utils/dispatchCalculations';
import type { DispatchHeaderDraft, HeaderErrors } from '../types';

export const inputClass = (hasError: boolean): string =>
  `w-full px-3 py-2 bg-gray-50 border rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 transition-all disabled:opacity-60 ${
    hasError
      ? 'border-red-400 focus:ring-red-200'
      : 'border-gray-200 focus:ring-[var(--color-arona-500)]/20'
  }`;

interface Props {
  header: DispatchHeaderDraft;
  errors: HeaderErrors;
  showErrors: boolean;
  responsableNombre: string;
  onChange: (field: keyof DispatchHeaderDraft, value: string) => void;
}

const FieldError: React.FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p id={id} className="text-[11px] text-red-600 mt-1 font-medium">
      {message}
    </p>
  ) : null;

export const DispatchHeaderForm: React.FC<Props> = ({ header, errors, showErrors, responsableNombre, onChange }) => {
  const err = (k: keyof DispatchHeaderDraft) => (showErrors ? errors[k] : undefined);
  const client = EXPORT_CLIENTS.find((c) => c.id === header.clienteId);

  return (
    <section className="arona-card p-5" aria-labelledby="dispatch-header-title">
      <h2 id="dispatch-header-title" className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="material-icons-outlined text-[var(--color-arona-500)]">description</span>
        Cabecera de la orden
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dsp-cliente" className="block text-xs font-semibold text-gray-600 mb-1">
            Cliente importador <span className="text-red-500">*</span>
          </label>
          <select
            id="dsp-cliente"
            value={header.clienteId}
            onChange={(e) => onChange('clienteId', e.target.value)}
            aria-invalid={Boolean(err('clienteId'))}
            aria-describedby={err('clienteId') ? 'dsp-cliente-error' : undefined}
            className={inputClass(Boolean(err('clienteId')))}
          >
            <option value="">Seleccione…</option>
            {EXPORT_CLIENTS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.razonSocial} — {c.pais}
              </option>
            ))}
          </select>
          <FieldError id="dsp-cliente-error" message={err('clienteId')} />
          {client && <p className="text-[11px] text-gray-400 mt-1">Código {client.id} · Destino {client.pais}</p>}
        </div>

        <div>
          <label htmlFor="dsp-fecha" className="block text-xs font-semibold text-gray-600 mb-1">
            Fecha de despacho <span className="text-red-500">*</span>
          </label>
          <input
            id="dsp-fecha"
            type="date"
            min={todayInputDate()}
            value={header.fechaDespacho}
            onChange={(e) => onChange('fechaDespacho', e.target.value)}
            aria-invalid={Boolean(err('fechaDespacho'))}
            aria-describedby={err('fechaDespacho') ? 'dsp-fecha-error' : undefined}
            className={inputClass(Boolean(err('fechaDespacho')))}
          />
          <FieldError id="dsp-fecha-error" message={err('fechaDespacho')} />
        </div>

        <div>
          <label htmlFor="dsp-puerto" className="block text-xs font-semibold text-gray-600 mb-1">
            Puerto de embarque <span className="text-red-500">*</span>
          </label>
          <select
            id="dsp-puerto"
            value={header.puertoEmbarque}
            onChange={(e) => onChange('puertoEmbarque', e.target.value)}
            aria-invalid={Boolean(err('puertoEmbarque'))}
            aria-describedby={err('puertoEmbarque') ? 'dsp-puerto-error' : undefined}
            className={inputClass(Boolean(err('puertoEmbarque')))}
          >
            <option value="">Seleccione…</option>
            {SHIPPING_PORTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <FieldError id="dsp-puerto-error" message={err('puertoEmbarque')} />
        </div>

        <div>
          <span className="block text-xs font-semibold text-gray-600 mb-1">Responsable</span>
          <p className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-600">
            {responsableNombre}
          </p>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="dsp-obs" className="block text-xs font-semibold text-gray-600 mb-1">
            Observaciones
          </label>
          <textarea
            id="dsp-obs"
            rows={2}
            value={header.observaciones}
            onChange={(e) => onChange('observaciones', e.target.value)}
            aria-invalid={Boolean(err('observaciones'))}
            className={`${inputClass(Boolean(err('observaciones')))} resize-none`}
            placeholder="N.º de contenedor, temperatura de transporte, instrucciones…"
          />
          <div className="flex justify-between">
            <FieldError id="dsp-obs-error" message={err('observaciones')} />
            <span
              className={`text-[11px] ml-auto ${
                header.observaciones.length > DISPATCH_LIMITS.MAX_OBSERVATIONS ? 'text-red-600' : 'text-gray-400'
              }`}
            >
              {header.observaciones.length}/{DISPATCH_LIMITS.MAX_OBSERVATIONS}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
