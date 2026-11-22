import React, { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { ALERT_STATUS } from '../constants/domain';
import { ModalDialog } from './ModalDialog';
import { useDisclosureFocus } from '../hooks/useDisclosureFocus';

export interface HeaderProps {
  onOpenMobileMenu?: () => void;
  userName: string;
  userRole: string;
  userInitials: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  userName,
  userRole,
  userInitials,
}) => {
  const {
    allNotifications,
    unreadCount,
    showPanel,
    togglePanel,
    setShowPanel,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const bellButtonRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);

  const closeNotificationsPanel = useCallback(() => {
    setShowPanel(false);
  }, [setShowPanel]);

  useDisclosureFocus({
    isOpen: showPanel,
    onClose: closeNotificationsPanel,
    triggerRef: bellButtonRef,
    panelRef,
  });

  const getNotifIcon = (type: string): string => {
    switch (type) {
      case 'PLAGA':
        return 'bug_report';
      case 'ENFERMEDAD':
        return 'local_pharmacy';
      case 'OTRO':
        return 'warning_amber';
      default:
        return 'notifications';
    }
  };

  const getNotifIconBg = (type: string): string => {
    switch (type) {
      case 'PLAGA':
        return 'bg-red-100 text-red-500';
      case 'ENFERMEDAD':
        return 'bg-orange-100 text-orange-500';
      case 'OTRO':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-16 bg-white border-b border-[var(--color-border-light)] flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6">
        {/* Left: Mobile Menu + Responsive Search Bar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              aria-label="Abrir menú de navegación"
              className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-[var(--color-arona-500)] border-none bg-transparent cursor-pointer shrink-0"
            >
              <span className="material-icons-outlined text-xl">menu</span>
            </button>
          )}

          <div className="relative flex-1 min-w-0 max-w-xs md:max-w-md">
            <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">
              search
            </span>
            <input
              type="text"
              id="header-search"
              aria-label="Buscar lote o cultivo"
              placeholder="Buscar lote, cultivo..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-arona-500)]/20 focus:border-[var(--color-arona-500)] transition-all"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              ref={bellButtonRef}
              type="button"
              id="btn-notifications"
              onClick={togglePanel}
              aria-label="Abrir panel de notificaciones"
              aria-expanded={showPanel}
              aria-controls="notifications-panel"
              aria-haspopup="dialog"
              className="relative w-10 h-10 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[var(--color-arona-500)] transition-all border-none bg-transparent cursor-pointer"
            >
              <span className="material-icons-outlined text-xl">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px] font-bold px-0.5 animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showPanel && (
              <section
                ref={panelRef}
                id="notifications-panel"
                role="dialog"
                aria-label="Panel de notificaciones"
                tabIndex={-1}
                className="fixed inset-x-3 top-16 w-auto sm:absolute sm:right-0 sm:top-12 sm:w-96 sm:inset-x-auto max-h-[70vh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-100 z-50 animate-fade-in focus:outline-none"
              >
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-800">Notificaciones</p>
                    {unreadCount > 0 && (
                      <span className="badge badge-warning text-xs">{unreadCount} nuevas</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-xs text-[var(--color-arona-500)] font-semibold hover:underline border-none bg-transparent cursor-pointer"
                      >
                        Marcar todo como leído
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={closeNotificationsPanel}
                      aria-label="Cerrar panel de notificaciones"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 border-none bg-transparent cursor-pointer"
                    >
                      <span className="material-icons-outlined text-base">close</span>
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto" role="list">
                  {allNotifications.slice(0, 15).map((notif) => (
                    <button
                      key={String(notif.id)}
                      type="button"
                      role="listitem"
                      onClick={() => markAsRead(notif.id)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-50 border-t-0 border-l-0 border-r-0 transition-colors cursor-pointer block ${
                        notif.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/40 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${getNotifIconBg(
                            notif.type
                          )}`}
                        >
                          <span className="material-icons-outlined text-sm">
                            {getNotifIcon(notif.type)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-gray-800 truncate">
                              {notif.title}
                            </p>
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {notif.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-400">📅 {notif.date}</span>
                            <span
                              className={`badge text-[10px] ${
                                notif.status === ALERT_STATUS.ATTENDED
                                  ? 'badge-success'
                                  : 'badge-warning'
                              }`}
                            >
                              {notif.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}

                  {allNotifications.length === 0 && (
                    <div className="px-4 py-10 text-center">
                      <span className="material-icons-outlined text-4xl text-gray-300">
                        notifications_none
                      </span>
                      <p className="text-xs text-gray-400 mt-2">Sin notificaciones</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            aria-label="Ayuda del sistema"
            aria-haspopup="dialog"
            className="hidden sm:flex w-10 h-10 rounded-lg items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[var(--color-arona-500)] transition-all border-none bg-transparent cursor-pointer"
          >
            <span className="material-icons-outlined text-xl">help_outline</span>
          </button>

          <div className="hidden sm:block w-px h-8 bg-[var(--color-border)]" />

          {/* User Profile Link */}
          <Link
            to="/mis-datos"
            aria-label={`Perfil de ${userName}`}
            className="flex items-center gap-3 group no-underline"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--color-arona-500)] flex items-center justify-center text-white font-bold text-sm group-hover:shadow-md transition-shadow shrink-0">
              {userInitials}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">
                {userName}
              </p>
              <p className="text-xs leading-tight">
                <span
                  className={`badge text-[10px] ${
                    userRole === 'ADMINISTRADOR' ? 'badge-info' : 'badge-success'
                  }`}
                >
                  {userRole === 'ADMINISTRADOR' ? 'Administrador' : 'Encargado'}
                </span>
              </p>
            </div>
          </Link>
        </div>
      </header>

      {showPanel && (
        <div
          role="presentation"
          aria-hidden="true"
          className="fixed inset-0 z-30"
          onClick={closeNotificationsPanel}
        />
      )}

      <ModalDialog
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        labelledBy="help-dialog-title"
        panelClassName="max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="material-icons-outlined text-[var(--color-arona-600)]">help_outline</span>
            <h2 id="help-dialog-title" className="text-lg font-bold text-gray-800">
              Ayuda del Sistema
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsHelpOpen(false)}
            aria-label="Cerrar ayuda"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 border-none bg-transparent cursor-pointer"
          >
            <span className="material-icons-outlined text-lg">close</span>
          </button>
        </div>

        <div className="space-y-4 mt-4 text-xs text-gray-600">
          <div>
            <p className="font-bold text-gray-800 mb-1">Atajos de teclado</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>
                <strong>Esc</strong>: cierra modales y el panel de notificaciones devolviendo el foco.
              </li>
              <li>
                <strong>Tab / Shift + Tab</strong>: navega por controles dentro de formularios y diálogos.
              </li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-gray-800 mb-1">Soporte técnico</p>
            <p>
              Para restablecimiento de credenciales o incidencias en campo, contacte a TI en{' '}
              <a
                href="mailto:soporte@arona.com.pe"
                className="text-[var(--color-arona-600)] font-semibold hover:underline"
              >
                soporte@arona.com.pe
              </a>
              .
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setIsHelpOpen(false)}
            className="arona-btn-primary text-xs"
          >
            Entendido
          </button>
        </div>
      </ModalDialog>
    </>
  );
};
