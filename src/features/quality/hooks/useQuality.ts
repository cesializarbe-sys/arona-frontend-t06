import { useState, useEffect, useCallback, useMemo } from 'react';
import { qualityApi } from '../api/qualityApi';
import { harvestsApi } from '../../harvests/api/harvestsApi';
import { fieldsApi } from '../../fields/api/fieldsApi';
import { cropsApi } from '../../crops/api/cropsApi';
import { authApi } from '../../auth/api/authApi';
import { useToast } from '../../../shared/context/ToastContext';
import { extractApiErrorMessage, isRequestCanceled } from '../../../shared/api/errorUtils';
import { useLatestRequest } from '../../../shared/hooks/useLatestRequest';
import { writeThenReload } from '../../../shared/utils/writeThenReload';
import type {
  Crop,
  EntityId,
  Field,
  Harvest,
  QualityReview,
  QualityReviewPayload,
  User,
} from '../../../shared/types/domain';

export function useQuality() {
  const [reviews, setReviews] = useState<QualityReview[]>([]);
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
      const [reviewsData, harvestsData, fieldsData, cropsData, usersData] = await Promise.all([
        qualityApi.getAll(signal),
        harvestsApi.getAll(signal).catch(() => [] as Harvest[]),
        fieldsApi.getAll(signal).catch(() => fieldsApi.getActive(signal).catch(() => [] as Field[])),
        cropsApi.getAll(signal).catch(() => cropsApi.getActive(signal).catch(() => [] as Crop[])),
        authApi.getAllUsers(signal).catch(() => [] as User[]),
      ]);

      const findField = (fieldId?: EntityId) => {
        if (!fieldId) return undefined;
        const target = String(fieldId).trim().toUpperCase();
        return fieldsData.find(
          (f) => String(f.id || f.idCampo || f._id || '').trim().toUpperCase() === target
        );
      };

      const findCrop = (cropId?: EntityId) => {
        if (!cropId) return undefined;
        const target = String(cropId).trim().toUpperCase();
        return cropsData.find(
          (c) => String(c.id || c.idCultivo || c._id || '').trim().toUpperCase() === target
        );
      };

      const enrichedHarvests: Harvest[] = harvestsData.map((h) => {
        const matchedField = findField(h.idCampo || h.campo?.id || h.campo?.idCampo);
        const matchedCrop = findCrop(h.idCultivo || h.cultivo?.id || h.cultivo?.idCultivo);
        return {
          ...h,
          campo: h.campo?.nombre ? h.campo : matchedField || h.campo,
          cultivo: h.cultivo?.nombre ? h.cultivo : matchedCrop || h.cultivo,
        };
      });

      if (isCurrent()) {
        setReviews(reviewsData);
        setHarvests(enrichedHarvests);
        setFields(fieldsData);
        setCrops(cropsData);
        setUsers(usersData);
      }
    } catch (err) {
      if (!isCurrent() || isRequestCanceled(err)) return;
      const detail = extractApiErrorMessage(err, 'Error al cargar revisiones de calidad.');
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
      toast.error(extractApiErrorMessage(err, 'Error al cargar revisiones de calidad.'));
    }
  }, [reloadDataOrThrow, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const approvedCount = useMemo(
    () => reviews.filter((r) => r.cumpleRequisitos).length,
    [reviews]
  );

  const rejectedCount = useMemo(
    () => reviews.filter((r) => !r.cumpleRequisitos).length,
    [reviews]
  );

  const approvalRate = useMemo(() => {
    return reviews.length ? ((approvedCount / reviews.length) * 100).toFixed(1) : '0';
  }, [reviews.length, approvedCount]);

  const getHarvestDisplay = useCallback(
    (review: QualityReview): string => {
      const harvestId = review.idCosecha ?? review.cosecha?.idCosecha ?? review.cosecha?.id;
      if (harvestId == null) return '—';
      const foundHarvest = harvests.find(
        (h) => String(h.id || h.idCosecha) === String(harvestId)
      );
      if (foundHarvest) {
        const targetCropId = String(foundHarvest.idCultivo || '').trim().toUpperCase();
        const targetFieldId = String(foundHarvest.idCampo || '').trim().toUpperCase();
        const matchedCrop = crops.find(
          (c) => String(c.id || c.idCultivo || c._id || '').trim().toUpperCase() === targetCropId
        );
        const matchedField = fields.find(
          (f) => String(f.id || f.idCampo || f._id || '').trim().toUpperCase() === targetFieldId
        );
        const cropLabel =
          foundHarvest.cultivo?.nombre ||
          matchedCrop?.nombre ||
          foundHarvest.idCultivo ||
          'Cultivo';
        const fieldLabel =
          foundHarvest.campo?.nombre ||
          matchedField?.nombre ||
          foundHarvest.idCampo ||
          'Campo';
        return `#${harvestId} · ${cropLabel} – ${fieldLabel}`;
      }
      return `Cosecha #${harvestId}`;
    },
    [harvests, crops, fields]
  );

  const getSupervisorDisplay = useCallback(
    (review: QualityReview): string => {
      const supervisorId =
        review.idUsuarioSupervisor ??
        review.idSupervisor ??
        review.supervisor?.id;
      if (!supervisorId) return review.supervisor?.fullName || '—';
      const found = users.find((u) => String(u.id) === String(supervisorId));
      return found
        ? found.fullName || `${found.firstName || ''} ${found.lastName || ''}`.trim()
        : review.supervisor?.fullName || `Usuario #${supervisorId}`;
    },
    [users]
  );

  const createReview = async (payload: QualityReviewPayload): Promise<QualityReview> => {
    setIsLoading(true);
    try {
      return await writeThenReload({
        write: () => qualityApi.create(payload),
        reload: reloadDataOrThrow,
        successMessage: 'Revisión registrada',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al guardar revisión'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateReview = async (
    id: EntityId,
    payload: QualityReviewPayload
  ): Promise<QualityReview> => {
    setIsLoading(true);
    try {
      return await writeThenReload({
        write: () => qualityApi.update(id, payload),
        reload: reloadDataOrThrow,
        successMessage: 'Revisión actualizada',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al actualizar revisión'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteReview = async (id: EntityId): Promise<void> => {
    try {
      await writeThenReload({
        write: () => qualityApi.softDelete(id),
        reload: reloadDataOrThrow,
        successMessage: 'Revisión eliminada',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al eliminar revisión'));
    }
  };

  const restoreReview = async (id: EntityId): Promise<void> => {
    try {
      await writeThenReload({
        write: () => qualityApi.restore(id),
        reload: reloadDataOrThrow,
        successMessage: 'Revisión restaurada',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al restaurar revisión'));
    }
  };

  return {
    reviews,
    harvests,
    users,
    isLoading,
    errorMessage,
    approvedCount,
    rejectedCount,
    approvalRate,
    loadData,
    createReview,
    updateReview,
    getHarvestDisplay,
    getSupervisorDisplay,
    deleteReview,
    restoreReview,
  };
}
