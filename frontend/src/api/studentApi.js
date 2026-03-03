// FILE: /frontend/src/api/studentApi.js
import api from './axiosInstance';

export const getProfile = () => api.get('/student/profile');
export const getTimetable = (params) => api.get('/student/timetable', { params });
export const getStudentWeeks = () => api.get('/student/timetable/weeks');
export const getGrades = (params) => api.get('/student/grades', { params });
export const getGradePeriods = () => api.get('/student/grades/periods');
export const getAppealCourses = () => api.get('/student/grade-appeal/courses');
export const getCourseDetails = (courseId) => api.get(`/student/grade-appeal/course/${courseId}`);
export const submitMarkComplaint = (data) => api.post('/student/complaints', data);
export const getMarkComplaintsHistory = () => api.get('/student/complaints/history');