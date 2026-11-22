import { useState, useCallback } from 'react';
import type { EntityId, QualityReview, QualityReviewPayload } from '../../../shared/types/domain';

export interface UseQualityPageControllerOptions {
  createReview: (payload: QualityReviewPayload) => Promise<QualityReview>;
  updateReview: (id: EntityId, payload: QualityReviewPayload) => Promise<QualityReview>;
  deleteReview: (id: EntityId) => Promise<void>;
}

export function useQualityPageController({
  createReview,
  updateReview,
  deleteReview,
}: UseQualityPageControllerOptions) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<QualityReview | null>(null);
  const [deletingReview, setDeletingReview] = useState<QualityReview | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleOpenCreate = useCallback(() => {
    setEditingReview(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((review: QualityReview) => {
    setEditingReview(review);
    setIsModalOpen(true);
  }, []);

  const handleSaveModal = useCallback(
    async (payload: QualityReviewPayload) => {
      try {
        if (editingReview) {
          await updateReview(editingReview.id || editingReview.idRevision, payload);
        } else {
          await createReview(payload);
        }
        setIsModalOpen(false);
        setEditingReview(null);
      } catch (err) {
        console.error(err);
      }
    },
    [createReview, editingReview, updateReview]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingReview) return;
    await deleteReview(deletingReview.id || deletingReview.idRevision);
    setIsDeleteOpen(false);
    setDeletingReview(null);
  }, [deleteReview, deletingReview]);

  return {
    isModalOpen,
    setIsModalOpen,
    editingReview,
    deletingReview,
    setDeletingReview,
    isDeleteOpen,
    setIsDeleteOpen,
    handleOpenCreate,
    handleOpenEdit,
    handleSaveModal,
    handleConfirmDelete,
  };
}
