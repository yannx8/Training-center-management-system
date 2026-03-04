// FILE: /backend/routes/parent.js
const router = require('express').Router();
const ctrl = require('../controllers/parentController');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const guard = [authenticate, roleCheck('parent')];

router.get('/students', ...guard, ctrl.getMyStudents);
router.get('/students/:id/profile', ...guard, ctrl.getStudentProfile);
router.get('/students/:id/grades', ...guard, ctrl.getStudentGrades);
router.get('/students/:id/timetable', ...guard, ctrl.getStudentTimetableHandler);
router.get('/students/:id/weeks', ...guard, ctrl.getStudentWeeks);
router.post('/complaints', ...guard, ctrl.submitComplaint);

module.exports = router;