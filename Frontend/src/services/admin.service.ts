import api from '@/lib/api';

export const adminService = {
  getUsers: async (page = 1, limit = 10) => {
    const { data } = await api.get('/admin/users', { params: { page, limit } });
    return data;
  },

  getDrivers: async (page = 1, limit = 10) => {
    const { data } = await api.get('/admin/drivers', { params: { page, limit } });
    return data;
  },

  approveDriver: async (driverId: string) => {
    const { data } = await api.post(`/admin/drivers/${driverId}/approve`);
    return data;
  },

  rejectDriver: async (driverId: string, reason?: string) => {
    const { data } = await api.post(`/admin/drivers/${driverId}/reject`, { reason });
    return data;
  }
};
