import api from '../utils/api';

export const progressService = {
  getCourseProgress: async (courseId: string) => {
    const response = await api.get(`/progress/${courseId}`);
    return response.data;
  },
  updateProgress: async (data: { 
    courseId: string; 
    lessonId: string; 
    status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'; 
    isVideoCompleted?: boolean;
    lastWatchedSecond?: number 
  }) => {
    const response = await api.patch('/progress', data);
    return response.data;
  }
};
