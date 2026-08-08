import axios from 'axios';
import { useNotificationStore } from '@/stores/notificationStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('fleet_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fleet_token');
        localStorage.removeItem('fleet_user');
        window.location.href = '/login';
      }
    } else {
      useNotificationStore.getState().addToast('error', message);
    }

    return Promise.reject(error);
  }
);

export default api;
