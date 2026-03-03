// FILE: /frontend/src/api/studentApi.js
import api from './axiosInstance';

export const getProfile = () => api.get('/student/profile');
export const getTimetable = () => api.get('/student/timetable');
export const getGrades = () => api.get('/student/grades');
export const submitMarkComplaint = (data) => api.post('/student/complaints', data);