import axios from 'axios';
import { handleAutoLogout } from '@/utils/jwt';
import { useNotificationStore } from '@/store/useNotificationStore';
import { API_BASE_URL } from '@/lib/config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Auth uses Bearer token in localStorage (cross-origin safe on Vercel + Render)
  withCredentials: true,
  timeout: 30000,
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

    const isMuted404Url =
      status === 404 &&
      (error.config?.url?.includes('/rides/active') ||
       error.config?.url?.includes('/driver/status') ||
       error.config?.url?.includes('/driver/application'));

    if (status === 401) {
      handleAutoLogout();
    } else if (status === 403) {
      window.location.href = '/dashboard';
    }

    if (!isMuted404Url) {
      if (!status || status >= 400) {
        useNotificationStore.getState().addNotification('error', message);
      }
      console.error(`[API Error ${status || 'Network'}]:`, message);
    }

    return Promise.reject(error);
  }
);

export default api;
