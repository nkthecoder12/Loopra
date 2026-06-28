import api from '@/lib/api';

export const driverService = {
  getEarnings: async () => {
    try {
      const { data } = await api.get('/driver/earnings');
      return data;
    } catch (err) {
      console.warn('Driver earnings fetch failed:', err);
      return null;
    }
  },

  toggleAvailability: async (isOnline: boolean) => {
    const { data } = await api.patch('/driver/status', { isOnline });
    return data;
  },

  getStatus: async () => {
    try {
      const { data } = await api.get('/driver/status');
      return data;
    } catch (error: unknown) {
      const errObj = error as { response?: { status?: number } };
      if (errObj.response?.status === 404) return null;
      throw error;
    }
  },

  getApplication: async () => {
    try {
      const { data } = await api.get('/driver/application');
      return data;
    } catch (error: unknown) {
      const errObj = error as { response?: { status?: number } };
      if (errObj.response?.status === 404) return null;
      throw error;
    }
  },

  submitApplication: async (formData: FormData) => {
    const { data } = await api.post('/driver/application', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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

  startRide: async (rideId: string, otp: string) => {
    const { data } = await api.post(`/rides/${rideId}/start`, { otp });
    return data;
  },

  completeRide: async (rideId: string) => {
    const { data } = await api.post(`/rides/${rideId}/complete`);
    return data;
  },

  respondToAdvanceOffer: async (rideId: string, acceptRideA: boolean, acceptRideB: boolean) => {
    const { data } = await api.post(`/advance-rides/${rideId}/driver-response`, { acceptRideA, acceptRideB });
    return data;
  },

  onboard: async (formData: FormData) => {
    const { data } = await api.post('/driver/onboard', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};
