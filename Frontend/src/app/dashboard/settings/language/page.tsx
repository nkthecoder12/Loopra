"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, ArrowLeft } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function LanguageSettingsPage() {
  const router = useRouter();
  const { addNotification } = useNotificationStore();

  const [language, setLanguage] = useState('en');

  const handleSelectLanguage = (lang: string) => {
    setLanguage(lang);
    addNotification('success', `Language changed to ${lang === 'en' ? 'English' : lang === 'ta' ? 'Tamil' : 'Hindi'}`);
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
            <Globe size={24} className="text-accent" />
            Language & Region
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm font-semibold mt-1">
            Configure default interface language and operating region settings.
          </p>
        </div>

        {/* Selection Card */}
        <div className="bg-surface rounded-3xl border border-border p-6 space-y-6 shadow-soft">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary font-manrope mb-3">Interface Language</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'en', label: 'English' },
                { id: 'ta', label: 'தமிழ் (Tamil)' },
                { id: 'hi', label: 'हिन्दी (Hindi)' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.id)}
                  className={`py-2.5 px-4 rounded-xl border font-bold text-xs transition-all ${
                    language === lang.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border text-text-secondary hover:bg-slate-50'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary font-manrope">Operating Region</h3>
            <div className="p-4 bg-slate-50 border border-border rounded-2xl flex justify-between items-center text-xs">
              <div>
                <p className="font-extrabold text-text-primary">Coimbatore, IN</p>
                <p className="text-text-secondary font-medium mt-0.5">Active launch service region</p>
              </div>
              <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
