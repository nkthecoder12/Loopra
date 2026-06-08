import { ORS_API_KEY } from "@/lib/config";
import { useNotificationStore } from "@/store/useNotificationStore";

export interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

let keyErrorShown = false;

function handleOrsError(res: Response, fallbackMessage: string) {
  let errorMsg = fallbackMessage;
  if (res.status === 401 || res.status === 403) {
    errorMsg = "OpenRouteService API key is invalid or unauthorized. Map routing and location search will not function.";
  } else if (res.status === 429) {
    errorMsg = "OpenRouteService API rate limit exceeded. Please wait a moment and try again.";
  }
  useNotificationStore.getState().addNotification("error", errorMsg);
}

function verifyApiKey(): boolean {
  if (!ORS_API_KEY) {
    if (!keyErrorShown) {
      keyErrorShown = true;
      useNotificationStore.getState().addNotification(
        "error",
        "OpenRouteService API key is missing. Location autocomplete search and map route rendering will not function properly.",
        10000
      );
    }
    return false;
  }
  return true;
}

export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  if (!query.trim()) return [];
  if (!verifyApiKey()) return [];

  try {
    const params = new URLSearchParams({
      api_key: ORS_API_KEY,
      text: query,
      "boundary.country": "IN",
      size: "5",
    });

    const res = await fetch(
      `https://api.openrouteservice.org/geocode/autocomplete?${params}`
    );

    if (!res.ok) {
      handleOrsError(res, "Failed to fetch place search autocomplete results.");
      return [];
    }

    const data = await res.json();
    const features = data.features || [];

    return features.map((feature: { properties: { label?: string }; geometry: { coordinates: [number, number] } }) => ({
      label: feature.properties.label || "",
      lng: feature.geometry.coordinates[0],
      lat: feature.geometry.coordinates[1],
    }));
  } catch (err: any) {
    console.error("searchPlaces error:", err);
    useNotificationStore.getState().addNotification("error", "Place search failed due to a network error.");
    return [];
  }
}

export async function getRouteCoordinates(
  pickup: { lat: number; lng: number },
  drop: { lat: number; lng: number }
): Promise<[number, number][]> {
  if (!verifyApiKey()) return [];

  try {
    const res = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        method: "POST",
        headers: {
          Authorization: ORS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates: [
            [pickup.lng, pickup.lat],
            [drop.lng, drop.lat],
          ],
        }),
      }
    );

    if (!res.ok) {
      handleOrsError(res, "Failed to calculate route and directions.");
      return [];
    }

    const data = await res.json();
    const coords = data.features?.[0]?.geometry?.coordinates;
    if (!coords) return [];

    return coords.map(([lng, lat]: [number, number]) => [lat, lng]);
  } catch (err: any) {
    console.error("getRouteCoordinates error:", err);
    useNotificationStore.getState().addNotification("error", "Failed to calculate directions due to a network error.");
    return [];
  }
}
