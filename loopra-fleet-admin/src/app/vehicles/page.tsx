"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useNotificationStore } from "@/stores/notificationStore";
import {
  Search,
  Plus,
  Loader2,
  Trash2,
  UserCheck,
  Eye,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Car
} from "lucide-react";
import Link from "next/link";

interface Vehicle {
  _id: string;
  registrationNumber: string;
  type: string;
  model: string;
  status: "AVAILABLE" | "IN_RIDE" | "MAINTENANCE" | "SUSPENDED" | "INACTIVE";
  assignedDriverId: {
    _id: string;
    name: string;
    phone: string;
  } | null;
  compliance: {
    isCompliant: boolean;
    expirationDates: {
      insurance?: string;
      permit?: string;
      fitness?: string;
    };
  };
}

interface UnassignedDriver {
  _id: string;
  name: string;
  phone: string;
}

export default function VehiclesPage() {
  const { addToast } = useNotificationStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal / Add state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    registrationNumber: "",
    type: "car",
    model: "",
    complianceExpirations: {
      insurance: "",
      permit: "",
      fitness: ""
    }
  });
  const [submitting, setSubmitting] = useState(false);

  // Driver Assignment Overlay State
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [eligibleDrivers, setEligibleDrivers] = useState<UnassignedDriver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  const fetchVehicles = async () => {
    try {
      const response = await api.get("/fleet/vehicles", {
        params: {
          search: search.trim() || undefined,
          status: statusFilter || undefined
        }
      });
      if (response.data.success) {
        setVehicles(response.data.data.vehicles);
      }
    } catch (err) {
      addToast("error", "Failed to retrieve vehicles list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [search, statusFilter]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post("/fleet/vehicles", {
        ...newVehicle,
        registrationNumber: newVehicle.registrationNumber.toUpperCase().trim()
      });
      if (response.data.success) {
        addToast("success", "Vehicle registered successfully");
        setShowAddModal(false);
        setNewVehicle({
          registrationNumber: "",
          type: "car",
          model: "",
          complianceExpirations: { insurance: "", permit: "", fitness: "" }
        });
        fetchVehicles();
      }
    } catch (err) {
      // Axios interceptor fires toasts
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (!confirm("Are you sure you want to delete this vehicle? Historical data will be preserved, but the asset will be marked inactive.")) return;
    try {
      const response = await api.delete(`/fleet/vehicles/${vehicleId}`);
      if (response.data.success) {
        addToast("success", "Vehicle soft deleted successfully");
        fetchVehicles();
      }
    } catch (err) {
      // Handled by interceptor
    }
  };

  const openAssignmentDrawer = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setLoadingDrivers(true);
    try {
      const response = await api.get("/fleet/drivers");
      if (response.data.success) {
        // Filter drivers who are APPROVED and do NOT have an active vehicle matching (or keep current)
        const allDrivers = response.data.data.drivers;
        const available = allDrivers.filter(
          (d: any) => d.onboardingStatus === "APPROVED" && (!d.vehicleId || d.vehicleId._id === vehicle.assignedDriverId?._id)
        );
        setEligibleDrivers(available);
      }
    } catch (err) {
      addToast("error", "Failed to query available fleet drivers");
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleAssignDriver = async (driverId: string | null) => {
    if (!selectedVehicle) return;
    try {
      const response = await api.patch(`/fleet/vehicles/${selectedVehicle._id}/driver`, {
        driverId
      });
      if (response.data.success) {
        addToast("success", driverId ? "Driver assigned successfully" : "Driver unassigned successfully");
        setSelectedVehicle(null);
        fetchVehicles();
      }
    } catch (err) {
      // Interceptor handles error
    }
  };

  return (
    <div className="space-y-8 select-none font-sans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-display tracking-tight leading-none">
            Vehicles
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-2">
            Register new assets, perform pairing alignments, and review soft-delete entries.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer transition-colors"
        >
          <Plus size={16} />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-slate-200/50 rounded-2xl shadow-soft">
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by registration number, type, or model..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-bold text-slate-600 appearance-none focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="in_ride">In Ride</option>
            <option value="maintenance">Maintenance</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      <div className="bg-white border border-slate-200/50 rounded-2xl overflow-hidden shadow-soft">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs font-bold">
            No registered vehicles found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold text-slate-600">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-widest text-[9px] font-black">
                  <th className="p-4 pl-6">Plate Number</th>
                  <th className="p-4">Model & Type</th>
                  <th className="p-4">Operational Status</th>
                  <th className="p-4">Assigned Driver</th>
                  <th className="p-4">Compliance Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-800 tracking-wider">
                      {v.registrationNumber}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{v.model}</span>
                        <span className="text-[10px] text-slate-400 uppercase mt-0.5">{v.type}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        v.status === "AVAILABLE"
                          ? "bg-emerald-50 text-emerald-600"
                          : v.status === "IN_RIDE"
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-amber-50 text-amber-600"
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold">
                      {v.assignedDriverId ? (
                        <span className="text-slate-800">{v.assignedDriverId.name}</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-bold">
                        {v.compliance.isCompliant ? (
                          <>
                            <ShieldCheck size={14} className="text-emerald-500" />
                            <span className="text-emerald-600 text-[11px]">Compliant</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert size={14} className="text-rose-500" />
                            <span className="text-rose-600 text-[11px]">Warnings</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/vehicles/${v._id}`}
                          className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="View Vehicle Profile"
                        >
                          <Eye size={14} />
                        </Link>
                        <button
                          onClick={() => openAssignmentDrawer(v)}
                          className="p-1.5 hover:bg-indigo-55 text-indigo-500 hover:text-indigo-700 rounded-lg transition-colors cursor-pointer"
                          title="Pair Driver"
                        >
                          <UserCheck size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(v._id)}
                          className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                          title="Soft Delete Asset"
                        >
                          <Trash2 size={14} />
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

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-soft max-w-md w-full p-6 animate-slide-in space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-800 font-display uppercase tracking-wider">Add Vehicle Asset</h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-1">Configure specification details and compliance schedules.</p>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs font-bold text-slate-600">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-slate-400">Plate Number</label>
                  <input
                    type="text"
                    required
                    value={newVehicle.registrationNumber}
                    onChange={(e) => setNewVehicle({ ...newVehicle, registrationNumber: e.target.value })}
                    placeholder="TN38AB1234"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-slate-400">Model Name</label>
                  <input
                    type="text"
                    required
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    placeholder="e.g. Maruti Dzire"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-slate-400">Category Type</label>
                <select
                  value={newVehicle.type}
                  onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="car">Car / Economy</option>
                  <option value="premium">Premium Sedan</option>
                  <option value="suv">SUV</option>
                  <option value="auto">Auto Rikshaw</option>
                  <option value="bike">Bike</option>
                </select>
              </div>

              {/* Compliance expirations */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">Compliance Expirations</h4>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-wider text-slate-400">Insurance</label>
                    <input
                      type="date"
                      required
                      value={newVehicle.complianceExpirations.insurance}
                      onChange={(e) => setNewVehicle({
                        ...newVehicle,
                        complianceExpirations: { ...newVehicle.complianceExpirations, insurance: e.target.value }
                      })}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-wider text-slate-400">Permit</label>
                    <input
                      type="date"
                      required
                      value={newVehicle.complianceExpirations.permit}
                      onChange={(e) => setNewVehicle({
                        ...newVehicle,
                        complianceExpirations: { ...newVehicle.complianceExpirations, permit: e.target.value }
                      })}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] uppercase tracking-wider text-slate-400">Fitness</label>
                    <input
                      type="date"
                      required
                      value={newVehicle.complianceExpirations.fitness}
                      onChange={(e) => setNewVehicle({
                        ...newVehicle,
                        complianceExpirations: { ...newVehicle.complianceExpirations, fitness: e.target.value }
                      })}
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/10 cursor-pointer flex justify-center items-center"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : "Register"}
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

      {/* Driver Pairing Drawer Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-soft max-w-md w-full p-6 animate-slide-in space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-800 font-display uppercase tracking-wider">Pair Driver</h3>
              <p className="text-[10px] font-semibold text-slate-400 mt-1">
                Vehicle: <span className="font-bold text-slate-700">{selectedVehicle.registrationNumber}</span>
              </p>
            </div>

            {loadingDrivers ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-indigo-500" size={24} />
              </div>
            ) : (
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {eligibleDrivers.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 font-bold">
                    No available unassigned drivers in fleet
                  </div>
                ) : (
                  eligibleDrivers.map((driver) => {
                    const isCurrent = driver._id === selectedVehicle.assignedDriverId?._id;
                    return (
                      <div
                        key={driver._id}
                        onClick={() => handleAssignDriver(driver._id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                          isCurrent
                            ? "border-indigo-500 bg-indigo-50/20 text-indigo-600"
                            : "border-slate-100 hover:border-slate-200 text-slate-700"
                        }`}
                      >
                        <div className="flex flex-col text-xs font-bold">
                          <span>{driver.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{driver.phone}</span>
                        </div>
                        {isCurrent && <span className="text-[10px] font-black uppercase">Current</span>}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <div className="flex gap-2">
              {selectedVehicle.assignedDriverId && (
                <button
                  onClick={() => handleAssignDriver(null)}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black cursor-pointer"
                >
                  Unassign Driver
                </button>
              )}
              <button
                onClick={() => setSelectedVehicle(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-black cursor-pointer"
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
