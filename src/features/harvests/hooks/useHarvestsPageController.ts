import { useState, useCallback } from 'react';
import type { EntityId, Harvest, HarvestPayload } from '../../../shared/types/domain';

export interface UseHarvestsPageControllerOptions {
  createHarvest: (payload: HarvestPayload) => Promise<Harvest>;
  updateHarvest: (id: EntityId, payload: HarvestPayload) => Promise<Harvest>;
  deleteHarvest: (id: EntityId) => Promise<void>;
}

export function useHarvestsPageController({
  createHarvest,
  updateHarvest,
  deleteHarvest,
}: UseHarvestsPageControllerOptions) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<Harvest | null>(null);
  const [deletingHarvest, setDeletingHarvest] = useState<Harvest | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleOpenCreate = useCallback(() => {
    setEditingHarvest(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((harvest: Harvest) => {
    setEditingHarvest(harvest);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleSaveModal = useCallback(
    async (payload: HarvestPayload) => {
      try {
        if (editingHarvest) {
          await updateHarvest(editingHarvest.id || editingHarvest.idCosecha, payload);
        } else {
          await createHarvest(payload);
        }
        setIsModalOpen(false);
        setEditingHarvest(null);
      } catch (err) {
        console.error(err);
      }
    },
    [createHarvest, editingHarvest, updateHarvest]
  );

  const handleRequestDelete = useCallback((harvest: Harvest) => {
    setDeletingHarvest(harvest);
    setIsDeleteOpen(true);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setIsDeleteOpen(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingHarvest) return;
    await deleteHarvest(deletingHarvest.id || deletingHarvest.idCosecha);
    setIsDeleteOpen(false);
    setDeletingHarvest(null);
  }, [deleteHarvest, deletingHarvest]);

  return {
    isModalOpen,
    editingHarvest,
    deletingHarvest,
    isDeleteOpen,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseModal,
    handleSaveModal,
    handleRequestDelete,
    handleCancelDelete,
    handleConfirmDelete,
  };
}
