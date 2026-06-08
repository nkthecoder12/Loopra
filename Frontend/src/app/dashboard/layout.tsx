"use client";

import React from 'react';
import { useRideStore } from '@/store/useRideStore';
import { Navigation, Bell, User, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['USER']}>
      <div className="flex h-screen bg-surface overflow-hidden">
      {/* Global Navigation Sidebar (Slim) */}
      <nav className="w-20 bg-primary flex flex-col items-center py-8 justify-between z-50">
        <div className="space-y-8 flex flex-col items-center">
          <div className="text-white text-2xl font-black tracking-tighter mb-4">D.</div>
          <Link href="/dashboard" className="p-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all">
            <Navigation size={24} />
          </Link>
          <Link href="/dashboard/rides" className="p-3 text-white/50 hover:text-white transition-all">
            <Bell size={24} />
          </Link>
          <Link href="/dashboard/profile" className="p-3 text-white/50 hover:text-white transition-all">
            <User size={24} />
          </Link>
          <Link href="/dashboard/settings" className="p-3 text-white/50 hover:text-white transition-all">
            <Settings size={24} />
          </Link>
        </div>
        <button className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
          <LogOut size={24} />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {children}
      </main>
    </div>
    </ProtectedRoute>
  );
}
