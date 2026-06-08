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
  vehicle?: string;
  location?: { lat: number; lng: number };
}

export interface RideInfo {
  id: string;
  _id?: string;
  status: BackendRideStatus;
  pickup?: Location;
  drop?: Location;
  pickupLocation?: Location;
  dropLocation?: Location;
  driver?: DriverInfo | null;
  scheduledTime?: string;
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
  
  setActiveRide: (ride) => set({ activeRide: ride }),
  setReturnRide: (ride) => set({ returnRide: ride }),
  setRoundTrip: (isRoundTrip) => set({ isRoundTrip }),
  
  updateRideFromSocket: (updates) => set((state) => ({
    activeRide: state.activeRide ? { ...state.activeRide, ...updates } : null
  })),
  
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
