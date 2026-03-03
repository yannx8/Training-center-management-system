// FILE: /backend/routes/trainer.js
const router = require('express').Router();
const ctrl = require('../controllers/trainerController');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// getTrainer middleware attaches req.trainer to every route in this file
const guard = [authenticate, roleCheck('trainer'), ctrl.getTrainer];

router.get('/courses', ...guard, ctrl.getCoursesHandler);
router.get('/certifications', ...guard, ctrl.getCertificationsHandler);
router.get('/courses/:courseId/students', ...guard, ctrl.getCourseStudentsHandler);
router.get('/certifications/:certId/students', ...guard, ctrl.getCertificationStudentsHandler);
router.post('/grades', ...guard, ctrl.submitGradesHandler);
router.get('/complaints', ...guard, ctrl.getMarkComplaintsHandler);
router.put('/complaints/:id', ...guard, ctrl.reviewMarkComplaintHandler);
router.get('/timetable', ...guard, ctrl.getTimetableHandler);
router.post('/availability', ...guard, ctrl.submitAvailabilityHandler);
router.get('/availability', ...guard, ctrl.getAvailabilityHandler);
router.delete('/availability/:id', ...guard, ctrl.deleteAvailabilityHandler);

module.exports = router;