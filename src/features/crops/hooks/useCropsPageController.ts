import { useState, useCallback } from 'react';
import type { Crop, CropPayload, EntityId } from '../../../shared/types/domain';

export interface UseCropsPageControllerOptions {
  createCrop: (payload: CropPayload) => Promise<Crop>;
  updateCrop: (id: EntityId, payload: CropPayload) => Promise<Crop>;
  deleteCrop: (id: EntityId) => Promise<void>;
}

export function useCropsPageController({
  createCrop,
  updateCrop,
  deleteCrop,
}: UseCropsPageControllerOptions) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [deletingCrop, setDeletingCrop] = useState<Crop | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleOpenCreate = useCallback(() => {
    setEditingCrop(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((crop: Crop) => {
    setEditingCrop(crop);
    setIsModalOpen(true);
  }, []);

  const handleSaveModal = useCallback(
    async (payload: CropPayload) => {
      try {
        if (editingCrop) {
          await updateCrop(editingCrop.id || editingCrop.idCultivo, payload);
        } else {
          await createCrop(payload);
        }
        setIsModalOpen(false);
        setEditingCrop(null);
      } catch (err) {
        console.error(err);
      }
    },
    [createCrop, editingCrop, updateCrop]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingCrop) return;
    await deleteCrop(deletingCrop.id || deletingCrop.idCultivo);
    setIsDeleteOpen(false);
    setDeletingCrop(null);
  }, [deleteCrop, deletingCrop]);

  return {
    isModalOpen,
    setIsModalOpen,
    editingCrop,
    deletingCrop,
    setDeletingCrop,
    isDeleteOpen,
    setIsDeleteOpen,
    handleOpenCreate,
    handleOpenEdit,
    handleSaveModal,
    handleConfirmDelete,
  };
}
