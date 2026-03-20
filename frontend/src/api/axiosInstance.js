import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 15000,
});

// Attach JWT
axiosInstance.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 errors
axiosInstance.interceptors.response.use(
    res => res,
    err => {
        if (err.response && err.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default axiosInstance;