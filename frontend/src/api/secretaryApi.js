// FILE: /frontend/src/api/secretaryApi.js
import api from './axiosInstance';

export const registerStudent = (data) => api.post('/secretary/register-student', data);
export const getStudents = (params) => api.get('/secretary/students', { params });
export const getParents = () => api.get('/secretary/parents');
export const getPrograms = () => api.get('/secretary/programs');
export const getCertifications = () => api.get('/secretary/certifications');