"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useNotificationStore } from "@/stores/notificationStore";
import { Loader2, ShieldCheck, ShieldAlert, ShieldX, Eye } from "lucide-react";
import Link from "next/link";

interface ComplianceEntry {
  vehicleId: string;
  registration: string;
  model: string;
  expiredDocs?: string[];
  expiringDocs?: string[];
}

interface ComplianceReport {
  compliant: { vehicleId: string; registration: string; model: string }[];
  expiringSoon: ComplianceEntry[];
  expired: ComplianceEntry[];
}

export default function CompliancePage() {
  const { addToast } = useNotificationStore();
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompliance = async () => {
      try {
        const response = await api.get("/fleet/compliance");
        if (response.data.success) {
          setReport(response.data.compliance);
        }
      } catch (err) {
        addToast("error", "Failed to retrieve compliance records");
      } finally {
        setLoading(false);
      }
    };
    fetchCompliance();
  }, [addToast]);

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
      <div>
        <h1 className="text-2xl font-black text-slate-800 font-display tracking-tight leading-none">
          Compliance Control Center
        </h1>
        <p className="text-xs font-semibold text-slate-400 mt-2">
          Verify vehicle registrations, check document expiration periods, and prevent policy breaches.
        </p>
      </div>

      {/* Compliance panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Expired documents list (CRITICAL block) */}
        <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-soft space-y-4">
          <h3 className="text-xs font-black text-rose-600 font-display uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldX size={18} />
            <span>Expired Certification</span>
          </h3>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {report?.expired.length === 0 ? (
              <p className="text-xs font-bold text-slate-400 py-6 text-center">No expired assets detected</p>
            ) : (
              report?.expired.map((e) => (
                <div key={e.vehicleId} className="p-3.5 border border-rose-100 bg-rose-50/20 rounded-xl flex justify-between items-start gap-4">
                  <div className="space-y-1.5 text-xs font-bold">
                    <span className="text-rose-800 uppercase tracking-wider">{e.registration}</span>
                    <p className="text-[10px] text-slate-400 font-semibold">{e.model}</p>
                    <div className="flex flex-wrap gap-1 mt-1 text-[9px] font-black uppercase">
                      {e.expiredDocs?.map(d => (
                        <span key={d} className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">{d}</span>
                      ))}
                    </div>
                  </div>
                  <Link href={`/vehicles/${e.vehicleId}`} className="p-1.5 hover:bg-rose-100/50 text-rose-500 rounded-lg">
                    <Eye size={14} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-soft space-y-4">
          <h3 className="text-xs font-black text-amber-500 font-display uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldAlert size={18} />
            <span>Expiring Within 30 Days</span>
          </h3>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {report?.expiringSoon.length === 0 ? (
              <p className="text-xs font-bold text-slate-400 py-6 text-center">No upcoming expirations</p>
            ) : (
              report?.expiringSoon.map((e) => (
                <div key={e.vehicleId} className="p-3.5 border border-amber-100 bg-amber-50/20 rounded-xl flex justify-between items-start gap-4">
                  <div className="space-y-1.5 text-xs font-bold">
                    <span className="text-amber-800 uppercase tracking-wider">{e.registration}</span>
                    <p className="text-[10px] text-slate-400 font-semibold">{e.model}</p>
                    <div className="flex flex-wrap gap-1 mt-1 text-[9px] font-black uppercase">
                      {e.expiringDocs?.map(d => (
                        <span key={d} className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{d}</span>
                      ))}
                    </div>
                  </div>
                  <Link href={`/vehicles/${e.vehicleId}`} className="p-1.5 hover:bg-amber-100/50 text-amber-500 rounded-lg">
                    <Eye size={14} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Compliant assets */}
        <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-soft space-y-4">
          <h3 className="text-xs font-black text-emerald-600 font-display uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck size={18} />
            <span>Active & Valid</span>
          </h3>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {report?.compliant.length === 0 ? (
              <p className="text-xs font-bold text-slate-400 py-6 text-center">No compliant assets registered</p>
            ) : (
              report?.compliant.map((e) => (
                <div key={e.vehicleId} className="p-3.5 border border-slate-100 rounded-xl flex justify-between items-center bg-slate-50/20 text-xs font-bold">
                  <div className="flex flex-col min-w-0">
                    <span className="text-slate-800 uppercase tracking-wider">{e.registration}</span>
                    <span className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate">{e.model}</span>
                  </div>
                  <Link href={`/vehicles/${e.vehicleId}`} className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg">
                    <Eye size={14} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
