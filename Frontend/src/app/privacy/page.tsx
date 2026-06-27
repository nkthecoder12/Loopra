"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-[32px] p-8 sm:p-12 shadow-xl border border-gray-100 space-y-8">
        
        {/* Top Header */}
        <div className="flex justify-between items-center border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-primary tracking-tight">Privacy Policy</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Effective Date: June 27, 2026 • Loopra Coimbatore Operations</p>
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
              <Lock size={18} className="text-[#4647AE]" /> 1. Information We Collect
            </h2>
            <p>
              When you use Loopra mobility platform in Coimbatore, we collect personal information necessary to provide seamlessly dispatched rides. This includes your full name, email address, phone number, and location coordinates during active trip requests.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <Eye size={18} className="text-[#4647AE]" /> 2. How We Use Location Data
            </h2>
            <p>
              Loopra collects real-time location data from riders and partner drivers solely for matching rides, optimizing routes within Coimbatore, calculating accurate fare estimates, and ensuring trip safety. Location tracking only occurs while the application is active or during ongoing ride dispatches.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <FileText size={18} className="text-[#4647AE]" /> 3. Data Protection & Security
            </h2>
            <p>
              Your personal credentials and ride logs are protected using enterprise-grade SSL/TLS encryption and stored securely. We do not sell or share your personal data with unauthorized third parties.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t">
            <h2 className="text-base font-bold text-primary">Contact Privacy Officer</h2>
            <p className="text-xs text-gray-500">
              For queries regarding your personal data or privacy rights, reach out to our team at{" "}
              <a href="mailto:privacy@loopra.co.in" className="text-primary font-bold hover:underline">privacy@loopra.co.in</a>.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
}
