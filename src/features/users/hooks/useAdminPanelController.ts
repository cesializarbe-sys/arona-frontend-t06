import { useState, useCallback, type FormEvent } from 'react';
import { extractApiErrorMessage } from '../../../shared/api/errorUtils';
import type { EntityId, User, UserPayload } from '../../../shared/types/domain';

export interface UseAdminPanelControllerOptions {
  createUser: (payload: UserPayload) => Promise<User>;
  updateUser: (id: EntityId, payload: UserPayload) => Promise<User>;
  deleteUser: (id: EntityId) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}

export function useAdminPanelController({
  createUser,
  updateUser,
  deleteUser,
  changePassword,
}: UseAdminPanelControllerOptions) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  const handleOpenCreate = useCallback(() => {
    setEditingUser(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  }, []);

  const handleSaveModal = useCallback(
    async (payload: UserPayload) => {
      try {
        if (editingUser) {
          await updateUser(editingUser.id || '', payload);
        } else {
          await createUser(payload);
        }
        setIsModalOpen(false);
        setEditingUser(null);
      } catch (err) {
        console.error(err);
      }
    },
    [createUser, editingUser, updateUser]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingUser) return;
    await deleteUser(deletingUser.id || '');
    setIsDeleteOpen(false);
    setDeletingUser(null);
  }, [deleteUser, deletingUser]);

  const handlePasswordSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setPwError('');
      setPwSuccess(false);

      if (!pwForm.newPassword || pwForm.newPassword.length < 6) {
        setPwError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (pwForm.newPassword !== pwForm.confirmPassword) {
        setPwError('Las contraseñas no coinciden');
        return;
      }

      setIsChangingPw(true);
      try {
        await changePassword(pwForm.newPassword);
        setPwSuccess(true);
        setPwForm({ newPassword: '', confirmPassword: '' });
      } catch (err) {
        setPwError(extractApiErrorMessage(err, 'Error al actualizar contraseña'));
      } finally {
        setIsChangingPw(false);
      }
    },
    [changePassword, pwForm]
  );

  return {
    isModalOpen,
    setIsModalOpen,
    editingUser,
    deletingUser,
    setDeletingUser,
    isDeleteOpen,
    setIsDeleteOpen,
    pwForm,
    setPwForm,
    pwError,
    pwSuccess,
    isChangingPw,
    handleOpenCreate,
    handleOpenEdit,
    handleSaveModal,
    handleConfirmDelete,
    handlePasswordSubmit,
  };
}
