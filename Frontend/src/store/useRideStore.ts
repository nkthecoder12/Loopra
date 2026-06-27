import { create } from 'zustand';

export type BackendRideStatus = 'REQUESTED' | 'DRIVER_ASSIGNED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface Location {
  address: string;
  lat: number;
  lng: number;
}

export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  vehicleDetails: string;
  vehicle?: string | { type: string; number: string };
  location?: { lat: number; lng: number };
}

export interface RideInfo {
  id?: string;
  _id?: string;
  rideId?: string;
  status: BackendRideStatus;
  pickup?: Location;
  drop?: Location;
  pickupLocation?: Location;
  dropLocation?: Location;
  driver?: DriverInfo | null;
  scheduledTime?: string;
  scheduledAt?: string;
  fare?: number;
  advancePaid?: number;
  type: 'INSTANT' | 'SCHEDULED';
  otp?: string;
  finalFare?: number;
  parentRideId?: string;
}

interface RideState {
  activeRide: RideInfo | null;
  returnRide: RideInfo | null; // For round trips
  isRoundTrip: boolean;
  
  // Strict rule: Only set completely from API/Socket, no partial local mutations of status
  setActiveRide: (ride: RideInfo | null) => void;
  setReturnRide: (ride: RideInfo | null) => void;
  setRoundTrip: (isRoundTrip: boolean) => void;
  
  // Update from socket event
  updateRideFromSocket: (updates: Partial<RideInfo>) => void;
  updateDriverLocation: (lat: number, lng: number) => void;
  
  reset: () => void;
}

export const useRideStore = create<RideState>((set) => ({
  activeRide: null,
  returnRide: null,
  isRoundTrip: false,
  
  setActiveRide: (ride) => {
    if (ride) {
      if (ride.rideId) {
        if (!ride._id) ride._id = ride.rideId;
        if (!ride.id) ride.id = ride.rideId;
      }
      if (ride._id && !ride.id) ride.id = ride._id;
      if (ride.id && !ride._id) ride._id = ride.id;
    }
    set({ activeRide: ride });
  },
  setReturnRide: (ride) => {
    if (ride) {
      if (ride.rideId) {
        if (!ride._id) ride._id = ride.rideId;
        if (!ride.id) ride.id = ride.rideId;
      }
      if (ride._id && !ride.id) ride.id = ride._id;
      if (ride.id && !ride._id) ride._id = ride.id;
    }
    set({ returnRide: ride });
  },
  setRoundTrip: (isRoundTrip) => set({ isRoundTrip }),
  
  updateRideFromSocket: (updates) => set((state) => {
    const newUpdates = { ...updates };
    if (newUpdates.rideId) {
      if (!newUpdates._id) newUpdates._id = newUpdates.rideId;
      if (!newUpdates.id) newUpdates.id = newUpdates.rideId;
    }
    if (newUpdates._id && !newUpdates.id) newUpdates.id = newUpdates._id;
    if (newUpdates.id && !newUpdates._id) newUpdates._id = newUpdates.id;

    const updatedRide = state.activeRide ? { ...state.activeRide, ...newUpdates } : null;
    if (updatedRide) {
      if (updatedRide.rideId) {
        if (!updatedRide._id) updatedRide._id = updatedRide.rideId;
        if (!updatedRide.id) updatedRide.id = updatedRide.rideId;
      }
      if (updatedRide._id && !updatedRide.id) updatedRide.id = updatedRide._id;
      if (updatedRide.id && !updatedRide._id) updatedRide._id = updatedRide.id;
    }
    return { activeRide: updatedRide };
  }),
  
  updateDriverLocation: (lat, lng) => set((state) => {
    if (state.activeRide && state.activeRide.driver) {
      return {
        activeRide: {
          ...state.activeRide,
          driver: {
            ...state.activeRide.driver,
            location: { lat, lng }
          }
        }
      };
    }
    return state;
  }),
  
  reset: () => set({
    activeRide: null,
    returnRide: null,
    isRoundTrip: false
  }),
}));
