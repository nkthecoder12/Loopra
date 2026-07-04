"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronRight, Clock3, CreditCard, RotateCcw, Route, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface VehicleOption {
  id: string;
  name: string;
  desc?: string;
  eta?: string | number;
  distance?: string;
  price: number | string;
  image?: string;
  capacity?: number;
}

export const RideSelectionPanel = ({
  vehicles,
  onConfirm,
}: {
  vehicles: VehicleOption[];
  onConfirm: (v: VehicleOption) => void;
}) => {
  const [selected, setSelected] = useState<VehicleOption | null>(vehicles.length > 0 ? vehicles[0] : null);

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#1c1c1e]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-bold text-zinc-400 text-sm">Loading available rides...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex h-full flex-1 flex-col bg-[#1c1c1e] text-white"
    >
      {/* Scrollable vehicle choices */}
      <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
        <div>
          <div className="mb-2 flex w-fit items-center gap-1.5 rounded-full border border-blue-900/60 bg-[#0d2240] px-3 py-1 text-[10px] font-black text-blue-400 uppercase tracking-widest">
            <Sparkles size={11} className="text-blue-400" />
            Live Pricing
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-manrope">Choose your ride</h2>
          <p className="mt-0.5 text-xs sm:text-sm font-semibold text-zinc-400">Transparent rates & real-time driver matching.</p>
        </div>

        <div className="space-y-2.5">
          {vehicles.map((v, index) => (
            <motion.button
              key={v.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: index * 0.03 }}
              onClick={() => setSelected(v)}
              className={cn(
                "group relative w-full rounded-2xl border p-4 text-left transition-all duration-200 touch-target focus-visible:outline-none",
                selected?.id === v.id
                  ? "border-blue-500 bg-[#2c2c2e] text-white shadow-xl ring-2 ring-blue-500/20"
                  : "border-zinc-800/80 bg-[#252528] text-zinc-300 hover:border-zinc-700 hover:bg-[#2c2c2e]"
              )}
            >
              {index === 0 && (
                <span className={cn(
                  "absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest",
                  selected?.id === v.id ? "bg-blue-500 text-white" : "bg-zinc-700 text-zinc-300"
                )}>
                  Recommended
                </span>
              )}
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl p-2 transition-colors",
                  selected?.id === v.id ? "bg-zinc-800" : "bg-zinc-800/40"
                )}>
                  {v.image ? (
                    <Image
                      src={v.image}
                      alt={v.name}
                      width={80}
                      height={50}
                      unoptimized
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Route className={selected?.id === v.id ? "text-blue-400" : "text-zinc-400"} />
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm sm:text-base text-white">{v.name}</span>
                    <span className={cn(
                      "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase",
                      selected?.id === v.id ? "bg-zinc-800 text-zinc-300" : "bg-zinc-900/60 text-zinc-400"
                    )}>
                      <User size={10} /> {v.capacity || 4}
                    </span>
                  </div>
                  <p className={cn("mt-0.5 truncate text-xs font-semibold", selected?.id === v.id ? "text-zinc-300" : "text-zinc-500")}>
                    {v.desc || "Standard comfortable rides"}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] font-bold">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5", selected?.id === v.id ? "bg-zinc-800 text-zinc-300" : "bg-zinc-900/60 text-zinc-400")}>
                      <Clock3 size={11} /> {v.eta || "3 min"}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <p className="text-lg font-black text-white">₹{v.price}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Return Savings Box */}
        <div className="rounded-2xl border border-blue-900/45 bg-[#09203f]/50 p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-950/80 text-blue-400">
              <RotateCcw size={16} />
            </div>
            <div>
              <p className="font-bold text-xs text-white">Automated Return Ride Savings</p>
              <p className="text-[11px] font-semibold text-zinc-400">Save 5% by toggling return lock during search.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Checkout info & Action Button */}
      <div className="border-t border-zinc-800/80 bg-[#1c1c1e] p-5 sm:p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300">
              <CreditCard size={18} />
            </div>
            <div>
              <p className="font-bold text-xs text-white">Razorpay Instant Checkout</p>
              <p className="text-[10px] font-semibold text-zinc-500">UPI, Cards, Netbanking accepted</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-zinc-500" />
        </div>

        <Button 
          onClick={() => selected && onConfirm(selected)} 
          disabled={!selected} 
          className="w-full h-14 bg-white text-black hover:bg-zinc-100 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-2xl font-black text-base shadow-lg touch-target active:scale-[0.99] transition-all"
        >
          Confirm {selected?.name}
        </Button>
      </div>
    </motion.div>
  );
};
