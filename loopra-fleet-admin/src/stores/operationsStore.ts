import { create } from 'zustand';

export interface DriverPin {
  _id: string;
  name: string;
  phone: string;
  isAvailable: boolean;
  onboardingStatus: string;
  location: {
    coordinates: [number, number]; // [lng, lat]
  };
  vehicle?: {
    type: string;
    number: string;
  };
}

export interface ActiveRide {
  _id: string;
  userId: {
    _id: string;
    name: string;
  };
  driverId?: {
    _id: string;
    name: string;
    phone: string;
  };
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
  type: string;
  scheduledAt?: string;
}

interface OperationsState {
  isConnected: boolean;
  drivers: DriverPin[];
  rides: ActiveRide[];
  setConnected: (connected: boolean) => void;
  setDrivers: (drivers: DriverPin[]) => void;
  setRides: (rides: ActiveRide[]) => void;
  updateDriverLocation: (driverId: string, lng: number, lat: number) => void;
  updateRideStatus: (rideId: string, status: string) => void;
  removeRide: (rideId: string) => void;
}

export const useOperationsStore = create<OperationsState>((set) => ({
  isConnected: false,
  drivers: [],
  rides: [],

  setConnected: (connected) => set({ isConnected: connected }),
  setDrivers: (drivers) => set({ drivers }),
  setRides: (rides) => set({ rides }),

  updateDriverLocation: (driverId, lng, lat) => set((state) => {
    const updatedDrivers = state.drivers.map((d) => {
      if (d._id === driverId) {
        return {
          ...d,
          location: {
            ...d.location,
            coordinates: [lng, lat] as [number, number]
          }
        };
      }
      return d;
    });
    return { drivers: updatedDrivers };
  }),

  updateRideStatus: (rideId, status) => set((state) => {
    const updatedRides = state.rides.map((r) => {
      if (r._id === rideId) {
        return { ...r, status };
      }
      return r;
    });
    return { rides: updatedRides };
  }),

  removeRide: (rideId) => set((state) => {
    const remaining = state.rides.filter(r => r._id !== rideId);
    return { rides: remaining };
  })
}));
