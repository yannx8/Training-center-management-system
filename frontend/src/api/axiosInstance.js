// FILE: /frontend/src/api/axiosInstance.js
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        // FIX: Rewritten to avoid optional chaining syntax that your formatter breaks
        // Instead of "err.response?.status", we check "err.response && err.response.status"
        if (err.response && err.response.status === 401) {
            sessionStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;