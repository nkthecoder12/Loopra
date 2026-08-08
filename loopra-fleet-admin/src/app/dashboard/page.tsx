"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useNotificationStore } from "@/stores/notificationStore";
import {
  Users,
  Car,
  Navigation,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Loader2
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  drivers: {
    total: number;
    online: number;
    offline: number;
    pending: number;
    suspended: number;
  };
  vehicles: {
    total: number;
    available: number;
    inRide: number;
    maintenance: number;
    suspended: number;
    nonCompliant: number;
  };
  rides: {
    active: number;
    scheduled: number;
    completedToday: number;
    cancelledToday: number;
  };
  revenue: {
    today: number;
    weekly: number;
    monthly: number;
  };
}

interface Alert {
  severity: "HIGH" | "CRITICAL" | "MEDIUM";
  entity: string;
  entityId: string;
  reason: string;
  timestamp: string;
}

export default function DashboardPage() {
  const { addToast } = useNotificationStore();
  const [metrics, setMetrics] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [mRes, aRes] = await Promise.all([
          api.get("/fleet/dashboard"),
          api.get("/fleet/notifications")
        ]);
        if (mRes.data.success) setMetrics(mRes.data.data);
        if (aRes.data.success) setAlerts(aRes.data.alerts);
      } catch (err) {
        addToast("error", "Failed to fetch dashboard updates");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [addToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 font-display tracking-tight leading-none">
          Overview
        </h1>
        <p className="text-xs font-semibold text-slate-400 mt-2">
          Fleet command console metrics and actionable operational warnings.
        </p>
      </div>

      {/* Metrics Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Driver metrics */}
        <div className="bg-white border border-slate-200/50 p-6 rounded-2xl shadow-soft">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
              <Users size={20} />
            </div>
            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Drivers
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-slate-800 font-display tracking-tight">
              {metrics?.drivers.total || 0}
            </h3>
            <p className="text-[11px] font-bold text-slate-400">Total Registered</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100 text-xs font-bold text-slate-600">
            <div className="flex flex-col">
              <span className="text-emerald-500 font-black">{metrics?.drivers.online || 0}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Online</span>
            </div>
            <div className="flex flex-col">
              <span className="text-indigo-400 font-black">{metrics?.drivers.pending || 0}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Verification</span>
            </div>
          </div>
        </div>

        {/* Vehicle metrics */}
        <div className="bg-white border border-slate-200/50 p-6 rounded-2xl shadow-soft">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
              <Car size={20} />
            </div>
            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Vehicles
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-slate-800 font-display tracking-tight">
              {metrics?.vehicles.total || 0}
            </h3>
            <p className="text-[11px] font-bold text-slate-400">Total Assets</p>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-100 text-[11px] font-bold text-slate-600">
            <div className="flex flex-col">
              <span className="text-slate-800 font-black">{metrics?.vehicles.available || 0}</span>
              <span className="text-[9px] text-slate-400 mt-0.5">Available</span>
            </div>
            <div className="flex flex-col">
              <span className="text-indigo-500 font-black">{metrics?.vehicles.inRide || 0}</span>
              <span className="text-[9px] text-slate-400 mt-0.5">In Ride</span>
            </div>
            <div className="flex flex-col">
              <span className="text-amber-500 font-black">{metrics?.vehicles.nonCompliant || 0}</span>
              <span className="text-[9px] text-slate-400 mt-0.5">Warnings</span>
            </div>
          </div>
        </div>

        {/* Ride metrics */}
        <div className="bg-white border border-slate-200/50 p-6 rounded-2xl shadow-soft">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
              <Navigation size={20} />
            </div>
            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Rides
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-slate-800 font-display tracking-tight">
              {metrics?.rides.active || 0}
            </h3>
            <p className="text-[11px] font-bold text-slate-400">Active Fleet Trips</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100 text-xs font-bold text-slate-600">
            <div className="flex flex-col">
              <span className="text-slate-800 font-black">{metrics?.rides.scheduled || 0}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Scheduled</span>
            </div>
            <div className="flex flex-col">
              <span className="text-emerald-500 font-black">{metrics?.rides.completedToday || 0}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Done Today</span>
            </div>
          </div>
        </div>

        {/* Financial metrics */}
        <div className="bg-white border border-slate-200/50 p-6 rounded-2xl shadow-soft">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Earnings
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-slate-800 font-display tracking-tight">
              ₹{metrics?.revenue.today.toLocaleString() || 0}
            </h3>
            <p className="text-[11px] font-bold text-slate-400">Today's Revenue</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100 text-xs font-bold text-slate-600">
            <div className="flex flex-col">
              <span className="text-slate-800 font-black">₹{metrics?.revenue.weekly.toLocaleString() || 0}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Weekly</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-800 font-black">₹{metrics?.revenue.monthly.toLocaleString() || 0}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Monthly</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action alerts and control center link */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts Center */}
        <div className="lg:col-span-2 bg-white border border-slate-200/50 rounded-2xl p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-sm font-black text-slate-800 font-display uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              <span>Requires Attention</span>
            </h2>
            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-500 rounded-full font-black text-[10px]">
              {alerts.length} Warnings
            </span>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <ShieldAlert size={40} className="stroke-[1.5]" />
                <span className="text-xs font-bold mt-2">All fleet components compliant</span>
              </div>
            ) : (
              alerts.map((alert, idx) => {
                const isCritical = alert.severity === "CRITICAL";
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex justify-between items-start gap-4 ${
                      isCritical
                        ? "bg-rose-50/50 border-rose-100 text-rose-800"
                        : "bg-amber-50/50 border-amber-100 text-amber-800"
                    }`}
                  >
                    <div className="space-y-1">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isCritical ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <p className="text-xs font-bold leading-relaxed pt-1.5">{alert.reason}</p>
                    </div>

                    <Link
                      href={alert.entity === "VEHICLE" ? `/vehicles/${alert.entityId}` : `/schedule`}
                      className={`p-2 rounded-lg transition-colors shrink-0 cursor-pointer ${
                        isCritical ? "hover:bg-rose-100" : "hover:bg-amber-100"
                      }`}
                    >
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Live Ops Link Panel */}
        <div className="bg-indigo-900 rounded-2xl p-8 text-white flex flex-col justify-between shadow-soft relative overflow-hidden select-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full blur-2xl opacity-50" />
          <div className="space-y-3 relative z-10">
            <span className="text-[9px] font-black tracking-widest uppercase bg-indigo-950/40 border border-indigo-700/30 px-3 py-1 rounded-full text-indigo-300">
              Live Operations
            </span>
            <h2 className="text-2xl font-black font-display tracking-tight leading-tight pt-2">
              Interactive Dispatch Map
            </h2>
            <p className="text-xs text-indigo-200/80 font-semibold leading-relaxed">
              Open the control center map to see online drivers, trace paths, and track dispatches in real-time.
            </p>
          </div>

          <div className="pt-6 relative z-10">
            <Link
              href="/live-operations"
              className="px-6 py-3 bg-white text-indigo-900 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-md hover:bg-slate-50 transition-colors"
            >
              <span>Go to Command Center</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
