"use client";

import React from "react";
import { useNotificationStore } from "@/stores/notificationStore";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export default function NotificationContainer() {
  const { toasts, removeToast } = useNotificationStore();

  return (
    <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let bgColor = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800";
        let iconColor = "text-blue-500";
        let icon = <Info size={18} />;

        if (toast.type === "success") {
          bgColor = "bg-emerald-50 dark:bg-slate-900/90 border-emerald-200/50 dark:border-emerald-800/50";
          iconColor = "text-emerald-500";
          icon = <CheckCircle size={18} />;
        } else if (toast.type === "error") {
          bgColor = "bg-rose-50 dark:bg-slate-900/90 border-rose-200/50 dark:border-rose-800/50";
          iconColor = "text-rose-500";
          icon = <AlertCircle size={18} />;
        } else if (toast.type === "warning") {
          bgColor = "bg-amber-50 dark:bg-slate-900/90 border-amber-200/50 dark:border-amber-800/50";
          iconColor = "text-amber-500";
          icon = <AlertTriangle size={18} />;
        }

        return (
          <div
            key={toast.id}
            className={`p-4 rounded-xl border shadow-soft flex gap-3 items-start pointer-events-auto backdrop-blur-md transition-all duration-300 ${bgColor}`}
          >
            <div className={`shrink-0 pt-0.5 ${iconColor}`}>{icon}</div>
            <div className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg shrink-0 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
