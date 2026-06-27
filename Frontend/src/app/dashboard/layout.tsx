"use client";

import React from 'react';
import Image from 'next/image';
import { Navigation, Clock3, User, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Ride', icon: Navigation },
  { href: '/dashboard/history', label: 'Activity', icon: Clock3 },
  { href: '/dashboard/profile', label: 'Account', icon: User },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearCredentials } = useAuthStore();

  const handleLogout = () => {
    clearCredentials();
    router.push('/login');
  };

  return (
    <ProtectedRoute allowedRoles={['USER']}>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background md:flex-row relative">
        {/* Main Content Area */}
        <main className="order-1 flex flex-1 overflow-hidden h-full w-full">
          {children}
        </main>

        {/* Global Navigation: Mobile Sticky Bottom Bar & Desktop Sidebar */}
        <nav className="order-2 z-50 md:order-1 fixed md:relative bottom-0 inset-x-0 md:inset-auto h-16 md:h-full w-full md:w-20 lg:w-24 bg-black text-white flex md:flex-col items-center justify-between px-3 md:px-0 md:py-6 shadow-2xl border-t md:border-t-0 md:border-r border-zinc-800/80">
          {/* Logo Brand Icon (Desktop) */}
          <div className="hidden md:flex flex-col items-center gap-6">
            <Link href="/dashboard" className="w-12 h-12 bg-white rounded-2xl p-1.5 flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95">
              <Image src="/loopra logo.png" alt="Loopra Logo" width={40} height={40} className="object-contain" priority />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex w-full md:w-auto items-center justify-around md:flex-col md:gap-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className={cn(
                    "group relative flex flex-col md:flex-row items-center justify-center py-1 px-3 md:p-3 rounded-xl transition-all duration-200 touch-target",
                    isActive 
                      ? "text-white md:bg-zinc-800/90 font-bold" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                  )}
                >
                  <div className={cn("p-1.5 rounded-full transition-transform", isActive && "bg-white text-black scale-110 md:bg-transparent md:text-white md:scale-100")}>
                    <Icon size={20} className="stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] md:hidden font-semibold tracking-tight mt-0.5">
                    {item.label}
                  </span>
                  {/* Tooltip for Desktop */}
                  <span className="pointer-events-none absolute left-[calc(100%+12px)] hidden rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100 md:block whitespace-nowrap z-50 border border-zinc-800">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Sign Out Action */}
          <button
            onClick={handleLogout}
            className="hidden md:flex h-11 w-11 items-center justify-center rounded-xl text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-all duration-200 focus-visible:outline-none touch-target"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={20} />
          </button>
        </nav>
      </div>
    </ProtectedRoute>
  );
}

