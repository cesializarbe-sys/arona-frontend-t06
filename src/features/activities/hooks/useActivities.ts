import { useState, useEffect, useCallback } from 'react';
import { activitiesApi } from '../api/activitiesApi';
import { fieldsApi } from '../../fields/api/fieldsApi';
import { cropsApi } from '../../crops/api/cropsApi';
import { useToast } from '../../../shared/context/ToastContext';
import { extractApiErrorMessage, isRequestCanceled } from '../../../shared/api/errorUtils';
import { useLatestRequest } from '../../../shared/hooks/useLatestRequest';
import { writeThenReload } from '../../../shared/utils/writeThenReload';
import { formatDate } from '../../../shared/utils/formatDate';
import type {
  Crop,
  EntityId,
  Field,
  FieldActivity,
  FieldActivityPayload,
} from '../../../shared/types/domain';

const ACTIVITY_ICON_MAP: Record<string, string> = {
  RIEGO: 'water_drop',
  PODA: 'content_cut',
  FUMIGACION: 'science',
  FERTILIZACION: 'eco',
  DESHIERBE: 'grass',
  OTRO: 'handyman',
};

const ACTIVITY_COLOR_MAP: Record<string, string> = {
  RIEGO: 'bg-blue-100 text-blue-600',
  PODA: 'bg-emerald-100 text-emerald-600',
  FUMIGACION: 'bg-purple-100 text-purple-600',
  FERTILIZACION: 'bg-amber-100 text-amber-600',
  DESHIERBE: 'bg-lime-100 text-lime-700',
  OTRO: 'bg-gray-100 text-gray-600',
};

export function useActivities() {
  const [activities, setActivities] = useState<FieldActivity[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const toast = useToast();
  const { begin } = useLatestRequest();

  const reloadDataOrThrow = useCallback(async () => {
    const { signal, isCurrent } = begin();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [activitiesData, fieldsData, cropsData] = await Promise.all([
        activitiesApi.getAll(signal),
        fieldsApi.getAll(signal).catch(() => fieldsApi.getActive(signal).catch(() => [] as Field[])),
        cropsApi.getAll(signal).catch(() => cropsApi.getActive(signal).catch(() => [] as Crop[])),
      ]);
      if (isCurrent()) {
        setActivities(activitiesData);
        setFields(fieldsData);
        setCrops(cropsData);
      }
    } catch (err) {
      if (!isCurrent() || isRequestCanceled(err)) return;
      const detail = extractApiErrorMessage(err, 'Error al cargar actividades.');
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
      toast.error(extractApiErrorMessage(err, 'Error al cargar actividades.'));
    }
  }, [reloadDataOrThrow, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const getFieldName = useCallback(
    (fieldId?: EntityId): string => {
      if (!fieldId) return '—';
      const target = String(fieldId).trim().toUpperCase();
      const found = fields.find(
        (f) => String(f.id || f.idCampo || f._id || '').trim().toUpperCase() === target
      );
      return found?.nombre ?? `Campo #${fieldId}`;
    },
    [fields]
  );

  const getCropName = useCallback(
    (cropId?: EntityId | null): string => {
      if (!cropId) return '';
      const target = String(cropId).trim().toUpperCase();
      const found = crops.find(
        (c) => String(c.id || c.idCultivo || c._id || '').trim().toUpperCase() === target
      );
      return found?.nombre ?? `Cultivo #${cropId}`;
    },
    [crops]
  );

  const createActivity = async (payload: FieldActivityPayload): Promise<FieldActivity> => {
    setIsLoading(true);
    try {
      return await writeThenReload({
        write: () => activitiesApi.create(payload),
        reload: reloadDataOrThrow,
        successMessage: 'Actividad registrada exitosamente',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al guardar actividad'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateActivity = async (
    id: EntityId,
    payload: FieldActivityPayload
  ): Promise<FieldActivity> => {
    setIsLoading(true);
    try {
      return await writeThenReload({
        write: () => activitiesApi.update(id, payload),
        reload: reloadDataOrThrow,
        successMessage: 'Actividad actualizada exitosamente',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al actualizar actividad'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteActivity = async (id: EntityId): Promise<void> => {
    try {
      await writeThenReload({
        write: () => activitiesApi.softDelete(id),
        reload: reloadDataOrThrow,
        successMessage: 'Actividad eliminada',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al eliminar actividad'));
    }
  };

  const restoreActivity = async (id: EntityId): Promise<void> => {
    try {
      await writeThenReload({
        write: () => activitiesApi.restore(id),
        reload: reloadDataOrThrow,
        successMessage: 'Actividad restaurada',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al restaurar actividad'));
    }
  };

  const getIcon = (type: string): string => ACTIVITY_ICON_MAP[type] ?? 'handyman';
  const getColor = (type: string): string =>
    ACTIVITY_COLOR_MAP[type] ?? 'bg-gray-100 text-gray-600';

  const formatActivityDate = (dateValue?: string): string => formatDate(dateValue) || '—';

  return {
    activities,
    fields,
    crops,
    isLoading,
    errorMessage,
    loadData,
    createActivity,
    updateActivity,
    getFieldName,
    getCropName,
    deleteActivity,
    restoreActivity,
    getIcon,
    getColor,
    formatActivityDate,
  };
}
