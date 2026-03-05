const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const guard = [authenticate, roleCheck('admin')];

router.get('/dashboard', ...guard, ctrl.getDashboard);
router.get('/users', ...guard, ctrl.getUsers);
router.post('/users', ...guard, ctrl.createUserHandler);
router.put('/users/:id', ...guard, ctrl.updateUserHandler);
router.delete('/users/:id', ...guard, ctrl.deleteUserHandler);
router.get('/departments', ...guard, ctrl.getDepartmentsHandler);
router.post('/departments', ...guard, ctrl.createDepartmentHandler);
router.put('/departments/:id', ...guard, ctrl.updateDepartmentHandler);
router.delete('/departments/:id', ...guard, ctrl.deleteDepartmentHandler);
router.get('/programs', ...guard, ctrl.getProgramsHandler);
router.post('/programs', ...guard, ctrl.createProgramHandler);
router.put('/programs/:id', ...guard, ctrl.updateProgramHandler);
router.delete('/programs/:id', ...guard, ctrl.deleteProgramHandler);


router.get('/programs/:id/courses', ...guard, ctrl.getProgramCoursesHandler);

router.get('/academic-years', ...guard, ctrl.getAcademicYearsHandler);
router.post('/academic-years', ...guard, ctrl.createAcademicYearHandler);
router.put('/academic-years/:id', ...guard, ctrl.updateAcademicYearHandler);
router.get('/rooms', ...guard, ctrl.getRoomsHandler);
router.post('/rooms', ...guard, ctrl.createRoomHandler);
router.put('/rooms/:id', ...guard, ctrl.updateRoomHandler);
router.delete('/rooms/:id', ...guard, ctrl.deleteRoomHandler);
router.get('/complaints', ...guard, ctrl.getComplaintsHandler);
router.put('/complaints/:id', ...guard, ctrl.updateComplaintHandler);

module.exports = router;