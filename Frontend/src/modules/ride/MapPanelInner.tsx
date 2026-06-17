"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { useRideStore, Location } from "@/store/useRideStore";
import { getRouteCoordinates } from "@/lib/openRouteService";

const pickupIcon = L.divIcon({
  className: "",
  html: '<div style="width:14px;height:14px;background:#22c55e;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const dropIcon = L.divIcon({
  className: "",
  html: '<div style="width:14px;height:14px;background:#ef4444;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const driverIcon = L.divIcon({
  className: "",
  html: '<div style="width:32px;height:32px;background:#170C79;border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 6px rgba(0,0,0,0.3)">🚗</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function FitBounds({
  pickup,
  drop,
  route,
}: {
  pickup: Location | null;
  drop: Location | null;
  route: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    const points: L.LatLngExpression[] = [];
    if (pickup) points.push([pickup.lat, pickup.lng]);
    if (drop) points.push([drop.lat, drop.lng]);
    route.forEach(([lat, lng]) => points.push([lat, lng]));

    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }
  }, [map, pickup, drop, route]);

  return null;
}

interface MapPanelInnerProps {
  tempPickup?: Location | null;
  tempDrop?: Location | null;
}

export default function MapPanelInner({ tempPickup, tempDrop }: MapPanelInnerProps) {
  const { activeRide } = useRideStore();
  const [route, setRoute] = useState<[number, number][]>([]);

  const defaultCenter: [number, number] = [28.6139, 77.209];

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

  const center: [number, number] = pickupLocation
    ? [pickupLocation.lat, pickupLocation.lng]
    : defaultCenter;

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

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds pickup={pickupLocation || null} drop={dropLocation || null} route={route} />

      {route.length > 0 && (
        <Polyline positions={route} pathOptions={{ color: "#170C79", weight: 5, opacity: 0.8 }} />
      )}

      {pickupLocation && (
        <Marker position={[pickupLocation.lat, pickupLocation.lng]} icon={pickupIcon} />
      )}
      {dropLocation && (
        <Marker position={[dropLocation.lat, dropLocation.lng]} icon={dropIcon} />
      )}
      {driverLocation && (
        <Marker
          position={[driverLocation.lat, driverLocation.lng]}
          icon={driverIcon}
        />
      )}
    </MapContainer>
  );
}
