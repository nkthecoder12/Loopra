"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useNotificationStore } from "@/stores/notificationStore";
import {
  Calendar,
  AlertTriangle,
  UserCheck,
  Loader2,
  Clock,
  MapPin,
  CheckCircle,
  HelpCircle
} from "lucide-react";

interface Driver {
  _id: string;
  name: string;
  phone: string;
  isAvailable: boolean;
}

interface ScheduledRide {
  _id: string;
  userId: {
    name: string;
  };
  driverId?: {
    _id: string;
    name: string;
  } | null;
  pickupLocation: {
    address: string;
  };
  dropLocation: {
    address: string;
  };
  status: string;
  scheduledAt: string;
  createdAt: string;
}

interface ConflictDetail {
  hasConflict: boolean;
  reason: string;
}

export default function SchedulePage() {
  const { addToast } = useNotificationStore();
  const [rides, setRides] = useState<ScheduledRide[]>([]);
  const [conflicts, setConflicts] = useState<{ [key: string]: ConflictDetail }>({});
  const [loading, setLoading] = useState(true);

  // Assignment Modal
  const [selectedRide, setSelectedRide] = useState<ScheduledRide | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const fetchSchedule = async () => {
    try {
      const response = await api.get("/fleet/schedule");
      if (response.data.success) {
        setRides(response.data.rides);
        setConflicts(response.data.conflicts || {});
      }
    } catch (err) {
      addToast("error", "Failed to retrieve scheduled rides");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  const openAssignModal = async (ride: ScheduledRide) => {
    setSelectedRide(ride);
    setLoadingDrivers(true);
    try {
      const response = await api.get("/fleet/drivers");
      if (response.data.success) {
        // eligible drivers who are approved
        const approved = response.data.data.drivers.filter(
          (d: any) => d.onboardingStatus === "APPROVED" && d.isDeleted === false
        );
        setAvailableDrivers(approved);
      }
    } catch (err) {
      addToast("error", "Failed to query eligible dispatch drivers");
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleAssignDriver = async (driverId: string) => {
    if (!selectedRide) return;
    setAssigning(true);
    try {
      const response = await api.post(`/fleet/rides/${selectedRide._id}/assign`, {
        driverId
      });
      if (response.data.success) {
        addToast("success", "Driver successfully assigned to scheduled dispatch");
        setSelectedRide(null);
        fetchSchedule();
      }
    } catch (err: any) {
      // Axios interceptor will show conflict errors as toast warnings automatically.
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-8 select-none font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 font-display tracking-tight leading-none">
          Dispatch Schedule
        </h1>
        <p className="text-xs font-semibold text-slate-400 mt-2">
          Monitor upcoming scheduled dispatches, detect assignment overlaps, and manage driver matching.
        </p>
      </div>

      {/* Schedule Table */}
      <div className="bg-white border border-slate-200/50 rounded-2xl overflow-hidden shadow-soft">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : rides.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs font-bold">
            No upcoming scheduled dispatches.
          </div>
        ) : (
          <div className="overflow-x-auto text-xs font-semibold text-slate-600">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-widest text-[9px] font-black">
                  <th className="p-4 pl-6">Scheduled Time</th>
                  <th className="p-4">Passenger</th>
                  <th className="p-4">Route Details</th>
                  <th className="p-4">Driver Assigned</th>
                  <th className="p-4">Conflict Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rides.map((r) => {
                  const conflict = conflicts[r._id];
                  const hasConflict = conflict?.hasConflict;
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-indigo-500" />
                          <span>{new Date(r.scheduledAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-slate-700">{r.userId.name}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5 max-w-xs text-[10px] font-semibold text-slate-400">
                          <span className="truncate text-slate-500 font-bold">From: {r.pickupLocation.address}</span>
                          <span className="truncate">To: {r.dropLocation.address}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold">
                        {r.driverId ? (
                          <span className="text-slate-800">{r.driverId.name}</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-4 font-bold">
                        {hasConflict ? (
                          <div className="flex items-center gap-1.5 text-rose-600" title={conflict.reason}>
                            <AlertTriangle size={14} />
                            <span className="text-[10px] font-black uppercase">Conflict</span>
                          </div>
                        ) : r.driverId ? (
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle size={14} />
                            <span className="text-[10px] font-black uppercase">Safe</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <HelpCircle size={14} />
                            <span className="text-[10px] font-black uppercase">Awaiting Pair</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => openAssignModal(r)}
                          className="px-3 py-1.5 border border-indigo-500 text-indigo-500 hover:bg-indigo-50 rounded-lg text-[10px] font-black cursor-pointer transition-colors"
                        >
                          Pair Driver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Driver Assignment Overlay */}
      {selectedRide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-soft max-w-md w-full p-6 animate-slide-in space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-800 font-display uppercase tracking-wider">
                Assign Dispatch Driver
              </h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-1">
                Time: <span className="font-bold text-slate-700">{new Date(selectedRide.scheduledAt).toLocaleString()}</span>
              </p>
            </div>

            {loadingDrivers ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-indigo-500" size={24} />
              </div>
            ) : (
              <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                {availableDrivers.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 font-bold">
                    No approved fleet drivers available.
                  </div>
                ) : (
                  availableDrivers.map((driver) => (
                    <div
                      key={driver._id}
                      onClick={() => !assigning && handleAssignDriver(driver._id)}
                      className="p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/15 flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div className="flex flex-col text-xs font-bold text-slate-700">
                        <span>{driver.name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{driver.phone}</span>
                      </div>
                      <UserCheck size={16} className="text-slate-400 hover:text-indigo-600" />
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="flex pt-2">
              <button
                type="button"
                onClick={() => setSelectedRide(null)}
                className="w-full py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-black cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
