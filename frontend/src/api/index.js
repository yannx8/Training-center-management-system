// FILE: src/api/index.js
// Centralised API helpers — each function returns the .data from the response.

import api from './axiosInstance';

// ─── AUTH ──────────────────────────────────────────────────────
export const authApi = {
  login:          (body)       => api.post('/auth/login', body).then(r => r.data),
  selectRole:     (body)       => api.post('/auth/select-role', body).then(r => r.data),
  changePassword: (body)       => api.put('/auth/change-password', body).then(r => r.data),
  getMe:          ()           => api.get('/auth/me').then(r => r.data),
};

// ─── ADMIN ─────────────────────────────────────────────────────
export const adminApi = {
  getDashboard:     ()      => api.get('/admin/dashboard').then(r => r.data),
  // Users
  getUsers:         ()      => api.get('/admin/users').then(r => r.data),
  createUser:       (body)  => api.post('/admin/users', body).then(r => r.data),
  updateUser:       (id, b) => api.put(`/admin/users/${id}`, b).then(r => r.data),
  deleteUser:       (id)    => api.delete(`/admin/users/${id}`).then(r => r.data),
  // Departments
  getDepartments:   ()      => api.get('/admin/departments').then(r => r.data),
  createDepartment: (body)  => api.post('/admin/departments', body).then(r => r.data),
  updateDepartment: (id, b) => api.put(`/admin/departments/${id}`, b).then(r => r.data),
  deleteDepartment: (id)    => api.delete(`/admin/departments/${id}`).then(r => r.data),
  getDeptTrainers:  (id)    => api.get(`/admin/departments/${id}/trainers`).then(r => r.data),
  // Programs
  getPrograms:      ()      => api.get('/admin/programs').then(r => r.data),
  createProgram:    (body)  => api.post('/admin/programs', body).then(r => r.data),
  updateProgram:    (id, b) => api.put(`/admin/programs/${id}`, b).then(r => r.data),
  deleteProgram:    (id)    => api.delete(`/admin/programs/${id}`).then(r => r.data),
  // Program Courses page
  getProgramCourses:  (id)    => api.get(`/admin/programs/${id}/courses`).then(r => r.data),
  getProgramSessions: (id)    => api.get(`/admin/programs/${id}/sessions`).then(r => r.data),
  createSession:      (body)  => api.post('/admin/sessions', body).then(r => r.data),
  createCourse:       (body)  => api.post('/admin/courses', body).then(r => r.data),
  updateCourse:       (id, b) => api.put(`/admin/courses/${id}`, b).then(r => r.data),
  deleteCourse:       (id)    => api.delete(`/admin/courses/${id}`).then(r => r.data),
  assignTrainer:      (id, b) => api.put(`/admin/courses/${id}/assign-trainer`, b).then(r => r.data),
  // Certifications
  getCertifications:       ()      => api.get('/admin/certifications').then(r => r.data),
  createCertification:     (body)  => api.post('/admin/certifications', body).then(r => r.data),
  updateCertification:     (id, b) => api.put(`/admin/certifications/${id}`, b).then(r => r.data),
  deleteCertification:     (id)    => api.delete(`/admin/certifications/${id}`).then(r => r.data),
  assignTrainerToCert:     (id, b) => api.put(`/admin/certifications/${id}/assign-trainer`, b).then(r => r.data),
  // Rooms
  getRooms:         ()      => api.get('/admin/rooms').then(r => r.data),
  createRoom:       (body)  => api.post('/admin/rooms', body).then(r => r.data),
  updateRoom:       (id, b) => api.put(`/admin/rooms/${id}`, b).then(r => r.data),
  deleteRoom:       (id)    => api.delete(`/admin/rooms/${id}`).then(r => r.data),
  // Academic Years
  getAcademicYears:  ()     => api.get('/admin/academic-years').then(r => r.data),
  createAcademicYear:(body) => api.post('/admin/academic-years', body).then(r => r.data),
  // Misc
  getAcademicLevels: ()     => api.get('/admin/academic-levels').then(r => r.data),
  getSemesters:      ()     => api.get('/admin/semesters').then(r => r.data),
  // Complaints
  getComplaints:     ()      => api.get('/admin/complaints').then(r => r.data),
  updateComplaint:   (id, b) => api.put(`/admin/complaints/${id}`, b).then(r => r.data),
};

// ─── HOD ───────────────────────────────────────────────────────
export const hodApi = {
  getDashboard:     ()      => api.get('/hod/dashboard').then(r => r.data),
  getPrograms:      ()      => api.get('/hod/programs').then(r => r.data),
  // Weeks
  getWeeks:         ()      => api.get('/hod/weeks').then(r => r.data),
  createWeek:       (body)  => api.post('/hod/weeks', body).then(r => r.data),
  getPublishedWeeks:()      => api.get('/hod/weeks/published').then(r => r.data),
  publishWeek:      (id)    => api.put(`/hod/weeks/${id}/publish`).then(r => r.data),
  unpublishWeek:    (id)    => api.put(`/hod/weeks/${id}/unpublish`).then(r => r.data),
  deleteWeek:       (id)    => api.delete(`/hod/weeks/${id}`).then(r => r.data),
  // Availability
  getAvailability:  (p)     => api.get('/hod/availability', { params: p }).then(r => r.data),
  getLockStatus:    (weekId)=> api.get('/hod/availability/lock', { params: { weekId } }).then(r => r.data),
  lockAvailability: (body)  => api.post('/hod/availability/lock', body).then(r => r.data),
  unlockAvailability:(body) => api.post('/hod/availability/unlock', body).then(r => r.data),
  // Timetable
  generateTimetable: (body) => api.post('/hod/timetable/generate', body).then(r => r.data),
  generateCertTimetable:(body)=> api.post('/hod/cert-timetable/generate', body).then(r => r.data),
  getTimetables:    ()      => api.get('/hod/timetables').then(r => r.data),
  publishTimetable: (id)    => api.put(`/hod/timetables/${id}/publish`).then(r => r.data),
  // Announcements
  getAnnouncements: ()      => api.get('/hod/announcements').then(r => r.data),
  createAnnouncement:(body) => api.post('/hod/announcements', body).then(r => r.data),
  deleteAnnouncement:(id)   => api.delete(`/hod/announcements/${id}`).then(r => r.data),
};

// ─── TRAINER ───────────────────────────────────────────────────
export const trainerApi = {
  getDashboard:       ()      => api.get('/trainer/dashboard').then(r => r.data),
  getCourses:         ()      => api.get('/trainer/courses').then(r => r.data),
  getCertifications:  ()      => api.get('/trainer/certifications').then(r => r.data),
  getPublishedWeeks:  ()      => api.get('/trainer/weeks/published').then(r => r.data),
  getAvailability:    (p)     => api.get('/trainer/availability', { params: p }).then(r => r.data),
  submitAvailability: (body)  => api.post('/trainer/availability', body).then(r => r.data),
  clearAvailability:  (weekId)=> api.delete(`/trainer/availability/${weekId}`).then(r => r.data),
  getTimetable:       (p)     => api.get('/trainer/timetable', { params: p }).then(r => r.data),
  getGrades:          ()      => api.get('/trainer/grades').then(r => r.data),
  upsertGrade:        (body)  => api.post('/trainer/grades', body).then(r => r.data),
  getComplaints:      ()      => api.get('/trainer/complaints').then(r => r.data),
  respondComplaint:   (id, b) => api.put(`/trainer/complaints/${id}`, b).then(r => r.data),
  getAnnouncements:   ()      => api.get('/trainer/announcements').then(r => r.data),
};

// ─── STUDENT ───────────────────────────────────────────────────
export const studentApi = {
  getDashboard:           ()      => api.get('/student/dashboard').then(r => r.data),
  getTimetable:           (p)     => api.get('/student/timetable', { params: p }).then(r => r.data),
  getCertTimetable:       (p)     => api.get('/student/cert-timetable', { params: p }).then(r => r.data),
  getCertEnrollments:     ()      => api.get('/student/cert-enrollments').then(r => r.data),
  getPublishedWeeks:      ()      => api.get('/student/weeks/published').then(r => r.data),
  getCertAvailability:    (p)     => api.get('/student/cert-availability', { params: p }).then(r => r.data),
  submitCertAvailability: (body)  => api.post('/student/cert-availability', body).then(r => r.data),
  getGrades:              ()      => api.get('/student/grades').then(r => r.data),
  getComplaints:          ()      => api.get('/student/complaints').then(r => r.data),
  createComplaint:        (body)  => api.post('/student/complaints', body).then(r => r.data),
  getAnnouncements:       ()      => api.get('/student/announcements').then(r => r.data),
};

// ─── PARENT ────────────────────────────────────────────────────
export const parentApi = {
  getDashboard:     ()          => api.get('/parent/dashboard').then(r => r.data),
  getChildren:      ()          => api.get('/parent/children').then(r => r.data),
  getChildTimetable:(childId, p)=> api.get(`/parent/children/${childId}/timetable`, { params: p }).then(r => r.data),
  getChildGrades:   (childId)   => api.get(`/parent/children/${childId}/grades`).then(r => r.data),
  getComplaints:    ()          => api.get('/parent/complaints').then(r => r.data),
  createComplaint:  (body)      => api.post('/parent/complaints', body).then(r => r.data),
  getAnnouncements: ()          => api.get('/parent/announcements').then(r => r.data),
};

// ─── SECRETARY ─────────────────────────────────────────────────
export const secretaryApi = {
  getDashboard:      ()      => api.get('/secretary/dashboard').then(r => r.data),
  getStudents:       ()      => api.get('/secretary/students').then(r => r.data),
  registerStudent:   (body)  => api.post('/secretary/students', body).then(r => r.data),
  updateStudent:     (id, b) => api.put(`/secretary/students/${id}`, b).then(r => r.data),
  getPrograms:       ()      => api.get('/secretary/programs').then(r => r.data),
  getCertifications: ()      => api.get('/secretary/certifications').then(r => r.data),
};
