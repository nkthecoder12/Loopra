import { MAPBOX_TOKEN } from "@/lib/config";
import { useNotificationStore } from "@/store/useNotificationStore";
import { SERVICE_AREA, isLocationInServiceArea } from "@/config/serviceArea";

export interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

let keyErrorShown = false;
const routeCache = new Map<string, [number, number][]>();
const searchCache = new Map<string, GeocodeResult[]>();

function handleMapboxError(res: Response, fallbackMessage: string) {
  let errorMsg = fallbackMessage;
  if (res.status === 401 || res.status === 403) {
    errorMsg = "Mapbox API token is invalid or unauthorized. Map rendering and search will not function.";
  } else if (res.status === 429) {
    errorMsg = "Mapbox API rate limit exceeded. Please wait a moment.";
  }
  useNotificationStore.getState().addNotification("error", errorMsg);
}

function verifyToken(): boolean {
  if (!MAPBOX_TOKEN || MAPBOX_TOKEN === "your_mapbox_token") {
    if (!keyErrorShown) {
      keyErrorShown = true;
      useNotificationStore.getState().addNotification(
        "error",
        "Mapbox Access Token is missing or placeholder. Please set NEXT_PUBLIC_MAPBOX_TOKEN in your environment.",
        10000
      );
    }
    return false;
  }
  return true;
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const trimmedQuery = query.trim().toLowerCase();
  if (!trimmedQuery) return [];
  if (!verifyToken()) return [];

  if (searchCache.has(trimmedQuery)) {
    return searchCache.get(trimmedQuery) || [];
  }

  try {
    const { southWest, northEast } = SERVICE_AREA.boundingBox;
    const { biasLocation } = SERVICE_AREA;

    const params = new URLSearchParams({
      access_token: MAPBOX_TOKEN,
      country: "IN",
      language: "en",
      limit: "8",
      proximity: `${biasLocation.lng},${biasLocation.lat}`,
      bbox: `${southWest[0]},${southWest[1]},${northEast[0]},${northEast[1]}`,
      types: "poi,address,neighborhood,locality,place",
    });

    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`,
      { signal }
    );

    if (!res.ok) {
      handleMapboxError(res, "Failed to fetch place search autocomplete results.");
      return [];
    }

    const data = await res.json();
    const features = data.features || [];

    interface MapboxFeature {
      place_name?: string;
      geometry: { coordinates: [number, number] };
    }

    const results: GeocodeResult[] = features
      .map((feature: MapboxFeature) => ({
        label: feature.place_name || "",
        lng: feature.geometry.coordinates[0],
        lat: feature.geometry.coordinates[1],
      }))
      .filter((item: GeocodeResult) => isLocationInServiceArea(item.lat, item.lng));

    searchCache.set(trimmedQuery, results);
    return results;
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === "AbortError") {
      // Quietly ignore aborted fetch requests
      return [];
    }
    console.error("searchPlaces error:", err);
    useNotificationStore.getState().addNotification("error", "Place search failed due to a network error.");
    return [];
  }
}

export async function getRouteCoordinates(
  pickup: { lat: number; lng: number },
  drop: { lat: number; lng: number }
): Promise<[number, number][]> {
  if (!verifyToken()) return [];

  const cacheKey = `${pickup.lat.toFixed(5)},${pickup.lng.toFixed(5)};${drop.lat.toFixed(5)},${drop.lng.toFixed(5)}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey) || [];
  }

  try {
    const res = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
    );

    if (!res.ok) {
      handleMapboxError(res, "Failed to calculate route and directions.");
      return [];
    }

    const data = await res.json();
    const coords = data.routes?.[0]?.geometry?.coordinates;
    if (!coords) return [];

    // Mapbox returns [lng, lat] - MapPanelInner expects [lat, lng]
    const routeCoords: [number, number][] = coords.map(([lng, lat]: [number, number]) => [lat, lng]);
    routeCache.set(cacheKey, routeCoords);

    return routeCoords;
  } catch (err: unknown) {
    console.error("getRouteCoordinates error:", err);
    useNotificationStore.getState().addNotification("error", "Failed to calculate directions due to a network error.");
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  if (!verifyToken()) return "";

  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&limit=1`
    );

    if (!res.ok) {
      return "";
    }

    const data = await res.json();
    return data.features?.[0]?.place_name || "";
  } catch (err) {
    console.error("reverseGeocode error:", err);
    return "";
  }
}
