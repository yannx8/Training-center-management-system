// FILE: /frontend/src/api/studentApi.js
import api from './axiosInstance';

export const getDashboard = () => api.get('/student/dashboard');
export const getEnrollments = () => api.get('/student/enrollments');

// Academic timetable
export const getTimetable = (params) => api.get('/student/timetable', { params });
export const getStudentWeeks = () => api.get('/student/timetable/weeks');

// Certification timetable (read-only, shown after timetable is generated)
export const getCertTimetable = (params) => api.get('/student/cert-timetable', { params });
export const getCertTimetableWeeks = () => api.get('/student/cert-timetable/weeks');

// Cert availability
// - getCertAvailabilityWeeks: returns latest published cert week per cert enrolled
// - submit/delete: manage availability for that week
export const getCertAvailabilityWeeks = () => api.get('/student/cert-availability/weeks');
export const getCertAvailability = (params) => api.get('/student/cert-availability', { params });
export const submitCertAvailability = (data) => api.post('/student/cert-availability', data);
export const deleteCertAvailability = (id) => api.delete(`/student/cert-availability/${id}`);

// Grades
export const getGrades = (params) => api.get('/student/grades', { params });
export const getGradePeriods = () => api.get('/student/grades/periods');
export const getCoursesWithGrades = () => api.get('/student/courses');

// Complaints
export const getComplaints = () => api.get('/student/complaints');
export const submitComplaint = (data) => api.post('/student/complaints', data);

// Announcements
export const getAnnouncements = () => api.get('/student/announcements');
