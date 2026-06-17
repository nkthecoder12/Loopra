"use client";

import React from 'react';
import { RotateCcw, Clock, ArrowRight, ShieldCheck, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ReturnRideModalProps {
  onConfirm: (data: any) => void;
  onClose: () => void;
  pickup: string;
  drop: string;
}

export const ReturnRideModal = ({ onConfirm, onClose, pickup, drop }: ReturnRideModalProps) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-white rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="relative h-48 bg-primary p-10 text-white overflow-hidden">
          <div className="relative z-10 space-y-2">
            <h2 className="text-4xl font-extrabold tracking-tighter">Plan your return ride.</h2>
            <p className="text-surface/70 font-medium">Locked price. Guaranteed matching. No stress.</p>
          </div>
          <RotateCcw className="absolute right-[-20px] bottom-[-20px] w-48 h-48 text-white/5 rotate-12" />
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-10 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">The Route</h3>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center font-black text-primary">A</div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 font-bold uppercase">From</p>
                  <p className="font-bold truncate text-primary">{drop || 'Current Destination'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center font-black text-primary">B</div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 font-bold uppercase">To</p>
                  <p className="font-bold truncate text-primary">{pickup || 'Original Pickup'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Scheduled Time</h3>
              <div className="space-y-3">
                <div className="p-4 bg-surface rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-primary" />
                    <span className="font-bold text-primary">18:30 (Today)</span>
                  </div>
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                </div>
                <button className="text-xs font-bold text-primary underline">Select custom date/time</button>
              </div>
            </div>
          </div>

          <div className="p-6 border-2 border-dashed border-gray-100 rounded-3xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-primary">Return Fare Estimate</p>
                <p className="text-xs text-gray-500">Based on current traffic trends</p>
              </div>
              <p className="text-2xl font-black text-primary">₹340</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit">
              <ShieldCheck size={12} />
              PRICE LOCKED
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="secondary" onClick={onClose} className="flex-1 h-14">
              Maybe later
            </Button>
            <Button onClick={onConfirm} className="flex-[2] h-14 shadow-lg shadow-primary/20">
              Confirm Return (₹170 Advance)
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
            <CreditCard size={14} />
            Advance payment secured by Razorpay
          </div>
        </div>
      </div>
    </div>
  );
};
