// FILE: /frontend/src/api/hodApi.js
import api from './axiosInstance';

export const getDashboard = () => api.get('/hod/dashboard');
export const getPrograms = () => api.get('/hod/programs');

// Academic Weeks
export const createAcademicWeek = (data) => api.post('/hod/weeks', data);
export const getAcademicWeeks = () => api.get('/hod/weeks');
export const getActiveWeek = () => api.get('/hod/weeks/active');
export const publishWeek = (id) => api.put(`/hod/weeks/${id}/publish`);

// Availability
export const getAvailability = () => api.get('/hod/availability');
export const getLockStatus = () => api.get('/hod/availability/lock-status');
export const lockAvailability = (weekId) => api.post('/hod/availability/lock', { weekId });
export const unlockAvailability = (weekId) => api.post('/hod/availability/unlock', { weekId });

// Timetable
export const generateTimetable = (data) => api.post('/hod/timetable/generate', data);
export const getTimetables = () => api.get('/hod/timetables');
export const getTimetableByProgram = (timetableId, programId) => api.get(`/hod/timetable/${timetableId}/program/${programId}`);
export const publishTimetable = (id) => api.put(`/hod/timetable/${id}/publish`);