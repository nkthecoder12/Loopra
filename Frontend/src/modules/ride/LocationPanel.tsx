"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Calendar, Clock, Navigation, Sparkles, Star, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AutocompleteInput } from "@/components/ui/AutocompleteInput";
import { Location } from "@/store/useRideStore";
import { reverseGeocode } from "@/lib/mapboxService";
import { isLocationInServiceArea } from "@/config/serviceArea";
import { useNotificationStore } from "@/store/useNotificationStore";

export const LocationPanel = ({
  onSearch,
}: {
  onSearch: (pickup: Location, drop: Location, scheduleData?: { date: string; time: string }, lockReturn?: boolean) => void;
}) => {
  const [pickupText, setPickupText] = useState("");
  const [dropText, setDropText] = useState("");
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropLocation, setDropLocation] = useState<Location | null>(null);
  
  // Schedule settings
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  
  // Return lock settings
  const [lockReturn, setLockReturn] = useState(false);

  const { addNotification } = useNotificationStore();

  const getMinDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          if (!isLocationInServiceArea(latitude, longitude)) {
            return;
          }
          const address = await reverseGeocode(latitude, longitude);
          if (address) {
            const loc: Location = { address, lat: latitude, lng: longitude };
            setPickupLocation(loc);
            setPickupText(address);
            addNotification("info", `Set pickup to current location: ${address.split(",")[0]}`);
          }
        },
        (error) => {
          console.warn("Geolocation permission denied or error:", error.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [addNotification]);

  const favorites = [
    { label: "Home", detail: "Set your default address", icon: Star },
    { label: "Work", detail: "Add office location", icon: Navigation },
  ];

  const handlePickupSelect = (loc: Location) => {
    if (!isLocationInServiceArea(loc.lat, loc.lng)) {
      addNotification("error", "Loopra currently operates only within Coimbatore.");
      return;
    }
    setPickupLocation(loc);
    setPickupText(loc.address);
  };

  const handleDropSelect = (loc: Location) => {
    if (!isLocationInServiceArea(loc.lat, loc.lng)) {
      addNotification("error", "Loopra currently operates only within Coimbatore.");
      return;
    }
    setDropLocation(loc);
    setDropText(loc.address);
  };

  // Scheduled date/time validator
  const handleProceed = () => {
    if (!pickupLocation || !dropLocation) return;
    if (!isLocationInServiceArea(pickupLocation.lat, pickupLocation.lng) || !isLocationInServiceArea(dropLocation.lat, dropLocation.lng)) {
      addNotification("error", "Loopra currently operates only within Coimbatore.");
      return;
    }

    if (isScheduled) {
      if (!scheduledDate || !scheduledTime) {
        addNotification("error", "Please select both a date and a time for scheduling.");
        return;
      }
      
      const now = new Date();
      const selectedDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      
      if (selectedDateTime <= new Date(now.getTime() + 5 * 60 * 1000)) {
        addNotification("error", "Scheduled time must be at least 5 minutes in the future.");
        return;
      }
    }

    onSearch(
      pickupLocation,
      dropLocation,
      isScheduled && scheduledDate && scheduledTime ? { date: scheduledDate, time: scheduledTime } : undefined,
      lockReturn
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex h-full w-full flex-col bg-[#1c1c1e] text-white"
    >
      <div className="space-y-5 p-5 sm:p-7">
        {/* Service Area Badge & Header */}
        <div className="space-y-2">
          <div className="flex w-fit items-center gap-1.5 rounded-full border border-blue-900/60 bg-[#0d2240] px-3 py-1 text-[10px] font-black text-blue-400 uppercase tracking-widest">
            <Sparkles size={11} className="text-blue-400" />
            Coimbatore Service Area
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-manrope">Where to?</h2>
            <p className="mt-0.5 text-xs sm:text-sm font-semibold text-zinc-400">Book your ride and your return, in one go.</p>
          </div>
        </div>

        {/* Inputs with Connector */}
        <div className="relative space-y-3 pt-1">
          <div className="absolute bottom-[38px] left-[21px] top-[38px] w-[2px] bg-zinc-750" />

          {/* Pickup */}
          <div className="relative flex items-center gap-3">
            <div className="z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-zinc-400 bg-[#1c1c1e]">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
            </div>
            <div className="flex-1">
              <AutocompleteInput
                placeholder="Pickup location"
                value={pickupText}
                onChange={setPickupText}
                onSelect={handlePickupSelect}
              />
            </div>
          </div>

          {/* Drop */}
          <div className="relative flex items-center gap-3">
            <div className="z-10 h-4 w-4 shrink-0 rounded bg-white shadow-md flex items-center justify-center">
              <div className="h-1.5 w-1.5 bg-black rounded-sm" />
            </div>
            <div className="flex-1">
              <AutocompleteInput
                placeholder="Where to?"
                value={dropText}
                onChange={setDropText}
                onSelect={handleDropSelect}
              />
            </div>
          </div>
        </div>

        {/* Tip section if destination is entered */}
        {dropLocation && (
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-zinc-800/40 border border-zinc-800 text-[11px] text-zinc-300 font-medium animate-in fade-in duration-300">
            <span className="shrink-0 text-amber-400">💡</span>
            <p>
              Most rides to <strong className="text-white">{dropLocation.address.split(",")[0]}</strong> come back the same day. Worth locking your return now, before cabs get scarce later.
            </p>
          </div>
        )}

        {/* Lock In Return Card (Inspired by reference mockup) */}
        {dropLocation && (
          <div className="rounded-2xl bg-[#09203f] border border-blue-900/60 p-4.5 flex items-center justify-between shadow-lg animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-950/80 text-blue-400 border border-blue-900/30">
                <RotateCw size={16} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm text-white">Lock in your return now?</p>
                <p className="text-[11px] font-semibold text-blue-300">Save 5%, and skip the search later</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={lockReturn}
                onChange={(e) => setLockReturn(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        )}

        {lockReturn && (
          <div className="text-center pt-1 animate-in fade-in duration-200">
            <button
              onClick={() => setLockReturn(false)}
              className="text-[11px] font-bold text-zinc-400 underline hover:text-zinc-200"
            >
              {"I'll book the return trip separately later"}
            </button>
          </div>
        )}

        {/* Mode Switcher: Pickup Now / Schedule */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-800 p-1">
          <button
            onClick={() => setIsScheduled(false)}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-all touch-target ${!isScheduled ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"}`}
          >
            <Clock size={14} />
            Pickup Now
          </button>
          <button
            onClick={() => setIsScheduled(true)}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-all touch-target ${isScheduled ? "bg-white text-black shadow-md" : "text-zinc-400 hover:text-white"}`}
          >
            <Calendar size={14} />
            Schedule
          </button>
        </div>

        {/* Schedule Inputs */}
        <AnimatePresence>
          {isScheduled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="grid grid-cols-2 gap-3 overflow-hidden"
            >
              <input
                type="date"
                min={getMinDateString()}
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-800 p-3.5 text-xs font-bold text-white outline-none focus:border-blue-500 touch-target"
              />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="rounded-xl border border-zinc-700 bg-zinc-800 p-3.5 text-xs font-bold text-white outline-none focus:border-blue-500 touch-target"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Estimated Fare Row (from mockup) & Proceed Button */}
        <div className="pt-2 border-t border-zinc-800 space-y-4">
          {pickupLocation && dropLocation && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400">Estimated fare</span>
              <span className="text-2xl font-black text-white">
                ₹114 
              </span>
            </div>
          )}

          <Button
            onClick={handleProceed}
            disabled={!pickupLocation || !dropLocation}
            className="group w-full h-14 bg-white text-black hover:bg-zinc-100 disabled:bg-zinc-800 disabled:text-zinc-650 rounded-2xl font-black text-base shadow-lg touch-target transition-all active:scale-[0.99]"
          >
            See Prices
            <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
          </Button>
        </div>
      </div>

      {/* Favorites & Recent Destinations */}
      <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-6 sm:px-7 border-t border-zinc-800/80 pt-5">
        <div className="grid grid-cols-2 gap-3">
          {favorites.map((favorite) => {
            const Icon = favorite.icon;
            return (
              <button
                key={favorite.label}
                className="rounded-2xl border border-zinc-800/60 bg-zinc-800/40 p-3.5 text-left transition-all hover:border-zinc-700 hover:bg-zinc-800 touch-target text-left"
              >
                <Icon size={18} className="text-white" />
                <p className="mt-2 text-xs font-bold text-white">{favorite.label}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-zinc-500 truncate">{favorite.detail}</p>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
