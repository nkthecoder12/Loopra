"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  X,
  CheckCheck,
  Search,
  Trash2,
  Car,
  UserCheck,
  CreditCard,
  Shield,
  Info,
  UserPlus,
  Tag,
  HelpCircle,
  Gift,
  Wallet,
  AlertTriangle,
  Inbox,
} from "lucide-react";
import { useNotificationCenterStore } from "@/store/useNotificationCenterStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";
import { NotificationItem } from "@/services/notification.service";

const categoryList = [
  { value: "ALL", label: "All" },
  { value: "RIDE", label: "Rides" },
  { value: "PAYMENT", label: "Payments" },
  { value: "DRIVER", label: "Driver" },
  { value: "SYSTEM", label: "System" },
  { value: "PROMOTION", label: "Promo" },
  { value: "SECURITY", label: "Security" },
  { value: "EMERGENCY", label: "Emergency" },
];

const categoryIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  RIDE: Car,
  DRIVER: UserCheck,
  PAYMENT: CreditCard,
  SECURITY: Shield,
  SYSTEM: Info,
  ADMIN: UserPlus,
  PROMOTION: Tag,
  SUPPORT: HelpCircle,
  REFERRAL: Gift,
  WALLET: Wallet,
  EMERGENCY: AlertTriangle,
};

// Simple relative time helper to avoid importing bulky libraries
function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// Helper to group notifications into Today, Yesterday, and Earlier
function groupNotifications(items: NotificationItem[]) {
  const today: NotificationItem[] = [];
  const yesterday: NotificationItem[] = [];
  const earlier: NotificationItem[] = [];

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  items.forEach((item) => {
    const itemDate = new Date(item.createdAt);
    if (itemDate >= now) {
      today.push(item);
    } else if (itemDate >= yesterdayDate) {
      yesterday.push(item);
    } else {
      earlier.push(item);
    }
  });

  return { today, yesterday, earlier };
}

export function NotificationCenter() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    notifications,
    unreadCount,
    total,
    hasMore,
    isLoading,
    category,
    search,
    fetchNotifications,
    fetchUnreadCount,
    markAllAsRead,
    deleteNotification,
    setFilters,
    setupSocketListener,
    recordInteraction,
  } = useNotificationCenterStore();

  const [isOpen, setIsOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync and initialize socket connections
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      fetchNotifications(true);
      setupSocketListener();
    }
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount, setupSocketListener]);

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Re-fetch notifications and counts when opening drawer to catch stale state
      fetchNotifications(true);
      fetchUnreadCount();
    }
  };

  // Debounced search trigger
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      setFilters(category, value);
    }, 400);
  };

  const handleCategorySelect = (catVal: string) => {
    setFilters(catVal, search);
  };

  const handleNotificationTap = async (item: NotificationItem) => {
    // 1. Record analytic interaction
    await recordInteraction(item._id, "click");

    // 2. Perform deepLink routing if set
    if (item.deepLink) {
      toggleDrawer();
      router.push(item.deepLink);
    }
  };

  const handleLoadMore = () => {
    fetchNotifications(false);
  };

  const groups = groupNotifications(notifications);

  const renderNotifCard = (item: NotificationItem) => {
    const IconComponent = categoryIcons[item.type] || Info;
    const isEmergency = item.type === "EMERGENCY";

    return (
      <div
        key={item._id}
        className={cn(
          "p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 group relative cursor-pointer active:scale-[0.99]",
          item.isRead
            ? "bg-surface border-border opacity-85"
            : isEmergency
            ? "bg-red-50/50 border-red-200"
            : "bg-primary/5 border-primary/10 shadow-sm"
        )}
        onClick={() => handleNotificationTap(item)}
      >
        <div className="flex gap-3 flex-1 min-w-0">
          {/* Category Icon */}
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              item.isRead
                ? "bg-slate-100 text-slate-500"
                : isEmergency
                ? "bg-danger text-white animate-pulse"
                : item.priority === "HIGH"
                ? "bg-amber-100 text-amber-600"
                : "bg-primary/15 text-primary"
            )}
          >
            <IconComponent size={18} />
          </div>

          <div className="flex-1 space-y-1 min-w-0">
            {/* Title / Header */}
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-sm text-text-primary tracking-tight truncate leading-tight font-manrope">
                {item.title}
              </h4>
              {!item.isRead && (
                <span className="w-1.5 h-1.5 bg-accent rounded-full shrink-0 animate-ping" />
              )}
            </div>

            {/* Message Body */}
            <p className="text-xs text-text-secondary font-medium leading-relaxed break-words">
              {item.message}
            </p>

            {/* Timestamps */}
            <div className="text-[10px] text-text-secondary font-semibold pt-1">
              {formatRelativeTime(item.createdAt)}
            </div>

            {/* Interactive Custom Template Action Buttons */}
            {item.buttons && item.buttons.length > 0 && (
              <div className="flex gap-2 pt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
              {item.buttons.map((btn: { label: string; actionUrl: string; primary: boolean }, idx: number) => (
                  <button
                    key={idx}
                    onClick={async () => {
                      await recordInteraction(item._id, "click");
                      toggleDrawer();
                      router.push(btn.actionUrl);
                    }}
                    className={cn(
                      "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-colors border",
                      btn.primary
                        ? "bg-primary text-white hover:bg-secondary border-primary"
                        : "bg-surface text-text-primary hover:bg-slate-50 border-border"
                    )}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete / Dismiss Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteNotification(item._id);
          }}
          className="text-text-secondary hover:text-danger opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-slate-100 transition-all shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  };

  const renderSection = (title: string, list: NotificationItem[]) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-text-secondary px-1">
          {title}
        </h3>
        <div className="space-y-2.5">
          {list.map((item) => renderNotifCard(item))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Bell Trigger Button */}
      <button
        onClick={toggleDrawer}
        className="w-10 h-10 rounded-xl bg-slate-50 border border-border hover:bg-slate-100 hover:border-slate-300 text-text-primary flex items-center justify-center transition-all relative active:scale-95 touch-target"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-[-3px] right-[-3px] bg-danger text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={toggleDrawer}
              className="fixed inset-0 bg-black z-[998] cursor-default"
            />

            {/* Sidebar Slide Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed top-0 right-0 h-screen w-full sm:w-[420px] bg-surface z-[999] shadow-soft border-l border-border flex flex-col justify-between font-inter"
            >
              {/* Header Container */}
              <div className="p-5 border-b border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-primary font-manrope">
                      Notifications
                    </h2>
                    <p className="text-[10px] text-text-secondary font-bold">
                      {unreadCount} unread • {total} total messages
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="p-2 text-text-secondary hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-bold hover:bg-slate-50 rounded-xl"
                        title="Mark all as read"
                      >
                        <CheckCheck size={14} />
                        <span>Read all</span>
                      </button>
                    )}
                    <button
                      onClick={toggleDrawer}
                      className="p-2 text-text-secondary hover:text-primary hover:bg-slate-100 rounded-xl transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* In-app Text Search Bar */}
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3.5 top-3.5 text-text-secondary"
                  />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={localSearch}
                    onChange={handleSearchChange}
                    className="w-full h-10 pl-9 pr-4 text-xs font-semibold rounded-xl bg-background border border-border outline-none focus:border-accent"
                  />
                </div>

                {/* Horizontal Category Filtering Tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {categoryList.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => handleCategorySelect(cat.value)}
                      className={cn(
                        "px-3.5 py-1.5 text-[10px] font-bold rounded-lg border transition-all whitespace-nowrap active:scale-95",
                        category === cat.value
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-slate-50 text-text-secondary border-border hover:bg-slate-100"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Notification List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {isLoading && notifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-3">
                    <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-text-secondary font-bold">
                      Loading messages...
                    </span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-10 opacity-70">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Inbox size={26} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-text-primary">
                        No notifications
                      </h4>
                      <p className="text-[10px] text-text-secondary max-w-[200px] mx-auto mt-0.5">
                        We couldn&apos;t find any notifications matching the filters.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {renderSection("Today", groups.today)}
                    {renderSection("Yesterday", groups.yesterday)}
                    {renderSection("Earlier", groups.earlier)}

                    {/* Load More Pagination Trigger */}
                    {hasMore && (
                      <button
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        className="w-full py-3 border border-dashed border-border hover:border-slate-400 text-text-primary text-xs font-bold rounded-xl transition-colors bg-slate-50 hover:bg-slate-100 flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span>Loading more...</span>
                          </>
                        ) : (
                          "Load More"
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Footer Preferences link */}
              <div className="p-4 border-t border-border bg-slate-50 text-center">
                <button
                  onClick={() => {
                    toggleDrawer();
                    router.push("/dashboard/settings/notifications");
                  }}
                  className="text-xs font-black text-accent hover:underline inline-flex items-center gap-1.5"
                >
                  Configure Notification Settings
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
