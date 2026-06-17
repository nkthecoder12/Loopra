import { jwtDecode } from 'jwt-decode';
import { useAuthStore } from '@/store/useAuthStore';

interface DecodedToken {
  id: string;
  role: string;
  exp: number;
}

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch (error) {
    return null;
  }
};

export const isTokenValid = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return false;
  // exp is in seconds, Date.now() is in ms
  return decoded.exp * 1000 > Date.now();
};

export const handleAutoLogout = () => {
  // Access store outside components safely
  useAuthStore.getState().clearCredentials();
  window.location.href = '/login';
};
