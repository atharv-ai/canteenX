import axios from 'axios';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Dynamically match frontend host (127.0.0.1 or localhost)
    const host = window.location.hostname;
    return `http://${host}:8000`;
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token
api.interceptors.request.use((config) => {
  // Always ensure baseURL matches current window host
  config.baseURL = getBaseUrl();
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - handle 401, refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (refresh) {
          const { data } = await axios.post(`${getBaseUrl()}/api/auth/token/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        }
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
