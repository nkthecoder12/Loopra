import api from "@/lib/api";

export interface NotificationItem {
  _id: string;
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  type:
    | "RIDE"
    | "DRIVER"
    | "PAYMENT"
    | "SECURITY"
    | "SYSTEM"
    | "ADMIN"
    | "PROMOTION"
    | "SUPPORT"
    | "REFERRAL"
    | "WALLET"
    | "EMERGENCY";
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  sound: string;
  image?: string | null;
  icon?: string | null;
  deepLink?: string | null;
  buttons: Array<{
    label: string;
    actionUrl: string;
    primary: boolean;
  }>;
  rideId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedNotifications {
  notifications: NotificationItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ChannelPreference {
  inApp: boolean;
  push: boolean;
  email: boolean;
  sms: boolean;
}

export interface NotificationPreferences {
  userId: string;
  RIDE: ChannelPreference;
  DRIVER: ChannelPreference;
  PAYMENT: ChannelPreference;
  SECURITY: ChannelPreference;
  SYSTEM: ChannelPreference;
  ADMIN: ChannelPreference;
  PROMOTION: ChannelPreference;
  SUPPORT: ChannelPreference;
  REFERRAL: ChannelPreference;
  WALLET: ChannelPreference;
  EMERGENCY: ChannelPreference;
  createdAt?: string;
  updatedAt?: string;
}

export const notificationService = {
  getNotifications: async (
    page = 1,
    limit = 20,
    isRead?: boolean,
    category?: string,
    search?: string
  ): Promise<PaginatedNotifications> => {
    const params: Record<string, string | number | boolean> = { page, limit };
    if (isRead !== undefined) params.isRead = isRead;
    if (category && category !== "ALL") params.category = category;
    if (search) params.search = search;

    const { data } = await api.get("/notifications", { params });
    return data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get("/notifications/unread-count");
    return data.count;
  },

  markAsRead: async (id: string): Promise<NotificationItem> => {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data.notification;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch("/notifications/read-all");
  },

  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },

  recordInteraction: async (
    id: string,
    action: "open" | "click" | "dismiss"
  ): Promise<NotificationItem> => {
    const { data } = await api.patch(`/notifications/${id}/interact`, {
      action,
    });
    return data.notification;
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    const { data } = await api.get("/notifications/preferences");
    return data.preferences;
  },

  updatePreferences: async (
    preferences: Partial<Record<keyof Omit<NotificationPreferences, "userId" | "createdAt" | "updatedAt">, Partial<ChannelPreference>>>
  ): Promise<NotificationPreferences> => {
    const { data } = await api.patch("/notifications/preferences", preferences);
    return data.preferences;
  },
};
export default notificationService;
