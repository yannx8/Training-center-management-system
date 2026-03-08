// FILE: /frontend/src/api/adminApi.js
import api from './axiosInstance';

export const getDashboard = () => api.get('/admin/dashboard');
export const getUsers = () => api.get('/admin/users');
export const createUser = (data) => api.post('/admin/users', data);
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);
export const getDepartments = () => api.get('/admin/departments');
export const createDepartment = (data) => api.post('/admin/departments', data);
export const updateDepartment = (id, data) => api.put(`/admin/departments/${id}`, data);
export const deleteDepartment = (id) => api.delete(`/admin/departments/${id}`);
export const getPrograms = () => api.get('/admin/programs');
export const createProgram = (data) => api.post('/admin/programs', data);
export const updateProgram = (id, data) => api.put(`/admin/programs/${id}`, data);
export const deleteProgram = (id) => api.delete(`/admin/programs/${id}`);
export const getAcademicYears = () => api.get('/admin/academic-years');
export const createAcademicYear = (data) => api.post('/admin/academic-years', data);
export const updateAcademicYear = (id, data) => api.put(`/admin/academic-years/${id}`, data);
export const getRooms = () => api.get('/admin/rooms');
export const createRoom = (data) => api.post('/admin/rooms', data);
export const updateRoom = (id, data) => api.put(`/admin/rooms/${id}`, data);
export const deleteRoom = (id) => api.delete(`/admin/rooms/${id}`);
export const getComplaints = () => api.get('/admin/complaints');
export const updateComplaint = (id, data) => api.put(`/admin/complaints/${id}`, data);

// Program courses (by semester)
export const getProgramCourses = (programId) => api.get(`/admin/programs/${programId}/courses`);
export const getProgramSessions = (programId) => api.get(`/admin/programs/${programId}/sessions`);
export const createCourse = (data) => api.post('/admin/courses', data);
export const updateCourse = (id, data) => api.put(`/admin/courses/${id}`, data);
export const deleteCourse = (id) => api.delete(`/admin/courses/${id}`);
export const assignTrainer = (courseId, data) => api.put(`/admin/courses/${courseId}/trainer`, data);
export const getTrainersByDept = (deptId) => api.get(`/admin/departments/${deptId}/trainers`);

// Certifications
export const getCertifications = () => api.get('/admin/certifications');
export const createCertification = (data) => api.post('/admin/certifications', data);
export const updateCertification = (id, data) => api.put(`/admin/certifications/${id}`, data);
export const deleteCertification = (id) => api.delete(`/admin/certifications/${id}`);
