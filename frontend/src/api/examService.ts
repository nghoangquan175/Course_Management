import api from '../utils/api';

export const examService = {
  getLessonExam: async (lessonId: string) => {
    const response = await api.get(`/exams/lesson/${lessonId}`);
    return response.data;
  },

  submitExam: async (examId: string, answers: Record<string, number>) => {
    const response = await api.post('/exams/submit', { examId, answers });
    return response.data;
  },

  getMyResults: async () => {
    const response = await api.get('/exams/my-results');
    return response.data;
  },

  getResultById: async (resultId: string) => {
    const response = await api.get(`/exams/result/${resultId}`);
    return response.data;
  },

  upsertExam: async (data: any) => {
    const response = await api.post('/exams/upsert', data);
    return response.data;
  },
};
