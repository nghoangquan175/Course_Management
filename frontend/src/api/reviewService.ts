import api from '../utils/api';

export const reviewService = {
  create: async (data: { courseId: string; rating: number; comment: string }) => {
    const response = await api.post('/reviews', data);
    return response.data;
  },
  
  getByCourse: async (courseId: string) => {
    const response = await api.get(`/reviews/course/${courseId}`);
    return response.data;
  }
};
