import api from './axiosInstance';

export const getMyStudents = () => api.get('/parent/students');
export const getStudentProfile = (id) => api.get(`/parent/students/${id}/profile`);
export const getStudentGrades = (id) => api.get(`/parent/students/${id}/grades`);
export const getStudentTimetable = (id, weekId) =>
    api.get(`/parent/students/${id}/timetable`, weekId ? { params: { weekId } } : undefined);
export const getStudentWeeks = (id) => api.get(`/parent/students/${id}/weeks`);
export const submitComplaint = (data) => api.post('/parent/complaints', data);