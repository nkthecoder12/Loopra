"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Location } from "@/store/useRideStore";

const MapPanelInner = dynamic(() => import("./MapPanelInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-surface text-sm text-gray-500">
      Loading map...
    </div>
  ),
});

interface MapPanelProps {
  tempPickup?: Location | null;
  tempDrop?: Location | null;
}

export const MapPanel = ({ tempPickup, tempDrop }: MapPanelProps) => {
  return (
    <div className="w-[50%] relative overflow-hidden group border-l border-gray-100">
      <div className="h-full w-full">
        <MapPanelInner tempPickup={tempPickup} tempDrop={tempDrop} />
      </div>

      <div className="absolute bottom-8 left-8 right-8 glass p-4 rounded-xl flex items-center justify-between pointer-events-none bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-xs font-bold text-primary">OpenStreetMap + OpenRouteService</p>
        </div>
      </div>
    </div>
  );
};
