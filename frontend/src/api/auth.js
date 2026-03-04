import api from './axios';

// Auth-related API calls
export const login = (credentials) => api.post('/auth/login', credentials);
export const selectRole = (data) => api.post('/auth/select-role', data);