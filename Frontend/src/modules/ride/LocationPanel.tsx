"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Calendar, Clock, History, MapPin, Navigation, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AutocompleteInput } from "@/components/ui/AutocompleteInput";
import { Location } from "@/store/useRideStore";
import { reverseGeocode } from "@/lib/mapboxService";
import { isLocationInServiceArea } from "@/config/serviceArea";
import { useNotificationStore } from "@/store/useNotificationStore";

export const LocationPanel = ({
  onSearch,
}: {
  onSearch: (pickup: Location, drop: Location, scheduleData?: { date: string; time: string }) => void;
}) => {
  const [pickupText, setPickupText] = useState("");
  const [dropText, setDropText] = useState("");
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropLocation, setDropLocation] = useState<Location | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [history, setHistory] = useState<Location[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem("loopra_search_history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const { addNotification } = useNotificationStore();

  const saveToHistory = (loc: Location) => {
    try {
      const filtered = history.filter((item) => item.address !== loc.address);
      const updated = [loc, ...filtered].slice(0, 5);
      setHistory(updated);
      localStorage.setItem("loopra_search_history", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save search history", e);
    }
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

  const handleSelectHistory = (loc: Location) => {
    if (!isLocationInServiceArea(loc.lat, loc.lng)) {
      addNotification("error", "Loopra currently operates only within Coimbatore.");
      return;
    }
    setDropLocation(loc);
    setDropText(loc.address);
  };

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
    saveToHistory(loc);
  };

  const handleDropSelect = (loc: Location) => {
    if (!isLocationInServiceArea(loc.lat, loc.lng)) {
      addNotification("error", "Loopra currently operates only within Coimbatore.");
      return;
    }
    setDropLocation(loc);
    setDropText(loc.address);
    saveToHistory(loc);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex h-full w-full flex-col bg-white"
    >
      <div className="space-y-5 p-5 sm:p-7">
        <div className="space-y-2">
          <div className="flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-extrabold text-black uppercase tracking-wider">
            <Sparkles size={13} className="text-blue-600" />
            Coimbatore Service Area
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black">Where to?</h2>
            <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-500">Instant or scheduled mobility in Coimbatore.</p>
          </div>
        </div>

        <div className="relative space-y-3 pt-1">
          <div className="absolute bottom-[40px] left-[21px] top-[40px] w-0.5 bg-slate-300" />

          <div className="relative flex items-center gap-3">
            <div className="z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-black bg-white">
              <div className="h-1.5 w-1.5 rounded-full bg-black" />
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

          <div className="relative flex items-center gap-3">
            <div className="z-10 h-4 w-4 shrink-0 rounded bg-black shadow-sm" />
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

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          <button
            onClick={() => setIsScheduled(false)}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-all touch-target ${!isScheduled ? "bg-black text-white shadow-md" : "text-slate-600 hover:text-black"}`}
          >
            <Clock size={15} />
            Pickup Now
          </button>
          <button
            onClick={() => setIsScheduled(true)}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-all touch-target ${isScheduled ? "bg-black text-white shadow-md" : "text-slate-600 hover:text-black"}`}
          >
            <Calendar size={15} />
            Schedule
          </button>
        </div>

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
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-black outline-none focus:border-black touch-target"
              />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-black outline-none focus:border-black touch-target"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={() => {
            if (!pickupLocation || !dropLocation) return;
            if (!isLocationInServiceArea(pickupLocation.lat, pickupLocation.lng) || !isLocationInServiceArea(dropLocation.lat, dropLocation.lng)) {
              addNotification("error", "Loopra currently operates only within Coimbatore.");
              return;
            }
            onSearch(
              pickupLocation,
              dropLocation,
              isScheduled && scheduledDate && scheduledTime ? { date: scheduledDate, time: scheduledTime } : undefined
            );
          }}
          disabled={!pickupLocation || !dropLocation}
          className="group w-full h-14 bg-black text-white hover:bg-zinc-800 rounded-2xl font-bold text-base shadow-lg touch-target active:scale-[0.99]"
        >
          See Prices
          <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-6 sm:px-7">
        <div className="grid grid-cols-2 gap-3">
          {favorites.map((favorite) => {
            const Icon = favorite.icon;
            return (
              <button
                key={favorite.label}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-left transition-all hover:border-slate-300 hover:bg-white hover:shadow-md touch-target"
              >
                <Icon size={18} className="text-black" />
                <p className="mt-2 text-xs font-bold text-black">{favorite.label}</p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-400 truncate">{favorite.detail}</p>
              </button>
            );
          })}
        </div>

        <h3 className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 pt-1">
          <History size={13} />
          Recent Destinations
        </h3>
        {history.length > 0 ? (
          <div className="space-y-2">
            {history.map((loc, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectHistory(loc)}
                className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 p-3 transition-all hover:bg-slate-50 touch-target"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-black group-hover:text-white">
                  <MapPin size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-black">{loc.address.split(",")[0]}</p>
                  <p className="truncate text-[11px] font-medium text-slate-400">{loc.address.split(",").slice(1).join(",").trim()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs font-medium text-slate-400 text-center">
            No recent destinations yet.
          </p>
        )}
      </div>
    </motion.div>
  );
};
