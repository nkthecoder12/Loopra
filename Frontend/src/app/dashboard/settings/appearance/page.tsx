"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Palette, ArrowLeft } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function AppearanceSettingsPage() {
  const router = useRouter();
  const { addNotification } = useNotificationStore();

  const [theme, setTheme] = useState('system');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('loopra_theme') || 'system';
      queueMicrotask(() => setTheme(storedTheme));
    }
  }, []);

  const handleSelectTheme = (newTheme: string) => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('loopra_theme', newTheme);
      
      // Apply class on HTML body for preview effect
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (newTheme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        const matchesDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (matchesDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      addNotification('success', `Theme updated to ${newTheme}!`);
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
            <Palette size={24} className="text-accent" />
            Appearance
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm font-semibold mt-1">
            Customize the look and feel of the Loopra dashboard.
          </p>
        </div>

        {/* Theme Options Card */}
        <div className="bg-surface rounded-3xl border border-border p-6 space-y-4 shadow-soft">
          <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary font-manrope mb-3">Theme Selection</h3>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light' },
              { id: 'dark', label: 'Dark' },
              { id: 'system', label: 'System' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTheme(t.id)}
                className={`py-6 px-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.01] ${
                  theme === t.id
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-text-secondary hover:bg-slate-50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  t.id === 'dark' ? 'bg-[#1c1c1e] text-white' : t.id === 'light' ? 'bg-slate-100 text-black border border-zinc-200' : 'bg-gradient-to-r from-white to-black text-blue-500 border border-zinc-200'
                }`} />
                <span className="text-xs font-bold">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
