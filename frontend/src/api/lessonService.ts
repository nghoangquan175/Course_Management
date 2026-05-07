import api from '../utils/api';

export const lessonService = {
  getCourseLessons: async (courseId: string) => {
    const response = await api.get(`/lessons/course/${courseId}`);
    return response.data;
  },

  createLesson: async (data: any) => {
    const response = await api.post('/lessons', data);
    return response.data;
  },

  updateLesson: async (id: string, data: any) => {
    const response = await api.patch(`/lessons/${id}`, data);
    return response.data;
  },

  deleteLesson: async (id: string) => {
    const response = await api.delete(`/lessons/${id}`);
    return response.data;
  },

  reorderLessons: async (courseId: string, lessonOrders: { id: string; order: number }[]) => {
    const response = await api.put(`/lessons/course/${courseId}/reorder`, { lessonOrders });
    return response.data;
  },
};
