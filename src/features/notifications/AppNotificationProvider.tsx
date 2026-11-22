import React, { useCallback, type ReactNode } from 'react';
import { alertsApi } from '../alerts/api/alertsApi';
import { fieldsApi } from '../fields/api/fieldsApi';
import { useAuth } from '../auth/context/AuthContext';
import { ALERT_STATUS } from '../../shared/constants/domain';
import {
  NotificationProvider,
  type NotificationItem,
} from '../../shared/context/NotificationContext';
import type { Field } from '../../shared/types/domain';

export const AppNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();

  const loadNotifications = useCallback(async (signal?: AbortSignal): Promise<NotificationItem[]> => {
    const [alerts, fields] = await Promise.all([
      alertsApi.getAll(signal),
      fieldsApi.getAll(signal).catch(() => [] as Field[]),
    ]);

    return (alerts || [])
      .filter((a) => a.estado !== false)
      .sort((a, b) => (b.fechaDeteccion || '').localeCompare(a.fechaDeteccion || ''))
      .map((a) => {
        const id = a.id || a.idAlerta || '';
        const targetField = String(a.idCampo || '').trim().toUpperCase();
        const foundField = fields.find(
          (f) => String(f.id || f.idCampo || f._id || '').trim().toUpperCase() === targetField
        );
        const fieldName =
          a.campo?.nombre || foundField?.nombre || (a.idCampo ? `Campo #${a.idCampo}` : 'Campo');

        return {
          id,
          title: `${fieldName} — ${a.tipoProblema}`,
          description: a.descripcionProblema,
          date: a.fechaDeteccion,
          type: a.tipoProblema,
          status: a.solucionAplicada ? ALERT_STATUS.ATTENDED : ALERT_STATUS.PENDING,
          isRead: false,
        };
      });
  }, []);

  const userKey = currentUser?.id ? String(currentUser.id) : null;

  return (
    <NotificationProvider
      loadNotifications={loadNotifications}
      userKey={userKey}
      enabled={isAuthenticated}
    >
      {children}
    </NotificationProvider>
  );
};
