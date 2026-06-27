import api from '@/lib/api';

export const userService = {
  getProfile: async () => {
    const { data } = await api.get('/users/profile');
    return data;
  },

  updateProfile: async (profileData: Record<string, unknown>) => {
    const { data } = await api.put('/users/profile', profileData);
    return data;
  }
};
