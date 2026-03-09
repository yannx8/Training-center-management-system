// backend/routes/student.js
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const {
    getStudent,
    getProfileHandler,
    getEnrollmentsHandler,
    getTimetableHandler,
    getTimetableWeeksHandler,
    getCertTimetableHandler,
    getCertTimetableWeeksHandler,
    getAllCertWeeksHandler,
    getCertAvailabilityWeeksHandler,
    getCertAvailabilityHandler,
    submitCertAvailabilityHandler,
    deleteCertAvailabilityHandler,
    getGradesHandler,
    getGradePeriodsHandler,
    getMarkComplaintsHandler,
    submitMarkComplaintHandler,
    getAnnouncementsHandler,
} = require('../controllers/studentController');

const auth = [authenticate, requireRole('student'), getStudent];

router.get('/profile', ...auth, getProfileHandler);
router.get('/enrollments', ...auth, getEnrollmentsHandler);

// Academic timetable
router.get('/timetable', ...auth, getTimetableHandler);
router.get('/timetable/weeks', ...auth, getTimetableWeeksHandler);

// Certification timetable (full history — all sessions)
router.get('/cert-timetable', ...auth, getCertTimetableHandler);
router.get('/cert-timetable/weeks', ...auth, getCertTimetableWeeksHandler);
router.get('/cert-weeks/all', ...auth, getAllCertWeeksHandler);

// Cert availability (only latest published week per cert)
router.get('/cert-availability/weeks', ...auth, getCertAvailabilityWeeksHandler);
router.get('/cert-availability', ...auth, getCertAvailabilityHandler);
router.post('/cert-availability', ...auth, submitCertAvailabilityHandler);
router.delete('/cert-availability/:id', ...auth, deleteCertAvailabilityHandler);

// Grades
router.get('/grades', ...auth, getGradesHandler);
router.get('/grades/periods', ...auth, getGradePeriodsHandler);

// Complaints
router.get('/complaints', ...auth, getMarkComplaintsHandler);
router.post('/complaints', ...auth, submitMarkComplaintHandler);

// Announcements
router.get('/announcements', ...auth, getAnnouncementsHandler);

module.exports = router;