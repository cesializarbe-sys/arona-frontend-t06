import React, { type FormEvent } from 'react';
import type { AnalyticsFilterRecord } from '../api/analyticsApi';

export interface IndicatorFilterOption {
  value: string;
  label: string;
}

export interface IndicatorFilterField {
  name: string;
  label: string;
  type: 'select' | 'boolean' | 'date' | 'number' | 'text';
  placeholder?: string;
  options?: readonly (string | IndicatorFilterOption)[];
  min?: number;
  max?: number;
}

export interface IndicatorFilterBarProps {
  fields?: IndicatorFilterField[];
  filters?: AnalyticsFilterRecord;
  setFilters: React.Dispatch<React.SetStateAction<AnalyticsFilterRecord>>;
  onApply?: () => void;
  onReset?: () => void;
  isLoading?: boolean;
  idPrefix?: string;
}

export const IndicatorFilterBar: React.FC<IndicatorFilterBarProps> = ({
  fields = [],
  filters = {},
  setFilters,
  onApply,
  onReset,
  isLoading = false,
  idPrefix = 'ind-filter',
}) => {
  if (!fields || fields.length === 0) {
    return null;
  }

  const handleChange = (name: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      ...(prev.page !== undefined && name !== 'page' ? { page: 1 } : {}),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (onApply) {
      onApply();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-[#EAE5D9] p-5 space-y-4 shadow-xs animate-fade-in"
      aria-label="Filtros del indicador"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {fields.map((field) => {
          const inputId = `${idPrefix}-${field.name}`;
          const rawValue = filters[field.name];
          const value = rawValue != null ? String(rawValue) : '';

          return (
            <div key={field.name} className="flex flex-col gap-1.5">
              <label
                htmlFor={inputId}
                className="text-[11px] font-bold text-[#7D7769] uppercase tracking-wider"
              >
                {field.label}
              </label>

              {field.type === 'select' ? (
                <select
                  id={inputId}
                  name={field.name}
                  value={value}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EAE5D9] bg-[#FAF8F3] text-sm text-[#2A241E] focus:outline-none focus:border-[#557A38] focus:bg-white transition-colors"
                >
                  <option value="">{field.placeholder || 'Todos'}</option>
                  {(field.options || []).map((opt) => {
                    const optValue = typeof opt === 'object' ? opt.value : opt;
                    const optLabel = typeof opt === 'object' ? opt.label : opt;
                    return (
                      <option key={optValue} value={optValue}>
                        {optLabel}
                      </option>
                    );
                  })}
                </select>
              ) : field.type === 'boolean' ? (
                <select
                  id={inputId}
                  name={field.name}
                  value={value}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EAE5D9] bg-[#FAF8F3] text-sm text-[#2A241E] focus:outline-none focus:border-[#557A38] focus:bg-white transition-colors"
                >
                  <option value="">{field.placeholder || 'Todos'}</option>
                  <option value="true">Sí (true)</option>
                  <option value="false">No (false)</option>
                </select>
              ) : field.type === 'date' ? (
                <input
                  id={inputId}
                  name={field.name}
                  type="date"
                  value={value}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EAE5D9] bg-[#FAF8F3] text-sm text-[#2A241E] focus:outline-none focus:border-[#557A38] focus:bg-white transition-colors"
                />
              ) : field.type === 'number' ? (
                <input
                  id={inputId}
                  name={field.name}
                  type="number"
                  min={field.min}
                  max={field.max}
                  placeholder={field.placeholder || ''}
                  value={value}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EAE5D9] bg-[#FAF8F3] text-sm text-[#2A241E] focus:outline-none focus:border-[#557A38] focus:bg-white transition-colors"
                />
              ) : (
                <input
                  id={inputId}
                  name={field.name}
                  type="text"
                  placeholder={field.placeholder || ''}
                  value={value}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#EAE5D9] bg-[#FAF8F3] text-sm text-[#2A241E] focus:outline-none focus:border-[#557A38] focus:bg-white transition-colors"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-[#F0ECE1]">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-[#EAE5D9] bg-white text-xs font-semibold text-[#6E6A5F] hover:bg-[#FAF8F3] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className="material-icons-outlined text-base">restart_alt</span>
            Limpiar filtros
          </button>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2 rounded-xl bg-[#557A38] hover:bg-[#46662D] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border-none shadow-xs disabled:opacity-50"
        >
          <span className="material-icons-outlined text-base">filter_alt</span>
          {isLoading ? 'Consultando...' : 'Aplicar filtros'}
        </button>
      </div>
    </form>
  );
};

export default IndicatorFilterBar;
