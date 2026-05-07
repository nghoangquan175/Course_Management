import api from '../utils/api';

export interface Category {
  id: string;
  name: string;
}

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    const response = await api.get('/categories');
    return response.data;
  },
};
