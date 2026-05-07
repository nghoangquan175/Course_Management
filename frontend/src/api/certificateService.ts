import api from '../utils/api';

export const certificateService = {
  generateCertificate: async (courseId: string) => {
    const response = await api.post('/certificates/generate', { courseId });
    return response.data;
  },
  getCertificate: async (courseId: string) => {
    const response = await api.get(`/certificates/${courseId}`);
    return response.data;
  }
};
