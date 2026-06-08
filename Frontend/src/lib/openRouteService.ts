const ORS_API_KEY = process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY || "";

export interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

export async function searchPlaces(query: string): Promise<GeocodeResult[]> {
  if (!query.trim() || !ORS_API_KEY) return [];

  const params = new URLSearchParams({
    api_key: ORS_API_KEY,
    text: query,
    "boundary.country": "IN",
    size: "5",
  });

  const res = await fetch(
    `https://api.openrouteservice.org/geocode/autocomplete?${params}`
  );

  if (!res.ok) return [];

  const data = await res.json();
  const features = data.features || [];

  return features.map((feature: { properties: { label?: string }; geometry: { coordinates: [number, number] } }) => ({
    label: feature.properties.label || "",
    lng: feature.geometry.coordinates[0],
    lat: feature.geometry.coordinates[1],
  }));
}

export async function getRouteCoordinates(
  pickup: { lat: number; lng: number },
  drop: { lat: number; lng: number }
): Promise<[number, number][]> {
  if (!ORS_API_KEY) return [];

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

  if (!res.ok) return [];

  const data = await res.json();
  const coords = data.features?.[0]?.geometry?.coordinates;
  if (!coords) return [];

  return coords.map(([lng, lat]: [number, number]) => [lat, lng]);
}
