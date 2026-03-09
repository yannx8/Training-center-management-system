// backend/routes/trainer.js
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const {
    getTrainer,
    getCoursesHandler,
    getCertificationsHandler,
    getCourseStudentsHandler,
    getCertificationStudentsHandler,
    submitGradesHandler,
    getMarkComplaintsHandler,
    reviewMarkComplaintHandler,
    getActiveWeekForAvailability,
    getPublishedWeeksForTrainer,
    submitAvailabilityHandler,
    getAvailabilityHandler,
    deleteAvailabilityHandler,
    getCertWeeksHandler,
    createCertWeekHandler,
    publishCertWeekHandler,
    getLatestPublishedCertWeekHandler,
    generateCertTimetable,
    getCertTimetablesHandler,
    getCertTimetableSlotsHandler,
    getTimetableHandler,
    getTrainerWeeksHandler,
    getAnnouncementsHandler,
} = require('../controllers/trainerController');

const auth = [authenticate, requireRole('trainer'), getTrainer];

// Courses & certifications
router.get('/courses', ...auth, getCoursesHandler);
router.get('/certifications', ...auth, getCertificationsHandler);
router.get('/courses/:courseId/students', ...auth, getCourseStudentsHandler);
router.get('/certifications/:certId/students', ...auth, getCertificationStudentsHandler);

// Grades
router.post('/grades', ...auth, submitGradesHandler);

// Complaints
router.get('/complaints', ...auth, getMarkComplaintsHandler);
router.put('/complaints/:id/review', ...auth, reviewMarkComplaintHandler);

// Trainer availability (for HOD-published academic weeks)
router.get('/availability/active-week', ...auth, getActiveWeekForAvailability);
router.get('/availability/published-weeks', ...auth, getPublishedWeeksForTrainer);
router.get('/availability', ...auth, getAvailabilityHandler);
router.post('/availability', ...auth, submitAvailabilityHandler);
router.delete('/availability/:id', ...auth, deleteAvailabilityHandler);

// Certification week management (trainer creates + publishes)
router.get('/cert-weeks/:certId', ...auth, getCertWeeksHandler);
router.get('/cert-weeks/:certId/latest-published', ...auth, getLatestPublishedCertWeekHandler);
router.post('/cert-weeks', ...auth, createCertWeekHandler);
router.put('/cert-weeks/:weekId/publish', ...auth, publishCertWeekHandler);

// Certification timetable (trainer generates + views read-only)
router.post('/cert-timetable/generate', ...auth, generateCertTimetable);
router.get('/cert-timetables', ...auth, getCertTimetablesHandler);
router.get('/cert-timetable/:certId/:weekId', ...auth, getCertTimetableSlotsHandler);

// Combined timetable (read-only)
router.get('/timetable', ...auth, getTimetableHandler);
router.get('/timetable/weeks', ...auth, getTrainerWeeksHandler);

// Announcements
router.get('/announcements', ...auth, getAnnouncementsHandler);

module.exports = router;