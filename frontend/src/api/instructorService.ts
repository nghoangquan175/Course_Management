import api from '../utils/api';

export const instructorService = {
  getStudents: async () => {
    const response = await api.get('/instructor/students');
    return response.data;
  },
};
