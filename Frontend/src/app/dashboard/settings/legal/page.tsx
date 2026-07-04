"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ArrowLeft, ChevronRight } from 'lucide-react';

export default function LegalSettingsPage() {
  const router = useRouter();

  const legalLinks = [
    { title: "Terms of Service", href: "/terms-and-conditions" },
    { title: "Privacy Policy", href: "/privacy-policy" },
    { title: "Cancellation & Refund Policy", href: "/cancellation-refund-policy" }
  ];

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
            <FileText size={24} className="text-accent" />
            Legal & Terms
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm font-semibold mt-1">
            Review Loopra policies, terms of service, and user agreements.
          </p>
        </div>

        {/* Links Card */}
        <div className="bg-surface rounded-3xl border border-border shadow-soft divide-y divide-border overflow-hidden">
          {legalLinks.map((link, idx) => (
            <div
              key={idx}
              onClick={() => router.push(link.href)}
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors group"
            >
              <span className="font-bold text-sm text-text-primary group-hover:text-primary transition-colors font-manrope">{link.title}</span>
              <ChevronRight size={16} className="text-text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-text-secondary leading-relaxed text-center font-semibold max-w-[400px] mx-auto">
          Loopra is a registered trademark of Loopra Mobility Solutions Private Limited. All RTO regulations and driver certifications are registered under Coimbatore RTO regulations.
        </p>
      </div>
    </div>
  );
}
