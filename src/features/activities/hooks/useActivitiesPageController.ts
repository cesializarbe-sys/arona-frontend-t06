import { useState, useCallback } from 'react';
import type { EntityId, FieldActivity, FieldActivityPayload } from '../../../shared/types/domain';

export interface UseActivitiesPageControllerOptions {
  createActivity: (payload: FieldActivityPayload) => Promise<FieldActivity>;
  updateActivity: (id: EntityId, payload: FieldActivityPayload) => Promise<FieldActivity>;
  deleteActivity: (id: EntityId) => Promise<void>;
}

export function useActivitiesPageController({
  createActivity,
  updateActivity,
  deleteActivity,
}: UseActivitiesPageControllerOptions) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<FieldActivity | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<FieldActivity | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleOpenCreate = useCallback(() => {
    setEditingActivity(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((activity: FieldActivity) => {
    setEditingActivity(activity);
    setIsModalOpen(true);
  }, []);

  const handleSaveModal = useCallback(
    async (payload: FieldActivityPayload) => {
      try {
        if (editingActivity) {
          await updateActivity(editingActivity.id || editingActivity.idActividad, payload);
        } else {
          await createActivity(payload);
        }
        setIsModalOpen(false);
        setEditingActivity(null);
      } catch (err) {
        console.error(err);
      }
    },
    [createActivity, editingActivity, updateActivity]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingActivity) return;
    await deleteActivity(deletingActivity.id || deletingActivity.idActividad);
    setIsDeleteOpen(false);
    setDeletingActivity(null);
  }, [deleteActivity, deletingActivity]);

  return {
    isModalOpen,
    setIsModalOpen,
    editingActivity,
    deletingActivity,
    setDeletingActivity,
    isDeleteOpen,
    setIsDeleteOpen,
    handleOpenCreate,
    handleOpenEdit,
    handleSaveModal,
    handleConfirmDelete,
  };
}
