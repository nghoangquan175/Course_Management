import api from '../utils/api';

export const notificationService = {
  getNotifications: async (role: string) => {
    const response = await api.get('/notifications', {
      params: { role },
    });
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (role: string) => {
    const response = await api.patch('/notifications/read-all', { role });
    return response.data;
  },

  sendAdminNotification: async (data: any) => {
    const response = await api.post('/notifications/admin-send', data);
    return response.data;
  },
};
