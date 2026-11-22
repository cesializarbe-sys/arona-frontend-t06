import { useState, useEffect, useCallback, useMemo } from 'react';
import { fieldsApi } from '../api/fieldsApi';
import { useToast } from '../../../shared/context/ToastContext';
import { extractApiErrorMessage, isRequestCanceled } from '../../../shared/api/errorUtils';
import { useLatestRequest } from '../../../shared/hooks/useLatestRequest';
import { writeThenReload } from '../../../shared/utils/writeThenReload';
import type {
  EntityId,
  Field,
  FieldPayload,
  ImportFieldsResult,
} from '../../../shared/types/domain';

export function useFields() {
  const [fields, setFields] = useState<Field[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const toast = useToast();
  const { begin } = useLatestRequest();

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const reloadFieldsOrThrow = useCallback(async () => {
    const { signal, isCurrent } = begin();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fieldsApi.getAll(signal);
      if (isCurrent()) {
        setFields(data);
      }
    } catch (err) {
      if (!isCurrent() || isRequestCanceled(err)) return;
      const detail = extractApiErrorMessage(err, 'Error al cargar los campos.');
      setErrorMessage(detail);
      throw err;
    } finally {
      if (isCurrent()) {
        setIsLoading(false);
      }
    }
  }, [begin]);

  const loadFields = useCallback(async () => {
    try {
      await reloadFieldsOrThrow();
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al cargar los campos.'));
    }
  }, [reloadFieldsOrThrow, toast]);

  useEffect(() => {
    void loadFields();
  }, [loadFields]);

  const filteredFields = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return fields;
    return fields.filter(
      (f) =>
        f.nombre?.toLowerCase().includes(query) ||
        (f.ubicacion && f.ubicacion.toLowerCase().includes(query)) ||
        (f.responsable && f.responsable.toLowerCase().includes(query))
    );
  }, [fields, searchTerm]);

  const totalHectares = useMemo(() => {
    const total = fields.reduce(
      (sum, f) => sum + Number(f.hectareas ?? f.areaHectareas ?? 0),
      0
    );
    return Number(total.toFixed(2));
  }, [fields]);

  const activeFieldsCount = useMemo(
    () => fields.filter((f) => f.estado !== false).length,
    [fields]
  );

  const createField = async (payload: FieldPayload): Promise<Field> => {
    setIsLoading(true);
    try {
      return await writeThenReload({
        write: () => fieldsApi.create(payload),
        reload: reloadFieldsOrThrow,
        successMessage: 'Campo creado exitosamente.',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al crear campo.'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = async (id: EntityId, payload: FieldPayload): Promise<Field> => {
    setIsLoading(true);
    try {
      return await writeThenReload({
        write: () => fieldsApi.update(id, payload),
        reload: reloadFieldsOrThrow,
        successMessage: 'Campo actualizado exitosamente.',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al actualizar campo.'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteField = async (id: EntityId): Promise<void> => {
    try {
      await writeThenReload({
        write: () => fieldsApi.softDelete(id),
        reload: reloadFieldsOrThrow,
        successMessage: 'Campo desactivado.',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al desactivar campo.'));
    }
  };

  const restoreField = async (id: EntityId): Promise<void> => {
    try {
      await writeThenReload({
        write: () => fieldsApi.restore(id),
        reload: reloadFieldsOrThrow,
        successMessage: 'Campo restaurado.',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al restaurar campo.'));
    }
  };

  const exportPdf = async (): Promise<void> => {
    if (fields.length === 0) {
      toast.warning('No hay campos para exportar a PDF.');
      return;
    }
    setIsExportingPdf(true);
    try {
      await fieldsApi.exportPdf();
      toast.success('Reporte PDF descargado exitosamente.');
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al generar el reporte en PDF.'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  const exportExcel = async (): Promise<void> => {
    if (fields.length === 0) {
      toast.warning('No hay campos para exportar a Excel.');
      return;
    }
    setIsExportingExcel(true);
    try {
      await fieldsApi.exportExcel();
      toast.success('Reporte Excel (.xlsx) descargado exitosamente.');
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al generar el archivo Excel.'));
    } finally {
      setIsExportingExcel(false);
    }
  };

  const importFields = async (file: File): Promise<ImportFieldsResult> => {
    setIsImporting(true);
    try {
      const result = await fieldsApi.importFile(file);
      await loadFields();
      if (!result.fallidos || result.fallidos === 0) {
        toast.success(
          `Importación exitosa: ${result.exitosos || result.totalProcesados || 0} campo(s) procesado(s).`
        );
      } else if ((result.exitosos ?? 0) > 0) {
        toast.warning(
          `Importación parcial: ${result.exitosos} guardado(s), ${result.fallidos} con error.`
        );
      } else {
        toast.error(`No se importó ningún registro (${result.fallidos} errores).`);
      }
      return result;
    } catch (err: unknown) {
      const candidate = err as { response?: { data?: ImportFieldsResult } };
      const backendResult = candidate?.response?.data;
      if (backendResult && (backendResult.errores || backendResult.totalProcesados !== undefined)) {
        await loadFields();
        return backendResult;
      }
      toast.error(extractApiErrorMessage(err, 'Error al importar archivo de campos.'));
      throw err;
    } finally {
      setIsImporting(false);
    }
  };

  return {
    fields,
    filteredFields,
    searchTerm,
    setSearchTerm,
    isLoading,
    errorMessage,
    totalHectares,
    activeFieldsCount,
    loadFields,
    createField,
    updateField,
    deleteField,
    restoreField,
    exportPdf,
    exportExcel,
    importFields,
    isExportingPdf,
    isExportingExcel,
    isImporting,
  };
}
