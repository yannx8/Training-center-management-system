// FILE: backend/routes/admin.js
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const a = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// Dashboard
router.get('/dashboard', a.getDashboard);

// Users
router.get('/users',        a.getUsers);
router.post('/users',       a.createUserHandler);
router.put('/users/:id',    a.updateUserHandler);
router.delete('/users/:id', a.deleteUserHandler);

// Departments
router.get('/departments',        a.getDepartmentsHandler);
router.post('/departments',       a.createDepartmentHandler);
router.put('/departments/:id',    a.updateDepartmentHandler);
router.delete('/departments/:id', a.deleteDepartmentHandler);
router.get('/departments/:id/trainers', a.getTrainersByDeptHandler);

// Programs
router.get('/programs',        a.getProgramsHandler);
router.post('/programs',       a.createProgramHandler);
router.put('/programs/:id',    a.updateProgramHandler);
router.delete('/programs/:id', a.deleteProgramHandler);

// Program Courses page — full semester/course view with CRUD
router.get('/programs/:id/courses', a.getProgramCoursesHandler);
router.get('/programs/:id/sessions', a.getSessionsForProgramHandler);
router.post('/sessions',       a.createSessionHandler);

// Courses CRUD
router.post('/courses',                  a.createCourseHandler);
router.put('/courses/:id',               a.updateCourseHandler);
router.delete('/courses/:id',            a.deleteCourseHandler);
router.put('/courses/:id/assign-trainer', a.assignTrainerHandler);

// Certifications CRUD
router.get('/certifications',        a.getCertificationsHandler);
router.post('/certifications',       a.createCertificationHandler);
router.put('/certifications/:id',    a.updateCertificationHandler);
router.delete('/certifications/:id', a.deleteCertificationHandler);
router.put('/certifications/:id/assign-trainer', a.assignTrainerToCertHandler);

// Rooms
router.get('/rooms',        a.getRoomsHandler);
router.post('/rooms',       a.createRoomHandler);
router.put('/rooms/:id',    a.updateRoomHandler);
router.delete('/rooms/:id', a.deleteRoomHandler);

// Academic Years
router.get('/academic-years',  a.getAcademicYearsHandler);
router.post('/academic-years', a.createAcademicYearHandler);

// Academic Levels & Semesters (read-only for forms)
router.get('/academic-levels', a.getAcademicLevelsHandler);
router.get('/semesters',       a.getSemestersHandler);

// Complaints
router.get('/complaints',        a.getComplaintsHandler);
router.put('/complaints/:id',    a.updateComplaintHandler);

module.exports = router;
