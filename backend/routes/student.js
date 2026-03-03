// FILE: /backend/routes/student.js
const router = require('express').Router();
const ctrl = require('../controllers/studentController');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const guard = [authenticate, roleCheck('student')];

router.get('/profile', ...guard, ctrl.getProfile);
router.get('/timetable', ...guard, ctrl.getTimetable);
router.get('/grades', ...guard, ctrl.getGrades);
router.post('/complaints', ...guard, ctrl.submitMarkComplaint);

module.exports = router;