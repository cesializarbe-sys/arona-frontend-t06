import { useState, useCallback } from 'react';
import type { EntityId, Field, FieldPayload } from '../../../shared/types/domain';

export interface UseFieldsPageControllerOptions {
  createField: (payload: FieldPayload) => Promise<Field>;
  updateField: (id: EntityId, payload: FieldPayload) => Promise<Field>;
  deleteField: (id: EntityId) => Promise<void>;
  restoreField: (id: EntityId) => Promise<void>;
}

export function useFieldsPageController({
  createField,
  updateField,
  deleteField,
  restoreField,
}: UseFieldsPageControllerOptions) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pendingToggleField, setPendingToggleField] = useState<Field | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [detailField, setDetailField] = useState<Field | null>(null);

  const handleOpenCreate = useCallback(() => {
    setEditingField(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((field: Field) => {
    setEditingField(field);
    setIsModalOpen(true);
  }, []);

  const handleSaveModal = useCallback(
    async (payload: FieldPayload) => {
      try {
        if (editingField) {
          const id = editingField.id || editingField.idCampo;
          await updateField(id, payload);
        } else {
          await createField(payload);
        }
        setIsModalOpen(false);
        setEditingField(null);
      } catch (err) {
        console.error(err);
      }
    },
    [createField, editingField, updateField]
  );

  const handleToggleStatusRequest = useCallback((field: Field) => {
    setPendingToggleField(field);
    setIsConfirmOpen(true);
  }, []);

  const handleConfirmToggle = useCallback(async () => {
    if (!pendingToggleField) return;
    const id = pendingToggleField.id || pendingToggleField.idCampo;
    if (pendingToggleField.estado) {
      await deleteField(id);
    } else {
      await restoreField(id);
    }
    setIsConfirmOpen(false);
    setPendingToggleField(null);
  }, [deleteField, pendingToggleField, restoreField]);

  return {
    isModalOpen,
    setIsModalOpen,
    editingField,
    isImportModalOpen,
    setIsImportModalOpen,
    pendingToggleField,
    isConfirmOpen,
    setIsConfirmOpen,
    detailField,
    setDetailField,
    handleOpenCreate,
    handleOpenEdit,
    handleSaveModal,
    handleToggleStatusRequest,
    handleConfirmToggle,
  };
}
