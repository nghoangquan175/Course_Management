import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

// Request interceptor to add the access token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only try to refresh if it's a 401 error NOT from a login or refresh request
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/admin/login') &&
      originalRequest.url !== '/auth/refresh'
    ) {
      originalRequest._retry = true;

      try {
        // We use a separate axios instance for refresh to avoid interceptor loop
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { accessToken } = response.data;

        // Save new token to localStorage
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        // Dispatch event for AuthContext to handle logout
        window.dispatchEvent(new Event('auth:unauthorized'));

        // Force redirect to login page
        const isAdminPath = window.location.pathname.startsWith('/admin');
        const loginPath = isAdminPath ? '/admin/login' : '/login';

        // We use window.location.href for a hard redirect to clear all states
        // but only if we are not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = `${loginPath}?expired=true`;
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
