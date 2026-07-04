"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function PrivacySettingsPage() {
  const router = useRouter();
  const { addNotification } = useNotificationStore();

  const [locationSharing, setLocationSharing] = useState(true);
  const [personalization, setPersonalization] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // TODO: Integrate actual settings update API when backend supports privacy dispatches
      // Example: await userService.updatePrivacy({ locationSharing, personalization });
      
      await new Promise((resolve) => setTimeout(resolve, 800));
      addNotification('success', 'Privacy settings updated! (Backend integration pending.)');
    } catch {
      addNotification('error', 'Failed to update privacy settings.');
    } finally {
      setSaving(false);
    }
  };

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
            <Shield size={24} className="text-accent" />
            Privacy Settings
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm font-semibold mt-1">
            Control location sharing, cookies, and data retention policies.
          </p>
        </div>

        {/* Privacy Form */}
        <form onSubmit={handleSave} className="bg-surface rounded-3xl border border-border p-6 space-y-6 shadow-soft">
          {/* Location Sharing */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-text-primary">Share Live Location</p>
              <p className="text-xs text-text-secondary">Allow drivers to pinpoint your exact coordinates for faster pickups</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={locationSharing}
                onChange={(e) => setLocationSharing(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Search Personalization */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="font-bold text-sm text-text-primary">Search Personalization</p>
              <p className="text-xs text-text-secondary">Use past routes and addresses to customize auto-suggestions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={personalization}
                onChange={(e) => setPersonalization(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/settings')}
              className="px-4 py-2 border border-border text-text-secondary hover:bg-slate-50 font-bold text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-secondary transition-all disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Privacy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
