// FILE: backend/routes/parent.js
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const p = require('../controllers/parentController');

router.use(authenticate, authorize('parent'));

router.get('/dashboard',                    p.getDashboard);
router.get('/children',                     p.getChildrenHandler);
router.get('/children/:childId/timetable',  p.getChildTimetableHandler);
router.get('/children/:childId/grades',     p.getChildGradesHandler);
router.get('/complaints',                   p.getComplaintsHandler);
router.post('/complaints',                  p.createComplaintHandler);
router.get('/announcements',                p.getAnnouncementsHandler);

module.exports = router;

// ─────────────────────────────────────────────────────────────────
// FILE: backend/routes/secretary.js
// ─────────────────────────────────────────────────────────────────
