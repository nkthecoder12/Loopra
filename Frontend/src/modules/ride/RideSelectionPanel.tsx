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
  const [selected, setSelected] = useState(vehicles.length > 0 ? vehicles[0] : null);

  if (!vehicles || vehicles.length === 0) {
    return <div className="p-8 text-center font-bold text-text-secondary animate-pulse">Loading rides...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex h-full flex-1 flex-col bg-white"
    >
      <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
        <div>
          <div className="mb-2 flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-extrabold text-black uppercase tracking-wider">
            <Sparkles size={13} className="text-blue-600" />
            Live Pricing
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">Choose your ride</h2>
          <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500">Transparent rates & real-time driver matching.</p>
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
                  ? "border-black bg-slate-900 text-white shadow-xl"
                  : "border-slate-200 bg-white text-black hover:border-slate-400 hover:bg-slate-50"
              )}
            >
              {index === 0 && (
                <span className={cn(
                  "absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest",
                  selected?.id === v.id ? "bg-white text-black" : "bg-black text-white"
                )}>
                  Recommended
                </span>
              )}
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl p-2",
                  selected?.id === v.id ? "bg-zinc-800" : "bg-slate-100"
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
                    <Route className={selected?.id === v.id ? "text-white" : "text-black"} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm sm:text-base">{v.name}</span>
                    <span className={cn(
                      "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                      selected?.id === v.id ? "bg-zinc-800 text-zinc-300" : "bg-slate-100 text-slate-600"
                    )}>
                      <User size={10} /> {v.capacity || 4}
                    </span>
                  </div>
                  <p className={cn("mt-0.5 truncate text-xs font-medium", selected?.id === v.id ? "text-zinc-300" : "text-slate-500")}>
                    {v.desc}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] font-bold">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5", selected?.id === v.id ? "bg-zinc-800 text-zinc-300" : "bg-slate-100 text-slate-600")}>
                      <Clock3 size={11} /> {v.eta || "3 min"}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <p className="text-lg font-black">₹{v.price}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-white">
              <RotateCcw size={18} />
            </div>
            <div>
              <p className="font-bold text-xs text-black">Automated Return Ride Savings</p>
              <p className="text-[11px] font-medium text-slate-500">Save up to 20% by scheduling your return trip in advance.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-white p-5 sm:p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-black">
              <CreditCard size={18} />
            </div>
            <div>
              <p className="font-bold text-xs text-black">Razorpay Instant Checkout</p>
              <p className="text-[11px] font-medium text-slate-400">UPI, Cards, Netbanking accepted</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400" />
        </div>

        <Button 
          onClick={() => selected && onConfirm(selected)} 
          disabled={!selected} 
          className="w-full h-14 bg-black text-white hover:bg-zinc-800 rounded-2xl font-bold text-base shadow-lg touch-target active:scale-[0.99]"
        >
          Confirm {selected?.name}
        </Button>
      </div>
    </motion.div>
  );
};
