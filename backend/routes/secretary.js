// FILE: backend/routes/secretary.js
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth');
const s = require('../controllers/secretaryController');

router.use(authenticate, authorize('secretary'));

router.get('/dashboard',  s.getDashboard);
router.get('/students',   s.getAllStudentsHandler);
router.post('/students',  s.registerStudentHandler);
router.put('/students/:id', s.updateStudentHandler);
router.get('/programs',   s.getProgramsHandler);
router.get('/certifications', s.getCertificationsHandler);

module.exports = router;
