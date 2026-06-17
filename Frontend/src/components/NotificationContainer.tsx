"use client";

import React from 'react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotificationStore();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] space-y-4 max-w-sm w-full">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-start gap-3 p-4 rounded-2xl shadow-xl transform transition-all animate-in slide-in-from-right-8 duration-300 ${
            notification.type === 'success' ? 'bg-green-50 border border-green-100 text-green-800' :
            notification.type === 'error' ? 'bg-red-50 border border-red-100 text-red-800' :
            notification.type === 'warning' ? 'bg-yellow-50 border border-yellow-100 text-yellow-800' :
            'bg-blue-50 border border-blue-100 text-blue-800'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {notification.type === 'success' && <CheckCircle size={20} className="text-green-500" />}
            {notification.type === 'error' && <XCircle size={20} className="text-red-500" />}
            {notification.type === 'warning' && <AlertTriangle size={20} className="text-yellow-500" />}
            {notification.type === 'info' && <Info size={20} className="text-blue-500" />}
          </div>
          <div className="flex-1 font-medium text-sm">
            {notification.message}
          </div>
          <button 
            onClick={() => removeNotification(notification.id)}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
