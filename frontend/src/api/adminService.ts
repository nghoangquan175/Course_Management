import api from '../utils/api';

export const adminService = {
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },
};
