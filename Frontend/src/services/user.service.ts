import api from '@/lib/api';

export const userService = {
  getProfile: async () => {
    const { data } = await api.get('/users/me');
    return data.user;
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProfile: async (profileData: any) => {
    // TODO: Connect to backend PUT update endpoint when available.
    // Currently, backend userRoutes only support GET /me and GET /me/rides.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return profileData;
  }
};
