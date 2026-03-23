// FILE: backend/routes/trainer.js
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const t = require('../controllers/trainerController');

router.use(authenticate, authorize('trainer'));

router.get('/dashboard', t.getDashboard);
router.get('/courses', t.getCoursesHandler);
router.get('/certifications', t.getCertificationsHandler);

// Cert-specific weeks (trainer creates these, not HOD)
router.get('/cert-weeks', t.getCertWeeksHandler);
router.post('/cert-weeks', t.createCertWeekHandler);
router.put('/cert-weeks/:id/publish', t.publishCertWeekHandler);
router.put('/cert-weeks/:id/unpublish', t.unpublishCertWeekHandler);
router.delete('/cert-weeks/:id', t.deleteCertWeekHandler);

// HOD-published academic weeks (for trainer availability submission)
router.get('/weeks/published', t.getPublishedWeeksHandler);

router.get('/availability', t.getAvailabilityHandler);
router.post('/availability', t.submitAvailabilityHandler);
router.delete('/availability/:weekId', t.clearAvailabilityHandler);

router.get('/students-for-grading', t.getStudentsForGradingHandler);
router.post('/cert-timetable/generate', t.generateCertTimetableHandler);
router.get('/cert-timetable/student-status', t.getCertStudentAvailabilityStatusHandler);
router.get('/timetable', t.getTimetableHandler);
router.get('/grades', t.getGradesHandler);
router.post('/grades', t.upsertGradeHandler);
router.get('/complaints', t.getComplaintsHandler);
router.put('/complaints/:id', t.respondToComplaintHandler);
router.get('/announcements', t.getAnnouncementsHandler);

module.exports = router;