"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Sidebar from "./Sidebar";
import NotificationContainer from "../ui/NotificationContainer";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, initialize } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initialize();
    setLoading(false);
  }, [initialize]);

  useEffect(() => {
    if (loading) return;

    const isAuthRoute = pathname === "/login" || pathname === "/setup-password";

    if (!isAuthenticated && !isAuthRoute) {
      router.push("/login");
    } else if (isAuthenticated && isAuthRoute) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, pathname, loading, router]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  const isAuthPage = pathname === "/login" || pathname === "/setup-password";

  return (
    <>
      <NotificationContainer />
      {isAuthenticated && !isAuthPage ? (
        <div className="min-h-screen flex bg-slate-50">
          <Sidebar />
          <main className="flex-1 pl-64 min-h-screen">
            <div className="p-8 max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      ) : (
        <div className="min-h-screen bg-slate-50">
          {children}
        </div>
      )}
    </>
  );
}
