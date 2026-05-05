import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createAuthedSocket } from "@/lib/socket";
import { useAuth } from "./AuthContext";
import {
  clearNotifications as clearNotificationsApi,
  deleteNotification as deleteNotificationApi,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/services/notificationService";

export interface WorkflowNotification extends AppNotification {
  id: string;
  timestamp: string;
  status: string;
  statusLabel: string;
  orderId?: string;
}

interface OrderWorkflowNotificationsContextValue {
  notifications: WorkflowNotification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const OrderWorkflowNotificationsContext =
  createContext<OrderWorkflowNotificationsContextValue | null>(null);

const normalizeNotification = (notification: AppNotification): WorkflowNotification => {
  const metadata = notification.metadata || {};
  const status = typeof metadata.status === "string" ? metadata.status : notification.category;
  const statusLabel = typeof metadata.statusLabel === "string" ? metadata.statusLabel : notification.category.replace(/_/g, " ");
  const orderId = typeof metadata.orderId === "string" ? metadata.orderId : undefined;

  return {
    ...notification,
    id: notification._id,
    timestamp: notification.createdAt,
    status,
    statusLabel,
    orderId,
  };
};

export function OrderWorkflowNotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<WorkflowNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshNotifications = useCallback(async () => {
    if (!user?._id) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      const response = await getNotifications();
      setNotifications(response.data.map(normalizeNotification));
    } catch (error) {
      console.error("Failed to load notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (!user?._id) return;

    const socket = createAuthedSocket();
    if (!socket) return;

    const handleNotification = (notification: AppNotification) => {
      setNotifications((current) => {
        const nextNotification = normalizeNotification(notification);
        const deduped = current.filter((item) => item.id !== nextNotification.id);
        return [nextNotification, ...deduped].slice(0, 100);
      });
    };

    socket.on("notification:new", handleNotification);
    socket.on("order:workflow", refreshNotifications);
    socket.on("return:workflow", refreshNotifications);

    return () => {
      socket.off("notification:new", handleNotification);
      socket.off("order:workflow", refreshNotifications);
      socket.off("return:workflow", refreshNotifications);
      socket.disconnect();
    };
  }, [refreshNotifications, user?._id]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    void markNotificationRead(id).catch(refreshNotifications);
  }, [refreshNotifications]);

  const markAllRead = useCallback(() => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    void markAllNotificationsRead().catch(refreshNotifications);
  }, [refreshNotifications]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
    void deleteNotificationApi(id).catch(refreshNotifications);
  }, [refreshNotifications]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    void clearNotificationsApi().catch(refreshNotifications);
  }, [refreshNotifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((notification) => !notification.read).length,
      loading,
      refreshNotifications,
      markAsRead,
      markAllRead,
      removeNotification,
      clearNotifications,
    }),
    [clearNotifications, loading, markAllRead, markAsRead, notifications, refreshNotifications, removeNotification]
  );

  return (
    <OrderWorkflowNotificationsContext.Provider value={value}>
      {children}
    </OrderWorkflowNotificationsContext.Provider>
  );
}

export function useOrderWorkflowNotifications() {
  const context = useContext(OrderWorkflowNotificationsContext);
  if (!context) {
    throw new Error("useOrderWorkflowNotifications must be used within OrderWorkflowNotificationsProvider");
  }
  return context;
}
