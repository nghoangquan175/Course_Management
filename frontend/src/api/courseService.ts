import api from '../utils/api';

export interface CourseCreateData {
  name: string;
  description: string;
  thumbnailUrl: string;
  categoryId: string;
}

export const courseService = {
  create: async (data: CourseCreateData) => {
    const response = await api.post('/courses', data);
    return response.data;
  },

  getAll: async (params?: { status?: string; categoryId?: string }) => {
    const response = await api.get('/courses', { params });
    return response.data;
  },

  getManagementAll: async (params?: { status?: string; categoryId?: string }) => {
    const response = await api.get('/courses/management', { params });
    return response.data;
  },

  getById: async (id: string, type?: string) => {
    const response = await api.get(`/courses/${id}`, { params: { type } });
    return response.data;
  },

  getManagementById: async (id: string) => {
    const response = await api.get(`/courses/management/${id}`);
    return response.data;
  },

  getLessonDetail: async (lessonId: string) => {
    const response = await api.get(`/courses/lessons/${lessonId}`);
    return response.data;
  },

  update: async (id: string, data: Partial<CourseCreateData> & { status?: string }) => {
    const response = await api.put(`/courses/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  restore: async (id: string) => {
    const response = await api.post(`/courses/${id}/restore`);
    return response.data;
  },

  submit: async (id: string) => {
    const response = await api.post(`/courses/${id}/submit`);
    return response.data;
  },

  withdraw: async (id: string) => {
    const response = await api.post(`/courses/${id}/withdraw`);
    return response.data;
  },

  approve: async (id: string) => {
    const response = await api.post(`/courses/${id}/approve`);
    return response.data;
  },

  reject: async (id: string, reason?: string) => {
    const response = await api.post(`/courses/${id}/reject`, { reason });
    return response.data;
  },

  publish: async (id: string, data?: any) => {
    const response = await api.post(`/courses/${id}/publish`, data);
    return response.data;
  },

  unpublish: async (id: string) => {
    const response = await api.post(`/courses/${id}/unpublish`);
    return response.data;
  },

  requestEdit: async (id: string, reason?: string) => {
    const response = await api.post(`/courses/${id}/request-edit`, { reason });
    return response.data;
  },
  enroll: async (id: string) => {
    const response = await api.post(`/courses/${id}/enroll`);
    return response.data;
  },
  getEnrolled: async () => {
    const response = await api.get('/courses/enrolled');
    return response.data;
  },
};
