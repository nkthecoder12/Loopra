"use client";

import React, { useEffect, useRef, useState } from "react";
import { getSocket, connectSocket } from "@/lib/socket";
import { useOperationsStore } from "@/stores/operationsStore";
import { useNotificationStore } from "@/stores/notificationStore";
import api from "@/lib/api";
import { Loader2, Radio, MapPin, Navigation, Eye, User } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Configure token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export default function LiveOperationsPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  const { addToast } = useNotificationStore();
  const {
    drivers,
    rides,
    setDrivers,
    setRides,
    updateDriverLocation,
    updateRideStatus,
    removeRide
  } = useOperationsStore();

  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);

  // 1. Fetch initial states & Connect Socket
  useEffect(() => {
    const initOps = async () => {
      try {
        const [dRes, rRes] = await Promise.all([
          api.get("/fleet/drivers"),
          api.get("/fleet/rides")
        ]);
        if (dRes.data.success) {
          const onlineDrivers = dRes.data.data.drivers.filter(
            (d: any) => d.onboardingStatus === "APPROVED"
          );
          setDrivers(onlineDrivers);
        }
        if (rRes.data.success) {
          const activeRides = rRes.data.data.rides.filter((r: any) =>
            ["REQUESTED", "DRIVER_ASSIGNED", "ONGOING"].includes(r.status)
          );
          setRides(activeRides);
        }
      } catch (err) {
        addToast("error", "Failed to retrieve active operations");
      } finally {
        setLoading(false);
      }
    };

    initOps();
    connectSocket();

    const socket = getSocket();
    socket.emit("driver-go-online"); // join driver events

    // WebSockets Listeners
    socket.on("live-location", (data: { rideId: string; latitude: number; longitude: number; driverId?: string }) => {
      console.log("[Socket LiveLocation]:", data);
      const matchedDriver = drivers.find(d => d.vehicle?.number === data.rideId || d._id === data.driverId);
      const targetId = data.driverId || matchedDriver?._id;
      if (targetId) {
        updateDriverLocation(targetId, data.longitude, data.latitude);
      }
    });

    socket.on("ride-status-updated", (data: { rideId: string; status: string }) => {
      updateRideStatus(data.rideId, data.status);
      if (["COMPLETED", "CANCELLED", "FAILED"].includes(data.status)) {
        removeRide(data.rideId);
      }
    });

    return () => {
      socket.off("live-location");
      socket.off("ride-status-updated");
    };
  }, [setDrivers, setRides, updateDriverLocation, updateRideStatus, removeRide, addToast, drivers]);

  // 2. Initialize Mapbox Map
  useEffect(() => {
    if (loading || !mapContainer.current || mapInstance.current) return;

    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [76.9558, 11.0168], // Defaults to Coimbatore
      zoom: 12
    });

    mapInstance.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [loading]);

  // 3. Update Markers on Coordinate State Changes
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear obsolete markers
    const activeDriverIds = new Set(drivers.map(d => d._id));
    Object.keys(markersRef.current).forEach(id => {
      if (!activeDriverIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add / Update markers
    drivers.forEach(driver => {
      const coords = driver.location.coordinates;
      if (!coords || coords[0] === 0 || coords[1] === 0) return;

      const markerId = driver._id;

      if (markersRef.current[markerId]) {
        // Smooth transition
        markersRef.current[markerId].setLngLat([coords[0], coords[1]]);
      } else {
        // Create custom element
        const el = document.createElement("div");
        el.className = "custom-marker";
        el.style.width = "20px";
        el.style.height = "20px";
        el.style.borderRadius = "50%";
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
        el.style.cursor = "pointer";
        el.style.backgroundColor = driver.isAvailable ? "#10B981" : "#4F46E5"; // green if available, indigo if busy

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div class="p-2 text-xs font-sans font-bold">
            <p class="text-slate-800">${driver.name}</p>
            <p class="text-slate-400 mt-1">${driver.vehicle?.number || "No Vehicle Assigned"}</p>
          </div>`
        );

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([coords[0], coords[1]])
          .setPopup(popup)
          .addTo(mapInstance.current!);

        markersRef.current[markerId] = marker;
      }
    });
  }, [drivers]);

  const flyToDriver = (coords: [number, number], driverId: string) => {
    if (!mapInstance.current || !coords || coords[0] === 0 || coords[1] === 0) {
      addToast("warning", "Driver has no active GPS signal");
      return;
    }
    setSelectedDriver(driverId);
    mapInstance.current.flyTo({
      center: coords,
      zoom: 15,
      essential: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white border border-slate-200/50 rounded-3xl overflow-hidden shadow-soft select-none font-sans relative">
      {/* Map display */}
      <div ref={mapContainer} className="flex-1 h-full" />

      {/* Live status feed overlay */}
      <div className="w-80 h-full border-l border-slate-100 flex flex-col bg-white shrink-0 z-10 relative">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 font-display flex items-center gap-2">
            <Radio size={16} className="text-indigo-500 animate-pulse" />
            <span>Operational Feed</span>
          </h2>
          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-500 rounded-full font-black text-[9px] uppercase tracking-wider">
            {drivers.filter(d => d.isAvailable).length} Active
          </span>
        </div>

        {/* List of active drivers */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            Drivers Online
          </h3>

          {drivers.length === 0 ? (
            <div className="text-center py-8 text-xs font-semibold text-slate-400">
              No online drivers in fleet
            </div>
          ) : (
            drivers.map(d => {
              const hasCoords = d.location.coordinates && d.location.coordinates[0] !== 0;
              return (
                <div
                  key={d._id}
                  onClick={() => hasCoords && flyToDriver(d.location.coordinates, d._id)}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    selectedDriver === d._id
                      ? "border-indigo-500 bg-indigo-50/20"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="flex gap-3 items-center min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      d.isAvailable ? "bg-emerald-50 text-emerald-500" : "bg-indigo-50 text-indigo-500"
                    }`}>
                      <User size={16} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-700 truncate">{d.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold truncate">
                        {d.vehicle?.number || "No Vehicle"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      d.isAvailable ? "bg-emerald-500" : "bg-indigo-500"
                    }`} />
                    {hasCoords && <Eye size={12} className="text-slate-400" />}
                  </div>
                </div>
              );
            })
          )}

          {/* Active Rides */}
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 pt-4">
            Active Trips ({rides.length})
          </h3>

          {rides.length === 0 ? (
            <div className="text-center py-6 text-xs font-semibold text-slate-400">
              No active dispatches
            </div>
          ) : (
            rides.map(r => (
              <div
                key={r._id}
                className="p-3 rounded-xl border border-slate-100 flex flex-col gap-2 bg-slate-50/40 text-[11px]"
              >
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-700 truncate max-w-[120px]">{r.userId.name}</span>
                  <span className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full">
                    {r.status}
                  </span>
                </div>

                <div className="space-y-1 text-slate-500 font-semibold">
                  <div className="flex gap-1.5 items-center">
                    <MapPin size={10} className="text-indigo-400" />
                    <span className="truncate">{r.pickupLocation.address}</span>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <Navigation size={10} className="text-emerald-400" />
                    <span className="truncate">{r.dropLocation.address}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
