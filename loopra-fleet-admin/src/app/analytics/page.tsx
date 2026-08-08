"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useNotificationStore } from "@/stores/notificationStore";
import { Loader2, Percent, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface AnalyticsData {
  utilizationRate: number;
  rideDistribution: {
    total: number;
    completed: number;
    cancelled: number;
    failed: number;
  };
}

export default function AnalyticsPage() {
  const { addToast } = useNotificationStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get("/fleet/analytics");
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (err) {
        addToast("error", "Failed to retrieve analytics metrics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [addToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  const completedRate = data?.rideDistribution.total
    ? Math.round((data.rideDistribution.completed / data.rideDistribution.total) * 100)
    : 100;

  const cancellationRate = data?.rideDistribution.total
    ? Math.round((data.rideDistribution.cancelled / data.rideDistribution.total) * 100)
    : 0;

  return (
    <div className="space-y-8 select-none font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 font-display tracking-tight leading-none">
          Operations Analytics
        </h1>
        <p className="text-xs font-semibold text-slate-400 mt-2">
          Monitor operational efficiencies, trip volume distributions, and asset utilization.
        </p>
      </div>

      {/* Utilization Rate and distribution cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Utilization gauge */}
        <div className="bg-white border border-slate-200/50 p-6 rounded-2xl shadow-soft flex flex-col justify-between min-h-[220px]">
          <div>
            <h3 className="text-xs font-black text-slate-800 font-display uppercase tracking-wider border-b border-slate-100 pb-2">
              Asset Utilization Rate
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">
              Percentage of total active fleet vehicles currently in ride status.
            </p>
          </div>
          <div className="flex items-center gap-6 py-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center font-display font-black text-xl">
              {data?.utilizationRate || 0}%
            </div>
            <div className="flex flex-col text-xs font-semibold text-slate-500">
              <span className="text-slate-800 font-black">Active Dispatching</span>
              <span className="mt-1">Based on vehicles registered under active drivers</span>
            </div>
          </div>
        </div>

        {/* Efficiency metrics */}
        <div className="bg-white border border-slate-200/50 p-6 rounded-2xl shadow-soft flex flex-col justify-between min-h-[220px]">
          <div>
            <h3 className="text-xs font-black text-slate-800 font-display uppercase tracking-wider border-b border-slate-100 pb-2">
              Performance Efficiency
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">
              Trip completion rate vs passenger/driver cancellations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 py-4 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-lg">
                <CheckCircle size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-slate-800 font-black">{completedRate}%</span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Completion</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-500 rounded-lg">
                <XCircle size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-slate-800 font-black">{cancellationRate}%</span>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Cancellation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ride distribution logs */}
      <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-soft space-y-4">
        <h3 className="text-xs font-black text-slate-800 font-display uppercase tracking-wider border-b border-slate-100 pb-3">
          Trip Log Totals
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-slate-600">
          <div className="p-4 border border-slate-100 rounded-xl">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Booking Requests</span>
            <p className="text-lg font-black text-slate-800 font-display mt-2">{data?.rideDistribution.total || 0}</p>
          </div>
          <div className="p-4 border border-slate-100 rounded-xl">
            <span className="text-emerald-500 text-[10px] uppercase font-bold tracking-wider">Completed Trips</span>
            <p className="text-lg font-black text-slate-800 font-display mt-2">{data?.rideDistribution.completed || 0}</p>
          </div>
          <div className="p-4 border border-slate-100 rounded-xl">
            <span className="text-rose-500 text-[10px] uppercase font-bold tracking-wider">Cancelled Trips</span>
            <p className="text-lg font-black text-slate-800 font-display mt-2">{data?.rideDistribution.cancelled || 0}</p>
          </div>
          <div className="p-4 border border-slate-100 rounded-xl">
            <span className="text-amber-500 text-[10px] uppercase font-bold tracking-wider">Failed Matching</span>
            <p className="text-lg font-black text-slate-800 font-display mt-2">{data?.rideDistribution.failed || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
