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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="relative bg-black p-6 sm:p-8 text-white overflow-hidden shrink-0">
          <div className="relative z-10 space-y-1">
            <span className="px-2.5 py-0.5 bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Save 20%</span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Plan your return ride</h2>
            <p className="text-zinc-400 text-xs sm:text-sm font-medium">Locked price. Guaranteed matching. No stress.</p>
          </div>
          <RotateCcw className="absolute right-[-20px] bottom-[-20px] w-40 h-40 text-white/5 rotate-12" />
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors touch-target"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">The Route</h3>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black text-white rounded-xl flex items-center justify-center font-black text-xs shrink-0">A</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">From</p>
                  <p className="font-bold truncate text-xs text-black">{drop || 'Current Destination'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 text-black rounded-xl flex items-center justify-center font-black text-xs shrink-0">B</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">To</p>
                  <p className="font-bold truncate text-xs text-black">{pickup || 'Original Pickup'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduled Time</h3>
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Clock size={16} className="text-black" />
                    <span className="font-bold text-xs text-black">In 2 hours (Automated)</span>
                  </div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 border border-slate-200 bg-slate-50 rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-xs text-black">Return Fare Estimate</p>
                <p className="text-[11px] font-medium text-slate-500">Includes 20% advance booking discount</p>
              </div>
              <p className="text-xl font-black text-black">₹340</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full w-fit">
              <ShieldCheck size={12} />
              PRICE LOCKED & GUARANTEED
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} className="w-full sm:w-1/3 h-12 text-sm font-bold bg-slate-100 text-black hover:bg-slate-200 rounded-xl touch-target">
              Maybe later
            </Button>
            <Button onClick={onConfirm} className="w-full sm:w-2/3 h-12 text-sm font-bold bg-black text-white hover:bg-zinc-800 rounded-xl shadow-lg touch-target">
              Confirm Return (₹170 Advance)
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <CreditCard size={13} />
            Advance payment secured by Razorpay
          </div>
        </div>
      </div>
    </div>
  );
};
