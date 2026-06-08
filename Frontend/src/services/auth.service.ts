import api from '@/lib/api';

export const authService = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data; // { token, user }
  },

  signup: async (userData: { name: string; email: string; password: string }) => {
    const { data } = await api.post('/auth/signup', userData);
    return data;
  },

  // Issue #6: was /auth/send-otp — backend aliases both, but also fixing to use /sendotp
  sendOTP: async (email: string) => {
    const { data } = await api.post('/auth/send-otp', { email });
    return data;
  },

  // Issue #7: was /auth/verify-otp — backend now supports both
  verifyOTP: async (email: string, otp: string) => {
    const { data } = await api.post('/auth/verify-otp', { email, otp });
    return data; // { token, user }
  },

  // Issue #5: getMe for session hydration
  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data; // { user: { id, name, email, role, profileImage } }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Backend logout failed, proceeding with local logout.');
    }
  },
};
