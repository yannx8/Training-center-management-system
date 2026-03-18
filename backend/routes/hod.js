// FILE: backend/routes/hod.js
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const h = require('../controllers/hodController');

router.use(authenticate, authorize('hod'));

router.get('/dashboard',           h.getDashboard);
router.get('/programs',            h.getProgramsHandler);

// Academic weeks
router.get('/weeks',               h.getAcademicWeeksHandler);
router.post('/weeks',              h.createAcademicWeekHandler);
router.get('/weeks/published',     h.getPublishedWeeksHandler);
router.put('/weeks/:id/publish',   h.publishWeekHandler);
router.put('/weeks/:id/unpublish', h.unpublishWeekHandler);
router.delete('/weeks/:id',        h.deleteWeekHandler);

// Trainer availability
router.get('/availability',        h.getAvailabilityHandler);
router.get('/availability/lock',   h.getLockStatus);
router.post('/availability/lock',  h.lockAvailabilityHandler);
router.post('/availability/unlock',h.unlockAvailabilityHandler);

// Timetable generation
router.post('/timetable/generate',      h.generateTimetable);
router.post('/cert-timetable/generate', h.generateCertTimetable);
router.get('/timetables',               h.getTimetablesHandler);
router.put('/timetables/:id/publish',   h.publishTimetableHandler);

// Announcements
router.get('/announcements',        h.getAnnouncementsHandler);
router.post('/announcements',       h.createAnnouncementHandler);
router.delete('/announcements/:id', h.deleteAnnouncementHandler);

module.exports = router;
