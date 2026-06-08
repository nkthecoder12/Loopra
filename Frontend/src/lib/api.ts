import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';
import { handleAutoLogout } from '@/utils/jwt';
import { useNotificationStore } from '@/store/useNotificationStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || 'Something went wrong';

    if (status === 401) {
      handleAutoLogout();
    } else if (status === 403) {
      window.location.href = '/dashboard';
    }
    
    // Global error toast
    if (!status || status >= 400) {
      useNotificationStore.getState().addNotification('error', message);
    }
    console.error(`[API Error ${status || 'Network'}]:`, message);

    return Promise.reject(error);
  }
);

export default api;
