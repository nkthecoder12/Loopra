// Issue #8: Replace hardcoded distance with real Haversine calculation
const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // km
};

const BASE_FARE = 50;
const COST_PER_KM = 10;
const COST_PER_MIN = 2;
const AVG_SPEED_KMH = 30; // city average

/**
 * Estimate fare, distance and ETA from coordinates
 * @param {Object} params - { pickupLat, pickupLng, dropLat, dropLng }
 * @returns {{ fare: number, distanceKm: number, etaMin: number }}
 */
const estimateFare = ({ pickupLat, pickupLng, dropLat, dropLng }) => {
  const distanceKm = calculateDistanceKm(pickupLat, pickupLng, dropLat, dropLng);
  const etaMin = Math.ceil((distanceKm / AVG_SPEED_KMH) * 60);
  const fare = Math.round(BASE_FARE + distanceKm * COST_PER_KM + etaMin * COST_PER_MIN);

  return { fare, distanceKm: parseFloat(distanceKm.toFixed(2)), etaMin };
};

module.exports = { estimateFare, calculateDistanceKm };