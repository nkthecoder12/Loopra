export interface ServiceAreaConfig {
  cityName: string;
  defaultCenter: [number, number]; // [lng, lat]
  boundingBox: {
    southWest: [number, number]; // [lng, lat]
    northEast: [number, number]; // [lng, lat]
  };
  biasLocation: {
    lat: number;
    lng: number;
  };
  zoom: {
    default: number;
    min: number;
    max: number;
  };
  supportedCategories: string[];
}

export const SERVICE_AREA: ServiceAreaConfig = {
  cityName: "Coimbatore",
  defaultCenter: [76.9558, 11.0168], // [lng, lat]
  boundingBox: {
    southWest: [76.84, 10.90],
    northEast: [77.12, 11.12],
  },
  biasLocation: {
    lat: 11.0168,
    lng: 76.9558,
  },
  zoom: {
    default: 13,
    min: 11,
    max: 20,
  },
  supportedCategories: [
    "Colleges & Universities",
    "IT Parks & Companies",
    "Hospitals",
    "Bus Stops",
    "Railway Station",
    "Airport",
    "Shopping Malls & Hotels",
    "Residential Areas",
  ],
};

export function isLocationInServiceArea(lat: number, lng: number): boolean {
  const { southWest, northEast } = SERVICE_AREA.boundingBox;
  return (
    lng >= southWest[0] &&
    lng <= northEast[0] &&
    lat >= southWest[1] &&
    lat <= northEast[1]
  );
}
