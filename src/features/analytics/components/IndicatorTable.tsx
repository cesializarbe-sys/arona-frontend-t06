import React, { useMemo } from 'react';
import type { AnalyticsPagination } from '../../../shared/types/domain';

export function formatColumnHeader(key: string): string {
  if (!key) return '';
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function isPercentageColumn(colName: string): boolean {
  if (!colName) return false;
  return colName.includes('porcentaje') || colName.includes('tasa_') || colName === 'calidad';
}

function renderProgressBar(rawValue: unknown): React.ReactNode {
  const num = Number(rawValue);
  if (Number.isNaN(num)) return <span>{String(rawValue)}</span>;
  const clamped = Math.min(Math.max(num, 0), 100);
  const barColor = num >= 75 ? 'bg-[#557A38]' : num >= 45 ? 'bg-[#E29839]' : 'bg-[#C44536]';

  return (
    <div className="flex items-center gap-2.5 min-w-[130px]">
      <div className="flex-1 h-2 rounded-full bg-[#EFECE4] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-12 text-right">{num}%</span>
    </div>
  );
}

function renderCellValue(value: unknown, colName = ''): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-400">—</span>;
  }

  if (typeof value === 'number' && isPercentageColumn(colName)) {
    return renderProgressBar(value);
  }

  if (typeof value === 'boolean') {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
          value ? 'bg-[#E3F5E8] text-[#2F7A47]' : 'bg-[#F3F1EC] text-[#6E6A5F]'
        }`}
      >
        {value ? 'Sí' : 'No'}
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-400">Sin registros (0)</span>;
    }
    if (typeof value[0] === 'object' && value[0] !== null) {
      return (
        <div className="space-y-1 max-w-md">
          {value.slice(0, 5).map((item, idx) => {
            const record = item as Record<string, unknown>;
            const rowKey = String(record.id || record.estado_fruta || idx);
            return (
              <div
                key={rowKey}
                className="text-[11px] bg-[#FAF8F3] border border-[#EAE5D9] rounded-lg px-2.5 py-1 text-gray-700"
              >
                {Object.entries(record)
                  .map(([k, v]) => `${formatColumnHeader(k)}: ${v ?? '—'}`)
                  .join(' · ')}
              </div>
            );
          })}
          {value.length > 5 && (
            <span className="text-[10px] text-gray-400 italic">+{value.length - 5} más...</span>
          )}
        </div>
      );
    }
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((v, i) => (
          <span
            key={`${String(v)}-${i}`}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F3F1EC] text-[#5C574B]"
          >
            {String(v)}
          </span>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-gray-400">—</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {entries.map(([k, v]) => (
          <span
            key={k}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F3F1EC] text-[#5C574B]"
          >
            {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
          </span>
        ))}
      </div>
    );
  }

  const strVal = String(value);
  if (
    ['CON_COSECHA', 'NORMAL', 'BUENA', 'ATENDIDO', 'ALTO', 'SALUDABLE', 'OPTIMO'].includes(strVal)
  ) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#E3F5E8] text-[#2F7A47]">
        {strVal}
      </span>
    );
  }
  if (
    ['BAJO_UMBRAL', 'DAÑADA', 'DESCARTE', 'PENDIENTE', 'SIN_SUPERFICIE', 'CON_PROBLEMAS'].includes(
      strVal
    )
  ) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FDE4E1] text-[#C44536]">
        {strVal}
      </span>
    );
  }
  if (['SIN_COSECHAS', 'MEDIO', 'BAJO', 'EN_RIESGO'].includes(strVal)) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FEF6D8] text-[#B5811C]">
        {strVal}
      </span>
    );
  }

  return strVal;
}

export interface IndicatorTableProps {
  rows?: Record<string, unknown>[];
  totalRecords?: number;
  pagination?: AnalyticsPagination | null;
  onPageChange?: ((nextPage: number) => void) | null;
  title?: string;
}

export const IndicatorTable: React.FC<IndicatorTableProps> = ({
  rows = [],
  totalRecords,
  pagination = null,
  onPageChange = null,
  title = 'Detalle de Registros del Endpoint',
}) => {
  const columns = useMemo(() => {
    if (!Array.isArray(rows) || rows.length === 0) return [];
    const keySet = new Set(Object.keys(rows[0] || {}));
    rows.forEach((row) => {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach((k) => keySet.add(k));
      }
    });
    return Array.from(keySet);
  }, [rows]);

  return (
    <div className="bg-white rounded-2xl border border-[#EAE5D9] shadow-xs overflow-hidden animate-fade-in">
      <div className="px-6 py-4 border-b border-[#EAE5D9] flex flex-wrap items-center justify-between gap-2 bg-[#FAF8F3]">
        <div className="flex items-center gap-2">
          <span className="material-icons-outlined text-lg text-[#557A38]">table_chart</span>
          <span className="text-xs font-bold uppercase tracking-wider text-[#4A463B]">{title}</span>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F0E2] text-[#3F6225]">
          {totalRecords ?? rows.length} registros
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="p-10 text-center text-gray-400">
          <span className="material-icons-outlined text-4xl mb-2 block text-[#B5AFA0]">inbox</span>
          <p className="text-sm font-medium text-gray-600">
            No se encontraron registros para los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F4EC] border-b border-[#EAE5D9] text-[11px] font-bold uppercase tracking-wider text-[#8C8574]">
                {columns.map((col) => (
                  <th key={col} className="py-3.5 px-5 whitespace-nowrap">
                    {formatColumnHeader(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE1] text-xs text-gray-800">
              {rows.map((row, rowIndex) => (
                <tr
                  key={String(row.id || row.id_campo || row.tipo_cultivo || rowIndex)}
                  className="hover:bg-[#FAF8F3] transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col} className="py-3.5 px-5 align-middle">
                      {renderCellValue(row[col], col)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && (
        <div className="px-6 py-4 border-t border-[#EAE5D9] bg-[#FAF8F3] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-[#6E6A5F]">
            Página <strong className="text-gray-800">{pagination.page ?? 1}</strong> de{' '}
            <strong className="text-gray-800">{pagination.total_paginas ?? 1}</strong> · Tamaño de
            página: <strong className="text-gray-800">{pagination.size ?? 50}</strong> (
            {pagination.total_registros ?? totalRecords ?? rows.length} totales)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!pagination.tiene_anterior}
              onClick={() => onPageChange && onPageChange((pagination.page || 2) - 1)}
              aria-label="Página anterior"
              className="arona-btn-outline py-1.5 px-3.5 text-xs bg-white disabled:opacity-40 disabled:pointer-events-none"
            >
              <span className="material-icons-outlined text-sm">chevron_left</span>
              Anterior
            </button>

            <button
              type="button"
              disabled={!pagination.tiene_siguiente}
              onClick={() => onPageChange && onPageChange((pagination.page || 1) + 1)}
              aria-label="Página siguiente"
              className="arona-btn-outline py-1.5 px-3.5 text-xs bg-white disabled:opacity-40 disabled:pointer-events-none"
            >
              Siguiente
              <span className="material-icons-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndicatorTable;
