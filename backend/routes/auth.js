//auth-routes
const router = require('express').Router();
const { login, selectRole, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', login);
router.post('/select-role', selectRole);
router.post('/change-password', authenticate, changePassword);

module.exports = router;