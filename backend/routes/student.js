// FILE: /backend/routes/student.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/studentController');

router.use(authenticate, authorize('student'), ctrl.getStudent);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', ctrl.getDashboard);
router.get('/enrollments', ctrl.getEnrollmentsHandler);

// ── Academic Timetable ────────────────────────────────────────────────────────
router.get('/timetable/weeks', ctrl.getTimetableWeeksHandler);
router.get('/timetable', ctrl.getTimetableHandler);

// ── Certification Timetable ───────────────────────────────────────────────────
router.get('/cert-timetable/weeks', ctrl.getCertTimetableWeeksHandler);
router.get('/cert-timetable', ctrl.getCertTimetableHandler);

// ── Certification Availability ────────────────────────────────────────────────
// Get the latest published cert week per cert (what to submit availability for)
router.get('/cert-availability/weeks', ctrl.getCertAvailabilityWeeks);
// Get/submit/delete availability slots for a cert week
router.get('/cert-availability', ctrl.getCertAvailabilityHandler);
router.post('/cert-availability', ctrl.submitCertAvailabilityHandler);
router.delete('/cert-availability/:id', ctrl.deleteCertAvailabilityHandler);

// ── Grades ────────────────────────────────────────────────────────────────────
router.get('/grades/periods', ctrl.getGradePeriodsHandler);
router.get('/grades', ctrl.getGradesHandler);
router.get('/courses', ctrl.getCoursesWithGradesHandler);

// ── Mark Complaints ───────────────────────────────────────────────────────────
router.get('/complaints', ctrl.getMarkComplaintsHandler);
router.post('/complaints', ctrl.submitMarkComplaintHandler);

// ── Announcements ─────────────────────────────────────────────────────────────
router.get('/announcements', ctrl.getAnnouncementsHandler);

module.exports = router;
