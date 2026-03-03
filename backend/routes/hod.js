// FILE: /backend/routes/hod.js
const router = require('express').Router();
const ctrl = require('../controllers/hodController');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const guard = [authenticate, roleCheck('hod')];

router.get('/dashboard', ...guard, ctrl.getDashboard);
router.get('/programs', ...guard, ctrl.getProgramsHandler);
router.get('/availability', ...guard, ctrl.getAvailabilityHandler);
router.get('/availability/lock-status', ...guard, ctrl.getLockStatus);
router.post('/availability/lock', ...guard, ctrl.lockAvailabilityHandler);
router.post('/availability/unlock', ...guard, ctrl.unlockAvailabilityHandler);
router.post('/timetable/generate', ...guard, ctrl.generateTimetable);
router.get('/timetables', ...guard, ctrl.getTimetablesHandler);
router.get('/timetable/:timetableId/program/:programId', ...guard, ctrl.getTimetableByProgramHandler);
router.put('/timetable/:id/publish', ...guard, ctrl.publishTimetableHandler);

module.exports = router;