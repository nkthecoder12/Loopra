"use client";

import React, { useEffect, useState, use } from "react";
import api from "@/lib/api";
import { useNotificationStore } from "@/stores/notificationStore";
import {
  Loader2,
  ArrowLeft,
  Car,
  Calendar,
  Compass,
  FileText,
  ShieldCheck,
  ShieldAlert,
  User,
  History
} from "lucide-react";
import Link from "next/link";

interface VehicleDetails {
  _id: string;
  registrationNumber: string;
  type: string;
  model: string;
  status: string;
  assignedDriverId?: {
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
  documents?: {
    rc?: string;
    insurance?: string;
  };
}

interface HistoricalRide {
  _id: string;
  userId: {
    name: string;
  };
  driverId: {
    name: string;
  };
  pickupLocation: {
    address: string;
  };
  dropLocation: {
    address: string;
  };
  finalFare: number;
  completedAt: string;
}

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addToast } = useNotificationStore();
  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [rides, setRides] = useState<HistoricalRide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        const response = await api.get(`/fleet/vehicles/${id}`);
        if (response.data.success) {
          setVehicle(response.data.vehicle);
          setRides(response.data.ridesHistory || []);
        }
      } catch (err) {
        addToast("error", "Failed to retrieve vehicle details");
      } finally {
        setLoading(false);
      }
    };
    fetchVehicleDetails();
  }, [id, addToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-20 font-bold text-slate-400 text-xs font-sans">
        Vehicle not found
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none font-sans">
      {/* Header and Back button */}
      <div className="flex items-center gap-4">
        <Link
          href="/vehicles"
          className="p-2 border border-slate-200/50 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-display tracking-tight leading-none uppercase">
            {vehicle.registrationNumber}
          </h1>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
            Vehicle Profile &bull; Model: {vehicle.model}
          </p>
        </div>
      </div>

      {/* Detail grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Core Spec and Driver */}
        <div className="space-y-6 self-start">
          <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-soft space-y-6">
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
                <Car size={32} className="stroke-[1.5]" />
              </div>
              <h3 className="font-display font-black text-slate-800 text-base leading-none uppercase">
                {vehicle.registrationNumber}
              </h3>
              <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider mt-3">
                {vehicle.status}
              </span>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Asset Type</span>
                <span className="uppercase text-slate-800">{vehicle.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Model Specifications</span>
                <span className="text-slate-800">{vehicle.model}</span>
              </div>
            </div>
          </div>

          {/* Assigned Driver details card */}
          <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-soft space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              Driver Relationship
            </h4>

            {vehicle.assignedDriverId ? (
              <div className="flex items-center gap-3 text-xs font-bold">
                <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl">
                  <User size={16} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-slate-800">{vehicle.assignedDriverId.name}</span>
                  <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{vehicle.assignedDriverId.phone}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400 font-bold">
                No active driver paired to this vehicle
              </div>
            )}
          </div>
        </div>

        {/* Right column: Compliance Expirations and History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Compliance Expirations list */}
          <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-soft space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-xs font-black text-slate-800 font-display uppercase tracking-wider flex items-center gap-2">
                <FileText size={18} className="text-indigo-500" />
                <span>Compliance Schedule Expirations</span>
              </h3>
              <div className="flex items-center gap-1.5 font-bold">
                {vehicle.compliance.isCompliant ? (
                  <>
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span className="text-emerald-600 text-xs">Valid</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={16} className="text-rose-500" />
                    <span className="text-rose-600 text-xs">Violations Detected</span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold text-slate-600">
              {/* Insurance */}
              <div className="p-4 border border-slate-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Insurance</span>
                  <Calendar size={14} />
                </div>
                <p className="text-slate-800 pt-1.5">
                  {vehicle.compliance.expirationDates.insurance
                    ? new Date(vehicle.compliance.expirationDates.insurance).toLocaleDateString()
                    : "Not Configured"}
                </p>
              </div>

              {/* Permit */}
              <div className="p-4 border border-slate-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Permit</span>
                  <Calendar size={14} />
                </div>
                <p className="text-slate-800 pt-1.5">
                  {vehicle.compliance.expirationDates.permit
                    ? new Date(vehicle.compliance.expirationDates.permit).toLocaleDateString()
                    : "Not Configured"}
                </p>
              </div>

              {/* Fitness */}
              <div className="p-4 border border-slate-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Fitness Certificate</span>
                  <Calendar size={14} />
                </div>
                <p className="text-slate-800 pt-1.5">
                  {vehicle.compliance.expirationDates.fitness
                    ? new Date(vehicle.compliance.expirationDates.fitness).toLocaleDateString()
                    : "Not Configured"}
                </p>
              </div>
            </div>
          </div>

          {/* Historical Trips List */}
          <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-soft space-y-4">
            <h3 className="text-xs font-black text-slate-800 font-display uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-4">
              <History size={18} className="text-indigo-500" />
              <span>Historical Rides Completed</span>
            </h3>

            {rides.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold">
                No historical trip logs for this vehicle.
              </div>
            ) : (
              <div className="overflow-x-auto text-xs font-semibold text-slate-600">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase tracking-widest text-[9px] font-black">
                      <th className="p-3">Ride ID</th>
                      <th className="p-3">Driver</th>
                      <th className="p-3">Passenger</th>
                      <th className="p-3">Route details</th>
                      <th className="p-3">Fare</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rides.map((ride) => (
                      <tr key={ride._id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-3 text-[10px] font-bold text-slate-400">{ride._id}</td>
                        <td className="p-3 font-bold text-slate-800">{ride.driverId.name}</td>
                        <td className="p-3 font-bold text-slate-800">{ride.userId.name}</td>
                        <td className="p-3">
                          <div className="flex flex-col gap-0.5 max-w-xs text-[10px] font-semibold text-slate-500">
                            <span className="truncate">From: {ride.pickupLocation.address}</span>
                            <span className="truncate">To: {ride.dropLocation.address}</span>
                          </div>
                        </td>
                        <td className="p-3 font-bold text-slate-800">₹{ride.finalFare}</td>
                        <td className="p-3 text-slate-400 font-bold">
                          {new Date(ride.completedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
