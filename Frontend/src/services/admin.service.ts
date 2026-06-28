import api from '@/lib/api';

export const adminService = {
  getUsers: async (page = 1, limit = 10) => {
    const { data } = await api.get('/admin/users', { params: { page, limit } });
    return data;
  },

  getDrivers: async (page = 1, limit = 10, status?: string) => {
    const { data } = await api.get('/admin/drivers', { params: { page, limit, status } });
    return data;
  },

  getDriverApplications: async (page = 1, limit = 10, status?: string, search?: string) => {
    const { data } = await api.get('/admin/driver-applications', { params: { page, limit, status, search } });
    return data;
  },

  getDriverApplicationById: async (id: string) => {
    const { data } = await api.get(`/admin/driver-applications/${id}`);
    return data;
  },

  verifyDocument: async (id: string, docKey: string, verificationStatus: 'APPROVED' | 'RE_UPLOAD_REQUIRED', reviewNotes?: string) => {
    const { data } = await api.post(`/admin/driver-applications/${id}/verify-document`, { docKey, verificationStatus, reviewNotes });
    return data;
  },

  approveDriverApplication: async (id: string) => {
    const { data } = await api.post(`/admin/driver-applications/${id}/approve`);
    return data;
  },

  rejectDriverApplication: async (id: string, reason: string) => {
    const { data } = await api.post(`/admin/driver-applications/${id}/reject`, { reason });
    return data;
  },

  requestChangesDriverApplication: async (id: string, comments: string) => {
    const { data } = await api.post(`/admin/driver-applications/${id}/request-changes`, { comments });
    return data;
  },

  updateDriverLifecycle: async (id: string, action: 'SUSPEND' | 'REACTIVATE' | 'DEACTIVATE' | 'SOFT_DELETE', reason?: string) => {
    const { data } = await api.patch(`/admin/drivers/${id}/lifecycle`, { action, reason });
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
