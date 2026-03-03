// FILE: /frontend/src/api/secretaryApi.js
import axiosInstance from './axiosInstance';

export const secretaryApi = {
    registerStudent: (data) => axiosInstance.post('/secretary/register-student', data),
    getStudents: (params) => axiosInstance.get('/secretary/students', { params }),
    getParents: () => axiosInstance.get('/secretary/parents'),
    getPrograms: () => axiosInstance.get('/secretary/programs'),
    getCertifications: () => axiosInstance.get('/secretary/certifications'),
};