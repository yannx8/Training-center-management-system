// FILE: /frontend/src/api/parentApi.js
import api from './axiosInstance';

export const getMyStudents = () => api.get('/parent/students');
export const getStudentProfile = (id) => api.get(`/parent/students/${id}/profile`);
export const getStudentGrades = (id) => api.get(`/parent/students/${id}/grades`);
export const getStudentTimetable = (id) => api.get(`/parent/students/${id}/timetable`);
export const submitComplaint = (data) => api.post('/parent/complaints', data);
export const getAnnouncements = () => api.get('/parent/announcements');
