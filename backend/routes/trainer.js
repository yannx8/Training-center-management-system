// FILE: backend/routes/trainer.js
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const t = require('../controllers/trainerController');

router.use(authenticate, authorize('trainer'));

router.get('/dashboard',         t.getDashboard);
router.get('/courses',           t.getCoursesHandler);
router.get('/certifications',    t.getCertificationsHandler);
router.get('/weeks/published',   t.getPublishedWeeksHandler);

// Availability
router.get('/availability',      t.getAvailabilityHandler);
router.post('/availability',     t.submitAvailabilityHandler);
router.delete('/availability/:weekId', t.clearAvailabilityHandler);

// Timetable (combined academic + cert)
router.get('/timetable',         t.getTimetableHandler);

// Grades
router.get('/grades',            t.getGradesHandler);
router.post('/grades',           t.upsertGradeHandler);

// Complaints
router.get('/complaints',        t.getComplaintsHandler);
router.put('/complaints/:id',    t.respondToComplaintHandler);

// Announcements
router.get('/announcements',     t.getAnnouncementsHandler);

module.exports = router;
