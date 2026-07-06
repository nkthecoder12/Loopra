import { create } from "zustand";
import { socketService } from "@/lib/socket";
import {
  notificationService,
  NotificationItem,
} from "@/services/notification.service";
import { useNotificationStore } from "./useNotificationStore";

interface NotificationCenterState {
  notifications: NotificationItem[];
  unreadCount: number;
  total: number;
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  category: string;
  search: string;
  isSocketListening: boolean;

  fetchNotifications: (reset?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  setFilters: (category: string, search: string) => Promise<void>;
  setupSocketListener: () => void;
  recordInteraction: (
    id: string,
    action: "open" | "click" | "dismiss"
  ) => Promise<void>;
}

export const useNotificationCenterStore = create<NotificationCenterState>(
  (set, get) => ({
    notifications: [],
    unreadCount: 0,
    total: 0,
    page: 1,
    hasMore: true,
    isLoading: false,
    category: "ALL",
    search: "",
    isSocketListening: false,

    fetchNotifications: async (reset = false) => {
      const state = get();
      if (state.isLoading) return;

      set({ isLoading: true });
      const targetPage = reset ? 1 : state.page;

      try {
        const data = await notificationService.getNotifications(
          targetPage,
          20,
          undefined, // fetch both read and unread
          state.category,
          state.search
        );

        set((prev) => ({
          notifications: reset
            ? data.notifications
            : [...prev.notifications, ...data.notifications],
          total: data.total,
          page: data.page + 1,
          hasMore: data.page < data.pages,
          isLoading: false,
        }));
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
        set({ isLoading: false });
      }
    },

    fetchUnreadCount: async () => {
      try {
        const count = await notificationService.getUnreadCount();
        set({ unreadCount: count });
      } catch (err) {
        console.error("Failed to get unread count:", err);
      }
    },

    markAsRead: async (id) => {
      try {
        // Optimistic UI update
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n._id === id ? { ...n, isRead: true, status: "READ" } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));

        await notificationService.markAsRead(id);
      } catch (err) {
        console.error("Failed to mark as read:", err);
        // Rollback or re-fetch in case of failure
        get().fetchUnreadCount();
      }
    },

    markAllAsRead: async () => {
      try {
        set((state) => ({
          notifications: state.notifications.map((n) => ({
            ...n,
            isRead: true,
            status: "READ",
          })),
          unreadCount: 0,
        }));

        await notificationService.markAllAsRead();
      } catch (err) {
        console.error("Failed to mark all as read:", err);
      }
    },

    deleteNotification: async (id) => {
      try {
        const target = get().notifications.find((n) => n._id === id);
        const wasUnread = target ? !target.isRead : false;

        set((state) => ({
          notifications: state.notifications.filter((n) => n._id !== id),
          unreadCount: wasUnread
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
          total: Math.max(0, state.total - 1),
        }));

        await notificationService.deleteNotification(id);
      } catch (err) {
        console.error("Failed to delete notification:", err);
      }
    },

    recordInteraction: async (id, action) => {
      try {
        const updated = await notificationService.recordInteraction(id, action);
        if (action === "click" || action === "open") {
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n._id === id ? updated : n
            ),
            unreadCount: updated.isRead
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          }));
        }
      } catch (err) {
        console.error("Failed to record analytic interaction:", err);
      }
    },

    setFilters: async (category, search) => {
      set({ category, search, page: 1, notifications: [], hasMore: true });
      await get().fetchNotifications(true);
    },

    setupSocketListener: () => {
      if (get().isSocketListening) return;

      const socket = socketService.getSocket();
      if (!socket) {
        // Retry listener check in 1 sec if socket is not initialized yet
        setTimeout(() => get().setupSocketListener(), 1000);
        return;
      }

      socket.off("new-notification");
      socket.on("new-notification", (newNotif: NotificationItem, ackCallback?: (response: { status: string }) => void) => {
        // 1. Send acknowledgment callback back to backend to confirm delivery success
        if (ackCallback && typeof ackCallback === "function") {
          ackCallback({ status: "acknowledged" });
        }

        // 2. Play alert sound mapped to priority/type
        let soundFile = "default.mp3";
        if (newNotif.sound === "assigned") soundFile = "assigned.mp3";
        else if (newNotif.sound === "payment") soundFile = "payment.mp3";
        else if (newNotif.sound === "emergency") soundFile = "emergency.mp3";
        else if (newNotif.sound === "silent") soundFile = "";

        if (soundFile) {
          try {
            const audio = new Audio(`/sounds/${soundFile}`);
            audio.play().catch(() => {}); // Browser prevents autoplays occasionally
          } catch {
            // Browser autoplays blocked
          }
        }

        // 3. Trigger device vibration for high priority alerts
        if (newNotif.priority === "HIGH" && "vibrate" in navigator) {
          navigator.vibrate([200, 100, 200]);
        }

        // 4. Inject into Zustand notifications list (at the top)
        set((state) => {
          // Prevent duplicates
          const exists = state.notifications.some(
            (n) => n.notificationId === newNotif.notificationId
          );
          if (exists) return state;

          return {
            notifications: [newNotif, ...state.notifications],
            unreadCount: state.unreadCount + 1,
            total: state.total + 1,
          };
        });

        // 5. Fire floating client toast banner
        useNotificationStore
          .getState()
          .addNotification(
            newNotif.priority === "HIGH" ? "warning" : "info",
            newNotif.title + ": " + newNotif.message
          );
      });

      set({ isSocketListening: true });
    },
  })
);
