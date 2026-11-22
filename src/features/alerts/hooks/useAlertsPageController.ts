import { useState, useCallback } from 'react';
import type { AlertPayload, EntityId, PhytosanitaryAlert } from '../../../shared/types/domain';

export interface UseAlertsPageControllerOptions {
  createAlert: (payload: AlertPayload) => Promise<PhytosanitaryAlert>;
  updateAlert: (id: EntityId, payload: AlertPayload) => Promise<PhytosanitaryAlert>;
  attendAlert: (id: EntityId, solution: string) => Promise<void>;
  deleteAlert: (id: EntityId) => Promise<void>;
}

export function useAlertsPageController({
  createAlert,
  updateAlert,
  attendAlert,
  deleteAlert,
}: UseAlertsPageControllerOptions) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<PhytosanitaryAlert | null>(null);
  const [attendTarget, setAttendTarget] = useState<PhytosanitaryAlert | null>(null);
  const [isAttendOpen, setIsAttendOpen] = useState(false);
  const [deletingAlert, setDeletingAlert] = useState<PhytosanitaryAlert | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleOpenCreate = useCallback(() => {
    setEditingAlert(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((alert: PhytosanitaryAlert) => {
    setEditingAlert(alert);
    setIsModalOpen(true);
  }, []);

  const handleSaveModal = useCallback(
    async (payload: AlertPayload) => {
      try {
        if (editingAlert) {
          await updateAlert(editingAlert.id || editingAlert.idAlerta, payload);
        } else {
          await createAlert(payload);
        }
        setIsModalOpen(false);
        setEditingAlert(null);
      } catch (err) {
        console.error(err);
      }
    },
    [createAlert, editingAlert, updateAlert]
  );

  const handleOpenAttend = useCallback((alert: PhytosanitaryAlert) => {
    setAttendTarget(alert);
    setIsAttendOpen(true);
  }, []);

  const handleConfirmAttend = useCallback(
    async (id: EntityId, solution: string) => {
      await attendAlert(id, solution);
      setIsAttendOpen(false);
      setAttendTarget(null);
    },
    [attendAlert]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingAlert) return;
    await deleteAlert(deletingAlert.id || deletingAlert.idAlerta);
    setIsDeleteOpen(false);
    setDeletingAlert(null);
  }, [deleteAlert, deletingAlert]);

  return {
    isModalOpen,
    setIsModalOpen,
    editingAlert,
    attendTarget,
    isAttendOpen,
    setIsAttendOpen,
    deletingAlert,
    setDeletingAlert,
    isDeleteOpen,
    setIsDeleteOpen,
    handleOpenCreate,
    handleOpenEdit,
    handleSaveModal,
    handleOpenAttend,
    handleConfirmAttend,
    handleConfirmDelete,
  };
}
