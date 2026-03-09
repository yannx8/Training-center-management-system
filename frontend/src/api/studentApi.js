// frontend/src/api/studentApi.js
import api from './axiosInstance';

export const getProfile = () => api.get('/student/profile');
export const getEnrollments = () => api.get('/student/enrollments');

// Academic timetable
export const getTimetable = (params) => api.get('/student/timetable', { params });
export const getTimetableWeeks = () => api.get('/student/timetable/weeks');

// Certification timetable — full history (all sessions, all weeks)
export const getCertTimetable = (params) => api.get('/student/cert-timetable', { params });
export const getCertTimetableWeeks = () => api.get('/student/cert-timetable/weeks');
export const getAllCertWeeks = () => api.get('/student/cert-weeks/all');

// Cert availability — latest published week per cert only
export const getCertAvailabilityWeeks = () => api.get('/student/cert-availability/weeks');
export const getCertAvailability = (params) => api.get('/student/cert-availability', { params });
export const submitCertAvailability = (data) => api.post('/student/cert-availability', data);
export const deleteCertAvailability = (id) => api.delete(`/student/cert-availability/${id}`);

// Grades
export const getGrades = (params) => api.get('/student/grades', { params });
export const getGradePeriods = () => api.get('/student/grades/periods');

// Complaints
export const getComplaints = () => api.get('/student/complaints');
export const submitComplaint = (data) => api.post('/student/complaints', data);

// Announcements
export const getAnnouncements = () => api.get('/student/announcements');