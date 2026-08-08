"use client";

import React, { useEffect, useState, use } from "react";
import api from "@/lib/api";
import { useNotificationStore } from "@/stores/notificationStore";
import {
  Loader2,
  ArrowLeft,
  User,
  Phone,
  Mail,
  Car,
  Compass,
  DollarSign,
  Shield,
  FileText
} from "lucide-react";
import Link from "next/link";

interface DriverDetails {
  _id: string;
  name: string;
  phone: string;
  onboardingStatus: string;
  isAvailable: boolean;
  vehicle: {
    type: string;
    number: string;
  };
  vehicleId?: {
    _id: string;
    registrationNumber: string;
    model: string;
    documents?: {
      rc: string;
      insurance: string;
    };
  } | null;
  earnings?: {
    total: number;
    rides: number;
    rating: number;
    acceptanceRate?: number;
  };
  documents?: {
    license?: string;
    rc?: string;
  };
  userId?: {
    email: string;
    profileImage: string;
  };
}

interface RideLog {
  _id: string;
  userId: {
    name: string;
  };
  pickupLocation: {
    address: string;
  };
  dropLocation: {
    address: string;
  };
  status: string;
  finalFare: number;
  completedAt: string;
}

export default function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addToast } = useNotificationStore();
  const [driver, setDriver] = useState<DriverDetails | null>(null);
  const [rides, setRides] = useState<RideLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "rides">("overview");

  useEffect(() => {
    const fetchDriverDetails = async () => {
      try {
        const response = await api.get(`/fleet/drivers/${id}`);
        if (response.data.success) {
          setDriver(response.data.driver);
          setRides(response.data.ridesHistory || []);
        }
      } catch (err) {
        addToast("error", "Failed to retrieve driver metrics");
      } finally {
        setLoading(false);
      }
    };
    fetchDriverDetails();
  }, [id, addToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="text-center py-20 font-bold text-slate-400 text-xs font-sans">
        Driver profile not found
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none font-sans">
      {/* Back button and header */}
      <div className="flex items-center gap-4">
        <Link
          href="/drivers"
          className="p-2 border border-slate-200/50 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-display tracking-tight leading-none">
            {driver.name}
          </h1>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
            Driver Control Center &bull; ID: {driver._id}
          </p>
        </div>
      </div>

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Core profile details */}
        <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-soft space-y-6 self-start">
          <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
              <User size={36} className="stroke-[1.5]" />
            </div>
            <h3 className="font-display font-black text-slate-800 text-sm leading-none">{driver.name}</h3>
            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider mt-3">
              {driver.onboardingStatus}
            </span>
          </div>

          <div className="space-y-4 text-xs font-bold text-slate-700">
            <div className="flex items-center gap-3">
              <Phone size={14} className="text-slate-400" />
              <span>{driver.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail size={14} className="text-slate-400" />
              <span className="truncate">{driver.userId?.email || "No email"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Car size={14} className="text-slate-400" />
              <span>
                {driver.vehicleId
                  ? `${driver.vehicleId.registrationNumber} (${driver.vehicleId.model})`
                  : "No vehicle assigned"}
              </span>
            </div>
          </div>
        </div>

        {/* Right column: Action tabs and dynamic stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation header */}
          <div className="flex border-b border-slate-200">
            {(["overview", "documents", "rides"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
                  activeTab === tab
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Dynamic view selection */}
          <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-soft min-h-[300px]">
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* Stats panel grid */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-slate-400">
                      <DollarSign size={16} />
                      <span className="text-[9px] font-black uppercase">Earnings</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 font-display">
                      ₹{driver.earnings?.total.toLocaleString() || 0}
                    </h4>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-slate-400">
                      <Compass size={16} />
                      <span className="text-[9px] font-black uppercase">Trips</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 font-display">
                      {driver.earnings?.rides || 0}
                    </h4>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-slate-400">
                      <Shield size={16} />
                      <span className="text-[9px] font-black uppercase">Rating</span>
                    </div>
                    <h4 className="text-lg font-black text-slate-800 font-display text-amber-500">
                      ★ {driver.earnings?.rating?.toFixed(1) || "5.0"}
                    </h4>
                  </div>
                </div>

                {/* Additional metrics */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Performance Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                    <div className="flex justify-between p-3 border border-slate-100 rounded-lg">
                      <span>Acceptance Rate</span>
                      <span className="text-slate-800">{driver.earnings?.acceptanceRate || 100}%</span>
                    </div>
                    <div className="flex justify-between p-3 border border-slate-100 rounded-lg">
                      <span>Operational Status</span>
                      <span className="text-emerald-500">{driver.isAvailable ? "Online" : "Offline"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Compliance Documents
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                  <div className="p-4 border border-slate-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-lg">
                        <FileText size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span>Driver License</span>
                        <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Approved</span>
                      </div>
                    </div>
                    {driver.documents?.license ? (
                      <a
                        href={driver.documents.license}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800"
                      >
                        Preview
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">Not Uploaded</span>
                    )}
                  </div>

                  <div className="p-4 border border-slate-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-lg">
                        <FileText size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span>RC Book (Registration Certificate)</span>
                        <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Approved</span>
                      </div>
                    </div>
                    {driver.vehicleId?.documents?.rc || driver.documents?.rc ? (
                      <a
                        href={driver.vehicleId?.documents?.rc || driver.documents?.rc}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800"
                      >
                        Preview
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">Not Uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "rides" && (
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                  Trips Log
                </h4>
                {rides.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-bold">
                    No rides recorded for this driver.
                  </div>
                ) : (
                  <div className="overflow-x-auto text-xs font-semibold text-slate-600">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase tracking-widest text-[9px] font-black">
                          <th className="p-3">Ride ID</th>
                          <th className="p-3">Passenger</th>
                          <th className="p-3">Route Details</th>
                          <th className="p-3">Fare Amount</th>
                          <th className="p-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rides.map((ride) => (
                          <tr key={ride._id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="p-3 text-[10px] font-bold text-slate-400">{ride._id}</td>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
