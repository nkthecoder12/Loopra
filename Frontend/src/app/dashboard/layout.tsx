"use client";

import React from 'react';
import { Navigation, Clock3, User, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/useAuthStore';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Book', icon: Navigation },
  { href: '/dashboard/history', label: 'History', icon: Clock3 },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
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
      <div className="flex h-screen flex-col overflow-hidden bg-background md:flex-row">
      {/* Global Navigation (Sidebar on Desktop, Bottom Bar on Mobile) */}
      <nav className="order-2 z-50 m-3 flex h-16 items-center justify-between rounded-[20px] border border-white/10 bg-primary px-4 shadow-premium md:order-1 md:m-5 md:h-[calc(100vh-40px)] md:w-[84px] md:flex-col md:px-0 md:py-5">
        <div className="flex items-center gap-3 md:flex-col md:gap-5">
          <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-black text-primary shadow-soft md:flex">L</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className={cn(
                  "group relative flex h-11 w-11 items-center justify-center rounded-2xl text-white/55 transition-all duration-[220ms] hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25",
                  isActive && "bg-white text-primary shadow-soft hover:bg-white hover:text-primary"
                )}
              >
                <Icon size={20} />
                <span className="pointer-events-none absolute left-[calc(100%+12px)] hidden rounded-xl bg-text-primary px-3 py-2 text-xs font-bold text-white opacity-0 shadow-soft transition-opacity group-hover:opacity-100 md:block">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        <button
          onClick={handleLogout}
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-white/55 transition-all duration-[220ms] hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={20} />
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="order-1 flex flex-1 overflow-hidden md:order-2">
        {children}
      </main>
    </div>
    </ProtectedRoute>
  );
}
