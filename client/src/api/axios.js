import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.MODE === 'production' ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api'),
  withCredentials: true,
});

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized (Token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const baseURL = import.meta.env.MODE === 'production' ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5001/api');
          const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
          
          if (res.data.success) {
            localStorage.setItem('accessToken', res.data.data.accessToken);
            localStorage.setItem('refreshToken', res.data.data.refreshToken);
            
            originalRequest.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh token failed, clear storage and logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
