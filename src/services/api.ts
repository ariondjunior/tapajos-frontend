import axios from 'axios';

const baseURL =
  (import.meta as any)?.env?.VITE_API_URL ??
  (process.env as any)?.REACT_APP_API_URL ??
  'http://localhost:8080';

const api = axios.create({
  baseURL,
  headers: { Accept: 'application/json' },
  timeout: 15000,
  withCredentials: false,
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    console.error('API error:', {
      url: `${err.config?.baseURL || ''}${err.config?.url || ''}`,
      method: err.config?.method,
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return Promise.reject(err);
  }
);

export default api;