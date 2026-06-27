"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Location } from "@/store/useRideStore";
import { Activity, ShieldCheck } from "lucide-react";

const MapPanelInner = dynamic(() => import("./MapPanelInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-background text-sm font-bold text-text-secondary">
      Preparing map...
    </div>
  ),
});

interface MapPanelProps {
  tempPickup?: Location | null;
  tempDrop?: Location | null;
}

export const MapPanel = ({ tempPickup, tempDrop }: MapPanelProps) => {
  return (
    <div className="group relative h-full w-full overflow-hidden bg-background">
      <div className="h-full w-full">
        <MapPanelInner tempPickup={tempPickup} tempDrop={tempDrop} />
      </div>

      <div className="pointer-events-none absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-premium glass p-4 sm:bottom-8 sm:left-8 sm:right-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
            <Activity size={17} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Live Dispatch</p>
            <p className="text-xs font-medium text-text-secondary">Optimized routing and driver tracking</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-background px-3 py-2 text-xs font-bold text-primary sm:flex">
          <ShieldCheck size={14} />
          Secure
        </div>
      </div>
    </div>
  );
};
