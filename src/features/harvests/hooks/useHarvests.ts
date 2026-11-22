import { useState, useEffect, useCallback, useMemo } from 'react';
import { harvestsApi } from '../api/harvestsApi';
import { fieldsApi } from '../../fields/api/fieldsApi';
import { cropsApi } from '../../crops/api/cropsApi';
import { authApi } from '../../auth/api/authApi';
import { useToast } from '../../../shared/context/ToastContext';
import { extractApiErrorMessage, isRequestCanceled } from '../../../shared/api/errorUtils';
import { useLatestRequest } from '../../../shared/hooks/useLatestRequest';
import { writeThenReload } from '../../../shared/utils/writeThenReload';
import { kgToTonDisplay } from '../../../shared/utils/productionUtils';
import type {
  Crop,
  EntityId,
  Field,
  Harvest,
  HarvestPayload,
  User,
} from '../../../shared/types/domain';

export function useHarvests() {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const toast = useToast();
  const { begin } = useLatestRequest();

  const reloadDataOrThrow = useCallback(async () => {
    const { signal, isCurrent } = begin();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [harvestsData, fieldsData, cropsData, usersData] = await Promise.all([
        harvestsApi.getAll(signal),
        fieldsApi.getAll(signal).catch(() => fieldsApi.getActive(signal).catch(() => [] as Field[])),
        cropsApi.getAll(signal).catch(() => cropsApi.getActive(signal).catch(() => [] as Crop[])),
        authApi.getAllUsers(signal).catch(() => [] as User[]),
      ]);
      if (isCurrent()) {
        setHarvests(harvestsData);
        setFields(fieldsData);
        setCrops(cropsData);
        setUsers(usersData);
      }
    } catch (err) {
      if (!isCurrent() || isRequestCanceled(err)) return;
      const detail = extractApiErrorMessage(err, 'Error al cargar datos de cosechas.');
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
      toast.error(extractApiErrorMessage(err, 'Error al cargar datos de cosechas.'));
    }
  }, [reloadDataOrThrow, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const totalTons = useMemo(() => {
    const sum = harvests
      .filter((h) => h.estado !== false)
      .reduce((acc, h) => acc + (Number(h.cantidadKg) || 0), 0);
    return kgToTonDisplay(sum);
  }, [harvests]);

  const activeHarvestsCount = useMemo(
    () => harvests.filter((h) => h.estado !== false).length,
    [harvests]
  );

  const getFieldName = useCallback(
    (harvest: Harvest): string => {
      const fieldId =
        harvest.idCampo ||
        harvest.campo?.id ||
        (harvest.campo?.idCampo != null ? String(harvest.campo.idCampo) : '');
      if (fieldId) {
        const found = fields.find((f) => String(f.id || f.idCampo) === String(fieldId));
        if (found?.nombre) return found.nombre;
      }
      return harvest.campo?.nombre ?? '—';
    },
    [fields]
  );

  const getCropName = useCallback(
    (harvest: Harvest): string => {
      const cropId =
        harvest.idCultivo ||
        harvest.cultivo?.id ||
        (harvest.cultivo?.idCultivo != null ? String(harvest.cultivo.idCultivo) : '');
      if (cropId) {
        const found = crops.find((c) => String(c.id || c.idCultivo) === String(cropId));
        if (found?.nombre) return found.nombre;
      }
      return harvest.cultivo?.nombre ?? '—';
    },
    [crops]
  );

  const getUserName = useCallback(
    (harvest: Harvest): string => {
      if (harvest.usuario?.fullName) return harvest.usuario.fullName;
      const uid = harvest.idUsuario || harvest.usuario?.id;
      if (uid) {
        const found = users.find((u) => String(u.id) === String(uid));
        if (found) {
          return (
            found.fullName ||
            `${found.firstName || ''} ${found.lastName || ''}`.trim() ||
            found.email
          );
        }
        return `Usuario #${uid}`;
      }
      return '—';
    },
    [users]
  );

  const createHarvest = async (payload: HarvestPayload): Promise<Harvest> => {
    setIsLoading(true);
    try {
      return await writeThenReload({
        write: () => harvestsApi.create(payload),
        reload: reloadDataOrThrow,
        successMessage: 'Cosecha registrada',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al registrar cosecha'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateHarvest = async (id: EntityId, payload: HarvestPayload): Promise<Harvest> => {
    setIsLoading(true);
    try {
      return await writeThenReload({
        write: () => harvestsApi.update(id, payload),
        reload: reloadDataOrThrow,
        successMessage: 'Cosecha actualizada',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al actualizar cosecha'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteHarvest = async (id: EntityId): Promise<void> => {
    try {
      await writeThenReload({
        write: () => harvestsApi.softDelete(id),
        reload: reloadDataOrThrow,
        successMessage: 'Cosecha eliminada',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al eliminar cosecha'));
    }
  };

  const restoreHarvest = async (id: EntityId): Promise<void> => {
    try {
      await writeThenReload({
        write: () => harvestsApi.restore(id),
        reload: reloadDataOrThrow,
        successMessage: 'Cosecha restaurada',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al restaurar cosecha'));
    }
  };

  return {
    harvests,
    fields,
    crops,
    users,
    isLoading,
    errorMessage,
    loadData,
    totalTons,
    activeHarvestsCount,
    createHarvest,
    updateHarvest,
    getFieldName,
    getCropName,
    getUserName,
    deleteHarvest,
    restoreHarvest,
  };
}
