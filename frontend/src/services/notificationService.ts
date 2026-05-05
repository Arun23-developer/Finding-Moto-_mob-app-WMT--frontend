import api from "./api";

export type NotificationRole = "admin" | "buyer" | "seller" | "mechanic" | "delivery_agent";

export type NotificationCategory =
  | "REPORT"
  | "COMPLAINT"
  | "SYSTEM_ALERT"
  | "ORDER"
  | "LOW_STOCK"
  | "RETURN"
  | "REFUND"
  | "SERVICE_REQUEST"
  | "PARTS_ALERT"
  | "DELIVERY_ASSIGNMENT"
  | "PICKUP_REQUEST"
  | "ADMIN_ALERT";

export interface AppNotification {
  _id: string;
  recipient: string;
  role: NotificationRole;
  category: NotificationCategory;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsResponse {
  success: boolean;
  data: AppNotification[];
  unreadCount: number;
}

export const getNotifications = async (): Promise<NotificationsResponse> => {
  const { data } = await api.get<NotificationsResponse>("/notifications");
  return data;
};

export const markNotificationRead = async (id: string): Promise<AppNotification> => {
  const { data } = await api.patch<{ success: boolean; data: AppNotification }>(`/notifications/${id}/read`);
  return data.data;
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await api.patch("/notifications/read-all");
};

export const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`/notifications/${id}`);
};

export const clearNotifications = async (): Promise<void> => {
  await api.delete("/notifications/clear");
};
