"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, ArrowLeft, Plus } from 'lucide-react';

export default function PaymentsSettingsPage() {
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
            <CreditCard size={24} className="text-accent" />
            Payments
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm font-semibold mt-1">
            Manage your saved credit cards, netbanking details, and UPI payments.
          </p>
        </div>

        {/* Payment Methods Section */}
        <div className="bg-surface rounded-3xl border border-border p-6 space-y-6 shadow-soft">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary font-manrope">Saved Methods</h3>
            
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-[10px] font-bold cursor-not-allowed select-none"
            >
              <Plus size={12} /> Add Card • Coming Soon
            </button>
          </div>

          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-border text-slate-400 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="font-extrabold text-sm text-text-primary font-manrope">No payment methods added</p>
              <p className="text-xs text-text-secondary mt-1 max-w-[280px]">
                Ride payments are currently processed on checkout via secure Razorpay UPI, Netbanking, or cards.
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-[10px] text-text-secondary leading-relaxed font-semibold text-center max-w-[400px] mx-auto">
          🔒 Payments are securely managed using industry-standard tokenization. Loopra does not store raw credit card details on its servers.
        </p>
      </div>
    </div>
  );
}
