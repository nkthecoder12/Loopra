"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sliders, ArrowLeft } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function RidePreferencesSettingsPage() {
  const router = useRouter();
  const { addNotification } = useNotificationStore();

  const [quietMode, setQuietMode] = useState(false);
  const [temperature, setTemperature] = useState('neutral');
  const [vehiclePref, setVehiclePref] = useState('economy');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // TODO: Integrate actual settings update API when backend supports preference dispatches
      // Example request structure:
      // await userService.updatePreferences({ quietMode, temperature, vehiclePref });
      
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate api network delay
      addNotification('success', 'Preferences saved successfully! (Backend integration pending.)');
    } catch {
      addNotification('error', 'Failed to save preferences.');
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
            <Sliders size={24} className="text-accent" />
            Ride Preferences
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm font-semibold mt-1">
            Customize your in-cabin experience and auto-selection settings.
          </p>
        </div>

        {/* Preferences Form */}
        <form onSubmit={handleSave} className="bg-surface rounded-3xl border border-border p-6 space-y-6 shadow-soft">
          {/* Quiet Mode */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-text-primary">Quiet Mode</p>
              <p className="text-xs text-text-secondary">Request the driver to minimize conversations</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={quietMode}
                onChange={(e) => setQuietMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Temperature */}
          <div className="space-y-2 border-t border-border pt-4">
            <p className="font-bold text-sm text-text-primary">Cabin Temperature</p>
            <p className="text-xs text-text-secondary mb-3">Preferred climate control choice for car rides</p>
            <div className="grid grid-cols-3 gap-2">
              {['cool', 'neutral', 'warm'].map((temp) => (
                <button
                  key={temp}
                  type="button"
                  onClick={() => setTemperature(temp)}
                  className={`py-2 px-4 rounded-xl border font-bold text-xs capitalize transition-all ${
                    temperature === temp
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-text-secondary hover:bg-slate-55'
                  }`}
                >
                  {temp}
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Category */}
          <div className="space-y-2 border-t border-border pt-4">
            <p className="font-bold text-sm text-text-primary">Preferred Category</p>
            <p className="text-xs text-text-secondary mb-3">Preferred fleet type to display by default</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'economy', label: 'Economy / Auto' },
                { id: 'sedan', label: 'Sedan (Dzire/Etios)' },
                { id: 'suv', label: 'Premium SUV' },
              ].map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setVehiclePref(category.id)}
                  className={`py-2 px-4 rounded-xl border font-bold text-xs transition-all ${
                    vehiclePref === category.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-text-secondary hover:bg-slate-55'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
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
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
