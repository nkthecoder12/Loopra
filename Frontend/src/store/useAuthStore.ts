import { create } from 'zustand';

export interface User {
  id: string;
  name?: string;
  email: string;
  role: 'USER' | 'DRIVER' | 'ADMIN';
  profileImage?: string;
  isVerified?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  setCredentials: (user: User, token: string) => void;
  clearCredentials: () => void;
  setHydrating: (hydrating: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isHydrating: true,
  setCredentials: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true, isHydrating: false });
  },
  clearCredentials: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, isHydrating: false });
  },
  setHydrating: (hydrating) => set({ isHydrating: hydrating }),
}));
