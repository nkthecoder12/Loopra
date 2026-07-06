"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, ArrowLeft, Loader, Shield, Sparkles } from "lucide-react";
import { notificationService, NotificationPreferences, ChannelPreference } from "@/services/notification.service";
import { useNotificationStore } from "@/store/useNotificationStore";

const categories = [
  { key: "RIDE", label: "Ride Alerts", desc: "Driver assignment, arrival, and dispatch updates" },
  { key: "PAYMENT", label: "Billing & Payments", desc: "Receipts, payment failures, and refund alerts" },
  { key: "DRIVER", label: "Driver Partner Program", desc: "Onboarding reviews, license alerts, and compliance updates" },
  { key: "SECURITY", label: "Account Security", desc: "New login alerts, password changes, and 2FA" },
  { key: "WALLET", label: "Wallet & Credits", desc: "Balance credits, cashback alerts, and promotions" },
  { key: "EMERGENCY", label: "SOS & Emergency Alerts", desc: "High-priority trip safety and security alerts" },
  { key: "SYSTEM", label: "System Announcements", desc: "App maintenance windows and regional notifications" },
  { key: "PROMOTION", label: "Offers & Coupons", desc: "Discount codes, regional offers, and newsletters" },
  { key: "REFERRAL", label: "Referrals & Gifts", desc: "Rewards for referring friends to the fleet" },
];

export default function NotificationsSettingsPage() {
  const router = useRouter();
  const { addNotification } = useNotificationStore();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Load preferences
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const data = await notificationService.getPreferences();
        setPreferences(data);
      } catch (err) {
        console.error("Failed to load preferences:", err);
        addNotification("error", "Failed to retrieve notification settings");
      } finally {
        setLoading(false);
      }
    };
    fetchPrefs();
  }, [addNotification]);

  type CategoryKey = keyof Omit<NotificationPreferences, "userId" | "createdAt" | "updatedAt">;

  const handleToggle = async (catKey: CategoryKey, channel: keyof ChannelPreference) => {
    if (!preferences) return;

    const currentVal = preferences[catKey]?.[channel] ?? true;
    const newVal = !currentVal;

    // Create payload
    const payload = {
      [catKey]: {
        [channel]: newVal,
      },
    };

    setSavingKey(`${catKey}_${channel}`);

    try {
      // Optimistic update
      setPreferences((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          [catKey]: {
            ...prev[catKey],
            [channel]: newVal,
          },
        };
      });

      await notificationService.updatePreferences(payload);
    } catch {
      // Revert in case of failure
      addNotification("error", "Failed to update preference settings");
      setPreferences((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          [catKey]: {
            ...prev[catKey],
            [channel]: currentVal,
          },
        };
      });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="flex-1 p-6 sm:p-10 overflow-y-auto bg-background space-y-8 font-inter">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Navigation */}
        <button
          onClick={() => router.push("/dashboard/settings")}
          className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-primary transition-colors touch-target"
        >
          <ArrowLeft size={16} /> Back to Settings
        </button>

        {/* Title Block */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-black text-primary font-manrope flex items-center gap-2">
              <Bell size={24} className="text-accent" />
              Notification Settings
            </h2>
            <p className="text-text-secondary text-xs sm:text-sm font-semibold mt-1">
              Configure category preferences and alerts channels for your Loopra account.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4 bg-surface rounded-3xl border border-border">
            <Loader className="animate-spin text-accent" size={32} />
            <span className="text-xs text-text-secondary font-bold">
              Fetching notification preferences...
            </span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Preferences grid table */}
            <div className="bg-surface rounded-3xl border border-border overflow-hidden shadow-soft">
              <div className="p-6 border-b border-border bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-primary text-sm font-manrope">Category Settings</h3>
                  <p className="text-xs text-text-secondary">Enable or disable delivery routes by alert types.</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider font-manrope">
                  <Sparkles size={10} className="text-accent" /> Enterprise Routing
                </div>
              </div>

              {/* Table Column headers (Desktop) */}
              <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-border text-[10px] font-black uppercase tracking-widest text-text-secondary bg-slate-50">
                <div className="col-span-6">Alert Category</div>
                <div className="col-span-1.5 text-center">In-App</div>
                <div className="col-span-1.5 text-center">Push</div>
                <div className="col-span-1.5 text-center">Email</div>
                <div className="col-span-1.5 text-center">SMS</div>
              </div>

              {/* Preferences rows */}
              <div className="divide-y divide-border">
                {categories.map((cat) => {
                  const pref = preferences[cat.key] || {
                    inApp: true,
                    push: true,
                    email: true,
                    sms: true,
                  };

                  return (
                    <div
                      key={cat.key}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-slate-50/30 transition-colors"
                    >
                      <div className="col-span-1 sm:col-span-6 space-y-0.5">
                        <p className="font-bold text-sm text-text-primary font-manrope">
                          {cat.label}
                        </p>
                        <p className="text-xs text-text-secondary pr-4 font-medium leading-relaxed">
                          {cat.desc}
                        </p>
                      </div>

                      {/* Toggles */}
                      <div className="col-span-1 sm:col-span-6 grid grid-cols-4 sm:grid-cols-4 gap-2 pt-2 sm:pt-0 text-center items-center">
                        {/* In-App */}
                        <div className="flex flex-col sm:block items-center gap-1">
                          <span className="text-[9px] sm:hidden font-black text-text-secondary uppercase">
                            In-App
                          </span>
                          <input
                            type="checkbox"
                            checked={pref.inApp}
                            disabled={savingKey === `${cat.key}_inApp`}
                            onChange={() => handleToggle(cat.key, "inApp")}
                            className="w-4 h-4 rounded border-border text-primary cursor-pointer focus:ring-accent"
                          />
                        </div>

                        {/* Push (Firebase Pending visual status) */}
                        <div className="flex flex-col sm:block items-center gap-1">
                          <span className="text-[9px] sm:hidden font-black text-text-secondary uppercase">
                            Push
                          </span>
                          <input
                            type="checkbox"
                            checked={pref.push}
                            disabled={savingKey === `${cat.key}_push`}
                            onChange={() => handleToggle(cat.key, "push")}
                            className="w-4 h-4 rounded border-border text-primary cursor-pointer focus:ring-accent"
                          />
                        </div>

                        {/* Email */}
                        <div className="flex flex-col sm:block items-center gap-1">
                          <span className="text-[9px] sm:hidden font-black text-text-secondary uppercase">
                            Email
                          </span>
                          <input
                            type="checkbox"
                            checked={pref.email}
                            disabled={savingKey === `${cat.key}_email`}
                            onChange={() => handleToggle(cat.key, "email")}
                            className="w-4 h-4 rounded border-border text-primary cursor-pointer focus:ring-accent"
                          />
                        </div>

                        {/* SMS */}
                        <div className="flex flex-col sm:block items-center gap-1">
                          <span className="text-[9px] sm:hidden font-black text-text-secondary uppercase">
                            SMS
                          </span>
                          <input
                            type="checkbox"
                            checked={pref.sms}
                            disabled={savingKey === `${cat.key}_sms`}
                            onChange={() => handleToggle(cat.key, "sms")}
                            className="w-4 h-4 rounded border-border text-primary cursor-pointer focus:ring-accent"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notification Channel Disclaimer Warning Banner */}
            <div className="p-5 bg-amber-50 border-2 border-amber-200 rounded-3xl flex gap-3 text-amber-900">
              <Shield className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider font-manrope text-amber-950">
                  Channel Integration Notice
                </h4>
                <p className="text-xs leading-relaxed font-semibold text-amber-800">
                  Channel settings for Push Alerts, Email receipts, and SMS updates are persisted to the database. These will automatically route alerts through Firebase and Twilio upon activation of the secondary phase release.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
