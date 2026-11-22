import { useState, useEffect, useCallback, useMemo } from 'react';
import { cropsApi } from '../api/cropsApi';
import { fieldsApi } from '../../fields/api/fieldsApi';
import { useToast } from '../../../shared/context/ToastContext';
import { extractApiErrorMessage, isRequestCanceled } from '../../../shared/api/errorUtils';
import { useLatestRequest } from '../../../shared/hooks/useLatestRequest';
import { writeThenReload } from '../../../shared/utils/writeThenReload';
import type { Crop, CropPayload, EntityId, Field } from '../../../shared/types/domain';

export function useCrops() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const toast = useToast();
  const { begin } = useLatestRequest();

  const reloadDataOrThrow = useCallback(async () => {
    const { signal, isCurrent } = begin();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [cropsData, fieldsData] = await Promise.all([
        cropsApi.getAll(signal),
        fieldsApi.getAll(signal).catch(() => fieldsApi.getActive(signal).catch(() => [] as Field[])),
      ]);
      if (isCurrent()) {
        setCrops(cropsData);
        setFields(fieldsData);
      }
    } catch (err) {
      if (!isCurrent() || isRequestCanceled(err)) return;
      const detail = extractApiErrorMessage(err, 'Error al cargar cultivos.');
      setErrorMessage(detail);
      throw err;
    } finally {
      if (isCurrent()) {
        setIsLoading(false);
      }
    }
  }, [begin]);

  const loadData = useCallback(async () => {
    try {
      await reloadDataOrThrow();
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al cargar cultivos.'));
    }
  }, [reloadDataOrThrow, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredCrops = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return crops.filter(
      (c) =>
        !term ||
        c.nombre?.toLowerCase().includes(term) ||
        c.tipoCultivo?.toLowerCase().includes(term)
    );
  }, [crops, searchTerm]);

  const getFieldName = useCallback(
    (crop: Crop): string => {
      const fieldId =
        crop?.campoId ||
        crop?.idCampo ||
        crop?.campo?.id ||
        (crop?.campo?.idCampo != null ? String(crop.campo.idCampo) : '');
      if (!fieldId) return crop?.campo?.nombre ?? 'Sin campo asignado';
      const found = fields.find((f) => String(f.id || f.idCampo) === String(fieldId));
      return found?.nombre ?? crop?.campo?.nombre ?? 'Sin campo asignado';
    },
    [fields]
  );

  const createCrop = async (payload: CropPayload): Promise<Crop> => {
    setIsLoading(true);
    try {
      return await writeThenReload({
        write: () => cropsApi.create(payload),
        reload: reloadDataOrThrow,
        successMessage: 'Cultivo registrado',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al guardar cultivo'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCrop = async (id: EntityId, payload: CropPayload): Promise<Crop> => {
    setIsLoading(true);
    try {
      return await writeThenReload({
        write: () => cropsApi.update(id, payload),
        reload: reloadDataOrThrow,
        successMessage: 'Cultivo actualizado',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al actualizar cultivo'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCrop = async (id: EntityId): Promise<void> => {
    try {
      await writeThenReload({
        write: () => cropsApi.softDelete(id),
        reload: reloadDataOrThrow,
        successMessage: 'Cultivo eliminado',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al eliminar cultivo'));
    }
  };

  const restoreCrop = async (id: EntityId): Promise<void> => {
    try {
      await writeThenReload({
        write: () => cropsApi.restore(id),
        reload: reloadDataOrThrow,
        successMessage: 'Cultivo restaurado',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al restaurar cultivo'));
    }
  };

  const getHealthBadgeClass = (health?: string): string => {
    switch (health) {
      case 'BUENO':
        return 'badge-success';
      case 'EN_RIESGO':
        return 'badge-warning';
      case 'CON_PROBLEMAS':
        return 'badge-danger';
      default:
        return 'badge-neutral';
    }
  };

  const getHealthIcon = (health?: string): string => {
    switch (health) {
      case 'BUENO':
        return 'check_circle';
      case 'EN_RIESGO':
        return 'warning_amber';
      case 'CON_PROBLEMAS':
        return 'error';
      default:
        return 'help_outline';
    }
  };

  return {
    crops,
    fields,
    filteredCrops,
    searchTerm,
    setSearchTerm,
    isLoading,
    errorMessage,
    loadData,
    createCrop,
    updateCrop,
    getFieldName,
    deleteCrop,
    restoreCrop,
    getHealthBadgeClass,
    getHealthIcon,
  };
}
