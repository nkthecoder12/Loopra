"use client";

import React from 'react';
import { RotateCcw, Clock, ShieldCheck, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ReturnRideModalProps {
  onConfirm: () => void;
  onClose: () => void;
  pickup: string;
  drop: string;
}

export const ReturnRideModal = ({ onConfirm, onClose, pickup, drop }: ReturnRideModalProps) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-primary/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-surface rounded-t-[32px] sm:rounded-3xl shadow-premium overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col font-inter">
        <div className="relative bg-primary p-6 sm:p-8 text-white overflow-hidden shrink-0">
          <div className="relative z-10 space-y-1">
            <span className="px-2.5 py-0.5 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-full font-manrope">Save 20%</span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-manrope">Plan your return ride</h2>
            <p className="text-slate-300 text-xs sm:text-sm font-medium">Locked price. Guaranteed matching. No stress.</p>
          </div>
          <RotateCcw className="absolute right-[-20px] bottom-[-20px] w-40 h-40 text-white/10 rotate-12" />
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors touch-target"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-text-secondary font-manrope">The Route</h3>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center font-black text-xs shrink-0 font-manrope">A</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-text-secondary font-bold uppercase">From</p>
                  <p className="font-bold truncate text-xs text-text-primary">{drop || 'Current Destination'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-background text-primary border border-border rounded-xl flex items-center justify-center font-black text-xs shrink-0 font-manrope">B</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-text-secondary font-bold uppercase">To</p>
                  <p className="font-bold truncate text-xs text-text-primary">{pickup || 'Original Pickup'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-text-secondary font-manrope">Scheduled Time</h3>
              <div className="space-y-2">
                <div className="p-3 bg-background border border-border rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Clock size={16} className="text-primary" />
                    <span className="font-bold text-xs text-text-primary">In 2 hours (Automated)</span>
                  </div>
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 border border-border bg-background rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-xs text-text-primary font-manrope">Return Fare Estimate</p>
                <p className="text-[11px] font-medium text-text-secondary">Includes 20% advance booking discount</p>
              </div>
              <p className="text-xl font-black text-primary font-manrope">₹340</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full w-fit">
              <ShieldCheck size={12} className="text-success" />
              PRICE LOCKED &amp; GUARANTEED
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-1/3 h-12 text-sm font-bold rounded-xl touch-target">
              Maybe later
            </Button>
            <Button variant="primary" onClick={onConfirm} className="w-full sm:w-2/3 h-12 text-sm font-bold rounded-xl shadow-md touch-target">
              Confirm Return (₹170 Advance)
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-secondary font-medium">
            <CreditCard size={13} />
            Advance payment secured by Razorpay
          </div>
        </div>
      </div>
    </div>
  );
};
