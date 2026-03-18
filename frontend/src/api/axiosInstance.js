// FILE: src/api/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Attach JWT token from localStorage automatically
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('tcms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tcms_token');
      localStorage.removeItem('tcms_role');
      localStorage.removeItem('tcms_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;
