// frontend/src/api/trainerApi.js
import api from './axiosInstance';

export const getCourses = () => api.get('/trainer/courses');
export const getCertifications = () => api.get('/trainer/certifications');
export const getCourseStudents = (courseId) => api.get(`/trainer/courses/${courseId}/students`);
export const getCertificationStudents = (certId) => api.get(`/trainer/certifications/${certId}/students`);
export const submitGrades = (data) => api.post('/trainer/grades', data);
export const getMarkComplaints = () => api.get('/trainer/complaints');
export const reviewMarkComplaint = (id, data) => api.put(`/trainer/complaints/${id}/review`, data);

// Trainer combined timetable (academic + cert, read-only)
export const getTimetable = (params) => api.get('/trainer/timetable', { params });
export const getTrainerWeeks = () => api.get('/trainer/timetable/weeks');

// Availability for HOD-published academic weeks
export const getPublishedWeeks = () => api.get('/trainer/availability/published-weeks');
export const getActiveWeekForAvailability = () => api.get('/trainer/availability/active-week');
export const getAvailability = (params) => api.get('/trainer/availability', { params });
export const submitAvailability = (data) => api.post('/trainer/availability', data);
export const deleteAvailability = (id) => api.delete(`/trainer/availability/${id}`);

// Certification week management (trainer creates + publishes)
export const getCertWeeks = (certId) => api.get(`/trainer/cert-weeks/${certId}`);
export const getLatestPublishedCertWeek = (certId) => api.get(`/trainer/cert-weeks/${certId}/latest-published`);
export const createCertWeek = (data) => api.post('/trainer/cert-weeks', data);
export const publishCertWeek = (weekId) => api.put(`/trainer/cert-weeks/${weekId}/publish`);

// Certification timetable (trainer generates + views read-only)
export const generateCertTimetable = (data) => api.post('/trainer/cert-timetable/generate', data);
export const getCertTimetables = () => api.get('/trainer/cert-timetables');
export const getCertTimetableSlots = (certId, weekId) => api.get(`/trainer/cert-timetable/${certId}/${weekId}`);

// Announcements
export const getAnnouncements = () => api.get('/trainer/announcements');