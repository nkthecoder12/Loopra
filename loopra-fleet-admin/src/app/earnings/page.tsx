"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useNotificationStore } from "@/stores/notificationStore";
import { Loader2, DollarSign, RefreshCw, Landmark, ArrowUpRight } from "lucide-react";

interface FinancialMetrics {
  grossRevenue: number;
  refundsPaid: number;
  netRevenue: number;
  completedTrips: number;
  refundedTrips: number;
}

interface ChartItem {
  date: string;
  revenue: number;
}

export default function EarningsPage() {
  const { addToast } = useNotificationStore();
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("monthly");

  useEffect(() => {
    const fetchEarnings = async () => {
      setLoading(true);
      try {
        const response = await api.get("/fleet/earnings", { params: { dateRange: range } });
        if (response.data.success) {
          setMetrics(response.data.metrics);
          setChartData(response.data.chartData || []);
        }
      } catch (err) {
        addToast("error", "Failed to retrieve earnings updates");
      } finally {
        setLoading(false);
      }
    };
    fetchEarnings();
  }, [range, addToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none font-sans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-display tracking-tight leading-none">
            Earnings Analysis
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-2">
            Track gross booking earnings, refunds paid, and net corporate revenue.
          </p>
        </div>

        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200/60 rounded-xl text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
        >
          <option value="today">Today</option>
          <option value="weekly">Last 7 Days</option>
          <option value="monthly">Last 30 Days</option>
        </select>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gross balance */}
        <div className="bg-white border border-slate-200/50 p-6 rounded-2xl shadow-soft flex gap-4 items-center">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign size={20} />
          </div>
          <div className="flex flex-col text-xs font-bold text-slate-500">
            <span>Gross Revenue</span>
            <span className="text-2xl font-black text-slate-800 font-display mt-1">
              ₹{metrics?.grossRevenue.toLocaleString() || 0}
            </span>
          </div>
        </div>

        {/* Refund Paid */}
        <div className="bg-white border border-slate-200/50 p-6 rounded-2xl shadow-soft flex gap-4 items-center">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <RefreshCw size={20} />
          </div>
          <div className="flex flex-col text-xs font-bold text-slate-500">
            <span>Refunds Paid</span>
            <span className="text-2xl font-black text-slate-800 font-display mt-1">
              ₹{metrics?.refundsPaid.toLocaleString() || 0}
            </span>
          </div>
        </div>

        {/* Net corporate balance */}
        <div className="bg-white border border-slate-200/50 p-6 rounded-2xl shadow-soft flex gap-4 items-center">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Landmark size={20} />
          </div>
          <div className="flex flex-col text-xs font-bold text-slate-500">
            <span>Net Revenue</span>
            <span className="text-2xl font-black text-slate-800 font-display mt-1">
              ₹{metrics?.netRevenue.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Chart and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Revenue Log list */}
        <div className="lg:col-span-2 bg-white border border-slate-200/50 rounded-2xl p-6 shadow-soft space-y-4">
          <h3 className="text-xs font-black text-slate-800 font-display uppercase tracking-wider border-b border-slate-100 pb-3">
            Daily Revenue Statement
          </h3>

          {chartData.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-bold">
              No revenue statements registered in range.
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 text-xs font-bold text-slate-600">
              {chartData.map((item, idx) => (
                <div key={idx} className="p-3.5 border border-slate-100 rounded-xl flex justify-between items-center bg-slate-50/20">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight size={14} className="text-emerald-500" />
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  <span className="text-slate-800 font-black">₹{item.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trip Counts Panel */}
        <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-soft space-y-4">
          <h3 className="text-xs font-black text-slate-800 font-display uppercase tracking-wider border-b border-slate-100 pb-3">
            Trip Distribution
          </h3>

          <div className="space-y-4 text-xs font-bold text-slate-600">
            <div className="flex justify-between p-3.5 bg-slate-50/50 rounded-xl">
              <span>Completed Trips</span>
              <span className="text-slate-800 font-black">{metrics?.completedTrips || 0}</span>
            </div>
            <div className="flex justify-between p-3.5 bg-slate-50/50 rounded-xl">
              <span>Refunded Trips</span>
              <span className="text-rose-500 font-black">{metrics?.refundedTrips || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
