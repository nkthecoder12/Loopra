import { create } from 'zustand';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  fleetId: string | null;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: (token, user) => {
    localStorage.setItem('fleet_token', token);
    localStorage.setItem('fleet_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('fleet_token');
    localStorage.removeItem('fleet_user');
    set({ token: null, user: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  initialize: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('fleet_token');
      const userStr = localStorage.getItem('fleet_user');
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ token, user, isAuthenticated: true });
        } catch (_) {
          localStorage.removeItem('fleet_token');
          localStorage.removeItem('fleet_user');
        }
      }
    }
  }
}));
