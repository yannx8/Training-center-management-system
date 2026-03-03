// FILE: /frontend/src/api/hodApi.js
import api from './axiosInstance';

export const getAvailability = () => api.get('/hod/availability');
export const getLockStatus = () => api.get('/hod/availability/lock-status');
export const lockAvailability = () => api.post('/hod/availability/lock');
export const unlockAvailability = () => api.post('/hod/availability/unlock');
export const generateTimetable = (data) => api.post('/hod/timetable/generate', data);
export const getTimetable = () => api.get('/hod/timetable');
export const publishTimetable = (id) => api.put(`/hod/timetable/${id}/publish`);