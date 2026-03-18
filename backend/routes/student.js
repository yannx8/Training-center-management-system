// FILE: backend/routes/student.js
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const s = require('../controllers/studentController');

router.use(authenticate, authorize('student'));

router.get('/dashboard',              s.getDashboard);
router.get('/timetable',              s.getTimetableHandler);
router.get('/cert-timetable',         s.getCertTimetableHandler);
router.get('/cert-enrollments',       s.getCertEnrollmentsHandler);
router.get('/weeks/published',        s.getPublishedWeeksForCertHandler);
router.get('/cert-availability',      s.getCertAvailabilityHandler);
router.post('/cert-availability',     s.submitCertAvailabilityHandler);
router.get('/grades',                 s.getGradesHandler);
router.get('/complaints',             s.getComplaintsHandler);
router.post('/complaints',            s.createComplaintHandler);
router.get('/announcements',          s.getAnnouncementsHandler);

module.exports = router;
