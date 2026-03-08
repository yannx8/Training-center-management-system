// FILE: /frontend/src/api/hodApi.js
import api from './axiosInstance';

export const getDashboard = () => api.get('/hod/dashboard');
export const getPrograms = () => api.get('/hod/programs');

// Academic weeks
export const getAcademicWeeks = () => api.get('/hod/weeks');
export const getPublishedWeeks = () => api.get('/hod/weeks/published');
export const getLatestWeek = () => api.get('/hod/weeks/latest');
export const createAcademicWeek = (data) => api.post('/hod/weeks', data);
export const publishWeek = (id) => api.put(`/hod/weeks/${id}/publish`);

// Availability
export const getAvailability = (params) => api.get('/hod/availability', { params });
export const getLockStatus = (params) => api.get('/hod/availability/lock-status', { params });
export const lockAvailability = (data) => api.post('/hod/availability/lock', data);
export const unlockAvailability = (data) => api.post('/hod/availability/unlock', data);

// Academic timetable
export const generateTimetable = (data) => api.post('/hod/timetable/generate', data);
export const getTimetables = () => api.get('/hod/timetables');
export const getTimetableByProgram = (ttId, progId) => api.get(`/hod/timetable/${ttId}/program/${progId}`);
export const publishTimetable = (id) => api.put(`/hod/timetable/${id}/publish`);

// Certification timetable
export const generateCertTimetable = (data) => api.post('/hod/cert-timetable/generate', data);

// Announcements
export const createAnnouncement = (data) => api.post('/hod/announcements', data);
export const getAnnouncements = () => api.get('/hod/announcements');
