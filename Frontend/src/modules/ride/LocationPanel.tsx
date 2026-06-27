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
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex h-full w-full max-w-[440px] flex-col bg-surface"
    >
      <div className="space-y-7 p-6 sm:p-8">
        <div className="space-y-3">
          <div className="flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-primary">
            <Sparkles size={14} />
            Coimbatore Dispatch
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-normal text-text-primary">Where to?</h2>
            <p className="mt-1 text-sm font-medium text-text-secondary">Book now or schedule a ride within Coimbatore.</p>
          </div>
        </div>

        <div className="relative space-y-4">
          <div className="absolute bottom-[44px] left-[23px] top-[44px] w-0.5 bg-border" />

          <div className="relative flex items-center gap-4">
            <div className="z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-surface">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
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

          <div className="relative flex items-center gap-4">
            <div className="z-10 h-4 w-4 rounded bg-secondary shadow-soft" />
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

        <div className="grid grid-cols-2 gap-2 rounded-premium bg-background p-1">
          <button
            onClick={() => setIsScheduled(false)}
            className={`flex items-center justify-center gap-2 rounded-[14px] py-3 text-sm font-bold transition-all duration-[220ms] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 ${!isScheduled ? "bg-surface text-primary shadow-soft" : "text-text-secondary hover:text-primary"}`}
          >
            <Clock size={16} />
            Now
          </button>
          <button
            onClick={() => setIsScheduled(true)}
            className={`flex items-center justify-center gap-2 rounded-[14px] py-3 text-sm font-bold transition-all duration-[220ms] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20 ${isScheduled ? "bg-surface text-primary shadow-soft" : "text-text-secondary hover:text-primary"}`}
          >
            <Calendar size={16} />
            Schedule
          </button>
        </div>

        <AnimatePresence>
          {isScheduled && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="grid grid-cols-2 gap-3 overflow-hidden"
            >
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="rounded-premium border border-border bg-background p-3 text-sm font-bold text-primary outline-none transition-all focus:border-accent focus:ring-4 focus:ring-accent/15"
              />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="rounded-premium border border-border bg-background p-3 text-sm font-bold text-primary outline-none transition-all focus:border-accent focus:ring-4 focus:ring-accent/15"
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
          size="xl"
          className="group w-full"
        >
          See Prices
          <ArrowRight className="ml-2 transition-transform duration-[220ms] group-hover:translate-x-1" />
        </Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 pb-8 sm:px-8">
        <div className="grid grid-cols-2 gap-3">
          {favorites.map((favorite) => {
            const Icon = favorite.icon;
            return (
              <button
                key={favorite.label}
                className="rounded-premium border border-border bg-background p-4 text-left transition-all duration-[220ms] hover:border-accent hover:bg-surface hover:shadow-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20"
              >
                <Icon size={18} className="text-primary" />
                <p className="mt-3 text-sm font-bold text-text-primary">{favorite.label}</p>
                <p className="mt-1 text-xs font-medium text-text-secondary">{favorite.detail}</p>
              </button>
            );
          })}
        </div>

        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-text-secondary">
          <History size={14} />
          Recent Places
        </h3>
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((loc, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectHistory(loc)}
                className="group flex cursor-pointer items-center gap-3 rounded-premium border border-transparent p-3 transition-all duration-[220ms] hover:border-border hover:bg-background"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background text-text-secondary transition-colors group-hover:bg-surface group-hover:text-primary">
                  <MapPin size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-text-primary">{loc.address.split(",")[0]}</p>
                  <p className="truncate text-xs font-medium text-text-secondary">{loc.address.split(",").slice(1).join(",").trim()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-premium border border-dashed border-border bg-background p-4 text-sm font-medium text-text-secondary">
            No recent places found.
          </p>
        )}
      </div>
    </motion.div>
  );
};
