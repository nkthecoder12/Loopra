import api from '@/lib/api';

export interface RideEstimate {
  fare: number;
  distanceKm: number;
  etaMin: number;
  vehicles: Array<{ id: string; name: string; price: number; eta: number }>;
}

export const rideService = {
  // Issue #9: POST /rides/estimate
  estimateRide: async (pickup: { lat: number; lng: number }, drop: { lat: number; lng: number }, signal?: AbortSignal): Promise<RideEstimate> => {
    const { data } = await api.post('/rides/estimate', { pickup, drop }, { signal });
    return data;
  },

  // Issue #10: was POST /rides → fixed to POST /rides/book
  createRide: async (rideData: {
    pickupLocation: { lat: number; lng: number; address: string };
    dropLocation: { lat: number; lng: number; address: string };
    vehicleType?: string;
    type?: string;
    scheduledAt?: string;
  }) => {
    const { data } = await api.post('/rides/book', rideData);
    return data; // { rideId, status, fare, distanceKm, etaMin, stateVersion }
  },

  // Issue #9: GET /rides/active
  getActiveRide: async () => {
    try {
      const { data } = await api.get('/rides/active');
      return data.ride ?? null;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },

  getRide: async (rideId: string) => {
    const { data } = await api.get(`/rides/${rideId}`);
    return data.ride;
  },

  cancelRide: async (rideId: string, reason?: string) => {
    const { data } = await api.post(`/rides/${rideId}/cancel`, { reason });
    return data;
  },

  acceptRide: async (rideId: string) => {
    const { data } = await api.post(`/rides/${rideId}/accept`);
    return data;
  },

  rejectRide: async (rideId: string) => {
    const { data } = await api.post(`/rides/${rideId}/reject`);
    return data;
  },

  // Issue #13: was /rides/:id/payment → fixed to /payments/:id/order
  createPaymentOrder: async (rideId: string) => {
    const { data } = await api.post(`/payments/${rideId}/order`);
    return data; // { orderId, amount, currency, key }
  },

  // Issue #14: was /rides/:id/payment/verify → fixed to /payments/verify
  verifyPayment: async (payload: any) => {
    const { data } = await api.post('/payments/verify', payload);
    return data;
  },

  submitRating: async (rideId: string, rating: number, comment: string) => {
    const { data } = await api.post(`/ratings/${rideId}`, { rating, comment });
    return data;
  },

  submitDriverRating: async (rideId: string, rating: number, comment: string) => {
    const { data } = await api.post(`/ratings/${rideId}/driver`, { rating, comment });
    return data;
  },

  // Advance ride
  bookAdvanceRide: async (body: { rideAId: string; pickupLocation: any; dropLocation: any; scheduledAt: string }) => {
    const { data } = await api.post('/advance-rides/book', body);
    return data;
  },

  createAdvancePaymentOrder: async (rideId: string) => {
    const { data } = await api.post(`/payments/advance/${rideId}/order`);
    return data;
  },

  verifyAdvancePayment: async (paymentData: any) => {
    const { data } = await api.post('/payments/advance/verify', paymentData);
    return data;
  },

  getRideHistory: async (page = 1, limit = 10) => {
    const { data } = await api.get(`/users/me/rides?page=${page}&limit=${limit}`);
    return data;
  },
};
