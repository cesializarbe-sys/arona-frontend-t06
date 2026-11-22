import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { AlertStatus } from '../constants/domain';
import type { EntityId } from '../types/domain';

const READ_NOTIFICATIONS_PREFIX = 'arona_read_notifications';

export interface NotificationItem {
  id: EntityId;
  title: string;
  description: string;
  date: string;
  type: string;
  status: AlertStatus;
  isRead: boolean;
}

export type NotificationSource = (signal?: AbortSignal) => Promise<NotificationItem[]>;

export interface NotificationProviderProps {
  children: ReactNode;
  loadNotifications: NotificationSource;
  userKey?: string | null;
  enabled?: boolean;
  pollIntervalMs?: number;
}

export interface NotificationContextValue {
  allNotifications: NotificationItem[];
  unreadNotifications: NotificationItem[];
  unreadCount: number;
  showPanel: boolean;
  setShowPanel: React.Dispatch<React.SetStateAction<boolean>>;
  togglePanel: () => void;
  markAsRead: (id: EntityId) => void;
  markAllAsRead: () => void;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function getStorageKey(userKey?: string | null): string {
  const normalized = userKey ? String(userKey).trim() : '';
  return normalized ? `${READ_NOTIFICATIONS_PREFIX}:${normalized}` : READ_NOTIFICATIONS_PREFIX;
}

function loadReadIds(storageKey: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch (err) {
    console.warn('[NotificationContext] Failed to parse read notification IDs:', err);
    return new Set<string>();
  }
}

function persistReadIds(storageKey: string, idsSet: Set<string>): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...idsSet]));
  } catch (err) {
    console.warn('[NotificationContext] Failed to persist read notification IDs:', err);
  }
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  loadNotifications,
  userKey = null,
  enabled = true,
  pollIntervalMs = 30000,
}) => {
  const storageKey = useMemo(() => getStorageKey(userKey), [userKey]);
  const [rawNotifications, setRawNotifications] = useState<NotificationItem[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds(storageKey));

  useEffect(() => {
    setReadIds(loadReadIds(storageKey));
  }, [storageKey]);

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      if (!enabled) {
        setRawNotifications([]);
        setShowPanel(false);
        return;
      }

      try {
        const items = await loadNotifications(signal);
        if (!signal?.aborted) {
          setRawNotifications(items);
        }
      } catch (err) {
        if (!signal?.aborted) {
          console.warn('[NotificationContext] Error fetching notifications:', err);
        }
      }
    },
    [enabled, loadNotifications]
  );

  useEffect(() => {
    if (!enabled) {
      setRawNotifications([]);
      setShowPanel(false);
      return undefined;
    }

    const controller = new AbortController();
    void refresh(controller.signal);
    const interval = setInterval(() => {
      void refresh();
    }, pollIntervalMs);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [enabled, pollIntervalMs, refresh]);

  const allNotifications = useMemo(
    () =>
      rawNotifications.map((item) => ({
        ...item,
        isRead: item.isRead || readIds.has(String(item.id)),
      })),
    [rawNotifications, readIds]
  );

  const unreadNotifications = useMemo(
    () => allNotifications.filter((n) => !n.isRead),
    [allNotifications]
  );

  const unreadCount = unreadNotifications.length;

  const markAsRead = useCallback(
    (id: EntityId) => {
      setReadIds((prev) => {
        const updated = new Set(prev);
        updated.add(String(id));
        persistReadIds(storageKey, updated);
        return updated;
      });
    },
    [storageKey]
  );

  const markAllAsRead = useCallback(() => {
    const allIds = allNotifications.map((n) => String(n.id));
    const updated = new Set(allIds);
    setReadIds(updated);
    persistReadIds(storageKey, updated);
  }, [allNotifications, storageKey]);

  const togglePanel = useCallback(() => setShowPanel((v) => !v), []);

  const publicRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  return (
    <NotificationContext.Provider
      value={{
        allNotifications,
        unreadNotifications,
        unreadCount,
        showPanel,
        setShowPanel,
        togglePanel,
        markAsRead,
        markAllAsRead,
        refresh: publicRefresh,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  }
  return context;
};
