const router = require('express').Router();
const ctrl = require('../controllers/studentController');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const guard = [authenticate, roleCheck('student')];

router.get('/profile', ...guard, ctrl.getProfile);
router.get('/timetable', ...guard, ctrl.getTimetable);
router.get('/timetable/weeks', ...guard, ctrl.getStudentWeeksHandler);
router.get('/grades', ...guard, ctrl.getGrades);
router.get('/grades/periods', ...guard, ctrl.getGradePeriodsHandler);
router.get('/grade-appeal/courses', ...guard, ctrl.getAppealCoursesHandler);
router.get('/grade-appeal/course/:courseId', ...guard, ctrl.getCourseDetailsHandler);
router.post('/complaints', ...guard, ctrl.submitMarkComplaint);
router.get('/complaints/history', ...guard, ctrl.getMarkComplaintsHistory);

module.exports = router;