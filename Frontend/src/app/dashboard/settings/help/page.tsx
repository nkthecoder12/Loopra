"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle, ArrowLeft, ChevronDown, ChevronUp, Phone, Mail } from 'lucide-react';

export default function HelpSettingsPage() {
  const router = useRouter();
  
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How do I book a scheduled return ride?",
      a: "When selecting pickup and drop locations in the Location selection screen, toggle the 'Lock in your return now?' switch. Select your return departure time, and both outbound and discounted return trips will be queued."
    },
    {
      q: "What is the Loopra Coimbatore Service Area?",
      a: "Loopra operates en route corridors within the Coimbatore city limits (Gandhipuram, RS Puram, Peelamedu, CJB Airport, and Avinashi Road). Bookings originating or terminating outside this zone are currently unsupported."
    },
    {
      q: "How are refunds handled for cancellations?",
      a: "If a ride is cancelled before the driver starts the trip, or if no driver is assigned, refunds are automatically initiated via Razorpay back to your original source account within 5-7 business days."
    },
    {
      q: "How can I contact passenger support?",
      a: "You can reach passenger helpline at +91 422 123 4567 or email us directly at support@loopra.co.in."
    }
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
            <HelpCircle size={24} className="text-accent" />
            Help & Support
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm font-semibold mt-1">
            Browse ride booking FAQs or get in touch with Loopra support.
          </p>
        </div>

        {/* Support Options */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="tel:+914221234567"
            className="p-5 bg-surface rounded-2xl border border-border flex flex-col items-center justify-center gap-2 text-center transition-all hover:bg-slate-50 shadow-soft"
          >
            <Phone size={20} className="text-primary animate-pulse" />
            <p className="font-extrabold text-xs text-text-primary">24/7 Helpline</p>
            <p className="text-[10px] text-text-secondary font-mono">+91 422 123 4567</p>
          </a>
          <a
            href="mailto:support@loopra.co.in"
            className="p-5 bg-surface rounded-2xl border border-border flex flex-col items-center justify-center gap-2 text-center transition-all hover:bg-slate-50 shadow-soft"
          >
            <Mail size={20} className="text-primary" />
            <p className="font-extrabold text-xs text-text-primary">Email Support</p>
            <p className="text-[10px] text-text-secondary font-mono">support@loopra.co.in</p>
          </a>
        </div>

        {/* FAQs */}
        <div className="bg-surface rounded-3xl border border-border p-6 space-y-4 shadow-soft">
          <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary font-manrope mb-2">Frequently Asked Questions</h3>

          <div className="divide-y divide-border">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="py-3.5 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm text-text-primary hover:text-primary transition-colors py-1"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs leading-relaxed text-text-secondary font-semibold animate-in slide-in-from-top-1 duration-150">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
