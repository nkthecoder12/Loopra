"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Info, ArrowLeft } from 'lucide-react';

export default function AboutSettingsPage() {
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
            <Info size={24} className="text-accent" />
            About Loopra
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm font-semibold mt-1">
            Application build specifications and version metadata.
          </p>
        </div>

        {/* About App Info */}
        <div className="bg-surface rounded-3xl border border-border p-8 flex flex-col items-center justify-center text-center space-y-6 shadow-soft">
          <div className="w-20 h-20 bg-primary/5 border border-primary/10 rounded-3xl p-3 flex items-center justify-center shadow-inner">
            <Image src="/loopra logo.png" alt="Loopra Logo" width={64} height={64} className="object-contain" priority />
          </div>
          
          <div>
            <h3 className="text-2xl font-black text-primary font-manrope tracking-tight">Loopra Mobility</h3>
            <p className="text-xs text-text-secondary mt-1 font-semibold">City Transit Redefined • Coimbatore</p>
          </div>

          <div className="w-full border-t border-border pt-6 space-y-3.5 text-xs text-text-primary text-left">
            <div className="flex justify-between items-center">
              <span className="font-bold text-text-secondary">App Version</span>
              <span className="font-extrabold font-mono">1.0.0</span>
            </div>
            <div className="flex justify-between items-center border-t border-border/60 pt-3">
              <span className="font-bold text-text-secondary">Build Target</span>
              <span className="font-extrabold font-mono">2026.06.27.01</span>
            </div>
            <div className="flex justify-between items-center border-t border-border/60 pt-3">
              <span className="font-bold text-text-secondary">License</span>
              <span className="font-extrabold text-xs">Proprietary</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-text-secondary text-center font-medium">
          © {new Date().getFullYear()} Loopra Mobility Solutions Private Limited. All rights reserved.
        </p>
      </div>
    </div>
  );
}
