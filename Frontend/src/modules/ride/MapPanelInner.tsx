"use client";

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import React, { useEffect, useState, useRef, useMemo } from "react";
import Map, { Marker, Source, Layer, MapRef } from "react-map-gl/mapbox";
import { useRideStore, Location } from "@/store/useRideStore";
import { MAPBOX_TOKEN } from "@/lib/config";
import { getRouteCoordinates } from "@/lib/mapboxService";
import { SERVICE_AREA } from "@/config/serviceArea";
import { AlertCircle, Car, Compass, Layers, LocateFixed, MapPin, Navigation, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapPanelInnerProps {
  tempPickup?: Location | null;
  tempDrop?: Location | null;
}

// ─── HIGH-PERFORMANCE ANIMATED DRIVER MARKER ─────────────────────────────────────
// Uses requestAnimationFrame to interpolate coordinates smoothly based on real update timestamps
interface DriverMarkerProps {
  targetLocation: { lat: number; lng: number } | null;
}

const DriverMarker = React.memo(({ targetLocation }: DriverMarkerProps) => {
  const [currentLoc, setCurrentLoc] = useState<{ lat: number; lng: number } | null>(targetLocation);
  
  const prevLocRef = useRef<{ lat: number; lng: number } | null>(targetLocation);
  const targetLocRef = useRef<{ lat: number; lng: number } | null>(targetLocation);
  const animationRef = useRef<number | null>(null);
  
  const lastUpdateTimestampRef = useRef<number | null>(null);
  const durationRef = useRef<number>(5000); // Default to 5000ms
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!targetLocation) {
      setCurrentLoc(null);
      prevLocRef.current = null;
      targetLocRef.current = null;
      return;
    }

    if (!prevLocRef.current) {
      setCurrentLoc(targetLocation);
      prevLocRef.current = targetLocation;
      targetLocRef.current = targetLocation;
      lastUpdateTimestampRef.current = Date.now();
      return;
    }

    const now = Date.now();
    if (lastUpdateTimestampRef.current !== null) {
      const interval = now - lastUpdateTimestampRef.current;
      // Adjust transition duration dynamically matching socket update frequencies (1s - 15s)
      if (interval >= 1000 && interval <= 15000) {
        durationRef.current = interval;
      }
    }
    lastUpdateTimestampRef.current = now;

    // Start interpolation from current rendering position
    prevLocRef.current = currentLoc || prevLocRef.current;
    targetLocRef.current = targetLocation;
    startTimeRef.current = now;

    const animate = () => {
      if (!startTimeRef.current || !prevLocRef.current || !targetLocRef.current) return;

      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / durationRef.current, 1);

      // Ease out quad: t * (2 - t)
      const easeProgress = progress * (2 - progress);

      const interpolatedLng = prevLocRef.current.lng + (targetLocRef.current.lng - prevLocRef.current.lng) * easeProgress;
      const interpolatedLat = prevLocRef.current.lat + (targetLocRef.current.lat - prevLocRef.current.lat) * easeProgress;

      setCurrentLoc({
        lat: interpolatedLat,
        lng: interpolatedLng
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [targetLocation]);

  if (!currentLoc) return null;

  return (
    <Marker longitude={currentLoc.lng} latitude={currentLoc.lat} anchor="center">
      <div className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-premium transition-transform hover:scale-110">
        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
        <Car size={20} className="relative z-10" />
      </div>
    </Marker>
  );
});

DriverMarker.displayName = "DriverMarker";

// ─── MAIN MAP PANEL INNER COMPONENT ──────────────────────────────────────────────
export default function MapPanelInner({ tempPickup, tempDrop }: MapPanelInnerProps) {
  const { activeRide } = useRideStore();
  const mapRef = useRef<MapRef>(null);

  // States
  const [mapStyle, setMapStyle] = useState<string>("mapbox://styles/mapbox/light-v11");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [showStyleMenu, setShowStyleMenu] = useState<boolean>(false);
  const [route, setRoute] = useState<[number, number][]>([]);

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const support = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
      setWebGlSupported(support);
    } catch {
      setWebGlSupported(false);
    }
  }, []);

  // Watch user geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn("Geolocation watch error:", error.message);
      },
      { enableHighAccuracy: true }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const defaultCenter = SERVICE_AREA.defaultCenter; // [lng, lat] for Coimbatore

  const pickupLocation = activeRide?.pickup?.lat
    ? activeRide.pickup
    : activeRide?.pickupLocation?.lat
      ? activeRide.pickupLocation
      : tempPickup;

  const dropLocation = activeRide?.drop?.lat
    ? activeRide.drop
    : activeRide?.dropLocation?.lat
      ? activeRide.dropLocation
      : tempDrop;

  const driverLocation = activeRide?.driver?.location?.lat
    ? activeRide.driver.location
    : null;

  // Fetch routing polyline coordinates
  useEffect(() => {
    if (!pickupLocation || !dropLocation) {
      setRoute([]);
      return;
    }

    let cancelled = false;
    getRouteCoordinates(pickupLocation, dropLocation).then((coords) => {
      if (!cancelled) setRoute(coords);
    });

    return () => {
      cancelled = true;
    };
  }, [pickupLocation, dropLocation]);

  // Smooth camera tracking for active driver during ongoing ride
  useEffect(() => {
    if (activeRide?.status === 'ONGOING' && driverLocation && mapRef.current) {
      mapRef.current.easeTo({
        center: [driverLocation.lng, driverLocation.lat],
        zoom: 16,
        duration: 1000,
      });
    }
  }, [activeRide?.status, driverLocation]);

  // Fit camera bounds to markers and route coordinates
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    if (activeRide?.status === 'ONGOING' && driverLocation) return;

    const points: [number, number][] = [];
    if (pickupLocation) points.push([pickupLocation.lng, pickupLocation.lat]);
    if (dropLocation) points.push([dropLocation.lng, dropLocation.lat]);
    if (route && route.length > 0) {
      route.forEach(([lat, lng]) => points.push([lng, lat]));
    }

    if (points.length >= 2) {
      const lngs = points.map((p) => p[0]);
      const lats = points.map((p) => p[1]);
      const minLng = Math.min(...lngs);
      const minLat = Math.min(...lats);
      const maxLng = Math.max(...lngs);
      const maxLat = Math.max(...lats);

      mapRef.current.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 80, duration: 1500 }
      );
    } else if (points.length === 1) {
      mapRef.current.easeTo({
        center: [points[0][0], points[0][1]],
        zoom: 14,
        duration: 1500,
      });
    }
  }, [mapLoaded, pickupLocation, dropLocation, route, activeRide?.status, driverLocation]);

  // Floating controls handlers
  const handleZoomIn = () => mapRef.current?.zoomIn({ duration: 300 });
  const handleZoomOut = () => mapRef.current?.zoomOut({ duration: 300 });
  const handleCompassReset = () => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        bearing: 0,
        pitch: 0,
        duration: 800,
      });
    }
  };
  const handleRecenter = () => {
    if (mapRef.current) {
      const target = userLocation ? [userLocation.lng, userLocation.lat] : defaultCenter;
      mapRef.current.easeTo({
        center: target as [number, number],
        zoom: 14,
        duration: 1200,
      });
    }
  };

  // Route drawing properties
  const geojson = useMemo(() => {
    return {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "LineString" as const,
        coordinates: route.map(([lat, lng]) => [lng, lat]), // Mapbox expects [lng, lat]
      },
    };
  }, [route]);

  const routeLayer = {
    id: "route-line",
    type: "line" as const,
    layout: {
      "line-join": "round" as const,
      "line-cap": "round" as const,
    },
    paint: {
      "line-color": "#112E81",
      "line-width": 6,
      "line-opacity": 0.88,
    },
  };

  // Memoize custom markers
  const memoizedPickupMarker = useMemo(() => {
    if (!pickupLocation) return null;
    return (
      <Marker longitude={pickupLocation.lng} latitude={pickupLocation.lat} anchor="center">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-accent text-white shadow-premium">
          <Navigation size={16} />
        </div>
      </Marker>
    );
  }, [pickupLocation]);

  const memoizedDropMarker = useMemo(() => {
    if (!dropLocation) return null;
    return (
      <Marker longitude={dropLocation.lng} latitude={dropLocation.lat} anchor="center">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-secondary text-white shadow-premium">
          <MapPin size={16} />
        </div>
      </Marker>
    );
  }, [dropLocation]);

  const memoizedUserLocationMarker = useMemo(() => {
    if (!userLocation) return null;
    return (
      <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
        <div className="user-pulse"></div>
      </Marker>
    );
  }, [userLocation]);

  // Error boundary check
  if (!webGlSupported) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-background p-6 text-center">
        <AlertCircle size={40} className="text-red-500 mb-3" />
        <h3 className="mb-1 text-lg font-bold text-text-primary">WebGL Not Supported</h3>
        <p className="max-w-sm text-sm font-medium text-text-secondary">
          WebGL is required to render Mapbox maps. Please verify GPU hardware acceleration settings in your browser.
        </p>
      </div>
    );
  }

  if (!MAPBOX_TOKEN || MAPBOX_TOKEN === "your_mapbox_token") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-background p-6 text-center">
        <AlertCircle size={40} className="text-amber-500 mb-3" />
        <h3 className="mb-1 text-lg font-bold text-text-primary">Mapbox Token Missing</h3>
        <p className="max-w-sm text-sm font-medium text-text-secondary">
          Please add a valid <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> inside your env config.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Map loading state */}
      {!mapLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background">
          <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="text-sm font-bold text-text-secondary">Initializing Coimbatore map...</span>
        </div>
      )}

      <Map
        ref={mapRef}
        initialViewState={{
          longitude: pickupLocation?.lng || defaultCenter[0],
          latitude: pickupLocation?.lat || defaultCenter[1],
          zoom: SERVICE_AREA.zoom.default,
        }}
        maxBounds={[SERVICE_AREA.boundingBox.southWest, SERVICE_AREA.boundingBox.northEast]}
        minZoom={SERVICE_AREA.zoom.min}
        maxZoom={SERVICE_AREA.zoom.max}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        onLoad={() => setMapLoaded(true)}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        {memoizedUserLocationMarker}
        {memoizedPickupMarker}
        {memoizedDropMarker}
        <DriverMarker targetLocation={driverLocation} />

        {/* Route source and overlay line */}
        {route.length > 0 && (
          <Source id="route-source" type="geojson" data={geojson}>
            <Layer {...routeLayer} />
          </Source>
        )}
      </Map>

      {/* Floating glass controls */}
      {mapLoaded && (
        <div className="absolute right-4 top-5 z-10 flex flex-col gap-3 sm:right-6 sm:top-6">
          {/* Zoom controls */}
          <div className="flex flex-col overflow-hidden rounded-premium border border-white/20 bg-white/80 backdrop-blur-md shadow-premium">
            <button
              onClick={handleZoomIn}
              className="border-b border-border p-3 text-primary transition-all hover:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20"
              title="Zoom In"
              aria-label="Zoom in"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-3 text-primary transition-all hover:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20"
              title="Zoom Out"
              aria-label="Zoom out"
            >
              <ZoomOut size={18} />
            </button>
          </div>

          {/* Compass Reset */}
          <button
            onClick={handleCompassReset}
            className="flex items-center justify-center rounded-premium border border-white/20 bg-white/80 backdrop-blur-md p-3 text-primary shadow-premium transition-all hover:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20"
            title="Reset Compass"
            aria-label="Reset compass"
          >
            <Compass size={18} />
          </button>

          {/* Theme/Style Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowStyleMenu(!showStyleMenu)}
              className="flex items-center justify-center rounded-premium border border-white/20 bg-white/80 backdrop-blur-md p-3 text-primary shadow-premium transition-all hover:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20"
              title="Change Map Style"
              aria-label="Change map style"
            >
              <Layers size={18} />
            </button>
            {showStyleMenu && (
              <div className="absolute right-0 top-12 flex w-40 flex-col gap-1 rounded-premium border border-border bg-surface p-2 shadow-premium">
                {[
                  { name: "Light", value: "mapbox://styles/mapbox/light-v11" },
                  { name: "Dark", value: "mapbox://styles/mapbox/dark-v11" },
                  { name: "Streets", value: "mapbox://styles/mapbox/streets-v12" },
                ].map((style) => (
                  <button
                    key={style.value}
                    onClick={() => {
                      setMapStyle(style.value);
                      setShowStyleMenu(false);
                    }}
                    className={cn(
                      "rounded-xl px-3 py-2 text-left text-xs font-bold transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20",
                      mapStyle === style.value ? "bg-primary text-white" : "text-primary hover:bg-background"
                    )}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recenter FAB */}
          <button
            onClick={handleRecenter}
            className="flex items-center justify-center rounded-premium border border-white/20 bg-white/80 backdrop-blur-md p-3 text-primary shadow-premium transition-all hover:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20"
            title="Recenter to Coimbatore"
            aria-label="Recenter map"
          >
            <LocateFixed size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
