"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import {
  LayoutDashboard,
  Map,
  Users,
  Car,
  Navigation,
  Calendar,
  DollarSign,
  BarChart3,
  ShieldAlert,
  History,
  LogOut
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const menuItems = [
    { name: "Overview", icon: <LayoutDashboard size={18} />, href: "/dashboard" },
    { name: "Live Operations", icon: <Map size={18} />, href: "/live-operations" },
    { name: "Drivers", icon: <Users size={18} />, href: "/drivers" },
    { name: "Vehicles", icon: <Car size={18} />, href: "/vehicles" },
    { name: "Rides", icon: <Navigation size={18} />, href: "/rides" },
    { name: "Schedule", icon: <Calendar size={18} />, href: "/schedule" },
    { name: "Earnings", icon: <DollarSign size={18} />, href: "/earnings" },
    { name: "Analytics", icon: <BarChart3 size={18} />, href: "/analytics" },
    { name: "Compliance", icon: <ShieldAlert size={18} />, href: "/compliance" },
    { name: "Audit Trail", icon: <History size={18} />, href: "/activity" },
  ];

  return (
    <div className="w-64 h-screen bg-slate-900 border-r border-slate-800 text-slate-400 flex flex-col justify-between select-none fixed top-0 left-0 z-40">
      <div className="flex flex-col flex-1 pt-6 overflow-y-auto">
        {/* Brand header */}
        <div className="px-6 flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-display font-black text-sm">
            L
          </div>
          <div className="flex flex-col">
            <span className="font-display text-white text-base font-black tracking-wide leading-none">LOOPRA</span>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-1">FLEET OPS</span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Operator User Card */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-200 truncate">{user?.name || "Operator"}</span>
            <span className="text-[10px] text-slate-500 truncate">{user?.email || "operator@loopra.co.in"}</span>
          </div>
          <button
            onClick={logout}
            className="text-slate-500 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800/40 transition-all shrink-0"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
