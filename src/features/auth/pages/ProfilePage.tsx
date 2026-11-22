import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { useToast } from '../../../shared/context/ToastContext';

const PROFILE_TABS = ['Información Personal', 'Certificaciones'] as const;
type ProfileTab = (typeof PROFILE_TABS)[number];

export const ProfilePage: React.FC = () => {
  const { currentUser, userName, userRole, userInitials, updateStoredUser } = useAuth();
  const { info: toastInfo } = useToast();

  const [activeTab, setActiveTab] = useState<ProfileTab>('Información Personal');
  const fetchedUserIdRef = useRef<string | null>(null);
  const currentUserId = currentUser?.id ?? '';

  useEffect(() => {
    if (!currentUserId || fetchedUserIdRef.current === currentUserId) {
      return undefined;
    }
    fetchedUserIdRef.current = currentUserId;
    const controller = new AbortController();
    authApi
      .getProfile(currentUserId, controller.signal)
      .then((freshUser) => {
        if (!controller.signal.aborted && freshUser) {
          updateStoredUser(freshUser);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.warn('No se pudo refrescar el perfil de usuario:', err);
        }
      });
    return () => {
      controller.abort();
    };
  }, [currentUserId, updateStoredUser]);

  const roleLabel =
    userRole === 'ADMINISTRADOR'
      ? 'Administrador General'
      : 'Encargado de Operaciones de Campo';

  const roleBadgeClass = userRole === 'ADMINISTRADOR' ? 'badge-info' : 'badge-success';

  const handleDownloadBadge = () => {
    toastInfo('Generando carnet digital de identificación...');
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          Mis Datos Personales y Laborales
        </h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          Ficha del colaborador en Sociedad Agrícola Arona S.A.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="arona-card overflow-hidden h-fit">
          <div className="h-28 bg-gradient-to-br from-emerald-700 to-green-900 relative">
            <div className="absolute -bottom-10 left-6">
              <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-xl flex items-center justify-center">
                <span className="text-2xl font-extrabold text-[var(--color-arona-600)]">
                  {userInitials}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-14 px-6 pb-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800 leading-snug">{userName}</h2>
                <p className="text-xs text-gray-500">{roleLabel}</p>
              </div>
              <span className={`badge text-xs ${roleBadgeClass}`}>{userRole}</span>
            </div>

            <div className="space-y-2.5 mt-5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-400 font-medium uppercase">DNI</span>
                <span className="text-gray-800 font-bold">{currentUser?.nationalId || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-400 font-medium uppercase">Teléfono</span>
                <span className="text-gray-800 font-bold">{currentUser?.phone || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-400 font-medium uppercase">Área</span>
                <span className="text-gray-800 font-bold">{currentUser?.area || 'CAMPO'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadBadge}
              className="arona-btn-primary w-full mt-6 justify-center text-xs"
            >
              <span className="material-icons-outlined text-base">badge</span>
              Descargar / Imprimir Carnet
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 arona-card p-6">
          <div role="tablist" aria-label="Secciones de perfil" className="flex border-b border-gray-200 mb-6">
            {PROFILE_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 -mb-px cursor-pointer bg-transparent border-t-0 border-l-0 border-r-0 transition-all ${
                  activeTab === tab
                    ? 'text-[var(--color-arona-600)] border-[var(--color-arona-600)]'
                    : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Información Personal' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Nombre Completo
                </span>
                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="material-icons-outlined text-gray-400 text-lg">person</span>{' '}
                  {userName}
                </p>
              </div>

              <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Correo Electrónico
                </span>
                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="material-icons-outlined text-gray-400 text-lg">email</span>{' '}
                  {currentUser?.email || '—'}
                </p>
              </div>

              <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Documento de Identidad (DNI)
                </span>
                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="material-icons-outlined text-gray-400 text-lg">badge</span>{' '}
                  {currentUser?.nationalId || 'No registrado'}
                </p>
              </div>

              <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Teléfono de Contacto
                </span>
                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="material-icons-outlined text-gray-400 text-lg">phone</span>{' '}
                  {currentUser?.phone || 'No registrado'}
                </p>
              </div>

              <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Rol y Permisos
                </span>
                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="material-icons-outlined text-gray-400 text-lg">work</span>{' '}
                  {roleLabel}
                </p>
              </div>

              <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Área Organizacional
                </span>
                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="material-icons-outlined text-gray-400 text-lg">domain</span>{' '}
                  {currentUser?.area || 'No asignada'}
                </p>
              </div>

              <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 md:col-span-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Dirección Domiciliaria
                </span>
                <p className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="material-icons-outlined text-gray-400 text-lg">location_on</span>{' '}
                  {currentUser?.address || 'No registrada'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <span className="material-icons-outlined text-5xl text-gray-300">
                workspace_premium
              </span>
              <p className="text-sm font-semibold text-gray-600 mt-3">
                Acreditaciones y Certificaciones Agrícolas
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                GLOBALG.A.P., BPM (Buenas Prácticas de Manufactura) y Certificación Orgánica SENASA
              </p>
              <div className="flex justify-center gap-3 mt-4">
                <span className="badge badge-success text-xs">GLOBALG.A.P. V5.4</span>
                <span className="badge badge-info text-xs">SENASA BPA</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
