"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useNotificationStore } from "@/stores/notificationStore";
import {
  Search,
  Filter,
  Loader2,
  Calendar,
  Eye,
  MapPin,
  Navigation,
  Compass
} from "lucide-react";
import Link from "next/link";

interface Ride {
  _id: string;
  userId: {
    _id: string;
    name: string;
  };
  driverId?: {
    _id: string;
    name: string;
    phone: string;
  } | null;
  pickupLocation: {
    address: string;
  };
  dropLocation: {
    address: string;
  };
  status: string;
  fare: number;
  finalFare?: number;
  distanceKm: number;
  type: string;
  scheduledAt?: string;
  createdAt: string;
}

export default function RidesPage() {
  const { addToast } = useNotificationStore();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchRides = async () => {
    try {
      const response = await api.get("/fleet/rides", {
        params: {
          search: search.trim() || undefined,
          status: statusFilter || undefined
        }
      });
      if (response.data.success) {
        setRides(response.data.data.rides);
      }
    } catch (err) {
      addToast("error", "Failed to retrieve rides logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [search, statusFilter]);

  return (
    <div className="space-y-8 select-none font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 font-display tracking-tight leading-none">
          Rides Log
        </h1>
        <p className="text-xs font-semibold text-slate-400 mt-2">
          History log of instant requests, scheduled dispatches, and active trip paths.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-slate-200/50 rounded-2xl shadow-soft">
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by passenger name or ride ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-600 appearance-none focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            <option value="">All Trips</option>
            <option value="requested">Requested</option>
            <option value="driver_assigned">Assigned</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Rides Table */}
      <div className="bg-white border border-slate-200/50 rounded-2xl overflow-hidden shadow-soft">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : rides.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs font-bold">
            No ride records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-widest text-[9px] font-black">
                  <th className="p-4 pl-6">Ride ID</th>
                  <th className="p-4">Passenger</th>
                  <th className="p-4">Driver</th>
                  <th className="p-4">Route Details</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Fare & Distance</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rides.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-400 text-[10px]">
                      {r._id}
                    </td>
                    <td className="p-4 font-bold text-slate-800">{r.userId.name}</td>
                    <td className="p-4 font-bold">
                      {r.driverId ? (
                        <span className="text-slate-700">{r.driverId.name}</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-0.5 max-w-[200px] text-[10px] font-semibold text-slate-500">
                        <span className="truncate">From: {r.pickupLocation.address}</span>
                        <span className="truncate">To: {r.dropLocation.address}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        r.type === "SCHEDULED"
                          ? "bg-amber-50 text-amber-600 border border-amber-100"
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        r.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-600"
                          : r.status === "CANCELLED" || r.status === "FAILED"
                          ? "bg-rose-50 text-rose-600"
                          : "bg-indigo-50 text-indigo-600"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold">
                      <div className="flex flex-col">
                        <span>₹{r.finalFare || r.fare}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{r.distanceKm.toFixed(1)} km</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Link
                          href={`/rides/${r._id}`}
                          className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="View Dispatch Profile"
                        >
                          <Eye size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
