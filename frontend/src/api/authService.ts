import api from '../utils/api';

export const authService = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  adminLogin: (data: any) => api.post('/auth/admin/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  activate: (token: string) => api.get(`/auth/activate/${token}`),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: any) => api.post(`/auth/reset-password/${token}`, { password }),
  getProfile: () => api.get('/auth/me'),
};

export default api;
