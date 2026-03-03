// FILE: /frontend/src/api/trainerApi.js
import api from './axiosInstance';

export const getCourses = () => api.get('/trainer/courses');
export const getCertifications = () => api.get('/trainer/certifications');
export const getCourseStudents = (courseId) => api.get(`/trainer/courses/${courseId}/students`);
export const getCertificationStudents = (certId) => api.get(`/trainer/certifications/${certId}/students`);
export const submitGrades = (data) => api.post('/trainer/grades', data);
export const getMarkComplaints = () => api.get('/trainer/complaints');
export const reviewMarkComplaint = (id, data) => api.put(`/trainer/complaints/${id}`, data);
export const getTimetable = () => api.get('/trainer/timetable');
export const submitAvailability = (data) => api.post('/trainer/availability', data);
export const getAvailability = () => api.get('/trainer/availability');
export const deleteAvailability = (id) => api.delete(`/trainer/availability/${id}`);