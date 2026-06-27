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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex h-full flex-1 flex-col bg-surface"
    >
      <div className="flex-1 space-y-6 overflow-y-auto p-6 sm:p-8">
        <div>
          <div className="mb-3 flex w-fit items-center gap-2 rounded-full border border-accent/20 bg-accent/8 px-3 py-1.5 text-xs font-bold text-primary">
            <Sparkles size={14} />
            Best options
          </div>
          <h2 className="text-2xl font-extrabold text-text-primary">Choose your ride</h2>
          <p className="mt-1 text-sm font-medium text-text-secondary">Transparent pricing with live availability.</p>
        </div>

        <div className="space-y-3">
          {vehicles.map((v, index) => (
            <motion.button
              key={v.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, delay: index * 0.03 }}
              onClick={() => setSelected(v)}
              className={cn(
                "group relative w-full rounded-premium-lg border p-4 text-left transition-all duration-[220ms] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20",
                selected?.id === v.id
                  ? "border-primary bg-primary/[0.03] shadow-premium"
                  : "border-border bg-surface hover:border-accent/50 hover:shadow-soft"
              )}
            >
              {index === 0 && (
                <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                  Recommended
                </span>
              )}
              <div className="flex items-center gap-4 pr-20">
                <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-2xl bg-background p-3">
                  {v.image ? (
                    <Image
                      src={v.image}
                      alt={v.name}
                      width={96}
                      height={64}
                      unoptimized
                      className="h-full w-full object-contain transition-transform duration-[220ms] group-hover:scale-105"
                    />
                  ) : (
                    <Route className="text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-text-primary">{v.name}</span>
                    <span className="flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[10px] font-bold uppercase text-text-secondary">
                      <User size={10} /> {v.capacity || 4}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs font-medium text-text-secondary">{v.desc}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold text-text-secondary">
                    <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1">
                      <Clock3 size={12} /> {v.eta || "3 min"}
                    </span>
                    {v.distance && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1">
                        <Route size={12} /> {v.distance}
                      </span>
                    )}
                    {index === 1 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-support/30 px-2 py-1 text-primary">
                        Save 12%
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-primary">INR {v.price}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="space-y-4 rounded-premium-lg border border-support/50 bg-support/20 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface text-primary shadow-soft">
              <RotateCcw size={20} />
            </div>
            <div>
              <p className="font-bold text-text-primary">Return ride automation</p>
              <p className="text-xs font-medium text-text-secondary">Save 15% on return trip by booking now.</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="w-full text-xs">
            Learn how it works
          </Button>
        </div>
      </div>

      <div className="border-t border-border bg-surface p-6 shadow-[0_-18px_40px_rgba(15,23,42,0.04)] sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background">
              <CreditCard className="text-primary" size={20} />
            </div>
            <div>
              <p className="font-bold text-text-primary">Personal card ending 4242</p>
              <p className="text-xs font-medium text-text-secondary">Tap to change payment</p>
            </div>
          </div>
          <ChevronRight className="text-text-secondary" />
        </div>

        <Button onClick={() => selected && onConfirm(selected)} disabled={!selected} size="xl" className="w-full">
          Confirm {selected?.name}
        </Button>
      </div>
    </motion.div>
  );
};
