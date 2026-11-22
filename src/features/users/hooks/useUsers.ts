import { useState, useEffect, useCallback, useMemo } from 'react';
import { authApi } from '../../auth/api/authApi';
import { useAuth } from '../../auth/context/AuthContext';
import { useToast } from '../../../shared/context/ToastContext';
import { extractApiErrorMessage, isRequestCanceled } from '../../../shared/api/errorUtils';
import { useLatestRequest } from '../../../shared/hooks/useLatestRequest';
import { writeThenReload } from '../../../shared/utils/writeThenReload';
import { exportUsersPdf, exportUsersExcel } from '../../../shared/utils/exportUtils';
import type { EntityId, User, UserPayload } from '../../../shared/types/domain';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const { currentUser } = useAuth();
  const toast = useToast();
  const { begin } = useLatestRequest();

  const reloadUsersOrThrow = useCallback(async () => {
    const { signal, isCurrent } = begin();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await authApi.getAllUsers(signal);
      if (isCurrent()) {
        setUsers(data);
      }
    } catch (err) {
      if (!isCurrent() || isRequestCanceled(err)) return;
      const detail = extractApiErrorMessage(err, 'Error al cargar usuarios.');
      setErrorMessage(detail);
      throw err;
    } finally {
      if (isCurrent()) {
        setIsLoading(false);
      }
    }
  }, [begin]);

  const loadUsers = useCallback(async () => {
    try {
      await reloadUsersOrThrow();
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al cargar usuarios.'));
    }
  }, [reloadUsersOrThrow, toast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return users.filter((u) => {
      const name = (
        u.fullName ||
        `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
        u.email ||
        ''
      ).toLowerCase();
      const email = (u.email || '').toLowerCase();
      const nationalId = (u.nationalId || '').toLowerCase();
      return !term || name.includes(term) || email.includes(term) || nationalId.includes(term);
    });
  }, [users, searchTerm]);

  const totalAdmins = useMemo(
    () =>
      users.filter((u) => {
        const r = String(u.role || '').toUpperCase();
        return r === 'ADMINISTRADOR' || r === 'ADMIN';
      }).length,
    [users]
  );

  const totalActive = useMemo(
    () => users.filter((u) => u.active !== false).length,
    [users]
  );

  const createUser = async (payload: UserPayload): Promise<User> => {
    setIsLoading(true);
    try {
      return await writeThenReload({
        write: () => authApi.createUser(payload),
        reload: reloadUsersOrThrow,
        successMessage: 'Usuario registrado exitosamente',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al guardar el usuario'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (id: EntityId, payload: UserPayload): Promise<User> => {
    setIsLoading(true);
    try {
      return await writeThenReload({
        write: () => authApi.updateUser(id, payload),
        reload: reloadUsersOrThrow,
        successMessage: 'Usuario actualizado exitosamente',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al actualizar usuario'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUserStatus = async (user: User): Promise<void> => {
    const id = user.id;
    if (!id) return;
    try {
      const isDeactivating = user.active !== false;
      await writeThenReload({
        write: () => (isDeactivating ? authApi.deleteUser(id) : authApi.restoreUser(id)),
        reload: reloadUsersOrThrow,
        successMessage: isDeactivating ? 'Usuario desactivado' : 'Usuario restaurado',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al cambiar estado del usuario'));
    }
  };

  const deleteUser = async (id: EntityId): Promise<void> => {
    try {
      await writeThenReload({
        write: () => authApi.deleteUser(id),
        reload: reloadUsersOrThrow,
        successMessage: 'Usuario eliminado',
        notifySuccess: toast.success,
        notifyWarning: toast.warning,
      });
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al eliminar usuario'));
    }
  };

  const changePassword = async (newPassword: string): Promise<void> => {
    const userId = currentUser?.id;
    if (!userId) {
      toast.error('No se pudo identificar al usuario logueado');
      return;
    }
    try {
      await authApi.changePassword(userId, newPassword);
      toast.success('Contraseña actualizada correctamente');
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Error al cambiar contraseña'));
      throw err;
    }
  };

  const exportToPdf = async (): Promise<void> => {
    if (!filteredUsers.length) {
      toast.warning('No hay usuarios para exportar.');
      return;
    }
    setIsExportingPdf(true);
    try {
      await exportUsersPdf(filteredUsers);
      toast.success(`PDF generado — ${filteredUsers.length} registro(s) exportado(s)`);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'No se pudo generar el PDF.'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  const exportToExcel = async (): Promise<void> => {
    if (!filteredUsers.length) {
      toast.warning('No hay usuarios para exportar.');
      return;
    }
    setIsExportingExcel(true);
    try {
      await exportUsersExcel(filteredUsers);
      toast.success(`Excel generado — ${filteredUsers.length} registro(s) exportado(s)`);
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'No se pudo generar el Excel.'));
    } finally {
      setIsExportingExcel(false);
    }
  };

  return {
    users,
    filteredUsers,
    searchTerm,
    setSearchTerm,
    isLoading,
    errorMessage,
    isExportingPdf,
    isExportingExcel,
    totalAdmins,
    totalActive,
    loadUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    changePassword,
    exportToPdf,
    exportToExcel,
  };
}
