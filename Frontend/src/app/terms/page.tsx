"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, FileCheck, Scale, AlertCircle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-[32px] p-8 sm:p-12 shadow-xl border border-gray-100 space-y-8">
        
        {/* Top Header */}
        <div className="flex justify-between items-center border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <Scale size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-primary tracking-tight">Terms of Service</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Updated: June 27, 2026 • Coimbatore Service Region</p>
            </div>
          </div>
          <Link href="/login" className="flex items-center gap-2 text-xs font-bold text-primary bg-surface px-4 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>

        {/* Content Body */}
        <div className="space-y-6 text-sm text-gray-600 leading-relaxed font-medium">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <FileCheck size={18} className="text-[#4647AE]" /> 1. Acceptance of Terms
            </h2>
            <p>
              By downloading, accessing, or booking rides through the Loopra mobility platform in Coimbatore, you agree to be bound by these Terms of Service. If you do not agree, you may not access our dispatch services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <AlertCircle size={18} className="text-[#4647AE]" /> 2. Service Scope & Bounds
            </h2>
            <p>
              Loopra operates exclusively within designated Coimbatore city boundaries. Ride requests with pickup or drop locations outside the predefined Coimbatore service area will be rejected automatically by our dispatch engine.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Scale size={18} className="text-[#4647AE]" /> 3. Rider Code of Conduct & Payments
            </h2>
            <p>
              Riders agree to provide accurate destination details, treat partner drivers with respect, and fulfill all automated payment obligations immediately upon trip completion.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}
