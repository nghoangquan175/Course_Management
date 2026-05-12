import api from '../utils/api';

export const instructorService = {
  getStudents: async () => {
    const response = await api.get('/instructor/students');
    return response.data;
  },
  getStats: async () => {
    const { data } = await api.get('/instructor/stats');
    return data;
  },
  requestEdit: async (courseId: string, reason: string) => {
    const { data } = await api.post(`/instructor/courses/${courseId}/request-edit`, { reason });
    return data;
  },
};
