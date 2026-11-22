import React, { useState, useRef, useEffect, useCallback, type ChangeEvent, type DragEvent } from 'react';
import XLSX from 'xlsx-js-style';
import { ModalDialog } from '../../../shared/components/ModalDialog';
import { extractApiErrorMessage } from '../../../shared/api/errorUtils';
import type { ImportFieldsResult } from '../../../shared/types/domain';

export interface FieldImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<ImportFieldsResult>;
  isLoading?: boolean;
}

function downloadCsvTemplate(): void {
  const headers = 'nombre,ubicacion,hectareas,responsable,sistema_riego,tipo_suelo,zona,observaciones,estado';
  const sampleRows = [
    'Campo El Trébol,"Valle de Cañete - Sector Herbay Alto, Km 15",65,Andrés Ramos Vilca,GOTEO,Franco,Norte,Terreno con drenaje óptimo,1',
    'Campo Santa María,"Valle de Chincha - Sector Larán, Km 8",48,Gloria Castillo Meza,ASPERSION,Arcilloso,Sur,Alta fertilidad natural,1',
    'Campo Las Colinas,"Valle de Mala - Sector Calango, Km 21",55,Raúl Benítez Córdova,GRAVEDAD,Pedregoso,Este,Zona con pendiente leve,1',
    'Campo San Joaquín,"Valle de Cañete - Sector Imperial, Km 9",72,Patricia Solís Durand,GOTEO,Franco Arenoso,Oeste,Riego tecnificado nuevo,1',
    'Campo Valle Verde,"Valle de Pisco - Sector San Clemente, Km 16",40,Javier Mendoza Ponce,ASPERSION,Arenoso,Central,En periodo de descanso,1',
  ];
  const csvContent = '\uFEFF' + [headers, ...sampleRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'plantilla_campos_arona.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadExcelTemplate(): void {
  const headers = [
    'nombre',
    'ubicacion',
    'hectareas',
    'responsable',
    'sistema_riego',
    'tipo_suelo',
    'zona',
    'observaciones',
    'estado',
  ];

  const rows = [
    ['Campo El Trébol', 'Valle de Cañete - Sector Herbay Alto, Km 15', 65, 'Andrés Ramos Vilca', 'GOTEO', 'Franco', 'Norte', 'Terreno con drenaje óptimo', 1],
    ['Campo Santa María', 'Valle de Chincha - Sector Larán, Km 8', 48, 'Gloria Castillo Meza', 'ASPERSION', 'Arcilloso', 'Sur', 'Alta fertilidad natural', 1],
    ['Campo Las Colinas', 'Valle de Mala - Sector Calango, Km 21', 55, 'Raúl Benítez Córdova', 'GRAVEDAD', 'Pedregoso', 'Este', 'Zona con pendiente leve', 1],
    ['Campo San Joaquín', 'Valle de Cañete - Sector Imperial, Km 9', 72, 'Patricia Solís Durand', 'GOTEO', 'Franco Arenoso', 'Oeste', 'Riego tecnificado nuevo', 1],
    ['Campo Valle Verde', 'Valle de Pisco - Sector San Clemente, Km 16', 40, 'Javier Mendoza Ponce', 'ASPERSION', 'Arenoso', 'Central', 'En periodo de descanso', 1],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]) as Record<string, unknown>;
  const colWidths = [24, 42, 14, 25, 18, 18, 14, 30, 10];
  ws['!cols'] = colWidths.map((w) => ({ wch: w }));

  const range = XLSX.utils.decode_range((ws['!ref'] as string) || 'A1:I1');
  for (let c = range.s.c; c <= range.e.c; ++c) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c });
    const cell = ws[cellAddress] as { s?: unknown } | undefined;
    if (cell) {
      cell.s = {
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
        fill: { fgColor: { rgb: '1B5E20' }, patternType: 'solid' },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws as XLSX.WorkSheet, 'Campos');
  XLSX.writeFile(wb, 'plantilla_campos_arona.xlsx');
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const FieldImportModal: React.FC<FieldImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  isLoading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportFieldsResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setClientError(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    resetState();
    onClose();
  }, [isLoading, onClose, resetState]);

  const validateAndSetFile = (file?: File | null) => {
    setClientError(null);
    setImportResult(null);
    if (!file) return;

    const name = file.name.toLowerCase();
    const isExcel = name.endsWith('.xlsx');
    const isCsv = name.endsWith('.csv');

    if (!isExcel && !isCsv) {
      setClientError('Formato no válido. Debe seleccionar un archivo Excel (.xlsx) o CSV (.csv).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setClientError('El archivo es demasiado grande. El límite máximo es de 15MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    validateAndSetFile(event.target.files?.[0]);
  };

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    validateAndSetFile(event.dataTransfer.files?.[0]);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setClientError(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!selectedFile || isLoading) return;
    setClientError(null);
    setImportResult(null);

    try {
      const res = await onImport(selectedFile);
      if (res) {
        setImportResult(res);
        if (!res.fallidos || res.fallidos === 0) {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            handleClose();
          }, 1800);
        }
      }
    } catch (err: unknown) {
      const candidate = err as { response?: { data?: ImportFieldsResult } };
      const errorData = candidate?.response?.data;
      if (errorData && (errorData.errores || errorData.totalProcesados !== undefined)) {
        setImportResult(errorData);
      } else {
        setClientError(
          extractApiErrorMessage(err, 'Error inesperado al procesar el archivo en el servidor.')
        );
      }
    }
  };

  const isExcel = selectedFile?.name?.toLowerCase().endsWith('.xlsx');

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={handleClose}
      labelledBy="field-import-modal-title"
      isBusy={isLoading}
      zIndexClass="z-[150]"
      panelClassName="rounded-3xl max-w-xl w-full p-6 flex flex-col max-h-[90vh] overflow-hidden"
    >
      <div className="flex items-start justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <span className="material-icons-outlined text-2xl">upload_file</span>
          </div>
          <div>
            <h2 id="field-import-modal-title" className="text-lg font-bold text-gray-800">
              Importación Masiva de Campos
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Carga masiva de parcelas mediante archivo Excel (.xlsx) o CSV
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          aria-label="Cerrar modal"
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center border-none cursor-pointer transition-colors disabled:opacity-50"
        >
          <span className="material-icons-outlined text-base">close</span>
        </button>
      </div>

      <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-emerald-900 flex items-center gap-1.5">
              <span className="material-icons-outlined text-emerald-700 text-sm">download</span>
              ¿No tienes el formato oficial?
            </p>
            <p className="text-emerald-700 mt-0.5">
              Descarga una plantilla preconfigurada con columnas y ejemplos.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={downloadExcelTemplate}
              className="px-2.5 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 rounded-xl font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-xs"
            >
              <span className="material-icons-outlined text-sm text-green-700">table_view</span>
              Plantilla Excel
            </button>
            <button
              type="button"
              onClick={downloadCsvTemplate}
              className="px-2.5 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 rounded-xl font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-xs"
            >
              <span className="material-icons-outlined text-sm text-emerald-600">description</span>
              Plantilla CSV
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .csv"
          onChange={handleFileChange}
          aria-label="Seleccionar archivo Excel o CSV"
          className="hidden"
        />

        {!selectedFile ? (
          <button
            type="button"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-600 bg-emerald-50 scale-[0.99]'
                : 'border-gray-200 hover:border-emerald-500 hover:bg-gray-50/70 bg-white'
            }`}
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
              <span className="material-icons-outlined text-3xl">cloud_upload</span>
            </div>
            <p className="text-sm font-bold text-gray-800">
              Arrastra tu archivo aquí o haz clic para explorar
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Formatos permitidos: <span className="font-semibold text-emerald-700">.xlsx</span> (Excel) o{' '}
              <span className="font-semibold text-emerald-700">.csv</span> (máx. 15MB)
            </p>
          </button>
        ) : (
          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 font-bold ${
                  isExcel ? 'bg-emerald-600' : 'bg-teal-600'
                }`}
              >
                <span className="material-icons-outlined text-2xl">
                  {isExcel ? 'table_view' : 'description'}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                  <span className="font-medium">{formatFileSize(selectedFile.size)}</span>
                  <span>•</span>
                  <span className="uppercase font-semibold text-emerald-700">
                    {isExcel ? 'Excel Spreadsheet' : 'CSV Delimitado'}
                  </span>
                </div>
              </div>
            </div>

            {!isLoading && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 rounded-lg border-none bg-transparent cursor-pointer transition-colors"
                >
                  Cambiar
                </button>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  aria-label="Eliminar archivo seleccionado"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 border-none bg-transparent cursor-pointer transition-colors"
                >
                  <span className="material-icons-outlined text-lg">delete</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="p-3 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] text-gray-600 space-y-1.5">
          <p className="font-bold text-gray-700 flex items-center gap-1">
            <span className="material-icons-outlined text-xs text-amber-600">info</span>
            Especificaciones de validación (Backend Arona):
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-gray-500 pl-1">
            <li>
              <strong>Columnas esperadas:</strong>{' '}
              <code className="text-gray-700">
                nombre, ubicacion, hectareas, responsable, sistema_riego, tipo_suelo, zona, observaciones, estado
              </code>
            </li>
            <li>
              <strong>Riegos válidos:</strong> GOTEO, ASPERSION, GRAVEDAD
            </li>
            <li>
              <strong>Zonas válidas:</strong> Norte, Sur, Central, Este, Oeste
            </li>
            <li>
              <strong>Hectáreas:</strong> Valor numérico obligatorio mayor a 0
            </li>
          </ul>
        </div>

        {clientError && (
          <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2 animate-fade-in">
            <span className="material-icons-outlined text-red-500 text-base shrink-0">error</span>
            <p className="flex-1 font-medium">{clientError}</p>
          </div>
        )}

        {importResult && (
          <div
            className={`p-4 rounded-2xl border text-xs animate-fade-in ${
              importResult.fallidos === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-black/5 font-bold">
              <span className="flex items-center gap-1.5 text-sm">
                <span className="material-icons-outlined text-base">
                  {importResult.fallidos === 0 ? 'check_circle' : 'warning'}
                </span>
                {importResult.fallidos === 0
                  ? '¡Importación completada exitosamente!'
                  : 'Proceso de importación finalizado con observaciones'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-1 text-center font-semibold">
              <div className="bg-white/70 p-2 rounded-xl border border-black/5">
                <p className="text-[10px] uppercase text-gray-500">Procesados</p>
                <p className="text-base font-bold text-gray-800">
                  {importResult.totalProcesados ?? 0}
                </p>
              </div>
              <div className="bg-white/70 p-2 rounded-xl border border-black/5">
                <p className="text-[10px] uppercase text-emerald-600">Exitosos</p>
                <p className="text-base font-bold text-emerald-700">
                  {importResult.exitosos ?? 0}
                </p>
              </div>
              <div className="bg-white/70 p-2 rounded-xl border border-black/5">
                <p className="text-[10px] uppercase text-red-500">Fallidos</p>
                <p className="text-base font-bold text-red-700">{importResult.fallidos ?? 0}</p>
              </div>
            </div>

            {importResult.errores && importResult.errores.length > 0 && (
              <div className="mt-3 pt-2 border-t border-black/5">
                <p className="font-bold text-red-700 mb-1.5 flex items-center gap-1">
                  <span className="material-icons-outlined text-sm">report_problem</span>
                  Detalle de errores por fila ({importResult.errores.length}):
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1 bg-white/90 p-2.5 rounded-xl border border-red-200/60 font-mono text-[11px] text-red-800">
                  {importResult.errores.map((err, idx) => (
                    <div key={`${err}-${idx}`} className="flex items-start gap-1.5">
                      <span className="text-red-400 font-bold">•</span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          className="arona-btn-outline text-xs py-2 px-4 disabled:opacity-50"
        >
          {importResult && importResult.fallidos === 0 ? 'Cerrar' : 'Cancelar'}
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedFile || isLoading}
          className="arona-btn-primary text-xs py-2 px-5 shadow-md shadow-emerald-700/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="material-icons-outlined text-base animate-spin">refresh</span>
              Procesando en servidor...
            </>
          ) : (
            <>
              <span className="material-icons-outlined text-base">cloud_upload</span>
              Importar Campos
            </>
          )}
        </button>
      </div>
    </ModalDialog>
  );
};
