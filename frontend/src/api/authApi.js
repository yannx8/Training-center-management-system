// FILE: /frontend/src/api/authApi.js
import api from './axiosInstance';

export const loginApi = (email, password) =>
    api.post('/auth/login', { email, password });

export const selectRoleApi = (userId, roleId) =>
    api.post('/auth/select-role', { userId, roleId });

export const changePasswordApi = (newPassword) =>
    api.post('/auth/change-password', { newPassword });