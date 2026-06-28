"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Car,
  RotateCcw,
  TrendingUp,
  Search,
  Filter,
  Download,
  Eye,
  X,
  ShieldCheck,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { adminService } from "@/services/admin.service";
import { useNotificationStore } from "@/store/useNotificationStore";

interface AdminUserRecord {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  isVerified?: boolean;
  createdAt?: string;
}

interface AdminDriverRecord {
  _id: string;
  name?: string;
  phone?: string;
  onboardingStatus?: string;
  isAvailable?: boolean;
  isActive?: boolean;
  userId?: {
    _id?: string;
    name?: string;
    phone?: string;
  };
  vehicle?: {
    type?: string;
    number?: string;
  };
}

interface DriverAppRecord {
  _id: string;
  status: string;
  createdAt: string;
  reviewComments?: string;
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  personalDetails?: {
    fullName?: string;
    phone?: string;
    email?: string;
    city?: string;
    state?: string;
    address?: string;
    emergencyContact?: string;
  };
  licenseDetails?: {
    licenseNumber?: string;
    expiryDate?: string;
    licenseFront?: { url?: string; verificationStatus?: string; reviewNotes?: string };
    licenseBack?: { url?: string; verificationStatus?: string; reviewNotes?: string };
  };
  vehicleDetails?: {
    vehicleType?: string;
    number?: string;
    brand?: string;
    model?: string;
    vehiclePhoto?: { url?: string; verificationStatus?: string; reviewNotes?: string };
  };
  documents?: {
    rcBook?: { url?: string; verificationStatus?: string; reviewNotes?: string };
    insurance?: { url?: string; verificationStatus?: string; reviewNotes?: string };
    pollutionCertificate?: { url?: string; verificationStatus?: string; reviewNotes?: string };
    govtId?: { url?: string; verificationStatus?: string; reviewNotes?: string };
  };
  bankDetails?: {
    accountHolder?: string;
    accountNumber?: string;
    ifsc?: string;
    upiId?: string;
  };
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Driver Applications");
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotificationStore();

  // Data Collections
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [drivers, setDrivers] = useState<AdminDriverRecord[]>([]);
  const [applications, setApplications] = useState<DriverAppRecord[]>([]);
  const [totalApps, setTotalApps] = useState(0);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Review Drawer & Modals State
  const [selectedApp, setSelectedApp] = useState<DriverAppRecord | null>(null);
  const [zoomDoc, setZoomDoc] = useState<{ title: string; url: string } | null>(null);
  const [actionModal, setActionModal] = useState<{
    type: "APPROVE" | "REJECT" | "REQUEST_CHANGES" | "LIFECYCLE";
    targetId: string;
    action?: string;
    title: string;
  } | null>(null);

  const [modalReason, setModalReason] = useState("");
  const [docNotes, setDocNotes] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "Users") {
        const res = await adminService.getUsers(page, 20);
        setUsers(res?.data?.users || res?.users || []);
      } else if (activeTab === "Drivers" || activeTab === "Overview") {
        const res = await adminService.getDrivers(page, 20);
        setDrivers(res?.data?.drivers || res?.drivers || []);
      }

      if (activeTab === "Driver Applications" || activeTab === "Overview") {
        const res = await adminService.getDriverApplications(page, 20, statusFilter, searchQuery);
        setApplications(res?.data?.applications || res?.applications || []);
        setTotalApps(res?.data?.total || 0);
      }
    } catch (error) {
      console.error("Failed to fetch admin data", error);
      addNotification("error", "Failed to load admin records");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, statusFilter, searchQuery, addNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Action Handlers
  const handleVerifyDocument = async (appId: string, docKey: string, status: "APPROVED" | "RE_UPLOAD_REQUIRED") => {
    try {
      const notes = docNotes[docKey] || "";
      await adminService.verifyDocument(appId, docKey, status, notes);
      addNotification("success", `Document ${docKey} marked as ${status}`);
      const updated = await adminService.getDriverApplicationById(appId);
      if (updated?.application) setSelectedApp(updated.application);
      fetchData();
    } catch {
      addNotification("error", "Failed to update document verification status");
    }
  };

  const handleExecuteAction = async () => {
    if (!actionModal) return;
    try {
      if (actionModal.type === "APPROVE") {
        await adminService.approveDriverApplication(actionModal.targetId);
        addNotification("success", "Driver application approved successfully!");
      } else if (actionModal.type === "REJECT") {
        if (!modalReason.trim()) {
          addNotification("error", "Mandatory rejection reason is required.");
          return;
        }
        await adminService.rejectDriverApplication(actionModal.targetId, modalReason);
        addNotification("success", "Driver application rejected.");
      } else if (actionModal.type === "REQUEST_CHANGES") {
        if (!modalReason.trim()) {
          addNotification("error", "Mandatory feedback comments are required.");
          return;
        }
        await adminService.requestChangesDriverApplication(actionModal.targetId, modalReason);
        addNotification("success", "Feedback and change request sent to applicant.");
      } else if (actionModal.type === "LIFECYCLE") {
        await adminService.updateDriverLifecycle(actionModal.targetId, actionModal.action as "SUSPEND" | "REACTIVATE" | "DEACTIVATE" | "SOFT_DELETE", modalReason);
        addNotification("success", `Driver lifecycle updated (${actionModal.action})`);
      }

      setActionModal(null);
      setSelectedApp(null);
      setModalReason("");
      fetchData();
    } catch (error: unknown) {
      const errObj = error as { response?: { data?: { message?: string } } };
      addNotification("error", errObj?.response?.data?.message || "Action failed.");
    }
  };

  const exportApplicationsCSV = () => {
    if (!applications.length) return;
    const headers = ["Application ID", "Applicant Name", "Phone", "Email", "Vehicle Type", "Vehicle Number", "Status", "Submitted At"];
    const rows = applications.map((app) => [
      app._id,
      `"${app.personalDetails?.fullName || ""}"`,
      `"${app.personalDetails?.phone || ""}"`,
      `"${app.personalDetails?.email || ""}"`,
      app.vehicleDetails?.vehicleType || "",
      `"${app.vehicleDetails?.number || ""}"`,
      app.status,
      new Date(app.createdAt).toLocaleDateString(),
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Loopra_Driver_Applications_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sidebarTabs = [
    "Overview",
    "Users",
    "Driver Applications ⭐",
    "Drivers",
    "Active Trips",
    "Completed Trips",
    "Payments",
    "Reports",
    "Settings",
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-background font-inter overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-full h-16 md:w-64 md:h-full bg-primary text-white p-4 md:p-6 space-y-0 md:space-y-8 shrink-0 flex md:flex-col items-center md:items-start justify-between border-b md:border-b-0 md:border-r border-white/10 z-20 overflow-x-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl p-2 flex items-center justify-center shadow-lg font-manrope font-black text-white">
            L
          </div>
          <span className="text-xl font-black tracking-tight text-white font-manrope hidden sm:inline">Loopra Admin</span>
        </div>

        <div className="flex md:flex-col gap-1.5 w-full">
          {sidebarTabs.map((tab) => {
            const cleanTab = tab.replace(" ⭐", "");
            const isActive = activeTab.includes(cleanTab);
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(cleanTab); setPage(1); }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all w-full text-left whitespace-nowrap font-manrope ${isActive ? "bg-white/15 text-white shadow-sm" : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
              >
                <span>{tab}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-border pb-6">
          <div>
            <h1 className="text-3xl font-black text-primary tracking-tight font-manrope">{activeTab}</h1>
            <p className="text-text-secondary font-medium text-xs sm:text-sm mt-0.5">Enterprise Mobility Dispatch &amp; Verification Portal</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchData} loading={loading} className="h-11 text-xs font-bold rounded-xl">
              <RotateCcw size={16} className="mr-2" /> Refresh Data
            </Button>
            {activeTab === "Driver Applications" && (
              <Button variant="primary" onClick={exportApplicationsCSV} className="h-11 text-xs font-bold rounded-xl shadow-sm">
                <Download size={16} className="mr-2" /> Export Applications CSV
              </Button>
            )}
          </div>
        </header>

        {/* OVERVIEW TAB */}
        {activeTab === "Overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { label: "Registered Users", value: users.length || "--", change: "+12%", icon: <Users size={20} /> },
                { label: "Active Fleet Drivers", value: drivers.filter(d => d.onboardingStatus === "APPROVED").length || drivers.length || "--", change: "+5%", icon: <Car size={20} /> },
                { label: "Pending Driver Applications", value: applications.filter(a => a.status === "SUBMITTED" || a.status === "PENDING").length || totalApps || "0", change: "Action Req", icon: <Clock size={20} /> },
                { label: "System Core Status", value: "Operational", change: "24/7 Live", icon: <TrendingUp size={20} /> },
              ].map((stat, i) => (
                <div key={i} className="bg-surface p-6 rounded-3xl shadow-soft border border-border flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl">{stat.icon}</div>
                    <span className="text-xs font-black text-success bg-emerald-50 px-2.5 py-1 rounded-full">{stat.change}</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-xs font-bold text-text-secondary uppercase tracking-wider font-manrope">{stat.label}</span>
                    <h3 className="text-2xl font-black text-primary tracking-tight font-manrope mt-1">{stat.value}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DRIVER APPLICATIONS TAB ⭐ */}
        {activeTab.includes("Driver Applications") && (
          <div className="space-y-6">
            <div className="bg-surface p-4 sm:p-6 rounded-3xl border border-border shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-3.5 text-text-secondary" size={18} />
                <input
                  type="text"
                  placeholder="Search applicant name, phone, vehicle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs font-semibold text-text-primary outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
                <Filter size={16} className="text-text-secondary shrink-0" />
                {["ALL", "SUBMITTED", "PENDING", "APPROVED", "REJECTED", "REQUEST_CHANGES"].map((st) => (
                  <button
                    key={st}
                    onClick={() => { setStatusFilter(st); setPage(1); }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap font-manrope ${statusFilter === st ? "bg-primary text-white shadow-sm" : "bg-background text-text-secondary hover:bg-slate-100"
                      }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface rounded-3xl border border-border shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-text-secondary font-manrope border-b border-border">
                      <th className="p-4 font-bold">Applicant</th>
                      <th className="p-4 font-bold">Contact Phone</th>
                      <th className="p-4 font-bold">Vehicle Details</th>
                      <th className="p-4 font-bold">Applied Date</th>
                      <th className="p-4 font-bold">Verification Status</th>
                      <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-inter">
                    {applications.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-text-secondary font-medium">
                          No driver applications found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      applications.map((app) => (
                        <tr key={app._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-bold text-text-primary">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-manrope shrink-0">
                                {app.personalDetails?.fullName?.substring(0, 2).toUpperCase() || "DA"}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-primary font-manrope">{app.personalDetails?.fullName || "Applicant"}</p>
                                <p className="text-[11px] text-text-secondary font-normal">{app.personalDetails?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-text-primary">{app.personalDetails?.phone || app.userId?.phone || "--"}</td>
                          <td className="p-4 font-semibold text-text-primary">
                            <span className="uppercase font-bold text-accent mr-1">[{app.vehicleDetails?.vehicleType || "Car"}]</span>
                            {app.vehicleDetails?.number || "--"}
                          </td>
                          <td className="p-4 text-text-secondary">{new Date(app.createdAt).toLocaleDateString()}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-manrope ${app.status === "APPROVED" ? "bg-emerald-100 text-success" : app.status === "REJECTED" ? "bg-red-100 text-danger" : app.status === "REQUEST_CHANGES" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-accent"
                              }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="outline" onClick={() => setSelectedApp(app)} className="h-9 px-3.5 text-xs font-bold rounded-xl">
                              <Eye size={14} className="mr-1.5" /> Review Application
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DRIVERS TAB (APPROVED FLEET) */}
        {activeTab === "Drivers" && (
          <div className="bg-surface rounded-3xl border border-border shadow-soft overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-primary text-lg font-manrope">Verified Fleet Drivers</h3>
              <span className="text-xs font-bold bg-emerald-50 text-success px-3 py-1 rounded-full">Total Active: {drivers.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 text-text-secondary font-manrope border-b border-border">
                    <th className="p-4 font-bold">Driver Name</th>
                    <th className="p-4 font-bold">Phone</th>
                    <th className="p-4 font-bold">Vehicle</th>
                    <th className="p-4 font-bold">Availability</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-inter">
                  {drivers.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-text-primary flex items-center gap-2">
                        <ShieldCheck size={16} className="text-success shrink-0" />
                        <span>{d.name || d.userId?.name || "Driver"}</span>
                      </td>
                      <td className="p-4 font-semibold text-text-primary">{d.phone}</td>
                      <td className="p-4 font-semibold text-text-primary uppercase">[{d.vehicle?.type}] {d.vehicle?.number}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${d.isAvailable ? "bg-emerald-100 text-success" : "bg-slate-100 text-text-secondary"}`}>
                          <span className={`w-2 h-2 rounded-full ${d.isAvailable ? "bg-success animate-pulse" : "bg-slate-400"}`} />
                          {d.isAvailable ? "Online / Available" : "Offline"}
                        </span>
                      </td>
                      <td className="p-4 font-bold uppercase text-xs">{d.onboardingStatus}</td>
                      <td className="p-4 text-right space-x-2">
                        {d.onboardingStatus === "SUSPENDED" ? (
                          <Button variant="outline" onClick={() => setActionModal({ type: "LIFECYCLE", targetId: d._id, action: "REACTIVATE", title: `Reactivate Driver ${d.name}` })} className="h-8 px-2.5 text-[11px] font-bold rounded-lg">
                            Reactivate
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={() => setActionModal({ type: "LIFECYCLE", targetId: d._id, action: "SUSPEND", title: `Suspend Driver ${d.name}` })} className="h-8 px-2.5 text-[11px] font-bold rounded-lg text-amber-600">
                            Suspend
                          </Button>
                        )}
                        <Button variant="danger" onClick={() => setActionModal({ type: "LIFECYCLE", targetId: d._id, action: "SOFT_DELETE", title: `Delete Driver ${d.name}` })} className="h-8 px-2.5 text-[11px] font-bold rounded-lg">
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* APPLICATION REVIEW DRAWER */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-primary/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200 font-inter">
          <div className="w-full max-w-3xl bg-surface h-full shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 bg-primary text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black font-manrope">{selectedApp.personalDetails?.fullName || "Driver Application"}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/20 text-white font-manrope">
                    {selectedApp.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">Applied on {new Date(selectedApp.createdAt).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary font-manrope border-b border-border pb-2">Personal &amp; Contact Details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div><span className="text-text-secondary block font-medium">Full Name</span><strong className="text-text-primary text-sm">{selectedApp.personalDetails?.fullName}</strong></div>
                  <div><span className="text-text-secondary block font-medium">Phone Number</span><strong className="text-text-primary text-sm">{selectedApp.personalDetails?.phone}</strong></div>
                  <div><span className="text-text-secondary block font-medium">Email Address</span><strong className="text-text-primary text-sm">{selectedApp.personalDetails?.email}</strong></div>
                  <div><span className="text-text-secondary block font-medium">City / State</span><strong className="text-text-primary">{selectedApp.personalDetails?.city}, {selectedApp.personalDetails?.state}</strong></div>
                  <div><span className="text-text-secondary block font-medium">Emergency Contact</span><strong className="text-text-primary">{selectedApp.personalDetails?.emergencyContact || "--"}</strong></div>
                  <div><span className="text-text-secondary block font-medium">Address</span><strong className="text-text-primary">{selectedApp.personalDetails?.address}</strong></div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary font-manrope border-b border-border pb-2">Licence &amp; Vehicle Info</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div><span className="text-text-secondary block font-medium">Licence Number</span><strong className="text-text-primary text-sm">{selectedApp.licenseDetails?.licenseNumber}</strong></div>
                  <div><span className="text-text-secondary block font-medium">Licence Expiry</span><strong className="text-text-primary text-sm">{selectedApp.licenseDetails?.expiryDate?.substring(0, 10)}</strong></div>
                  <div><span className="text-text-secondary block font-medium">Vehicle Category</span><strong className="text-text-primary text-sm uppercase">{selectedApp.vehicleDetails?.vehicleType}</strong></div>
                  <div><span className="text-text-secondary block font-medium">Vehicle Number</span><strong className="text-text-primary text-sm">{selectedApp.vehicleDetails?.number}</strong></div>
                  <div><span className="text-text-secondary block font-medium">Brand &amp; Model</span><strong className="text-text-primary">{selectedApp.vehicleDetails?.brand} {selectedApp.vehicleDetails?.model}</strong></div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary font-manrope border-b border-border pb-2">Uploaded Documents &amp; Granular Verification</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: "licenseFront", title: "Licence Front Side", obj: selectedApp.licenseDetails?.licenseFront },
                    { key: "licenseBack", title: "Licence Back Side", obj: selectedApp.licenseDetails?.licenseBack },
                    { key: "rcBook", title: "Vehicle RC Book", obj: selectedApp.documents?.rcBook },
                    { key: "insurance", title: "Insurance Certificate", obj: selectedApp.documents?.insurance },
                    { key: "pollutionCertificate", title: "Pollution Certificate", obj: selectedApp.documents?.pollutionCertificate },
                    { key: "govtId", title: "Government ID", obj: selectedApp.documents?.govtId },
                  ].map((doc) => {
                    if (!doc.obj || !doc.obj.url) return null;
                    const docUrl = doc.obj.url;
                    const isApproved = doc.obj.verificationStatus === "APPROVED";
                    const isReUpload = doc.obj.verificationStatus === "RE_UPLOAD_REQUIRED";
                    return (
                      <div key={doc.key} className="p-4 bg-background rounded-2xl border border-border space-y-3 text-xs">
                        <div className="flex justify-between items-center">
                          <strong className="font-bold text-text-primary font-manrope">{doc.title}</strong>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${isApproved ? "bg-emerald-100 text-success" : isReUpload ? "bg-red-100 text-danger" : "bg-amber-100 text-amber-800"}`}>
                            {doc.obj.verificationStatus || "PENDING"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setZoomDoc({ title: doc.title, url: docUrl })} className="w-16 h-16 bg-surface rounded-xl border border-border p-1 hover:opacity-80 transition-opacity shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={docUrl} alt={doc.title} className="w-full h-full object-cover rounded-lg" />
                          </button>
                          <div className="space-y-1">
                            <a href={docUrl} target="_blank" rel="noopener noreferrer" className="text-accent font-bold hover:underline block text-[11px]">Download Full File</a>
                            <input
                              type="text"
                              placeholder="Add review feedback note..."
                              value={docNotes[doc.key] || ""}
                              onChange={(e) => setDocNotes({ ...docNotes, [doc.key]: e.target.value })}
                              className="w-full p-1.5 border border-border rounded-lg text-[11px] bg-surface outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => handleVerifyDocument(selectedApp._id, doc.key, "APPROVED")} className="flex-1 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-success font-bold rounded-lg transition-colors text-[10px] uppercase">Approve Doc</button>
                          <button onClick={() => handleVerifyDocument(selectedApp._id, doc.key, "RE_UPLOAD_REQUIRED")} className="flex-1 py-1.5 bg-red-100 hover:bg-red-200 text-danger font-bold rounded-lg transition-colors text-[10px] uppercase">Flag Re-upload</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary font-manrope border-b border-border pb-2">Bank Account &amp; Payout Details</h3>
                <div className="grid grid-cols-2 gap-4 text-xs p-4 bg-background rounded-2xl border border-border">
                  <div><span className="text-text-secondary block font-medium">Account Holder</span><strong className="text-text-primary">{selectedApp.bankDetails?.accountHolder || "--"}</strong></div>
                  <div><span className="text-text-secondary block font-medium">Account Number</span><strong className="text-text-primary">{selectedApp.bankDetails?.accountNumber || "--"}</strong></div>
                  <div><span className="text-text-secondary block font-medium">IFSC Code</span><strong className="text-text-primary">{selectedApp.bankDetails?.ifsc || "--"}</strong></div>
                  <div><span className="text-text-secondary block font-medium">UPI ID</span><strong className="text-text-primary">{selectedApp.bankDetails?.upiId || "--"}</strong></div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-border shrink-0 flex items-center justify-between gap-4">
              <Button variant="outline" onClick={() => setActionModal({ type: "REQUEST_CHANGES", targetId: selectedApp._id, title: "Request Changes / Document Re-upload" })} className="h-12 text-xs font-bold rounded-xl">
                Request Document Changes
              </Button>
              <div className="flex gap-3">
                <Button variant="danger" onClick={() => setActionModal({ type: "REJECT", targetId: selectedApp._id, title: "Reject Application" })} className="h-12 px-6 text-xs font-bold rounded-xl">
                  Reject Application
                </Button>
                <Button variant="primary" onClick={() => setActionModal({ type: "APPROVE", targetId: selectedApp._id, title: "Approve Driver Partnership" })} className="h-12 px-8 text-xs font-bold rounded-xl shadow-md">
                  Approve Driver
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENT ZOOM MODAL */}
      {zoomDoc && (
        <div className="fixed inset-0 z-50 bg-primary/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface p-6 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-primary text-base font-manrope">{zoomDoc.title}</h3>
              <button onClick={() => setZoomDoc(null)} className="p-1.5 rounded-full hover:bg-slate-100"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={zoomDoc.url} alt={zoomDoc.title} className="max-h-[70vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* ACTION MODAL */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-primary/60 backdrop-blur-sm flex items-center justify-center p-4 font-inter">
          <div className="bg-surface p-6 sm:p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6 border border-border">
            <div className="space-y-2">
              <h3 className="text-xl font-black text-primary font-manrope">{actionModal.title}</h3>
              <p className="text-xs text-text-secondary">Please confirm your administrative action.</p>
            </div>

            {(actionModal.type === "REJECT" || actionModal.type === "REQUEST_CHANGES" || actionModal.action === "SUSPEND") && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-primary">
                  {actionModal.type === "REJECT" ? "Mandatory Rejection Reason *" : actionModal.type === "REQUEST_CHANGES" ? "Mandatory Feedback Comments *" : "Suspension Reason"}
                </label>
                <textarea
                  rows={3}
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="Enter detailed feedback or reason..."
                  className="w-full p-3 border border-border rounded-xl text-xs bg-background outline-none focus:border-accent font-medium"
                  required
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setActionModal(null)} className="h-11 px-5 text-xs font-bold rounded-xl">
                Cancel
              </Button>
              <Button variant={actionModal.type === "APPROVE" ? "primary" : "danger"} onClick={handleExecuteAction} className="h-11 px-6 text-xs font-bold rounded-xl shadow-sm">
                Confirm Action
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
