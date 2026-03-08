// FILE: /backend/routes/trainer.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/trainerController');

// All routes require trainer authentication
router.use(authenticate, authorize('trainer'), ctrl.getTrainer);

// ── Courses & Certifications ──────────────────────────────────────────────────
router.get('/courses', ctrl.getCoursesHandler);
router.get('/certifications', ctrl.getCertificationsHandler);
router.get('/courses/:courseId/students', ctrl.getCourseStudentsHandler);
router.get('/certifications/:certId/students', ctrl.getCertificationStudentsHandler);

// ── Grades ────────────────────────────────────────────────────────────────────
router.post('/grades', ctrl.submitGradesHandler);

// ── Mark Complaints ───────────────────────────────────────────────────────────
router.get('/complaints', ctrl.getMarkComplaintsHandler);
router.put('/complaints/:id/review', ctrl.reviewMarkComplaintHandler);

// ── Trainer Availability (for HOD-published academic weeks) ───────────────────
router.get('/availability/published-weeks', ctrl.getPublishedWeeksForTrainer);
router.get('/availability/active-week', ctrl.getActiveWeekForAvailability);
router.get('/availability', ctrl.getAvailabilityHandler);
router.post('/availability', ctrl.submitAvailabilityHandler);
router.delete('/availability/:id', ctrl.deleteAvailabilityHandler);

// ── Cert Week Management (trainer creates/publishes for their cert) ────────────
// List all weeks for a certification
router.get('/cert-weeks/:certId', ctrl.getCertWeeksHandler);
// Get latest published cert week (for submitting availability)
router.get('/cert-weeks/:certId/latest-published', ctrl.getLatestPublishedCertWeekHandler);
// Create a new cert week
router.post('/cert-weeks', ctrl.createCertWeekHandler);
// Publish a cert week so students can submit availability
router.put('/cert-weeks/:weekId/publish', ctrl.publishCertWeekHandler);

// ── Cert Timetable (trainer generates + views read-only) ──────────────────────
// Generate cert timetable for a cert+week
router.post('/cert-timetable/generate', ctrl.generateCertTimetable);
// List all generated cert timetables (summary)
router.get('/cert-timetables', ctrl.getCertTimetablesHandler);
// Detail slots for a cert+week
router.get('/cert-timetable/:certId/:weekId', ctrl.getCertTimetableSlotsHandler);

// ── Combined Timetable (academic + cert, read-only) ────────────────────────────
router.get('/timetable/weeks', ctrl.getTrainerWeeksHandler);
router.get('/timetable', ctrl.getTimetableHandler);

// ── Announcements ─────────────────────────────────────────────────────────────
router.get('/announcements', ctrl.getAnnouncementsHandler);

module.exports = router;
