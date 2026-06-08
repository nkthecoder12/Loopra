"use client";

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['DRIVER']}>
      {children}
    </ProtectedRoute>
  );
}
