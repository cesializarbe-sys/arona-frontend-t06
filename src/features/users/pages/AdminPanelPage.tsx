import React from 'react';
import { useUsers } from '../hooks/useUsers';
import { useUserFilters } from '../hooks/useUserFilters';
import { useAdminPanelController } from '../hooks/useAdminPanelController';
import { UserModal } from '../components/UserModal';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { USER_ROLES } from '../../../shared/constants/domain';
import type { User } from '../../../shared/types/domain';

export const AdminPanelPage: React.FC = () => {
  const {
    users,
    isLoading,
    errorMessage,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    changePassword,
    exportToPdf,
    exportToExcel,
    totalAdmins,
    totalActive,
    isExportingPdf,
    isExportingExcel,
  } = useUsers();

  const {
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter,
    filteredUsers,
    hasActiveFilters,
  } = useUserFilters(users);

  const {
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
  } = useAdminPanelController({ createUser, updateUser, deleteUser, changePassword });

  const getInitials = (u: User): string => {
    const name =
      u.fullName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[var(--color-arona-700)] text-xs font-semibold uppercase tracking-wider mb-1">
            <span className="material-icons-outlined text-sm">shield</span>
            Consola Directiva
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            Panel de Administración del Sistema
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            Gestión integral de usuarios, asignación de roles y reportes institucionales
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void exportToPdf()}
            disabled={isExportingPdf}
            className="px-3.5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className="material-icons-outlined text-base">picture_as_pdf</span>
            {isExportingPdf ? 'Generando PDF...' : 'Exportar PDF'}
          </button>

          <button
            type="button"
            onClick={() => void exportToExcel()}
            disabled={isExportingExcel}
            className="px-3.5 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className="material-icons-outlined text-base">table_view</span>
            {isExportingExcel ? 'Generando Excel...' : 'Exportar Excel'}
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="arona-btn-primary shadow-lg shadow-emerald-700/20"
          >
            <span className="material-icons-outlined text-lg">person_add</span>
            Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="arona-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <span className="material-icons-outlined text-xl">groups</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Total Cuentas</p>
            <p className="text-2xl font-bold text-gray-800">{users.length}</p>
          </div>
        </div>

        <div className="arona-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <span className="material-icons-outlined text-xl">how_to_reg</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Usuarios Activos</p>
            <p className="text-2xl font-bold text-gray-800">{totalActive}</p>
          </div>
        </div>

        <div className="arona-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <span className="material-icons-outlined text-xl">security</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Administradores</p>
            <p className="text-2xl font-bold text-gray-800">{totalAdmins}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="arona-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                search
              </span>
              <input
                type="text"
                aria-label="Buscar usuarios por nombre, correo o DNI"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, correo, DNI..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 transition-all"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <select
                aria-label="Filtrar usuarios por rol"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 cursor-pointer"
              >
                <option value="">Todos los roles</option>
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r === 'ADMINISTRADOR' ? 'Administrador' : 'Encargado de Campo'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading && (
            <div className="text-center py-12 arona-card">
              <span className="material-icons-outlined text-4xl text-emerald-400 animate-spin">
                autorenew
              </span>
              <p className="text-sm font-semibold text-gray-500 mt-3">Cargando usuarios…</p>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div
              role="alert"
              className="arona-card p-6 border-l-4 border-red-500 bg-red-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <p className="text-sm font-bold text-red-900">Error al cargar usuarios</p>
                <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
              </div>
              <button type="button" onClick={() => void loadUsers()} className="arona-btn-outline text-xs py-2 px-4">
                Reintentar
              </button>
            </div>
          )}

          {!isLoading && !errorMessage && filteredUsers.length > 0 && (
            <div className="arona-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Usuario</th>
                      <th className="py-3.5 px-4">Correo</th>
                      <th className="py-3.5 px-4">DNI / Tel</th>
                      <th className="py-3.5 px-4">Rol &amp; Área</th>
                      <th className="py-3.5 px-4 text-center">Estado</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((u) => {
                      const id = String(u.id || '');
                      const name =
                        u.fullName ||
                        `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
                        u.email;
                      const isActive = u.active !== false;
                      return (
                        <tr
                          key={id}
                          className={`hover:bg-emerald-50/30 transition-colors ${
                            !isActive ? 'opacity-60 bg-gray-50/50' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[var(--color-arona-700)] font-bold flex items-center justify-center text-xs shrink-0">
                                {getInitials(u)}
                              </div>
                              <span className="font-bold text-gray-800">{name}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 font-medium">{u.email}</td>
                          <td className="py-3.5 px-4 text-gray-500">
                            {u.nationalId || '—'}
                            {u.phone && (
                              <span className="block text-[10px] text-gray-400">{u.phone}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`badge text-[10px] ${
                                u.role === 'ADMINISTRADOR' ? 'badge-info' : 'badge-neutral'
                              }`}
                            >
                              {u.role}
                            </span>
                            <span className="block text-[10px] text-gray-400 mt-0.5">
                              {u.area || 'CAMPO'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => void toggleUserStatus(u)}
                              aria-label={
                                isActive ? `Desactivar usuario ${name}` : `Activar usuario ${name}`
                              }
                              aria-pressed={isActive}
                              className="w-10 h-5 rounded-full relative border-none transition-all cursor-pointer inline-block"
                              style={{ backgroundColor: isActive ? '#2E7D32' : '#CBD5E1' }}
                            >
                              <div
                                className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-xs"
                                style={{ left: isActive ? '22px' : '2px' }}
                              />
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(u)}
                                aria-label={`Editar usuario ${name}`}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 border-none bg-transparent cursor-pointer"
                              >
                                <span className="material-icons-outlined text-base">edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeletingUser(u);
                                  setIsDeleteOpen(true);
                                }}
                                aria-label={`Eliminar usuario ${name}`}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 border-none bg-transparent cursor-pointer"
                              >
                                <span className="material-icons-outlined text-base">delete_outline</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isLoading && !errorMessage && filteredUsers.length === 0 && hasActiveFilters && (
            <div className="text-center py-12 arona-card">
              <span className="material-icons-outlined text-5xl text-gray-300">search_off</span>
              <p className="text-sm font-semibold text-gray-700 mt-3">
                No se encontraron usuarios con esos filtros
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('');
                }}
                className="px-4 py-2 mt-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 bg-white cursor-pointer"
              >
                Limpiar Filtros
              </button>
            </div>
          )}
        </div>

        <div className="arona-card p-6 h-fit">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <span className="material-icons-outlined text-xl">key</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Cambio de Contraseña</h3>
              <p className="text-xs text-[var(--color-text-muted)]">Seguridad de su cuenta actual</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="admin-pw-new"
                className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
              >
                Nueva Contraseña
              </label>
              <input
                id="admin-pw-new"
                type="password"
                value={pwForm.newPassword}
                onChange={(e) => setPwForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                placeholder="••••••••"
                aria-invalid={Boolean(pwError)}
                aria-describedby={pwError ? 'admin-pw-error' : undefined}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20"
              />
            </div>

            <div>
              <label
                htmlFor="admin-pw-confirm"
                className="text-xs font-semibold uppercase tracking-wider text-gray-600 block mb-1"
              >
                Confirmar Contraseña
              </label>
              <input
                id="admin-pw-confirm"
                type="password"
                value={pwForm.confirmPassword}
                onChange={(e) =>
                  setPwForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                placeholder="••••••••"
                aria-invalid={Boolean(pwError)}
                aria-describedby={pwError ? 'admin-pw-error' : undefined}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20"
              />
            </div>

            {pwError && (
              <p id="admin-pw-error" className="text-xs text-red-500 flex items-center gap-1">
                <span className="material-icons-outlined text-xs">error</span> {pwError}
              </p>
            )}

            {pwSuccess && (
              <p className="text-xs text-emerald-600 flex items-center gap-1 font-semibold">
                <span className="material-icons-outlined text-xs">check_circle</span> ¡Contraseña
                actualizada con éxito!
              </p>
            )}

            <button
              type="submit"
              disabled={isChangingPw}
              className="arona-btn-primary w-full justify-center disabled:opacity-50"
            >
              {isChangingPw ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveModal}
        initialData={editingUser}
        isLoading={isLoading}
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        title={`¿Eliminar cuenta de ${deletingUser?.fullName || deletingUser?.email}?`}
        message="Esta acción deshabilitará el acceso del usuario a la plataforma. Podrá reactivarlo en cualquier momento."
        confirmText="Eliminar"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};
