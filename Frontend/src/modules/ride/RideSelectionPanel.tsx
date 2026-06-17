"use client";

import React, { useState } from 'react';
import { User, ShieldCheck, ChevronRight, CreditCard, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const RideSelectionPanel = ({ vehicles, onConfirm }: { vehicles: any[], onConfirm: (v: any) => void }) => {
  const [selected, setSelected] = useState(vehicles.length > 0 ? vehicles[0] : null);

  if (!vehicles || vehicles.length === 0) {
    return <div className="p-8 text-center text-gray-500 font-bold animate-pulse">Loading rides...</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white border-l border-gray-100 animate-in slide-in-from-bottom-4 duration-700">
      <div className="p-8 flex-1 overflow-y-auto space-y-6">
        <h2 className="text-2xl font-bold text-primary">Recommended Rides</h2>
        
        <div className="space-y-3">
          {vehicles.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelected(v)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                selected.id === v.id 
                  ? 'border-primary bg-primary/[0.02] shadow-sm' 
                  : 'border-gray-50 bg-white hover:border-gray-200'
              }`}
            >
              <div className="w-20 h-14 bg-surface rounded-xl overflow-hidden flex items-center justify-center p-2">
                <img src={v.image} alt={v.name} className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">{v.name}</span>
                  <span className="flex items-center gap-1 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-bold uppercase text-gray-500">
                    <User size={10} /> 4
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium">{v.desc} • {v.eta}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-primary">₹{v.price}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 bg-secondary/10 rounded-2xl border border-secondary/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <RotateCcw className="text-primary" size={20} />
            </div>
            <div>
              <p className="font-bold text-primary">Return Ride Automation</p>
              <p className="text-xs text-gray-600">Save 15% on return trip by booking now.</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full h-10 text-xs">
            Learn how it works
          </Button>
        </div>
      </div>

      {/* Footer / Confirm Area */}
      <div className="p-8 border-t border-gray-100 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center">
              <CreditCard className="text-primary" size={20} />
            </div>
            <div>
              <p className="font-bold text-primary">Personal •••• 4242</p>
              <p className="text-xs text-gray-500">Tap to change payment</p>
            </div>
          </div>
          <ChevronRight className="text-gray-400" />
        </div>
        
        <Button 
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected}
          className="w-full h-16 text-lg shadow-lg shadow-primary/20"
        >
          Confirm {selected?.name}
        </Button>
      </div>
    </div>
  );
};
