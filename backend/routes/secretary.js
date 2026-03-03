// FILE: /backend/routes/secretary.js
const router = require('express').Router();
const ctrl = require('../controllers/secretaryController');
const { authenticate } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const guard = [authenticate, roleCheck('secretary')];

router.post('/register-student', ...guard, ctrl.registerStudent);
router.get('/students', ...guard, ctrl.getStudentsHandler);
router.get('/parents', ...guard, ctrl.getParentsHandler);
router.get('/programs', ...guard, ctrl.getProgramsForSecretary);
router.get('/certifications', ...guard, ctrl.getCertificationsForSecretary);

module.exports = router;