import { useState, useEffect, useCallback, useMemo } from 'react';
import { alertsApi } from '../api/alertsApi';
import { fieldsApi } from '../../fields/api/fieldsApi';
import { cropsApi } from '../../crops/api/cropsApi';
import { authApi } from '../../auth/api/authApi';
import { useToast } from '../../../shared/context/ToastContext';
import { useNotifications } from '../../../shared/context/NotificationContext';
import { extractApiErrorMessage, isRequestCanceled } from '../../../shared/api/errorUtils';
import { useLatestRequest } from '../../../shared/hooks/useLatestRequest';
import { writeThenReload } from '../../../shared/utils/writeThenReload';
import type {
  AlertPayload,
  Crop,
  EntityId,
  Field,
  PhytosanitaryAlert,
  User,
} from '../../../shared/types/domain';

export function useAlerts() {
  const [alerts, setAlerts] = useState<PhytosanitaryAlert[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const toast = useToast();
  const { refresh: refreshNotifications } = useNotifications();
  const { begin } = useLatestRequest();

  const reloadDataOrThrow = useCallback(async () => {
    const { signal, isCurrent } = begin();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [alertsData, fieldsData, cropsData, usersData] = await Promise.all([
        alertsApi.getAll(signal),
        fieldsApi.getAll(signal).catch(() => fieldsApi.getActive(signal).catch(() => [] as Field[])),
        cropsApi.getAll(signal).catch(() => cropsApi.getActive(signal).catch(() => [] as Crop[])),
        authApi.getAllUsers(signal).catch(() => [] as User[]),
      ]);
      if (isCurrent()) {
        setAlerts(alertsData);
        setFields(fieldsData);
        setCrops(cropsData);
        setUsers(usersData);
      }
    } catch (err) {
      if (!isCurrent() || isRequestCanceled(err)) return;
      const detail = extractApiErrorMessage(err, 'Error al cargar alertas fitosanitarias.');
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
      toast.error(extractApiErrorMessage(err, 'Error al cargar alertas fitosanitarias.'));
    }
  }, [reloadDataOrThrow, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const pendingAlerts = useMemo(
    () => alerts.filter((a) => !a.atendida && !a.solucionAplicada),
    [alerts]
  );

  const getFieldName = useCallback(
    (fieldId?: EntityId): string => {
      if (!fieldId) return 'Campo no especificado';
      const target = String(fieldId).trim().toUpperCase();
      const found = fields.find(
        (f) => String(f.id || f.idCampo || f._id || '').trim().toUpperCase() === target
      );
      return found?.nombre || `Campo #${fieldId}`;
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
      return found?.nombre || `Cultivo #${cropId}`;
    },
    [crops]
  );

  const getUserName = useCallback(
    (userId?: EntityId): string => {
      if (!userId) return '';
      const found = users.find((u) => String(u.id) === String(userId));
      return found
        ? found.fullName || `${found.firstName || ''} ${found.lastName || ''}`.trim()
        : `Usuario #${userId}`;
    },
    [users]
  );

  const createAlert = async (payload: AlertPayload): Promise<PhytosanitaryAlert> => {
    setIsLoading(true);
    try {
      const created = await writeThenReload({
        write: () => alertsApi.create(payload),
        reload: reloadDataOrThrow,
        successMessage: 'Alerta reportada exitosamente',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
      void refreshNotifications();
      return created;
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al reportar alerta'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAlert = async (id: EntityId, payload: AlertPayload): Promise<PhytosanitaryAlert> => {
    setIsLoading(true);
    try {
      const updated = await writeThenReload({
        write: () => alertsApi.update(id, payload),
        reload: reloadDataOrThrow,
        successMessage: 'Alerta actualizada exitosamente',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
      void refreshNotifications();
      return updated;
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al actualizar alerta'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const attendAlert = async (id: EntityId, solution: string): Promise<void> => {
    try {
      await writeThenReload({
        write: () => alertsApi.attend(id, solution),
        reload: reloadDataOrThrow,
        successMessage: 'Alerta marcada como ATENDIDA',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
      void refreshNotifications();
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al atender alerta'));
    }
  };

  const deleteAlert = async (id: EntityId): Promise<void> => {
    try {
      await writeThenReload({
        write: () => alertsApi.softDelete(id),
        reload: reloadDataOrThrow,
        successMessage: 'Alerta eliminada',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
      void refreshNotifications();
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al eliminar alerta'));
    }
  };

  const restoreAlert = async (id: EntityId): Promise<void> => {
    try {
      await writeThenReload({
        write: () => alertsApi.restore(id),
        reload: reloadDataOrThrow,
        successMessage: 'Alerta restaurada',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
      void refreshNotifications();
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al restaurar alerta'));
    }
  };

  const getSeverityClass = (type: string): string => {
    switch (type) {
      case 'PLAGA':
        return 'bg-red-100 text-red-700';
      case 'ENFERMEDAD':
        return 'bg-orange-100 text-orange-700';
      case 'OTRO':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getIcon = (type: string): string => {
    switch (type) {
      case 'PLAGA':
        return '🐛';
      case 'ENFERMEDAD':
        return '🍂';
      case 'OTRO':
        return '⚠️';
      default:
        return '🌿';
    }
  };

  return {
    alerts,
    fields,
    crops,
    users,
    pendingAlerts,
    isLoading,
    errorMessage,
    loadData,
    createAlert,
    updateAlert,
    getFieldName,
    getCropName,
    getUserName,
    attendAlert,
    deleteAlert,
    restoreAlert,
    getSeverityClass,
    getIcon,
  };
}
