"use client";

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NotificationCenter } from '@/components/NotificationCenter';
import { FirebaseNotificationManager } from '@/components/FirebaseNotificationManager';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['DRIVER']}>
      <div className="relative w-full h-full">
        {/* Firebase messaging registration manager */}
        <FirebaseNotificationManager />

        {/* Floating Notification Center Bell */}
        <div className="fixed top-4 right-4 z-40">
          <NotificationCenter />
        </div>
        {children}
      </div>
    </ProtectedRoute>
  );
}
