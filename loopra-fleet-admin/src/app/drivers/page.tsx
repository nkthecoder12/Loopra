"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useNotificationStore } from "@/stores/notificationStore";
import {
  Search,
  Filter,
  Plus,
  Loader2,
  Phone,
  UserCheck,
  Ban,
  Eye,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";

interface Driver {
  _id: string;
  name: string;
  phone: string;
  onboardingStatus: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "INACTIVE" | "DELETED";
  isAvailable: boolean;
  vehicle: {
    type: string;
    number: string;
  };
  vehicleId?: {
    _id: string;
    registrationNumber: string;
    model: string;
  } | null;
  earnings?: {
    total: number;
    rides: number;
    rating: number;
  };
  createdAt: string;
}

export default function DriversPage() {
  const { addToast } = useNotificationStore();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal / Onboarding State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    vehicleType: "car",
    vehicleNumber: ""
  });
  const [submitting, setSubmitting] = useState(false);

  // Status Change Overlay
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [statusReason, setStatusReason] = useState("");

  const fetchDrivers = async () => {
    try {
      const response = await api.get("/fleet/drivers", {
        params: {
          search: search.trim() || undefined,
          status: statusFilter || undefined
        }
      });
      if (response.data.success) {
        setDrivers(response.data.data.drivers);
      }
    } catch (err) {
      addToast("error", "Failed to retrieve drivers list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [search, statusFilter]);

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post("/fleet/drivers", formData);
      if (response.data.success) {
        addToast("success", "Driver onboarded successfully");
        setShowAddModal(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          password: "",
          vehicleType: "car",
          vehicleNumber: ""
        });
        fetchDrivers();
      }
    } catch (err) {
      // Axios interceptor logs toast errors
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (newStatus: "APPROVED" | "SUSPENDED" | "INACTIVE") => {
    if (!selectedDriver) return;
    try {
      const response = await api.patch(`/fleet/drivers/${selectedDriver._id}/status`, {
        onboardingStatus: newStatus,
        reason: statusReason
      });
      if (response.data.success) {
        addToast("success", `Driver status set to ${newStatus}`);
        setSelectedDriver(null);
        setStatusReason("");
        fetchDrivers();
      }
    } catch (err) {
      // Axios interceptor fires warnings
    }
  };

  return (
    <div className="space-y-8 select-none font-sans">
      {/* Header and Add button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-display tracking-tight leading-none">
            Drivers
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-2">
            Onboard, verify credentials, and manage active vehicle driver profiles.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer transition-colors"
        >
          <Plus size={16} />
          <span>Onboard Driver</span>
        </button>
      </div>

      {/* Filter and search panels */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-slate-200/50 rounded-2xl shadow-soft">
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or plate number..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none" size={14} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-8 pr-8 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-600 appearance-none focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="pending">Pending Verification</option>
              <option value="approved">Approved</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Driver Data Table */}
      <div className="bg-white border border-slate-200/50 rounded-2xl overflow-hidden shadow-soft">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs font-bold">
            No drivers found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-widest text-[9px] font-black">
                  <th className="p-4 pl-6">Driver</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Vehicle Match</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">GPS Availability</th>
                  <th className="p-4">Rides / Rating</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drivers.map((driver) => (
                  <tr key={driver._id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-800">{driver.name}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Phone size={12} />
                        <span>{driver.phone}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {driver.vehicleId ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{driver.vehicleId.registrationNumber}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">{driver.vehicleId.model}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        driver.onboardingStatus === "APPROVED"
                          ? "bg-emerald-50 text-emerald-600"
                          : driver.onboardingStatus === "PENDING"
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-rose-50 text-rose-600"
                      }`}>
                        {driver.onboardingStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${driver.isAvailable ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                        <span className="text-[11px] font-bold">{driver.isAvailable ? "Online" : "Offline"}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold">
                      <div className="flex flex-col">
                        <span>{driver.earnings?.rides || 0} Rides</span>
                        <span className="text-[10px] text-amber-500 mt-0.5">★ {driver.earnings?.rating?.toFixed(1) || "5.0"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/drivers/${driver._id}`}
                          className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </Link>
                        <button
                          onClick={() => setSelectedDriver(driver)}
                          className="p-1.5 hover:bg-indigo-50 text-indigo-500 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer"
                          title="Configure Account Status"
                        >
                          <UserCheck size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onboard Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-soft max-w-md w-full p-6 animate-slide-in space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-800 font-display uppercase tracking-wider">Onboard Driver</h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-1">Configure credentials and active vehicle pairings.</p>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4 text-xs font-bold text-slate-600">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-slate-400">Driver Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Raj Kumar"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-slate-400">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-slate-400">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="XXXXXXXXXX"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-slate-400">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Configure strong access password"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-slate-400">Vehicle Type</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="car">Car / Economy</option>
                    <option value="premium">Premium Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="auto">Auto Rikshaw</option>
                    <option value="bike">Bike</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-slate-400">Plate Number</label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    placeholder="TN38AB1234"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 cursor-pointer flex justify-center items-center"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : "Onboard"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-black cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboarding Approval Overlay */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-soft max-w-md w-full p-6 animate-slide-in space-y-5">
            <div>
              <h3 className="text-sm font-black text-slate-800 font-display uppercase tracking-wider">Configure Status</h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-1">Configure status for driver profile: <span className="font-bold text-slate-700">{selectedDriver.name}</span></p>
            </div>

            <div className="space-y-1.5 text-xs font-bold text-slate-600">
              <label className="text-[9px] uppercase tracking-wider text-slate-400">Comments / Reason</label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Required for audit trace logs..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 h-20 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleStatusUpdate("APPROVED")}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black cursor-pointer flex items-center justify-center gap-1"
              >
                <UserCheck size={12} />
                <span>Approve</span>
              </button>
              <button
                onClick={() => handleStatusUpdate("SUSPENDED")}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black cursor-pointer flex items-center justify-center gap-1"
              >
                <Ban size={12} />
                <span>Suspend</span>
              </button>
              <button
                onClick={() => setSelectedDriver(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-[10px] font-black cursor-pointer"
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
