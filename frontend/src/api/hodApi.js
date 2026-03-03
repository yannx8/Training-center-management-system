// FILE: /frontend/src/api/hodApi.js
import api from './axiosInstance';

export const getDashboard = () => api.get('/hod/dashboard');
export const getPrograms = () => api.get('/hod/programs');
export const getAvailability = () => api.get('/hod/availability');
export const getLockStatus = () => api.get('/hod/availability/lock-status');
export const lockAvailability = () => api.post('/hod/availability/lock');
export const unlockAvailability = () => api.post('/hod/availability/unlock');
export const generateTimetable = (data) => api.post('/hod/timetable/generate', data);
export const getTimetables = () => api.get('/hod/timetables');
export const getTimetableByProgram = (timetableId, programId) => api.get(`/hod/timetable/${timetableId}/program/${programId}`);
export const publishTimetable = (id) => api.put(`/hod/timetable/${id}/publish`);