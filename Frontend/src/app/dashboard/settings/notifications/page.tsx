"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ArrowLeft } from 'lucide-react';

export default function NotificationsSettingsPage() {
  const router = useRouter();

  return (
    <div className="flex-1 p-6 sm:p-10 overflow-y-auto bg-background space-y-8 font-inter">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Back Navigation */}
        <button
          onClick={() => router.push('/dashboard/settings')}
          className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-primary transition-colors touch-target"
        >
          <ArrowLeft size={16} /> Back to Settings
        </button>

        {/* Title Block */}
        <div>
          <h2 className="text-2xl font-black text-primary font-manrope flex items-center gap-2">
            <Bell size={24} className="text-accent" />
            Notifications
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm font-semibold mt-1">
            Configure how you receive ride updates, alerts, and billing receipts.
          </p>
        </div>

        {/* Notification Status Alert */}
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl space-y-3">
          <h3 className="text-sm font-black text-amber-900 font-manrope">Push Notifications</h3>
          <p className="text-xs text-amber-800 leading-relaxed font-semibold">
            Push Notifications • Coming Soon (Firebase integration pending.)
          </p>
          <p className="text-[11px] text-amber-700 font-medium">
            Firebase Push Notification service is currently being configured by our backend systems. Real-time browser notifications will be enabled automatically in a future application release.
          </p>
        </div>

        {/* Disabled Options for Preview */}
        <div className="bg-surface rounded-3xl border border-border p-6 space-y-6 opacity-60 pointer-events-none select-none">
          <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary font-manrope">Alert Channels</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-text-primary">Email Receipts</p>
              <p className="text-xs text-text-secondary">Send transaction receipts after each trip</p>
            </div>
            <input type="checkbox" defaultChecked disabled className="w-4 h-4 rounded border-border text-primary" />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="font-bold text-sm text-text-primary">SMS Ride Updates</p>
              <p className="text-xs text-text-secondary">Send driver dispatch alerts via text message</p>
            </div>
            <input type="checkbox" defaultChecked disabled className="w-4 h-4 rounded border-border text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}
