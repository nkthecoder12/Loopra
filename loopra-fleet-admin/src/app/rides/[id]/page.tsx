"use client";

import React, { useEffect, useState, useRef, use } from "react";
import api from "@/lib/api";
import { useNotificationStore } from "@/stores/notificationStore";
import {
  Loader2,
  ArrowLeft,
  MapPin,
  Navigation,
  DollarSign,
  Compass,
  FileText,
  Clock,
  Car
} from "lucide-react";
import Link from "next/link";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Mapbox Token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface RideDetails {
  _id: string;
  userId: {
    name: string;
    email: string;
  };
  driverId?: {
    name: string;
    phone: string;
    vehicle?: {
      number: string;
    };
  } | null;
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  dropLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  status: string;
  fare: number;
  finalFare?: number;
  advancePaymentAmount?: number;
  paymentStatus: string;
  distanceKm: number;
  durationMin?: number;
  type: string;
  scheduledAt?: string;
  createdAt: string;
}

interface PathPoint {
  latitude: number;
  longitude: number;
  recordedAt: string;
}

export default function RideDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addToast } = useNotificationStore();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);

  const [ride, setRide] = useState<RideDetails | null>(null);
  const [path, setPath] = useState<PathPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        const response = await api.get(`/fleet/rides/${id}`);
        if (response.data.success) {
          setRide(response.data.ride);
          setPath(response.data.path || []);
        }
      } catch (err) {
        addToast("error", "Failed to retrieve ride log details");
      } finally {
        setLoading(false);
      }
    };
    fetchRideDetails();
  }, [id, addToast]);

  // Map Rendering Effect
  useEffect(() => {
    if (loading || !mapContainer.current || !ride || mapInstance.current) return;

    // Center to pickup coordinates
    const center: [number, number] = [ride.pickupLocation.lng, ride.pickupLocation.lat];

    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center,
      zoom: 12
    });

    const map = mapInstance.current;

    // Load markers
    // Pickup
    new mapboxgl.Marker({ color: "#4F46E5" })
      .setLngLat([ride.pickupLocation.lng, ride.pickupLocation.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<p class="p-1 text-xs font-bold font-sans text-slate-800">Pickup: ${ride.pickupLocation.address}</p>`))
      .addTo(map);

    // Drop
    new mapboxgl.Marker({ color: "#10B981" })
      .setLngLat([ride.dropLocation.lng, ride.dropLocation.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<p class="p-1 text-xs font-bold font-sans text-slate-800">Dropoff: ${ride.dropLocation.address}</p>`))
      .addTo(map);

    // Route tracking line
    map.on("load", () => {
      if (path.length > 1) {
        const coordinates = path.map(p => [p.longitude, p.latitude]);

        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates
            }
          }
        });

        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "#6366f1",
            "line-width": 4,
            "line-opacity": 0.8
          }
        });

        // Fit map bounds to show route
        const bounds = new mapboxgl.LngLatBounds();
        coordinates.forEach(c => bounds.extend(c as [number, number]));
        map.fitBounds(bounds, { padding: 40 });
      }
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [loading, ride, path]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="text-center py-20 font-bold text-slate-400 text-xs font-sans">
        Ride not found
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none font-sans">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/rides"
          className="p-2 border border-slate-200/50 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-display tracking-tight leading-none">
            Trip #{ride._id}
          </h1>
          <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
            Dispatch Details Timeline &bull; Date: {new Date(ride.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core parameters */}
        <div className="space-y-6">
          {/* Timeline and states */}
          <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-soft space-y-6">
            <h3 className="text-xs font-black text-slate-800 font-display uppercase tracking-wider border-b border-slate-100 pb-3">
              Route Details
            </h3>

            <div className="space-y-4 text-xs font-semibold text-slate-600">
              <div className="flex gap-3 items-start">
                <MapPin size={16} className="text-indigo-500 pt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Pickup Address</span>
                  <span className="text-slate-700 font-bold mt-1 leading-normal">{ride.pickupLocation.address}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Navigation size={16} className="text-emerald-500 pt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Dropoff Address</span>
                  <span className="text-slate-700 font-bold mt-1 leading-normal">{ride.dropLocation.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing summary */}
          <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-soft space-y-4">
            <h3 className="text-xs font-black text-slate-800 font-display uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
              <DollarSign size={16} className="text-indigo-500" />
              <span>Fare Breakdown</span>
            </h3>

            <div className="space-y-3 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Calculated Fare</span>
                <span className="text-slate-800">₹{ride.fare}</span>
              </div>
              {ride.advancePaymentAmount && (
                <div className="flex justify-between">
                  <span>Advance Payment (Scheduled fee)</span>
                  <span className="text-indigo-500">₹{ride.advancePaymentAmount}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-black">
                <span className="text-slate-800">Final Charged Fare</span>
                <span className="text-indigo-600">₹{ride.finalFare || ride.fare}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payment Status</span>
                <span className="text-[10px] font-black uppercase text-slate-700">{ride.paymentStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Route Map */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-soft space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-slate-800 font-display uppercase tracking-wider">
                GPS Path Tracking
              </h3>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-500 rounded-full font-black text-[9px] uppercase tracking-wider">
                {ride.status}
              </span>
            </div>

            {/* Map container */}
            <div ref={mapContainer} className="w-full h-80 rounded-xl overflow-hidden bg-slate-900 border border-slate-100 shadow-inner" />
          </div>

          {/* Vehicle and Driver */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-soft flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl shrink-0">
                <Clock size={20} />
              </div>
              <div className="flex flex-col text-xs font-bold text-slate-700 min-w-0">
                <span className="text-slate-400 text-[9px] uppercase tracking-wider">Dispatch Statistics</span>
                <span className="text-slate-800 mt-1 truncate">{ride.distanceKm.toFixed(1)} km Total Distance</span>
                {ride.durationMin && <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{ride.durationMin} minutes travel time</span>}
              </div>
            </div>

            <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-soft flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl shrink-0">
                <Car size={20} />
              </div>
              <div className="flex flex-col text-xs font-bold text-slate-700 min-w-0">
                <span className="text-slate-400 text-[9px] uppercase tracking-wider">Assigned Dispatcher</span>
                <span className="text-slate-800 mt-1 truncate">{ride.driverId?.name || "Unassigned"}</span>
                {ride.driverId?.phone && <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{ride.driverId.phone}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
