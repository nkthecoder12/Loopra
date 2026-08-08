"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useNotificationStore } from "@/stores/notificationStore";
import { Loader2, History, Database, User } from "lucide-react";

interface AuditLog {
  _id: string;
  operatorId?: {
    name: string;
    email: string;
  } | null;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string | null;
  timestamp: string;
}

export default function ActivityPage() {
  const { addToast } = useNotificationStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await api.get("/fleet/activity");
        if (response.data.success) {
          setLogs(response.data.logs);
        }
      } catch (err) {
        addToast("error", "Failed to retrieve activity audit trail");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
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
          Audit Trail
        </h1>
        <p className="text-xs font-semibold text-slate-400 mt-2">
          Chronological record of all fleet configuration adjustments and dispatch modifications.
        </p>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200/50 rounded-2xl overflow-hidden shadow-soft">
        {logs.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs font-bold">
            No logged activities registered.
          </div>
        ) : (
          <div className="overflow-x-auto text-xs font-semibold text-slate-600">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-widest text-[9px] font-black">
                  <th className="p-4 pl-6">Timestamp</th>
                  <th className="p-4">Action Type</th>
                  <th className="p-4">Target Entity</th>
                  <th className="p-4">operator</th>
                  <th className="p-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold">
                      <span className="text-indigo-600 uppercase tracking-wider">{log.action}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Database size={13} className="text-slate-400" />
                        <span>{log.targetType} ({log.targetId.substring(18)})</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-400" />
                        <span>{log.operatorId?.name || "System"}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 font-medium">
                      {log.reason || "—"}
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
