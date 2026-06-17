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
      <div className="flex flex-col md:flex-row h-screen bg-surface overflow-hidden">
      {/* Global Navigation (Sidebar on Desktop, Bottom Bar on Mobile) */}
      <nav className="w-full h-16 md:w-20 md:h-full bg-primary flex flex-row md:flex-col items-center justify-between py-2 px-6 md:py-8 md:px-0 z-50 order-2 md:order-1 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:shadow-none">
        <div className="flex flex-row md:flex-col items-center gap-6 md:space-y-8 md:gap-0">
          <div className="text-white text-2xl font-black tracking-tighter mb-0 md:mb-4 hidden md:block">D.</div>
          <Link href="/dashboard" className="p-3 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-all">
            <Navigation size={20} className="md:w-6 md:h-6" />
          </Link>
          <Link href="/dashboard/history" className="p-3 text-white/50 hover:text-white transition-all">
            <Bell size={20} className="md:w-6 md:h-6" />
          </Link>
          <Link href="/dashboard/profile" className="p-3 text-white/50 hover:text-white transition-all">
            <User size={20} className="md:w-6 md:h-6" />
          </Link>
          <Link href="/dashboard/settings" className="p-3 text-white/50 hover:text-white transition-all">
            <Settings size={20} className="md:w-6 md:h-6" />
          </Link>
        </div>
        <button className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
          <LogOut size={20} className="md:w-6 md:h-6" />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden order-1 md:order-2">
        {children}
      </main>
    </div>
    </ProtectedRoute>
  );
}
